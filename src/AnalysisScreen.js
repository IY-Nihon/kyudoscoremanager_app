'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const ScrollView = require('./ScrollView').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const Modal = require('./Modal').default;
const TextInput = require('./TextInput').default;
const { SAFE_TOP_PADDING } = require('./IS_WEB');
const 案内 = require('./TutorialGuide');
// 「自分が写っているか」の判定。履歴画面・案内の見本と同じものを使う
const { 自分の記録か, 学年でまとめる } = require('./syncRules');
// 「その射は誰のものか」の決まりは1か所に寄せてある（src/statsRules.js）
const 集 = require('./statsRules');
// 比較のひな型（よく見る組み合わせ）の決まり
const ひ = require('./comparePresets');
// 弓具を変えた前後で的中率がどう動いたか（src/equipmentTrend.js）
const 弓 = require('./equipmentTrend');
const RN画面 = require('react-native');
const { 出す } = require('./AppDialog');
const { useScoreStore } = require('./useScoreStore');
const Icons = require('@expo/vector-icons');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const { use横流し } = require('./yokoNagashi');
const { getShadowStyle } = require('./shadowStyle');
const Svgの部品 = require('react-native-svg');
const Svg = require('react-native-svg').default ?? require('react-native-svg');
const { ArrowLocationView } = require('./ArrowLocationView');
// 比較相手を見分けるための色。グラフ・矢所・立ち順別・結果分布で同じ順に使う。
// 別々に書いていたころは、増やしたときに片方だけ色がずれる心配があった
// 明るい面でも暗い面でも読める色を選ぶ。緑・橙・黄をそのまま使っていたころは、
// 白いカードの上で比が 2.2／2.2／1.5 しかなく、名前も丸も薄くて追えなかった。
// 濃いほうを置いて、暗い面では theme.js が鮮やかな色に戻す
// 比較相手を見分ける色。名前も隣に出るので、色は補助の手がかり。
// それでも、色覚によって同じに見える組は避ける。
// 元は最後が #8B6D00（黄土）で、#C93400（濃い橙）とD型で隔たり2.6しかなく、
// ほぼ同じ色に見えていた。#0000CF に替えて 14.1 まで広げてある。
// 健常色覚での最小は 25.9 のまま変わらない（scripts で測って決めた）
/**
 * 弓具を変えた前後の節。個人の詳細に出す。
 *
 * 数字は「弓具のせい」を意味しない。前後で動いても、時期・体調・相手が
 * 絡む。射数が少なければなお揺れる。だから射数も一緒に出し、
 * 言い切らない言葉を添える（src/equipmentTrend.js の 見立ての言葉）
 */
/**
 * 弓具の履歴がまだ無い人に出す案内。
 *
 * 何も出さないと、この節そのものが在ることに気づけない。
 * 記録するところ（メンバー → 弓具管理）だけを伝える。
 */
function 弓具の案内() {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 4 }}>
        弓具を変えた前後
      </Text>
      <Text style={{ fontSize: 11, color: '#8E8E93', lineHeight: 16 }}>
        まだ弓具の記録がありません。メンバーの画面で「弓具管理」から弓力・矢・弦の変更を残すと、その前後の的中がここに並びます。
      </Text>
    </View>
  );
}
/**
 * 的中の型の節。「三中のうちどこで抜いたか」を並べる。
 *
 * 結果分布（皆中・三中…）は中り数までしか見ないので、同じ三中でも
 * 「留矢を抜いた」のか「初矢を抜いた」のかが分からなかった。
 *
 * 数える決まりは statsRules（型を並べる）に置いてある。ここは並べるだけ。
 * 個人の詳細と、部員として入ったときの自分の画面の2か所から呼ぶ。
 *
 * 比較中は人数ぶん並べる。誰の型かが分かるよう、名前の見出しを付ける
 * （もとは「16通りを人数ぶん並べても読めない」として出していなかったが、
 *  本人の分だけが残るので、かえって紛らわしかった）。
 *
 * @param {any} 成績 statsRules.成績を数える の返り
 * @param {string|null} 期間の名 推移の点を押しているときの期間（見出しに出す）
 * @param {string|null} 誰の 比較中に出す名前の見出し。単体で見るときは渡さない
 */
function 型の節(成績, 期間の名, 誰の) {
  // 開く・畳むを覚える部品にした。比較中は人ぶん並ぶので、名前で鍵を分ける
  return <型の節の部品 key={誰の ? `型:${誰の}` : '型'} 成績={成績} 期間の名={期間の名} 誰の={誰の} />;
}
/**
 * 型の節の中身。見出しを押すと開く（既定は畳む）。
 *
 * もとは常に開いていたが、16通りが縦に並ぶと個人の詳細が長くなり、
 * 下の弓具の節まで遠かった。畳んでいる間は、要点だけを1行で出す。
 *
 * 4射の型のほかに、一射のとき（1本しか引いていない記録）と一手のとき（2本だけ
 * 引いた記録）の的中率も出す（2026-09-14 に使う人が求めた。「人たちで一本しか
 * 引いていないとき」の的中率）。一手は1本目が甲矢・2本目が乙矢なので、どちらを
 * 抜いたかを言える（四つ矢では甲矢・乙矢が2回ずつ現れて区別できないが、一手の中なら決まる）
 */
