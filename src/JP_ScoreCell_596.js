/**
 * Module ID: 596
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 596;
const _m = module;
const _e = exports;
const _d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'ScoreCell', {
    enumerable: !0,
    get: function () {
      return h;
    },
  }));
var t = e(require('./module_37')),
  o = e(require('./default_144')),
  n = e(require('./default_217')),
  l = e(require('./default_45')),
  c = e(require('./default_382')),
  pressable = e(require('./default_218'));
require('./module_98');
var s = require('./module_595'),
  d = require('./JP_useScoreStore_174'),
  u = (function (e) {
    if (e && e.__esModule) return e;
    var t = {};
    return (
      e &&
        Object.keys(e).forEach(function (o) {
          var n = Object.getOwnPropertyDescriptor(e, o);
          Object.defineProperty(
            t,
            o,
            n.get
              ? n
              : {
                  enumerable: !0,
                  get: function () {
                    return e[o];
                  },
                }
          );
        }),
      (t.default = e),
      t
    );
  })(require('./NotificationFeedbackType_597')),
  f = require('./AntDesign_600'),
  b = require('./module_427');
var React = require('react');
const h = t.default.memo(
    ({
      archerId: e,
      index: t,
      mark: l,
      subName: h,
      isLocked: p,
      isBlockBottom: y,
      isBlockTop: k,
      isFirst: F,
      hideMark: j = !1,
      isNormalArcher: x = !1,
      columnType: C = 'normal',
      onToggle: I,
    }) => {
      const O = (0, d.useScoreStore)((e) => e.toggleMark),
        S = (0, d.useScoreStore)((e) => e.viewScale),
        v = 'number' == typeof S && !isNaN(S) && S > 0 ? S : 1,
        _ = l ?? '',
        z =
          'total' === C
            ? 'rgba(0,122,255,0.08)'
            : 'separator' === C
              ? 'rgba(142,142,147,0.1)'
              : p
                ? '#F2F2F7'
                : '#FFFFFF',
        B = F ? 1 : y ? 2 : 1,
        T = 'separator' === C || 'total' === C,
        w = T ? 1 : 0,
        W = ('separator' === C ? s.UIConfig.separatorWidth : s.UIConfig.cellWidth) * v,
        E = s.UIConfig.cellHeight * v;
      const timerRef = React.useRef(null);
      const longPressTimerRef = React.useRef(null);
      const isLongPressedRef = React.useRef(false);
      const cellRef = React.useRef(null);
      const enableArrowLocation = (0, d.useScoreStore)((e) => e.enableArrowLocation);

      // 誤タップ防止。入れてから少し経ったますは、押しても変わらないようにする。
      // 直したいときは長押しで、そのますだけ開く。
      // 記録そのものには持たせない（同期の形を変えないため）
      const 自動ロックする = (0, d.useScoreStore)((e) => e.自動ロックする);
      const 自動ロックまでの秒 = (0, d.useScoreStore)((e) => e.自動ロックまでの秒);
      const ますを開ける = (0, d.useScoreStore)((e) => e.ますを開ける);
      const この鍵 = e + ':' + t;
      const 入れた = (0, d.useScoreStore)((s) => s.入れた時刻[この鍵]);
      const [経った, 経ったを置く] = React.useState(!1);
      React.useEffect(() => {
        経ったを置く(!1);
        if (!自動ロックする || !入れた) return;
        const 残り = 自動ロックまでの秒 * 1000 - (Date.now() - 入れた);
        if (残り <= 0) return void 経ったを置く(!0);
        const t = setTimeout(() => 経ったを置く(!0), 残り);
        return () => clearTimeout(t);
      }, [自動ロックする, 自動ロックまでの秒, 入れた]);
      // 鍵をかけるのは記録中の板だけ。
      // 履歴の編集画面は onToggle を渡してくる。あちらは直しに来ている画面なので、
      // 同じ射手・同じ射番の鍵（記録側で付いたもの）を持ち込まない
      const 鍵をかける板 = !I;
      // 空のますは閉じない（これから入れるところなので）。
      // 手元に入れた覚えが無い○×は、読み込み直後かライブで届いたもの。
      // どちらも「もう入れ終わったます」なので、初めから閉じておく
      const 自動で閉じている = 鍵をかける板 && 自動ロックする && !!(l ?? '') && (経った || !入れた);
      const 閉じている = p || 自動で閉じている;
      const setActiveArrowLocationEdit = (0, d.useScoreStore)((e) => e.setActiveArrowLocationEdit);
      const updateArrowLocation = (0, d.useScoreStore)((e) => e.updateArrowLocation);
      const archer = (0, d.useScoreStore)((s) => s.archers.find((a) => a && a.id === e));
      const latestPropsRef = React.useRef({
        mark: l,
        archer: archer,
        archerId: e,
        shotIndex: t,
        isLocked: p,
        enableArrowLocation: enableArrowLocation,
        自動で閉じている: 自動で閉じている,
        ますを開ける: ますを開ける,
      });
      latestPropsRef.current = {
        mark: l,
        archer: archer,
        archerId: e,
        shotIndex: t,
        isLocked: p,
        enableArrowLocation: enableArrowLocation,
        自動で閉じている: 自動で閉じている,
        ますを開ける: ますを開ける,
      };
      React.useEffect(() => {
        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        };
      }, []);
      React.useEffect(() => {
        const el = cellRef.current;
        if (!el) return;
        const startPress = (ev) => {
          const props = latestPropsRef.current;
          if (props.isLocked) return;
          // 自動で閉じたますは、長押しで1つだけ開ける
          if (props.自動で閉じている) {
            isLongPressedRef.current = !1;
            longPressTimerRef.current = setTimeout(() => {
              isLongPressedRef.current = !0;
              props.ますを開ける(props.archerId, props.shotIndex);
              // 矢所を使っているなら、長押しは「このますを直す」合図。
              // 開けるだけで終わると、矢所を出すのに二度長押しさせることになる
              const 印 = props.mark ?? '';
              if (props.enableArrowLocation && '' !== 印 && props.archer) {
                setActiveArrowLocationEdit({
                  archerId: props.archerId,
                  shotIndex: props.shotIndex,
                  currentMark: 印,
                  arrowLocations: props.archer.arrowLocations || [],
                });
              }
            }, 500);
            return;
          }
          if (!props.enableArrowLocation) return;
          isLongPressedRef.current = false;
          longPressTimerRef.current = setTimeout(() => {
            const currentMark = props.mark ?? '';
            if (currentMark !== '' && props.archer) {
              isLongPressedRef.current = true;
              setActiveArrowLocationEdit({
                archerId: props.archerId,
                shotIndex: props.shotIndex,
                currentMark: currentMark,
                arrowLocations: props.archer.arrowLocations || [],
              });
            }
          }, 500);
        };
        const endPress = () => {
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        };
        const suppressContext = (ev) => {
          const props = latestPropsRef.current;
          if (props.enableArrowLocation) {
            ev.preventDefault();
          }
        };
        el.addEventListener('mousedown', startPress);
        el.addEventListener('mouseup', endPress);
        el.addEventListener('mouseleave', endPress);
        el.addEventListener('touchstart', startPress, { passive: true });
        el.addEventListener('touchend', endPress);
        el.addEventListener('touchcancel', endPress);
        el.addEventListener('contextmenu', suppressContext);
        return () => {
          el.removeEventListener('mousedown', startPress);
          el.removeEventListener('mouseup', endPress);
          el.removeEventListener('mouseleave', endPress);
          el.removeEventListener('touchstart', startPress);
          el.removeEventListener('touchend', endPress);
          el.removeEventListener('touchcancel', endPress);
          el.removeEventListener('contextmenu', suppressContext);
        };
      }, []);
      const handlePress = () => {
        // 閉じているますは押しても変わらない。長押しで開けてもらう
        if (閉じている) return;
        if (isLongPressedRef.current) {
          isLongPressedRef.current = false;
          return;
        }
        const currentMark = l ?? '';
        const nextMark = currentMark === '' ? '○' : currentMark === '○' ? '\xd7' : '';
        if (I) {
          I(e, t);
        } else {
          O(e, t);
        }
        u.impactAsync(u.ImpactFeedbackStyle.Light);
        if (enableArrowLocation) {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (nextMark === '') {
            updateArrowLocation(e, t, null);
          } else {
            timerRef.current = setTimeout(() => {
              if (archer) {
                setActiveArrowLocationEdit({
                  archerId: e,
                  shotIndex: t,
                  currentMark: nextMark,
                  arrowLocations: archer.arrowLocations || [],
                });
              }
            }, 500);
          }
        }
      };
      return (0, b.jsxs)(o.default, {
        ref: cellRef,
        // 自動での確かめ用。どのますかを外から指せるようにしておく
        testID: 'ます-' + e + '-' + t,
        onTouchEnd: (ev) => {
          ev.stopPropagation();
        },
        style: [
          m.cell,
          {
            width: W,
            height: E,
            backgroundColor: 自動で閉じている ? '#F2F2F7' : z,
            borderBottomWidth: B,
            borderBottomColor: '#000',
            borderRightWidth: 1,
            borderRightColor: '#000',
            borderLeftWidth: w,
            borderLeftColor: '#000',
          },
        ],
        children: [
          (0, b.jsx)(pressable.default, {
            onPress: handlePress,
            disabled: p,
            style: ({ pressed }) => [
              {
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              },
            ],
            children: (0, b.jsxs)(React.Fragment, {
              children: [
                !j &&
                  (0, b.jsx)(n.default, {
                    style: [
                      m.markText,
                      {
                        color: ((L = _), '○' === L ? '#FF3B30' : '\xd7' === L ? '#000000' : 'transparent'),
                        fontSize: 34 * v,
                        lineHeight: E,
                      },
                    ],
                    children: _,
                  }),
                h
                  ? (0, b.jsx)(o.default, {
                      style: [m.subContainer, { bottom: 2 * v }],
                      children: (0, b.jsx)(n.default, {
                        style: [m.subText, { fontSize: 9 * v }],
                        numberOfLines: 1,
                        children: h,
                      }),
                    })
                  : null,
              ],
            }),
          }),
          k &&
            !x &&
            (0, b.jsx)(o.default, {
              style: [m.lockIconOverlay, { top: 3 * v }],
              children: (0, b.jsx)(f.Ionicons, {
                name: p ? 'lock-closed' : 'lock-open',
                size: 16 * v,
                color: p ? '#FF3B30' : '#8E8E93',
              }),
            }),
        ],
      });
      var L;
    }
  ),
  m = l.default.create({
    cell: {
      width: '100%',
      height: s.UIConfig.cellHeight,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightColor: '#000',
      position: 'relative',
    },
    markText: Object.assign({ fontSize: 28, fontWeight: '900' }, {}),
    lockIconOverlay: { position: 'absolute', top: 2, alignItems: 'center', width: '100%', zIndex: 1 },
    subContainer: { position: 'absolute', bottom: 2, width: '100%', alignItems: 'center' },
    subText: { fontSize: 9, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 2 },
  });
