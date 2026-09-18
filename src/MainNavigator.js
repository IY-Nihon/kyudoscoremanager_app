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
const 下の帯 = React.memo(({ state, descriptors, navigation: nav }) => {
  ReactNativeSafeAreaContext.useSafeAreaInsets();
  // 画面の幅で字を詰める。6つのタブは 320px の端末に収まらず、
  // 左右にはみ出していた（記録・履歴・分析・メンバー・出欠・設定）
  const 画面の幅 = RN画面.useWindowDimensions().width;
  const 詰める = 画面の幅 < 380;
  const 狭いときのボタン = 詰める ? { paddingHorizontal: 6, minWidth: 34 } : null;
  const 狭いときの字 = 詰める ? { fontSize: 11 } : null;
  const 履歴のタグ = useScoreStore((x) => x.historySelectedTags || []);
  const 分析のタグ = useScoreStore((x) => x.analysisSelectedTags || []);
  const 記録のタグ = useScoreStore((x) => x.currentSessionTags || []);
  const 今の画面 =
    (useScoreStore((x) => x.toggleHistoryTag),
    useScoreStore((x) => x.toggleAnalysisTag),
    useScoreStore((x) => x.toggleCurrentSessionTag),
    useScoreStore((x) => x.setHistorySelectedTags),
    useScoreStore((x) => x.setAnalysisSelectedTags),
    useScoreStore((x) => x.setCurrentSessionTags),
    state.routes[state.index].name);
  const X要素 = IS_WEB ? View : ReactNativeSafeAreaContext.SafeAreaView;
  console.log('[CustomTabBar] Active Route:', 今の画面, 'Tags:', {
    current: 記録のタグ.length,
    history: 履歴のタグ.length,
    analysis: 分析のタグ.length,
  });
  return (
    <X要素 style={[styles.tabBarWrapper, IS_WEB && { paddingTop: 0 }]} edges={['top', 'left', 'right']}>
      <View style={[styles.tabBarContainer, { height: 60 }]}>
        <View style={styles.leftActions} />
        <View style={styles.tabItems}>
          {state.routes.map((道, 番) => {
            const { options } = descriptors[道.key];
            const 字 =
              undefined !== options.tabBarLabel
                ? options.tabBarLabel
                : undefined !== options.title
                  ? options.title
                  : 道.name;
            const 今ここ = state.index === 番;
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
                style={({ pressed, hovered }) => [
                  狭いときのボタン,
                  styles.tabButton,
                  今ここ && styles.tabButtonActive,
                  !今ここ && hovered && styles.tabButtonHover,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={[
                      styles.tabText,
                      狭いときの字,
                      今ここ && styles.tabTextActive,
                      !今ここ && styles.tabTextHoverable,
                    ]}
                  >
                    {字}
                  </Text>
                  {印を出す && <View style={styles.badgeDot} />}
                </View>
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
  const 役割 = useScoreStore((x) => x.activeRole);
  const // 共有リンクだけで来ている人。団体のデータを何も持っていないので、
    // 履歴・分析・設定を出しても中身が無い。記録の画面だけにする
    来客 = useScoreStore((x) => x.共有の来客);
  const 画面名を控える = useScoreStore((x) => x.setCurrentRouteName);
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