function 型の節の部品({ 成績, 期間の名, 誰の }) {
  const [開いている, set開いている] = React.useState(false);
  const 並び = 集.型を並べる((成績 || {}).型 || {});
  const 一射 = (成績 || {}).一射 || { shots: 0, hits: 0 };
  const 一手 = (成績 || {}).一手 || { shots: 0, hits: 0, 型: {} };
  const 手の並び = 集.一手の型を並べる(一手.型 || {});
  if (!並び.length && !一射.shots && !一手.shots) return null;
  // 中り数ごとにまとめて、見出しを1回だけ出す。
  // 型ごとに「三中」を繰り返すと、同じ字が縦に並んで読みにくい
  const 束 = [];
  for (const 型1つ of 並び) {
    const 尻 = 束[束.length - 1];
    if (尻 && 尻.中り === 型1つ.中り) 尻.型たち.push(型1つ);
    else 束.push({ 中り: 型1つ.中り, 呼び名: 型1つ.呼び名, 型たち: [型1つ] });
  }
  const 手の数 = 手の並び.reduce((計, 型1つ) => 計 + 型1つ.回数, 0);
  const 立ちの数 = 並び.reduce((計, 型1つ) => 計 + 型1つ.回数, 0);
  const 率 = (数) => (数.shots > 0 ? ((数.hits / 数.shots) * 100).toFixed(1) + '%' : null);
  const 立ちの皆中 = 並び.find((型1つ) => 型1つ.型 === '○○○○');
  // 畳んでいる間の要点。開かなくても、いちばん見たい数字は分かるように。
  // 無いものは出さない（「一射 —」が並ぶと、何が無いのか分からない）
  const 要点 = [
    一射.shots > 0 ? `一射 ${率(一射)}` : null,
    一手.shots > 0 ? `一手 ${率(一手)}` : null,
    立ちの数 > 0 ? `皆中 ${Math.round(((立ちの皆中 ? 立ちの皆中.回数 : 0) / 立ちの数) * 100)}%` : null,
  ]
    .filter(Boolean)
    .join('　');
  return (
    <View style={{ marginBottom: 20 }}>
      <TouchableOpacity
        testID="的中の型の見出し"
        accessibilityRole="button"
        accessibilityState={{ expanded: 開いている }}
        accessibilityLabel={(開いている ? '的中の型を畳む' : '的中の型を開く') + (誰の ? `（${誰の}）` : '')}
        onPress={() => set開いている(!開いている)}
        style={styles.型の見出しの行}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.sectionSubTitle, { marginBottom: 0 }]}>
            {/* 比較中は誰の型かが分からないと読めないので、名前を見出しに出す */}
            {誰の ? `的中の型 — ${誰の}` : 期間の名 ? `的中の型 (${期間の名})` : '的中の型'}
          </Text>
          {!開いている && (
            <Text style={styles.型の要点の行} numberOfLines={1}>
              {要点 + '　押すと開く'}
            </Text>
          )}
        </View>
        <Icons.Ionicons name={開いている ? 'chevron-up' : 'chevron-down'} size={18} color="#8E8E93" />
      </TouchableOpacity>
      {開いている && (
        <View style={[styles.patternsCardDash, { marginTop: 12 }]}>
          {/* 一射のとき。1本しか引いていない記録の的中率 */}
          <Text style={styles.型の区切り}>一射のとき（1本だけ引いた記録）</Text>
          <View style={styles.型の行}>
            <Text style={styles.型の要点}>的中率</Text>
            <Text style={一射.shots > 0 ? styles.型の回数 : styles.型の無し}>
              {一射.shots > 0 ? 率(一射) + '（' + 一射.hits + '中／' + 一射.shots + '射）' : 'まだありません'}
            </Text>
          </View>
          {/* 一手のとき。2本だけ引いた記録の的中率と、2射の型 */}
          <Text style={styles.型の区切り}>
            {'一手のとき（2本だけ引いた記録）' + (手の数 > 0 ? '　' + 手の数 + '手' : '')}
          </Text>
          <View style={styles.型の行}>
            <Text style={styles.型の要点}>的中率</Text>
            <Text style={一手.shots > 0 ? styles.型の回数 : styles.型の無し}>
              {一手.shots > 0 ? 率(一手) + '（' + 一手.hits + '中／' + 一手.shots + '射）' : 'まだありません'}
            </Text>
          </View>
          {[
            ...手の並び.map((型1つ) => (
              <View key={'手' + 型1つ.型} style={styles.型の行}>
                <Text style={styles.型の印}>{型1つ.型}</Text>
                <Text style={styles.型の要点} numberOfLines={1}>
                  {型1つ.要点 ? 型1つ.呼び名 + '　' + 型1つ.要点 : 型1つ.呼び名}
                </Text>
                <Text style={styles.型の回数}>
                  {型1つ.回数}
                  {'手 '}
                  {Math.round(型1つ.割合)}%
                </Text>
              </View>
            )),
          ]}
          {/* 4射単位。立ちの型 */}
          {束.length > 0 && <Text style={styles.型の区切り}>{'4射単位（立ち）　' + 立ちの数 + '立'}</Text>}
          {[
            ...束.map((組) => (
              <View key={組.中り} style={styles.型の組}>
                <Text style={styles.型の見出し}>
                  {組.呼び名} {組.型たち.reduce((計, 型1つ) => 計 + 型1つ.回数, 0)}立
                </Text>
                {[
                  ...組.型たち.map((型1つ) => (
                    <View key={型1つ.型} style={styles.型の行}>
                      <Text style={styles.型の印}>{型1つ.型}</Text>
                      <Text style={styles.型の要点} numberOfLines={1}>
                        {型1つ.要点 || ''}
                      </Text>
                      <Text style={styles.型の回数}>
                        {型1つ.回数}
                        {'立 '}
                        {Math.round(型1つ.割合)}%
                      </Text>
                    </View>
                  )),
                ]}
              </View>
            )),
          ]}
        </View>
      )}
      {開いている && (
        <Text style={{ fontSize: 11, color: '#8E8E93', marginTop: 8, lineHeight: 16 }}>
          ※
          4射単位の割合は同じ中り数の中での割合です（三中のうち、その抜き方が何割か）。一手のときの型の割合は、その手すべての中での割合です。
        </Text>
      )}
    </View>
  );
}
function 弓具の節(人, 記録たち) {
  const 並び = 弓.弓具の移り変わり(人, 記録たち);
  // 履歴が無い人には、どこで記録するかだけ出す。
  // 何も出さないと、この節そのものが在ることに気づけない
  // （実際「分析で見たい」と二度言われた。作ってあったが空だった）
  if (!並び.length) return 弓具の案内();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 4 }}>
        弓具を変えた前後
      </Text>
      <Text style={{ fontSize: 11, color: '#8E8E93', marginBottom: 10, lineHeight: 16 }}>
        その弓具を使っていた間の成績です。次に変えた日の前日までを数えます。的中の動きが弓具のせいとは限りません。
      </Text>
      {[
        ...並び.map((一件) => (
          <View
            key={一件.変更.id || String(一件.変更.date)}
            style={{ backgroundColor: '#F2F2F7', borderRadius: 8, padding: 10, marginBottom: 8 }}
          >
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' }}>
              {new Date(一件.変更.date).toLocaleDateString() +
                '　' +
                (一件.変更.weight ? 一件.変更.weight + 'kg へ' : 一件.種類)}
            </Text>
            {一件.変更.note ? (
              <Text style={{ fontSize: 12, color: '#3C3C43', marginTop: 2 }}>{一件.変更.note}</Text>
            ) : null}
            <Text style={{ fontSize: 12, color: '#3C3C43', marginTop: 4, lineHeight: 17 }}>
              {弓.見立ての言葉(一件)}
            </Text>
          </View>
        )),
      ]}
    </View>
  );
}
const 比較の色たち = ['#FF2D55', '#248A3D', '#C93400', '#AF52DE', '#056B7A', '#5856D6', '#0000CF'];
const AnalysisScreen = ({ navigation }) => {
  const {
    analysisSelectedTags = [],
    analysisTagLogic = 'AND',
    tagTemplates = [],
    setAnalysisSelectedTags,
    toggleAnalysisTag,
    setAnalysisTagLogic,
    analysisRankingSettings = {},
    setAnalysisRankingSetting,
    activeRole,
    myMemberId,
    sessions = [],
    members = [],
    alumni = [],
    shotsPerRound = 8,
    showAlumniInAnalysis,
    setShowAlumniInAnalysis: setAlumni,
    isHydrated,
    arrowTargetType,
    setSelectedHistorySessionId,
    setHistoryViewMode,
    setFocusedMemberId,
    比較のひな型: ひな型たち = [],
    比較のひな型を足す,
    比較のひな型を消す,
    activeGroupId: いまの団体id,
    // 案内が見本を出しているあいだは、中身だけ見本に差し替わる
  } = 案内.見本を重ねる(useScoreStore());
  const 自分の名前 = useScoreStore((状態) => 状態.myMemberName) || '';
  const [compareMembers, setCompareMembers] = React.useState([]);
  const [isSelectingCompareTarget, setIsSelectingCompareTarget] = React.useState(false);
  // ひな型に付ける名前。窓を閉じたら捨てる（書きかけを持ち越さない）
  const [ひな型の名前, ひな型の名前を置く] = React.useState('');
  // 320px の端末では、名前と立数の柱を引くと1マスが40pxほどしか残らない。
  // そこに率と（的中/射数）を積むと、字が枠を越えて隣と重なる。
  // 狭いときは率だけにする。射数は右端の柱に出ているので、意味は落ちない
  const 画面の幅 = RN画面.useWindowDimensions().width;
  const 狭い画面 = 画面の幅 < 360;
  // 比較する相手も学年でまとめる。記録表の人の選択と同じ形にしてある。
  // 覚えるのは「閉じた学年」。開く側を決め打ちすると、想定外の学年が
  // 閉じたまま出て、中の人に辿り着けなくなる
  const [閉じた学年, 閉じた学年を置く] = React.useState(new Set());
  // タグの並びは横に流す。パソコンの車の動きは横に読み替える
  const タグの横流し = use横流し();
  const 学年を開け閉め = (印) => {
    閉じた学年を置く((前) => {
      const 次 = new Set(前);
      return (次.has(印) ? 次.delete(印) : 次.add(印), 次);
    });
  };
  // 分析グラフの点タップ→履歴一覧の該当セッション詳細に飛び、対象者の列までスクロールする
  const goToHistoryRecord = (sessionId, memberId) => {
    if (!sessionId) return;
    setSelectedHistorySessionId(sessionId);
    setHistoryViewMode('detail');
    if (memberId) setFocusedMemberId(memberId);
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('履歴');
    }
  };
  if (!isHydrated) return null;
  /**
   * 推移のグラフで押した点（ラベル）の期間に入る記録かどうか。
   *
   * ラベルの形から日／月／年度を見分ける。推移がラベルを作るときと
   * 同じ組み立てにしてあるので、片方だけ変えると噛み合わなくなる。
   */
  const 点の期間の記録か = (記録, ラベル) => {
    if (!ラベル) return true;
    if (!記録) return false;
    const 日付 = new Date(記録.date);
    let 札 = '';
    if (ラベル.endsWith('年度')) {
      札 = `${日付.getMonth() + 1 >= 4 ? 日付.getFullYear() : 日付.getFullYear() - 1}年度`;
    } else if (ラベル.includes('/') && ラベル.split('/').length === 2) {
      札 = `${日付.getFullYear()}/${日付.getMonth() + 1}`;
    } else {
      札 = `${日付.getFullYear()}/${日付.getMonth() + 1}/${日付.getDate()}`;
    }
    return 札 === ラベル;
  };
  /** 点を押していればその期間だけ、押していなければ全部 */
  const 点の期間で絞る = (記録たち, ラベル) =>
    ラベル ? (記録たち || []).filter((記録1件) => 点の期間の記録か(記録1件, ラベル)) : 記録たち || [];
  const gatherAllArrowLocations = (memberId, name, selectedLabel) => {
    const locations = [];
    絞った記録.forEach((session) => {
      if (!session || !session.archers) return;
      if (!点の期間の記録か(session, selectedLabel)) return;
      session.archers.forEach((archer) => {
        const archerLocations = archer.arrowLocations || [];
        archerLocations.forEach((loc, idx) => {
          if (!loc) return;
          if (集.その人の射か(archer, idx, memberId)) {
            const mark = archer.marks ? archer.marks[idx] : undefined;
            // 的中/外れのマークが登録されている射のみを対象とする
            if (mark === '○' || mark === '○' || mark === '×' || mark === '\xd7') {
              locations.push(Object.assign({}, loc, { mark, shotIndex: idx }));
            }
          }
        });
      });
    });
    return locations;
  };
  const [期間の種類, 期間の種類を置く] = React.useState('すべて');
  const [性別の絞り, 性別の絞りを置く] = React.useState('全員');
  const [学年の絞り, 学年の絞りを置く] = React.useState('全学年');
  const 今日 = new Date();
  const 今の年度 = 今日.getMonth() + 1 >= 4 ? 今日.getFullYear() : 今日.getFullYear() - 1;
  const [見ている年, 見ている年を置く] = React.useState(今日.getFullYear());
  const [見ている月, 見ている月を置く] = React.useState(今日.getMonth() + 1);
  const [見ている年度, 見ている年度を置く] = React.useState(今の年度);
  const [推移の刻み, 推移の刻みを置く] = React.useState('month');
  const [期間の始め, 期間の始めを置く] = React.useState(new Date(今日.getFullYear(), 今日.getMonth(), 1));
  const [期間の終わり, 期間の終わりを置く] = React.useState(new Date());
  const [暦を出す, 暦を出すを置く] = React.useState(false);
  const [暦の対象, 暦の対象を置く] = React.useState('start');
  const [名前の検索, 名前の検索を置く] = React.useState('');
  const [詳細の部員, 詳細の部員を置く] = React.useState(null);
  const [customShotsInput, setCustomShotsInput] = React.useState('');
  // 的の種類切り替え用ステート
  const [myTargetType, setMyTargetType] = React.useState(arrowTargetType || 'kasumi36');
  const [modalTargetType, setModalTargetType] = React.useState(arrowTargetType || 'kasumi36');
  // グラフタップ時の選択ラベルステート
  const [selectedTrendLabel, setSelectedTrendLabel] = React.useState(null);
  const [selectedModalTrendLabel, setSelectedModalTrendLabel] = React.useState(null);
  // 期間・集計単位・射手が変更されたらグラフの選択を解除する
  React.useEffect(() => {
    setSelectedTrendLabel(null);
  }, [期間の種類, 推移の刻み, 性別の絞り, 学年の絞り, myMemberId]);
  // モーダル対象が切り替わったら選択を解除する
  React.useEffect(() => {
    setSelectedModalTrendLabel(null);
  }, [詳細の部員]);
  // モーダル表示時に的の選択肢を現在のデフォルトに同期
  React.useEffect(() => {
    if (詳細の部員) {
      setModalTargetType(arrowTargetType || 'kasumi36');
    }
  }, [詳細の部員, arrowTargetType]);
  // カスタム射数入力の同期
  React.useEffect(() => {
    if (analysisRankingSettings[期間の種類]?.type === 'count') {
      setCustomShotsInput(String(analysisRankingSettings[期間の種類]?.value));
    } else {
      setCustomShotsInput('');
    }
  }, [期間の種類, analysisRankingSettings]);
  const 暦を開く = (対象) => {
    暦の対象を置く(対象);
    暦を出すを置く(true);
  };
  React.useEffect(() => {
    '月ごと' === 期間の種類 || '直近30日' === 期間の種類
      ? 推移の刻みを置く('day')
      : '年度' === 期間の種類 && 'year' === 推移の刻み && 推移の刻みを置く('month');
  }, [期間の種類, 推移の刻み]);
  const 月を動かす = (差) => {
    let 月 = 見ている月 + 差;
    let 年 = 見ている年;
    月 > 12 && ((月 = 1), (年 += 1));
    月 < 1 && ((月 = 12), (年 -= 1));
    見ている月を置く(月);
    見ている年を置く(年);
  };
  const 年度を動かす = (差) => {
    見ている年度を置く((今) => 今 + 差);
  };
  // memberロール時は自分が参加しているセッションのタグのみを収集する
  const タグの一覧 = React.useMemo(() => {
    const 集めた = new Set();
    // 判定は syncRules の 自分の記録か に出した。ここは氏名の一致を見て
    // おらず、メンバーを選ばずに氏名だけで入れた記録が落ちていた。
    // 履歴画面の絞り込み（あちらは氏名も見る）とも食い違っていた
    const src =
      'member' === activeRole && myMemberId
        ? sessions.filter((記録1件) => 自分の記録か(記録1件, myMemberId, 自分の名前))
        : sessions;
    src.forEach((記録) => {
      if (記録 && 記録.tags) 記録.tags.forEach((タグ) => 集めた.add(タグ));
    });
    return Array.from(集めた)
      .filter(Boolean)
      .sort((甲, 乙) => {
        const 甲は選択中 = analysisSelectedTags.includes(甲);
        const 乙は選択中 = analysisSelectedTags.includes(乙);
        return 甲は選択中 && !乙は選択中 ? -1 : !甲は選択中 && 乙は選択中 ? 1 : 甲.localeCompare(乙);
      });
  }, [sessions, analysisSelectedTags, activeRole, myMemberId]);
  // 記録の絞り込み。描画のたびに数え直すと、部員の数だけ記録を舐める
  // xe まで巻き添えで走る。本番でいちばん大きい団体（部員79人・記録108件）で
  // 1周 35ms かかっていた。絞り込みが変わったときだけ作り直す。
  //
  // 直近30日の境目は Date.now() で決まるので、この控えが効いているあいだは
  // 動かない。境目が動くのは日付が変わるときだけで、そのとき画面を開き直せば
  // 数え直される
  const 絞った記録 = React.useMemo(
    () =>
      sessions.filter((記録) => {
        if (!記録) return false;
        if (!集.集計に入れるか(記録)) return false; // 未設定の古い記録は含める（Excel の書き出しと揃える）
        if (analysisSelectedTags.length > 0) {
          const タグたち = 記録.tags || [];
          if ('AND' === analysisTagLogic) {
            if (!analysisSelectedTags.every((タグ) => タグたち.includes(タグ))) return false;
          } else if (!analysisSelectedTags.some((タグ) => タグたち.includes(タグ))) return false;
        }
        const 今 = Date.now();
        const 日付 = 記録.date;
        if ('直近30日' === 期間の種類) return 今 - 日付 <= 2592e6;
        if ('月ごと' === 期間の種類) {
          const 日 = new Date(日付);
          return 日.getFullYear() === 見ている年 && 日.getMonth() + 1 === 見ている月;
        }
        if ('年度' === 期間の種類) {
          const 日 = new Date(日付);
          const 年 = 日.getFullYear();
          return (日.getMonth() + 1 >= 4 ? 年 : 年 - 1) === 見ている年度;
        }
        if ('期間指定' === 期間の種類) {
          const 日 = new Date(日付);
          日.setHours(0, 0, 0, 0);
          const 始め = new Date(期間の始め);
          始め.setHours(0, 0, 0, 0);
          const 終わり = new Date(期間の終わり);
          return (終わり.setHours(23, 59, 59, 999), 日 >= 始め && 日 <= 終わり);
        }
        return true;
      }),
    [
      sessions,
      analysisSelectedTags,
      analysisTagLogic,
      期間の種類,
      見ている年,
      見ている月,
      見ている年度,
      期間の始め,
      期間の終わり,
    ]
  );
  // 順位。人ごとに記録を舐めるので、ここが再計算のいちばん重いところ
  const 順位の元 = React.useMemo(
    () =>
      [
        ...(members || []).filter((部員1人) => showAlumniInAnalysis || (部員1人.grade || 0) < 5),
        ...(((学年の絞り === '卒業生' || showAlumniInAnalysis) && alumni) || []),
      ]
        .filter((部員1人) => !!部員1人)
        .filter((部員1人) => activeRole !== 'member' || !myMemberId || 部員1人.id === myMemberId)
        .map((部員) => Object.assign({}, 部員, 集.成績を数える(絞った記録, 部員.id)))
        .filter((部員) => {
          if (0 === 部員.shots) return false;
          if (activeRole === 'group') {
            if (性別の絞り !== '全員' && 部員.gender !== 性別の絞り) return false;
            if (学年の絞り !== '全学年') {
              if (学年の絞り === '卒業生') {
                if (!(5 === 部員.grade || 部員.graduationYear || 部員.isAlumni)) return false;
              } else if (`${部員.grade}年` !== 学年の絞り) return false;
            }
          }
          return !(名前の検索 && !(部員.name || '').toLowerCase().includes(名前の検索.toLowerCase()));
        })
        .sort((甲, 乙) => (Math.abs(乙.rate - 甲.rate) > 0.01 ? 乙.rate - 甲.rate : 乙.shots - 甲.shots)),
    [
      members,
      alumni,
      showAlumniInAnalysis,
      学年の絞り,
      activeRole,
      myMemberId,
      性別の絞り,
      名前の検索,
      絞った記録,
    ]
  );
  const rankingConfig = analysisRankingSettings[期間の種類] || { type: 'ratio', value: 0 };
  const 割合 = 'ratio' === rankingConfig.type ? rankingConfig.value : 0;
  const 最多の射数 = Math.max(...順位の元.map((人) => 人.shots), 0);
  const 射数の下限 = 'count' === rankingConfig.type ? rankingConfig.value : Math.floor(最多の射数 * 割合);
  const 順位に入る = 順位の元.filter((人) => 人.shots >= 射数の下限);
  const 順位に入らない = 順位の元.filter((人) => 人.shots < 射数の下限);
  const 順位つき = ((一覧) => {
    let 順位 = 1;
    return 一覧.map((部員, 番) => {
      if (番 > 0) {
        const 前の人 = 一覧[番 - 1];
        if (!(Math.abs(部員.rate - 前の人.rate) < 0.01 && 部員.shots === 前の人.shots)) {
          順位 = 番 + 1;
        }
      }
      return Object.assign({}, 部員, { displayRank: 順位 });
    });
  })(順位に入る);
  const 推移を数える = React.useCallback(
    (部員id, 名前) => {
      if (!部員id && !名前) return [];
      const 期間ごと = {};
      絞った記録.forEach((記録) => {
        const 日付 = new Date(記録.date);
        let 札 = '';
        if ('day' === 推移の刻み) {
          札 = `${日付.getFullYear()}/${日付.getMonth() + 1}/${日付.getDate()}`;
        } else if ('month' === 推移の刻み) {
          札 = `${日付.getFullYear()}/${日付.getMonth() + 1}`;
        } else {
          札 = `${日付.getMonth() + 1 >= 4 ? 日付.getFullYear() : 日付.getFullYear() - 1}年度`;
        }
        if (!期間ごと[札]) {
          // 結果分布はここでは数えない。点を押したときは 期間の成績 が
          // 成績を数える で出すので、同じものを2通りに数えると食い違う元になる
          期間ごと[札] = { hits: 0, shots: 0, date: 記録.date, details: [] };
        }
        let sessionHits = 0;
        let sessionShots = 0;
        // 射手の入っていない記録でも落ちないようにする。上の
        // gatherAllArrowLocations は同じ守りをしているのに、ここだけ抜けていた
        (Array.isArray(記録.archers) ? 記録.archers : []).forEach((射手) => {
          if (!射手 || !射手.marks) return;
          let 中り = 0;
          let 射数 = 0;
          射手.marks.forEach((oVal, lVal) => {
            if ('○' !== oVal && '\xd7' !== oVal) return;
            // 氏名では拾わない。ID一致「または」氏名一致だったため、
            // 1つの射が2人に数えられることがあった
            if (集.その人の射か(射手, lVal, 部員id)) {
              期間ごと[札].shots++;
              射数++;
              if ('○' === oVal) {
                期間ごと[札].hits++;
                中り++;
              }
            }
          });
          sessionHits += 中り;
          sessionShots += 射数;
        });
        if (sessionShots > 0) {
          期間ごと[札].details.push({
            sessionId: 記録.id,
            date: 日付.toLocaleDateString('ja-JP'),
            title: 記録.title || '無題の練習',
            stats: `${sessionHits}/${sessionShots} (${((sessionHits / sessionShots) * 100).toFixed(0)}%)`,
          });
        }
      });
      return Object.entries(期間ごと)
        .map(([札, 中身]) =>
          Object.assign({ label: 札 }, 中身, { rate: 中身.shots > 0 ? (中身.hits / 中身.shots) * 100 : 0 })
        )
        .filter((点) => 点.shots > 0)
        .sort((甲, 乙) => 甲.date - 乙.date);
    },
    [絞った記録, 推移の刻み]
  );
  // 比較相手の成績。1〜4射目のマスごとに数え直すと、記録の数だけ何度も
  // 走って重くなる。相手が変わったときだけ数える
  /**
   * 推移の点を押したときの、その期間の成績。
   *
   * 矢所だけが点に連動していて、立ち順別と結果分布は全期間のままだった。
   * 同じ画面の中で見ている期間が食い違うので、そろえる。
   * 点を押していなければ全期間（＝順位側と同じ数字）になる。
   */
  const 期間の成績 = (部員id, ラベル) =>
    部員id ? 集.成績を数える(点の期間で絞る(絞った記録, ラベル), 部員id) : null;
  // 部員として入っているときの、自分の成績
  const 自分の期間の成績 = React.useMemo(
    () => ('member' === activeRole && myMemberId ? 期間の成績(myMemberId, selectedTrendLabel) : null),
    [activeRole, myMemberId, 絞った記録, selectedTrendLabel]
  );
  // 個人の詳細を開いているときの、その人の成績
  const 詳細の期間の成績 = React.useMemo(
    () => (詳細の部員 ? 期間の成績(詳細の部員.id, selectedModalTrendLabel) : null),
    [詳細の部員, 絞った記録, selectedModalTrendLabel]
  );
  const 比較の成績 = React.useMemo(() => {
    const 表 = new Map();
    const 記録たち = 点の期間で絞る(絞った記録, selectedModalTrendLabel);
    for (const 相手 of compareMembers)
      if (相手 && 相手.id) 表.set(相手.id, 集.成績を数える(記録たち, 相手.id));
    return 表;
  }, [compareMembers, 絞った記録, selectedModalTrendLabel]);
  const 自分の推移 = React.useMemo(
    () => ('member' === activeRole && myMemberId ? 推移を数える(myMemberId, 自分の名前) : []),
    [activeRole, myMemberId, 自分の名前, 推移を数える]
  );
  const 詳細の推移 = React.useMemo(
    () => (詳細の部員 ? 推移を数える(詳細の部員.id, 詳細の部員.name) : []),
    [詳細の部員, 推移を数える]
  );
  const CompareGraph = ({ baseData, baseName, compareTargets, selectedLabel, onSelectLabel }) => {
    const COLORS = 比較の色たち;
    const allDataSets = [
      { name: baseName, data: baseData, color: '#007AFF', isBase: true },
      ...compareTargets.map((target, idx) => ({
        name: target.name,
        data: target.data,
        color: COLORS[idx % COLORS.length],
        isBase: false,
      })),
    ];
    const allLabels = Array.from(new Set(allDataSets.flatMap((set) => set.data.map((点) => 点.label)))).sort(
      (甲, 乙) => {
        const aDate = new Date(甲.replace('年度', '/4/1'));
        const bDate = new Date(乙.replace('年度', '/4/1'));
        return aDate - bDate;
      }
    );
    if (allLabels.length === 0) {
      return (
        <View style={styles.noDataGraph}>
          <Text style={{ color: '#8E8E93' }}>比較するデータがありません</Text>
        </View>
      );
    }
    const hHeight = 150;
    const paddingX = 25;
    const paddingY = 20;
    const usableHeight = 110;
    const usableWidth = 250;
    const datasetsWithPoints = allDataSets.map((dataset) => {
      const points = [];
      allLabels.forEach((label, idx) => {
        const xVal = paddingX + (idx / (allLabels.length > 1 ? allLabels.length - 1 : 1)) * usableWidth;
        const item = dataset.data.find((点) => 点.label === label);
        if (item) {
          points.push({
            x: xVal,
            y: hHeight - (paddingY + (item.rate / 100) * usableHeight),
            rate: item.rate,
            label,
          });
        }
      });
      let path = '';
      points.forEach((点, idx) => {
        path += idx === 0 ? `M ${点.x} ${点.y}` : ` L ${点.x} ${点.y}`;
      });
      return { ...dataset, points, path };
    });
    return (
      <View style={styles.graphContainer}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
            alignItems: 'center',
          }}
        >
          <Text style={styles.graphTitle}>的中率推移の比較 (%)</Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
              maxWidth: '75%',
              justifyContent: 'flex-end',
            }}
          >
            {datasetsWithPoints.map((組, idx) => (
              <View
                key={`legend-${idx}`}
                style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}
              >
                <View
                  style={{ width: 8, height: 8, backgroundColor: 組.color, borderRadius: 4, marginRight: 4 }}
                />
                <Text style={{ fontSize: 9, color: '#3C3C43' }}>{組.name}</Text>
              </View>
            ))}
          </View>
        </View>
        <Svg width="100%" height={hHeight} viewBox="0 0 300 150">
          {[0, 25, 50, 75, 100].map((目盛) => (
            <React.Fragment key={`grid-compare-${目盛}`}>
              <Svgの部品.Line
                x1={paddingX}
                y1={hHeight - (paddingY + (目盛 / 100) * usableHeight)}
                x2={280}
                y2={hHeight - (paddingY + (目盛 / 100) * usableHeight)}
                stroke="#E5E5EA"
                strokeWidth="1"
              />
              <Svgの部品.Text
                x={20}
                y={hHeight - (paddingY + (目盛 / 100) * usableHeight) + 3}
                fontSize="8"
                fill="#8E8E93"
                textAnchor="end"
              >
                {目盛}
              </Svgの部品.Text>
            </React.Fragment>
          ))}
          {datasetsWithPoints.map((組, idx) => (
            <Svgの部品.Path
              key={`path-${idx}`}
              d={組.path}
              fill="none"
              stroke={組.color}
              strokeWidth={組.isBase ? '2.5' : '2.0'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {/* 押した期間の目印。線が何本も重なるので、縦の帯で示す */}
          {selectedLabel && allLabels.indexOf(selectedLabel) >= 0 ? (
            <Svgの部品.Line
              x1={
                paddingX +
                (allLabels.indexOf(selectedLabel) / (allLabels.length > 1 ? allLabels.length - 1 : 1)) *
                  usableWidth
              }
              y1={hHeight - paddingY - usableHeight}
              x2={
                paddingX +
                (allLabels.indexOf(selectedLabel) / (allLabels.length > 1 ? allLabels.length - 1 : 1)) *
                  usableWidth
              }
              y2={hHeight - paddingY}
              stroke="#FF9500"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          ) : null}
          {datasetsWithPoints.flatMap((組, dsIdx) =>
            組.points.map((点, idx) => (
              <Svgの部品.Circle
                key={`pt-${dsIdx}-${idx}`}
                cx={点.x}
                cy={点.y} // 選んでいる期間の点は大きくする。押せることが伝わるよう、
                // 押す的も見た目より広く取る（下の透明な丸）
                r={点.label === selectedLabel ? (組.isBase ? '5.5' : '5.0') : 組.isBase ? '3.5' : '3.0'}
                fill={組.color}
                onPress={() => onSelectLabel && onSelectLabel(点.label === selectedLabel ? null : 点.label)}
              />
            ))
          )}
          {/* 指で押しやすいよう、見えない広い的を重ねる（本人の線のぶんだけ） */}
          {(datasetsWithPoints[0] ? datasetsWithPoints[0].points : []).map((点, idx) => (
            <Svgの部品.Circle
              key={`hit-${idx}`}
              cx={点.x}
              cy={点.y}
              r="11"
              fill="transparent"
              onPress={() => onSelectLabel && onSelectLabel(点.label === selectedLabel ? null : 点.label)}
            />
          ))}
        </Svg>
      </View>
    );
  };
  const 推移の図 = ({ data, selectedLabel, onSelectLabel, onJumpToRecord }) => {
    const 選んだ番 = selectedLabel ? data.findIndex((item) => item.label === selectedLabel) : null;
    const 点を選ぶ = (index) => {
      if (null === index) {
        if (onSelectLabel) onSelectLabel(null);
      } else {
        const item = data[index];
        if (onSelectLabel && item) onSelectLabel(item.label);
      }
    };
    if (0 === data.length) {
      return (
        <View style={styles.noDataGraph}>
          <Text style={{ color: '#8E8E93' }}>データが足りません</Text>
        </View>
      );
    }
    const 高さ = 150;
    const 余白 = 20;
    const 描く高さ = 110;
    const 点たち = data.map((項目, 番) => ({
      x: 余白 + (番 / (data.length > 1 ? data.length - 1 : 1)) * 260,
      y: 高さ - (余白 + (項目.rate / 100) * 描く高さ),
    }));
    let 線 = '';
    点たち.forEach((点, 番) => {
      線 += 0 === 番 ? `M ${点.x} ${点.y}` : ` L ${点.x} ${点.y}`;
    });
    return (
      <View style={styles.graphContainer}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 12,
            alignItems: 'center',
          }}
        >
          <Text style={styles.graphTitle}>的中率推移 (%)</Text>
          {!('月ごと' === 期間の種類 || '直近30日' === 期間の種類) && (
            <View style={styles.trendUnitSelector}>
              {['day', 'month', 'year']
                .filter((刻み) => '年度' !== 期間の種類 || 'year' !== 刻み)
                .map((刻み) => (
                  <TouchableOpacity
                    key={`unit-${刻み}`}
                    onPress={() => {
                      推移の刻みを置く(刻み);
                      点を選ぶ(null);
                    }}
                    style={[styles.unitBtn, 推移の刻み === 刻み && styles.unitBtnActive]}
                  >
                    <Text style={[styles.unitBtnText, 推移の刻み === 刻み && styles.unitBtnTextActive]}>
                      {'day' === 刻み ? '日' : 'month' === 刻み ? '月' : '年度'}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </View>
        <Svg width="100%" height={高さ} viewBox="0 0 300 150">
          {[0, 25, 50, 75, 100].map((目盛) => (
            <React.Fragment key={`grid-${目盛}`}>
              <Svgの部品.Line
                x1={余白}
                y1={高さ - (余白 + (目盛 / 100) * 描く高さ)}
                x2={280}
                y2={高さ - (余白 + (目盛 / 100) * 描く高さ)}
                stroke="#E5E5EA"
                strokeWidth="1"
              />
              <Svgの部品.Text
                x={15}
                y={高さ - (余白 + (目盛 / 100) * 描く高さ) + 4}
                fontSize="8"
                fill="#8E8E93"
                textAnchor="end"
              >
                {目盛}
              </Svgの部品.Text>
            </React.Fragment>
          ))}
          <Svgの部品.Path
            d={線}
            fill="none"
            stroke="#007AFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {点たち.map((点, 番) => (
            <Svgの部品.Circle
              key={`point-${番}`}
              cx={点.x}
              cy={点.y}
              r={選んだ番 === 番 ? '6' : '4'}
              fill={選んだ番 === 番 ? '#FF9500' : '#007AFF'}
              onPress={() => 点を選ぶ(番)}
            />
          ))}
        </Svg>
        {null !== 選んだ番 && data[選んだ番] && (
          <View style={styles.pointDetailCard}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={styles.detailLabel}>
                {data[選んだ番].label}
                {' の詳細'}
              </Text>
              <TouchableOpacity onPress={() => 点を選ぶ(null)}>
                <Icons.Ionicons name="close-circle" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator>
              {data[選んだ番].details.map((明細, 番) => (
                <TouchableOpacity
                  key={`detail-${番}-${明細.date}`}
                  onPress={() => {
                    点を選ぶ(null);
                    if (onJumpToRecord) onJumpToRecord(明細.sessionId);
                  }}
                  activeOpacity={0.5}
                  style={[
                    styles.detailRow,
                    番 < data[選んだ番].details.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: '#F2F2F7',
                      paddingBottom: 6,
                      marginBottom: 6,
                    },
                  ]}
                >
                  <Text style={styles.detailText}>
                    {明細.date} {明細.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.detailStats}>{明細.stats}</Text>
                    <Icons.Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };
  const 選択肢の帯 = ({ options, selected, onSelect, label: 見出し = '', isWrap = false }) => (
    <View
      style={[
        styles.segmentWrapper,
        isWrap && { flexDirection: 'column', alignItems: 'stretch', width: '100%' },
      ]}
    >
      {見出し ? <Text style={styles.segmentLabel}>{見出し}</Text> : null}
      <View
        style={[
          styles.segmentContainer,
          isWrap && { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
        ]}
      >
        {options.map((選択肢) => {
          const 字 = 'string' == typeof 選択肢 ? 選択肢 : 選択肢.label;
          const 値 = 'string' == typeof 選択肢 ? 選択肢 : 選択肢.value;
          const 選ばれている = selected === 値;
          return (
            <TouchableOpacity
              key={値}
              style={[styles.segmentButton, 選ばれている && styles.segmentButtonActive]}
              onPress={() => onSelect(値)}
            >
              <Text style={[styles.segmentText, 選ばれている && styles.segmentTextActive]} numberOfLines={1}>
                {字}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
  const 外枠 = View;
  return (
    <外枠 style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>的中分析</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.filtersCard}>
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={[styles.segmentLabel, { width: 'auto', marginRight: 0 }]}>タグフィルター</Text>
              <View style={{ flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2 }}>
                <TouchableOpacity
                  onPress={() => setAnalysisTagLogic('AND')}
                  style={[
                    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                    'AND' === analysisTagLogic && { backgroundColor: '#FFF' },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: 'AND' === analysisTagLogic ? '#007AFF' : '#8E8E93',
                    }}
                  >
                    すべて含む
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAnalysisTagLogic('OR')}
                  style={[
                    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                    'OR' === analysisTagLogic && { backgroundColor: '#FFF' },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: 'OR' === analysisTagLogic ? '#007AFF' : '#8E8E93',
                    }}
                  >
                    いずれか含む
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              ref={タグの横流し}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexDirection: 'row', marginBottom: 8 }}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              <TouchableOpacity
                style={[
                  styles.tagChip,
                  0 === analysisSelectedTags.length && styles.tagChipActive,
                  { backgroundColor: 0 === analysisSelectedTags.length ? '#007AFF' : '#E5E5EA' },
                ]}
                onPress={() => setAnalysisSelectedTags([])}
              >
                <Text style={[styles.tagChipText, 0 === analysisSelectedTags.length && { color: '#FFF' }]}>
                  すべて解除
                </Text>
              </TouchableOpacity>
              {タグの一覧.map((タグ) => {
                const 選択中 = analysisSelectedTags.includes(タグ);
                return (
                  <TouchableOpacity
                    key={`tag-${タグ}`}
                    style={[
                      styles.tagChip,
                      選択中 && styles.tagChipActive,
                      { backgroundColor: 選択中 ? '#007AFF' : '#F2F2F7' },
                    ]}
                    onPress={() => toggleAnalysisTag(タグ)}
                  >
                    <Text style={[styles.tagChipText, 選択中 && { color: '#FFF' }]}>
                      {タグ.replace(/^#/, '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View style={{ marginBottom: 12 }}>
            <選択肢の帯
              options={['月ごと', '年度', '期間指定', '直近30日', 'すべて']}
              selected={期間の種類}
              onSelect={期間の種類を置く}
              isWrap
            />
          </View>
          {'期間指定' === 期間の種類 && (
            <View style={styles.customRangeContainer}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => 暦を開く('start')}>
                <Text style={styles.dateLabel}>
                  {'開始: '}
                  {期間の始め.toLocaleDateString('ja-JP')}
                </Text>
              </TouchableOpacity>
              <Icons.Ionicons name="arrow-forward" size={16} color="#8E8E93" />
              <TouchableOpacity style={styles.dateBtn} onPress={() => 暦を開く('end')}>
                <Text style={styles.dateLabel}>
                  {'終了: '}
                  {期間の終わり.toLocaleDateString('ja-JP')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {'月ごと' === 期間の種類 && (
            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.monthNavBtn} onPress={() => 月を動かす(-1)}>
                <Icons.Ionicons name="chevron-back" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.monthNavText}>
                {見ている月 >= 4 ? `${見ている年}年度` : 見ている年 - 1 + '年度'} {見ている月}月
              </Text>
              <TouchableOpacity style={styles.monthNavBtn} onPress={() => 月を動かす(1)}>
                <Icons.Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
          {'年度' === 期間の種類 && (
            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.monthNavBtn} onPress={() => 年度を動かす(-1)}>
                <Icons.Ionicons name="chevron-back" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.monthNavText}>{見ている年度}年度</Text>
              <TouchableOpacity style={styles.monthNavBtn} onPress={() => 年度を動かす(1)}>
                <Icons.Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}
          {'member' !== activeRole && (
            <View style={styles.rankingSettingsContainer}>
              <Text style={styles.rankingSettingsLabel}>ランキング対象の基準 (最多比)</Text>
              <View style={styles.ratioButtonRow}>
                {[
                  { label: '1/2 (50%)', val: 0.5 },
                  { label: '1/3 (33%)', val: 0.33 },
                  { label: '1/4 (25%)', val: 0.25 },
                ].map((選択肢) => (
                  <TouchableOpacity
                    key={`ratio-${選択肢.val}`}
                    onPress={() => {
                      const 次の値 = Math.abs(割合 - 選択肢.val) < 0.01 ? 0 : 選択肢.val;
                      setAnalysisRankingSetting(期間の種類, { type: 'ratio', value: 次の値 });
                    }}
                    style={[styles.ratioBtn, Math.abs(割合 - 選択肢.val) < 0.01 && styles.ratioBtnActive]}
                  >
                    <Text
                      style={[
                        styles.ratioBtnText,
                        Math.abs(割合 - 選択肢.val) < 0.01 && styles.ratioBtnTextActive,
                      ]}
                    >
                      {選択肢.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.customShotsRow}>
                <TextInput
                  style={styles.customShotsInput}
                  value={customShotsInput}
                  onChangeText={setCustomShotsInput}
                  placeholder="例: 20"
                  keyboardType="numeric"
                  placeholderTextColor="#C7C7CC"
                />
                <Text style={styles.customShotsUnit}>射以上</Text>
                <TouchableOpacity
                  style={[
                    styles.customShotsBtn,
                    customShotsInput.trim() !== '' && styles.customShotsBtnActive,
                  ]}
                  onPress={() => {
                    const 数 = parseInt(customShotsInput, 10);
                    if (!isNaN(数) && 数 > 0) {
                      setAnalysisRankingSetting(期間の種類, { type: 'count', value: 数 });
                    } else {
                      setCustomShotsInput('');
                      setAnalysisRankingSetting(期間の種類, { type: 'ratio', value: 0 });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.customShotsBtnText,
                      customShotsInput.trim() !== '' && styles.customShotsBtnTextActive,
                    ]}
                  >
                    絞り込む
                  </Text>
                </TouchableOpacity>
              </View>
              {最多の射数 > 0 && (
                <Text style={styles.ratioHintText}>
                  {射数の下限 > 0
                    ? `現在、${射数の下限}射以上がランキング対象です（最多: ${最多の射数}射）`
                    : '全メンバーがランキング対象です'}
                </Text>
              )}
            </View>
          )}
          {'member' !== activeRole && (
            <>
              <View style={styles.filterDivider} />
              <選択肢の帯
                label="性別:"
                options={['全員', '男子', '女子']}
                selected={性別の絞り}
                onSelect={性別の絞りを置く}
              />
              <View style={styles.filterDivider} />
              <選択肢の帯
                label="学年:"
                options={['全学年', '1年', '2年', '3年', '4年']}
                selected={学年の絞り}
                onSelect={学年の絞りを置く}
              />
              <View style={styles.filterDivider} />
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>卒業生を表示</Text>
                <TouchableOpacity
                  style={[styles.miniBtn, showAlumniInAnalysis && styles.miniBtnActive]}
                  onPress={() => setAlumni(!showAlumniInAnalysis)}
                >
                  <Text style={[styles.miniBtnText, showAlumniInAnalysis && styles.miniBtnTextActive]}>
                    {showAlumniInAnalysis ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        {'member' === activeRole && 順位つき[0] && (
          <View style={styles.memberDashboard}>
            <View style={styles.dashboardHeader}>
              <Text style={styles.dashboardTitle}>マイ・パフォーマンス統計</Text>
              <Text style={styles.dashboardPeriod}>{期間の種類}</Text>
            </View>
            <View style={styles.mainStatsRow}>
              <View style={styles.mainStatItem}>
                <Text style={styles.mainStatLabel}>的中率</Text>
                <Text style={styles.mainStatValue}>
                  {順位つき[0].rate.toFixed(1)}
                  <Text style={{ fontSize: 16 }}>%</Text>
                </Text>
              </View>
              <View style={styles.mainStatItem}>
                <Text style={styles.mainStatLabel}>的中/射数</Text>
                <Text style={styles.mainStatValue}>
                  {順位つき[0].hits}
                  <Text style={{ fontSize: 16, color: '#8E8E93' }}>
                    {' / '}
                    {順位つき[0].shots}
                  </Text>
                </Text>
              </View>
            </View>
            <推移の図
              data={自分の推移}
              selectedLabel={selectedTrendLabel}
              onSelectLabel={setSelectedTrendLabel}
              onJumpToRecord={(sessionId) => goToHistoryRecord(sessionId, myMemberId)}
            />
            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <Text style={[styles.sectionSubTitle, { alignSelf: 'flex-start' }]}>
                {selectedTrendLabel ? `矢所の傾向 (${selectedTrendLabel})` : '矢所の傾向 (集計)'}
              </Text>
              <View style={{ width: '100%', marginBottom: 12 }}>
                <選択肢の帯
                  options={[
                    { label: '霞的(尺二寸)', value: 'kasumi36' },
                    { label: '星的(尺二寸)', value: 'hoshi36' },
                    { label: '星的(八寸)', value: 'hoshi24' },
                  ]}
                  selected={myTargetType}
                  onSelect={setMyTargetType}
                  isWrap
                />
              </View>
              <ArrowLocationView
                arrowLocations={gatherAllArrowLocations(myMemberId, 自分の名前, selectedTrendLabel)}
                size={200}
                targetType={myTargetType}
                hideNumbers
              />
            </View>
            <View style={{ marginTop: 20 }}>
              <Text style={styles.sectionSubTitle}>
                {selectedTrendLabel
                  ? `立ち順別の的中率 (${selectedTrendLabel})`
                  : '立ち順別の的中率 (1-4射目)'}
              </Text>
              <View style={styles.statsGrid}>
                {Array.from({ length: 4 }).map((_, 番) => {
                  // 点を押したらその期間で数え直す。矢所だけが連動して
                  // ここが全期間のままだと、同じ画面で見ている期間が食い違う
                  const 元 = 自分の期間の成績 || 順位つき[0];
                  const そのマス = 元.perShotStats[番] || { shots: 0, hits: 0 };
                  const 率 = そのマス.shots > 0 ? (そのマス.hits / そのマス.shots) * 100 : 0;
                  return (
                    <View key={`per-shot-${番}`} style={styles.statBox}>
                      <Text style={styles.statBoxTitle}>{番 + 1}射目</Text>
                      <Text style={styles.statBoxRateDash}>
                        {率.toFixed(0)}
                        <Text style={{ fontSize: 10 }}>%</Text>
                      </Text>
                      <Text style={styles.statBoxCounts}>
                        {そのマス.hits}/{そのマス.shots}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionSubTitle}>
                {selectedTrendLabel ? `立ちの結果分布 (${selectedTrendLabel})` : '立ちの結果分布 (4射単位)'}
              </Text>
              <View style={styles.patternsCardDash}>
                {[
                  { label: '皆中', key: 'kaichu', color: '#FF9500' },
                  { label: '三中', key: 'sanchu', color: '#34C759' },
                  { label: '羽分', key: 'hake', color: '#007AFF' },
                  { label: '一中', key: 'icchu', color: '#5856D6' },
                  { label: '残念', key: 'zannen', color: '#FF3B30' },
                ].map((区分) => {
                  const 元 = 自分の期間の成績 || 順位つき[0];
                  const 回数 = 元.patterns[区分.key] || 0;
                  const 全部 = Object.values(元.patterns).reduce((甲, 乙) => 甲 + 乙, 0);
                  const 占める割合 = 全部 > 0 ? (回数 / 全部) * 100 : 0;
                  return (
                    <View key={区分.key} style={styles.patternLine}>
                      <View style={{ width: 45 }}>
                        <Text style={styles.patternLabelText}>{区分.label}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.barContainer}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${Math.max(占める割合, 回数 > 0 ? 3 : 0)}%`,
                                backgroundColor: 区分.color,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <View style={{ width: 50, alignItems: 'flex-end' }}>
                        <Text style={styles.patternValueText}>{回数}回</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              {/* 4射そろわない末尾は分布に入れられない。 */
              /* 断らないと「的中率と数が合わない」と見える */}
              {(() => {
                const 端 = (自分の期間の成績 || 順位つき[0] || {}).端数の射 || 0;
                return 端 > 0 ? (
                  <Text
                    style={{ fontSize: 11, color: '#8E8E93', marginTop: 8, lineHeight: 16 }}
                  >{`※ 4射に満たない ${端} 射は皆中・残念などに分けられないため、この分布に入れていません（的中率には入っています）。`}</Text>
                ) : null;
              })()}
            </View>
            {/* 的中の型。個人の詳細と同じものを、自分の画面にも出す。 */
            /* 片方だけに出すと「部長の画面にはあるのに自分には無い」になる */}
            {型の節(自分の期間の成績 || 順位つき[0], selectedTrendLabel)}
          </View>
        )}
        {'member' !== activeRole && (
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Icons.Ionicons name="search" size={18} color="#007AFF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="メンバー名を検索..."
                placeholderTextColor="#8E8E93"
                value={名前の検索}
                onChangeText={名前の検索を置く}
              />
              {!!名前の検索 && (
                <TouchableOpacity onPress={() => 名前の検索を置く('')} style={{ padding: 4 }}>
                  <Icons.Ionicons name="close-circle" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        {'member' !== activeRole && (
          <View style={styles.listContainer}>
            {順位つき.map((部員) => (
              <TouchableOpacity
                key={typeof 部員.id === 'string' ? 部員.id : `member-${部員.name}`}
                style={styles.rowCard}
                onPress={() => 詳細の部員を置く(部員)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{'member' === activeRole ? '-' : 部員.displayRank}</Text>
                  </View>
                  <View style={styles.nameContainer}>
                    <Text
                      style={[styles.memberName, { color: '#000' }]} // 長い名前は2行まで。それ以上は…で切る。
                      // 切らないと右の的中率へ食い込む
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {部員.name}
                    </Text>
                    <Text style={styles.memberSub} numberOfLines={1}>
                      {'group' === activeRole && (部員.termKi ? `${部員.termKi}期 / ` : '')}
                      {'group' === activeRole &&
                        (部員.grade === 5 || 部員.graduationYear
                          ? '卒業生'
                          : 部員.grade === 0
                            ? 'その他'
                            : `${部員.grade}年`)}
                      {' / '}
                      {'group' === activeRole && `${部員.gender}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rateText, { color: 部員.rate >= 50 ? '#D32F2F' : '#000' }]}>
                    {部員.rate.toFixed(1)}%
                  </Text>
                  <Text style={styles.shotScoreText}>
                    {部員.hits}/{部員.shots}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {順位に入らない.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <View
                  style={{
                    padding: 10,
                    backgroundColor: '#F2F2F7',
                    borderRadius: 8,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Icons.Ionicons
                    name="information-circle-outline"
                    size={14}
                    color="#8E8E93"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: 'bold' }}>
                    ランキング選外 ({射数の下限}射未満)
                  </Text>
                </View>
                {順位に入らない.map((部員) => (
                  <TouchableOpacity
                    key={typeof 部員.id === 'string' ? 部員.id : `low-member-${部員.name}`}
                    style={[styles.rowCard, { opacity: 0.6 }]}
                    onPress={() => 詳細の部員を置く(部員)}
                  >
                    <View style={styles.rowLeft}>
                      <View style={styles.nameContainer}>
                        <Text style={[styles.memberName, { color: '#000' }]}>{部員.name}</Text>
                        <Text style={styles.memberSub}>
                          {'group' === activeRole && (部員.termKi ? `${部員.termKi}期 / ` : '')}
                          {'group' === activeRole &&
                            (部員.grade === 5 || 部員.graduationYear
                              ? '卒業生'
                              : 部員.grade === 0
                                ? 'その他'
                                : `${部員.grade}年`)}
                          {' / '}
                          {'group' === activeRole && `${部員.gender}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.rateText}>{部員.rate.toFixed(1)}%</Text>
                      <Text style={styles.shotScoreText}>
                        {部員.hits}/{部員.shots}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {0 === 順位に入る.length && (
              <Text style={styles.noDataText}>条件に一致するメンバーがいません</Text>
            )}
          </View>
        )}
      </ScrollView>
      <CustomCalendarModal
        visible={暦を出す}
        onClose={() => 暦を出すを置く(false)}
        selectedDate={'start' === 暦の対象 ? 期間の始め : 期間の終わり}
        onSelectDate={(日付) => {
          if ('start' === 暦の対象) 期間の始めを置く(日付);
          else 期間の終わりを置く(日付);
          暦を出すを置く(false);
        }}
        title={'start' === 暦の対象 ? '開始日を選択' : '終了日を選択'}
      />
      <Modal
        visible={!!詳細の部員}
        transparent
        animationType="fade" // 見るだけの窓。端末の戻るでも、外を押しても閉じる
        onRequestClose={() => 詳細の部員を置く(null)}
      >
        <View style={styles.modalOverlay}>
          {/* 外側。押したら閉じる。中身より下に敷く */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            accessibilityLabel="閉じる"
            onPress={() => 詳細の部員を置く(null)}
          />
          <View // 背景の板より上に置く。置かないと、板が中身の押すを横取りする
            style={[styles.modalContent, { maxHeight: '85%', zIndex: 1 }]}
          >
            {詳細の部員 && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {compareMembers.length > 0 ? (
                  <Text style={styles.modalTitle}>
                    {詳細の部員.name}
                    {' vs '}
                    {compareMembers.map((相手) => 相手.name).join(', ')}
                    {' の比較'}
                  </Text>
                ) : (
                  <Text style={styles.modalTitle}>{詳細の部員.name}の分析詳細</Text>
                )}
                {compareMembers.length > 0 ? (
                  <View>
                    <Text style={styles.modalDesc}>
                      {期間の種類}
                      {' の的中成績比較'}
                    </Text>
                    {/* 全体の的中率を、比べている人ぶんまとめて出す。 */
                    /* これまでは本人の分しか出ておらず、相手の全体の */
                    /* 的中率はランキングへ戻らないと見られなかった */}
                    <View style={styles.比較の的中率}>
                      {[
                        {
                          名: 詳細の部員.name,
                          hits: 詳細の部員.hits,
                          shots: 詳細の部員.shots,
                          rate: 詳細の部員.rate,
                        },
                        ...compareMembers.map((相手) => {
                          const 成績 = 比較の成績.get(相手.id) || {};
                          const 中 = 成績.hits ?? 成績.的中 ?? 0;
                          const 射 = 成績.shots ?? 成績.射数 ?? 0;
                          return { 名: 相手.name, hits: 中, shots: 射, rate: 射 > 0 ? (中 / 射) * 100 : 0 };
                        }),
                      ].map((行, 番) => (
                        <View key={`全体-${行.名}-${番}`} style={styles.比較の的中率の行}>
                          <Text
                            style={[
                              styles.比較の的中率の名,
                              { color: 比較の色たち[番 % 比較の色たち.length] },
                            ]}
                            numberOfLines={1}
                          >
                            {行.名}
                          </Text>
                          <Text style={styles.比較の的中率の数}>{行.rate.toFixed(1)}%</Text>
                          <Text style={styles.比較の的中率の内訳}>
                            {行.hits}/{行.shots}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.modalDesc}>
                    {期間の種類}の成績 ({詳細の部員.hits}/{詳細の部員.shots}
                    {') '}
                    {詳細の部員.rate.toFixed(1)}%
                  </Text>
                )}
                <View style={{ marginVertical: 12 }}>
                  {compareMembers.length > 0 ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setCompareMembers([]);
                          setIsSelectingCompareTarget(false);
                        }}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          backgroundColor: '#E5E5EA',
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: '#8E8E93', fontSize: 13, fontWeight: 'bold' }}>
                          比較をすべて解除
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setIsSelectingCompareTarget(true)}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          backgroundColor: '#E1F0FF',
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: 'bold' }}>
                          比較メンバーを追加
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setIsSelectingCompareTarget(true)}
                      style={{
                        alignSelf: 'flex-start',
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        backgroundColor: '#E1F0FF',
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: 'bold' }}>
                        他のメンバーと比較
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* 比較のひな型。よく見る組み合わせを名前で残して呼び出す。 */
                /* 毎回いちいち学年を開いて選び直すのが手間だった。 */
                /* 持つのは部員IDだけ。氏名で持つと、改名や同姓同名で別人を呼ぶ */}
                {(() => {
                  const この団体の = ひ.この団体のひな型(ひな型たち, いまの団体id);
                  if (0 === この団体の.length && 0 === compareMembers.length) return null;
                  const 選べる人 = [...members, ...alumni];
                  return (
                    <View style={{ marginBottom: 12 }}>
                      {この団体の.length > 0 ? (
                        <View
                          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}
                        >
                          <Text style={{ fontSize: 12, color: '#8E8E93', marginRight: 2 }}>ひな型</Text>
                          {[
                            ...この団体の.map((型) => (
                              <View
                                key={型.id}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: '#F2F2F7',
                                  borderRadius: 8,
                                }}
                              >
                                <TouchableOpacity
                                  onPress={() => {
                                    const 出来 = ひ.ひな型を当てはめる(
                                      型,
                                      選べる人,
                                      詳細の部員 && 詳細の部員.id
                                    );
                                    setCompareMembers(出来.人たち);
                                    setIsSelectingCompareTarget(false);
                                    // 抜けた部員は黙って落とさない。人数が違って見える
                                    if (出来.見つからない > 0)
                                      出す(
                                        'ひな型',
                                        'このひな型の ' +
                                          出来.見つからない +
                                          ' 人は、いまの名簿に居ないため外しました。'
                                      );
                                  }}
                                  style={{ paddingVertical: 6, paddingLeft: 10, paddingRight: 4 }}
                                >
                                  <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: 'bold' }}>
                                    {型.名前}
                                    {' ('}
                                    {型.部員idたち.length})
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() =>
                                    出す('ひな型を消す', '「' + 型.名前 + '」を消しますか。', [
                                      { text: 'やめる', style: 'cancel' },
                                      {
                                        text: '消す',
                                        style: 'destructive',
                                        onPress: () => 比較のひな型を消す(型.id),
                                      },
                                    ])
                                  }
                                  style={{ paddingVertical: 6, paddingRight: 8, paddingLeft: 2 }}
                                >
                                  <Text style={{ color: '#8E8E93', fontSize: 13, fontWeight: 'bold' }}>
                                    ×
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )),
                          ]}
                        </View>
                      ) : null}
                      {compareMembers.length > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <TextInput
                            style={{
                              flex: 1,
                              height: 34,
                              paddingHorizontal: 10,
                              borderWidth: 1,
                              borderColor: '#E5E5EA',
                              borderRadius: 8,
                              fontSize: 13,
                              color: '#1C1C1E',
                              backgroundColor: '#FFF',
                            }}
                            placeholder="この組み合わせに名前を付けて残す"
                            placeholderTextColor="#C7C7CC"
                            value={ひな型の名前}
                            onChangeText={ひな型の名前を置く}
                            maxLength={20}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              const 名 = (ひな型の名前 || '').trim();
                              if (!名) return void 出す('ひな型', '名前を書いてください。');
                              比較のひな型を足す(
                                名,
                                compareMembers.map((相手) => 相手.id)
                              );
                              ひな型の名前を置く('');
                            }}
                            style={{
                              paddingVertical: 8,
                              paddingHorizontal: 14,
                              backgroundColor: '#E1F0FF',
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: 'bold' }}>保存</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })()}
                {isSelectingCompareTarget ? (
                  <View
                    style={{
                      padding: 12,
                      backgroundColor: '#FFF',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#E5E5EA',
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' }}>
                        比較するメンバーを選択
                      </Text>
                      <TouchableOpacity onPress={() => setIsSelectingCompareTarget(false)}>
                        <Text style={{ color: '#007AFF', fontSize: 13, fontWeight: 'bold' }}>完了</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight: 240 }}>
                      {(() => {
                        // 学年でまとめる。卒業生は最後にひとまとめ、
                        // 学年の無い人は「その他/ゲスト」（人の選択と同じ分け方）
                        const 候補 = [...members, ...alumni].filter((item) => item.id !== 詳細の部員.id);
                        return 学年でまとめる(候補).map(({ 学年: 印, 題, 人たち }) => {
                          const 束 = { [印]: 人たち };
                          const 開 = !閉じた学年.has(印);
                          return (
                            <View key={`組-${印}`}>
                              <TouchableOpacity
                                onPress={() => 学年を開け閉め(印)}
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingVertical: 10,
                                  borderBottomWidth: 1,
                                  borderBottomColor: '#F2F2F7',
                                }}
                              >
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#3A3A3C' }}>
                                  {題}
                                  {' ('}
                                  {束[印].length}人)
                                </Text>
                                <Icons.Ionicons
                                  name={開 ? 'chevron-up' : 'chevron-down'}
                                  size={14}
                                  color="#8E8E93"
                                />
                              </TouchableOpacity>
                              {[
                                ...(開 ? 束[印] : []).map((item) => {
                                  const isSelected = compareMembers.some((相手) => 相手.id === item.id);
                                  return (
                                    <TouchableOpacity
                                      key={`select-${item.id}`}
                                      onPress={() => {
                                        setCompareMembers((prev) => {
                                          if (prev.some((相手) => 相手.id === item.id)) {
                                            return prev.filter((相手) => 相手.id !== item.id);
                                          } else {
                                            return [...prev, item];
                                          }
                                        });
                                      }}
                                      style={{
                                        paddingVertical: 10,
                                        paddingLeft: 12,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#F2F2F7',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                      }}
                                    >
                                      {/* 男女が分かるよう、名前の前に色の丸を置く。 */
                                      /* メンバー画面と同じ色にそろえてある */}
                                      <View
                                        style={{
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          flex: 1,
                                          minWidth: 0,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 10,
                                            marginRight: 6,
                                            color:
                                              '男子' === item.gender
                                                ? '#007AFF'
                                                : '女子' === item.gender
                                                  ? '#FF2D55'
                                                  : '#8E8E93',
                                          }}
                                        >
                                          ●
                                        </Text>
                                        <Text
                                          style={{
                                            fontSize: 14,
                                            color: isSelected ? '#007AFF' : '#1C1C1E',
                                            fontWeight: isSelected ? 'bold' : 'normal',
                                            flexShrink: 1,
                                          }}
                                          numberOfLines={1}
                                        >
                                          {item.name}
                                        </Text>
                                      </View>
                                      {isSelected && (
                                        <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: 'bold' }}>
                                          ✓
                                        </Text>
                                      )}
                                    </TouchableOpacity>
                                  );
                                }),
                              ]}
                            </View>
                          );
                        });
                      })()}
                    </ScrollView>
                  </View>
                ) : null}
                {compareMembers.length > 0 ? (
                  <View>
                    <CompareGraph
                      baseData={詳細の推移}
                      baseName={詳細の部員.name}
                      compareTargets={compareMembers.map((相手) => ({
                        id: 相手.id,
                        name: 相手.name,
                        data: 推移を数える(相手.id, 相手.name),
                      }))}
                      selectedLabel={selectedModalTrendLabel}
                      onSelectLabel={setSelectedModalTrendLabel}
                    />
                    <View style={{ marginBottom: 20, marginTop: 20, alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: 'bold',
                          color: '#3A3A3C',
                          marginBottom: 8,
                          alignSelf: 'flex-start',
                        }}
                      >
                        {selectedModalTrendLabel
                          ? `矢所の傾向 (${selectedModalTrendLabel})`
                          : '矢所の傾向 (集計)'}
                      </Text>
                      <View style={{ width: '100%', marginBottom: 12 }}>
                        <選択肢の帯
                          options={[
                            { label: '霞的(尺二寸)', value: 'kasumi36' },
                            { label: '星的(尺二寸)', value: 'hoshi36' },
                            { label: '星的(八寸)', value: 'hoshi24' },
                          ]}
                          selected={modalTargetType}
                          onSelect={setModalTargetType}
                          isWrap
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          paddingVertical: 4,
                          gap: 16,
                          width: '100%',
                        }}
                      >
                        <View style={{ alignItems: 'center', minWidth: 110, width: 110 }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: 'bold',
                              marginBottom: 4,
                              color: '#3C3C43',
                              textAlign: 'center',
                            }}
                            numberOfLines={1}
                          >
                            {詳細の部員.name}
                          </Text>
                          <ArrowLocationView
                            arrowLocations={gatherAllArrowLocations(
                              詳細の部員.id,
                              詳細の部員.name,
                              selectedModalTrendLabel
                            )}
                            size={100}
                            targetType={modalTargetType}
                            hideNumbers
                          />
                        </View>
                        {[
                          ...compareMembers.map((相手, cmIdx) => {
                            const COLORS = 比較の色たち;
                            const dsColor = COLORS[cmIdx % COLORS.length];
                            return (
                              <View
                                key={`arrow-compare-${相手.id}`}
                                style={{ alignItems: 'center', minWidth: 110, width: 110 }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    marginBottom: 4,
                                    color: dsColor,
                                    textAlign: 'center',
                                  }}
                                  numberOfLines={1}
                                >
                                  {相手.name}
                                </Text>
                                <ArrowLocationView
                                  arrowLocations={gatherAllArrowLocations(
                                    相手.id,
                                    相手.name,
                                    selectedModalTrendLabel
                                  )}
                                  size={100}
                                  targetType={modalTargetType}
                                  hideNumbers
                                />
                              </View>
                            );
                          }),
                        ]}
                      </View>
                    </View>
                    {/* 立ち順別の的中率。 */
                    /*  */
                    /* 射目ごとに人を並べていたころは、4人比べると */
                    /* 4区画×4行で20行になり、上下に離れた数字を */
                    /* 見比べることになって読めなかった。 */
                    /* 1人1行の表にして、横に射目を並べる */}
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 12 }}>
                        {selectedModalTrendLabel
                          ? `立ち順別の的中率 (${selectedModalTrendLabel})`
                          : '立ち順別の的中率 (1-4射目)'}
                      </Text>
                      {(() => {
                        const COLORS = 比較の色たち;
                        const 空 = [];
                        const 並び = [
                          {
                            name: 詳細の部員.name,
                            色: '#007AFF',
                            表: (詳細の期間の成績 || 詳細の部員).perShotStats || 空,
                          },
                          ...compareMembers.map((相手, 番) => ({
                            name: 相手.name,
                            色: COLORS[番 % COLORS.length],
                            表: (比較の成績.get(相手.id) || {}).perShotStats || 空,
                          })),
                        ];
                        const 率 = (数) => (数 && 数.shots > 0 ? (数.hits / 数.shots) * 100 : 0);
                        // 濃さは、この表の中でいちばん高い率を基準にする。
                        // 決め打ちの目盛だと、的中率が低い団体では全部同じ薄さになる
                        let 最大 = 0;
                        for (const 人 of 並び)
                          for (let 番 = 0; 番 < 4; 番++) 最大 = Math.max(最大, 率(人.表[番]));
                        const 淡く = (濃さ) => `rgba(0, 122, 255, ${濃さ})`;
                        return (
                          <View style={styles.patternsCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
                              <View style={{ width: 狭い画面 ? 52 : 64 }} />
                              {[
                                ...[0, 1, 2, 3].map((番) => (
                                  <View key={`head-shot-${番}`} style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#3A3A3C' }}>
                                      {番 + 1}射目
                                    </Text>
                                  </View>
                                )),
                              ]}
                              <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 10, color: '#8E8E93' }}>射数</Text>
                              </View>
                            </View>
                            {[
                              ...並び.map((人, 番) => {
                                const 総射数 = [0, 1, 2, 3].reduce(
                                  (合計, 射目) => 合計 + ((人.表[射目] && 人.表[射目].shots) || 0),
                                  0
                                );
                                return (
                                  <View
                                    key={`per-shot-row-${番}`}
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                                  >
                                    <View
                                      style={{
                                        width: 狭い画面 ? 52 : 64,
                                        paddingRight: 4,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <View
                                        style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: 4,
                                          marginRight: 4,
                                          backgroundColor: 人.色,
                                        }}
                                      />
                                      <Text
                                        style={{
                                          flex: 1,
                                          fontSize: 11,
                                          fontWeight: 'bold',
                                          color: '#1C1C1E',
                                        }}
                                        numberOfLines={1}
                                      >
                                        {人.name}
                                      </Text>
                                    </View>
                                    {[
                                      ...[0, 1, 2, 3].map((射目) => {
                                        const 枡 = 人.表[射目] || { shots: 0, hits: 0 };
                                        const そのマスの率 = 率(枡);
                                        return (
                                          <View
                                            key={`compare-per-shot-${射目}-${番}`}
                                            style={{
                                              flex: 1,
                                              alignItems: 'center',
                                              paddingVertical: 4,
                                              marginHorizontal: 1,
                                              borderRadius: 6,
                                              backgroundColor:
                                                枡.shots > 0 && 最大 > 0
                                                  ? 淡く(0.06 + (そのマスの率 / 最大) * 0.36)
                                                  : 'transparent',
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 狭い画面 ? 12 : 13,
                                                fontWeight: '600',
                                                color: 枡.shots > 0 ? '#1C1C1E' : '#C7C7CC',
                                              }}
                                              numberOfLines={1}
                                            >
                                              {そのマスの率.toFixed(0)}%
                                            </Text>
                                            {狭い画面 ? null : (
                                              <Text // 副次テキスト。暗いテーマでは #EBEBF5 に変わる。
                                                // #48484A は変換表に無く、暗い面の上で沈む
                                                style={{ fontSize: 9, color: '#3C3C43' }}
                                                numberOfLines={1}
                                              >
                                                {枡.hits}/{枡.shots}
                                              </Text>
                                            )}
                                          </View>
                                        );
                                      }),
                                    ]}
                                    <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                      <Text style={{ fontSize: 11, color: '#8E8E93' }}>{String(総射数)}</Text>
                                    </View>
                                  </View>
                                );
                              }),
                            ]}
                          </View>
                        );
                      })()}
                    </View>
                    {/* 立ちの結果分布。比較のときも出す。 */
                    /* 分けていたころは、比較を始めるとこの節ごと消えていた。 */
                    /*  */
                    /* 比較なしのときと同じ帯を人数ぶん並べると、3人で15行、 */
                    /* 4人で20行になって読めない。比較のときは1人1行の表にし、 */
                    /* マスの濃さでその人の中での多い少ないを見せる。 */
                    /* 回数そのものは書いてあるので、濃さは目安でよい */}
                    <View style={{ marginBottom: 20 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 12 }}>
                        {selectedModalTrendLabel
                          ? `立ちの結果分布 (${selectedModalTrendLabel})`
                          : '立ちの結果分布 (4射単位)'}
                      </Text>
                      {(() => {
                        const 区分たち = [
                          { label: '皆中', key: 'kaichu', color: '#FF9500' },
                          { label: '三中', key: 'sanchu', color: '#34C759' },
                          { label: '羽分', key: 'hake', color: '#007AFF' },
                          { label: '一中', key: 'icchu', color: '#5856D6' },
                          { label: '残念', key: 'zannen', color: '#FF3B30' },
                        ];
                        const COLORS = 比較の色たち;
                        const 空 = { kaichu: 0, sanchu: 0, hake: 0, icchu: 0, zannen: 0 };
                        const 並び = [
                          {
                            name: 詳細の部員.name,
                            // 立ち順別の比較と同じ。同じ画面で同じ人の色が変わると迷う
                            色: '#007AFF',
                            表: (詳細の期間の成績 || 詳細の部員).patterns || 空,
                          },
                          ...compareMembers.map((相手, 番) => ({
                            name: 相手.name,
                            色: COLORS[番 % COLORS.length],
                            表: (比較の成績.get(相手.id) || {}).patterns || 空,
                          })),
                        ];
                        // 区分の色を薄く敷く。'#RRGGBB' から rgba を作る
                        const 淡く = (色, 濃さ) => {
                          const 数 = parseInt(色.slice(1), 16);
                          const 赤 = (数 >> 16) & 255;
                          const 緑 = (数 >> 8) & 255;
                          const 青 = 数 & 255;
                          return `rgba(${赤}, ${緑}, ${青}, ${濃さ})`;
                        };
                        return (
                          <View style={styles.patternsCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
                              <View style={{ width: 狭い画面 ? 52 : 64 }} />
                              {[
                                ...区分たち.map((区分) => (
                                  <View key={`head-${区分.key}`} style={{ flex: 1, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: 区分.color }}>
                                      {区分.label}
                                    </Text>
                                  </View>
                                )),
                              ]}
                              <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 10, color: '#8E8E93' }}>立数</Text>
                              </View>
                            </View>
                            {[
                              ...並び.map((人, 番) => {
                                const 全 = Object.values(人.表).reduce((甲, 乙) => 甲 + 乙, 0);
                                return (
                                  <View
                                    key={`bunpu-${番}`}
                                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                                  >
                                    <View
                                      style={{
                                        width: 狭い画面 ? 52 : 64,
                                        paddingRight: 4,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <View
                                        style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: 4,
                                          marginRight: 4,
                                          backgroundColor: 人.色,
                                        }}
                                      />
                                      <Text
                                        style={{
                                          flex: 1,
                                          fontSize: 11,
                                          fontWeight: 'bold',
                                          color: '#1C1C1E',
                                        }}
                                        numberOfLines={1}
                                      >
                                        {人.name}
                                      </Text>
                                    </View>
                                    {[
                                      ...区分たち.map((区分) => {
                                        const 回 = 人.表[区分.key] || 0;
                                        const 割 = 全 > 0 ? 回 / 全 : 0;
                                        return (
                                          <View
                                            key={`${区分.key}-${番}`}
                                            style={{
                                              flex: 1,
                                              alignItems: 'center',
                                              paddingVertical: 6,
                                              marginHorizontal: 1,
                                              borderRadius: 6,
                                              backgroundColor:
                                                回 > 0 ? 淡く(区分.color, 0.1 + 割 * 0.45) : 'transparent',
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: 13,
                                                fontWeight: '600',
                                                color: 回 > 0 ? '#1C1C1E' : '#C7C7CC',
                                              }}
                                            >
                                              {String(回)}
                                            </Text>
                                          </View>
                                        );
                                      }),
                                    ]}
                                    <View style={{ width: 狭い画面 ? 28 : 34, alignItems: 'flex-end' }}>
                                      <Text style={{ fontSize: 11, color: '#8E8E93' }}>{String(全)}</Text>
                                    </View>
                                  </View>
                                );
                              }),
                            ]}
                          </View>
                        );
                      })()}
                      {/* 4射そろわない末尾は分布に入れられない。 */
                      /* 断らないと「的中率と数が合わない」と見える */}
                      {(() => {
                        const 端 =
                          ((詳細の期間の成績 || 詳細の部員).端数の射 || 0) +
                          compareMembers.reduce(
                            (合計, 相手) => 合計 + ((比較の成績.get(相手.id) || {}).端数の射 || 0),
                            0
                          );
                        return 端 > 0 ? (
                          <Text
                            style={{ fontSize: 11, color: '#8E8E93', marginTop: 8, lineHeight: 16 }}
                          >{`※ 4射に満たない射（この画面の全員で ${端} 射）は皆中・残念などに分けられないため、この分布に入れていません（的中率には入っています）。`}</Text>
                        ) : null;
                      })()}
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={{ marginBottom: 20 }}>
                      <推移の図
                        data={詳細の推移}
                        selectedLabel={selectedModalTrendLabel}
                        onSelectLabel={setSelectedModalTrendLabel}
                        onJumpToRecord={(sessionId) => {
                          詳細の部員を置く(null);
                          goToHistoryRecord(sessionId, 詳細の部員?.id);
                        }}
                      />
                    </View>
                    <View style={{ marginBottom: 20, alignItems: 'center' }}>
                      <Text
                        style={[
                          {
                            fontSize: 14,
                            fontWeight: 'bold',
                            color: '#3A3A3C',
                            marginBottom: 8,
                            alignSelf: 'flex-start',
                          },
                        ]}
                      >
                        {selectedModalTrendLabel
                          ? `矢所の傾向 (${selectedModalTrendLabel})`
                          : '矢所の傾向 (集計)'}
                      </Text>
                      <View style={{ width: '100%', marginBottom: 12 }}>
                        <選択肢の帯
                          options={[
                            { label: '霞的(尺二寸)', value: 'kasumi36' },
                            { label: '星的(尺二寸)', value: 'hoshi36' },
                            { label: '星的(八寸)', value: 'hoshi24' },
                          ]}
                          selected={modalTargetType}
                          onSelect={setModalTargetType}
                          isWrap
                        />
                      </View>
                      <ArrowLocationView
                        arrowLocations={gatherAllArrowLocations(
                          詳細の部員.id,
                          詳細の部員.name,
                          selectedModalTrendLabel
                        )}
                        size={200}
                        targetType={modalTargetType}
                        hideNumbers
                      />
                    </View>
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 8 }}>
                        {selectedModalTrendLabel
                          ? `立ち順別の的中率 (${selectedModalTrendLabel})`
                          : '立ち順別の的中率 (1-4射目)'}
                      </Text>
                      <View style={styles.statsGrid}>
                        {Array.from({ length: 4 }).map((_, 番) => {
                          const 元 = 詳細の期間の成績 || 詳細の部員;
                          const そのマス = 元.perShotStats[番] || { shots: 0, hits: 0 };
                          const 率 = そのマス.shots > 0 ? (そのマス.hits / そのマス.shots) * 100 : 0;
                          return (
                            <View key={`per-shot-modal-${番}`} style={styles.statBox}>
                              <Text style={styles.statBoxTitle}>{番 + 1}射目</Text>
                              <Text style={styles.statBoxRate}>{率.toFixed(0)}%</Text>
                              <Text style={styles.statBoxCounts}>
                                {そのマス.hits}/{そのマス.shots}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 12 }}>
                        {selectedModalTrendLabel
                          ? `立ちの結果分布 (${selectedModalTrendLabel})`
                          : '立ちの結果分布 (4射単位)'}
                      </Text>
                      <View style={styles.patternsCard}>
                        {[
                          { label: '皆中', key: 'kaichu', color: '#FF9500' },
                          { label: '三中', key: 'sanchu', color: '#34C759' },
                          { label: '羽分', key: 'hake', color: '#007AFF' },
                          { label: '一中', key: 'icchu', color: '#5856D6' },
                          { label: '残念', key: 'zannen', color: '#FF3B30' },
                        ].map((区分) => {
                          const 元 = 詳細の期間の成績 || 詳細の部員;
                          const 回数 = 元.patterns[区分.key] || 0;
                          const 全部 = Object.values(元.patterns).reduce((甲, 乙) => 甲 + 乙, 0);
                          const 占める割合 = 全部 > 0 ? (回数 / 全部) * 100 : 0;
                          return (
                            <View key={区分.key} style={styles.patternLine}>
                              <View style={{ width: 45 }}>
                                <Text style={styles.patternLabelText}>{区分.label}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={styles.barContainer}>
                                  <View
                                    style={[
                                      styles.barFill,
                                      {
                                        width: `${Math.max(占める割合, 回数 > 0 ? 3 : 0)}%`,
                                        backgroundColor: 区分.color,
                                      },
                                    ]}
                                  />
                                </View>
                              </View>
                              <View style={{ width: 50, alignItems: 'flex-end' }}>
                                <Text style={styles.patternValueText}>{回数}回</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                      {/* 4射そろわない末尾は分布に入れられない。 */
                      /* 断らないと「的中率と数が合わない」と見える */}
                      {(() => {
                        const 端 = (詳細の期間の成績 || 詳細の部員).端数の射 || 0;
                        return 端 > 0 ? (
                          <Text
                            style={{ fontSize: 11, color: '#8E8E93', marginTop: 8, lineHeight: 16 }}
                          >{`※ 4射に満たない ${端} 射は皆中・残念などに分けられないため、この分布に入れていません（的中率には入っています）。`}</Text>
                        ) : null;
                      })()}
                    </View>
                  </View>
                )}
                {/* 弓具を変えた前後。 */
                /*  */
                /* 比較の分岐（compareMembers.length > 0）の中に置いていたため、 */
                /* 比較相手を足したときしか出ていなかった。求められたのは */
                /* 「個人の詳細で見たい」なので、比較の有無に関わらず出す。 */
                /*  */
                /* 置き場所は詳細のいちばん下（閉じるの手前）。ここは */
                /* 弓具を記録していない団体では案内だけが出る節なので、 */
                /* 上に置くと、毎日見る数字より先に目に入ってしまう。 */
                /*  */
                /* 的中の型。結果分布のすぐ下に置く。 */
                /* 上の分布で「三中が多い」と分かったあと、すぐ */
                /* 「その三中はどこで抜いているのか」へ目が移るため。 */
                /*  */
                /* 比較中は人数ぶん並べる。名前の見出しを付けて誰の型かを示す */}
                {型の節(
                  詳細の期間の成績 || 詳細の部員,
                  selectedModalTrendLabel,
                  compareMembers.length > 0 ? 詳細の部員.name : null
                )}
                {[
                  ...(compareMembers.length > 0
                    ? compareMembers.map((相手) =>
                        型の節(比較の成績.get(相手.id), selectedModalTrendLabel, 相手.name)
                      )
                    : []),
                ]}
                {/* 弓具の履歴が無い人には、どこで記録するかだけを出す */
                /* （何も出さないと、この節が在ることに気づけない） */}
                {弓具の節(詳細の部員, 絞った記録)}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    詳細の部員を置く(null);
                    setCompareMembers([]);
                    setIsSelectingCompareTarget(false);
                  }}
                >
                  <Text style={styles.closeBtnText}>閉じる</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </外枠>
  );
};
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.AnalysisScreen = AnalysisScreen;
