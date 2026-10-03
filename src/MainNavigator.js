'use strict';

const themeMod = require('./theme');
const React = require('react');
const { View, Text, StyleSheet, Pressable, useWindowDimensions } = require('./rn');
const BottomTabs = require('@react-navigation/bottom-tabs');
const Navigation = require('@react-navigation/native');
const ReactNativeSafeAreaContext = require('react-native-safe-area-context');
const { useScoreStore } = require('./useScoreStore');
const { IS_WEB, WEB_TOP_PADDING } = require('./IS_WEB');
const { getShadowStyle } = require('./shadowStyle');
const { RecordScreen } = require('./RecordScreen');
const { HistoryScreen } = require('./HistoryScreen');
const { AnalysisScreen } = require('./AnalysisScreen');
const { MemberScreen } = require('./MemberScreen');
const AttendanceScreen = require('./AttendanceScreen').AttendanceScreen;
const { SettingsScreen } = require('./SettingsScreen');
const { AIChatBot } = require('./AIChatBot');
const 案内 = require('./TutorialGuide');
const { タブの絵 } = require('./tabIcons');
const { 絵のある画面 } = require('./tabIconShapes');
const { 並べ方を決める, 絵の大きさ, 絵と字の間, 字の大きさ } = require('./tabBarLayout');
const リンクの決まり = {
  prefixes: [
    'http://localhost:8081',
    'https://archery-record-app.web.app',
    'https://kyudoscoremanager.web.app',
  ],
  config: {
    screens: {
      '記録': 'record',
      '履歴': 'history',
      '分析': 'analysis',
      'メンバー': 'members',
      '出欠': 'attendance',
      '設定': 'settings',
    },
  },
};
const Tab = BottomTabs.createBottomTabNavigator();
/** 今いないタブの文字と絵の色 */
const タブの字の色 = '#3A3A3C';
/** 今いるタブの文字と絵の色 */
const 今のタブの字の色 = '#000';
const 画面の色 = () =>
  Object.assign({}, Navigation.DefaultTheme, {
    colors: Object.assign({}, Navigation.DefaultTheme.colors, {
      background: themeMod.mapColor('#FFFFFF', 'bg'),
      card: themeMod.mapColor('#FFFFFF', 'bg'),
      text: themeMod.mapColor('#1C1C1E', 'text'),
      border: themeMod.mapColor('#C6C6C8', 'border'),
    }),
  });
