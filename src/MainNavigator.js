'use strict';

const RN画面 = require('react-native');
const themeMod = require('./theme');
const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const Pressable = require('./Pressable').default;
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
const A = {
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
const C = BottomTabs.createBottomTabNavigator();
const w = () =>
  Object.assign({}, Navigation.DefaultTheme, {
    colors: Object.assign({}, Navigation.DefaultTheme.colors, {
      background: themeMod.mapColor('#FFFFFF', 'bg'),
      card: themeMod.mapColor('#FFFFFF', 'bg'),
      text: themeMod.mapColor('#1C1C1E', 'text'),
      border: themeMod.mapColor('#C6C6C8', 'border'),
    }),
  });
const D = StyleSheet.create({
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
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 45,
    alignItems: 'center',
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
  tabText: { fontSize: 13, color: '#3A3A3C', fontWeight: '500' },
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
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginLeft: 2,
    marginTop: -8,
  },
});
const I = React.memo(({ state, descriptors, navigation: nav }) => {
  ReactNativeSafeAreaContext.useSafeAreaInsets();
  // 画面の幅で字を詰める。6つのタブは 320px の端末に収まらず、
  // 左右にはみ出していた（記録・履歴・分析・メンバー・出欠・設定）
  const 画面の幅 = RN画面.useWindowDimensions().width;
  const 詰める = 画面の幅 < 380;
  const 狭いときのボタン = 詰める ? { paddingHorizontal: 6, minWidth: 34 } : null;
  const 狭いときの字 = 詰める ? { fontSize: 11 } : null;
  const c = useScoreStore((e) => e.historySelectedTags || []);
  const u = useScoreStore((e) => e.analysisSelectedTags || []);
  const b = useScoreStore((e) => e.currentSessionTags || []);
  const f =
    (useScoreStore((e) => e.toggleHistoryTag),
    useScoreStore((e) => e.toggleAnalysisTag),
    useScoreStore((e) => e.toggleCurrentSessionTag),
    useScoreStore((e) => e.setHistorySelectedTags),
    useScoreStore((e) => e.setAnalysisSelectedTags),
    useScoreStore((e) => e.setCurrentSessionTags),
    state.routes[state.index].name);
  const X要素 = IS_WEB ? View : ReactNativeSafeAreaContext.SafeAreaView;
  console.log('[CustomTabBar] Active Route:', f, 'Tags:', {
    current: b.length,
    history: c.length,
    analysis: u.length,
  });
  return (
    <X要素 style={[D.tabBarWrapper, IS_WEB && { paddingTop: 0 }]} edges={['top', 'left', 'right']}>
      <View style={[D.tabBarContainer, { height: 60 }]}>
        <View style={D.leftActions} />
        <View style={D.tabItems}>
          {state.routes.map((h, p) => {
            const { options } = descriptors[h.key];
            const f =
              undefined !== options.tabBarLabel
                ? options.tabBarLabel
                : undefined !== options.title
                  ? options.title
                  : h.name;
            const x = state.index === p;
            let y = false;
            '記録' === h.name && b.length > 0 && (y = true);
            '履歴' === h.name && c.length > 0 && (y = true);
            '分析' === h.name && u.length > 0 && (y = true);
            return (
              <Pressable
                key={p} // 使い方の案内が指す先。繰り返しの中なのでフックは使えない
                ref={(node) => 案内.setTutorialTargetNode(`タブ.${h.name}`, node)}
                onPress={() => {
                  const e = nav.emit({ type: 'tabPress', target: h.key, canPreventDefault: true });
                  // 不具合の便りに載せる。どの画面で起きたかが分かると原因を絞れる
                  try {
                    require('./errorReporter').行動を残す('画面を移る', h.name);
                  } catch (_) {
                    /* 控えられなくても、画面の移動は止めない */
                  }
                  if (!(x || e.defaultPrevented)) nav.navigate(h.name);
                }}
                style={({ pressed, hovered }) => [
                  狭いときのボタン,
                  D.tabButton,
                  x && D.tabButtonActive,
                  !x && hovered && D.tabButtonHover,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[D.tabText, 狭いときの字, x && D.tabTextActive, !x && D.tabTextHoverable]}>
                    {f}
                  </Text>
                  {y && <View style={D.badgeDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={D.rightActions} />
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
  const e = ReactNativeSafeAreaContext.useSafeAreaInsets();
  const n = useScoreStore((e) => e.activeRole);
  const // 共有リンクだけで来ている人。団体のデータを何も持っていないので、
    // 履歴・分析・設定を出しても中身が無い。記録の画面だけにする
    来客 = useScoreStore((e) => e.共有の来客);
  const o = useScoreStore((e) => e.setCurrentRouteName);
  const s = (IS_WEB ? WEB_TOP_PADDING : Math.max(e.top, 20), React.useCallback((e) => <I {...e} />, []));
  const c = React.useMemo(() => A, []);
  const l = Navigation.useNavigationContainerRef();
  return (
    <Navigation.NavigationContainer
      ref={l}
      theme={w()}
      linking={c}
      onStateChange={() => {
        const e = l.getCurrentRoute();
        if (e) o(e.name);
      }}
      onReady={() => {
        const e = l.getCurrentRoute();
        if (e) o(e.name);
      }}
    >
      <C.Navigator tabBar={s} screenOptions={{ headerShown: false }}>
        <C.Screen name="記録" component={RecordScreenComp} />
        {!来客 && <C.Screen name="履歴" component={HistoryScreenComp} />}
        {!来客 && <C.Screen name="分析" component={AnalysisScreenComp} />}
        {/* 個人ログインでも出す。自分の弓具を登録・編集するための入口で、 */
        /* ここが無いと画面まで辿り着けない（権限だけ許しても届かなかった）。 */
        /* 一覧で他人を開こうとすると MemberScreen 側が断り、弓具の欄も */
        /* 自分のぶんしか出さない */}
        {!来客 && <C.Screen name="メンバー" component={MemberScreenComp} />}
        {!来客 && 'group' === n && <C.Screen name="出欠" component={AttendanceScreenComp} />}
        {!来客 && <C.Screen name="設定" component={SettingsScreenComp} />}
      </C.Navigator>
      {/* 来客には出さない。相談役は団体の記録を見て答える作りで、 */
      /* 案内は団体の画面を順に指してまわる。どちらも来客には中身が無い */}
      {!来客 && <AIChatBot />}
      {/* 使い方の案内。画面を移動しながら指すので、移動用の ref を渡す */}
      {!来客 && <案内.TutorialOverlay navRef={l} />}
    </Navigation.NavigationContainer>
  );
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.MainNavigator = MainNavigator;
