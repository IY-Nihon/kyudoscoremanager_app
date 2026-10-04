'use strict';

/**
 * 記録画面の見た目の決まり。記録画面（RecordScreen.js）と、そこから切り出した窓で分け合う
 * （2026-10-05 に RecordScreen.js から移した）。
 */
const { StyleSheet } = require('./rn');
const { IS_WEB, SAFE_TOP_PADDING, WEB_TOP_PADDING } = require('./IS_WEB');
const { UIConfig } = require('./uiConfig');
const { getShadowStyle } = require('./shadowStyle');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF', paddingTop: IS_WEB ? WEB_TOP_PADDING : SAFE_TOP_PADDING },
  navBar: {
    minHeight: 48,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 細い画面では右の群が下の段へ回る。
    // 一列に詰め込むと端が切れて、押せないボタンが出てしまう
    flexWrap: 'wrap',
    rowGap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  syncContainer: { flexDirection: 'row', alignItems: 'center' },
  syncTimeText: { fontSize: 9, color: '#8E8E93' },
  // 群（ライブ／立ちの増減／表示の大きさ）どうしは離し、群の中はくっつける
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  resetBtn: {
    zIndex: 10001,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 2,
  },
  resetBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  groupBadge: {
    marginLeft: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupBadgeWeb: Object.assign(
    {
      backgroundColor: 'rgba(0,122,255,0.1)',
      borderColor: 'rgba(0,122,255,0.2)',
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    getShadowStyle({
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    })
  ),
  // ライブをリンクで配るボタン。ライブ中だけ出る
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
    marginRight: 6,
  },
  shareBtnText: { color: '#007AFF', fontSize: 11, fontWeight: 'bold' },
  liveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  liveBtnActive: { backgroundColor: '#FF3B30' },
  liveBtnText: { fontSize: 12, color: '#007AFF', fontWeight: 'bold' },
  liveBtnTextActive: { color: '#FFF' },
  zoomContainer: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  zoomBtn: { padding: 1 },
  shotsToggle: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    zIndex: 10001,
    minWidth: 34,
    alignItems: 'center',
  },
  shotsText: { fontSize: 13, color: '#5856D6', fontWeight: 'bold' },
  // 拡大率。押せることが分かるよう、軽く枠で囲う
  zoomToggle: {
    flexDirection: 'column',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    minWidth: 62,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLabel: { fontSize: 9, color: '#8E8E93', fontWeight: '600' },
  zoomValue: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  zoomText: { fontSize: 12, color: '#007AFF', fontWeight: 'bold' },
  // 拡大率のバー。溝そのものは細いので、当たり判定だけ広く取る
  バーの行: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF4',
  },
  溝の当たり: { flex: 1, height: 36, justifyContent: 'center' },
  溝: { height: 4, borderRadius: 2, backgroundColor: '#E5E5EA' },
  溝の済み: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: '#007AFF' },
  つまみ: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    ...(IS_WEB ? { boxShadow: '0 1px 4px rgba(0,0,0,0.3)' } : { elevation: 3 }),
  },
  バーの数字: { fontSize: 13, color: '#3C3C43', fontWeight: 'bold', minWidth: 44, textAlign: 'right' },
  liveStatusHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E8E93',
    gap: 6,
  },
  liveHostHeader: { backgroundColor: '#007AFF' },
  liveJoinHeader: { backgroundColor: '#007AFF' },
  liveActiveHeader: { backgroundColor: '#007AFF' },
  // ライブ名が長いときは、名前のほうを縮めて台数を残す。
  // 台数は「相手に届いているか」を見るためのもので、消えると意味が無い
  liveStatusText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', flexShrink: 1 },
  liveCount: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
  liveCountText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  // 期限が近いことの札。台数と同じ形にして、狭いときはライブ名の側を縮ませる。
  // 帯そのものが青（主催者）か灰（参加者）なので、札は赤地で浮かせる
  liveLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 5,
    borderRadius: 8,
  },
  liveLimitText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  gridArea: { flex: 1, backgroundColor: '#FFF' },
  tallWrapper: { flex: 1, flexDirection: 'column' },
  gridRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', minWidth: '100%' },
  fixedFooter: {
    flexDirection: 'row',
    height: UIConfig.footerHeight,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#C6C6C8',
  },
  footerLabelCell: {
    width: UIConfig.headerWidth,
    height: UIConfig.footerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  footerLabelText: { fontSize: 10, fontWeight: 'bold', color: '#3C3C43' },
  footerNameCell: {
    height: UIConfig.footerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 4,
  },
  footerName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  guestLabel: { fontSize: 9, color: '#8E8E93' },
  emptyOverlay: Object.assign({}, StyleSheet.absoluteFillObject, {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  }),
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#8E8E93' },
  // 帯を畳む取っ手の置き場。畳んでいても押せるように浮かせる。
  // 左右どちらに置くか（left / right）は描くときに足す
  帯の取っ手の置き場: {
    position: 'absolute',
    top: 8,
    // 引き始めで字の選択が始まらないように
    userSelect: 'none',
    // 表より上、他の画面より下。記録画面は他のタブへ移っても裏で生きているので、
    // 1e4 のように高くすると履歴のごみ箱など別の画面のボタンの上に乗る
    zIndex: 5,
  },
  帯の取っ手: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242,242,247,0.95)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    height: IS_WEB ? 70 : 80,
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  // はみ出しても隣を覆わないように、この箱の中で切る（念のための二重の備え）
  addBtns: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
  },
  addBtn: {
    flex: 1,
    // 狭い画面では縮ませる。minWidth を置くと入り切らないぶんが枠の外へ
    // あふれ、justifyContent: center のせいで左右へ均等に漏れて、
    // 隣のボタンを覆う。320px幅の端末で「並べ方」が押せなくなっていた
    minWidth: 0,
    maxWidth: 62,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addLabel: { fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  historyBtns: { flexDirection: 'row', gap: 2 },
  historyBtn: { padding: 4 },
  saveBtn: {
    // 保存は肯定的な操作。赤は「リセット」など戻せない操作のために取っておく。
    // 同じ赤だと、色から手がかりが取れない
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 64,
    justifyContent: 'center',
    flexShrink: 0,
  },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  // 区切りに付けるチーム名の入力欄
  チーム名の入力: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    marginTop: 4,
    marginBottom: 14,
  },
  feedbackOverlay: {
    position: 'absolute',
    bottom: 100,
    // 知らせの帯は見せるだけ。指は下の記録表へ通す。
    // 長押しで鍵を開けた直後は、まさにその下のますを押したいことが多い
    pointerEvents: 'none',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  feedbackText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
  modalInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonsRow: { flexDirection: 'row', width: '100%' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: 'bold' },
});

module.exports = { styles };
