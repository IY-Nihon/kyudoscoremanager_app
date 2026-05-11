/**
 * Module ID: AttendanceScreen
 */
"use strict";

const _e = exports;

Object.defineProperty(_e, '__esModule', { value: true });
Object.defineProperty(_e, "AttendanceScreen", { enumerable: true, get: function() { return AttendanceScreen; } });

var t = require("react");
var o = require("react-native");
var m = require("./AntDesign_600");
var b = require("./JP_useScoreStore_174");
var x = require("./IS_WEB_199");
var F = require("./module_592");
var j = require("./module_427");
var db = require("./db_178");
var firestore = require("./module_188");
var docPicker = require("expo-document-picker");
var fs = require("expo-file-system");

const AttendanceScreen = () => {
  const { members, sessions, activeGroupId } = (0, b.useScoreStore)();
  
  const [tab, setTab] = (0, t.useState)('stats');
  const [rangeType, setRangeType] = (0, t.useState)('month');
  const [practiceDays, setPracticeDays] = (0, t.useState)({});
  const [loading, setLoading] = (0, t.useState)(false);
  const [loadingMsg, setLoadingMsg] = (0, t.useState)(null);
  const [selectedMember, setSelectedMember] = (0, t.useState)(null);
  const [aiPreviewItems, setAiPreviewItems] = (0, t.useState)(null);

  const now = t.useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = (0, t.useState)(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = (0, t.useState)(now.getMonth() + 1);

  const currentFiscalYear = selectedMonth >= 4 ? selectedYear : selectedYear - 1;

  const getLocalDateString = (dateInput) => {
    if (!dateInput) return null;
    let d;
    if (dateInput && typeof dateInput.toDate === 'function') {
      d = dateInput.toDate();
    } else if (dateInput && dateInput.seconds !== undefined) {
      d = new Date(dateInput.seconds * 1000);
    } else {
      d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const changeMonth = (offset) => {
    let newMonth = selectedMonth + offset;
    let newYear = selectedYear;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    else if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const changeYear = (offset) => { setSelectedYear(prev => prev + offset); };

  (0, t.useEffect)(() => {
    if (!activeGroupId) return;
    const q = (0, firestore.collection)(db.db, `groups/${activeGroupId}/officialPracticeDays`);
    const unsubscribe = (0, firestore.onSnapshot)(q, (snap) => {
      const days = {};
      snap.forEach(doc => { days[doc.id] = doc.data(); });
      setPracticeDays(days);
    });
    return () => unsubscribe();
  }, [activeGroupId]);

  const monthPracticeDays = t.useMemo(() => {
    return Object.keys(practiceDays).filter(d => {
      const parts = d.split('-');
      return parseInt(parts[0]) === selectedYear && parseInt(parts[1]) === selectedMonth;
    });
  }, [practiceDays, selectedYear, selectedMonth]);

  const togglePracticeDay = async (dateStr) => {
    if (!activeGroupId) return;
    const isSet = practiceDays[dateStr];
    const docRef = (0, firestore.doc)(db.db, `groups/${activeGroupId}/officialPracticeDays`, dateStr);
    try {
      if (isSet) await (0, firestore.deleteDoc)(docRef);
      else await (0, firestore.setDoc)(docRef, { date: dateStr, created: Date.now() });
    } catch (e) { console.error(e); }
  };

  const getAttendanceStatus = (dateStr, memberId) => {
    const daySessions = sessions.filter(s => getLocalDateString(s?.date) === dateStr);
    const isFuture = dateStr > getLocalDateString(new Date());

    if (daySessions.length === 0) {
      if (practiceDays[dateStr]) return isFuture ? "none" : "absent";
      return "none";
    }
    
    let status = "none";
    for (const s of daySessions) {
      const hasRecord = s.archers?.some(a => String(a.memberId) === String(memberId));
      if (hasRecord) return 'present';

      const explicit = s.attendance?.[memberId];
      if (explicit && explicit !== 'none') {
        if (explicit !== 'present' || status === 'none') status = explicit;
      }
    }
    
    if (status === 'none' && practiceDays[dateStr]) return isFuture ? "none" : "absent";
    return status;
  };


  const filteredPracticeDays = Object.keys(practiceDays).filter(dStr => {
    const d = new Date(dStr);
    if (tab === 'days' || rangeType === 'month') return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    if (rangeType === 'year') {
      const y = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
      return y === currentFiscalYear;
    }
    return true;
  }).sort((a, b) => b.localeCompare(a));

  const todayStr = getLocalDateString(new Date());
  const pastPracticeDays = filteredPracticeDays.filter(d => d <= todayStr);

  const stats = members.map(m => {
    let presentCount = 0; let lateCount = 0; let earlyCount = 0; let absentCount = 0;
    filteredPracticeDays.forEach(dStr => {
      const status = getAttendanceStatus(dStr, m.id);
      if (status === 'present') presentCount++;
      else if (status === 'late') { presentCount++; lateCount++; }
      else if (status === 'early') { presentCount++; earlyCount++; }
      else if (status === 'absent') absentCount++;
    });
    const totalOfficial = pastPracticeDays.length;
    const rate = totalOfficial > 0 ? (presentCount / totalOfficial) * 100 : 0;
    return { ...m, rate, presentCount, lateCount, earlyCount, absentCount };
  }).sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    if (a.grade !== b.grade) return a.grade - b.grade;
    if (a.gender !== b.gender) return a.gender === '男子' ? -1 : 1;
    return a.name.localeCompare(b.name, 'ja');
  });


  const sessionCountForRange = sessions.filter(s => {
    const dStr = getLocalDateString(s?.date);
    if (!dStr) return false;
    const d = new Date(dStr);
    if (rangeType === 'month') {
      return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    } else if (rangeType === 'year') {
      const fy = (d.getMonth() + 1) >= 4 ? d.getFullYear() : d.getFullYear() - 1;
      return fy === currentFiscalYear;
    }
    return true;
  }).length;

  const rangeLabel = rangeType === 'month' ? `${selectedYear}年${selectedMonth}月` : rangeType === 'year' ? `${currentFiscalYear}年度` : '全期間';


  const normalizeDate = (dStr) => {
    if (!dStr) return null;
    const parts = dStr.split('-');
    if (parts.length !== 3) return null;
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  };

  const handlePickPDF = async () => {
    try {
      const res = await docPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (res.canceled) return;
      const asset = res.assets[0];
      
      setLoading(true);
      setLoadingMsg("予定表を読み込み中...");
      
      let base64 = "";
      if (x.IS_WEB) {
        const fileData = asset.file || (await fetch(asset.uri).then(r => r.blob()));
        
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result.split(',')[1];
            resolve(result);
          };
          reader.onerror = (err) => {
            reject(err);
          };
          reader.readAsDataURL(fileData);
        });
      } else {
        base64 = await fs.readAsStringAsync(asset.uri, { encoding: fs.EncodingType.Base64 });
      }

      const apiKey = (x.GEMINI_API_KEY || "").trim();
      if (!apiKey) {
        throw new Error("Gemini APIキーが設定されていません。");
      }

      let selectedModel = "models/gemini-1.5-flash"; // デフォルト
      
      // 使用可能なモデルを確認
      try {
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();
        
        if (listData.models && listData.models.length > 0) {
          const modelNames = listData.models.map(m => m.name);
          const m15 = modelNames.find(n => n.includes("gemini-1.5-flash"));
          const mLatest = modelNames.find(n => n.includes("flash-latest"));
          const anyFlash = modelNames.find(n => n.includes("flash") && !n.includes("2.5"));
          
          selectedModel = m15 || mLatest || anyFlash || selectedModel;
        }
      } catch (e) { }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`;
      
      const aiResponse = await fetch(apiUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          contents: [{ parts: [{ text: `添付されたPDFから練習日を抽出し、以下の純粋なJSON形式のみで回答してください。解説は不要です。\n現在は${selectedYear}年${selectedMonth}月付近の予定を解析しています。PDFに年や月の記載が不十分な場合は、この年月を基準にして補完してください。\n[{"date":"YYYY-MM-DD", "reason":"練習"}]` }, { inline_data: { mime_type: "application/pdf", data: base64 } }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        if (aiResponse.status === 429) {
          alert("APIリクエスト回数の上限に達しました。1分ほど待ってから再度お試しください。");
        } else if (aiResponse.status === 503) {
          alert("AI解析サーバーが混み合っています。少し待ってから再度お試しください。");
        } else {
          alert(`AI解析エラー (${aiResponse.status}): APIの設定を確認してください。`);
        }
        throw new Error(`AI解析失敗(Status: ${aiResponse.status})`);
      }

      const data = await aiResponse.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // JSON部分を抽出
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) text = jsonMatch[0];

      if (!text || text.trim() === "") {
        throw new Error("AIからの応答内容が空、またはJSON形式ではありませんでした。");
      }

      let items = JSON.parse(text);
      const validatedItems = (Array.isArray(items) ? items : []).map(i => ({ date: normalizeDate(i.date), reason: i.reason })).filter(i => !!i.date);
      
      if (validatedItems.length > 0) {
        setAiPreviewItems(validatedItems);
      } else {
        o.Alert.alert("通知", "PDFから練習日を検出できませんでした。形式を確認してください。");
        if (typeof window !== 'undefined' && window.alert) window.alert("練習日が検出されませんでした。");
      }
    } catch (e) { 
      o.Alert.alert("エラー", e.message); 
    }
    finally { 
      setLoading(false); 
      setLoadingMsg(null); 
    }
  };

  const saveAiDates = async () => {
    if (!aiPreviewItems || !activeGroupId) return;
    setLoading(true);
    try {
      for (const item of aiPreviewItems) {
        await (0, firestore.setDoc)((0, firestore.doc)(db.db, `groups/${activeGroupId}/officialPracticeDays`, item.date), { date: item.date, created: Date.now() });
      }
      setAiPreviewItems(null);
    } catch (e) {}
    finally { setLoading(false); }
  };

  return (0, j.jsxs)(o.View, {
    style: styles.container,
    children: [
      (0, j.jsxs)(o.View, { style: styles.header, children: [
        (0, j.jsx)(o.Text, { style: styles.title, children: "出欠管理" }),
        (0, j.jsxs)(o.View, { style: styles.tabRow, children: [(0, j.jsx)(o.TouchableOpacity, { style: [styles.tab, tab === 'stats' && styles.tabActive], onPress: () => setTab('stats'), children: (0, j.jsx)(o.Text, { style: [styles.tabText, tab === 'stats' && styles.tabTextActive], children: "出席統計" }) }), (0, j.jsx)(o.TouchableOpacity, { style: [styles.tab, tab === 'days' && styles.tabActive], onPress: () => setTab('days'), children: (0, j.jsx)(o.Text, { style: [styles.tabText, tab === 'days' && styles.tabTextActive], children: "練習日設定" }) })] })
      ] }),
      tab === 'stats' && (0, j.jsxs)(o.View, { style: styles.rangeSelector, children: [(0, j.jsx)(o.TouchableOpacity, { style: [styles.rangeBtn, rangeType === 'month' && styles.rangeBtnActive], onPress: () => setRangeType('month'), children: (0, j.jsx)(o.Text, { style: [styles.rangeBtnText, rangeType === 'month' && styles.rangeBtnTextActive], children: "月間" }) }), (0, j.jsx)(o.TouchableOpacity, { style: [styles.rangeBtn, rangeType === 'year' && styles.rangeBtnActive], onPress: () => setRangeType('year'), children: (0, j.jsx)(o.Text, { style: [styles.rangeBtnText, rangeType === 'year' && styles.rangeBtnTextActive], children: "年度" }) }), (0, j.jsx)(o.TouchableOpacity, { style: [styles.rangeBtn, rangeType === 'all' && styles.rangeBtnActive], onPress: () => setRangeType('all'), children: (0, j.jsx)(o.Text, { style: [styles.rangeBtnText, rangeType === 'all' && styles.rangeBtnTextActive], children: "すべて" }) })] }),
      (tab === 'days' || rangeType !== 'all') && (0, j.jsxs)(o.View, { style: styles.monthNav, children: [(0, j.jsx)(o.TouchableOpacity, { onPress: () => (tab === 'days' || rangeType === 'month') ? changeMonth(-1) : changeYear(-1), children: (0, j.jsx)(m.Ionicons, { name: "chevron-back", size: 24, color: "#007AFF" }) }), (0, j.jsxs)(o.Text, { style: styles.monthText, children: (tab === 'days' || rangeType === 'month') ? [`${selectedYear}年 ${selectedMonth}月`] : [`${currentFiscalYear}年度`] }), (0, j.jsx)(o.TouchableOpacity, { onPress: () => (tab === 'days' || rangeType === 'month') ? changeMonth(1) : changeYear(1), children: (0, j.jsx)(m.Ionicons, { name: "chevron-forward", size: 24, color: "#007AFF" }) })] }),
      tab === 'stats' ? (
        (0, j.jsxs)(o.View, { style: { flex: 1 }, children: [
          (0, j.jsx)(o.FlatList, {
            data: stats, keyExtractor: i => i.id, contentContainerStyle: styles.listContent,
            renderItem: ({ item: s }) => (0, j.jsxs)(o.TouchableOpacity, {
              style: styles.memberCard, onPress: () => setSelectedMember(s),
              children: [
                (0, j.jsxs)(o.View, { style: styles.memberInfoMain, children: [(0, j.jsxs)(o.View, { style: styles.nameRow, children: [(0, j.jsx)(o.Text, { style: [styles.genderDot, { color: s.gender === '男子' ? '#007AFF' : s.gender === '女子' ? '#FF2D55' : '#8E8E93' }], children: "●" }), (0, j.jsx)(o.Text, { style: styles.memberName, children: s.name })] }), (0, j.jsxs)(o.Text, { style: styles.memberSub, children: [`${s.termKi ? s.termKi + '期 / ' : ''}${s.gender} / ${s.grade > 0 ? s.grade + '年' : '卒業生'}`] })] }),
                (0, j.jsxs)(o.View, { style: styles.statInfo, children: [(0, j.jsxs)(o.Text, { style: styles.rateText, children: [s.rate.toFixed(1), "%"] }), (0, j.jsxs)(o.Text, { style: styles.countsText, children: [s.presentCount, "/", filteredPracticeDays.length] })] }),
                (0, j.jsx)(m.Ionicons, { name: "chevron-forward", size: 16, color: "#C7C7CC", style: { marginLeft: 8 } })
              ]
            })
          })
        ]})
      ) : (
        (0, j.jsxs)(o.ScrollView, {
          style: styles.scroll,
          children: [
            (0, j.jsxs)(o.View, { style: styles.aiSection, children: [
              (0, j.jsxs)(o.View, { style: styles.aiTextContainer, children: [
                (0, j.jsx)(o.Text, { style: styles.aiTitle, children: "PDFから予定を自動入力" }),
                (0, j.jsx)(o.Text, { style: styles.aiDescription, children: "練習予定表を選択して解析します。" })
              ] }),
              (0, j.jsx)(o.TouchableOpacity, { 
                style: styles.aiActionBtn, 
                onPress: () => {
                  handlePickPDF();
                }, 
                children: (0, j.jsx)(o.Text, { style: styles.aiActionBtnText, children: "ファイルを選択" }) 
              })
            ] }),
            aiPreviewItems && (0, j.jsxs)(o.View, { style: [styles.aiSection, { backgroundColor: '#F0F0FF', borderLeftWidth: 4, borderLeftColor: '#5856D6' }], children: [
              (0, j.jsx)(o.Text, { style: [styles.aiTitle, { color: '#5856D6', marginBottom: 10 }], children: "解析結果プレビュー" }),
              aiPreviewItems.map((item, idx) => (0, j.jsxs)(o.View, { key: idx, style: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#CCC' }, children: [
                (0, j.jsx)(o.Text, { style: { fontSize: 13 }, children: item.date }),
                (0, j.jsx)(o.Text, { style: { fontSize: 13, color: '#666' }, children: item.reason || '練習日' })
              ] })),
              (0, j.jsxs)(o.View, { style: { flexDirection: 'row', gap: 10, marginTop: 15 }, children: [
                (0, j.jsx)(o.TouchableOpacity, { style: [styles.aiActionBtn, { flex: 1, backgroundColor: '#5856D6' }], onPress: saveAiDates, children: (0, j.jsx)(o.Text, { style: styles.aiActionBtnText, children: "これらを保存する" }) }),
                (0, j.jsx)(o.TouchableOpacity, { style: [styles.aiActionBtn, { flex: 1, backgroundColor: '#8E8E93' }], onPress: () => setAiPreviewItems(null), children: (0, j.jsx)(o.Text, { style: styles.aiActionBtnText, children: "キャンセル" }) })
              ] })
            ] }),
            (0, j.jsxs)(o.View, { style: styles.calendarContainer, children: [(0, j.jsx)(o.View, { style: styles.dowRow, children: ['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (0, j.jsx)(o.View, { style: styles.dowCell, children: (0, j.jsx)(o.Text, { style: styles.dowText, children: d }) }, i)) }), (0, j.jsx)(o.View, { style: styles.calendarGrid, children: Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, i) => (0, j.jsx)(o.View, { style: styles.calendarCellEmpty }, i)).concat(Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }).map((_, i) => { const dStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`; const isP = !!practiceDays[dStr]; return (0, j.jsx)(o.TouchableOpacity, { style: [styles.calendarCell, isP && styles.calendarCellActive], onPress: () => togglePracticeDay(dStr), children: (0, j.jsx)(o.Text, { style: [styles.calendarCellText, isP && styles.calendarCellTextActive], children: i + 1 }) }, dStr); })) })] }),
            (0, j.jsxs)(o.View, { style: styles.summaryCard, children: [(0, j.jsx)(o.Text, { style: styles.summaryTitle, children: `${selectedMonth}月の練習日数` }), (0, j.jsx)(o.Text, { style: styles.summaryValue, children: `${filteredPracticeDays.length} 日` })] })
          ]
        })
      ),
      loadingMsg && (0, j.jsxs)(o.View, { style: styles.loadingOverlay, children: [(0, j.jsx)(o.ActivityIndicator, { size: "large", color: "#007AFF" }), (0, j.jsx)(o.Text, { style: styles.loadingText, children: loadingMsg })] }),
      selectedMember && (0, j.jsx)(o.Modal, { 
        visible: true, transparent: true, animationType: "slide",
        children: (0, j.jsx)(o.View, { style: styles.modalOverlay, children: (0, j.jsxs)(o.View, { style: [styles.modalContent, { height: '85%' }], children: [
          (0, j.jsxs)(o.View, { style: styles.modalHeader, children: [
            (0, j.jsxs)(o.View, { children: [
              (0, j.jsx)(o.Text, { style: styles.modalTitle, children: selectedMember.name }),
              (0, j.jsxs)(o.Text, { style: styles.memberSub, children: [`${selectedMember.gender} / ${selectedMember.grade > 0 ? selectedMember.grade + '年' : '卒業生'}`] })
            ] }),
            (0, j.jsx)(o.TouchableOpacity, { style: styles.closeBtn, onPress: () => setSelectedMember(null), children: (0, j.jsx)(m.Ionicons, { name: "close", size: 24, color: "#8E8E93" }) })
          ] }),
          (0, j.jsxs)(o.View, { style: styles.modalStatRow, children: [
            (0, j.jsxs)(o.View, { style: styles.modalStatItem, children: [(0, j.jsx)(o.Text, { style: styles.modalStatVal, children: `${selectedMember.rate.toFixed(1)}%` }), (0, j.jsx)(o.Text, { style: styles.modalStatLab, children: "出席率" })] }),
            (0, j.jsxs)(o.View, { style: styles.modalStatItem, children: [(0, j.jsx)(o.Text, { style: [styles.modalStatVal, { color: '#34C759' }], children: selectedMember.presentCount }), (0, j.jsx)(o.Text, { style: styles.modalStatLab, children: "出席" })] }),
            (0, j.jsxs)(o.View, { style: styles.modalStatItem, children: [(0, j.jsx)(o.Text, { style: [styles.modalStatVal, { color: '#FF9500' }], children: selectedMember.lateCount }), (0, j.jsx)(o.Text, { style: styles.modalStatLab, children: "遅刻" })] }),
            (0, j.jsxs)(o.View, { style: styles.modalStatItem, children: [(0, j.jsx)(o.Text, { style: [styles.modalStatVal, { color: '#FF9500' }], children: selectedMember.earlyCount }), (0, j.jsx)(o.Text, { style: styles.modalStatLab, children: "早退" })] }),
            (0, j.jsxs)(o.View, { style: styles.modalStatItem, children: [(0, j.jsx)(o.Text, { style: [styles.modalStatVal, { color: '#FF3B30' }], children: selectedMember.absentCount }), (0, j.jsx)(o.Text, { style: styles.modalStatLab, children: "欠席" })] })
          ] }),
          (0, j.jsx)(o.FlatList, { 
            data: filteredPracticeDays, 
            contentContainerStyle: { paddingBottom: 30 },
            renderItem: ({ item: d }) => { 
              const s = getAttendanceStatus(d, selectedMember.id); 
              const isFuture = d > getLocalDateString(new Date());
              return (0, j.jsxs)(o.View, { style: styles.historyRow, children: [
                (0, j.jsxs)(o.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [
                  (0, j.jsx)(m.Ionicons, { 
                    name: s === 'present' ? "checkmark-circle" : (s === 'late' || s === 'early') ? "time-outline" : s === 'absent' ? "close-circle" : "ellipse-outline", 
                    size: 20, color: s === 'present' ? "#34C759" : (s === 'late' || s === 'early') ? "#FF9500" : s === 'absent' ? "#FF3B30" : "#C7C7CC",
                    style: { marginRight: 10 }
                  }),
                  (0, j.jsx)(o.Text, { style: { fontSize: 15, color: isFuture ? '#8E8E93' : '#000' }, children: d })
                ] }),
                (0, j.jsx)(o.Text, { style: { fontSize: 14, fontWeight: '600', color: s === 'present' ? "#34C759" : s === 'late' ? "#FF9500" : s === 'early' ? "#FF9500" : s === 'absent' ? "#FF3B30" : "#8E8E93" }, children: s === 'present' ? '出席' : s === 'late' ? '遅刻' : s === 'early' ? '早退' : s === 'absent' ? '欠席' : isFuture ? '予定' : '記録なし' })
              ] }); 
            } 
          })
        ] }) }) 
      })
    ]
  });
};

