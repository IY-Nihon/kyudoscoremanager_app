/**
 * Module ID: 688
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const _i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 688;
const m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'LabelColumn', {
    enumerable: !0,
    get: function () {
      return f;
    },
  }),
  require('react'));
var t = e(require('./default_144')),
  o = e(require('./default_217')),
  i = e(require('./default_45')),
  n = require('./module_595'),
  l = require('./JP_useScoreStore_174'),
  h = require('./module_427');
const f = ({ shots: e, showFooter: i = !0, 横並び: 横 = !1 }) => {
    const f = (0, l.useScoreStore)((e) => e.viewScale),
      s = 'number' == typeof f && !isNaN(f) && f > 0 ? f : 1,
      u = [];
    // 縦の表は下から上へ数える（1射目が下）。横の表は左から右へ数える
    if (横) for (let t = 1; t <= e; t++) u.push(t);
    else for (let t = e; t >= 1; t--) u.push(t);
    return (0, h.jsxs)(t.default, {
      style: [
        c.column,
        横
          ? {
              width: n.UIConfig.cellWidth * (e + 1) * s,
              height: n.UIConfig.cellHeight * s,
              flexDirection: 'row',
              flexShrink: 0,
              borderLeftWidth: 0,
              borderTopWidth: 1.5,
              borderTopColor: '#000',
            }
          : { width: n.UIConfig.headerWidth * s },
      ],
      children: [
        (0, h.jsxs)(t.default, {
          style: { flexDirection: 横 ? 'row-reverse' : 'column' },
          children: [
            (0, h.jsx)(t.default, {
              style: [
                c.header,
                横
                  ? {
                      width: n.UIConfig.cellWidth * s,
                      height: n.UIConfig.cellHeight * s,
                      borderBottomWidth: 0,
                      borderRightWidth: 0,
                      borderLeftWidth: 1.5,
                      borderLeftColor: '#000',
                    }
                  : { height: n.UIConfig.headerHeight * s },
              ],
              children: (0, h.jsx)(o.default, {
                style: [c.headerText, { fontSize: 10 * s }],
                children: '計',
              }),
            }),
            (0, h.jsx)(t.default, {
              style: 横 ? { flexDirection: 'row' } : void 0,
              children: u.map((e) => {
              // 立の切れ目。縦では下の線、横では右の線を太くする
              const i = (e - 1) % 4 == 0 && 1 !== e;
              const 切れ目 = 横 ? e % 4 == 0 && e !== u.length : i;
              return (0, h.jsx)(
                t.default,
                {
                  style: [
                    c.cell,
                    横
                      ? {
                          width: n.UIConfig.cellWidth * s,
                          height: n.UIConfig.cellHeight * s,
                          borderRightWidth: 切れ目 ? 2 : 1,
                          borderRightColor: '#000',
                        }
                      : {
                          height: n.UIConfig.cellHeight * s,
                          borderBottomWidth: i ? 2 : 1,
                          borderBottomColor: '#000',
                        },
                  ],
                  children: (0, h.jsx)(o.default, { style: [c.numText, { fontSize: 10 * s }], children: e }),
                },
                e
              );
              }),
            }),
          ],
        }),
        i &&
          (0, h.jsx)(t.default, {
            style: [c.footer, { height: n.UIConfig.footerHeight * s }],
            children: (0, h.jsx)(o.default, { style: [c.footerText, { fontSize: 10 * s }], children: '名' }),
          }),
        横
          ? (0, h.jsx)(t.default, {
              style: {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                // 見出しと本体の区切りなので、ますの線（1px）より太くする
                height: 3,
                backgroundColor: '#000',
              },
            })
          : null,
      ],
    });
  },
  c = i.default.create({
    column: {
      width: n.UIConfig.headerWidth,
      backgroundColor: '#F2F2F7',
      borderLeftWidth: 1.5,
      borderLeftColor: '#000',
    },
    header: {
      height: n.UIConfig.headerHeight,
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomWidth: 1.5,
      borderBottomColor: '#000',
      borderRightWidth: 1.5,
      borderRightColor: '#000',
    },
    headerText: { color: '#3C3C43', fontSize: 10, fontWeight: 'bold' },
    cell: {
      height: n.UIConfig.cellHeight,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      borderRightWidth: 1.5,
      borderRightColor: '#000',
    },
    numText: { color: '#3C3C43', fontSize: 10 },
    footer: {
      height: n.UIConfig.footerHeight,
      justifyContent: 'center',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#000',
      borderRightWidth: 1.5,
      borderRightColor: '#000',
      backgroundColor: '#F2F2F7',
    },
    footerText: { color: '#3C3C43', fontSize: 10, fontWeight: 'bold' },
  });
