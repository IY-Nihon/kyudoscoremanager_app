'use strict';

const React = require('react');
const { View, Text, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } = require('./rn');
const 案内 = require('./TutorialGuide');
// 「自分が写っているか」の判定。履歴画面・案内の見本と同じものを使う
const { 自分の記録か } = require('./syncRules');
// 「その射は誰のものか」の決まりは1か所に寄せてある（src/statsRules.js）
const 集 = require('./statsRules');
const { useScoreStore } = require('./useScoreStore');
// 画面が使う項目だけを購読する（ストア全体だと、ますを押すたびに裏のタブまで描き直す）
const { useストアの一部 } = require('./storeSlice');
const Icons = require('@expo/vector-icons');
const { CustomCalendarModal } = require('./CustomCalendarModal');
const { use横流し } = require('./yokoNagashi');
const Svgの部品 = require('react-native-svg');
const Svg = require('react-native-svg').default ?? require('react-native-svg');
const { ArrowLocationView } = require('./ArrowLocationView');
// 見た目の決まりと、一番外の部品（型の節・弓具の節・比較の色）は別のファイル（2026-10-05）
const { styles } = require('./analysisStyles');
const { 型の節 } = require('./analysisParts');
// 部員の詳細の窓（成績・推移・比較・矢所・弓具）も別のファイル（2026-10-05）
const { 部員の詳細の窓 } = require('./AnalysisMemberDetail');

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
  } = 案内.見本を重ねる(useストアの一部(['analysisSelectedTags', 'analysisTagLogic', 'tagTemplates', 'setAnalysisSelectedTags', 'toggleAnalysisTag', 'setAnalysisTagLogic', 'analysisRankingSettings', 'setAnalysisRankingSetting', 'activeRole', 'myMemberId', 'sessions', 'members', 'alumni', 'shotsPerRound', 'showAlumniInAnalysis', 'setShowAlumniInAnalysis', 'isHydrated', 'arrowTargetType', 'setSelectedHistorySessionId', 'setHistoryViewMode', 'setFocusedMemberId', '比較のひな型', '比較のひな型を足す', '比較のひな型を消す', 'activeGroupId']));
  const 自分の名前 = useScoreStore((状態) => 状態.myMemberName) || '';
  const [compareMembers, setCompareMembers] = React.useState([]);
  // 320px の端末では、名前と立数の柱を引くと1マスが40pxほどしか残らない。
  // そこに率と（的中/射数）を積むと、字が枠を越えて隣と重なる。
  // 狭いときは率だけにする。射数は右端の柱に出ているので、意味は落ちない
  const 画面の幅 = useWindowDimensions().width;
  const 狭い画面 = 画面の幅 < 360;
  // タグの並びは横に流す。パソコンの車の動きは横に読み替える
  const タグの横流し = use横流し();
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
  const 自分の推移 = React.useMemo(
    () => ('member' === activeRole && myMemberId ? 推移を数える(myMemberId, 自分の名前) : []),
    [activeRole, myMemberId, 自分の名前, 推移を数える]
  );
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
                  aria-label="ランキング対象の最低射数"
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
                aria-label="メンバー名で検索"
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
      <部員の詳細の窓
        比較のひな型を足す={比較のひな型を足す}
        比較のひな型を消す={比較のひな型を消す}
        いまの団体id={いまの団体id}
        members={members}
        alumni={alumni}
        ひな型たち={ひな型たち}
        compareMembers={compareMembers}
        setCompareMembers={setCompareMembers}
        狭い画面={狭い画面}
        goToHistoryRecord={goToHistoryRecord}
        gatherAllArrowLocations={gatherAllArrowLocations}
        期間の種類={期間の種類}
        詳細の部員={詳細の部員}
        詳細の部員を置く={詳細の部員を置く}
        modalTargetType={modalTargetType}
        setModalTargetType={setModalTargetType}
        selectedModalTrendLabel={selectedModalTrendLabel}
        setSelectedModalTrendLabel={setSelectedModalTrendLabel}
        絞った記録={絞った記録}
        推移を数える={推移を数える}
        推移の図={推移の図}
        選択肢の帯={選択肢の帯}
        期間の成績={期間の成績}
        点の期間で絞る={点の期間で絞る}
      />
    </外枠>
  );
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.AnalysisScreen = AnalysisScreen;