const styles = o.StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  tabRow: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 2 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { fontSize: 13, color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: 'bold' },
  rangeSelector: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, gap: 10 },
  rangeBtn: { flex: 1, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F2F2F7', alignItems: 'center' },
  rangeBtnActive: { backgroundColor: '#007AFF' },
  rangeBtnText: { fontSize: 12, color: '#8E8E93' },
  rangeBtnTextActive: { color: '#FFF' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 10 },
  monthText: { fontSize: 17, fontWeight: 'bold', marginHorizontal: 20 },
  debugInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 8, gap: 5, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  debugText: { fontSize: 13, color: '#8E8E93' },
  listContent: { padding: 16 },
  memberCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  memberInfoMain: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  genderDot: { fontSize: 10 },
  memberName: { fontSize: 16, fontWeight: 'bold' },
  memberSub: { fontSize: 11, color: '#8E8E93' },
  statInfo: { alignItems: 'flex-end' },
  rateText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  countsText: { fontSize: 12, color: '#8E8E93' },
  scroll: { flex: 1 },
  aiSection: { backgroundColor: '#FFF', margin: 15, padding: 15, borderRadius: 10 },
  aiTitle: { fontSize: 15, fontWeight: 'bold' },
  aiDescription: { fontSize: 12, color: '#8E8E93' },
  aiActionBtn: { backgroundColor: '#5856D6', marginTop: 10, padding: 10, borderRadius: 8, alignItems: 'center' },
  aiActionBtnText: { color: '#FFF', fontWeight: 'bold' },
  calendarContainer: { backgroundColor: '#FFF', marginHorizontal: 15, borderRadius: 10, padding: 10 },
  dowRow: { flexDirection: 'row' },
  dowCell: { flex: 1, alignItems: 'center' },
  dowText: { fontSize: 12, color: '#8E8E93' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calendarCellEmpty: { width: '14.28%', aspectRatio: 1 },
  calendarCellActive: { backgroundColor: '#E1F0FF', borderRadius: 5 },
  calendarCellText: { fontSize: 14 },
  calendarCellTextActive: { color: '#007AFF', fontWeight: 'bold' },
  syncSection: { backgroundColor: '#FFF', margin: 15, padding: 15, borderRadius: 10 },
  syncTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  syncBtn: { backgroundColor: '#34C759', padding: 12, borderRadius: 8, alignItems: 'center' },
  syncBtnText: { color: '#FFF', fontWeight: 'bold' },
  summaryCard: { backgroundColor: '#FFF', margin: 15, padding: 15, borderRadius: 10, alignItems: 'center' },
  summaryTitle: { fontSize: 13, color: '#8E8E93' },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '95%', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  modalStatRow: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 15, marginBottom: 20, justifyContent: 'space-around' },
  modalStatItem: { alignItems: 'center' },
  modalStatVal: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  modalStatLab: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  closeBtn: { padding: 4 },
  loadingOverlay: { ...o.StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#8E8E93' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' }
});
