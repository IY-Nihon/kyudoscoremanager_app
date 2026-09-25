'use strict';

const React = require('react');
const {
  Alert,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Modal,
  StyleSheet,
} = require('./rn');
const Icons = require('@expo/vector-icons');
const { useScoreStore } = require('./useScoreStore');
// 画面が使う項目だけを購読する（ストア全体だと、ますを押すたびに裏のタブまで描き直す）
const { useストアの一部 } = require('./storeSlice');
const { IS_WEB } = require('./IS_WEB');
const { getShadowStyle } = require('./shadowStyle');
const { db } = require('./db');
const firestore = require('firebase/firestore');
// 出欠の自動判定。交代で入った人も数えるため、決まりは切り出してある
const { 日付の文字, その日の出欠, 練習日で数える } = require('./attendanceRules');
// Web-safe lazy imports to prevent null.default crash on web
var _docPickerModule = null;
var _fsModule = null;
try {
  _docPickerModule = require('expo-document-picker');
} catch (誤り) {
  /* この部品が無い場（Web）でも、下の代わりの品で動く */
}
try {
  _fsModule = require('expo-file-system');
} catch (誤り) {
  /* この部品が無い場（Web）でも、下の代わりの品で動く */
}
const docPicker = _docPickerModule || { getDocumentAsync: async () => ({ canceled: true, assets: [] }) };
const fs = _fsModule || { readAsStringAsync: async () => '', EncodingType: { Base64: 'base64' } };
const AttendanceScreen = () => {
  const { members, sessions, activeGroupId } = useストアの一部(['members', 'sessions', 'activeGroupId']);
  const [tab, setTab] = React.useState('stats');
  const [rangeType, setRangeType] = React.useState('month');
  const [practiceDays, setPracticeDays] = React.useState({});
  const [loadingMsg, setLoadingMsg] = React.useState(null);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [aiPreviewItems, setAiPreviewItems] = React.useState(null);
  const now = React.useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const currentFiscalYear = selectedMonth >= 4 ? selectedYear : selectedYear - 1;
  // 日付の文字と出欠の決まりは attendanceRules に置く。AI チャットの出欠の集計も同じ決まりで数える
  const getLocalDateString = 日付の文字;
  const changeMonth = (offset) => {
    let newMonth = selectedMonth + offset;
    let newYear = selectedYear;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };
  const changeYear = (offset) => {
    setSelectedYear((prev) => prev + offset);
  };
  React.useEffect(() => {
    if (!activeGroupId) return;
    const 置き場 = firestore.collection(db, `groups/${activeGroupId}/officialPracticeDays`);
    const unsubscribe = firestore.onSnapshot(
      置き場,
      (snap) => {
        const days = {};
        snap.forEach((doc) => {
          days[doc.id] = doc.data();
        });
        setPracticeDays(days);
      },
      // 受け口が無いと、出たあとに断られたときの誤りが SDK の console に残るだけになる
      (誤り) => {
        console.warn('[Attendance] 練習日の見張りが止まりました:', 誤り);
        try {
          require('./errorReporter').不具合を送る('練習日の受信', 誤り);
        } catch (_) {
          /* 便りが出せなくても、画面は続ける */
        }
      }
    );
    return () => unsubscribe();
  }, [activeGroupId]);
  const togglePracticeDay = async (dateStr) => {
    if (!activeGroupId) return;
    const isSet = practiceDays[dateStr];
    const docRef = firestore.doc(db, `groups/${activeGroupId}/officialPracticeDays`, dateStr);
    try {
      // created は Date で置く（管理画面で日時として読める。数だと読めない）
      if (isSet) await firestore.deleteDoc(docRef);
      else await firestore.setDoc(docRef, { date: dateStr, created: new Date() });
    } catch (誤り) {
      console.error(誤り);
    }
  };
  const todayStr = getLocalDateString(new Date());
  const getAttendanceStatus = (dateStr, memberId) => {
    const member = members.find((部員) => String(部員.id) === String(memberId));
    return その日の出欠(sessions, practiceDays, member || { id: memberId, grade: 99 }, dateStr, todayStr);
  };
  const filteredPracticeDays = Object.keys(practiceDays)
    .filter((dStr) => {
      const 日付 = new Date(dStr);
      if (tab === 'days' || rangeType === 'month')
        return 日付.getFullYear() === selectedYear && 日付.getMonth() + 1 === selectedMonth;
      if (rangeType === 'year') {
        const 年度 = 日付.getMonth() + 1 >= 4 ? 日付.getFullYear() : 日付.getFullYear() - 1;
        return 年度 === currentFiscalYear;
      }
      return true;
    })
    .sort((甲, 乙) => 乙.localeCompare(甲));
  // その年度に現役だったか（留年等も考慮）。出席率の分母を「期間の練習日数」にするかどうか
  const isActiveInYear = (部員) => {
    if (部員.grade !== 5) return (部員.grade || 0) < 5; // 現在現役なら基本真
    if (部員.graduationYear) {
      // 卒業年度が記録されていれば、表示年度がそれ以前なら現役扱い
      return currentFiscalYear <= 部員.graduationYear;
    }
    if (部員.termKi) {
      // 記録がない場合の救済：期から推測 (現在の1年生の期から逆算)
      // 卒業年度 ≒ (現在の年度) + (卒業代の期 - 現在の1年生の期)
      const currentFreshmanTerm = useScoreStore.getState().currentFreshmanTerm;
      const gradYear = currentFiscalYear + (currentFreshmanTerm - 3 - 部員.termKi);
      return currentFiscalYear <= gradYear;
    }
    return false;
  };
  // 表示している期間の練習日だけで数える（練習日で数える は日付の範囲で絞るので、絞った練習日をそのまま渡す）
  const 絞った練習日 = Object.fromEntries(filteredPracticeDays.map((日) => [日, practiceDays[日]]));
  const stats = 練習日で数える(members, sessions, 絞った練習日, { 今日: todayStr, 現役か: isActiveInYear })
    .map(({ 部員, 出席, 遅刻, 早退, 欠席, 来た回数, 出席率 }) => ({
      ...部員,
      rate: 出席率,
      presentCount: 来た回数,
      lateCount: 遅刻,
      earlyCount: 早退,
      absentCount: 欠席,
    }))
    .filter((部員) => {
      // 現役生、またはその期間内に一度でも出席実績がある卒業生を表示
      return (部員.grade || 0) < 5 || 部員.presentCount > 0;
    })
    .sort((甲, 乙) => {
      // 出席率順は維持
      if (Math.abs(乙.rate - 甲.rate) > 0.001) return 乙.rate - 甲.rate;
      // 出席率が同じ場合の基本の並び順（メンバー管理画面と一致）
      const n_grade = undefined === 甲.grade || null === 甲.grade ? 99 : Number(甲.grade);
      const l_grade = undefined === 乙.grade || null === 乙.grade ? 99 : Number(乙.grade);
      const s_idx = 0 === n_grade ? 99 : n_grade;
      const a_idx = 0 === l_grade ? 99 : l_grade;
      if (s_idx !== a_idx) return s_idx - a_idx;
      const c_func = (g_val) => {
        const t_gen = (g_val || '').trim();
        return '男子' === t_gen ? 0 : '女子' === t_gen ? 1 : 2;
      };
      const u_val = c_func(甲.gender) - c_func(乙.gender);
      return 0 !== u_val ? u_val : (甲.name || '').localeCompare(乙.name || '', 'ja');
    });
  const normalizeDate = (dStr) => {
    if (!dStr) return null;
    const parts = dStr.split('-');
    if (parts.length !== 3) return null;
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  };
  const handlePickPDF = async () => {
    // アプリの改善のため、読ませたファイルと結果を、成功・失敗に関わらず取っておく（src/improvementLog.js）
    let 予定表の記録 = null;
    try {
      const res = await docPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      const mimeType =
        asset.mimeType || (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      setLoadingMsg('予定表を読み込み中...');
      let base64 = '';
      // アプリの改善のために、送ったファイルも取っておく（src/improvementLog.js）
      let 送ったファイル = null;
      if (IS_WEB) {
        const fileData = asset.file || (await fetch(asset.uri).then((返り) => 返り.blob()));
        送ったファイル = fileData;
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
      予定表の記録 = {
        中身: { 型: mimeType, 年月: `${selectedYear}-${selectedMonth}`, 結果: '失敗' },
        ファイル: 送ったファイル,
        base64,
        型: mimeType,
      };
      // 鍵はアプリに無い。中継（Cloudflare Workers）へログインの証を付けて呼ぶ。
      // 以前は模型の一覧を引いて 1.5-flash を探していたが、1.5 はもう一覧に無く、
      // 中継は決めた模型しか通さないので、写真の読み取り・チャットと同じ 3.6-flash に固定する
      const 中継 = require('./geminiChukei');
      if (!中継.中継がある()) {
        throw new Error('AI機能の設定（中継の宛先）が見つかりません。');
      }
      const aiResponse = await 中継.中継へfetch('/v1beta/models/gemini-3.6-flash:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `添付されたファイルから練習日を抽出し、以下の純粋なJSON形式のみで回答してください。解説は不要です。\n現在は${selectedYear}年${selectedMonth}月付近の予定を解析しています。ファイルに年や月の記載が不十分な場合は、この年月を基準にして補完してください。\n[{"date":"YYYY-MM-DD", "reason":"練習"}]`,
                },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1 },
        }),
      });
      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        // 生の英文は利用者に見せない。原因を追えるよう、便りにだけ残す
        try {
          require('./errorReporter').行動を残す(
            'AI解析の失敗',
            `${aiResponse.status} ${errText.slice(0, 200)}`
          );
        } catch (_) {
          /* 便りに残せなくても、利用者への知らせは下で出す */
        }
        if (aiResponse.status === 429) {
          alert('APIリクエスト回数の上限に達しました。1分ほど待ってから再度お試しください。');
        } else if (aiResponse.status === 401) {
          alert('ログインの証が確かめられませんでした。ログインし直してから再度お試しください。');
        } else if (aiResponse.status === 503) {
          alert('AI解析サーバーが混み合っています。少し待ってから再度お試しください。');
        } else {
          alert(`AI解析エラー (${aiResponse.status}): APIの設定を確認してください。`);
        }
        throw new Error(`AI解析失敗(Status: ${aiResponse.status})`);
      }
      const data = await aiResponse.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // JSON部分を抽出
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) text = jsonMatch[0];
      if (!text || text.trim() === '') {
        throw new Error('AIからの応答内容が空、またはJSON形式ではありませんでした。');
      }
      let items = JSON.parse(text);
      const validatedItems = (Array.isArray(items) ? items : [])
        .map((項目) => ({ date: normalizeDate(項目.date), reason: 項目.reason }))
        .filter((項目) => !!項目.date);
      if (予定表の記録) {
        予定表の記録.中身.結果 = validatedItems.length > 0 ? '読んだ' : '見つからなかった';
        予定表の記録.中身.読み取り = validatedItems;
      }
      if (validatedItems.length > 0) {
        setAiPreviewItems(validatedItems);
      } else {
        Alert.alert('お知らせ', 'PDFから練習日を検出できませんでした。形式を確認してください。');
      }
    } catch (誤り) {
      if (予定表の記録) 予定表の記録.中身.誤り = String((誤り && 誤り.message) || 誤り).slice(0, 300);
      Alert.alert('エラー', 誤り.message);
    } finally {
      setLoadingMsg(null);
      // 読めたファイルは、結果に関わらず取っておく。待たない
      if (予定表の記録) {
        const { 中身, ファイル, base64: 元, 型 } = 予定表の記録;
        (async () => {
          const 記録 = require('./improvementLog');
          // 種類が空の Blob は、選んだファイルの種類を付け直す（空だと写真の札で送ってしまう）
          const 体 = ファイル
            ? ファイル.type
              ? ファイル
              : new Blob([ファイル], { type: 型 })
            : await 記録.base64をBlobに(元, 型);
          記録.改善のために取っておく('予定表', 中身, [体]);
        })().catch(() => {});
      }
    }
  };
  const saveAiDates = async () => {
    if (!aiPreviewItems || !activeGroupId) return;
    setLoadingMsg('予定を保存中...');
    try {
      for (const item of aiPreviewItems) {
        await firestore.setDoc(firestore.doc(db, `groups/${activeGroupId}/officialPracticeDays`, item.date), {
          date: item.date,
          created: new Date(),
        });
      }
      setAiPreviewItems(null);
    } catch (誤り) {
      Alert.alert('エラー', 誤り.message);
    } finally {
      setLoadingMsg(null);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>出欠管理</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'stats' && styles.tabActive]}
            onPress={() => setTab('stats')}
          >
            <Text style={[styles.tabText, tab === 'stats' && styles.tabTextActive]}>出席統計</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'days' && styles.tabActive]}
            onPress={() => setTab('days')}
          >
            <Text style={[styles.tabText, tab === 'days' && styles.tabTextActive]}>練習日設定</Text>
          </TouchableOpacity>
        </View>
      </View>
      {tab === 'stats' && (
        <View style={styles.rangeSelector}>
          <TouchableOpacity
            style={[styles.rangeBtn, rangeType === 'month' && styles.rangeBtnActive]}
            onPress={() => setRangeType('month')}
          >
            <Text style={[styles.rangeBtnText, rangeType === 'month' && styles.rangeBtnTextActive]}>
              月間
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeBtn, rangeType === 'year' && styles.rangeBtnActive]}
            onPress={() => setRangeType('year')}
          >
            <Text style={[styles.rangeBtnText, rangeType === 'year' && styles.rangeBtnTextActive]}>年度</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeBtn, rangeType === 'all' && styles.rangeBtnActive]}
            onPress={() => setRangeType('all')}
          >
            <Text style={[styles.rangeBtnText, rangeType === 'all' && styles.rangeBtnTextActive]}>
              すべて
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {(tab === 'days' || rangeType !== 'all') && (
        <View style={styles.monthNav}>
          <TouchableOpacity // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
            accessible
            accessibilityRole="button"
            accessibilityLabel="前の月へ"
            aria-label="前の月へ"
            onPress={() => (tab === 'days' || rangeType === 'month' ? changeMonth(-1) : changeYear(-1))}
          >
            <Icons.Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {tab === 'days' || rangeType === 'month'
              ? `${selectedYear}年 ${selectedMonth}月`
              : `${currentFiscalYear}年度`}
          </Text>
          <TouchableOpacity // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
            accessible
            accessibilityRole="button"
            accessibilityLabel="次の月へ"
            aria-label="次の月へ"
            onPress={() => (tab === 'days' || rangeType === 'month' ? changeMonth(1) : changeYear(1))}
          >
            <Icons.Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
      {tab === 'stats' ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={stats}
            keyExtractor={(部員, idx) =>
              部員.id && typeof 部員.id === 'string' ? 部員.id : `attendance-member-${idx}`
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item: 部員 }) => (
              <TouchableOpacity style={styles.memberCard} onPress={() => setSelectedMember(部員)}>
                <View style={styles.memberInfoMain}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        styles.genderDot,
                        {
                          color:
                            部員.gender === '男子'
                              ? '#007AFF'
                              : 部員.gender === '女子'
                                ? '#FF2D55'
                                : '#8E8E93',
                        },
                      ]}
                    >
                      ●
                    </Text>
                    <Text style={styles.memberName}>{部員.name}</Text>
                  </View>
                  <Text
                    style={styles.memberSub}
                  >{`${部員.termKi ? 部員.termKi + '期 / ' : ''}${部員.gender} / ${部員.grade === 5 ? '卒業生' : 部員.grade === 0 ? 'その他' : 部員.grade + '年'}`}</Text>
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.rateText}>{部員.rate.toFixed(1)}%</Text>
                  <Text style={styles.countsText}>
                    {部員.presentCount}/{filteredPracticeDays.length}
                  </Text>
                </View>
                <Icons.Ionicons name="chevron-forward" size={16} color="#C7C7CC" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <ScrollView style={styles.scroll}>
          <View style={styles.aiSection}>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiTitle}>AIで予定表をスキャンして自動入力</Text>
              <Text style={styles.aiDescription}>
                練習予定表（PDF/画像）をAIが解析し、カレンダーへ自動的に登録します。
              </Text>
            </View>
            <TouchableOpacity
              style={styles.aiActionBtn}
              onPress={() => {
                handlePickPDF();
              }}
            >
              <Text style={styles.aiActionBtnText}>ファイルを選択</Text>
            </TouchableOpacity>
          </View>
          {aiPreviewItems && (
            <View
              style={[
                styles.aiSection,
                { backgroundColor: '#F0F0FF', borderLeftWidth: 4, borderLeftColor: '#5856D6' },
              ]}
            >
              <Text style={[styles.aiTitle, { color: '#5856D6', marginBottom: 10 }]}>解析結果プレビュー</Text>
              {aiPreviewItems.map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 5,
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#CCC',
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{item.date}</Text>
                  <Text style={{ fontSize: 13, color: '#666' }}>{item.reason || '練習日'}</Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                <TouchableOpacity
                  style={[styles.aiActionBtn, { flex: 1, backgroundColor: '#5856D6' }]}
                  onPress={saveAiDates}
                >
                  <Text style={styles.aiActionBtnText}>これらを保存する</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.aiActionBtn, { flex: 1, backgroundColor: '#8E8E93' }]}
                  onPress={() => setAiPreviewItems(null)}
                >
                  <Text style={styles.aiActionBtnText}>キャンセル</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.calendarContainer}>
            <View style={styles.dowRow}>
              {['日', '月', '火', '水', '木', '金', '土'].map((曜日, 番) => (
                <View key={番} style={styles.dowCell}>
                  <Text style={styles.dowText}>{曜日}</Text>
                </View>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() })
                .map((_, 番) => <View key={番} style={styles.calendarCellEmpty} />)
                .concat(
                  Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }).map((_, 番) => {
                    const dStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(番 + 1).padStart(2, '0')}`;
                    const isP = !!practiceDays[dStr];
                    return (
                      <TouchableOpacity
                        key={dStr}
                        style={[styles.calendarCell, isP && styles.calendarCellActive]}
                        onPress={() => togglePracticeDay(dStr)}
                      >
                        <Text style={[styles.calendarCellText, isP && styles.calendarCellTextActive]}>
                          {番 + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{`${selectedMonth}月の練習日数`}</Text>
            <Text style={styles.summaryValue}>{`${filteredPracticeDays.length} 日`}</Text>
          </View>
        </ScrollView>
      )}
      {loadingMsg && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{loadingMsg}</Text>
        </View>
      )}
      {selectedMember && (
        <Modal
          visible
          transparent
          animationType="slide" // 見るだけの窓。端末の戻るでも、外を押しても閉じる
          onRequestClose={() => setSelectedMember(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              activeOpacity={1}
              accessibilityLabel="閉じる"
              onPress={() => setSelectedMember(null)}
            />
            <View // 背景の板より上に置く。置かないと、板が中身の押すを横取りする
              style={[styles.modalContent, { height: '85%', zIndex: 1 }]}
            >
              <View style={styles.modalHeader}>
                <View // 名前が長くても閉じるボタンを押し出さない。名前は折り返す
                  style={styles.modalHeaderMain}
                >
                  <Text style={styles.modalTitle}>{selectedMember.name}</Text>
                  <Text
                    style={styles.memberSub}
                  >{`${selectedMember.gender} / ${selectedMember.grade === 5 ? '卒業生' : selectedMember.grade === 0 ? 'その他' : selectedMember.grade + '年'}`}</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="閉じる"
                  aria-label="閉じる"
                  onPress={() => setSelectedMember(null)}
                >
                  <Icons.Ionicons name="close" size={24} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalStatRow}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatVal}>{`${selectedMember.rate.toFixed(1)}%`}</Text>
                  <Text style={styles.modalStatLab}>出席率</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={[styles.modalStatVal, { color: '#34C759' }]}>
                    {selectedMember.presentCount}
                  </Text>
                  <Text style={styles.modalStatLab}>出席</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={[styles.modalStatVal, { color: '#FF9500' }]}>{selectedMember.lateCount}</Text>
                  <Text style={styles.modalStatLab}>遅刻</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={[styles.modalStatVal, { color: '#FF9500' }]}>{selectedMember.earlyCount}</Text>
                  <Text style={styles.modalStatLab}>早退</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={[styles.modalStatVal, { color: '#FF3B30' }]}>
                    {selectedMember.absentCount}
                  </Text>
                  <Text style={styles.modalStatLab}>欠席</Text>
                </View>
              </View>
              <FlatList
                data={filteredPracticeDays}
                keyExtractor={(日) => String(日)}
                contentContainerStyle={{ paddingBottom: 30 }}
                renderItem={({ item: 日 }) => {
                  const 出欠 = getAttendanceStatus(日, selectedMember.id);
                  const isFuture = 日 > getLocalDateString(new Date());
                  return (
                    <View style={styles.historyRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icons.Ionicons
                          name={
                            出欠 === 'present'
                              ? 'checkmark-circle'
                              : 出欠 === 'late' || 出欠 === 'early'
                                ? 'time-outline'
                                : 出欠 === 'absent'
                                  ? 'close-circle'
                                  : 'ellipse-outline'
                          }
                          size={20}
                          color={
                            出欠 === 'present'
                              ? '#34C759'
                              : 出欠 === 'late' || 出欠 === 'early'
                                ? '#FF9500'
                                : 出欠 === 'absent'
                                  ? '#FF3B30'
                                  : '#C7C7CC'
                          }
                          style={{ marginRight: 10 }}
                        />
                        <Text style={{ fontSize: 15, color: isFuture ? '#8E8E93' : '#000' }}>{日}</Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '600',
                          color:
                            出欠 === 'present'
                              ? '#34C759'
                              : 出欠 === 'late'
                                ? '#FF9500'
                                : 出欠 === 'early'
                                  ? '#FF9500'
                                  : 出欠 === 'absent'
                                    ? '#FF3B30'
                                    : '#8E8E93',
                        }}
                      >
                        {出欠 === 'present'
                          ? '出席'
                          : 出欠 === 'late'
                            ? '遅刻'
                            : 出欠 === 'early'
                              ? '早退'
                              : 出欠 === 'absent'
                                ? '欠席'
                                : isFuture
                                  ? '予定'
                                  : '記録なし'}
                      </Text>
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  tabRow: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 2 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { fontSize: 13, color: '#8E8E93' },
  tabTextActive: { color: '#007AFF', fontWeight: 'bold' },
  rangeSelector: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, gap: 10 },
  rangeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  rangeBtnActive: { backgroundColor: '#007AFF' },
  rangeBtnText: { fontSize: 12, color: '#8E8E93' },
  rangeBtnTextActive: { color: '#FFF' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 10,
  },
  monthText: { fontSize: 17, fontWeight: 'bold', marginHorizontal: 20 },
  debugInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  debugText: { fontSize: 13, color: '#8E8E93' },
  listContent: { padding: 16 },
  memberCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfoMain: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  genderDot: { fontSize: 10 },
  // 長い名前は折り返す。縮まない字だと、右の数字と矢印を画面の外へ押し出す
  memberName: { fontSize: 16, fontWeight: 'bold', flexShrink: 1, minWidth: 0 },
  memberSub: { fontSize: 11, color: '#8E8E93' },
  statInfo: { alignItems: 'flex-end', flexShrink: 0 },
  rateText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  countsText: { fontSize: 12, color: '#8E8E93' },
  scroll: { flex: 1 },
  aiSection: { backgroundColor: '#FFF', margin: 15, padding: 15, borderRadius: 10 },
  aiTitle: { fontSize: 15, fontWeight: 'bold' },
  aiDescription: { fontSize: 12, color: '#8E8E93' },
  aiActionBtn: {
    backgroundColor: '#5856D6',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  aiActionBtnText: { color: '#FFF', fontWeight: 'bold' },
  calendarContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 10,
    maxWidth: 500,
    alignSelf: 'center',
    width: '92%',
  },
  dowRow: { flexDirection: 'row', marginBottom: 5 },
  dowCell: { flex: 1, alignItems: 'center' },
  dowText: { fontSize: 12, color: '#8E8E93' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.28%', height: 48, justifyContent: 'center', alignItems: 'center' },
  calendarCellEmpty: { width: '14.28%', height: 48 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: Object.assign(
    { backgroundColor: '#FFF', width: '95%', padding: 20, borderRadius: 20 },
    getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
    })
  ),
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalHeaderMain: { flex: 1, minWidth: 0, marginRight: 12 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', flexShrink: 1 },
  modalStatRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  modalStatItem: { alignItems: 'center' },
  modalStatVal: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  modalStatLab: { fontSize: 11, color: '#8E8E93', marginTop: 4 },
  closeBtn: { padding: 4, flexShrink: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, color: '#8E8E93' },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.AttendanceScreen = AttendanceScreen;
