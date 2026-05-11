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
  const [loadingMsg, setLoadingMsg] = (0, t.useState)("");
  const [selectedMember, setSelectedMember] = (0, t.useState)(null);
  
  const [aiPreviewDates, setAiPreviewDates] = (0, t.useState)(null);

  const now = t.useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = (0, t.useState)(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = (0, t.useState)(now.getMonth() + 1);

  const currentFiscalYear = selectedMonth >= 4 ? selectedYear : selectedYear - 1;

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
    const fetchPracticeDays = async () => {
      try {
        const q = (0, firestore.collection)(db.db, `groups/${activeGroupId}/officialPracticeDays`);
        const snap = await (0, firestore.getDocs)(q);
        const days = {};
        snap.forEach(doc => { days[doc.id] = doc.data(); });
        setPracticeDays(days);
      } catch (e) { console.error("Fetch Practice Days Error:", e); }
    };
    fetchPracticeDays();
  }, [activeGroupId]);

  const togglePracticeDay = async (dateStr) => {
    if (!activeGroupId) return;
    const isSet = practiceDays[dateStr];
    const docRef = (0, firestore.doc)(db.db, `groups/${activeGroupId}/officialPracticeDays`, dateStr);
    try {
      if (isSet) {
        await (0, firestore.deleteDoc)(docRef);
        setPracticeDays(prev => {
          const next = { ...prev };
          delete next[dateStr];
          return next;
        });
      } else {
        await (0, firestore.setDoc)(docRef, { date: dateStr, created: Date.now() });
        setPracticeDays(prev => ({ ...prev, [dateStr]: { date: dateStr } }));
      }
    } catch (e) { console.error("Toggle Practice Day Error:", e); }
  };

  const filteredSessions = sessions.filter(s => {
    if (!s || !s.date) return false;
    const d = new Date(s.date);
    if (tab === 'days' || rangeType === 'month') return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    if (rangeType === 'year') {
      const y = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
      return y === currentFiscalYear;
    }
    return true;
  });

  const filteredPracticeDays = Object.keys(practiceDays).filter(dStr => {
    const d = new Date(dStr);
    if (tab === 'days' || rangeType === 'month') return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
    if (rangeType === 'year') {
      const y = d.getMonth() + 1 >= 4 ? d.getFullYear() : d.getFullYear() - 1;
      return y === currentFiscalYear;
    }
    return true;
  }).sort((a, b) => b.localeCompare(a));

  const stats = members.map(m => {
    let presentCount = 0; let lateCount = 0; let earlyCount = 0; let absentCount = 0;
    filteredSessions.forEach(s => {
      const att = s.attendance?.[m.id];
      if (att === 'present') presentCount++;
      else if (att === 'late') { presentCount++; lateCount++; }
      else if (att === 'early') { presentCount++; earlyCount++; }
      else if (att === 'absent') absentCount++;
    });
    const totalOfficial = filteredPracticeDays.length;
    const rate = totalOfficial > 0 ? (presentCount / totalOfficial) * 100 : 0;
    return { ...m, rate, presentCount, lateCount, earlyCount, absentCount };
  }).sort((a, b) => b.rate - a.rate);

  const handlePickPDF = async () => {
    try {
      const res = await docPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.canceled) return;
      setLoading(true);
      setLoadingMsg("予定表を読み込み中...");
      let base64 = "";
      if (x.IS_WEB) {
        const file = res.assets[0].file;
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        const fileUri = res.assets[0].uri;
        base64 = await fs.readAsStringAsync(fileUri, { encoding: fs.EncodingType.Base64 });
      }
      setLoadingMsg("AIが日程を抽出しています...");
      const apiKey = x.GEMINI_API_KEY;
      if (!apiKey) {
        o.Alert.alert("設定エラー", "Gemini APIキーが設定されていません。");
        setLoading(false);
        return;
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          parts: [
            { text: "このPDFから「正規練習日」または「全体練習」の日程を抽出して、YYYY-MM-DDの配列形式のJSONで返してください。余計な説明は不要です。例: ['2024-05-01', '2024-05-03']" },
            { inline_data: { mime_type: "application/pdf", data: base64 } }
          ]
        }]
      };
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("API通信エラー");
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) {
        const dates = JSON.parse(jsonMatch[0]);
        setAiPreviewDates(dates.sort());
      } else {
        o.Alert.alert("解析不可", "予定表から日付を読み取れませんでした。");
      }
    } catch (e) {
      console.error("AI Parsing Error:", e);
      o.Alert.alert("エラー", "解析中に問題が発生しました。");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const saveAiDates = async () => {
    if (!aiPreviewDates || !activeGroupId) return;
    setLoading(true);
    setLoadingMsg("予定をカレンダーに書き込み中...");
    try {
      for (const dStr of aiPreviewDates) {
        const docRef = (0, firestore.doc)(db.db, `groups/${activeGroupId}/officialPracticeDays`, dStr);
        await (0, firestore.setDoc)(docRef, { date: dStr, created: Date.now() });
      }
      const snap = await (0, firestore.getDocs)((0, firestore.collection)(db.db, `groups/${activeGroupId}/officialPracticeDays`));
      const days = {}; snap.forEach(doc => { days[doc.id] = doc.data(); });
      setPracticeDays(days);
      setAiPreviewDates(null);
      o.Alert.alert("完了", "練習日の一括登録が完了しました。");
    } catch (e) {
      o.Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const renderCalendar = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const cells = [];
    const dow = ['日', '月', '火', '水', '木', '金', '土'];
    const headers = dow.map((d, i) => (0, j.jsx)(o.View, {
      style: styles.dowCell,
      children: (0, j.jsx)(o.Text, { style: [styles.dowText, i === 0 && { color: '#FF3B30' }, i === 6 && { color: '#007AFF' }], children: d })
    }, `dow-${i}`));
    for (let i = 0; i < firstDay; i++) cells.push((0, j.jsx)(o.View, { style: styles.calendarCellEmpty }, `empty-${i}`));
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPractice = !!practiceDays[dateStr];
      cells.push(
        (0, j.jsx)(o.TouchableOpacity, {
          style: [styles.calendarCell, isPractice && styles.calendarCellActive],
          onPress: () => togglePracticeDay(dateStr),
          children: (0, j.jsx)(o.Text, { style: [styles.calendarCellText, isPractice && styles.calendarCellTextActive], children: d })
        }, dateStr)
      );
    }
    return (0, j.jsxs)(o.View, { style: styles.calendarContainer, children: [(0, j.jsx)(o.View, { style: styles.dowRow, children: headers }), (0, j.jsx)(o.View, { style: styles.calendarGrid, children: cells })] });
  };

  const renderMemberDetail = () => {
    if (!selectedMember) return null;
    const history = filteredPracticeDays.map(dStr => {
      const session = filteredSessions.find(s => {
        if (!s || !s.date) return false;
        const sd = new Date(s.date).toISOString().split('T')[0];
        return sd === dStr;
      });
      const status = session?.attendance?.[selectedMember.id] || "none";
      return { date: dStr, status, title: session?.title };
    });
    return (0, j.jsx)(o.Modal, {
      visible: true, animationType: "slide", transparent: true,
      children: (0, j.jsx)(o.View, {
        style: styles.modalOverlay,
        children: (0, j.jsxs)(o.View, {
          style: [styles.modalContent, { borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '85%', justifyContent: 'flex-start' }],
          children: [
            (0, j.jsxs)(o.View, {
              style: styles.modalHeader,
              children: [
                (0, j.jsxs)(o.View, { children: [(0, j.jsx)(o.Text, { style: styles.modalTitle, children: selectedMember.name }), (0, j.jsxs)(o.Text, { style: styles.modalSub, children: [`${selectedMember.termKi}期 / ${selectedMember.gender} / ${selectedMember.grade}年`] })] }),
                (0, j.jsx)(o.TouchableOpacity, { onPress: () => setSelectedMember(null), children: (0, j.jsx)(m.Ionicons, { name: "close-circle", size: 30, color: "#8E8E93" }) })
              ]
            }),
            (0, j.jsx)(o.FlatList, {
              data: history, keyExtractor: i => i.date, contentContainerStyle: { paddingBottom: 40 },
              renderItem: ({ item: h }) => (
                (0, j.jsxs)(o.View, {
                  style: styles.historyRow,
                  children: [
                    (0, j.jsxs)(o.View, { style: { flex: 1 }, children: [(0, j.jsx)(o.Text, { style: styles.historyDate, children: h.date }), (0, j.jsx)(o.Text, { style: styles.historyTitle, numberOfLines: 1, children: h.title || "セッション記録なし" })] }),
                    (0, j.jsx)(o.View, {
                      style: [styles.statusBadge, styles[`status_${h.status}`]],
                      children: (0, j.jsx)(o.Text, { style: [styles.statusBadgeText, styles[`statusText_${h.status}`]], children: h.status === 'present' ? '出席' : h.status === 'late' ? '遅刻' : h.status === 'early' ? '早退' : h.status === 'absent' ? '欠席' : '記録なし' })
                    })
                  ]
                })
              ),
              ListEmptyComponent: (0, j.jsx)(o.Text, { style: styles.emptyText, children: "該当期間の練習日はありません" })
            })
          ]
        })
      })
    });
  };

  const renderAiPreview = () => (
    (0, j.jsx)(o.Modal, {
      visible: !!aiPreviewDates, animationType: "fade", transparent: true,
      children: (0, j.jsx)(o.View, {
        style: styles.modalOverlay,
        children: (0, j.jsxs)(o.View, {
          style: [styles.modalContent, { borderRadius: 20, maxHeight: '80%' }],
          children: [
            (0, j.jsxs)(o.View, {
              style: styles.modalHeader,
              children: [
                (0, j.jsx)(o.Text, { style: styles.modalTitle, children: "解析結果の確認" }),
                (0, j.jsx)(o.TouchableOpacity, { onPress: () => setAiPreviewDates(null), children: (0, j.jsx)(m.Ionicons, { name: "close-circle", size: 30, color: "#8E8E93" }) })
              ]
            }),
            (0, j.jsxs)(o.Text, { style: styles.previewHint, children: [`AIが ${aiPreviewDates?.length} 件の練習日を見つけました。登録してよろしいですか？`] }),
            (0, j.jsx)(o.ScrollView, {
              style: { marginVertical: 15 },
              children: aiPreviewDates?.map(d => (
                (0, j.jsxs)(o.View, { key: d, style: styles.previewRow, children: [(0, j.jsx)(m.Ionicons, { name: "calendar-outline", size: 16, color: "#007AFF" }), (0, j.jsx)(o.Text, { style: styles.previewText, children: d })] })
              ))
            }),
            (0, j.jsx)(o.TouchableOpacity, { style: styles.confirmBtn, onPress: saveAiDates, children: (0, j.jsx)(o.Text, { style: styles.confirmBtnText, children: "この日付で登録する" }) })
          ]
        })
      })
    })
  );

  return (0, j.jsxs)(o.View, {
    style: styles.container,
    children: [
      (0, j.jsxs)(o.View, {
        style: styles.header,
        children: [
          (0, j.jsx)(o.Text, { style: styles.title, children: "出欠管理" }),
          (0, j.jsxs)(o.View, {
            style: styles.tabRow,
            children: [
              (0, j.jsx)(o.TouchableOpacity, { style: [styles.tab, tab === 'stats' && styles.tabActive], onPress: () => setTab('stats'), children: (0, j.jsx)(o.Text, { style: [styles.tabText, tab === 'stats' && styles.tabTextActive], children: "出席統計" }) }),
              (0, j.jsx)(o.TouchableOpacity, { style: [styles.tab, tab === 'days' && styles.tabActive], onPress: () => setTab('days'), children: (0, j.jsx)(o.Text, { style: [styles.tabText, tab === 'days' && styles.tabTextActive], children: "練習日設定" }) })
            ]
          })
        ]
      }),
      tab === 'stats' && (0, j.jsxs)(o.View, {
        style: styles.rangeSelector,
        children: [
          (0, j.jsx)(o.TouchableOpacity, { style: [styles.rangeBtn, rangeType === 'month' && styles.rangeBtnActive], onPress: () => setRangeType('month'), children: (0, j.jsx)(o.Text, { style: [styles.rangeBtnText, rangeType === 'month' && styles.rangeBtnTextActive], children: "月間" }) }),
          (0, j.jsx)(o.TouchableOpacity, { style: [styles.rangeBtn, rangeType === 'year' && styles.rangeBtnActive], onPress: () => setRangeType('year'), children: (0, j.jsx)(o.Text, { style: [styles.rangeBtnText, rangeType === 'year' && styles.rangeBtnTextActive], children: "年度" }) }),
          (0, j.jsx)(o.TouchableOpacity, { style: [styles.rangeBtn, rangeType === 'all' && styles.rangeBtnActive], onPress: () => setRangeType('all'), children: (0, j.jsx)(o.Text, { style: [styles.rangeBtnText, rangeType === 'all' && styles.rangeBtnTextActive], children: "すべて" }) })
        ]
      }),
      (tab === 'days' || rangeType !== 'all') && (0, j.jsxs)(o.View, {
        style: styles.monthNav,
        children: [
          (0, j.jsx)(o.TouchableOpacity, { onPress: () => (tab === 'days' || rangeType === 'month') ? changeMonth(-1) : changeYear(-1), children: (0, j.jsx)(m.Ionicons, { name: "chevron-back", size: 24, color: "#007AFF" }) }),
          (0, j.jsxs)(o.Text, { style: styles.monthText, children: (tab === 'days' || rangeType === 'month') ? [`${selectedYear}年 ${selectedMonth}月`] : [`${currentFiscalYear}年度`] }),
          (0, j.jsx)(o.TouchableOpacity, { onPress: () => (tab === 'days' || rangeType === 'month') ? changeMonth(1) : changeYear(1), children: (0, j.jsx)(m.Ionicons, { name: "chevron-forward", size: 24, color: "#007AFF" }) })
        ]
      }),
      tab === 'stats' ? (
        (0, j.jsx)(o.FlatList, {
          data: stats, keyExtractor: i => i.id, contentContainerStyle: styles.listContent,
          renderItem: ({ item: s }) => (0, j.jsxs)(o.TouchableOpacity, {
            style: styles.memberCard, onPress: () => setSelectedMember(s),
            children: [
              (0, j.jsxs)(o.View, { style: styles.memberInfoMain, children: [(0, j.jsxs)(o.View, { style: styles.nameRow, children: [(0, j.jsx)(o.Text, { style: [styles.genderDot, { color: s.gender === '男子' ? '#007AFF' : s.gender === '女子' ? '#FF2D55' : '#8E8E93' }], children: "●" }), (0, j.jsx)(o.Text, { style: styles.memberName, children: s.name })] }), (0, j.jsxs)(o.Text, { style: styles.memberSub, children: [`${s.termKi ? s.termKi + '期 / ' : ''}${s.gender} / ${s.grade > 0 ? s.grade + '年' : '卒業生'}`] })] }),
              (0, j.jsxs)(o.View, { style: styles.statInfo, children: [(0, j.jsxs)(o.Text, { style: styles.rateText, children: [s.rate.toFixed(1), "%"] }), (0, j.jsxs)(o.Text, { style: styles.countsText, children: [s.presentCount, "/", filteredPracticeDays.length] })] }),
              (0, j.jsx)(m.Ionicons, { name: "chevron-forward", size: 16, color: "#C7C7CC", style: { marginLeft: 8 } })
            ]
          }),
          ListEmptyComponent: (0, j.jsx)(o.Text, { style: styles.emptyText, children: "部員が登録されていません" })
        })
      ) : (
        (0, j.jsxs)(o.ScrollView, {
          style: styles.scroll,
          children: [
            (0, j.jsxs)(o.View, {
              style: styles.aiSection,
              children: [
                (0, j.jsxs)(o.View, {
                  style: styles.aiTextContainer,
                  children: [
                    (0, j.jsxs)(o.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }, children: [(0, j.jsx)(m.Ionicons, { name: "sparkles", size: 18, color: "#5856D6" }), (0, j.jsx)(o.Text, { style: styles.aiTitle, children: "PDFから予定を自動入力" })] }),
                    (0, j.jsx)(o.Text, { style: styles.aiDescription, children: "練習予定表（PDF）を選択すると、AIが日程を自動で読み取りカレンダーに登録します。" })
                  ]
                }),
                (0, j.jsxs)(o.TouchableOpacity, {
                  style: [styles.aiActionBtn, loading && { opacity: 0.7 }], onPress: handlePickPDF, disabled: loading,
                  children: [
                    loading ? (0, j.jsx)(o.ActivityIndicator, { size: "small", color: "#FFF" }) : (0, j.jsx)(m.Ionicons, { name: "document-text", size: 20, color: "#FFF" }),
                    (0, j.jsx)(o.Text, { style: styles.aiActionBtnText, children: loading ? "解析中..." : "ファイルを選択して解析" })
                  ]
                })
              ]
            }),
            (0, j.jsx)(o.View, { style: styles.sectionHeader, children: (0, j.jsx)(o.Text, { style: styles.sectionTitle, children: "カレンダーで設定" }) }),
            (0, j.jsx)(o.Text, { style: styles.hint, children: "日付をタップして練習日をON/OFFできます。" }),
            renderCalendar(),
            loadingMsg ? (0, j.jsxs)(o.View, { style: styles.loadingOverlay, children: [(0, j.jsx)(o.ActivityIndicator, { size: "large", color: "#007AFF" }), (0, j.jsx)(o.Text, { style: styles.loadingText, children: loadingMsg })] }) : null,
            (0, j.jsxs)(o.View, { style: styles.summaryCard, children: [(0, j.jsxs)(o.Text, { style: styles.summaryTitle, children: [`${selectedMonth}月の練習日数`] }), (0, j.jsxs)(o.Text, { style: styles.summaryValue, children: [`${filteredPracticeDays.length} 日`] })] })
          ]
        })
      ),
      selectedMember && renderMemberDetail(),
      aiPreviewDates && renderAiPreview()
    ]
  });
};

