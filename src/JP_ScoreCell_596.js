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
      横並び: 横 = !1,
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
        細い = 'separator' === C ? s.UIConfig.separatorWidth : null,
        W = (横 ? s.UIConfig.cellWidth : (細い ?? s.UIConfig.cellWidth)) * v,
        E = (横 ? (細い ?? s.UIConfig.cellHeight) : s.UIConfig.cellHeight) * v,
        // 縦は「下に太線・右に細線」。横はそれを90度まわして「右に太線・下に細線」
        線 = 横
          ? {
              borderRightWidth: B,
              borderRightColor: '#000',
              borderBottomWidth: 1,
              borderBottomColor: '#000',
              borderTopWidth: w,
              borderTopColor: '#000',
            }
          : {
              borderBottomWidth: B,
              borderBottomColor: '#000',
              borderRightWidth: 1,
              borderRightColor: '#000',
              borderLeftWidth: w,
              borderLeftColor: '#000',
            };
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
      const 閉じたますが押された = (0, d.useScoreStore)((e) => e.閉じたますが押された);
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
      // 「計」と「間隔」の列は、数字や区切りを出すだけで○×を入れる場所ではない。
      // ここを普通のますとして扱うと、押しただけで見えない○が入り（hideMark が
      // 立っているので画面には出ない）、3秒後に灰色になる
      const 印を入れる列 = 'total' !== C && 'separator' !== C;
      // 空のますは閉じない（これから入れるところなので）。
      // 手元に入れた覚えが無い○×は、読み込み直後かライブで届いたもの。
      // どちらも「もう入れ終わったます」なので、初めから閉じておく
      const 自動で閉じている =
        印を入れる列 && 鍵をかける板 && 自動ロックする && !!(l ?? '') && (経った || !入れた);
      const 閉じている = p || 自動で閉じている;
      const setActiveArrowLocationEdit = (0, d.useScoreStore)((e) => e.setActiveArrowLocationEdit);
      const updateArrowLocation = (0, d.useScoreStore)((e) => e.updateArrowLocation);
      // ここで (s) => s.archers.find(...) を購読していた。ますの数だけ
      // 全射手の走査が走り、○×を1つ入れるたびに盤面全体が重くなっていた。
      // この射手を使うのは長押しの中だけなので、そのとき取りに行けばよい
      // 射手IDは控え（latestPropsRef）から読む。ここで e を閉じ込めると、
      // ますが別の射手に使い回されたときに前の人を返してしまう
      const 射手を取る = () => {
        const id = latestPropsRef.current ? latestPropsRef.current.archerId : e;
        return d.useScoreStore.getState().archers.find((a) => a && a.id === id);
      };
      const latestPropsRef = React.useRef({
        mark: l,
        archerId: e,
        shotIndex: t,
        isLocked: p,
        enableArrowLocation: enableArrowLocation,
        自動で閉じている: 自動で閉じている,
        ますを開ける: ますを開ける,
      });
      latestPropsRef.current = {
        mark: l,
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
              const 射手 = 射手を取る();
              if (props.enableArrowLocation && '' !== 印 && 射手) {
                setActiveArrowLocationEdit({
                  archerId: props.archerId,
                  shotIndex: props.shotIndex,
                  currentMark: 印,
                  arrowLocations: 射手.arrowLocations || [],
                });
              }
            }, 500);
            return;
          }
          if (!props.enableArrowLocation) return;
          isLongPressedRef.current = false;
          longPressTimerRef.current = setTimeout(() => {
            const currentMark = props.mark ?? '';
            const 射手2 = 射手を取る();
            if (currentMark !== '' && 射手2) {
              isLongPressedRef.current = true;
              setActiveArrowLocationEdit({
                archerId: props.archerId,
                shotIndex: props.shotIndex,
                currentMark: currentMark,
                arrowLocations: 射手2.arrowLocations || [],
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
        // 矢所を使っていなくても、閉じたますを開けるのに長押しを使う。
        // 矢所のときだけ止めていたので、既定の設定（矢所は切ってある）だと
        // 開けようと押さえた指に対してブラウザの長押しメニューが出ていた
        const suppressContext = (ev) => {
          ev.preventDefault();
        };
        el.addEventListener('mousedown', startPress);
        el.addEventListener('mouseup', endPress);
        el.addEventListener('mouseleave', endPress);
        el.addEventListener('touchstart', startPress, { passive: true });
        el.addEventListener('touchend', endPress);
        el.addEventListener('touchcancel', endPress);
        el.addEventListener('contextmenu', suppressContext);
        return () => {
          // 押さえている最中にこのますが消えることがある（射手を消した、
          // 射数を減らした、ライブで盤面が入れ替わった）。止めておかないと、
          // 消えたあとに鍵が開いたり矢所の窓が出たりする
          endPress();
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
        // 「計」と「間隔」の列には○×を入れない。押しても何もしない。
        // 鍵の印はこの上に別に重ねてあるので、そちらは今までどおり押せる
        if (!印を入れる列) return;
        // 閉じているますは押しても変わらない。ただし黙って何も起きないと、
        // 開け方が分からないまま何度も押すことになる。押されたことを伝えて
        // 記録画面に「長押しで開きます」と出してもらう
        if (閉じている) return void 閉じたますが押された();
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
          },
          線,
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
      // 閉じたますは長押しで開ける。押さえたままにすると、ブラウザ側が
      // 文字を選び始めたり長押しメニューを出したりして、こちらの長押しと
      // ぶつかる。ますは押すための場所で、文字を選ぶ用は無い
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none',
    },
    markText: Object.assign({ fontSize: 28, fontWeight: '900' }, {}),
    lockIconOverlay: { position: 'absolute', top: 2, alignItems: 'center', width: '100%', zIndex: 1 },
    subContainer: { position: 'absolute', bottom: 2, width: '100%', alignItems: 'center' },
    subText: { fontSize: 9, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 2 },
  });
