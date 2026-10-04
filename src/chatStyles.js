'use strict';

/**
 * AI チャットの見た目の決まり（2026-10-05 に AIChatBot.js から移した）。
 */
const { StyleSheet } = require('./rn');

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    // 引き始めで字の選択が始まらないように
    userSelect: 'none',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chatContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FFF',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  closeBtn: { padding: 4 },
  // 背景は #F8F8F8 ではなくアプリ標準の #F2F2F7 を使う。
  // #F8F8F8 はダーク時に #2C2C2E へ変換され、AI側の吹き出し(#E5E5EA→#2C2C2E)と
  // 同色になって吹き出しの輪郭が消えてしまうため。
  messageArea: { flex: 1, backgroundColor: '#F2F2F7' },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 18, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: '#E5E5EA', borderBottomLeftRadius: 4 },
  // 答えの吹き出しの左に、小さなキャラクターを置く（吹き出しの下の端にそろえる）
  答えの行: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginBottom: 12,
  },
  答えの絵: { marginRight: 6, marginBottom: 4 },
  答えの吹き出し: { flexShrink: 1, maxWidth: '88%', marginBottom: 0 },
  // 質問例（入口）。何を聞けるかが分からないまま閉じられるのを防ぐ
  例の枠: { marginTop: 14, paddingHorizontal: 2 },
  例の前置き: { fontSize: 12, color: '#8E8E93', marginBottom: 8, paddingHorizontal: 4 },
  // 分類ごとの1段。左に分類、右に横へ流す札
  例の段: { marginBottom: 8 },
  例の分類: { fontSize: 11, color: '#8E8E93', marginBottom: 3, paddingHorizontal: 4 },
  例の並び: { paddingRight: 12 },
  例の行: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    marginRight: 6,
    // 幅は決めない。決めると長い文の末尾が切れる。
    // 1行のまま札を伸ばし、はみ出したぶんは横へ流して見てもらう
  },
  例の字: { fontSize: 13, color: '#007AFF' },
  例の断り: { fontSize: 11, color: '#8E8E93', marginTop: 2, paddingHorizontal: 4 },
  // 打ちかけの続き（入力欄の中に重ねる層）。
  // 入力欄と同じ位置・同じ字の大きさにしないと、文字がずれて二重に見える
  // 入力欄をぴったり包む枠。重ねる層はこの中で位置を決める
  入力の枠: { flex: 1, marginRight: 8, position: 'relative' },
  // 入力欄と同じ余白（左右16・上下8）にそろえる
  続きの層: { position: 'absolute', left: 16, right: 16, top: 8, bottom: 8, zIndex: 1 },
  // 字の大きさと行の高さも入力欄と同じにする。違うと重ならない
  続きの字: { fontSize: 15, lineHeight: 20, color: '#C7C7CC' },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: '#FFF' },
  modelText: { color: '#1C1C1E' },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  // 部員を何人も頼んだとき、カードを1枚ずつ押さずに済むよう入力欄の上に出す
  まとめて承認の段: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#F9F9FB',
  },
  まとめて承認の文: { flex: 1, fontSize: 13, color: '#3A3A3C' },
  actionBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
});

module.exports = { styles };
