'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const FlatList = require('./FlatList').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const TextInput = require('./TextInput').default;
const Modal = require('./Modal').default;
const ScrollView = require('./ScrollView').default;
const Alert = require('./alertBridge').default;
const Pressable = require('./Pressable').default;
const { IS_WEB, SAFE_TOP_PADDING, WEB_TOP_PADDING } = require('./IS_WEB');
const 案内 = require('./TutorialGuide');
// 「自分が写っているか」の判定。案内の見本を出すかどうかにも同じものを使う
const { 自分の射手か, 自分の記録か } = require('./syncRules');
const { useScoreStore } = require('./useScoreStore');
const { newArcher, newSeparator, newTotalCalculator } = require('./archerFactory');
const { ArcherColumnView } = require('./ArcherColumnView');
const { LabelColumn } = require('./LabelColumn');
const 組 = require('./teamGrouping');
const 窓 = require('./AppDialog');
const 航 = require('@react-navigation/native');
const { UIConfig } = require('./uiConfig');
const Icons = require('@expo/vector-icons');
const ExpoHaptics = require('expo-haptics');
const { EditSessionModal } = require('./EditSessionModal');
const { ArcherActionModal } = require('./ArcherActionModal');
const { ManualSubstitutionModal } = require('./ManualSubstitutionModal');
const { getShadowStyle } = require('./shadowStyle');
const { formatMemberName } = require('./formatMemberName');
const { use横流し } = require('./yokoNagashi');
const 仕切り線 = () => <View style={{ height: 1, backgroundColor: '#E5E5EA', marginLeft: 16 }} />;
const HistoryScreen = () => {
  const {
    members,
    activeRole,
    myMemberId,
    sessions,
    trash,
    isAdminMode,
    setAdminMode,
    historyViewMode,
    setHistoryViewMode,
    selectedHistorySessionId,
    setSelectedHistorySessionId,
    viewScale,
    deleteArcher,
    deleteSession,
    deleteMultipleSessions,
    restoreSession,
    emptyTrash,
    updateSession,
    isHydrated = false,
    historySelectedTags,
    historyTagLogic = 'AND',
    setHistorySelectedTags,
    toggleHistoryTag,
    setHistoryTagLogic,
    focusedMemberId,
    setFocusedMemberId,
    // 縦横の並べ方。記録画面と同じ設定を使う。
    // 画面ごとに別々に覚えると、同じ表なのに向きが食い違う
    横に並べる = false,
    set横に並べる,
    // 履歴の記録を記録画面に載せて直す（管理者モード）。人・間隔・計・並べ替え・矢所など、
    // 記録表でできることを全部使うため。詳細の画面で直せるのは○×と名前と鍵と削除だけ
    履歴の記録を記録画面で開く,
    // 案内が見本を出しているあいだは、中身だけ見本に差し替わる
  } = 案内.見本を重ねる(useScoreStore());
  const 航路 = 航.useNavigation();
  // タグと月の並びは横に流す。パソコンの車の動きは横に読み替える
  const タグの横流し = use横流し();
  const 月の横流し = use横流し();
  const 自分の名前 = useScoreStore((状態) => 状態.myMemberName) || '';
  const [検索の文, 検索の文を置く] = React.useState('');
  const [見ている月, 見ている月を置く] = React.useState('');
  const [見ている年度, 見ている年度を置く] = React.useState(() => {
    const 今日 = new Date();
    return 今日.getMonth() + 1 >= 4 ? 今日.getFullYear() : 今日.getFullYear() - 1;
  });
  const [年度の窓, 年度の窓を出す] = React.useState(false);
  const [選択中, 選択中を置く] = React.useState(false);
  const [選んだ記録, 選んだ記録を置く] = React.useState(new Set());
  const [ゴミ箱の窓, ゴミ箱の窓を出す] = React.useState(false);
  const [ゴミ箱を編集中, ゴミ箱を編集中を置く] = React.useState(false);
  const [ゴミ箱で選んだ, ゴミ箱で選んだを置く] = React.useState(new Set());
  const [管理者の品書き, 管理者の品書きを出す] = React.useState(false);
  const [記録の情報の窓, 記録の情報の窓を出す] = React.useState(false);
  const [削除の確認, 削除の確認を出す] = React.useState(false);
  const [消す記録ID, 消す記録IDを置く] = React.useState(null);
  const [人の窓, 人の窓を出す] = React.useState(false);
  const [選んだ射手ID, 選んだ射手IDを置く] = React.useState(null);
  const [選んだ射手の順, 選んだ射手の順を置く] = React.useState(0);
  const [交代の窓, 交代の窓を出す] = React.useState(false);
  const // ゴミ箱から開いて見ている記録の id。ゴミ箱の中は見るだけ（直す・消す・
    // 前後へ送るは出さない）で、画面にもゴミ箱の中だと分かる帯を出す
    [ゴミ箱の記録, setゴミ箱の記録] = React.useState(null);
  const 上の横流し = React.useRef(null);
  const 下の横流し = React.useRef(null);
  const 上に合わせる = (出来事) => {
    const 横の位置 = 出来事.nativeEvent.contentOffset.x;
    下の横流し.current?.scrollTo({ x: 横の位置, animated: false });
  };
  const 下に合わせる = (出来事) => {
    const 横の位置 = 出来事.nativeEvent.contentOffset.x;
    上の横流し.current?.scrollTo({ x: 横の位置, animated: false });
  };
  const 見ている記録 = React.useMemo(() => {
    const 部員ID = myMemberId;
    const 名前 = 自分の名前;
    const 記録 =
      sessions.find((記録1件) => 記録1件.id === selectedHistorySessionId) ||
      // ゴミ箱から開いたときだけ、ゴミ箱の中も探す
      (ゴミ箱の記録 && ゴミ箱の記録 === selectedHistorySessionId
        ? trash.find((記録1件) => 記録1件 && 記録1件.id === selectedHistorySessionId)
        : null) ||
      null;
    if (記録 && 'member' === activeRole && 部員ID) {
      // 判定は syncRules の 自分の射手か に出した。ここは交代の判定で
      // 射手ではなく記録のほう(o)を見ていて、交代で入った自分を拾えず、
      // すぐ下の mySessions とも食い違っていた
      const 自分か = (射手) => 自分の射手か(射手, 部員ID, 名前);
      const 自分 = 記録.archers.find(自分か);
      return Object.assign({}, 記録, {
        archers: 記録.archers.filter(自分か),
        archerNames: [自分?.name || '自分'].filter(Boolean),
      });
    }
    return 記録;
  }, [sessions, trash, selectedHistorySessionId, ゴミ箱の記録, activeRole, myMemberId, 自分の名前]);
  const // いま見ている記録がゴミ箱の中か。復元されて記録に戻ったら、ふつうの詳細になる
    ゴミ箱を見ている =
      !!見ている記録 &&
      !!ゴミ箱の記録 &&
      見ている記録.id === ゴミ箱の記録 &&
      !sessions.some((記録1件) => 記録1件 && 記録1件.id === 見ている記録.id) &&
      trash.some((記録1件) => 記録1件 && 記録1件.id === 見ている記録.id);
  const mySessions = React.useMemo(() => {
    let 一覧 = sessions || [];
    const 部員ID = myMemberId;
    const 名前 = 自分の名前;
    if ('member' === activeRole && 部員ID) {
      一覧 = 一覧.filter((記録) => 自分の記録か(記録, 部員ID, 名前));
    }
    return 一覧;
  }, [sessions, activeRole, myMemberId, 自分の名前]);
  const ゴミ箱の選択を切り替える = (id) => {
    const 次 = new Set(ゴミ箱で選んだ);
    if (次.has(id)) 次.delete(id);
    else 次.add(id);
    ゴミ箱で選んだを置く(次);
  };
  const 記録を押した = (記録) => {
    if (選択中) {
      const 次 = new Set(選んだ記録);
      return (次.has(記録.id) ? 次.delete(記録.id) : 次.add(記録.id), void 選んだ記録を置く(次));
    }
    setSelectedHistorySessionId(記録.id);
    setHistoryViewMode('detail');
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
  };
  const 年度の一覧 = React.useMemo(() => {
    const 集めた = new Set();
    const 今日 = new Date();
    const 今の年度 = 今日.getMonth() + 1 >= 4 ? 今日.getFullYear() : 今日.getFullYear() - 1;
    集めた.add(今の年度);
    mySessions.forEach((記録) => {
      const 日時 = 'number' == typeof 記録.date ? 記録.date : Number(記録.date);
      if (isNaN(日時)) return;
      const 日付 = new Date(日時);
      const 年 = 日付.getFullYear();
      const 年度 = 日付.getMonth() + 1 >= 4 ? 年 : 年 - 1;
      集めた.add(年度);
    });
    return Array.from(集めた).sort((甲, 乙) => 乙 - 甲);
  }, [mySessions]);
  const タグの一覧 = React.useMemo(() => {
    const 集めた = new Set();
    return (
      mySessions.forEach((記録) => {
        if (記録.tags && Array.isArray(記録.tags)) 記録.tags.forEach((タグ) => 集めた.add(タグ));
      }),
      Array.from(集めた).sort((甲, 乙) => {
        const 甲は選択中 = historySelectedTags.includes(甲);
        const 乙は選択中 = historySelectedTags.includes(乙);
        return 甲は選択中 && !乙は選択中 ? -1 : !甲は選択中 && 乙は選択中 ? 1 : 甲.localeCompare(乙);
      })
    );
  }, [mySessions, historySelectedTags]);
  const 月の一覧 = React.useMemo(() => {
    const 集めた = new Set();
    return (
      mySessions.forEach((記録) => {
        const 日付 = new Date(記録.date);
        const 年 = 日付.getFullYear();
        const 月 = 日付.getMonth() + 1;
        if ((月 >= 4 ? 年 : 年 - 1) === 見ている年度) 集めた.add(`${年}/${String(月).padStart(2, '0')}`);
      }),
      Array.from(集めた).sort((甲, 乙) => 甲.localeCompare(乙))
    );
  }, [mySessions, 見ている年度]);
  React.useEffect(() => {
    if (!年度の一覧.includes(見ている年度)) 見ている年度を置く(年度の一覧[0]);
  }, [年度の一覧, 見ている年度]);
  React.useEffect(() => {
    月の一覧.length > 0
      ? 月の一覧.includes(見ている月) || 見ている月を置く(月の一覧[月の一覧.length - 1])
      : 見ている月を置く('');
  }, [月の一覧, 見ている月]);
  React.useEffect(() => {
    if ('detail' === historyViewMode && 見ている記録 && focusedMemberId) {
      const archersList = 並びにする(見ている記録.archers);
      const cellW = UIConfig.cellWidth * viewScale;
      const archerIndex = archersList.findIndex((archer) => {
        if (!archer) return false;
        if (archer.memberId === focusedMemberId) return true;
        if (archer.substitutionIds && Object.values(archer.substitutionIds).includes(focusedMemberId))
          return true;
        return false;
      });
      if (archerIndex !== -1) {
        const targetX = (archersList.length - 1 - archerIndex) * cellW;
        setTimeout(() => {
          上の横流し.current?.scrollTo({ x: targetX, animated: true });
          下の横流し.current?.scrollTo({ x: targetX, animated: true });
          setFocusedMemberId(null);
        }, 300);
      } else {
        setFocusedMemberId(null);
      }
    }
  }, [historyViewMode, 見ている記録, focusedMemberId]);
  const 絞った記録 = React.useMemo(() => {
    let 元 = mySessions || [];
    return 元
      .filter((記録) => {
        if (!記録) return false;
        const 日時 = 'number' == typeof 記録.date ? 記録.date : Number(記録.date);
        if (isNaN(日時)) return false;
        const 日付 = new Date(日時);
        const 年 = 日付.getFullYear();
        const 月 = 日付.getMonth() + 1;
        const 年度 = 月 >= 4 ? 年 : 年 - 1;
        const 検索中 = 検索の文.trim().length > 0;
        if (historySelectedTags.length > 0) {
          const タグたち = 記録.tags || [];
          if ('AND' === historyTagLogic) {
            if (!historySelectedTags.every((タグ) => タグたち.includes(タグ))) return false;
          } else {
            if (!historySelectedTags.some((タグ) => タグたち.includes(タグ))) return false;
          }
        }
        if (!検索中) {
          if (年度 !== 見ている年度) return false;
          if (`${年}/${String(月).padStart(2, '0')}` !== 見ている月) return false;
        }
        if (検索中) {
          const 言葉 = 検索の文.toLowerCase();
          const 題に有る = (記録.title || '').toLowerCase().includes(言葉);
          const 覚え書きに有る = (記録.note || '').toLowerCase().includes(言葉);
          const 日付に有る =
            `${日付.getFullYear()}/${String(日付.getMonth() + 1).padStart(2, '0')}/${String(日付.getDate()).padStart(2, '0')}`.includes(
              言葉
            );
          const 射手たち = 記録.archers || [];
          const 名前に有る = (
            Array.isArray(射手たち) ? 射手たち : 'object' == typeof 射手たち ? Object.values(射手たち) : []
          ).some((射手) => (射手?.name || '').toLowerCase().includes(言葉));
          if (!(題に有る || 日付に有る || 覚え書きに有る || 名前に有る)) return false;
        }
        return true;
      })
      .sort((甲, 乙) => 乙.date - 甲.date);
  }, [mySessions, 検索の文, 見ている月, 見ている年度, historySelectedTags, historyTagLogic]);
  const 並びにする = (値) =>
    値
      ? Array.isArray(値)
        ? 値.filter(Boolean)
        : 'object' == typeof 値
          ? Object.values(値).filter(Boolean)
          : []
      : [];
  if (!isHydrated) return null;
  const 詳細を描く = () => {
    if (!見ている記録)
      return (
        <View style={styles.center}>
          <Text style={styles.emptyText}>記録が見つかりません</Text>
          <TouchableOpacity
            onPress={() => {
              setHistoryViewMode('list');
              setゴミ箱の記録(null);
            }}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: '#007AFF' }}>一覧に戻る</Text>
          </TouchableOpacity>
        </View>
      );
    const 日付 = new Date(見ている記録.date);
    const 日付の文 = `${日付.getFullYear()}/${String(日付.getMonth() + 1).padStart(2, '0')}/${String(日付.getDate()).padStart(2, '0')}`;
    const 本数 = 見ている記録.shotCount || 8;
    const 射手たち = 並びにする(見ている記録.archers).map((射手) =>
      Object.assign({}, 射手, {
        marks: Array.isArray(射手.marks)
          ? 射手.marks
          : 射手.marks
            ? Object.values(射手.marks)
            : Array(本数).fill(''),
        lockedBlocks: 射手.lockedBlocks || {},
        isSeparator: 射手.isSeparator || false,
        isTotalCalculator: 射手.isTotalCalculator || false,
        isGuest: 射手.isGuest || false,
      })
    );
    const 前後へ = (向き) => {
      const 位置 = 絞った記録.findIndex((記録1件) => 記録1件.id === 見ている記録.id);
      -1 !== 位置 &&
        ('prev' === 向き && 位置 < 絞った記録.length - 1
          ? setSelectedHistorySessionId(絞った記録[位置 + 1].id)
          : 'next' === 向き && 位置 > 0 && setSelectedHistorySessionId(絞った記録[位置 - 1].id));
    };
    return (
      <View style={styles.detailContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: IS_WEB ? 0 : 12,
            paddingBottom: 12,
            backgroundColor: '#FFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F2F2F7',
          }}
        >
          <Pressable // ゴミ箱から来たなら、ゴミ箱へ戻す
            onPress={() => {
              setHistoryViewMode('list');
              ゴミ箱を見ている && (setゴミ箱の記録(null), ゴミ箱の窓を出す(true));
            }}
            style={({ hovered }) => [
              { flexDirection: 'row', alignItems: 'center', paddingRight: 12, borderRadius: 8, padding: 4 },
              hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
            ]}
          >
            <Icons.Ionicons name="chevron-back" size={24} color="#007AFF" />
            <Text style={{ fontSize: 17, color: '#007AFF' }}>戻る</Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'center' }}>
            {ゴミ箱を見ている ? 'ゴミ箱の記録' : '記録詳細'}
          </Text>
          {/* 前後へ送るのは一覧の並び。ゴミ箱の中では出さない（幅だけ残して題を中央に保つ） */}
          {ゴミ箱を見ている ? (
            <View style={{ width: 72 }} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => 前後へ('prev')}
                style={({ hovered }) => [
                  { padding: 4, borderRadius: 20 },
                  hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
                ]}
              >
                <Icons.Ionicons name="chevron-back" size={24} color="#007AFF" />
              </Pressable>
              <Pressable
                onPress={() => 前後へ('next')}
                style={({ hovered }) => [
                  { padding: 4, borderRadius: 20 },
                  hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
                ]}
              >
                <Icons.Ionicons name="chevron-forward" size={24} color="#007AFF" />
              </Pressable>
            </View>
          )}
        </View>
        {/* ゴミ箱の中の記録だと分かる帯。見るだけで、直す道具は出さない。 */
        /* 復元と完全な削除はここからもできる（見てから決めるのが自然な流れ） */}
        {ゴミ箱を見ている && (
          <View testID="ゴミ箱の帯" style={styles.trashBanner}>
            <Icons.Ionicons name="trash-outline" size={18} color="#FFF" />
            <Text style={styles.trashBannerText}>ゴミ箱の中の記録です。見るだけで、直せません</Text>
            {(isAdminMode || 'group' === activeRole) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="この記録を復元する"
                aria-label="この記録を復元する"
                onPress={() => {
                  restoreSession(見ている記録.id);
                  setゴミ箱の記録(null);
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                }}
                style={({ hovered }) => [styles.trashBannerBtn, hovered && { opacity: 0.85 }]}
              >
                <Text style={styles.trashBannerBtnText}>復元</Text>
              </Pressable>
            )}
            {/* 完全に削除もここから。一覧の「選んで削除」と同じ道（deleteTrashItems）を通し、 */
            /* 消したあとはゴミ箱の一覧へ戻る（使う人の要望 2026-09-17） */}
            {(isAdminMode || 'group' === activeRole) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="この記録を完全に削除する"
                aria-label="この記録を完全に削除する"
                onPress={() => {
                  if (!見ている記録) return;
                  const id = 見ている記録.id;
                  窓.出す('完全に削除', 'この記録をゴミ箱からも消します。元に戻せません。よろしいですか？', [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '削除',
                      style: 'destructive',
                      onPress: () => {
                        useScoreStore.getState().deleteTrashItems([id]);
                        setゴミ箱の記録(null);
                        setHistoryViewMode('list');
                        ゴミ箱の窓を出す(true);
                      },
                    },
                  ]);
                }}
                style={({ hovered }) => [
                  styles.trashBannerBtn,
                  { backgroundColor: '#FF3B30' },
                  hovered && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.trashBannerBtnText, { color: '#FFF' }]}>完全に削除</Text>
              </Pressable>
            )}
          </View>
        )}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F9F9F9' }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <Text style={styles.detailDate}>{日付の文}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* 縦横の切り替え。見るだけの人にも要るので、 */
              /* 消す・直すの権限とは別に、いつでも出す */}
              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityLabel={横に並べる ? '縦に並べる' : '横に並べる'}
                aria-label={横に並べる ? '縦に並べる' : '横に並べる'}
                onPress={() => set横に並べる && set横に並べる(!横に並べる)}
                style={({ hovered }) => [
                  { padding: 4, borderRadius: 20, alignItems: 'center', marginRight: 8 },
                  hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
                ]}
              >
                <Icons.Ionicons
                  name={横に並べる ? 'phone-portrait-outline' : 'phone-landscape-outline'}
                  size={20}
                  color="#8E8E93"
                />
                <Text style={{ fontSize: 9, color: '#8E8E93', marginTop: 1 }}>
                  {横に並べる ? '縦へ' : '横へ'}
                </Text>
              </Pressable>
              {(isAdminMode || 'group' === activeRole) && !ゴミ箱を見ている && (
                <>
                  <Pressable // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="この記録を消す"
                    aria-label="この記録を消す"
                    onPress={() => {
                      消す記録IDを置く(見ている記録.id);
                      削除の確認を出す(true);
                    }}
                    style={({ hovered }) => [
                      { padding: 4, borderRadius: 20 },
                      hovered && { backgroundColor: 'rgba(255,59,48,0.05)' },
                    ]}
                  >
                    <Icons.Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </Pressable>
                  {isAdminMode && (
                    <Pressable
                      onPress={() => 管理者の品書きを出す(true)} // 絵だけのボタン。読み上げと検査のために名前を付ける
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="記録の道具"
                      aria-label="記録の道具"
                      style={({ hovered }) => [
                        { marginLeft: 16, padding: 4, borderRadius: 20 },
                        hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
                      ]}
                    >
                      <Icons.Ionicons name="menu" size={26} color="#007AFF" />
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </View>
          {!!見ている記録.title && <Text style={styles.detailTitle}>{見ている記録.title}</Text>}
          {!!見ている記録.note && (
            <View
              style={{
                marginTop: 8,
                padding: 8,
                backgroundColor: '#FFF',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#E5E5EA',
              }}
            >
              <Text style={{ fontSize: 13, color: '#3C3C43' }}>{見ている記録.note}</Text>
            </View>
          )}
        </View>
        <View style={[styles.detailTableArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ flexDirection: 'column', maxWidth: '100%', maxHeight: '100%' }}>
            {横に並べる
              ? [
                  // ── 横に並べた表 ──
                  // 記録画面の横並びと同じ形。名前を左に固定し、○×は右へ伸びる。
                  // 部品（LabelColumn / ArcherColumnView）は縦と同じものを、
                  // 横並びの印を付けて使う
                  <ScrollView
                    key={'横の表'}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    style={{ flexGrow: 0 }}
                  >
                    <View style={{ flexDirection: 'row', minWidth: '100%' }}>
                      <View style={{ backgroundColor: '#F2F2F7', zIndex: 10 }}>
                        <View
                          style={{
                            width: 100 * viewScale,
                            height: UIConfig.cellHeight * viewScale,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#F2F2F7',
                            borderTopWidth: 1.5,
                            borderTopColor: '#000',
                            borderBottomWidth: 3,
                            borderBottomColor: '#000',
                            borderRightWidth: 1.5,
                            borderRightColor: '#000',
                          }}
                        >
                          <Text style={{ fontSize: 10 * viewScale, fontWeight: 'bold', color: '#3C3C43' }}>
                            名
                          </Text>
                        </View>
                        {射手たち.map((射手, 順) => (
                          <View
                            key={typeof 射手.id === 'string' ? `名-${射手.id}` : `名-${順}`}
                            style={{
                              width: 100 * viewScale,
                              height:
                                (射手.isSeparator ? UIConfig.separatorWidth : UIConfig.cellHeight) *
                                viewScale,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: 射手.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                              borderBottomWidth: 射手.isSeparator || 射手.isTotalCalculator ? 1.5 : 1,
                              borderBottomColor: '#000',
                              borderRightWidth: 1.5,
                              borderRightColor: '#000',
                              paddingHorizontal: 4,
                              // チームの色。横のときは名前の左に細い帯で出す
                              ...(() => {
                                const 色 = (
                                  組.チームを割り当てる(射手たち).find((列) => 列 && 列.id === 射手.id) || {}
                                ).色;
                                return 色 ? { borderLeftWidth: 3 * viewScale, borderLeftColor: 色 } : null;
                              })(),
                            }}
                          >
                            {射手.isSeparator ? (
                              組.区切りのチーム名(射手) ? (
                                <Text
                                  style={{
                                    fontSize: 11 * viewScale,
                                    fontWeight: '700',
                                    color: 組.チームの色(組.区切りのチーム名(射手)) || '#8E8E93',
                                  }} // 横の表の区切りは高さ 35 で 2 行入る。1 行では長い大学名が切れた
                                  numberOfLines={2}
                                >
                                  {組.区切りのチーム名(射手)}
                                </Text>
                              ) : null
                            ) : (
                              <TouchableOpacity
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                onPress={() => 人を選ぶ(射手.id, 順)}
                                disabled={!isAdminMode}
                              >
                                <Text
                                  style={{ fontSize: 13 * viewScale, color: 射手.name ? '#000' : '#8E8E93' }}
                                  numberOfLines={1}
                                >
                                  {射手.isTotalCalculator
                                    ? 射手.またぐ合計
                                      ? '総計'
                                      : '合計'
                                    : 射手.name
                                      ? formatMemberName(射手.name, members || [])
                                      : '選択'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        style={{ flexGrow: 0, flexShrink: 1 }}
                      >
                        <View
                          style={{
                            flexDirection: 'column',
                            width: UIConfig.cellWidth * (本数 + 1) * viewScale,
                          }}
                        >
                          <LabelColumn shots={本数} showFooter={false} 横並び />
                          {射手たち.map((射手, 順) => (
                            <ArcherColumnView
                              key={typeof 射手.id === 'string' ? `行-${射手.id}` : `行-${順}`}
                              archer={射手}
                              shots={本数}
                              allArchers={射手たち}
                              indexInList={順}
                              showFooter={false}
                              横並び
                              isReadOnly={!isAdminMode}
                              isAdminMode={isAdminMode}
                              onPressName={() => 人を選ぶ(射手.id, 順)}
                              onDelete={() => 射手を消す(射手.id)}
                              onToggleMark={印を切り替える}
                              onToggleLock={鍵を切り替える}
                            />
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </ScrollView>,
                ]
              : [
                  <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flexGrow: 0 }}>
                    <View style={{ flexDirection: 'row-reverse', minWidth: '100%' }}>
                      <View style={{ backgroundColor: '#F2F2F7', zIndex: 10 }}>
                        <LabelColumn shots={本数} showFooter={false} />
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        style={{ flexGrow: 0, flexShrink: 1 }}
                        ref={上の横流し}
                        onScroll={上に合わせる}
                        scrollEventThrottle={16}
                      >
                        <View style={{ flexDirection: 'row-reverse' }}>
                          {射手たち.map((射手, 順) => (
                            <ArcherColumnView
                              key={typeof 射手.id === 'string' ? 射手.id : `archer-${順}`}
                              archer={射手}
                              shots={本数}
                              allArchers={射手たち}
                              indexInList={順}
                              showFooter={false}
                              isReadOnly={!isAdminMode}
                              isAdminMode={isAdminMode}
                              onPressName={() => 人を選ぶ(射手.id, 順)}
                              onDelete={() => 射手を消す(射手.id)}
                              onToggleMark={印を切り替える}
                              onToggleLock={鍵を切り替える}
                            />
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  </ScrollView>,
                  <View
                    style={{
                      height: UIConfig.footerHeight * viewScale,
                      flexDirection: 'row-reverse',
                      borderTopWidth: 1.5,
                      borderTopColor: '#000',
                    }}
                  >
                    <View
                      style={{
                        width: UIConfig.headerWidth * viewScale,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F2F2F7',
                        borderLeftWidth: 1.5,
                        borderLeftColor: '#000',
                        borderRightWidth: 1.5,
                        borderRightColor: '#000',
                      }}
                    >
                      <Text style={{ fontSize: 10 * viewScale, fontWeight: 'bold', color: '#3C3C43' }}>
                        名
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ flexGrow: 0, flexShrink: 1 }}
                      ref={下の横流し}
                      onScroll={下に合わせる}
                      scrollEventThrottle={16}
                    >
                      <View style={{ flexDirection: 'row-reverse' }}>
                        {射手たち.map((射手, 順) => {
                          return (
                            <View
                              key={typeof 射手.id === 'string' ? `footer-${射手.id}` : `footer-${順}`}
                              style={{
                                width:
                                  (射手.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) *
                                  viewScale,
                                height: UIConfig.footerHeight * viewScale,
                                backgroundColor: 射手.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                                borderRightWidth: 射手.isSeparator || 射手.isTotalCalculator ? 1.5 : 1,
                                borderRightColor: '#000',
                                borderLeftWidth: 射手.isSeparator || 射手.isTotalCalculator ? 1.5 : 0,
                                borderLeftColor: '#000',
                                padding: 4,
                                justifyContent: 'center',
                                alignItems: 'center',
                                // チームの色。記録中と同じ見え方にする
                                ...(() => {
                                  const 色 = (
                                    組.チームを割り当てる(射手たち).find((列) => 列 && 列.id === 射手.id) ||
                                    {}
                                  ).色;
                                  return 色 ? { borderTopWidth: 3 * viewScale, borderTopColor: 色 } : null;
                                })(),
                              }}
                            >
                              {射手.isSeparator ? (
                                // 区切りに付けたチーム名。保存はされているのに
                                // 履歴では出していなかった
                                組.区切りのチーム名(射手) ? (
                                  <Text
                                    style={{
                                      fontSize: 組.区切りの名の字(viewScale, UIConfig).fontSize,
                                      lineHeight: 組.区切りの名の字(viewScale, UIConfig).lineHeight,
                                      fontWeight: '700',
                                      textAlign: 'center',
                                      color: 組.チームの色(組.区切りのチーム名(射手)) || '#8E8E93',
                                    }} // 記録中と同じく、欄の高さに入るだけ行を使う
                                    numberOfLines={組.区切りの名の字(viewScale, UIConfig).numberOfLines}
                                  >
                                    {組.区切りのチーム名(射手)}
                                  </Text>
                                ) : null
                              ) : (
                                !射手.isSeparator && (
                                  <TouchableOpacity
                                    style={{
                                      alignItems: 'center',
                                      width: '100%',
                                      height: '100%',
                                      justifyContent: 'center',
                                    }}
                                    onPress={() => 人を選ぶ(射手.id, 順)}
                                    disabled={!isAdminMode}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 14 * viewScale,
                                        fontWeight: '400',
                                        color: 射手.name ? '#000' : '#8E8E93',
                                      }}
                                      numberOfLines={2}
                                    >
                                      {射手.isTotalCalculator
                                        ? '合計'
                                        : 射手.name
                                          ? formatMemberName(射手.name, members || [])
                                          : '選択'}
                                    </Text>
                                    {射手.isGuest ? (
                                      <Text
                                        style={{ fontSize: 9 * viewScale, color: '#3C3C43', marginTop: 2 }}
                                      >
                                        (ゲスト)
                                      </Text>
                                    ) : null}
                                    {射手.isTotalCalculator || '' === 射手.name ? null : (
                                      <View
                                        style={{
                                          marginTop: 2,
                                          paddingHorizontal: 4,
                                          paddingVertical: 2,
                                          borderRadius: 10,
                                          backgroundColor:
                                            射手.isGuest ||
                                            !射手.gender ||
                                            射手.gender === '未設定' ||
                                            !['男子', '女子'].includes(射手.gender)
                                              ? '#8E8E93'
                                              : '男子' === 射手.gender
                                                ? '#007AFF'
                                                : '#FF2D55',
                                        }}
                                      >
                                        <Icons.Ionicons name="person" size={10 * viewScale} color="#FFF" />
                                      </View>
                                    )}
                                  </TouchableOpacity>
                                )
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>,
                ]}
          </View>
        </View>
      </View>
    );
  };
  const 記録の行 = ({ item }) => {
    const 日付 = new Date(item.date);
    const 日付の文 = `${日付.getFullYear()}/${String(日付.getMonth() + 1).padStart(2, '0')}/${String(日付.getDate()).padStart(2, '0')}`;
    const 人数 = 並びにする(item.archers).filter(
      (射手) => !射手.isSeparator && !射手.isTotalCalculator
    ).length;
    const 選ばれている = 選んだ記録.has(item.id);
    return (
      <Pressable
        style={({ hovered }) => [
          styles.recordItem,
          選択中 && 選ばれている && { backgroundColor: 'rgba(0,122,255,0.1)' },
          hovered && !選ばれている && { backgroundColor: 'rgba(0,122,255,0.05)' },
          IS_WEB && { cursor: 'pointer' },
        ]}
        onPress={() => 記録を押した(item)}
      >
        {選択中 && (
          <View style={{ marginRight: 12 }}>
            <Icons.Ionicons
              name={選ばれている ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={選ばれている ? '#007AFF' : '#C7C7CC'}
            />
          </View>
        )}
        <View style={styles.itemLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.itemDateText}>{日付の文}</Text>
            {!!item.title && (
              <Text style={styles.itemTitleText}>
                {' ['}
                {item.title}]
              </Text>
            )}
            <Icons.Ionicons
              name={'未同期' === item.syncStatus ? 'cloud-upload-outline' : 'cloud-done-outline'}
              size={14}
              color={'未同期' === item.syncStatus ? '#FF9500' : '#007AFF'}
              style={{ marginLeft: 6 }}
            />
            {!item.includeInStats && (
              <View
                style={{
                  backgroundColor: '#C7C7CC',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>統計除外</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemSubText}>
            {'矢数: '}
            {item.shotCount}
            {'本 '}
            {!!item.note && (
              <Text style={{ color: '#FF9500' }}>
                {' \ud83d\uddd3\ufe0f '}
                {item.note}
              </Text>
            )}
          </Text>
          {item.tags && item.tags.length > 0 && (
            <View style={styles.itemTagsContainer}>
              {item.tags.map((タグ, 番) => (
                <View
                  key={typeof タグ == 'string' ? `tag-${タグ}-${番}` : `tag-obj-${番}`}
                  style={styles.itemTagChip}
                >
                  <Text style={styles.itemTagText}>
                    {typeof タグ == 'string' ? タグ.replace(/^#/, '') : String(タグ)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={styles.itemRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{人数}人</Text>
          </View>
          {!選択中 && <Icons.Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
        </View>
      </Pressable>
    );
  };
  const ゴミ箱を開く = () => {
    ゴミ箱の窓を出す(true);
  };
  const 選択を切り替える = () => {
    選択中
      ? (選択中を置く(false), 選んだ記録を置く(new Set()))
      : (選択中を置く(true), 選んだ記録を置く(new Set()));
  };
  const 選んだ記録を消す = () => {
    if (0 !== 選んだ記録.size) 削除の確認を出す(true);
  };
  const 印を切り替える = (射手ID, 番) => {
    if (!見ている記録 || !isAdminMode) return;
    const 直した = 見ている記録.archers.map((射手) => {
      if (射手.id === 射手ID) {
        const 印 = [...射手.marks];
        const 前の印 = 印[番];
        return (
          (印[番] = '' === 前の印 ? '○' : '○' === 前の印 ? '\xd7' : ''),
          Object.assign({}, 射手, { marks: 印 })
        );
      }
      return 射手;
    });
    updateSession(見ている記録.id, { archers: 直した });
  };
  const 鍵を切り替える = (射手ID, 塊) => {
    if (!見ている記録 || !isAdminMode) return;
    const 元 = 見ている記録.archers || [];
    const 押した列 = 元.findIndex((射手) => 射手.id === 射手ID);
    if (-1 === 押した列) return;
    const その射手 = 元[押した列];
    const 掛ける = !その射手.lockedBlocks?.[塊];
    let 塊の頭 = 押した列;
    for (; 塊の頭 > 0 && 元[塊の頭 - 1] && !元[塊の頭 - 1].isSeparator && !元[塊の頭 - 1].isTotalCalculator;)
      塊の頭--;
    const 直した = 元.map((射手, 番) => {
      if (番 >= 塊の頭 && 番 <= 押した列) {
        const 鍵の表 = Object.assign({}, 射手.lockedBlocks || {});
        return ((鍵の表[塊] = 掛ける), Object.assign({}, 射手, { lockedBlocks: 鍵の表 }));
      }
      return 射手;
    });
    updateSession(見ている記録.id, { archers: 直した });
  };
  const 部員を当てる = (射手ID, 部員) => {
    if (!見ている記録) return;
    const 直した = 見ている記録.archers.map((射手) =>
      射手.id === 射手ID
        ? Object.assign({}, 射手, {
            name: 部員.name,
            memberId: 部員.id,
            gender: 部員.gender,
            grade: 部員.grade,
            isGuest: false,
          })
        : 射手
    );
    updateSession(見ている記録.id, { archers: 直した });
  };
  const 客の名を付ける = (射手ID, 名前) => {
    if (!見ている記録) return;
    const 直した = 見ている記録.archers.map((射手) =>
      射手.id === 射手ID
        ? Object.assign({}, 射手, {
            name: 名前,
            isGuest: true,
            gender: '未設定',
            grade: 0,
            memberId: undefined,
          })
        : 射手
    );
    updateSession(見ている記録.id, { archers: 直した });
  };
  const 名前を外す = (射手ID) => {
    if (!見ている記録) return;
    const 直した = 見ている記録.archers.map((射手) =>
      射手.id === 射手ID
        ? Object.assign({}, 射手, {
            name: '',
            memberId: undefined,
            isGuest: false,
            gender: '未設定',
            grade: 0,
          })
        : 射手
    );
    updateSession(見ている記録.id, { archers: 直した });
  };
  const 射手を消す = (射手ID) => {
    if (!見ている記録) return;
    const 残り = 見ている記録.archers.filter((射手) => 射手.id !== 射手ID);
    updateSession(見ている記録.id, { archers: 残り });
  };
  const 人を選ぶ = (射手ID, 順) => {
    isAdminMode &&
      !ゴミ箱を見ている &&
      (選んだ射手IDを置く(射手ID), 選んだ射手の順を置く(順), 人の窓を出す(true));
  };
  const 外枠 = View;
  return (
    <外枠 style={styles.safeArea}>
      {'detail' === historyViewMode ? (
        詳細を描く()
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.listHeaderArea}>
            {isAdminMode && (
              <TouchableOpacity onPress={() => setAdminMode(false)} style={styles.adminDeactivate}>
                <Text style={styles.adminDeactivateText}>(管理者モード解除)</Text>
              </TouchableOpacity>
            )}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.listMainTitle}>過去の記録表</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {(isAdminMode || 'group' === activeRole) && (
                  <Pressable
                    onPress={選択を切り替える}
                    style={({ hovered }) => [
                      { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
                      hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
                    ]}
                  >
                    <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
                      {選択中 ? '完了' : '編集'}
                    </Text>
                  </Pressable>
                )}
                {(isAdminMode || 'group' === activeRole) && (
                  <Pressable // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="選んだ記録を消す"
                    aria-label="選んだ記録を消す"
                    onPress={ゴミ箱を開く}
                    style={({ hovered }) => [
                      { padding: 4, borderRadius: 20 },
                      hovered && { backgroundColor: 'rgba(255,59,48,0.05)' },
                    ]}
                  >
                    <Icons.Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          {選択中 && 選んだ記録.size > 0 && (
            <TouchableOpacity style={styles.batchDeleteBar} onPress={選んだ記録を消す}>
              <Icons.Ionicons name="trash" size={18} color="#FFF" />
              <Text style={styles.batchDeleteText}>{選んだ記録.size}件を削除</Text>
            </TouchableOpacity>
          )}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Icons.Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="日付や内容を検索（全期間対象）"
                placeholderTextColor="#8E8E93"
                value={検索の文}
                onChangeText={検索の文を置く}
              />
            </View>
          </View>
          {タグの一覧.length > 0 && (
            <View style={styles.tagFilterContainer}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#8E8E93' }}>タグフィルター</Text>
                <View
                  style={{ flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2 }}
                >
                  <TouchableOpacity
                    onPress={() => setHistoryTagLogic('AND')}
                    style={[
                      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                      'AND' === historyTagLogic && { backgroundColor: '#FFF' },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: 'AND' === historyTagLogic ? '#007AFF' : '#8E8E93',
                      }}
                    >
                      すべて含む
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setHistoryTagLogic('OR')}
                    style={[
                      { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                      'OR' === historyTagLogic && { backgroundColor: '#FFF' },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: 'OR' === historyTagLogic ? '#007AFF' : '#8E8E93',
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
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                <Pressable
                  style={({ hovered }) => [
                    styles.tagChip,
                    0 === historySelectedTags.length && styles.tagChipActive,
                    { backgroundColor: 0 === historySelectedTags.length ? '#007AFF' : '#E5E5EA' },
                    hovered && 0 !== historySelectedTags.length && { backgroundColor: '#D1D1D6' },
                  ]}
                  onPress={() => setHistorySelectedTags([])}
                >
                  <Text style={[styles.tagChipText, 0 === historySelectedTags.length && { color: '#FFF' }]}>
                    すべて解除
                  </Text>
                </Pressable>
                {タグの一覧.map((タグ, idx) => {
                  const 選ばれている = historySelectedTags.includes(タグ);
                  return (
                    <Pressable
                      key={typeof タグ === 'string' ? タグ : `tag-${idx}`}
                      style={({ hovered }) => [
                        styles.tagChip,
                        選ばれている && styles.tagChipActive,
                        { backgroundColor: 選ばれている ? '#007AFF' : '#F2F2F7' },
                        hovered && !選ばれている && { backgroundColor: '#E5E5EA' },
                      ]}
                      onPress={() => toggleHistoryTag(タグ)}
                    >
                      <Text style={[styles.tagChipText, 選ばれている && { color: '#FFF' }]}>
                        {typeof タグ === 'string' && タグ.startsWith('#') ? タグ.substring(1) : String(タグ)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
          {!検索の文 && (
            <>
              <View style={styles.yearSelectorContainer}>
                <Pressable
                  style={({ hovered }) => [
                    styles.yearButton,
                    hovered && { backgroundColor: 'rgba(88,86,214,0.05)' },
                  ]}
                  onPress={() => 年度の窓を出す(true)}
                >
                  <Text style={styles.yearButtonText}>
                    {年度の一覧.length > 0
                      ? `${見ている年度}年度 (${見ている年度}/04 - ${見ている年度 + 1}/03)`
                      : '記録なし'}
                  </Text>
                  <Icons.Ionicons name="chevron-expand" size={14} color="#5856D6" />
                </Pressable>
              </View>
              <ScrollView // 月が多いと画面幅を超える。横スクロールにして
                // 隠れた月へ届かせる（上のタグチップと同じ作り）
                ref={月の横流し}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.monthTabsScroll}
                contentContainerStyle={styles.monthTabsContent}
              >
                {月の一覧.map((月) => {
                  const 選ばれている = 見ている月 === 月;
                  return (
                    <Pressable
                      key={月}
                      style={({ hovered }) => [
                        styles.monthTab,
                        選ばれている && styles.monthTabActive,
                        hovered && !選ばれている && { backgroundColor: '#E5E5EA' },
                      ]}
                      onPress={() => 見ている月を置く(月)}
                    >
                      <Text style={[styles.monthTabText, 選ばれている && styles.monthTabTextActive]}>
                        {月.split('/')[1]}月
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
          {!!検索の文 && (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                「{検索の文}
                {'」の全期間検索結果: '}
                {絞った記録.length}件
              </Text>
            </View>
          )}
          <FlatList
            data={絞った記録}
            renderItem={記録の行}
            keyExtractor={(記録, idx) => (typeof 記録.id === 'string' ? 記録.id : `history-item-${idx}`)}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={仕切り線}
            ListEmptyComponent={<Text style={styles.emptyText}>記録がありません</Text>}
          />
        </View>
      )}
      <Modal visible={年度の窓} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => 年度の窓を出す(false)}>
          <View style={styles.yearModal}>
            <Text style={styles.yearModalTitle}>年度を選択</Text>
            {年度の一覧.map((年度) => (
              <TouchableOpacity
                key={年度}
                style={[styles.yearOption, 見ている年度 === 年度 && styles.yearOptionSelected]}
                onPress={() => {
                  見ている年度を置く(年度);
                  年度の窓を出す(false);
                }}
              >
                <Text style={[styles.yearOptionText, 見ている年度 === 年度 && styles.yearOptionTextSelected]}>
                  {年度}年度 ({年度}
                  {'/04 - '}
                  {年度 + 1}/03)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={ゴミ箱の窓} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '90%',
              height: '80%',
              backgroundColor: '#F2F2F7',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  ゴミ箱を編集中を置く(!ゴミ箱を編集中);
                  ゴミ箱で選んだを置く(new Set());
                }}
              >
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '500' }}>
                  {ゴミ箱を編集中 ? '完了' : '編集'}
                </Text>
              </TouchableOpacity>
              {ゴミ箱を編集中 ? (
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (0 === ゴミ箱で選んだ.size) return;
                      // まとめて戻す。1件ずつ待つと、通信できないときに
                      // 1件目の送信が終わらず、残りが戻らないまま画面も
                      // 反応しなくなる。
                      useScoreStore.getState().restoreTrashItems(Array.from(ゴミ箱で選んだ));
                      ゴミ箱で選んだを置く(new Set());
                      ゴミ箱を編集中を置く(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: ゴミ箱で選んだ.size > 0 ? '#007AFF' : '#C6C6C8',
                        fontWeight: '500',
                      }}
                    >
                      復元
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => {
                      if (0 === ゴミ箱で選んだ.size) return;
                      const 消す = () => {
                        const 消すID = Array.from(ゴミ箱で選んだ);
                        useScoreStore.getState().deleteTrashItems(消すID);
                        ゴミ箱で選んだを置く(new Set());
                        ゴミ箱を編集中を置く(false);
                        if (trash.length - 消すID.length <= 0) ゴミ箱の窓を出す(false);
                      };
                      Alert.alert('完全に削除', '選択したゴミ箱の記録を完全に削除します。よろしいですか？', [
                        { text: 'キャンセル', style: 'cancel' },
                        { text: '削除', style: 'destructive', onPress: 消す },
                      ]);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: ゴミ箱で選んだ.size > 0 ? '#FF3B30' : '#C6C6C8',
                        fontWeight: '500',
                      }}
                    >
                      削除
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (0 !== trash.length)
                        Alert.alert(
                          'ゴミ箱を空にする',
                          'ゴミ箱内のすべての記録を完全に削除します。よろしいですか？',
                          [
                            { text: 'キャンセル', style: 'cancel' },
                            {
                              text: '空にする',
                              style: 'destructive',
                              onPress: () => {
                                emptyTrash();
                                ゴミ箱の窓を出す(false);
                              },
                            },
                          ]
                        );
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: trash.length > 0 ? '#FF3B30' : '#C6C6C8',
                        fontWeight: '500',
                      }}
                    >
                      すべて削除
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => ゴミ箱の窓を出す(false)}>
                    <Icons.Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold' }}>ゴミ箱</Text>
            </View>
            <View style={{ paddingHorizontal: 16, flex: 1 }}>
              <View
                style={{
                  backgroundColor: '#FFF',
                  borderRadius: 10,
                  overflow: 'hidden',
                  paddingHorizontal: 16,
                  flex: 1,
                }}
              >
                <FlatList
                  data={trash}
                  keyExtractor={(記録) => 記録.id}
                  ItemSeparatorComponent={() => (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA' }} />
                  )}
                  ListEmptyComponent={
                    <Text
                      style={{ textAlign: 'center', color: '#8E8E93', paddingVertical: 40, fontSize: 16 }}
                    >
                      ゴミ箱は空です
                    </Text>
                  }
                  renderItem={({ item: 記録 }) => {
                    const 日付 = new Date(記録.date);
                    const 日付の文 = `${日付.getFullYear()}年${日付.getMonth() + 1}月${日付.getDate()}日`;
                    // 押すと中身を見られる（見るだけ）。選んでいる最中は選ぶ・外すに使う
                    return (
                      <Pressable
                        testID={`ゴミ箱の記録-${記録.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={
                          ゴミ箱を編集中 ? `${日付の文} を選ぶ` : `${日付の文} の記録を見る`
                        }
                        aria-label={ゴミ箱を編集中 ? `${日付の文} を選ぶ` : `${日付の文} の記録を見る`}
                        onPress={() => {
                          if (ゴミ箱を編集中) return void ゴミ箱の選択を切り替える(記録.id);
                          setゴミ箱の記録(記録.id);
                          setSelectedHistorySessionId(記録.id);
                          setHistoryViewMode('detail');
                          ゴミ箱の窓を出す(false);
                          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                        }}
                        style={({ hovered }) => [
                          {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 14,
                          },
                          hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
                          IS_WEB && { cursor: 'pointer' },
                        ]}
                      >
                        {ゴミ箱を編集中 && (
                          <TouchableOpacity
                            onPress={() => ゴミ箱の選択を切り替える(記録.id)}
                            style={{ marginRight: 12, paddingVertical: 4 }}
                          >
                            <Icons.Ionicons
                              name={ゴミ箱で選んだ.has(記録.id) ? 'checkmark-circle' : 'ellipse-outline'}
                              size={22}
                              color={ゴミ箱で選んだ.has(記録.id) ? '#007AFF' : '#C7C7CC'}
                            />
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                            {日付の文} {記録.title ? `[${記録.title}]` : ''}
                          </Text>
                          {!!記録.note && (
                            <Text style={{ fontSize: 12, color: '#000', marginTop: 4 }} numberOfLines={1}>
                              {記録.note}
                            </Text>
                          )}
                        </View>
                        {!ゴミ箱を編集中 && (
                          <TouchableOpacity onPress={() => restoreSession(記録.id)}>
                            <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '500' }}>復元</Text>
                          </TouchableOpacity>
                        )}
                        {!ゴミ箱を編集中 && (
                          <Icons.Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#C7C7CC"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={削除の確認} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>{消す記録ID ? '記録を削除' : '選択した記録を削除'}</Text>
            <Text style={styles.confirmMessage}>選択した記録をゴミ箱に移動しますか？</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]}
                onPress={() => {
                  削除の確認を出す(false);
                  消す記録IDを置く(null);
                }}
              >
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]}
                onPress={async () => {
                  消す記録ID
                    ? (deleteSession(消す記録ID), 消す記録IDを置く(null), setHistoryViewMode('list'))
                    : (deleteMultipleSessions(Array.from(選んだ記録)),
                      選んだ記録を置く(new Set()),
                      選択中を置く(false));
                  削除の確認を出す(false);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>移動する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={管理者の品書き}
        transparent
        animationType="fade"
        onRequestClose={() => 管理者の品書きを出す(false)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => 管理者の品書きを出す(false)}
        >
          <View style={styles.adminMenuContent}>
            {/* 記録表そのものの直しは、記録画面に載せ替えて行う（人・間隔・計を足す、 */
            /* 並べ替え・矢所・射数・交代・画像からの読み取り）。ここに在った「人追加・ */
            /* 間隔追加・計追加」は記録画面で足せるので外した（使う人の指摘 2026-09-17） */}
            {!ゴミ箱を見ている && (
              <TouchableOpacity
                style={styles.adminMenuItem}
                accessibilityRole="button"
                accessibilityLabel="記録画面で直す"
                aria-label="記録画面で直す"
                onPress={() => {
                  if (!見ている記録) return;
                  管理者の品書きを出す(false);
                  if (
                    typeof 履歴の記録を記録画面で開く !== 'function' ||
                    !履歴の記録を記録画面で開く(見ている記録.id)
                  ) {
                    窓.出す(
                      'いまは直せません',
                      'ライブ中か、別の記録を直している途中です。先にそちらを終えてください。'
                    );
                    return;
                  }
                  航路.navigate('記録');
                }}
              >
                <Icons.Ionicons name="open-outline" size={20} color="#FF9500" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.adminMenuText}>記録画面で直す</Text>
                  <Text style={{ fontSize: 11, color: '#8E8E93', marginLeft: 12 }}>
                    並べ替え・矢所・射数など、記録表の道具をすべて使う
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {/* 記録の情報（日付・題・メモ・タグ・出欠）の窓。前は「記録を編集」で、 */
            /* 何が直せるのか分からなかった */}
            <TouchableOpacity
              style={styles.adminMenuItem}
              accessibilityRole="button"
              accessibilityLabel="記録の情報を変える"
              aria-label="記録の情報を変える"
              onPress={() => {
                管理者の品書きを出す(false);
                記録の情報の窓を出す(true);
              }}
            >
              <Icons.Ionicons name="create-outline" size={20} color="#5856D6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.adminMenuText}>記録の情報を変える</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93', marginLeft: 12 }}>
                  日付・題・メモ・タグ・出欠
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <EditSessionModal
        visible={記録の情報の窓}
        session={見ている記録}
        onClose={() => 記録の情報の窓を出す(false)}
        onSave={(変更) => updateSession(見ている記録.id, 変更)}
      />
      <ArcherActionModal
        visible={人の窓}
        archerId={選んだ射手ID || ''}
        archerName={見ている記録?.archers?.find((射手) => 射手.id === 選んだ射手ID)?.name || ''}
        archerOrigIdx={選んだ射手の順}
        isSeparator={見ている記録?.archers?.find((射手) => 射手.id === 選んだ射手ID)?.isSeparator || false}
        isTotalCalculator={
          見ている記録?.archers?.find((射手) => 射手.id === 選んだ射手ID)?.isTotalCalculator || false
        }
        onClose={() => 人の窓を出す(false)}
        onSubstitution={() => 交代の窓を出す(true)}
        onSetMember={(部員) => 部員を当てる(選んだ射手ID, 部員)}
        onSetGuestName={(名前) => 客の名を付ける(選んだ射手ID, 名前)}
        onClearName={() => 名前を外す(選んだ射手ID)}
        onDeleteArcher={射手を消す}
        onAddArcher={(位置) => {
          if (!見ている記録) return;
          const 新しい射手 = newArcher(見ている記録.shotCount || 8);
          const 直した = [...並びにする(見ている記録.archers)];
          直した.splice(位置, 0, 新しい射手);
          updateSession(見ている記録.id, { archers: 直した });
        }}
        onAddSeparator={(位置) => {
          if (!見ている記録) return;
          const 区切り = newSeparator();
          const 直した = [...並びにする(見ている記録.archers)];
          直した.splice(位置, 0, 区切り);
          updateSession(見ている記録.id, { archers: 直した });
        }}
        onAddTotal={(位置) => {
          if (!見ている記録) return;
          const 合計の列 = newTotalCalculator(見ている記録.shotCount || 8);
          const 直した = [...並びにする(見ている記録.archers)];
          直した.splice(位置, 0, 合計の列);
          updateSession(見ている記録.id, { archers: 直した });
        }}
        existingArchers={並びにする(見ている記録?.archers)}
      />
      <ManualSubstitutionModal
        visible={交代の窓}
        archerId={選んだ射手ID}
        onClose={() => 交代の窓を出す(false)}
      />
    </外枠>
  );
};
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.HistoryScreen = HistoryScreen;
