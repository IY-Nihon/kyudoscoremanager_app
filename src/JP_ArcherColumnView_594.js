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
      // 横に並べる（名前が左、○×が右へ伸びる）。鍵も交代も規則は同じで、置き方だけ変える
      横並び: 横 = !1,
      isReadOnly: k = !1,
      isAdminMode: y = !1,
      onPressName: x,
      onLongPressName: j,
      onDelete: S,
      onToggleMark: T,
      onToggleLock: I,
    }) => {
      // 鍵が効くかどうか。
      // toggleLock は押した列から右へ進み、間隔か計にぶつかったところで止める。
      // 右どなりが間隔・計だと一歩目で止まるので自分の列しか掴まず、射手は
      // 1人も固定されない。鍵は閉じるのに○×は編集できたままになり、効いた
      // ように見えて効いていない状態になる。そういう鍵は初めから出さない
      const 鍵が効く = (() => {
        const 一覧 = Array.isArray(m) ? m : [];
        const 右どなり = 一覧[C - 1];
        return !!(C > 0 && 右どなり && !右どなり.isSeparator && !右どなり.isTotalCalculator);
      })();
      // 途中交代があると、計は「山田 3, 交代太郎 2」と内訳で出る。
      // 押すと合わせた数（5）に切り替わる。どちらで見たいかは場面による
      const [合算で見る, 合算を置く] = t.default.useState(!1);
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
      // 縦の表は下から上へ数える（1射目が下）。横の表は左から右へ数える
      if (!e.isSeparator) {
        if (横) for (let e = 0; e < i; e++) M.push(e);
        else for (let e = i - 1; e >= 0; e--) M.push(e);
      }
      // 立の切れ目に引く太線。縦は「その立の1本目の下」、横は「その立の4本目の右」
      const 切れ目 = (位置) => (横 ? 位置 % 4 == 3 && 位置 !== i - 1 : 位置 % 4 == 0 && 0 !== 位置);
      // 1ますの外枠。横のとき、間隔は細い列ではなく細い行になる
      const ます幅 = (横 ? s.UIConfig.cellWidth : e.isSeparator ? s.UIConfig.separatorWidth : s.UIConfig.cellWidth) * z,
        ます高 = (横 && e.isSeparator ? s.UIConfig.separatorWidth : s.UIConfig.cellHeight) * z;
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

      // 1立が全部埋まって少し経ったら、鍵を自動でかける。
      // 鍵ボタンは「間隔」「計」の列に付いていて、押すと自分より右の射手を
      // まとめて閉じる。だから受け持つのもその列だけでよい。
      // 履歴の編集画面（onToggleLock を渡してくる）と、そもそも押せない場では何もしない
      const 自動ロックする = (0, c.useScoreStore)((e) => e.自動ロックする),
        自動ロックまでの秒 = (0, c.useScoreStore)((e) => e.自動ロックまでの秒),
        立を閉じる = (0, c.useScoreStore)((e) => e.立を閉じる);
      const 埋まった時刻 = t.default.useRef({}),
        閉じた覚え = t.default.useRef({});
      // 埋まっている立の番号。中身が変わったときだけ数え直したいので文字にする
      const 埋まった立 = (() => {
        if (!O || !鍵が効く || I || (k && !y)) return '';
        const 仲間 = N();
        if (!仲間.length) return '';
        const 出 = [];
        for (let b = 0; 4 * b < i; b++) {
          const 端 = Math.min(4 * b + 4, i);
          let 全部 = !0;
          for (let j = 0; j < 仲間.length && 全部; j++) {
            const 印 = 仲間[j].marks || [];
            for (let x = 4 * b; x < 端; x++) if (!(印[x] ?? '')) { 全部 = !1; break; }
          }
          if (全部) 出.push(b);
        }
        return 出.join(',');
      })();
      t.default.useEffect(() => {
        const 立たち = 埋まった立
          ? 埋まった立.split(',').map(Number)
          : [];
        // 埋まらなくなった立は覚えを捨てる。入れ直せば、また閉じるように
        const いま = new Set(立たち);
        [埋まった時刻, 閉じた覚え].forEach((箱) => {
          Object.keys(箱.current).forEach((b) => {
            if (!いま.has(Number(b))) delete 箱.current[b];
          });
        });
        if (!自動ロックする || !立たち.length) return;
        const 今 = Date.now();
        立たち.forEach((b) => {
          if (!埋まった時刻.current[b]) 埋まった時刻.current[b] = 今;
          // すでに閉じている立は、自分で開け直した人の邪魔をしないよう放っておく
          if (e.lockedBlocks?.[b]) 閉じた覚え.current[b] = !0;
        });
        const 残り = 立たち.filter((b) => !閉じた覚え.current[b]);
        if (!残り.length) return;
        const 待つ = Math.max(
          0,
          Math.min(...残り.map((b) => 埋まった時刻.current[b])) + 自動ロックまでの秒 * 1000 - 今
        );
        const 札 = setTimeout(() => {
          const 頃 = Date.now();
          残り.forEach((b) => {
            if (埋まった時刻.current[b] + 自動ロックまでの秒 * 1000 <= 頃) {
              閉じた覚え.current[b] = !0;
              立を閉じる(e.id, b);
            }
          });
        }, 待つ);
        return () => clearTimeout(札);
      }, [自動ロックする, 自動ロックまでの秒, 埋まった立, e.id, e.lockedBlocks, 立を閉じる]);

      return (0, f.jsxs)(o.default, {
        style: 横
          ? {
              flexDirection: 'row',
              flexShrink: 0,
              width: s.UIConfig.cellWidth * (i + 1) * z,
              backgroundColor: 'transparent',
            }
          : { width: W, backgroundColor: 'transparent' },
        children: [
          (0, f.jsxs)(o.default, {
            style: { flexDirection: 横 ? 'row-reverse' : 'column' },
            children: [
              (0, f.jsxs)(n.default, {
                activeOpacity: 1,
                style: [
                  b.header,
                  横
                    ? {
                        width: s.UIConfig.cellWidth * z,
                        height: ます高,
                        backgroundColor: w,
                        marginBottom: 0,
                        borderBottomWidth: R,
                        borderBottomColor: '#000',
                        borderTopWidth: _,
                        borderTopColor: '#000',
                      }
                    : {
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
                // 内訳が出ているときだけ押せる。押すと合算とを行き来する
                disabled: !(!e.isSeparator && !e.isTotalCalculator && Object.keys(e.substitutions || {}).length > 0),
                onPress: () => 合算を置く((x) => !x),
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
                        if (n.length > 0 && !合算で見る) {
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
                    style: 横
                      ? { position: 'absolute', top: 0, bottom: 0, left: 0, width: 1.5, backgroundColor: '#000' }
                      : { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: '#000' },
                  }),
                ],
              }),
              e.isSeparator
                ? (0, f.jsx)(o.default, {
                    style: 横 ? { flexDirection: 'row' } : void 0,
                    children: Array.from({ length: i }, (e, t) => (横 ? t : i - 1 - t)).map((t) => {
                      const l = Math.floor(t / 4),
                        c = 切れ目(t),
                        h = t === Math.min(i - 1, 4 * l + 3),
                        u = !(k && !y) && (e.lockedBlocks?.[l] || !1);
                      return (0, f.jsxs)(
                        o.default,
                        {
                          style: { width: ます幅, height: ます高 },
                          children: [
                            (0, f.jsx)(a.ScoreCell, {
                              archerId: e.id,
                              index: t,
                              横並び: 横,
                              isLocked: u,
                              isBlockBottom: c,
                              isBlockTop: h,
                              isFirst: 0 === t,
                              hideMark: !0,
                              isNormalArcher: !鍵が効く,
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
                      style: 横 ? { flexDirection: 'row' } : void 0,
                      children: M.map((t) => {
                        const c = Math.floor(t / 4),
                          h = U(c),
                          // 立ごとの合計を出すます。縦なら立の一番下、横なら立の左端
                          u = t % 4 == 0,
                          m = t === Math.min(i - 1, 4 * c + 3),
                          C = !(k && !y) && (e.lockedBlocks?.[c] || !1);
                        return (0, f.jsxs)(
                          o.default,
                          {
                            style: { width: ます幅, height: ます高 },
                            children: [
                              (0, f.jsx)(a.ScoreCell, {
                                archerId: e.id,
                                index: t,
                                横並び: 横,
                                mark: e.marks?.[t],
                                isLocked: C,
                                isBlockBottom: 横 ? 切れ目(t) : t % 4 == 0 && (0 !== t || i > 4),
                                isBlockTop: m,
                                isFirst: 0 === t,
                                hideMark: !0,
                                isNormalArcher: !鍵が効く,
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
                      style: 横 ? { flexDirection: 'row' } : void 0,
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
                            横並び: 横,
                            mark: e.marks?.[t] || '',
                            subName: l,
                            isLocked: c,
                            isBlockBottom: 切れ目(t),
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
