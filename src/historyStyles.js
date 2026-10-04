'use strict';

/**
 * 履歴画面の見た目の決まり（2026-10-05 に HistoryScreen.js から移した）。
 */
const { StyleSheet } = require('./rn');
const { IS_WEB, SAFE_TOP_PADDING, WEB_TOP_PADDING } = require('./IS_WEB');
const { getShadowStyle } = require('./shadowStyle');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF', paddingTop: IS_WEB ? WEB_TOP_PADDING : SAFE_TOP_PADDING },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailContainer: { flex: 1 },
  // ゴミ箱の中の記録を見ているときの帯。見るだけだと一目で分かる色にする
  trashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#8E8E93',
  },
  trashBannerText: { flex: 1, minWidth: 0, color: '#FFF', fontSize: 13, fontWeight: '600' },
  trashBannerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFF' },
  trashBannerBtnText: { color: '#007AFF', fontSize: 14, fontWeight: 'bold' },
  detailHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  detailDate: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  detailTitle: { fontSize: 20, color: '#000', marginTop: 4, fontWeight: '600' },
  detailTableArea: { flex: 1, padding: 0 },
  listHeaderArea: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 0,
    borderBottomColor: '#F2F2F7',
  },
  adminDeactivate: { paddingBottom: 16 },
  adminDeactivateText: { color: '#FF3B30', fontSize: 13, fontWeight: '500' },
  listMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  searchContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 17, color: '#000' },
  yearSelectorContainer: { alignItems: 'center', marginBottom: 16 },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88,86,214,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  yearButtonText: { color: '#5856D6', fontSize: 17, fontWeight: '500' },
  // 横スクロールの器は、縦に伸びも縮みもさせない。
  //
  // 伸びる側（flexGrow:0）だけを止めていたが、縮む側が残っていた。
  // この器は縦に並ぶ器の直の子で、下の一覧が場所を欲しがると縦に潰され、
  // 中の月が上下で切れて、一覧が月に重なって見える（2026-09-09 に踏んだ）。
  // 月の札そのものと同じで、器も縮ませない。
  monthTabsScroll: { marginBottom: 12, flexGrow: 0, flexShrink: 0 },
  monthTabsContent: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  monthTab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(118,118,128,0.12)',
    // 横に並べる器の中では、既定で縮む。月が増えると幅の取り合いになり、
    // ボタンがつぶれて字が折り返す。縮ませずに、器のほうを横へ流す
    flexShrink: 0,
  },
  monthTabActive: { backgroundColor: '#007AFF' },
  monthTabText: { fontSize: 15, color: '#000', fontWeight: '500' },
  monthTabTextActive: { color: '#FFF' },
  tagFilterContainer: { paddingVertical: 8, backgroundColor: '#FFF' },
  tagAndLogicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logicToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 8,
    padding: 2,
    marginRight: 16,
    marginLeft: 8,
  },
  logicBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  logicBtnActive: Object.assign(
    { backgroundColor: '#FFF' },
    getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 2,
    })
  ),
  logicBtnText: { fontSize: 10, fontWeight: 'bold', color: '#8E8E93' },
  logicBtnTextActive: { color: '#007AFF' },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(118,118,128,0.12)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagChipActive: { backgroundColor: '#E1F0FF', borderColor: '#007AFF' },
  tagChipText: { fontSize: 13, color: '#3A3A3C' },
  tagChipTextActive: { color: '#007AFF', fontWeight: '600' },
  listContent: { paddingHorizontal: 0 },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  itemLeft: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  itemDateText: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  itemTitleText: { fontSize: 13, color: '#007AFF', fontWeight: 'bold' },
  itemSubText: { fontSize: 13, color: '#000' },
  itemTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  itemTagChip: {
    backgroundColor: 'rgba(0,122,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,122,255,0.2)',
  },
  itemTagText: { fontSize: 10, color: '#007AFF', fontWeight: '500' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countBadge: {
    backgroundColor: 'rgba(52,199,89,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: { color: '#34C759', fontSize: 14, fontWeight: 'bold' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8', marginLeft: 20 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 100, fontSize: 17 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearModal: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, width: 280 },
  yearModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  yearOption: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  yearOptionSelected: { backgroundColor: 'rgba(0,122,255,0.05)' },
  yearOptionText: { fontSize: 17, textAlign: 'center' },
  yearOptionTextSelected: { color: '#007AFF', fontWeight: 'bold' },
  batchDeleteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  batchDeleteText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
  },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
  modalButtonsRow: { flexDirection: 'row', width: '100%' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  adminMenuContent: Object.assign(
    {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: 8,
      // 「記録の情報を変える」と説明の行が 1 行で収まる幅。200 では折れた
      width: 260,
      maxWidth: '90%',
      position: 'absolute',
      top: 100,
      right: 20,
    },
    getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    })
  ),
  adminMenuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  adminMenuText: { fontSize: 16, color: '#000' },
});

module.exports = { styles };
