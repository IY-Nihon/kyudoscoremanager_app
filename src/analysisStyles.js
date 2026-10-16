'use strict';

const { 色 } = require('./iro.js');
/**
 * 分析画面の見た目の決まり。分析画面（AnalysisScreen.js）と部員の詳細の窓（AnalysisMemberDetail.js）で
 * 分け合う（2026-10-05 に AnalysisScreen.js から移した）。
 */
const { StyleSheet } = require('./rn');
const { SAFE_TOP_PADDING } = require('./IS_WEB');
const { getShadowStyle } = require('./shadowStyle');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 色.地 },
  header: {
    paddingHorizontal: 20,
    paddingTop: SAFE_TOP_PADDING + 10,
    paddingBottom: 15,
    backgroundColor: 色.白,
    borderBottomWidth: 1,
    borderBottomColor: 色.地_濃い,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: 色.文字 },
  content: { padding: 16 },
  filtersCard: Object.assign(
    { backgroundColor: 色.白, borderRadius: 16, padding: 16, marginBottom: 16 },
    getShadowStyle({ shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 })
  ),
  segmentLabel: { fontSize: 13, fontWeight: 'bold', color: 色.灰, marginBottom: 10, width: 60 },
  segmentWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 色.地,
    borderRadius: 12,
    padding: 3,
    height: 52,
  },
  segmentButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  segmentButtonActive: Object.assign(
    { backgroundColor: 色.白 },
    getShadowStyle({ shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 })
  ),
  segmentText: { fontSize: 13, color: 色.灰, fontWeight: 'bold' },
  segmentTextActive: { color: 色.青 },
  customRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 色.地,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  dateBtn: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 13, color: 色.文字, fontWeight: '600' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 色.地,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  monthNavBtn: { padding: 4 },
  monthNavText: { fontSize: 15, fontWeight: 'bold', color: 色.文字, marginHorizontal: 20 },
  rankingSettingsContainer: { marginTop: 8, padding: 12, backgroundColor: 色.地_F9F9FB, borderRadius: 12 },
  rankingSettingsLabel: { fontSize: 12, fontWeight: 'bold', color: 色.灰, marginBottom: 8 },
  ratioButtonRow: { flexDirection: 'row', gap: 8 },
  ratioBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: 色.白,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 色.地_濃い,
    alignItems: 'center',
  },
  ratioBtnActive: { backgroundColor: 色.青, borderColor: 色.青 },
  ratioBtnText: { fontSize: 11, color: 色.灰, fontWeight: 'bold' },
  ratioBtnTextActive: { color: 色.白 },
  ratioHintText: { fontSize: 10, color: 色.灰, marginTop: 8, textAlign: 'center' },
  customShotsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  customShotsInput: {
    flex: 1,
    height: 32,
    backgroundColor: 色.白,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 色.地_濃い,
    paddingHorizontal: 10,
    fontSize: 13,
    color: 色.文字,
  },
  customShotsUnit: { fontSize: 12, color: 色.灰, fontWeight: '600' },
  customShotsBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 色.地_濃い, borderRadius: 8 },
  customShotsBtnActive: { backgroundColor: 色.青 },
  customShotsBtnText: { fontSize: 12, fontWeight: 'bold', color: 色.灰 },
  customShotsBtnTextActive: { color: 色.白 },
  filterDivider: { height: 1, backgroundColor: 色.地, marginVertical: 4 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 13, color: 色.文字, fontWeight: '600' },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: 色.地_濃い },
  miniBtnActive: { backgroundColor: 色.緑 },
  miniBtnText: { fontSize: 11, fontWeight: 'bold', color: 色.灰 },
  miniBtnTextActive: { color: 色.白 },
  memberDashboard: Object.assign(
    { backgroundColor: 色.白, borderRadius: 20, padding: 20, marginBottom: 16 },
    getShadowStyle({ shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 })
  ),
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  dashboardTitle: { fontSize: 18, fontWeight: 'bold', color: 色.文字 },
  dashboardPeriod: { fontSize: 12, color: 色.灰 },
  mainStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  mainStatItem: { flex: 1, backgroundColor: 色.青の地_6, padding: 16, borderRadius: 16 },
  mainStatLabel: { fontSize: 12, color: 色.灰, marginBottom: 4 },
  mainStatValue: { fontSize: 24, fontWeight: 'bold', color: 色.青 },
  graphContainer: { marginBottom: 10 },
  graphTitle: { fontSize: 14, fontWeight: 'bold', color: 色.文字_三 },
  noDataGraph: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 色.地,
    borderRadius: 12,
  },
  trendUnitSelector: { flexDirection: 'row', backgroundColor: 色.地_濃い, borderRadius: 8, padding: 2 },
  unitBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  unitBtnActive: { backgroundColor: 色.白 },
  unitBtnText: { fontSize: 10, fontWeight: 'bold', color: 色.灰 },
  unitBtnTextActive: { color: 色.青 },
  sectionSubTitle: { fontSize: 14, fontWeight: 'bold', color: 色.文字_三, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: 色.地, padding: 10, borderRadius: 12, alignItems: 'center' },
  statBoxTitle: { fontSize: 10, color: 色.灰, marginBottom: 4 },
  statBoxRateDash: { fontSize: 16, fontWeight: 'bold', color: 色.文字 },
  statBoxRate: { fontSize: 18, fontWeight: 'bold', color: 色.青 },
  statBoxCounts: { fontSize: 10, color: 色.灰 },
  patternsCardDash: { backgroundColor: 色.地, padding: 16, borderRadius: 16 },
  patternsCard: { backgroundColor: 色.地_F8F8F8, padding: 16, borderRadius: 16 },
  patternLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  patternLabelText: { fontSize: 12, color: 色.文字_三, fontWeight: '600' },
  barContainer: { height: 8, backgroundColor: 色.地_濃い, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  patternValueText: { fontSize: 12, color: 色.文字, fontWeight: 'bold' },
  // 比較中の「全体の的中率」。比べている人ぶん、縦に並べる
  比較の的中率: { marginTop: 8, marginBottom: 4, gap: 4 },
  比較の的中率の行: { flexDirection: 'row', alignItems: 'center' },
  // 名前は色で見分ける（グラフの線と同じ並びの色）。長い名前は縮める
  比較の的中率の名: { fontSize: 13, fontWeight: '700', flex: 1, minWidth: 0 },
  比較の的中率の数: { fontSize: 15, fontWeight: 'bold', color: 色.文字, marginLeft: 8 },
  比較の的中率の内訳: { fontSize: 11, color: 色.灰, marginLeft: 6, minWidth: 48, textAlign: 'right' },
  // 的中の型。○×を4つ並べるので、字が詰まらないよう間を空ける
  型の組: { marginBottom: 12 },
  // 見出しの行。押して開く・畳むので、行ごと押せる幅にする
  型の見出しの行: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  型の要点の行: { fontSize: 11, color: 色.灰, marginTop: 2 },
  // 単位（一射・一手・4射）の区切り
  型の区切り: { fontSize: 12, fontWeight: 'bold', color: 色.文字_三, marginTop: 10, marginBottom: 6 },
  型の無し: { fontSize: 12, color: 色.灰, flexShrink: 0 },
  型の見出し: { fontSize: 12, color: 色.灰, fontWeight: '600', marginBottom: 4 },
  型の行: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  型の印: { fontSize: 13, color: 色.文字, fontWeight: 'bold', letterSpacing: 1, flexShrink: 0 },
  // 要点が長いとき（「2本目・3本目・留矢を抜いた」）は、ここが縮んで省略される。
  // 回数まで押し出されると、何立だったのかが分からなくなる
  型の要点: { fontSize: 12, color: 色.文字_三, flex: 1, flexShrink: 1 },
  型の回数: { fontSize: 12, color: 色.文字, fontWeight: 'bold', flexShrink: 0 },
  searchBarContainer: { marginBottom: 12 },
  searchBar: Object.assign(
    {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 色.白,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    getShadowStyle({ shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 })
  ),
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: 色.文字 },
  listContainer: { gap: 10 },
  rowCard: Object.assign(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 色.白,
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
    backgroundColor: 色.地,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: { fontSize: 12, fontWeight: 'bold', color: 色.灰 },
  // 名前の入れ物も縮めるようにしておく。ここが縮まないと、
  // 親に flex:1 を入れても中の長い名前が押し出してしまう
  nameContainer: { gap: 2, flex: 1, minWidth: 0 },
  memberName: { fontSize: 16, fontWeight: '600', color: 色.文字 },
  memberSub: { fontSize: 11, color: 色.灰 },
  // 的中率は縮ませない。左が長くても隠れないようにする
  rowRight: { alignItems: 'flex-end', flexShrink: 0, marginLeft: 8 },
  rateText: { fontSize: 17, fontWeight: 'bold', color: 色.青 },
  shotScoreText: { fontSize: 11, color: 色.灰 },
  noDataText: { textAlign: 'center', color: 色.灰, marginTop: 40, fontSize: 15 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 色.地 },
  tagChipActive: { backgroundColor: 色.青 },
  tagChipText: { fontSize: 12, fontWeight: '600', color: 色.灰 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 色.白, borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 色.文字, marginBottom: 4, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: 色.灰, marginBottom: 20, textAlign: 'center' },
  closeBtn: {
    backgroundColor: 色.青,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  pointDetailCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 色.青の地_6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 色.地_濃い,
  },
  detailLabel: { fontSize: 13, fontWeight: 'bold', color: 色.青 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  detailText: { fontSize: 12, color: 色.文字_三 },
  detailStats: { fontSize: 12, fontWeight: 'bold', color: 色.文字 },
  detailMore: { fontSize: 10, color: 色.灰, marginTop: 4, textAlign: 'center' },
});

module.exports = { styles };
