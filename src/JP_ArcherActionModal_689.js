/**
 * Module ID: 689
 */
"use strict";

const _g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 689);
const _m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArcherActionModal = undefined;

var t = require("./module_37"),
    o = e(t),
    n = e(require("./default_144")),
    l = e(require("./default_217")),
    s = e(require("./default_45")),
    a = e(require("./default_386")),
    c = e(require("./default_382")),
    u = e(require("./default_398")),
    h = e(require("./default_297")),
    f = e(require("./default_298")),
    g = e(require("./default_218")),
    x = require("./AntDesign_600"),
    m = require("./JP_useScoreStore_174"),
    p = require("./module_592"),
    F = require("./module_427");

function e(e) { return e && e.__esModule ? e : { default: e }; }

const j = ({
  visible: e,
  archerId: s,
  archerOrigIdx: pVal,
  isSeparator: jVal,
  isTotalCalculator: b,
  onClose: C,
  onSubstitution: I,
  onSetMember: S,
  onSetGuestName: v,
  onClearName: E,
  onDeleteArcher: z,
  onAddArcher: w,
  onAddSeparator: T,
  onAddTotal: k,
  existingArchers: A
}) => {
  const {
    members: B,
    alumni: alumniState,
    archers: H,
    setArcherMember: P,
    addArcher: R,
    addSeparator: W,
    addTotalCalculator: V,
    deleteArcher: D
  } = (0, m.useScoreStore)();

  const [O, M] = (0, t.useState)('');
  const [_, N] = (0, t.useState)(!1);
  const [G, K] = (0, t.useState)('');
  const [expandedTerms, setExpandedTerms] = (0, t.useState)(new Set());
  const [expandedActiveGrades, setExpandedActiveGrades] = (0, t.useState)(new Set(['1', '2', '3', '4', '0']));

  const q = A || H;

  const L = (0, t.useMemo)(() => {
    return B.filter(e => (e.grade || 0) < 5)
      .filter(e => '' === O || e.name.includes(O))
      .sort((e, t) => {
        const o = q.some(t => t.memberId === e.id);
        if (o !== q.some(e => e.memberId === t.id)) return o ? 1 : -1;
        const n = void 0 === e.grade || null === e.grade ? 99 : Number(e.grade);
        const l = void 0 === t.grade || null === t.grade ? 99 : Number(t.grade);
        const sVal = 0 === n ? 99 : n;
        const aVal = 0 === o ? 99 : o;
        if (sVal !== aVal) return sVal - aVal;
        const cVal = e => {
          const t = (e || '').trim();
          return '男子' === t ? 0 : '女子' === t ? 1 : 2;
        };
        const uVal = cVal(e.gender) - cVal(t.gender);
        return 0 !== uVal ? uVal : (e.name || '').localeCompare(t.name || '', 'ja');
      });
  }, [B, H, O, q]);

  const activeGroups = (0, t.useMemo)(() => {
    const groups = {};
    L.forEach(e => {
      const gVal = void 0 === e.grade || null === e.grade ? 0 : Number(e.grade);
      groups[gVal] || (groups[gVal] = []);
      groups[gVal].push(e);
    });
    const sortedGrades = Object.keys(groups).map(Number).sort((a, b) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b;
    });
    return sortedGrades.map(gVal => {
      let title = `${gVal}年生`;
      if (gVal === 0) title = "その他/ゲスト";
      return { grade: gVal, title, members: groups[gVal] };
    });
  }, [L]);

  const alumniByTerm = (0, t.useMemo)(() => {
    const e = B.filter(e => e.grade === 5 || e.isAlumni)
      .concat(alumniState || [])
      .filter(e => '' === O || e.name.includes(O));
    const tVal = {};
    e.forEach(e => {
      const o = e.termKi || 999;
      tVal[o] || (tVal[o] = []), tVal[o].push(e);
    });
    return Object.keys(tVal)
      .sort((e, t) => Number(t) - Number(e))
      .map(e => ({
        term: e,
        members: tVal[e].sort((e, t) => (e.name || '').localeCompare(t.name || '', 'ja'))
      }));
  }, [B, alumniState, O]);

  const $ = e => {
    S ? S(e) : P(s, e);
    C();
  };

  const toggleTerm = e => {
    setExpandedTerms(t => {
      const o = new Set(t);
      o.has(e) ? o.delete(e) : o.add(e);
      return o;
    });
  };

  const toggleActiveGrade = gVal => {
    setExpandedActiveGrades(prev => {
      const next = new Set(prev);
      next.has(gVal) ? next.delete(gVal) : next.add(gVal);
      return next;
    });
  };

  const J = () => {
    const e = G.trim();
    e && (v ? v(e) : m.useScoreStore.getState().setArcherGuestName(s, e));
    N(!1);
    K('');
    C();
  };

  const Q = f.default.get('window').height;

  return (0, F.jsx)(a.default, {
    visible: e,
    transparent: !0,
    animationType: "fade",
    onRequestClose: C,
    children: (0, F.jsxs)(n.default, {
      style: y.fullScreen,
      children: [
        (0, F.jsx)(c.default, { style: y.backdrop, activeOpacity: 1, onPress: C }),
        (0, F.jsx)(n.default, {
          style: [y.menuContainer, { maxHeight: .7 * Q }],
          children: (0, F.jsxs)(h.default, {
            bounces: !1,
            showsVerticalScrollIndicator: !1,
            children: [
              !jVal && !b && (0, F.jsx)(n.default, {
                style: y.section,
                children: (0, F.jsxs)(n.default, {
                  style: y.actionRow,
                  children: [
                    (0, F.jsxs)(g.default, {
                      style: ({ pressed: e, hovered: t }) => [y.actionBtn, t && { backgroundColor: '#E5E5EA' }, e && { opacity: .7 }],
                      onPress: () => {
                        E ? E() : m.useScoreStore.getState().setArcherMember(s, null);
                        C();
                      },
                      children: [
                        (0, F.jsx)(x.Ionicons, { name: "close-circle-outline", size: 18, color: "#FF3B30" }),
                        (0, F.jsx)(l.default, { style: [y.actionBtnText, { color: '#FF3B30' }], children: "名前クリア" })
                      ]
                    }),
                    (0, F.jsxs)(g.default, {
                      style: ({ pressed: e, hovered: t }) => [y.actionBtn, t && { backgroundColor: '#E5E5EA' }, e && { opacity: .7 }],
                      onPress: () => { C(); I(); },
                      children: [
                        (0, F.jsx)(x.Ionicons, { name: "repeat", size: 18, color: "#007AFF" }),
                        (0, F.jsx)(l.default, { style: [y.actionBtnText, { color: '#007AFF' }], children: "途中交代" })
                      ]
                    }),
                    _ ? (0, F.jsxs)(n.default, {
                      style: y.guestInputRow,
                      children: [
                        (0, F.jsx)(u.default, { style: y.guestInput, placeholder: "ゲスト名", value: G, onChangeText: K, autoFocus: !0, onSubmitEditing: J }),
                        (0, F.jsx)(c.default, { onPress: J, children: (0, F.jsx)(l.default, { style: y.guestConfirmText, children: "決定" }) }),
                        (0, F.jsx)(c.default, { onPress: () => { N(!1); K(''); }, children: (0, F.jsx)(x.Ionicons, { name: "close", size: 20, color: "#8E8E93" }) })
                      ]
                    }) : (0, F.jsxs)(g.default, {
                      style: ({ pressed: e, hovered: t }) => [y.actionBtn, t && { backgroundColor: '#E5E5EA' }, e && { opacity: .7 }],
                      onPress: () => { N(!0); },
                      children: [
                        (0, F.jsx)(x.Ionicons, { name: "person-outline", size: 18, color: "#5856D6" }),
                        (0, F.jsx)(l.default, { style: [y.actionBtnText, { color: '#5856D6' }], children: "ゲスト登録" })
                      ]
                    })
                  ]
                })
              }),
              (0, F.jsx)(n.default, { style: y.dividerFull }),
              !jVal && !b && (0, F.jsxs)(F.Fragment, {
                children: [
                  (0, F.jsx)(n.default, { style: y.sectionHeader, children: (0, F.jsx)(l.default, { style: y.sectionHeaderText, children: "メンバーを選択" }) }),
                  (0, F.jsxs)(n.default, {
                    style: y.searchRow,
                    children: [
                      (0, F.jsx)(x.Ionicons, { name: "search", size: 18, color: "#8E8E93", style: { marginRight: 8 } }),
                      (0, F.jsx)(u.default, { style: y.searchInput, placeholder: "メンバーを検索", value: O, onChangeText: M, placeholderTextColor: "#8E8E93" }),
                      '' !== O && (0, F.jsx)(c.default, { onPress: () => M(''), children: (0, F.jsx)(x.Ionicons, { name: "close-circle", size: 18, color: "#C6C6C8" }) })
                    ]
                  }),
                  (0, F.jsx)(n.default, {
                    style: y.section,
                    children: activeGroups.map(group => {
                      const gStr = group.grade.toString();
                      const isOpen = expandedActiveGrades.has(gStr);
                      return (0, F.jsxs)(F.Fragment, {
                        children: [
                          (0, F.jsxs)(c.default, {
                            style: y.termHeader,
                            onPress: () => toggleActiveGrade(gStr),
                            children: [
                              (0, F.jsxs)(l.default, { style: y.termTitle, children: [group.title, " (", group.members.length, "人)"] }),
                              (0, F.jsx)(x.Ionicons, { name: isOpen ? "chevron-up" : "chevron-down", size: 16, color: "#8E8E93" })
                            ]
                          }),
                          isOpen && group.members.map((e, idx) => {
                            const sVal = q.some(t => t.memberId === e.id);
                            return (0, F.jsxs)(F.Fragment, {
                              children: [
                                idx > 0 && (0, F.jsx)(n.default, { style: [y.divider, { marginLeft: 32 }] }),
                                (0, F.jsxs)(g.default, {
                                  style: ({ pressed: e, hovered: t }) => [y.menuItem, { paddingLeft: 32 }, sVal && { backgroundColor: '#F0F0F5', opacity: .8 }, !sVal && t && { backgroundColor: '#F2F2F7' }, e && { opacity: .7 }],
                                  onPress: () => $(e),
                                  children: [
                                    (0, F.jsxs)(l.default, {
                                      style: [y.menuText, '男子' === e.gender && { color: '#007AFF' }, '女子' === e.gender && { color: '#FF2D55' }, sVal && { opacity: .5 }],
                                      children: [
                                        e.name,
                                        " ",
                                        (0, F.jsx)(l.default, { style: { fontSize: 11, color: '#8E8E93' }, children: [e.termKi ? `(${e.termKi}期)` : ''] })
                                      ]
                                    }),
                                    sVal && (0, F.jsx)(n.default, { style: y.selectedBadge, children: (0, F.jsx)(l.default, { style: y.selectedBadgeText, children: "選択済" }) })
                                  ]
                                })
                              ]}, e.id);
                          })
                        ]
                      }, `group-${group.grade}`);
                    })
                  })
                ]
              }),
              (0, F.jsx)(n.default, { style: y.sectionHeader, children: (0, F.jsx)(l.default, { style: y.sectionHeaderText, children: "卒業生を選択" }) }),
              (0, F.jsx)(n.default, {
                style: y.section,
                children: alumniByTerm.map(e => (0, F.jsxs)(F.Fragment, {
                  children: [
                    (0, F.jsxs)(c.default, {
                      style: y.termHeader,
                      onPress: () => toggleTerm(e.term),
                      children: [
                        (0, F.jsxs)(l.default, { style: y.termTitle, children: [999 === Number(e.term) ? '不明' : e.term, "期"] }),
                        (0, F.jsx)(x.Ionicons, { name: expandedTerms.has(e.term) ? "chevron-up" : "chevron-down", size: 16, color: "#8E8E93" })
                      ]
                    }),
                    expandedTerms.has(e.term) && e.members.map((e, t) => {
                      const sVal = q.some(t => t.memberId === e.id);
                      return (0, F.jsxs)(F.Fragment, {
                        children: [
                          (0, F.jsx)(n.default, { style: [y.divider, { marginLeft: 32 }] }),
                          (0, F.jsxs)(g.default, {
                            style: ({ pressed: e, hovered: t }) => [y.menuItem, { paddingLeft: 32 }, sVal && { backgroundColor: '#F0F0F5', opacity: .8 }, !sVal && t && { backgroundColor: '#F2F2F7' }, e && { opacity: .7 }],
                            onPress: () => $(e),
                            children: [
                              (0, F.jsxs)(l.default, {
                                style: [y.menuText, '男子' === e.gender && { color: '#007AFF' }, '女子' === e.gender && { color: '#FF2D55' }, sVal && { opacity: .5 }],
                                children: [
                                  e.name,
                                  " ",
                                  (0, F.jsx)(l.default, { style: { fontSize: 11, color: '#8E8E93' }, children: "(卒業生)" })
                                ]
                              }),
                              sVal && (0, F.jsx)(n.default, { style: y.selectedBadge, children: (0, F.jsx)(l.default, { style: y.selectedBadgeText, children: "選択済" }) })
                            ]
                          })
                        ]}, e.id);
                    })
                  ]
                }, e.term))
              }),
              (0, F.jsx)(n.default, { style: y.dividerFull }),
              (0, F.jsxs)(n.default, {
                style: y.section,
                children: [
                  (0, F.jsxs)(g.default, {
                    style: ({ pressed: e, hovered: t }) => [y.menuItem, t && { backgroundColor: '#F2F2F7' }, e && { opacity: .7 }],
                    onPress: () => { w ? w(pVal + 1) : R(pVal + 1, void 0); C(); },
                    children: [
                      (0, F.jsx)(l.default, { style: y.menuText, children: "左に射手を追加" }),
                      (0, F.jsx)(x.Ionicons, { name: "person-add-outline", size: 20, color: "#8E8E93" })
                    ]
                  }),
                  (0, F.jsx)(n.default, { style: y.divider }),
                  (0, F.jsxs)(g.default, {
                    style: ({ pressed: e, hovered: t }) => [y.menuItem, t && { backgroundColor: '#F2F2F7' }, e && { opacity: .7 }],
                    onPress: () => { T ? T(pVal + 1) : W(pVal + 1); C(); },
                    children: [
                      (0, F.jsx)(l.default, { style: y.menuText, children: "左に間隔を追加" }),
                      (0, F.jsx)(x.Ionicons, { name: "reorder-four-outline", size: 20, color: "#8E8E93" })
                    ]
                  }),
                  (0, F.jsx)(n.default, { style: y.divider }),
                  (0, F.jsxs)(g.default, {
                    style: ({ pressed: e, hovered: t }) => [y.menuItem, t && { backgroundColor: '#F2F2F7' }, e && { opacity: .7 }],
                    onPress: () => { k ? k(pVal + 1) : V(pVal + 1); C(); },
                    children: [
                      (0, F.jsx)(l.default, { style: y.menuText, children: "左に計を追加" }),
                      (0, F.jsx)(x.Ionicons, { name: "calculator-outline", size: 20, color: "#8E8E93" })
                    ]
                  }),
                  (0, F.jsx)(n.default, { style: y.divider }),
                  (0, F.jsxs)(g.default, {
                    style: ({ pressed: e, hovered: t }) => [y.menuItem, t && { backgroundColor: '#FFF0F0' }, e && { opacity: .7 }],
                    onPress: () => { z ? z(s) : D(s); C(); },
                    children: [
                      (0, F.jsx)(l.default, { style: [y.menuText, { color: '#FF3B30', fontWeight: 'bold' }], children: "削除" }),
                      (0, F.jsx)(x.Ionicons, { name: "trash-outline", size: 20, color: "#FF3B30" })
                    ]
                  })
                ]
              })
            ]
          })
        })
      ]
    })
  });
};

