/**
 * Module ID: 216
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 216;
const m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'MainNavigator', {
    enumerable: !0,
    get: function () {
      return k;
    },
  }));
var RN画面 = require('react-native'),
  themeMod = require('./theme'),
  t = require('./module_37'),
  n = e(t),
  o = e(require('./default_144')),
  s = e(require('./default_217')),
  c = e(require('./default_45'));
require('./module_98');
var l = e(require('./default_218')),
  u = require('./createBottomTabNavigator_225'),
  b = require('./module_233'),
  h = require('./module_420'),
  p = require('./JP_useScoreStore_174'),
  S = require('./IS_WEB_199'),
  f = require('./module_592'),
  x = require('./JP_RecordScreen_593'),
  y = require('./JP_HistoryScreen_692'),
  F = require('./JP_AnalysisScreen_1000'),
  j = require('./JP_MemberScreen_1022'),
  AttendanceScreen = require('./AttendanceScreen').AttendanceScreen,
  v = require('./JP_SettingsScreen_1023'),
  B = require('./JP_AIChatBot_1034'),
  案内 = require('./JP_TutorialGuide'),
  T = require('./module_427');
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
  },
  C = (0, u.createBottomTabNavigator)(),
  w = () =>
    Object.assign({}, b.DefaultTheme, {
      colors: Object.assign({}, b.DefaultTheme.colors, {
        background: themeMod.mapColor('#FFFFFF', 'bg'),
        card: themeMod.mapColor('#FFFFFF', 'bg'),
        text: themeMod.mapColor('#1C1C1E', 'text'),
        border: themeMod.mapColor('#C6C6C8', 'border'),
      }),
    });
const D = c.default.create({
  tabBarWrapper: Object.assign(
    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1e3 },
    S.IS_WEB ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : {}
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
    (0, f.getShadowStyle)({
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

const I = n.default.memo(({ state: e, descriptors: t, navigation: nav }) => {
  (0, h.useSafeAreaInsets)();
  // 画面の幅で字を詰める。6つのタブは 320px の端末に収まらず、
  // 左右にはみ出していた（記録・履歴・分析・メンバー・出欠・設定）
  const 画面の幅 = (0, RN画面.useWindowDimensions)().width;
  const 詰める = 画面の幅 < 380;
  const 狭いときのボタン = 詰める ? { paddingHorizontal: 6, minWidth: 34 } : null;
  const 狭いときの字 = 詰める ? { fontSize: 11 } : null;
  const c = (0, p.useScoreStore)((e) => e.historySelectedTags || []),
    u = (0, p.useScoreStore)((e) => e.analysisSelectedTags || []),
    b = (0, p.useScoreStore)((e) => e.currentSessionTags || []),
    f =
      ((0, p.useScoreStore)((e) => e.toggleHistoryTag),
      (0, p.useScoreStore)((e) => e.toggleAnalysisTag),
      (0, p.useScoreStore)((e) => e.toggleCurrentSessionTag),
      (0, p.useScoreStore)((e) => e.setHistorySelectedTags),
      (0, p.useScoreStore)((e) => e.setAnalysisSelectedTags),
      (0, p.useScoreStore)((e) => e.setCurrentSessionTags),
      e.routes[e.index].name),
    x = S.IS_WEB ? o.default : h.SafeAreaView;
  console.log('[CustomTabBar] Active Route:', f, 'Tags:', {
    current: b.length,
    history: c.length,
    analysis: u.length,
  });
  return (0, T.jsx)(x, {
    style: [D.tabBarWrapper, S.IS_WEB && { paddingTop: 0 }],
    edges: ['top', 'left', 'right'],
    children: (0, T.jsxs)(o.default, {
      style: [D.tabBarContainer, { height: 60 }],
      children: [
        (0, T.jsx)(o.default, { style: D.leftActions }),
        (0, T.jsx)(o.default, {
          style: D.tabItems,
          children: e.routes.map((h, p) => {
            const { options: S } = t[h.key],
              f = void 0 !== S.tabBarLabel ? S.tabBarLabel : void 0 !== S.title ? S.title : h.name,
              x = e.index === p;
            let y = !1;
            ('記録' === h.name && b.length > 0 && (y = !0),
              '履歴' === h.name && c.length > 0 && (y = !0),
              '分析' === h.name && u.length > 0 && (y = !0));
            return (0, T.jsx)(
              l.default,
              {
                // 使い方の案内が指す先。繰り返しの中なのでフックは使えない
                ref: (node) => 案内.setTutorialTargetNode(`タブ.${h.name}`, node),
                onPress: () => {
                  const e = nav.emit({ type: 'tabPress', target: h.key, canPreventDefault: !0 });
                  // 不具合の便りに載せる。どの画面で起きたかが分かると原因を絞れる
                  try {
                    require('./errorReporter').行動を残す('画面を移る', h.name);
                  } catch (_) {}
                  x || e.defaultPrevented || nav.navigate(h.name);
                },
                style: ({ pressed: e, hovered: t }) => [
                  狭いときのボタン,
                  D.tabButton,
                  x && D.tabButtonActive,
                  !x && t && D.tabButtonHover,
                  e && { opacity: 0.7 },
                ],
                children: (0, T.jsxs)(o.default, {
                  style: { flexDirection: 'row', alignItems: 'center' },
                  children: [
                    (0, T.jsx)(s.default, {
                      style: [D.tabText, 狭いときの字, x && D.tabTextActive, !x && D.tabTextHoverable],
                      children: f,
                    }),
                    y && (0, T.jsx)(o.default, { style: D.badgeDot }),
                  ],
                }),
              },
              p
            );
          }),
        }),
        (0, T.jsx)(o.default, { style: D.rightActions }),
      ],
    }),
  });
});

const RecordScreenComp = (props) => (0, T.jsx)(x.RecordScreen, props);
const HistoryScreenComp = (props) => (0, T.jsx)(y.HistoryScreen, props);
const AnalysisScreenComp = (props) => (0, T.jsx)(F.AnalysisScreen, props);
const MemberScreenComp = (props) => (0, T.jsx)(j.MemberScreen, props);
const AttendanceScreenComp = (props) => (0, T.jsx)(AttendanceScreen, props);
const SettingsScreenComp = (props) => (0, T.jsx)(v.SettingsScreen, props);

const k = () => {
  const e = (0, h.useSafeAreaInsets)(),
    n = (0, p.useScoreStore)((e) => e.activeRole),
    o = (0, p.useScoreStore)((e) => e.setCurrentRouteName),
    s =
      (S.IS_WEB ? S.WEB_TOP_PADDING : Math.max(e.top, 20),
      (0, t.useCallback)((e) => (0, T.jsx)(I, Object.assign({}, e)), [])),
    c = (0, t.useMemo)(() => A, []),
    l = (0, b.useNavigationContainerRef)();
  return (0, T.jsxs)(b.NavigationContainer, {
    ref: l,
    theme: w(),
    linking: c,
    onStateChange: () => {
      const e = l.getCurrentRoute();
      e && o(e.name);
    },
    onReady: () => {
      const e = l.getCurrentRoute();
      e && o(e.name);
    },
    children: [
      (0, T.jsxs)(C.Navigator, {
        tabBar: s,
        screenOptions: { headerShown: !1 },
        children: [
          (0, T.jsx)(C.Screen, { name: '記録', component: RecordScreenComp }),
          (0, T.jsx)(C.Screen, { name: '履歴', component: HistoryScreenComp }),
          (0, T.jsx)(C.Screen, { name: '分析', component: AnalysisScreenComp }),
          'group' === n && (0, T.jsx)(C.Screen, { name: 'メンバー', component: MemberScreenComp }),
          'group' === n && (0, T.jsx)(C.Screen, { name: '出欠', component: AttendanceScreenComp }),
          (0, T.jsx)(C.Screen, { name: '設定', component: SettingsScreenComp }),
        ],
      }),
      (0, T.jsx)(B.AIChatBot, {}),
      // 使い方の案内。画面を移動しながら指すので、移動用の ref を渡す
      (0, T.jsx)(案内.TutorialOverlay, { navRef: l }),
    ],
  });
};
