'use strict';

/**
 * 分析画面の見た目の決まり。分析画面（AnalysisScreen.js）と部員の詳細の窓（AnalysisMemberDetail.js）で
 * 分け合う（2026-10-05 に AnalysisScreen.js から移した）。
 */
const { StyleSheet } = require('./rn');
const { SAFE_TOP_PADDING } = require('./IS_WEB');
const { getShadowStyle } = require('./shadowStyle');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: SAFE_TOP_PADDING + 10,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E' },
  content: { padding: 16 },
  filtersCard: Object.assign(
    { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 },
    getShadowStyle({ shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 })
  ),
  segmentLabel: { fontSize: 13, fontWeight: 'bold', color: '#8E8E93', marginBottom: 10, width: 60 },
  segmentWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 3,
    height: 52,
  },
  segmentButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  segmentButtonActive: Object.assign(
    { backgroundColor: '#FFF' },
    getShadowStyle({ shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 })
  ),
  segmentText: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold' },
  segmentTextActive: { color: '#007AFF' },
  customRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  dateBtn: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 13, color: '#1C1C1E', fontWeight: '600' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  monthNavBtn: { padding: 4 },
  monthNavText: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', marginHorizontal: 20 },
  rankingSettingsContainer: { marginTop: 8, padding: 12, backgroundColor: '#F9F9FB', borderRadius: 12 },
  rankingSettingsLabel: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginBottom: 8 },
  ratioButtonRow: { flexDirection: 'row', gap: 8 },
  ratioBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  ratioBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  ratioBtnText: { fontSize: 11, color: '#8E8E93', fontWeight: 'bold' },
  ratioBtnTextActive: { color: '#FFF' },
  ratioHintText: { fontSize: 10, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  customShotsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  customShotsInput: {
    flex: 1,
    height: 32,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#1C1C1E',
  },
  customShotsUnit: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  customShotsBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#E5E5EA', borderRadius: 8 },
  customShotsBtnActive: { backgroundColor: '#007AFF' },
  customShotsBtnText: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93' },
  customShotsBtnTextActive: { color: '#FFF' },
  filterDivider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 4 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 13, color: '#1C1C1E', fontWeight: '600' },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E5E5EA' },
  miniBtnActive: { backgroundColor: '#34C759' },
  miniBtnText: { fontSize: 11, fontWeight: 'bold', color: '#8E8E93' },
  miniBtnTextActive: { color: '#FFF' },
  memberDashboard: Object.assign(
    { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16 },
    getShadowStyle({ shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 })
  ),
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  dashboardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  dashboardPeriod: { fontSize: 12, color: '#8E8E93' },
  mainStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  mainStatItem: { flex: 1, backgroundColor: '#F8F9FF', padding: 16, borderRadius: 16 },
  mainStatLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  mainStatValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  graphContainer: { marginBottom: 10 },
  graphTitle: { fontSize: 14, fontWeight: 'bold', color: '#3A3A3C' },
  noDataGraph: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  trendUnitSelector: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2 },
  unitBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  unitBtnActive: { backgroundColor: '#FFF' },
  unitBtnText: { fontSize: 10, fontWeight: 'bold', color: '#8E8E93' },
  unitBtnTextActive: { color: '#007AFF' },
  sectionSubTitle: { fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#F2F2F7', padding: 10, borderRadius: 12, alignItems: 'center' },
  statBoxTitle: { fontSize: 10, color: '#8E8E93', marginBottom: 4 },
  statBoxRateDash: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  statBoxRate: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  statBoxCounts: { fontSize: 10, color: '#8E8E93' },
  patternsCardDash: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 16 },
  patternsCard: { backgroundColor: '#F8F8F8', padding: 16, borderRadius: 16 },
  patternLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  patternLabelText: { fontSize: 12, color: '#3A3A3C', fontWeight: '600' },
  barContainer: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  patternValueText: { fontSize: 12, color: '#1C1C1E', fontWeight: 'bold' },
  // 比較中の「全体の的中率」。比べている人ぶん、縦に並べる
  比較の的中率: { marginTop: 8, marginBottom: 4, gap: 4 },
  比較の的中率の行: { flexDirection: 'row', alignItems: 'center' },
  // 名前は色で見分ける（グラフの線と同じ並びの色）。長い名前は縮める
  比較の的中率の名: { fontSize: 13, fontWeight: '700', flex: 1, minWidth: 0 },
  比較の的中率の数: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', marginLeft: 8 },
  比較の的中率の内訳: { fontSize: 11, color: '#8E8E93', marginLeft: 6, minWidth: 48, textAlign: 'right' },
  // 的中の型。○×を4つ並べるので、字が詰まらないよう間を空ける
  型の組: { marginBottom: 12 },
  // 見出しの行。押して開く・畳むので、行ごと押せる幅にする
  型の見出しの行: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  型の要点の行: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  // 単位（一射・一手・4射）の区切り
  型の区切り: { fontSize: 12, fontWeight: 'bold', color: '#3A3A3C', marginTop: 10, marginBottom: 6 },
  型の無し: { fontSize: 12, color: '#8E8E93', flexShrink: 0 },
  型の見出し: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
  型の行: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  型の印: { fontSize: 13, color: '#1C1C1E', fontWeight: 'bold', letterSpacing: 1, flexShrink: 0 },
  // 要点が長いとき（「2本目・3本目・留矢を抜いた」）は、ここが縮んで省略される。
  // 回数まで押し出されると、何立だったのかが分からなくなる
  型の要点: { fontSize: 12, color: '#3A3A3C', flex: 1, flexShrink: 1 },
  型の回数: { fontSize: 12, color: '#1C1C1E', fontWeight: 'bold', flexShrink: 0 },
  searchBarContainer: { marginBottom: 12 },
  searchBar: Object.assign(
    {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    getShadowStyle({ shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 })
  ),
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  listContainer: { gap: 10 },
  rowCard: Object.assign(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFF',
      padding: 12,
      borderRadius: 12,
    },
    getShadowStyle({ shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 })
  ),
  // 名前が長いと、右の的中率を押しのけて重なっていた。
  // 左は余った幅ぶんだけ広がり、狭くなったら縮む（flex:1 + minWidth:0）。
  // 右は縮ませない（flexShrink:0）ので、的中率が隠れない
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93' },
  // 名前の入れ物も縮めるようにしておく。ここが縮まないと、
  // 親に flex:1 を入れても中の長い名前が押し出してしまう
  nameContainer: { gap: 2, flex: 1, minWidth: 0 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  memberSub: { fontSize: 11, color: '#8E8E93' },
  // 的中率は縮ませない。左が長くても隠れないようにする
  rowRight: { alignItems: 'flex-end', flexShrink: 0, marginLeft: 8 },
  rateText: { fontSize: 17, fontWeight: 'bold', color: '#007AFF' },
  shotScoreText: { fontSize: 11, color: '#8E8E93' },
  noDataText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 15 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F2F2F7' },
  tagChipActive: { backgroundColor: '#007AFF' },
  tagChipText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#8E8E93', marginBottom: 20, textAlign: 'center' },
  closeBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  pointDetailCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  detailLabel: { fontSize: 13, fontWeight: 'bold', color: '#007AFF' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  detailText: { fontSize: 12, color: '#3A3A3C' },
  detailStats: { fontSize: 12, fontWeight: 'bold', color: '#1C1C1E' },
  detailMore: { fontSize: 10, color: '#8E8E93', marginTop: 4, textAlign: 'center' },
});

module.exports = { styles };
