/**
 * Module ID: 1042
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 1042;
const m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'OfflineIndicator', {
    enumerable: !0,
    get: function () {
      return h;
    },
  }));
var t = e(require('./module_37')),
  n = e(require('./default_144')),
  o = e(require('./default_217')),
  l = e(require('./default_45')),
  s = e(require('./default_286')),
  u = require('./JP_useScoreStore_174'),
  c = require('./AntDesign_600'),
  f = require('./module_592'),
  F = require('./module_427');
const h = () => {
    const e = (0, u.useScoreStore)((e) => e.isNetworkOnline),
      [l] = t.default.useState(new s.default.Value(0));
    return (
      t.default.useEffect(() => {
        s.default
          .timing(l, { toValue: e ? 0 : 1, duration: 300, useNativeDriver: typeof window === 'undefined' })
          .start();
      }, [e]),
      e
        ? null
        : (0, F.jsx)(s.default.View, {
            pointerEvents: 'none',
            style: [
              p.container,
              {
                opacity: l,
                transform: [{ translateY: l.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
              },
            ],
            children: (0, F.jsxs)(n.default, {
              style: p.badge,
              children: [
                (0, F.jsx)(c.MaterialCommunityIcons, {
                  name: 'cloud-off-outline',
                  size: 16,
                  color: '#FFFFFF',
                }),
                (0, F.jsx)(o.default, { style: p.text, children: 'オフラインモード' }),
              ],
            }),
          })
    );
  },
  p = l.default.create({
    container: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', zIndex: 9999 },
    badge: Object.assign(
      {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3B30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
      },
      (0, f.getShadowStyle)({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      })
    ),
    text: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  });