const styles = StyleSheet.create({
  tabBarWrapper: Object.assign(
    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1e3 },
    IS_WEB ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : {}
  ),
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: 54,
    backgroundColor: '#FFFFFF',
  },
  leftActions: { display: 'none' },
  tabItems: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 24, padding: 3 },
  // 左右の余白は、帯の幅に合わせて並べ方（tabBarLayout）が決める
  tabButton: {
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: Object.assign(
    { backgroundColor: '#FFFFFF' },
    getShadowStyle({
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 2,
    })
  ),
  tabText: { fontSize: 字の大きさ, color: タブの字の色, fontWeight: '500' },
  // 絵のあとの名前。間は tabBarLayout の 絵と字の間 と同じ
  tabTextBesideIcon: { marginLeft: 絵と字の間 },
  // 絵の枠。タグの印はこの右上に重ねる
  tabIconBox: { width: 絵の大きさ, height: 絵の大きさ, alignItems: 'center', justifyContent: 'center' },
  // 絵だけのときの、今いないタブの名前。見えないが、押す先（ボタンぜんぶを覆う）と
  // 読み上げ・検査が名前で探す先として、字そのものは置いておく
  tabTextHidden: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, opacity: 0, fontSize: 字の大きさ },
  tabTextActive: { fontWeight: 'bold', color: '#000' },
  tabButtonHover: { backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  tabTextHoverable: {},
  rightActions: { display: 'none' },
  pagination: { flexDirection: 'row', gap: 20, marginRight: 4 },
  pageBtn: { padding: 4 },
  adminActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editBtn: { paddingVertical: 4 },
  editText: { color: '#5856D6', fontSize: 17, fontWeight: '400' },
  trashBtn: { padding: 4 },
  // 絵が無いタブ（今は無い）の印。名前のとなりに小さく出す
  badgeDotBesideText: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginLeft: 2,
    marginTop: -8,
  },
  // タグで絞っている印。絵の右上に重ねる（名前を出していないタブにも見える）
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
});
const 下の帯 = React.memo(({ state, descriptors, navigation: nav }) => {
  ReactNativeSafeAreaContext.useSafeAreaInsets();
  // 帯の幅で並べ方を決める。どのタブも「絵＋名前」にすると、団体の 6 タブは 340〜360px、
  // 個人の 5 タブは 305px ほど要る（最近の携帯の 360px 以上は収まる）。収まらない狭い端末だけ、
  // 絵だけにして、今いるタブだけ名前を出す（tabBarLayout）。前は名前だけの 6 タブが 320px の端末に
  // 収まらず、左右にはみ出していたので、字を 11px に詰めていた
  const 窓 = useWindowDimensions();
  // 帯そのものの幅。最初の 1 コマは窓の幅で見積もり、測れたら測った幅に直す
  // （web は画面の最大幅が 1000px で、窓より狭いことがある）
  const [測った幅, 測った幅を置く] = React.useState(null);
  const 名前たち = state.routes.map((道) => {
    const { options } = descriptors[道.key];
    const 字 =
      undefined !== options.tabBarLabel
        ? options.tabBarLabel
        : undefined !== options.title
          ? options.title
          : 道.name;
    return String(字);
  });
  const 並べ方 = 並べ方を決める({ 名前たち, 幅: 測った幅 ?? 窓.width, 拡大: 窓.fontScale || 1 });
  const 絵だけ = '絵だけ' === 並べ方.型;
  const 履歴のタグ = useScoreStore((状態) => 状態.historySelectedTags || []);
  const 分析のタグ = useScoreStore((状態) => 状態.analysisSelectedTags || []);
  const 記録のタグ = useScoreStore((状態) => 状態.currentSessionTags || []);
  const 今の画面 =
    (useScoreStore((状態) => 状態.toggleHistoryTag),
    useScoreStore((状態) => 状態.toggleAnalysisTag),
    useScoreStore((状態) => 状態.toggleCurrentSessionTag),
    useScoreStore((状態) => 状態.setHistorySelectedTags),
    useScoreStore((状態) => 状態.setAnalysisSelectedTags),
    useScoreStore((状態) => 状態.setCurrentSessionTags),
    state.routes[state.index].name);
  const X要素 = IS_WEB ? View : ReactNativeSafeAreaContext.SafeAreaView;
  return (
    <X要素 style={[styles.tabBarWrapper, IS_WEB && { paddingTop: 0 }]} edges={['top', 'left', 'right']}>
      <View
        style={[styles.tabBarContainer, { height: 60 }]}
        onLayout={(出来事) => 測った幅を置く(Math.round(出来事.nativeEvent.layout.width))}
      >
        <View style={styles.leftActions} />
        <View style={styles.tabItems} role="tablist">
          {state.routes.map((道, 番) => {
            const { options } = descriptors[道.key];
            const 字 =
              undefined !== options.tabBarLabel
                ? options.tabBarLabel
                : undefined !== options.title
                  ? options.title
                  : 道.name;
            const 今ここ = state.index === 番;
            const 絵がある = 絵のある画面.includes(道.name);
            // 絵だけのときは、今いるタブだけ名前を出す。絵が無いタブは名前を出さないと分からない
            const 名前を出す = !絵だけ || 今ここ || !絵がある;
            const 色 = 今ここ ? 今のタブの字の色 : タブの字の色;
            let 印を出す = false;
            '記録' === 道.name && 記録のタグ.length > 0 && (印を出す = true);
            '履歴' === 道.name && 履歴のタグ.length > 0 && (印を出す = true);
            '分析' === 道.name && 分析のタグ.length > 0 && (印を出す = true);
            return (
              <Pressable
                key={番} // 使い方の案内が指す先。繰り返しの中なのでフックは使えない
                ref={(node) => 案内.setTutorialTargetNode(`タブ.${道.name}`, node)}
                onPress={() => {
                  const 合図 = nav.emit({ type: 'tabPress', target: 道.key, canPreventDefault: true });
                  // 不具合の便りに載せる。どの画面で起きたかが分かると原因を絞れる
                  try {
                    require('./errorReporter').行動を残す('画面を移る', 道.name);
                  } catch (_) {
                    /* 控えられなくても、画面の移動は止めない */
                  }
                  if (!(今ここ || 合図.defaultPrevented)) nav.navigate(道.name);
                }}
                // 絵だけのタブは名前が見えないので、読み上げが名前を言えるよう label を付ける
                role="tab"
                aria-selected={今ここ}
                aria-label={字}
                accessibilityLabel={字}
                accessibilityState={{ selected: 今ここ }}
                style={({ pressed, hovered }) => [
                  { paddingHorizontal: 並べ方.余白 },
                  styles.tabButton,
                  今ここ && styles.tabButtonActive,
                  !今ここ && hovered && styles.tabButtonHover,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {絵がある && (
                    <View style={styles.tabIconBox}>
                      <タブの絵 名前={道.name} 大きさ={絵の大きさ} 色={色} />
                      {印を出す && <View style={styles.badgeDot} />}
                    </View>
                  )}
                  {名前を出す && (
                    <Text
                      style={[
                        styles.tabText,
                        絵がある && styles.tabTextBesideIcon,
                        今ここ && styles.tabTextActive,
                        !今ここ && styles.tabTextHoverable,
                      ]}
                    >
                      {字}
                    </Text>
                  )}
                  {!絵がある && 印を出す && <View style={styles.badgeDotBesideText} />}
                </View>
                {!名前を出す && (
                  <Text selectable={false} style={styles.tabTextHidden}>
                    {字}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.rightActions} />
      </View>
    </X要素>
  );
});
const RecordScreenComp = (props) => <RecordScreen {...props} />;
const HistoryScreenComp = (props) => <HistoryScreen {...props} />;
const AnalysisScreenComp = (props) => <AnalysisScreen {...props} />;
const MemberScreenComp = (props) => <MemberScreen {...props} />;
const AttendanceScreenComp = (props) => <AttendanceScreen {...props} />;
const SettingsScreenComp = (props) => <SettingsScreen {...props} />;
const MainNavigator = () => {
  const 余白 = ReactNativeSafeAreaContext.useSafeAreaInsets();
  const 役割 = useScoreStore((状態) => 状態.activeRole);
  const // 共有リンクだけで来ている人。団体のデータを何も持っていないので、
    // 履歴・分析・設定を出しても中身が無い。記録の画面だけにする
    来客 = useScoreStore((状態) => 状態.共有の来客);
  const 画面名を控える = useScoreStore((状態) => 状態.setCurrentRouteName);
  const 帯を描く =
    (IS_WEB ? WEB_TOP_PADDING : Math.max(余白.top, 20),
    React.useCallback((渡す) => <下の帯 {...渡す} />, []));
  const リンク = React.useMemo(() => リンクの決まり, []);
  const 航路のref = Navigation.useNavigationContainerRef();
  return (
    <Navigation.NavigationContainer
      ref={航路のref}
      theme={画面の色()}
      linking={リンク}
      onStateChange={() => {
        const 今の道 = 航路のref.getCurrentRoute();
        if (今の道) 画面名を控える(今の道.name);
      }}
      onReady={() => {
        const 今の道 = 航路のref.getCurrentRoute();
        if (今の道) 画面名を控える(今の道.name);
      }}
    >
      <Tab.Navigator tabBar={帯を描く} screenOptions={{ headerShown: false }}>
        <Tab.Screen name="記録" component={RecordScreenComp} />
        {!来客 && <Tab.Screen name="履歴" component={HistoryScreenComp} />}
        {!来客 && <Tab.Screen name="分析" component={AnalysisScreenComp} />}
        {/* 個人ログインでも出す。自分の弓具を登録・編集するための入口で、 */
        /* ここが無いと画面まで辿り着けない（権限だけ許しても届かなかった）。 */
        /* 一覧で他人を開こうとすると MemberScreen 側が断り、弓具の欄も */
        /* 自分のぶんしか出さない */}
        {!来客 && <Tab.Screen name="メンバー" component={MemberScreenComp} />}
        {!来客 && 'group' === 役割 && <Tab.Screen name="出欠" component={AttendanceScreenComp} />}
        {!来客 && <Tab.Screen name="設定" component={SettingsScreenComp} />}
      </Tab.Navigator>
      {/* 来客には出さない。相談役は団体の記録を見て答える作りで、 */
      /* 案内は団体の画面を順に指してまわる。どちらも来客には中身が無い */}
      {!来客 && <AIChatBot />}
      {/* 使い方の案内。画面を移動しながら指すので、移動用の ref を渡す */}
      {!来客 && <案内.TutorialOverlay navRef={航路のref} />}
    </Navigation.NavigationContainer>
  );
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.MainNavigator = MainNavigator;