exports.ArcherActionModal = j;

const y = s.default.create({
  fullScreen: { flex: 1 },
  backdrop: Object.assign({}, s.default.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.15)' }),
  menuContainer: Object.assign({
    position: 'absolute',
    top: 60,
    right: 20,
    width: 280,
    backgroundColor: '#FFF',
    borderRadius: 14
  }, (0, p.getShadowStyle)({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: .15,
    shadowRadius: 20,
    elevation: 10
  }), { overflow: 'hidden' }),
  section: { backgroundColor: '#FFF', paddingVertical: 4 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F2F2F7',
    borderTopWidth: s.default.hairlineWidth,
    borderBottomWidth: s.default.hairlineWidth,
    borderColor: '#C6C6C8'
  },
  sectionHeaderText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: s.default.hairlineWidth,
    borderBottomColor: '#EEE'
  },
  termTitle: { fontSize: 15, color: '#333', fontWeight: '600' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48
  },
  menuText: { fontSize: 17, color: '#000', flex: 1 },
  dividerFull: { height: 8, backgroundColor: '#F2F2F7' },
  divider: { height: s.default.hairlineWidth, backgroundColor: '#C6C6C8', marginHorizontal: 16 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4
  },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  guestInputRow: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 10,
    marginVertical: 2
  },
  guestInput: { flex: 1, fontSize: 15, color: '#000', paddingVertical: 4 },
  guestConfirmText: { color: '#007AFF', fontWeight: 'bold', fontSize: 15, paddingHorizontal: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF' },
  searchInput: { flex: 1, fontSize: 16, color: '#000' },
  selectedBadge: { backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  selectedBadgeText: { fontSize: 10, color: '#666', fontWeight: 'bold' }
});