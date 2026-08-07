/**
 * Module ID: 594
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const _i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const _a = typeof id !== 'undefined' ? id : 594;
const _m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'ArcherColumnView', {
    enumerable: !0,
    get: function () {
      return m;
    },
  }));
var t = e(require('./module_37')),
  o = e(require('./default_144')),
  l = e(require('./default_217')),
  i = e(require('./default_45')),
  n = e(require('./default_382')),
  s = require('./module_595'),
  a = require('./JP_ScoreCell_596'),
  c = require('./JP_useScoreStore_174'),
  h = require('./AntDesign_600'),
  u = require('./JP_module_687'),
  f = require('./module_427');
const m = t.default.memo(
    ({
      archer: e,
      shots: i,
      allArchers: m,
      indexInList: C,
      showFooter: p = !0,
      isReadOnly: k = !1,
      isAdminMode: y = !1,
      onPressName: x,
      onLongPressName: j,
      onDelete: S,
      onToggleMark: T,
      onToggleLock: I,
    }) => {
      const F = (0, c.useScoreStore)((e) => e.toggleLock),
        A = (0, c.useScoreStore)((e) => e.viewScale),
        z = 'number' == typeof A && !isNaN(A) && A > 0 ? A : 1,
        L = (0, c.useScoreStore)((e) => e.members || []),
        B = (() => {
          if (e.isTotalCalculator) {
            let e = 0;
            const t = Array.isArray(m) ? m : [];
            for (let o = C - 1; o >= 0; o--) {
              const l = t[o];
              if (!l || l.isSeparator || l.isTotalCalculator) break;
              e += (l.marks || []).filter((e) => '○' === e).length;
            }
            return e;
          }
          return (e.marks || []).filter((e) => '○' === e).length;
        })(),
        M = [];
      if (!e.isSeparator) for (let e = i - 1; e >= 0; e--) M.push(e);
      const W = (e.isSeparator ? s.UIConfig.separatorWidth : s.UIConfig.cellWidth) * z,
        w = e.isSeparator
          ? 'rgba(142,142,147,0.15)'
          : e.isTotalCalculator
            ? 'rgba(0,122,255,0.1)'
            : '#F2F2F7',
        N =
          (e.isSeparator || e.isTotalCalculator,
          () => {
            const e = [],
              t = Array.isArray(m) ? m : [];
            for (let o = C - 1; o >= 0; o--) {
              const l = t[o];
              if (!l || l.isSeparator || l.isTotalCalculator) break;
              e.push(l);
            }
            return e;
          }),
        U = (e) => {
          const t = N();
          if (0 === t.length) return 0;
          const o = 4 * e,
            l = Math.min(o + 4, i);
          return t.reduce((e, t) => {
            let i = 0;
            const n = t.marks || [];
            for (let e = o; e < l; e++) '○' === n[e] && i++;
            return e + i;
          }, 0);
        },
        H = (e, t) => {
          I ? I(e, t) : F(e, t);
        },
        P = (e) => (0, u.formatMemberName)(e, L),
        v = () => (e.name ? P(e.name) : e.isTotalCalculator ? '合計' : '選択'),
        O = e.isSeparator || e.isTotalCalculator,
        R = O ? 1.5 : 1,
        _ = O ? 1.5 : 0;
      return (0, f.jsxs)(o.default, {
        style: { width: W, backgroundColor: 'transparent' },
        children: [
          (0, f.jsxs)(o.default, {
            style: { flexDirection: 'column' },
            children: [
              (0, f.jsxs)(n.default, {
                activeOpacity: 1,
                style: [
                  b.header,
                  {
                    width: W,
                    height: s.UIConfig.headerHeight * z,
                    backgroundColor: w,
                    marginBottom: 0,
                    borderRightWidth: R,
                    borderRightColor: '#000',
                    borderLeftWidth: _,
                    borderLeftColor: '#000',
                  },
                ],
                disabled: !0,
                children: [
                  e.isSeparator || e.isTotalCalculator
                    ? null
                    : (() => {
                        const o = e.substitutions || {},
                          i = Array.isArray(e.marks) ? e.marks : [],
                          n = Object.keys(o)
                            .map(Number)
                            .sort((e, t) => e - t)
                            .filter((e) => e < i.length);
                        if (n.length > 0) {
                          const e = [],
                            s = n[0],
                            a = i.slice(0, s).filter((e) => '○' === e).length;
                          e.push({ name: v(), hits: a });
                          for (let t = 0; t < n.length; t++) {
                            const l = n[t],
                              s = t + 1 < n.length ? n[t + 1] : i.length,
                              a = o[l] || '?';
                            e.push({ name: P(a), hits: i.slice(l, s).filter((e) => '○' === e).length });
                          }
                          return (0, f.jsx)(l.default, {
                            style: [b.hitCountSub, { fontSize: 8 * z }],
                            children: e.map((o, i) =>
                              (0, f.jsxs)(
                                t.default.Fragment,
                                {
                                  children: [
                                    (0, f.jsxs)(l.default, { children: [o.name, ' ', o.hits] }),
                                    i < e.length - 1 ? (0, f.jsx)(l.default, { children: ', ' }) : null,
                                  ],
                                },
                                i
                              )
                            ),
                          });
                        }
                        return (0, f.jsx)(l.default, {
                          style: [b.hitCount, { fontSize: 22 * z }],
                          children: B,
                        });
                      })(),
                  e.isTotalCalculator
                    ? (0, f.jsx)(l.default, {
                        style: [b.hitCount, { color: '#007AFF', fontSize: 22 * z }],
                        children: B,
                      })
                    : null,
                  (0, f.jsx)(o.default, {
                    style: {
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 1.5,
                      backgroundColor: '#000',
                    },
                  }),
                ],
              }),
              e.isSeparator
                ? (0, f.jsx)(o.default, {
                    children: Array.from({ length: i }, (e, t) => i - 1 - t).map((t) => {
                      const l = Math.floor(t / 4),
                        c = t % 4 == 0 && 0 !== t,
                        h = t === Math.min(i - 1, 4 * l + 3),
                        u = !(k && !y) && (e.lockedBlocks?.[l] || !1);
                      return (0, f.jsxs)(
                        o.default,
                        {
                          style: { width: W, height: s.UIConfig.cellHeight * z },
                          children: [
                            (0, f.jsx)(a.ScoreCell, {
                              archerId: e.id,
                              index: t,
                              isLocked: u,
                              isBlockBottom: c,
                              isBlockTop: h,
                              isFirst: 0 === t,
                              hideMark: !0,
                              isNormalArcher: !1,
                              columnType: 'separator',
                              mark: e.marks?.[t],
                              onToggle: T,
                            }),
                            h &&
                              (0, f.jsx)(n.default, {
                                style: {
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  zIndex: 10,
                                },
                                disabled: k && !y,
                                onPress: () => H(e.id, l),
                              }),
                          ],
                        },
                        t
                      );
                    }),
                  })
                : e.isTotalCalculator
                  ? (0, f.jsx)(o.default, {
                      children: M.map((t) => {
                        const c = Math.floor(t / 4),
                          h = U(c),
                          u = t % 4 == 0,
                          m = t === Math.min(i - 1, 4 * c + 3),
                          C = !(k && !y) && (e.lockedBlocks?.[c] || !1);
                        return (0, f.jsxs)(
                          o.default,
                          {
                            style: { width: W, height: s.UIConfig.cellHeight * z },
                            children: [
                              (0, f.jsx)(a.ScoreCell, {
                                archerId: e.id,
                                index: t,
                                mark: e.marks?.[t],
                                isLocked: C,
                                isBlockBottom: t % 4 == 0 && (0 !== t || i > 4),
                                isBlockTop: m,
                                isFirst: 0 === t,
                                hideMark: !0,
                                isNormalArcher: !1,
                                columnType: 'total',
                                onToggle: T,
                              }),
                              u &&
                                (0, f.jsx)(o.default, {
                                  style: {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                  },
                                  pointerEvents: 'none',
                                  children: (0, f.jsx)(l.default, {
                                    style: [b.blockTotalText, { fontSize: 24 * z }],
                                    children: h,
                                  }),
                                }),
                              m &&
                                (0, f.jsx)(n.default, {
                                  style: {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 10,
                                  },
                                  disabled: k && !y,
                                  onPress: () => H(e.id, c),
                                }),
                            ],
                          },
                          t
                        );
                      }),
                    })
                  : (0, f.jsx)(o.default, {
                      children: M.map((t) => {
                        const o = e.substitutions?.[t];
                        let l = '';
                        o && (l = P(o));
                        const n = Math.floor(t / 4),
                          s = t === Math.min(i - 1, 4 * n + 3),
                          c = !(k && !y) && (e.lockedBlocks?.[n] || !1);
                        return (0, f.jsx)(
                          a.ScoreCell,
                          {
                            archerId: e.id,
                            index: t,
                            mark: e.marks?.[t] || '',
                            subName: l,
                            isLocked: c,
                            isBlockBottom: t % 4 == 0 && 0 !== t,
                            isBlockTop: s,
                            isFirst: 0 === t,
                            isNormalArcher: !0,
                            columnType: 'normal',
                            onToggle: T,
                          },
                          t
                        );
                      }),
                    }),
            ],
          }),
          p &&
            (0, f.jsx)(o.default, {
              style: [
                b.footer,
                {
                  width: W,
                  height: s.UIConfig.footerHeight * z,
                  backgroundColor: e.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                  padding: 0,
                  borderRightWidth: R,
                  borderRightColor: '#000',
                  borderLeftWidth: _,
                  borderLeftColor: '#000',
                },
              ],
              children: e.isSeparator
                ? (0, f.jsx)(n.default, {
                    style: { alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' },
                    onPress: S,
                    disabled: k && !y,
                    children: (0, f.jsx)(h.Ionicons, {
                      name: 'close-circle',
                      size: 24 * z,
                      color: '#8E8E93',
                    }),
                  })
                : (0, f.jsxs)(n.default, {
                    style: {
                      alignItems: 'center',
                      width: '100%',
                      height: '100%',
                      justifyContent: 'center',
                      padding: 4,
                    },
                    onPress: x,
                    onLongPress: j,
                    delayLongPress: 500,
                    children: [
                      (0, f.jsx)(l.default, {
                        style: [b.footerName, { color: '#000', fontSize: 12 * z }],
                        numberOfLines: 2,
                        children: v(),
                      }),
                      e.isGuest
                        ? (0, f.jsx)(l.default, {
                            style: [b.guestLabel, { fontSize: 9 * z }],
                            children: '(ゲスト)',
                          })
                        : null,
                      e.isTotalCalculator || '' === e.name
                        ? null
                        : (0, f.jsx)(o.default, {
                            style: {
                              marginTop: 2,
                              paddingHorizontal: 4,
                              paddingVertical: 2,
                              borderRadius: 10,
                              backgroundColor:
                                e.isGuest ||
                                !e.gender ||
                                e.gender === '未設定' ||
                                !['男子', '女子'].includes(e.gender)
                                  ? '#8E8E93'
                                  : '男子' === e.gender
                                    ? '#007AFF'
                                    : '#FF2D55',
                            },
                            children: (0, f.jsx)(h.Ionicons, { name: 'person', size: 10 * z, color: '#FFF' }),
                          }),
                    ],
                  }),
            }),
        ],
      });
    }
  ),
  b = i.default.create({
    header: {
      height: s.UIConfig.headerHeight,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
    },
    hitCount: { fontSize: 22, fontWeight: 'bold' },
    hitCountSub: {
      fontSize: 8,
      fontWeight: 'bold',
      color: '#000',
      textAlign: 'center',
      paddingHorizontal: 2,
    },
    sepCell: {
      width: s.UIConfig.separatorWidth,
      height: s.UIConfig.cellHeight,
      backgroundColor: 'rgba(142,142,147,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    totalCell: {
      width: s.UIConfig.cellWidth,
      height: s.UIConfig.cellHeight,
      backgroundColor: 'rgba(0,122,255,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    blockTotalText: { fontSize: 24, fontWeight: '900', color: '#007AFF' },
    footer: {
      height: s.UIConfig.footerHeight,
      justifyContent: 'center',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#000',
      padding: 4,
    },
    footerName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
    guestLabel: { fontSize: 9, color: '#8E8E93' },
  });
