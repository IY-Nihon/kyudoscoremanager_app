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
const v = () => <View style={{ height: 1, backgroundColor: '#E5E5EA', marginLeft: 16 }} />;
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
  const ee = useScoreStore((e) => e.myMemberName) || '';
  const [te, re] = React.useState('');
  const [oe, ne] = React.useState('');
  const [ie, le] = React.useState(() => {
    const e = new Date();
    return e.getMonth() + 1 >= 4 ? e.getFullYear() : e.getFullYear() - 1;
  });
  const [ae, se] = React.useState(false);
  const [de, ce] = React.useState(false);
  const [ue, he] = React.useState(new Set());
  const [ge, fe] = React.useState(false);
  const [me, xe] = React.useState(false);
  const [ye, be] = React.useState(new Set());
  const [pe, je] = React.useState(false);
  const [Ce, Fe] = React.useState(false);
  const [Se, we] = React.useState(false);
  const [Te, Ae] = React.useState(null);
  const [ze, Ie] = React.useState(false);
  const [ke, ve] = React.useState(null);
  const [De, Ee] = React.useState(0);
  const [Be, We] = React.useState(false);
  const // ゴミ箱から開いて見ている記録の id。ゴミ箱の中は見るだけ（直す・消す・
    // 前後へ送るは出さない）で、画面にもゴミ箱の中だと分かる帯を出す
    [ゴミ箱の記録, setゴミ箱の記録] = React.useState(null);
  const Re = React.useRef(null);
  const Oe = React.useRef(null);
  const Me = (e) => {
    const t = e.nativeEvent.contentOffset.x;
    Oe.current?.scrollTo({ x: t, animated: false });
  };
  const He = (e) => {
    const t = e.nativeEvent.contentOffset.x;
    Re.current?.scrollTo({ x: t, animated: false });
  };
  const Pe = React.useMemo(() => {
    const e = myMemberId;
    const t = ee;
    const o =
      sessions.find((e) => e.id === selectedHistorySessionId) ||
      // ゴミ箱から開いたときだけ、ゴミ箱の中も探す
      (ゴミ箱の記録 && ゴミ箱の記録 === selectedHistorySessionId
        ? trash.find((e) => e && e.id === selectedHistorySessionId)
        : null) ||
      null;
    if (o && 'member' === activeRole && e) {
      // 判定は syncRules の 自分の射手か に出した。ここは交代の判定で
      // 射手ではなく記録のほう(o)を見ていて、交代で入った自分を拾えず、
      // すぐ下の mySessions とも食い違っていた
      const n = (射手) => 自分の射手か(射手, e, t);
      const l = o.archers.find(n);
      return Object.assign({}, o, {
        archers: o.archers.filter(n),
        archerNames: [l?.name || '自分'].filter(Boolean),
      });
    }
    return o;
  }, [sessions, trash, selectedHistorySessionId, ゴミ箱の記録, activeRole, myMemberId, ee]);
  const // いま見ている記録がゴミ箱の中か。復元されて記録に戻ったら、ふつうの詳細になる
    ゴミ箱を見ている =
      !!Pe &&
      !!ゴミ箱の記録 &&
      Pe.id === ゴミ箱の記録 &&
      !sessions.some((e) => e && e.id === Pe.id) &&
      trash.some((e) => e && e.id === Pe.id);
  const mySessions = React.useMemo(() => {
    let e = sessions || [];
    const t = myMemberId;
    const o = ee;
    if ('member' === activeRole && t) {
      e = e.filter((記録) => 自分の記録か(記録, t, o));
    }
    return e;
  }, [sessions, activeRole, myMemberId, ee]);
  const Le = (e) => {
    const t = new Set(ye);
    if (t.has(e)) t.delete(e);
    else t.add(e);
    be(t);
  };
  const Ve = (e) => {
    if (de) {
      const t = new Set(ue);
      return (t.has(e.id) ? t.delete(e.id) : t.add(e.id), void he(t));
    }
    setSelectedHistorySessionId(e.id);
    setHistoryViewMode('detail');
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
  };
  const $e = React.useMemo(() => {
    const e = new Set();
    const t = new Date();
    const o = t.getMonth() + 1 >= 4 ? t.getFullYear() : t.getFullYear() - 1;
    e.add(o);
    mySessions.forEach((t) => {
      const o = 'number' == typeof t.date ? t.date : Number(t.date);
      if (isNaN(o)) return;
      const n = new Date(o);
      const l = n.getFullYear();
      const a = n.getMonth() + 1 >= 4 ? l : l - 1;
      e.add(a);
    });
    return Array.from(e).sort((e, t) => t - e);
  }, [mySessions]);
  const Ne = React.useMemo(() => {
    const e = new Set();
    return (
      mySessions.forEach((t) => {
        if (t.tags && Array.isArray(t.tags)) t.tags.forEach((t) => e.add(t));
      }),
      Array.from(e).sort((e, t) => {
        const o = historySelectedTags.includes(e);
        const n = historySelectedTags.includes(t);
        return o && !n ? -1 : !o && n ? 1 : e.localeCompare(t);
      })
    );
  }, [mySessions, historySelectedTags]);
  const Ge = React.useMemo(() => {
    const e = new Set();
    return (
      mySessions.forEach((t) => {
        const o = new Date(t.date);
        const n = o.getFullYear();
        const l = o.getMonth() + 1;
        if ((l >= 4 ? n : n - 1) === ie) e.add(`${n}/${String(l).padStart(2, '0')}`);
      }),
      Array.from(e).sort((e, t) => e.localeCompare(t))
    );
  }, [mySessions, ie]);
  React.useEffect(() => {
    if (!$e.includes(ie)) le($e[0]);
  }, [$e, ie]);
  React.useEffect(() => {
    Ge.length > 0 ? Ge.includes(oe) || ne(Ge[Ge.length - 1]) : ne('');
  }, [Ge, oe]);
  React.useEffect(() => {
    if ('detail' === historyViewMode && Pe && focusedMemberId) {
      const archersList = Ue(Pe.archers);
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
          Re.current?.scrollTo({ x: targetX, animated: true });
          Oe.current?.scrollTo({ x: targetX, animated: true });
          setFocusedMemberId(null);
        }, 300);
      } else {
        setFocusedMemberId(null);
      }
    }
  }, [historyViewMode, Pe, focusedMemberId]);
  const Ye = React.useMemo(() => {
    let e = mySessions || [];
    return e
      .filter((e) => {
        if (!e) return false;
        const t = 'number' == typeof e.date ? e.date : Number(e.date);
        if (isNaN(t)) return false;
        const o = new Date(t);
        const n = o.getFullYear();
        const l = o.getMonth() + 1;
        const a = l >= 4 ? n : n - 1;
        const s = te.trim().length > 0;
        if (historySelectedTags.length > 0) {
          const t = e.tags || [];
          if ('AND' === historyTagLogic) {
            if (!historySelectedTags.every((e) => t.includes(e))) return false;
          } else {
            if (!historySelectedTags.some((e) => t.includes(e))) return false;
          }
        }
        if (!s) {
          if (a !== ie) return false;
          if (`${n}/${String(l).padStart(2, '0')}` !== oe) return false;
        }
        if (s) {
          const t = te.toLowerCase();
          const n = (e.title || '').toLowerCase().includes(t);
          const l = (e.note || '').toLowerCase().includes(t);
          const a =
            `${o.getFullYear()}/${String(o.getMonth() + 1).padStart(2, '0')}/${String(o.getDate()).padStart(2, '0')}`.includes(
              t
            );
          const s = e.archers || [];
          const d = (Array.isArray(s) ? s : 'object' == typeof s ? Object.values(s) : []).some((e) =>
            (e?.name || '').toLowerCase().includes(t)
          );
          if (!(n || a || l || d)) return false;
        }
        return true;
      })
      .sort((e, t) => t.date - e.date);
  }, [mySessions, te, oe, ie, historySelectedTags, historyTagLogic]);
  const Ue = (e) =>
    e
      ? Array.isArray(e)
        ? e.filter(Boolean)
        : 'object' == typeof e
          ? Object.values(e).filter(Boolean)
          : []
      : [];
  if (!isHydrated) return null;
  const qe = () => {
    if (!Pe)
      return (
        <View style={E.center}>
          <Text style={E.emptyText}>記録が見つかりません</Text>
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
    const t = new Date(Pe.date);
    const l = `${t.getFullYear()}/${String(t.getMonth() + 1).padStart(2, '0')}/${String(t.getDate()).padStart(2, '0')}`;
    const a = Pe.shotCount || 8;
    const d = Ue(Pe.archers).map((e) =>
      Object.assign({}, e, {
        marks: Array.isArray(e.marks) ? e.marks : e.marks ? Object.values(e.marks) : Array(a).fill(''),
        lockedBlocks: e.lockedBlocks || {},
        isSeparator: e.isSeparator || false,
        isTotalCalculator: e.isTotalCalculator || false,
        isGuest: e.isGuest || false,
      })
    );
    const c = (e) => {
      const t = Ye.findIndex((e) => e.id === Pe.id);
      -1 !== t &&
        ('prev' === e && t < Ye.length - 1
          ? setSelectedHistorySessionId(Ye[t + 1].id)
          : 'next' === e && t > 0 && setSelectedHistorySessionId(Ye[t - 1].id));
    };
    return (
      <View style={E.detailContainer}>
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
              ゴミ箱を見ている && (setゴミ箱の記録(null), fe(true));
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
                onPress={() => c('prev')}
                style={({ hovered: e }) => [
                  { padding: 4, borderRadius: 20 },
                  e && { backgroundColor: 'rgba(0,122,255,0.05)' },
                ]}
              >
                <Icons.Ionicons name="chevron-back" size={24} color="#007AFF" />
              </Pressable>
              <Pressable
                onPress={() => c('next')}
                style={({ hovered: e }) => [
                  { padding: 4, borderRadius: 20 },
                  e && { backgroundColor: 'rgba(0,122,255,0.05)' },
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
          <View testID="ゴミ箱の帯" style={E.trashBanner}>
            <Icons.Ionicons name="trash-outline" size={18} color="#FFF" />
            <Text style={E.trashBannerText}>ゴミ箱の中の記録です。見るだけで、直せません</Text>
            {(isAdminMode || 'group' === activeRole) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="この記録を復元する"
                aria-label="この記録を復元する"
                onPress={() => {
                  restoreSession(Pe.id);
                  setゴミ箱の記録(null);
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                }}
                style={({ hovered: e }) => [E.trashBannerBtn, e && { opacity: 0.85 }]}
              >
                <Text style={E.trashBannerBtnText}>復元</Text>
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
                  if (!Pe) return;
                  const id = Pe.id;
                  窓.出す('完全に削除', 'この記録をゴミ箱からも消します。元に戻せません。よろしいですか？', [
                    { text: 'キャンセル', style: 'cancel' },
                    {
                      text: '削除',
                      style: 'destructive',
                      onPress: () => {
                        useScoreStore.getState().deleteTrashItems([id]);
                        setゴミ箱の記録(null);
                        setHistoryViewMode('list');
                        fe(true);
                      },
                    },
                  ]);
                }}
                style={({ hovered: e }) => [
                  E.trashBannerBtn,
                  { backgroundColor: '#FF3B30' },
                  e && { opacity: 0.85 },
                ]}
              >
                <Text style={[E.trashBannerBtnText, { color: '#FFF' }]}>完全に削除</Text>
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
            <Text style={E.detailDate}>{l}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* 縦横の切り替え。見るだけの人にも要るので、 */
              /* 消す・直すの権限とは別に、いつでも出す */}
              <Pressable
                accessible
                accessibilityRole="button"
                accessibilityLabel={横に並べる ? '縦に並べる' : '横に並べる'}
                aria-label={横に並べる ? '縦に並べる' : '横に並べる'}
                onPress={() => set横に並べる && set横に並べる(!横に並べる)}
                style={({ hovered: e }) => [
                  { padding: 4, borderRadius: 20, alignItems: 'center', marginRight: 8 },
                  e && { backgroundColor: 'rgba(0,122,255,0.05)' },
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
                      Ae(Pe.id);
                      we(true);
                    }}
                    style={({ hovered: e }) => [
                      { padding: 4, borderRadius: 20 },
                      e && { backgroundColor: 'rgba(255,59,48,0.05)' },
                    ]}
                  >
                    <Icons.Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </Pressable>
                  {isAdminMode && (
                    <Pressable
                      onPress={() => je(true)} // 絵だけのボタン。読み上げと検査のために名前を付ける
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="記録の道具"
                      aria-label="記録の道具"
                      style={({ hovered: e }) => [
                        { marginLeft: 16, padding: 4, borderRadius: 20 },
                        e && { backgroundColor: 'rgba(0,122,255,0.05)' },
                      ]}
                    >
                      <Icons.Ionicons name="menu" size={26} color="#007AFF" />
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </View>
          {!!Pe.title && <Text style={E.detailTitle}>{Pe.title}</Text>}
          {!!Pe.note && (
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
              <Text style={{ fontSize: 13, color: '#3C3C43' }}>{Pe.note}</Text>
            </View>
          )}
        </View>
        <View style={[E.detailTableArea, { justifyContent: 'center', alignItems: 'center' }]}>
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
                        {d.map((射手, 順) => (
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
                                const 色 = (組.チームを割り当てる(d).find((x) => x && x.id === 射手.id) || {})
                                  .色;
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
                                onPress={() => it(射手.id, 順)}
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
                          style={{ flexDirection: 'column', width: UIConfig.cellWidth * (a + 1) * viewScale }}
                        >
                          <LabelColumn shots={a} showFooter={false} 横並び />
                          {d.map((射手, 順) => (
                            <ArcherColumnView
                              key={typeof 射手.id === 'string' ? `行-${射手.id}` : `行-${順}`}
                              archer={射手}
                              shots={a}
                              allArchers={d}
                              indexInList={順}
                              showFooter={false}
                              横並び
                              isReadOnly={!isAdminMode}
                              isAdminMode={isAdminMode}
                              onPressName={() => it(射手.id, 順)}
                              onDelete={() => nt(射手.id)}
                              onToggleMark={Ze}
                              onToggleLock={et}
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
                        <LabelColumn shots={a} showFooter={false} />
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        style={{ flexGrow: 0, flexShrink: 1 }}
                        ref={Re}
                        onScroll={Me}
                        scrollEventThrottle={16}
                      >
                        <View style={{ flexDirection: 'row-reverse' }}>
                          {d.map((e, t) => (
                            <ArcherColumnView
                              key={typeof e.id === 'string' ? e.id : `archer-${t}`}
                              archer={e}
                              shots={a}
                              allArchers={d}
                              indexInList={t}
                              showFooter={false}
                              isReadOnly={!isAdminMode}
                              isAdminMode={isAdminMode}
                              onPressName={() => it(e.id, t)}
                              onDelete={() => nt(e.id)}
                              onToggleMark={Ze}
                              onToggleLock={et}
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
                      ref={Oe}
                      onScroll={He}
                      scrollEventThrottle={16}
                    >
                      <View style={{ flexDirection: 'row-reverse' }}>
                        {d.map((t, l) => {
                          return (
                            <View
                              key={typeof t.id === 'string' ? `footer-${t.id}` : `footer-${l}`}
                              style={{
                                width:
                                  (t.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * viewScale,
                                height: UIConfig.footerHeight * viewScale,
                                backgroundColor: t.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                                borderRightWidth: t.isSeparator || t.isTotalCalculator ? 1.5 : 1,
                                borderRightColor: '#000',
                                borderLeftWidth: t.isSeparator || t.isTotalCalculator ? 1.5 : 0,
                                borderLeftColor: '#000',
                                padding: 4,
                                justifyContent: 'center',
                                alignItems: 'center',
                                // チームの色。記録中と同じ見え方にする
                                ...(() => {
                                  const 色 = (組.チームを割り当てる(d).find((x) => x && x.id === t.id) || {})
                                    .色;
                                  return 色 ? { borderTopWidth: 3 * viewScale, borderTopColor: 色 } : null;
                                })(),
                              }}
                            >
                              {t.isSeparator ? (
                                // 区切りに付けたチーム名。保存はされているのに
                                // 履歴では出していなかった
                                組.区切りのチーム名(t) ? (
                                  <Text
                                    style={{
                                      fontSize: 組.区切りの名の字(viewScale, UIConfig).fontSize,
                                      lineHeight: 組.区切りの名の字(viewScale, UIConfig).lineHeight,
                                      fontWeight: '700',
                                      textAlign: 'center',
                                      color: 組.チームの色(組.区切りのチーム名(t)) || '#8E8E93',
                                    }} // 記録中と同じく、欄の高さに入るだけ行を使う
                                    numberOfLines={組.区切りの名の字(viewScale, UIConfig).numberOfLines}
                                  >
                                    {組.区切りのチーム名(t)}
                                  </Text>
                                ) : null
                              ) : (
                                !t.isSeparator && (
                                  <TouchableOpacity
                                    style={{
                                      alignItems: 'center',
                                      width: '100%',
                                      height: '100%',
                                      justifyContent: 'center',
                                    }}
                                    onPress={() => it(t.id, l)}
                                    disabled={!isAdminMode}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 14 * viewScale,
                                        fontWeight: '400',
                                        color: t.name ? '#000' : '#8E8E93',
                                      }}
                                      numberOfLines={2}
                                    >
                                      {t.isTotalCalculator
                                        ? '合計'
                                        : t.name
                                          ? ((a = t.name), formatMemberName(a, members || []))
                                          : '選択'}
                                    </Text>
                                    {t.isGuest ? (
                                      <Text
                                        style={{ fontSize: 9 * viewScale, color: '#3C3C43', marginTop: 2 }}
                                      >
                                        (ゲスト)
                                      </Text>
                                    ) : null}
                                    {t.isTotalCalculator || '' === t.name ? null : (
                                      <View
                                        style={{
                                          marginTop: 2,
                                          paddingHorizontal: 4,
                                          paddingVertical: 2,
                                          borderRadius: 10,
                                          backgroundColor:
                                            t.isGuest ||
                                            !t.gender ||
                                            t.gender === '未設定' ||
                                            !['男子', '女子'].includes(t.gender)
                                              ? '#8E8E93'
                                              : '男子' === t.gender
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
                          var a;
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
  const Je = ({ item }) => {
    const t = new Date(item.date);
    const l = `${t.getFullYear()}/${String(t.getMonth() + 1).padStart(2, '0')}/${String(t.getDate()).padStart(2, '0')}`;
    const a = Ue(item.archers).filter((e) => !e.isSeparator && !e.isTotalCalculator).length;
    const s = ue.has(item.id);
    return (
      <Pressable
        style={({ hovered: e }) => [
          E.recordItem,
          de && s && { backgroundColor: 'rgba(0,122,255,0.1)' },
          e && !s && { backgroundColor: 'rgba(0,122,255,0.05)' },
          IS_WEB && { cursor: 'pointer' },
        ]}
        onPress={() => Ve(item)}
      >
        {de && (
          <View style={{ marginRight: 12 }}>
            <Icons.Ionicons
              name={s ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={s ? '#007AFF' : '#C7C7CC'}
            />
          </View>
        )}
        <View style={E.itemLeft}>
          <View style={E.titleRow}>
            <Text style={E.itemDateText}>{l}</Text>
            {!!item.title && (
              <Text style={E.itemTitleText}>
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
          <Text style={E.itemSubText}>
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
            <View style={E.itemTagsContainer}>
              {item.tags.map((t, i) => (
                <View key={typeof t == 'string' ? `tag-${t}-${i}` : `tag-obj-${i}`} style={E.itemTagChip}>
                  <Text style={E.itemTagText}>{typeof t == 'string' ? t.replace(/^#/, '') : String(t)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={E.itemRight}>
          <View style={E.countBadge}>
            <Text style={E.countBadgeText}>{a}人</Text>
          </View>
          {!de && <Icons.Ionicons name="chevron-forward" size={18} color="#C7C7CC" />}
        </View>
      </Pressable>
    );
  };
  const Ke = () => {
    fe(true);
  };
  const Qe = () => {
    de ? (ce(false), he(new Set())) : (ce(true), he(new Set()));
  };
  const Xe = () => {
    if (0 !== ue.size) we(true);
  };
  const Ze = (e, t) => {
    if (!Pe || !isAdminMode) return;
    const o = Pe.archers.map((o) => {
      if (o.id === e) {
        const e = [...o.marks];
        const n = e[t];
        return ((e[t] = '' === n ? '○' : '○' === n ? '\xd7' : ''), Object.assign({}, o, { marks: e }));
      }
      return o;
    });
    updateSession(Pe.id, { archers: o });
  };
  const et = (e, t) => {
    if (!Pe || !isAdminMode) return;
    const o = Pe.archers || [];
    const n = o.findIndex((t) => t.id === e);
    if (-1 === n) return;
    const l = o[n];
    const a = !l.lockedBlocks?.[t];
    let s = n;
    for (; s > 0 && o[s - 1] && !o[s - 1].isSeparator && !o[s - 1].isTotalCalculator;) s--;
    const d = o.map((e, o) => {
      if (o >= s && o <= n) {
        const o = Object.assign({}, e.lockedBlocks || {});
        return ((o[t] = a), Object.assign({}, e, { lockedBlocks: o }));
      }
      return e;
    });
    updateSession(Pe.id, { archers: d });
  };
  const tt = (e, t) => {
    if (!Pe) return;
    const o = Pe.archers.map((o) =>
      o.id === e
        ? Object.assign({}, o, {
            name: t.name,
            memberId: t.id,
            gender: t.gender,
            grade: t.grade,
            isGuest: false,
          })
        : o
    );
    updateSession(Pe.id, { archers: o });
  };
  const rt = (e, t) => {
    if (!Pe) return;
    const o = Pe.archers.map((o) =>
      o.id === e
        ? Object.assign({}, o, { name: t, isGuest: true, gender: '未設定', grade: 0, memberId: undefined })
        : o
    );
    updateSession(Pe.id, { archers: o });
  };
  const ot = (e) => {
    if (!Pe) return;
    const t = Pe.archers.map((t) =>
      t.id === e
        ? Object.assign({}, t, { name: '', memberId: undefined, isGuest: false, gender: '未設定', grade: 0 })
        : t
    );
    updateSession(Pe.id, { archers: t });
  };
  const nt = (e) => {
    if (!Pe) return;
    const t = Pe.archers.filter((t) => t.id !== e);
    updateSession(Pe.id, { archers: t });
  };
  const it = (e, t) => {
    isAdminMode && !ゴミ箱を見ている && (ve(e), Ee(t), Ie(true));
  };
  const Lt要素 = View;
  return (
    <Lt要素 style={E.safeArea}>
      {'detail' === historyViewMode ? (
        qe()
      ) : (
        <View style={{ flex: 1 }}>
          <View style={E.listHeaderArea}>
            {isAdminMode && (
              <TouchableOpacity onPress={() => setAdminMode(false)} style={E.adminDeactivate}>
                <Text style={E.adminDeactivateText}>(管理者モード解除)</Text>
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
                <Text style={E.listMainTitle}>過去の記録表</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {(isAdminMode || 'group' === activeRole) && (
                  <Pressable
                    onPress={Qe}
                    style={({ hovered: e }) => [
                      { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
                      e && { backgroundColor: 'rgba(0,122,255,0.05)' },
                    ]}
                  >
                    <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
                      {de ? '完了' : '編集'}
                    </Text>
                  </Pressable>
                )}
                {(isAdminMode || 'group' === activeRole) && (
                  <Pressable // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                    accessible
                    accessibilityRole="button"
                    accessibilityLabel="選んだ記録を消す"
                    aria-label="選んだ記録を消す"
                    onPress={Ke}
                    style={({ hovered: e }) => [
                      { padding: 4, borderRadius: 20 },
                      e && { backgroundColor: 'rgba(255,59,48,0.05)' },
                    ]}
                  >
                    <Icons.Ionicons name="trash-outline" size={22} color="#FF3B30" />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          {de && ue.size > 0 && (
            <TouchableOpacity style={E.batchDeleteBar} onPress={Xe}>
              <Icons.Ionicons name="trash" size={18} color="#FFF" />
              <Text style={E.batchDeleteText}>{ue.size}件を削除</Text>
            </TouchableOpacity>
          )}
          <View style={E.searchContainer}>
            <View style={E.searchBar}>
              <Icons.Ionicons name="search" size={18} color="#8E8E93" style={E.searchIcon} />
              <TextInput
                style={E.searchInput}
                placeholder="日付や内容を検索（全期間対象）"
                placeholderTextColor="#8E8E93"
                value={te}
                onChangeText={re}
              />
            </View>
          </View>
          {Ne.length > 0 && (
            <View style={E.tagFilterContainer}>
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
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                <Pressable
                  style={({ hovered: e }) => [
                    E.tagChip,
                    0 === historySelectedTags.length && E.tagChipActive,
                    { backgroundColor: 0 === historySelectedTags.length ? '#007AFF' : '#E5E5EA' },
                    e && 0 !== historySelectedTags.length && { backgroundColor: '#D1D1D6' },
                  ]}
                  onPress={() => setHistorySelectedTags([])}
                >
                  <Text style={[E.tagChipText, 0 === historySelectedTags.length && { color: '#FFF' }]}>
                    すべて解除
                  </Text>
                </Pressable>
                {Ne.map((e, idx) => {
                  const t = historySelectedTags.includes(e);
                  return (
                    <Pressable
                      key={typeof e === 'string' ? e : `tag-${idx}`}
                      style={({ hovered: e }) => [
                        E.tagChip,
                        t && E.tagChipActive,
                        { backgroundColor: t ? '#007AFF' : '#F2F2F7' },
                        e && !t && { backgroundColor: '#E5E5EA' },
                      ]}
                      onPress={() => toggleHistoryTag(e)}
                    >
                      <Text style={[E.tagChipText, t && { color: '#FFF' }]}>
                        {typeof e === 'string' && e.startsWith('#') ? e.substring(1) : String(e)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
          {!te && (
            <>
              <View style={E.yearSelectorContainer}>
                <Pressable
                  style={({ hovered: e }) => [E.yearButton, e && { backgroundColor: 'rgba(88,86,214,0.05)' }]}
                  onPress={() => se(true)}
                >
                  <Text style={E.yearButtonText}>
                    {$e.length > 0 ? `${ie}年度 (${ie}/04 - ${ie + 1}/03)` : '記録なし'}
                  </Text>
                  <Icons.Ionicons name="chevron-expand" size={14} color="#5856D6" />
                </Pressable>
              </View>
              <ScrollView // 月が多いと画面幅を超える。横スクロールにして
                // 隠れた月へ届かせる（上のタグチップと同じ作り）
                horizontal
                showsHorizontalScrollIndicator={false}
                style={E.monthTabsScroll}
                contentContainerStyle={E.monthTabsContent}
              >
                {Ge.map((e) => {
                  const t = oe === e;
                  return (
                    <Pressable
                      key={e}
                      style={({ hovered: e }) => [
                        E.monthTab,
                        t && E.monthTabActive,
                        e && !t && { backgroundColor: '#E5E5EA' },
                      ]}
                      onPress={() => ne(e)}
                    >
                      <Text style={[E.monthTabText, t && E.monthTabTextActive]}>{e.split('/')[1]}月</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
          {!!te && (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: '#8E8E93' }}>
                「{te}
                {'」の全期間検索結果: '}
                {Ye.length}件
              </Text>
            </View>
          )}
          <FlatList
            data={Ye}
            renderItem={Je}
            keyExtractor={(e, idx) => (typeof e.id === 'string' ? e.id : `history-item-${idx}`)}
            contentContainerStyle={E.listContent}
            ItemSeparatorComponent={v}
            ListEmptyComponent={<Text style={E.emptyText}>記録がありません</Text>}
          />
        </View>
      )}
      <Modal visible={ae} transparent animationType="fade">
        <TouchableOpacity style={E.modalOverlay} activeOpacity={1} onPress={() => se(false)}>
          <View style={E.yearModal}>
            <Text style={E.yearModalTitle}>年度を選択</Text>
            {$e.map((e) => (
              <TouchableOpacity
                key={e}
                style={[E.yearOption, ie === e && E.yearOptionSelected]}
                onPress={() => {
                  le(e);
                  se(false);
                }}
              >
                <Text style={[E.yearOptionText, ie === e && E.yearOptionTextSelected]}>
                  {e}年度 ({e}
                  {'/04 - '}
                  {e + 1}/03)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={ge} transparent animationType="slide">
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
                  xe(!me);
                  be(new Set());
                }}
              >
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '500' }}>
                  {me ? '完了' : '編集'}
                </Text>
              </TouchableOpacity>
              {me ? (
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (0 === ye.size) return;
                      // まとめて戻す。1件ずつ待つと、通信できないときに
                      // 1件目の送信が終わらず、残りが戻らないまま画面も
                      // 反応しなくなる。
                      useScoreStore.getState().restoreTrashItems(Array.from(ye));
                      be(new Set());
                      xe(false);
                    }}
                  >
                    <Text
                      style={{ fontSize: 16, color: ye.size > 0 ? '#007AFF' : '#C6C6C8', fontWeight: '500' }}
                    >
                      復元
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => {
                      if (0 === ye.size) return;
                      const e = () => {
                        const e = Array.from(ye);
                        useScoreStore.getState().deleteTrashItems(e);
                        be(new Set());
                        xe(false);
                        if (trash.length - e.length <= 0) fe(false);
                      };
                      Alert.alert('完全に削除', '選択したゴミ箱の記録を完全に削除します。よろしいですか？', [
                        { text: 'キャンセル', style: 'cancel' },
                        { text: '削除', style: 'destructive', onPress: e },
                      ]);
                    }}
                  >
                    <Text
                      style={{ fontSize: 16, color: ye.size > 0 ? '#FF3B30' : '#C6C6C8', fontWeight: '500' }}
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
                                fe(false);
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
                  <TouchableOpacity onPress={() => fe(false)}>
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
                  keyExtractor={(e) => e.id}
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
                  renderItem={({ item: e }) => {
                    const t = new Date(e.date);
                    const l = `${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日`;
                    // 押すと中身を見られる（見るだけ）。選んでいる最中は選ぶ・外すに使う
                    return (
                      <Pressable
                        testID={`ゴミ箱の記録-${e.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={me ? `${l} を選ぶ` : `${l} の記録を見る`}
                        aria-label={me ? `${l} を選ぶ` : `${l} の記録を見る`}
                        onPress={() => {
                          if (me) return void Le(e.id);
                          setゴミ箱の記録(e.id);
                          setSelectedHistorySessionId(e.id);
                          setHistoryViewMode('detail');
                          fe(false);
                          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                        }}
                        style={({ hovered: h }) => [
                          {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 14,
                          },
                          h && { backgroundColor: 'rgba(0,122,255,0.05)' },
                          IS_WEB && { cursor: 'pointer' },
                        ]}
                      >
                        {me && (
                          <TouchableOpacity
                            onPress={() => Le(e.id)}
                            style={{ marginRight: 12, paddingVertical: 4 }}
                          >
                            <Icons.Ionicons
                              name={ye.has(e.id) ? 'checkmark-circle' : 'ellipse-outline'}
                              size={22}
                              color={ye.has(e.id) ? '#007AFF' : '#C7C7CC'}
                            />
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                            {l} {e.title ? `[${e.title}]` : ''}
                          </Text>
                          {!!e.note && (
                            <Text style={{ fontSize: 12, color: '#000', marginTop: 4 }} numberOfLines={1}>
                              {e.note}
                            </Text>
                          )}
                        </View>
                        {!me && (
                          <TouchableOpacity onPress={() => restoreSession(e.id)}>
                            <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '500' }}>復元</Text>
                          </TouchableOpacity>
                        )}
                        {!me && (
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
      <Modal visible={Se} transparent animationType="fade">
        <View style={E.confirmOverlay}>
          <View style={E.confirmModal}>
            <Text style={E.confirmTitle}>{Te ? '記録を削除' : '選択した記録を削除'}</Text>
            <Text style={E.confirmMessage}>選択した記録をゴミ箱に移動しますか？</Text>
            <View style={E.modalButtonsRow}>
              <TouchableOpacity
                style={[E.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]}
                onPress={() => {
                  we(false);
                  Ae(null);
                }}
              >
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[E.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]}
                onPress={async () => {
                  Te
                    ? (deleteSession(Te), Ae(null), setHistoryViewMode('list'))
                    : (deleteMultipleSessions(Array.from(ue)), he(new Set()), ce(false));
                  we(false);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>移動する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={pe} transparent animationType="fade" onRequestClose={() => je(false)}>
        <TouchableOpacity style={E.confirmOverlay} activeOpacity={1} onPress={() => je(false)}>
          <View style={E.adminMenuContent}>
            {/* 記録表そのものの直しは、記録画面に載せ替えて行う（人・間隔・計を足す、 */
            /* 並べ替え・矢所・射数・交代・画像からの読み取り）。ここに在った「人追加・ */
            /* 間隔追加・計追加」は記録画面で足せるので外した（使う人の指摘 2026-09-17） */}
            {!ゴミ箱を見ている && (
              <TouchableOpacity
                style={E.adminMenuItem}
                accessibilityRole="button"
                accessibilityLabel="記録画面で直す"
                aria-label="記録画面で直す"
                onPress={() => {
                  if (!Pe) return;
                  je(false);
                  if (
                    typeof 履歴の記録を記録画面で開く !== 'function' ||
                    !履歴の記録を記録画面で開く(Pe.id)
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
                  <Text style={E.adminMenuText}>記録画面で直す</Text>
                  <Text style={{ fontSize: 11, color: '#8E8E93', marginLeft: 12 }}>
                    並べ替え・矢所・射数など、記録表の道具をすべて使う
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {/* 記録の情報（日付・題・メモ・タグ・出欠）の窓。前は「記録を編集」で、 */
            /* 何が直せるのか分からなかった */}
            <TouchableOpacity
              style={E.adminMenuItem}
              accessibilityRole="button"
              accessibilityLabel="記録の情報を変える"
              aria-label="記録の情報を変える"
              onPress={() => {
                je(false);
                Fe(true);
              }}
            >
              <Icons.Ionicons name="create-outline" size={20} color="#5856D6" />
              <View style={{ flex: 1 }}>
                <Text style={E.adminMenuText}>記録の情報を変える</Text>
                <Text style={{ fontSize: 11, color: '#8E8E93', marginLeft: 12 }}>
                  日付・題・メモ・タグ・出欠
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <EditSessionModal
        visible={Ce}
        session={Pe}
        onClose={() => Fe(false)}
        onSave={(e) => updateSession(Pe.id, e)}
      />
      <ArcherActionModal
        visible={ze}
        archerId={ke || ''}
        archerName={Pe?.archers?.find((e) => e.id === ke)?.name || ''}
        archerOrigIdx={De}
        isSeparator={Pe?.archers?.find((e) => e.id === ke)?.isSeparator || false}
        isTotalCalculator={Pe?.archers?.find((e) => e.id === ke)?.isTotalCalculator || false}
        onClose={() => Ie(false)}
        onSubstitution={() => We(true)}
        onSetMember={(e) => tt(ke, e)}
        onSetGuestName={(e) => rt(ke, e)}
        onClearName={() => ot(ke)}
        onDeleteArcher={nt}
        onAddArcher={(e) => {
          if (!Pe) return;
          const t = newArcher(Pe.shotCount || 8);
          const o = [...Ue(Pe.archers)];
          o.splice(e, 0, t);
          updateSession(Pe.id, { archers: o });
        }}
        onAddSeparator={(e) => {
          if (!Pe) return;
          const t = newSeparator();
          const o = [...Ue(Pe.archers)];
          o.splice(e, 0, t);
          updateSession(Pe.id, { archers: o });
        }}
        onAddTotal={(e) => {
          if (!Pe) return;
          const t = newTotalCalculator(Pe.shotCount || 8);
          const o = [...Ue(Pe.archers)];
          o.splice(e, 0, t);
          updateSession(Pe.id, { archers: o });
        }}
        existingArchers={Ue(Pe?.archers)}
      />
      <ManualSubstitutionModal visible={Be} archerId={ke} onClose={() => We(false)} />
    </Lt要素>
  );
};
const E = StyleSheet.create({
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
