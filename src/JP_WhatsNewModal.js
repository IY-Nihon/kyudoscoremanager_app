/**
 * Module ID: WhatsNewModal (hand-written, not bundler-generated)
 * アプリ起動時に最近の変更点をお知らせするモーダル
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });
exports.WhatsNewModal = void 0;

const React = require('react');
const { useState, useEffect } = React;
const RN = require('react-native');
const _View = RN.View;
const _Text = require('./default_217').default; // テーマ変換を通すためブリッジ経由
const _StyleSheet = require('./default_45').default; // テーマ変換を通すためブリッジ経由
const _TouchableOpacity = RN.TouchableOpacity;
const _Modal = RN.Modal;
const _ScrollView = RN.ScrollView;

const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { Ionicons } = require('./AntDesign_600');
const { getShadowStyle } = require('./module_592');

// ─────────────────────────────────────────
// お知らせバージョン
// 新しいお知らせを追加・変更したら、このバージョン文字列を必ず更新してください。
// 「次のお知らせが来るまで表示しない」を選んだ端末でも、この値が変わると再度表示されます。
// ─────────────────────────────────────────
const NOTICE_VERSION = '2026-08-13-01';
const STORAGE_KEY = 'whatsNewDismissedVersion';

const NOTICE_ITEMS = [
  {
    date: '2026/08/13',
    title: '',
    points: [
      'ライブ記録の名前に「/」などが使えてしまい、その場合に誰も参加できないライブができてしまう不具合を修正しました。使えない文字を入力すると、その場でお知らせします。',
      'ライブ記録の参加一覧が、最終更新の新しい順に並ぶようになりました。長期間(14日間以上)使われていないものは自動で削除されるようになりました。',
    ],
  },
  {
    date: '2026/08/06',
    title: '',
    points: ['不具合の修正やセキュリティの強化など、その他諸々の修正を行いました。'],
  },
  {
    date: '2026/08/03',
    title: 'ダークモードに対応しました',
    boldPoints: true,
    points: [
      '設定の「表示」から、ライト／ダーク／端末に合わせる、を選べるようになりました。',
      '「端末に合わせる」を選ぶと、スマホやPCの設定に連動して自動で切り替わります。',
    ],
  },
  {
    date: '2026/08/03',
    title: '紙に取った記録も画像から読み取れるようになりました(デモ)',
    points: [
      '記録画面の「画像」ボタンで「紙の記録」を選ぶと、氏名と1射ごとの○×をAIが読み取って記録表に反映できます。',
      '手書きの○や×、書き方のくせもある程度そのまま読み取れます。読み取り後の画面でタップして修正もできます。',
      '認識の精度を上げるため、うまく読み取れなかった記録用紙の画像をお問い合わせから送っていただけると助かります。',
    ],
  },
  {
    date: '2026/08/03',
    title: '書き出しがExcel形式になりました',
    points: [
      '設定の「データをExcel形式で書き出し」から、そのままExcelで開けるファイルを保存できます。',
      '見出しに並べ替えボタンが付いた状態で開くので、日付順・的中率順などをその場で切り替えられます。列幅も調整済みです。',
      '「印刷向形式」を選ぶと、これまでどおりメンバーを縦・日付を横に並べた集計表を出せます。',
    ],
  },
  {
    date: '2026/08/03',
    title: '',
    points: ['アプリ内部の整理を行い、読み込みが軽くなりました。表示や操作の変更はありません。'],
  },
  {
    date: '2026/07/11',
    title: '',
    points: [
      '分析画面のグラフの点をタップすると表示される記録一覧から、その記録・その人の履歴詳細へ直接ジャンプできるようになりました。',
    ],
  },
  {
    date: '2026/07/10',
    title: '',
    points: [
      '記録画面の矢所入力を改善：PCではマウスに追従するプレビュー表示、スマホではドラッグして指を離した位置に登録できるようになりました。',
    ],
  },
  {
    date: '2026/07/08',
    title:
      '画像から立ち順を自動登録できるようになりました(デモ)※機能改善のために立ち順の黒板の画像などがあればお問い合わせから送っていただけると幸いです。',
    points: [
      'ホワイトボードの立ち順表を撮影・選択するだけで、AIが読み取って記録表に反映できます。',
      '「撮影する」ボタンからその場でカメラ起動、「画像を選択」からは既存の写真も使えます。',
    ],
  },
  {
    date: '2026/07/04',
    title: '',
    boldPoints: true,
    points: ['分析画面で複数人を比較できるようになりました。', '設定にお問い合わせフォームを追加しました。'],
  },
];

// 起動から一度でも表示したかを覚えておく。
// テーマを切り替えると App 側が key を変えて配下を作り直すため、
// この目印が無いと閉じたお知らせが切り替えのたびに出てきてしまう。
let shownThisSession = false;

const WhatsNewModal = () => {
  const [visible, setVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    if (shownThisSession) {
      setCheckedStorage(true);
      return;
    }
    (async () => {
      try {
        const dismissedVersion = await AsyncStorage.getItem(STORAGE_KEY);
        if (dismissedVersion !== NOTICE_VERSION) {
          shownThisSession = true;
          setVisible(true);
        }
      } catch (e) {
        console.error('[WhatsNewModal] Failed to read storage:', e);
        // 読み込み失敗時は安全側に倒して表示する
        shownThisSession = true;
        setVisible(true);
      } finally {
        setCheckedStorage(true);
      }
    })();
  }, []);

  const handleClose = async () => {
    setVisible(false);
    if (dontShowAgain) {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, NOTICE_VERSION);
      } catch (e) {
        console.error('[WhatsNewModal] Failed to save dismissal:', e);
      }
    }
  };

  if (!checkedStorage || !visible) return null;

  return (
    <_Modal visible={true} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <_View style={styles.overlay}>
        <_View
          style={[styles.container, getShadowStyle({ shadowOpacity: 0.2, shadowRadius: 16, elevation: 16 })]}
        >
          <_View style={styles.header}>
            <_View style={styles.headerTitleRow}>
              <Ionicons name="megaphone-outline" size={20} color="#007AFF" />
              <_Text style={styles.headerTitle}>お知らせ</_Text>
            </_View>
            <_TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </_TouchableOpacity>
          </_View>

          <_ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
            {NOTICE_ITEMS.map((section, idx) => (
              <_View key={idx} style={styles.section}>
                <_Text style={styles.sectionDate}>{section.date}</_Text>
                {!!section.title && <_Text style={styles.sectionTitle}>{section.title}</_Text>}
                {section.points.map((p, pIdx) => (
                  <_View key={pIdx} style={styles.pointRow}>
                    <_Text style={styles.pointBullet}>・</_Text>
                    <_Text style={[styles.pointText, section.boldPoints && styles.pointTextBold]}>{p}</_Text>
                  </_View>
                ))}
              </_View>
            ))}
          </_ScrollView>

          <_View style={styles.footer}>
            <_TouchableOpacity style={styles.checkboxRow} onPress={() => setDontShowAgain((prev) => !prev)}>
              <_View style={[styles.checkbox, dontShowAgain && styles.checkboxChecked]}>
                {dontShowAgain && <Ionicons name="checkmark" size={14} color="#FFF" />}
              </_View>
              <_Text style={styles.checkboxLabel}>次のお知らせが来るまで表示しない</_Text>
            </_TouchableOpacity>

            <_TouchableOpacity style={styles.closeFooterBtn} onPress={handleClose}>
              <_Text style={styles.closeFooterBtnText}>閉じる</_Text>
            </_TouchableOpacity>
          </_View>
        </_View>
      </_View>
    </_Modal>
  );
};

exports.WhatsNewModal = WhatsNewModal;

const styles = _StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '90%', maxWidth: 420, maxHeight: '80%', backgroundColor: '#FFF', borderRadius: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  closeBtn: { padding: 4 },
  body: { flexGrow: 0 },
  section: { marginBottom: 20 },
  sectionDate: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  pointRow: { flexDirection: 'row', marginBottom: 4, paddingLeft: 4 },
  pointBullet: { fontSize: 13, color: '#007AFF', marginRight: 4 },
  pointText: { fontSize: 13, color: '#3C3C43', flex: 1, lineHeight: 19 },
  pointTextBold: { fontWeight: 'bold', color: '#1C1C1E' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#EEE' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  checkboxLabel: { fontSize: 13, color: '#3C3C43' },
  closeFooterBtn: { backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  closeFooterBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