const styles = o.StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 15 },
  tabRow: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 2 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  tabText: { fontSize: 14, color: '#8E8E93', fontWeight: '600' },
  tabTextActive: { color: '#007AFF' },
  rangeSelector: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 8, gap: 10 },
  rangeBtn: { flex: 1, paddingVertical: 6, borderRadius: 15, backgroundColor: '#F2F2F7', alignItems: 'center' },
  rangeBtnActive: { backgroundColor: '#007AFF' },
  rangeBtnText: { fontSize: 12, color: '#8E8E93', fontWeight: 'bold' },
  rangeBtnTextActive: { color: '#FFF' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  monthText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 30, color: '#1C1C1E' },
  listContent: { padding: 16 },
  memberCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 5, elevation: 2 },
  memberInfoMain: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  genderDot: { fontSize: 12 },
  memberName: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  memberSub: { fontSize: 12, color: '#8E8E93' },
  statInfo: { alignItems: 'flex-end' },
  rateText: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  countsText: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  scroll: { flex: 1 },
  aiSection: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#5856D6', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  aiTextContainer: { marginBottom: 12 },
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  aiDescription: { fontSize: 13, color: '#8E8E93', lineHeight: 18 },
  aiActionBtn: { backgroundColor: '#5856D6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  aiActionBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  calendarContainer: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  dowRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingVertical: 8 },
  dowCell: { flex: 1, alignItems: 'center' },
  dowText: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 5 },
  calendarCell: { width: '14.28%', aspectRatio: 1.2, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  calendarCellEmpty: { width: '14.28%', aspectRatio: 1.2 },
  calendarCellActive: { backgroundColor: '#E1F0FF' },
  calendarCellText: { fontSize: 15, color: '#1C1C1E' },
  calendarCellTextActive: { color: '#007AFF', fontWeight: 'bold' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 24, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  hint: { fontSize: 12, color: '#8E8E93', marginHorizontal: 20, marginBottom: 12 },
  summaryCard: { backgroundColor: '#FFF', margin: 20, padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  summaryTitle: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  previewHint: { fontSize: 14, color: '#3A3A3C', marginBottom: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  previewText: { fontSize: 16, color: '#1C1C1E' },
  confirmBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loadingOverlay: { padding: 20, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#8E8E93', fontSize: 14 },
  modalSub: { fontSize: 14, color: '#8E8E93' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  historyDate: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  historyTitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  status_present: { backgroundColor: '#E2F9E9' },
  statusText_present: { color: '#1DB954' },
  status_late: { backgroundColor: '#FFF4E5' },
  statusText_late: { color: '#FF9500' },
  status_early: { backgroundColor: '#ECEBFF' },
  statusText_early: { color: '#5856D6' },
  status_absent: { backgroundColor: '#FFEBEB' },
  statusText_absent: { color: '#FF3B30' },
  status_none: { backgroundColor: '#F2F2F7' },
  statusText_none: { color: '#8E8E93' },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40 }
});
