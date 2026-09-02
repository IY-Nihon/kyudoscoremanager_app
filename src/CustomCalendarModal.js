/**
 * Module ID: 695
 */
'use strict';

const _e = exports;

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'CustomCalendarModal', {
    enumerable: !0,
    get: function () {
      return y;
    },
  }));
var t = require('react'),
  n = e(require('./View')),
  l = e(require('./Text')),
  o = e(require('./StyleSheet')),
  a = e(require('./Modal')),
  s = e(require('./TouchableOpacity')),
  i = e(require('./ScrollView'));
require('./platform');
var c = require('./shadowStyle'),
  u = require('date-fns'),
  h = require('./themedJsx');
const f = 44,
  x = ({ data: e, value: o, onValueChange: a, label: c, flex: u = 1 }) => {
    const x = (0, t.useRef)(null),
      y = (0, t.useRef)(null),
      [b, p] = (0, t.useState)(!1),
      w = (0, t.useMemo)(() => {
        const t = e.indexOf(o);
        return -1 !== t ? t : 0;
      }, [e, o]);
    (0, t.useEffect)(() => {
      b || x.current?.scrollTo({ y: w * f, animated: !0 });
    }, [w, b]);
    const C = (t) => {
      const n = Math.round(t / f),
        l = Math.max(0, Math.min(n, e.length - 1));
      x.current?.scrollTo({ y: l * f, animated: !0 });
      const s = e[l];
      (s !== o && a(s),
        setTimeout(() => {
          p(!1);
        }, 150));
    };
    return (0, h.jsxs)(n.default, {
      style: [j.wheelContainer, { flex: u }],
      children: [
        c ? (0, h.jsx)(l.default, { style: j.wheelLabel, children: c }) : null,
        (0, h.jsxs)(n.default, {
          style: j.wheelClip,
          children: [
            (0, h.jsx)(n.default, { style: j.selectionIndicator, pointerEvents: 'none' }),
            (0, h.jsx)(i.default, {
              ref: x,
              showsVerticalScrollIndicator: !1,
              scrollEventThrottle: 16,
              onScroll: (e) => {
                const t = e.nativeEvent.contentOffset.y;
                (b || p(!0),
                  y.current && clearTimeout(y.current),
                  (y.current = setTimeout(() => {
                    C(t);
                  }, 100)));
              },
              onScrollBeginDrag: () => p(!0),
              onMomentumScrollBegin: () => p(!0),
              contentContainerStyle: { paddingVertical: f * Math.floor(2.5) },
              children: e.map((e, t) =>
                (0, h.jsx)(
                  s.default,
                  {
                    style: j.wheelItem,
                    activeOpacity: 0.7,
                    onPress: () => {
                      (a(e), x.current?.scrollTo({ y: t * f, animated: !0 }));
                    },
                    children: (0, h.jsx)(l.default, {
                      style: [j.wheelItemText, e === o ? j.wheelItemTextSelected : null],
                      children: e,
                    }),
                  },
                  `item-${t}-${e}`
                )
              ),
            }),
          ],
        }),
      ],
    });
  },
  y = ({ visible: e, onClose: o, selectedDate: i, onSelectDate: c, title: f = '日付を選択' }) => {
    const [y, b] = (0, t.useState)(new Date(i));
    (0, t.useEffect)(() => {
      e && b(new Date(i));
    }, [e, i]);
    const p = (0, t.useMemo)(() => {
        const e = (0, u.getYear)(new Date()),
          t = [];
        for (let n = e - 5; n <= e + 5; n++) t.push(n);
        const n = (0, u.getYear)(y);
        return (t.includes(n) || (t.push(n), t.sort((e, t) => e - t)), t);
      }, [y]),
      w = (0, t.useMemo)(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []),
      C = (0, t.useMemo)(() => {
        const e = (0, u.getDaysInMonth)(y);
        return Array.from({ length: e }, (e, t) => t + 1);
      }, [(0, u.getYear)(y), (0, u.getMonth)(y)]);
    return (0, h.jsx)(a.default, {
      visible: e,
      transparent: !0,
      animationType: 'slide',
      children: (0, h.jsxs)(n.default, {
        style: j.overlay,
        children: [
          (0, h.jsx)(s.default, { style: j.dismissOverlay, activeOpacity: 1, onPress: o }),
          (0, h.jsxs)(n.default, {
            style: j.container,
            children: [
              (0, h.jsxs)(n.default, {
                style: j.modalHeader,
                children: [
                  (0, h.jsx)(s.default, {
                    onPress: o,
                    style: j.headerBtn,
                    children: (0, h.jsx)(l.default, { style: j.cancelText, children: 'キャンセル' }),
                  }),
                  (0, h.jsx)(l.default, { style: j.modalTitle, children: f }),
                  (0, h.jsx)(s.default, {
                    onPress: () => {
                      (c(y), o());
                    },
                    style: j.headerBtn,
                    children: (0, h.jsx)(l.default, { style: j.confirmText, children: '完了' }),
                  }),
                ],
              }),
              (0, h.jsxs)(n.default, {
                style: j.pickerArea,
                children: [
                  (0, h.jsx)(x, {
                    label: '年',
                    data: p,
                    value: (0, u.getYear)(y),
                    onValueChange: (e) => {
                      const t = (0, u.setYear)(y, e),
                        n = (0, u.getDaysInMonth)(t);
                      (0, u.getDate)(t) > n ? b((0, u.setDate)(t, n)) : b(t);
                    },
                    flex: 1.5,
                  }),
                  (0, h.jsx)(x, {
                    label: '月',
                    data: w,
                    value: (0, u.getMonth)(y) + 1,
                    onValueChange: (e) => {
                      const t = (0, u.setMonth)(y, e - 1),
                        n = (0, u.getDaysInMonth)(t);
                      (0, u.getDate)(t) > n ? b((0, u.setDate)(t, n)) : b(t);
                    },
                    flex: 1,
                  }),
                  (0, h.jsx)(x, {
                    label: '日',
                    data: C,
                    value: (0, u.getDate)(y),
                    onValueChange: (e) => {
                      b((0, u.setDate)(y, e));
                    },
                    flex: 1,
                  }),
                ],
              }),
              (0, h.jsx)(s.default, {
                style: j.todayBtn,
                onPress: () => {
                  const e = new Date();
                  b(e);
                },
                children: (0, h.jsx)(l.default, { style: j.todayBtnText, children: '今日に設定' }),
              }),
            ],
          }),
        ],
      }),
    });
  },
  j = o.default.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    dismissOverlay: Object.assign({}, o.default.absoluteFillObject),
    container: Object.assign(
      {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
        width: '100%',
      },
      (0, c.getShadowStyle)({
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
      })
    ),
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F2F2F7',
    },
    headerBtn: { padding: 4 },
    modalTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
    cancelText: { fontSize: 17, color: '#8E8E93' },
    confirmText: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
    pickerArea: { flexDirection: 'row', height: 220, paddingHorizontal: 20, backgroundColor: '#FFF' },
    wheelContainer: { height: '100%' },
    wheelLabel: {
      textAlign: 'center',
      fontSize: 12,
      color: '#8E8E93',
      fontWeight: 'bold',
      marginTop: 10,
      marginBottom: -10,
      zIndex: 10,
    },
    wheelClip: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
    selectionIndicator: {
      position: 'absolute',
      left: 4,
      right: 4,
      top: 88,
      height: f,
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      zIndex: 0,
    },
    wheelItem: { height: f, justifyContent: 'center', alignItems: 'center' },
    wheelItemText: { fontSize: 20, color: '#8E8E93' },
    wheelItemTextSelected: { color: '#000', fontWeight: '600', fontSize: 22 },
    todayBtn: {
      marginTop: 10,
      marginHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: '#F2F2F7',
      borderRadius: 12,
      alignItems: 'center',
    },
    todayBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  });
