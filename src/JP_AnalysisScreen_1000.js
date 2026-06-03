/**
 * Module ID: 1000
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const _r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 1000);
const _m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"AnalysisScreen",{enumerable:!0,get:function(){return j}});var t=require("./module_37"),n=e(t),o=e(require("./default_144")),l=e(require("./default_217")),a=e(require("./default_45")),r=e(require("./default_297")),s=e(require("./default_382")),i=e(require("./default_386")),d=e(require("./default_398"));require("./module_98");var c=require("./IS_WEB_199");require("./module_420");var u=require("./JP_useScoreStore_174"),h=require("./AntDesign_600"),f=require("./JP_CustomCalendarModal_695"),m=require("./module_592"),x=require("./default_1001"),b=e(x),y=require("./module_427"),{ArrowLocationView}=require("./ArrowLocationView");const j = () => {
  const {
    analysisSelectedTags: e = [],
    analysisTagLogic: a = "AND",
    tagTemplates: c = [],
    setAnalysisSelectedTags: m,
    toggleAnalysisTag: j,
    setAnalysisTagLogic: p,
    analysisRankingSettings: C = {},
    setAnalysisRankingSetting: S,
    activeRole: k,
    myMemberId: B,
    sessions: E = [],
    members: w = [],
    alumni: A = [],
    shotsPerRound: T = 8,
    showAlumniInAnalysis: v,
    setShowAlumniInAnalysis: setAlumni,
    isHydrated: z,
    arrowTargetType
  } = (0, u.useScoreStore)();

  const D = (0, u.useScoreStore)(e => e.myMemberName) || '';
  if (!z) return null;

  const gatherAllArrowLocations = (memberId, name, selectedLabel) => {
    const locations = [];
    me.forEach(session => {
      if (!session || !session.archers) return;

      // グラフのデータポイントが選択されている場合、セッションをフィルタリング
      if (selectedLabel) {
        const l = new Date(session.date);
        let sessionLabel = "";
        if (selectedLabel.endsWith('\u5e74\u5ea6')) { // "年度"
          sessionLabel = `${l.getMonth() + 1 >= 4 ? l.getFullYear() : l.getFullYear() - 1}\u5e74\u5ea6`;
        } else if (selectedLabel.includes('/') && selectedLabel.split('/').length === 2) {
          sessionLabel = `${l.getFullYear()}/${l.getMonth() + 1}`;
        } else {
          sessionLabel = `${l.getFullYear()}/${l.getMonth() + 1}/${l.getDate()}`;
        }
        if (sessionLabel !== selectedLabel) return;
      }

      session.archers.forEach(archer => {
        const substitutions = archer.substitutions || {};
        const subIdxs = Object.keys(substitutions).map(Number).sort((e, t) => e - t);
        const subIds = archer.substitutionIds || {};
        
        const archerLocations = archer.arrowLocations || [];
        archerLocations.forEach((loc, idx) => {
          if (!loc) return;
          let cId = archer.memberId;
          let cName = archer.name || '';
          for (const sIdx of subIdxs) {
            if (!(sIdx <= idx)) break;
            cId = subIds[sIdx] || void 0;
            cName = substitutions[sIdx];
          }
          if (memberId ? cId === memberId : cName === name) {
            const mark = archer.marks ? archer.marks[idx] : undefined;
            // 的中/外れのマークが登録されている射のみを対象とする
            if (mark === '○' || mark === '\u25cb' || mark === '×' || mark === '\xd7') {
              locations.push(Object.assign({}, loc, { mark: mark, shotIndex: idx }));
            }
          }
        });
      });
    });
    return locations;
  };

  const [R, I] = (0, t.useState)('\u3059\u3079\u3066');
  const [W, L] = (0, t.useState)('\u5168\u54e1');
  const [O, P] = (0, t.useState)('\u5168\u5b66\u5e74');
  const M = new Date();
  const N = M.getMonth() + 1 >= 4 ? M.getFullYear() : M.getFullYear() - 1;
  const [$, H] = (0, t.useState)(M.getFullYear());
  const [V, Y] = (0, t.useState)(M.getMonth() + 1);
  const [_, G] = (0, t.useState)(N);
  const [J, U] = (0, t.useState)('month');
  const [q, K] = (0, t.useState)(new Date(M.getFullYear(), M.getMonth(), 1));
  const [Q, X] = (0, t.useState)(new Date());
  const [Z, ee] = (0, t.useState)(!1);
  const [te, ne] = (0, t.useState)('start');
  const [oe, le] = (0, t.useState)('');
  const [ae, re] = (0, t.useState)(null);
  const [se, ie] = (0, t.useState)('');
  const [de, ce] = (0, t.useState)('');
  
  // 的の種類切り替え用ステート
  const [myTargetType, setMyTargetType] = (0, t.useState)(arrowTargetType || 'kasumi36');
  const [modalTargetType, setModalTargetType] = (0, t.useState)(arrowTargetType || 'kasumi36');

  // グラフタップ時の選択ラベルステート
  const [selectedTrendLabel, setSelectedTrendLabel] = (0, t.useState)(null);
  const [selectedModalTrendLabel, setSelectedModalTrendLabel] = (0, t.useState)(null);

  // 期間・集計単位・射手が変更されたらグラフの選択を解除する
  n.default.useEffect(() => {
    setSelectedTrendLabel(null);
  }, [R, J, W, O, B]);

  // モーダル対象が切り替わったら選択を解除する
  n.default.useEffect(() => {
    setSelectedModalTrendLabel(null);
  }, [ae]);

  // モーダル表示時に的の選択肢を現在のデフォルトに同期
  n.default.useEffect(() => {
    if (ae) {
      setModalTargetType(arrowTargetType || 'kasumi36');
    }
  }, [ae, arrowTargetType]);

  const ue = e => {
    ne(e);
    ee(!0);
  };

  n.default.useEffect(() => {
    ('\u6708\u3054\u3068' === R || '\u76f4\u8fd130\u65e5' === R) ? U('day') : ('\u5e74\u5ea6' === R && 'year' === J) && U('month');
  }, [R, J]);

  const he = e => {
    let t = V + e;
    let n = $;
    t > 12 && (t = 1, n += 1);
    t < 1 && (t = 12, n -= 1);
    Y(t);
    H(n);
  };

  const fe = e => {
    G(t => t + e);
  };

  // memberロール時は自分が参加しているセッションのタグのみを収集する
  const ge = n.default.useMemo(() => {
    const t = new Set();
    const src = 'member' === k && B
      ? E.filter(s => s && s.archers && (s.archers.some(a => a && (a.memberId === B || (a.substitutionIds && Object.values(a.substitutionIds).includes(B))))))
      : E;
    src.forEach(e => {
      e && e.tags && e.tags.forEach(e => t.add(e));
    });
    return Array.from(t).filter(Boolean).sort((t, n) => {
      const o = e.includes(t);
      const l = e.includes(n);
      return o && !l ? -1 : !o && l ? 1 : t.localeCompare(n);
    });
  }, [E, e, k, B]);

  const me = E.filter(t => {
    if (!t) return !1;
    if (!t.includeInStats) return !1;
    if (e.length > 0) {
      const n = t.tags || [];
      if ('AND' === a) {
        if (!e.every(e => n.includes(e))) return !1;
      } else if (!e.some(e => n.includes(e))) return !1;
    }
    const n = Date.now();
    const o = t.date;
    if ('\u76f4\u8fd130\u65e5' === R) return n - o <= 2592e6;
    if ('\u6708\u3054\u3068' === R) {
      const e = new Date(o);
      return e.getFullYear() === $ && e.getMonth() + 1 === V;
    }
    if ('\u5e74\u5ea6' === R) {
      const e = new Date(o);
      const t = e.getFullYear();
      return (e.getMonth() + 1 >= 4 ? t : t - 1) === _;
    }
    if ('\u671f\u9593\u6307\u5b9a' === R) {
      const e = new Date(o);
      e.setHours(0, 0, 0, 0);
      const t = new Date(q);
      t.setHours(0, 0, 0, 0);
      const n = new Date(Q);
      return n.setHours(23, 59, 59, 999), e >= t && e <= n;
    }
    return !0;
  });
  const xe = [...(w || []).filter(e => v || (e.grade || 0) < 5), ...((O === '\u5352\u696d\u751f' || v) && A || [])]
    .filter(e => !!e)
    .filter(e => k !== 'member' || !B || e.id === B)
    .map(e => {
      let t = 0;
      let n = 0;
      const o = Array.from({ length: T }, () => ({ shots: 0, hits: 0 }));
      const l = { kaichu: 0, sanchu: 0, hake: 0, icchu: 0, zannen: 0 };

      me.forEach(a => {
        if (!a || !a.archers) return;
        a.archers.forEach(a => {
          if (!a || !a.marks) return;
          const r = a.substitutions || {};
          const s = Object.keys(r).map(Number).sort((e, t) => e - t);
          const i = a.substitutionIds || {};

          a.marks.forEach((l, d) => {
            if ('\u25cb' !== l && '\xd7' !== l) return;
            let c = a.memberId;
            let u = a.name || '';
            for (const e of s) {
              if (!(e <= d)) break;
              c = i[e] || void 0;
              u = r[e];
            }
            if (c ? c === e.id : u === e.name) {
              t++;
              '\u25cb' === l && n++;
              const e = d % 4;
              if (o[e]) {
                o[e].shots++;
                '\u25cb' === l && o[e].hits++;
              }
            }
          });

          const d = Math.floor(a.marks.length / 4);
          for (let t = 0; t < d; t++) {
            let n = [];
            let o = !0;
            for (let l = 0; l < 4; l++) {
              const d = 4 * t + l;
              const c = a.marks[d];
              if ('\u25cb' !== c && '\xd7' !== c) {
                o = !1;
                break;
              }
              let u = a.memberId;
              let h = a.name || '';
              for (const e of s) {
                if (!(e <= d)) break;
                u = i[e] || void 0;
                h = r[e];
              }
              if (!(u ? u === e.id : h === e.name)) {
                o = !1;
                break;
              }
              n.push(c);
            }
            if (o && 4 === n.length) {
              const e = n.filter(e => '\u25cb' === e).length;
              if (4 === e) l.kaichu++;
              else if (3 === e) l.sanchu++;
              else if (2 === e) l.hake++;
              else if (1 === e) l.icchu++;
              else if (0 === e) l.zannen++;
            }
          }
        });
      });

      const rate = t > 0 ? n / t * 100 : 0;
      return Object.assign({}, e, { rate: rate, shots: t, hits: n, perShotStats: o, patterns: l });
    })
    .filter(e => {
      if (0 === e.shots) return !1;
      if (k === 'group') {
        if (W !== '\u5168\u54e1' && e.gender !== W) return !1;
        if (O !== '\u5168\u5b66\u5e74') {
          if (O === '\u5352\u696d\u751f') {
            if (!(5 === e.grade || e.graduationYear || e.isAlumni)) return !1;
          } else if (`${e.grade}\u5e74` !== O) return !1;
        }
      }
      return !(oe && !e.name.toLowerCase().includes(oe.toLowerCase()));
    })
    .sort((e, t) => Math.abs(t.rate - e.rate) > 0.01 ? t.rate - e.rate : t.shots - e.shots);
  const be = ('ratio' === C[R]?.type ? C[R]?.value : 0) ?? 0;
  const ye = Math.max(...xe.map(e => e.shots), 0);
  const je = Math.floor(ye * be);
  const Fe = xe.filter(e => e.shots >= je);
  const pe = xe.filter(e => e.shots < je);

  const Ce = (e => {
    let t = 1;
    return e.map((n, o) => {
      if (o > 0) {
        const l = e[o - 1];
        if (!(Math.abs(n.rate - l.rate) < 0.01 && n.shots === l.shots)) {
          t = o + 1;
        }
      }
      return Object.assign({}, n, { displayRank: t });
    });
  })(Fe);

  const Se = n.default.useCallback((e, t) => {
    if (!e && !t) return [];
    const n = {};
    me.forEach(o => {
      const l = new Date(o.date);
      let a = '';
      if ('day' === J) {
        a = `${l.getFullYear()}/${l.getMonth() + 1}/${l.getDate()}`;
      } else if ('month' === J) {
        a = `${l.getFullYear()}/${l.getMonth() + 1}`;
      } else {
        a = `${l.getMonth() + 1 >= 4 ? l.getFullYear() : l.getFullYear() - 1}\u5e74\u5ea6`;
      }

      if (!n[a]) {
        n[a] = {
          hits: 0,
          shots: 0,
          patterns: { kaichu: 0, sanchu: 0, hake: 0, icchu: 0, zannen: 0 },
          date: o.date,
          details: []
        };
      }

      const r = o.archers.find(n => (e && n.memberId === e) || (t && n.name === t));
      if (!r || !r.marks) return;

      let s = 0;
      let i = 0;
      const d = Object.keys(r.substitutions || {}).map(Number).sort((e, t) => e - t);

      r.marks.forEach((o, l) => {
        if ('\u25cb' !== o && '\xd7' !== o) return;
        let c = r.memberId;
        let u = r.name;
        for (const e of d) {
          if (!(e <= l)) break;
          c = r.substitutionIds && r.substitutionIds[e] || void 0;
          u = r.substitutions[e];
        }
        if ((e && c === e) || (t && u === t)) {
          n[a].shots++;
          i++;
          if ('\u25cb' === o) {
            n[a].hits++;
            s++;
          }
        }
      });

      if (i > 0) {
        n[a].details.push({
          date: l.toLocaleDateString('ja-JP'),
          title: o.title || '\u7121\u984c\u306e\u7df4\u7fd2',
          stats: `${s}/${i} (${(s / i * 100).toFixed(0)}%)`
        });
      }

      const c = Math.floor(r.marks.length / 4);
      for (let o = 0; o < c; o++) {
        let l = 0;
        let s = !0;
        for (let n = 0; n < 4; n++) {
          const a = 4 * o + n;
          const i = r.marks[a];
          if ('\u25cb' !== i && '\xd7' !== i) {
            s = !1;
            break;
          }
          let c = r.memberId;
          let u = r.name;
          for (const e of d) {
            if (!(e <= a)) break;
            c = r.substitutionIds && r.substitutionIds[e] || void 0;
            u = r.substitutions[e];
          }
          if (!((e && c === e) || (t && u === t))) {
            s = !1;
            break;
          }
          if ('\u25cb' === i) l++;
        }
        if (s) {
          if (4 === l) n[a].patterns.kaichu++;
          else if (3 === l) n[a].patterns.sanchu++;
          else if (2 === l) n[a].patterns.hake++;
          else if (1 === l) n[a].patterns.icchu++;
          else n[a].patterns.zannen++;
        }
      }
    });

    return Object.entries(n).map(([e, t]) => Object.assign({ label: e }, t, {
      rate: t.shots > 0 ? t.hits / t.shots * 100 : 0
    })).filter(e => e.shots > 0).sort((e, t) => e.date - t.date);
  }, [me, J]);

  const ke = n.default.useMemo(() => 'member' === k && B ? Se(B, D) : [], [k, B, D, Se]);
  const Be = n.default.useMemo(() => ae ? Se(ae.id, ae.name) : [], [ae, Se]);

  const Ee = ({ data: e, selectedLabel, onSelectLabel }) => {
    const a = selectedLabel ? e.findIndex(item => item.label === selectedLabel) : null;
    const i = (index) => {
      if (null === index) {
        if (onSelectLabel) onSelectLabel(null);
      } else {
        const item = e[index];
        if (onSelectLabel && item) onSelectLabel(item.label);
      }
    };

    if (0 === e.length) {
      return (0, y.jsx)(o.default, {
        style: F.noDataGraph,
        children: (0, y.jsx)(l.default, {
          style: { color: '#8E8E93' },
          children: "\u30c7\u30fc\u30bf\u304c\u8db3\u308a\u307e\u305b\u3093"
        })
      });
    }

    const d = 150;
    const c = 20;
    const u = 110;
    const f = e.map((t, n) => ({
      x: c + n / (e.length > 1 ? e.length - 1 : 1) * 260,
      y: d - (c + t.rate / 100 * u)
    }));

    let m = "";
    f.forEach((e, t) => {
      m += 0 === t ? `M ${e.x} ${e.y}` : ` L ${e.x} ${e.y}`;
    });

    return (0, y.jsxs)(o.default, {
      style: F.graphContainer,
      children: [
        (0, y.jsxs)(o.default, {
          style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
          children: [
            (0, y.jsx)(l.default, { style: F.graphTitle, children: "\u7684\u4e2d\u7387\u63a8\u79fb (%)" }),
            !('\u6708\u3054\u3068' === R || '\u76f4\u8fd130\u65e5' === R) && (0, y.jsx)(o.default, {
              style: F.trendUnitSelector,
              children: ['day', 'month', 'year'].filter(e => '\u5e74\u5ea6' !== R || 'year' !== e).map(e => (0, y.jsx)(s.default, {
                onPress: () => { U(e); i(null); },
                style: [F.unitBtn, J === e && F.unitBtnActive],
                children: (0, y.jsx)(l.default, {
                  style: [F.unitBtnText, J === e && F.unitBtnTextActive],
                  children: 'day' === e ? '\u65e5' : 'month' === e ? '\u6708' : '\u5e74\u5ea6'
                })
              }, `unit-${e}`))
            })
          ]
        }),
        (0, y.jsxs)(b.default, {
          width: "100%",
          height: d,
          viewBox: "0 0 300 150",
          children: [
            [0, 25, 50, 75, 100].map(e => (0, y.jsxs)(n.default.Fragment, {
              children: [
                (0, y.jsx)(x.Line, { x1: c, y1: d - (c + e / 100 * u), x2: 280, y2: d - (c + e / 100 * u), stroke: "#E5E5EA", strokeWidth: "1" }),
                (0, y.jsx)(x.Text, { x: 15, y: d - (c + e / 100 * u) + 4, fontSize: "8", fill: "#8E8E93", textAnchor: "end", children: e })
              ]
            }, `grid-${e}`)),
            (0, y.jsx)(x.Path, { d: m, fill: "none", stroke: "#007AFF", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round" }),
            f.map((e, t) => (0, y.jsx)(x.Circle, { cx: e.x, cy: e.y, r: a === t ? "6" : "4", fill: a === t ? "#FF9500" : "#007AFF", onPress: () => i(t) }, `point-${t}`))
          ]
        }),
        null !== a && e[a] && (0, y.jsxs)(o.default, {
          style: F.pointDetailCard,
          children: [
            (0, y.jsxs)(o.default, {
              style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
              children: [
                (0, y.jsxs)(l.default, { style: F.detailLabel, children: [e[a].label, " \u306e\u8a73\u7d30"] }),
                (0, y.jsx)(s.default, { onPress: () => i(null), children: (0, y.jsx)(h.Ionicons, { name: "close-circle", size: 20, color: "#C7C7CC" }) })
              ]
            }),
            (0, y.jsx)(r.default, {
              style: { maxHeight: 120 },
              showsVerticalScrollIndicator: !0,
              children: e[a].details.map((t, n) => (0, y.jsxs)(o.default, {
                style: [F.detailRow, n < e[a].details.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 6, marginBottom: 6 }],
                children: [
                  (0, y.jsxs)(l.default, { style: F.detailText, children: [t.date, " ", t.title] }),
                  (0, y.jsx)(l.default, { style: F.detailStats, children: t.stats })
                ]
              }, `detail-${n}-${t.date}`))
            })
          ]
        })
      ]
    });
  };
  const we = ({ options: e, selected: t, onSelect: n, label: a = "", isWrap: r = !1 }) => (0, y.jsxs)(o.default, {
    style: [F.segmentWrapper, r && { flexDirection: 'column', alignItems: 'stretch', width: '100%' }],
    children: [
      a ? (0, y.jsx)(l.default, { style: F.segmentLabel, children: a }) : null,
      (0, y.jsx)(o.default, {
        style: [F.segmentContainer, r && { width: '100%', flexDirection: 'row', justifyContent: 'space-between' }],
        children: e.map(e => {
          const o = 'string' == typeof e ? e : e.label;
          const a = 'string' == typeof e ? e : e.value;
          const r = t === a;
          return (0, y.jsx)(s.default, {
            style: [F.segmentButton, r && F.segmentButtonActive],
            onPress: () => n(a),
            children: (0, y.jsx)(l.default, {
              style: [F.segmentText, r && F.segmentTextActive],
              numberOfLines: 1,
              children: o
            })
          }, a);
        })
      })
    ]
  });

  const Ae = o.default;

  return (0, y.jsxs)(Ae, Object.assign({ style: F.safeArea }, !1, {
    children: [
      (0, y.jsx)(o.default, {
        style: F.header,
        children: (0, y.jsx)(l.default, { style: F.title, children: "\u7684\u4e2d\u5206\u6790" })
      }),
      (0, y.jsxs)(r.default, {
        contentContainerStyle: F.content,
        children: [
          (0, y.jsxs)(o.default, {
            style: F.filtersCard,
            children: [
              (0, y.jsxs)(o.default, {
                style: { marginBottom: 16 },
                children: [
                  (0, y.jsxs)(o.default, {
                    style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
                    children: [
                      (0, y.jsx)(l.default, { style: [F.segmentLabel, { width: 'auto', marginRight: 0 }], children: "\u30bf\u30b0\u30d5\u30a3\u30eb\u30bf\u30fc" }),
                      (0, y.jsxs)(o.default, {
                        style: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2 },
                        children: [
                          (0, y.jsx)(s.default, {
                            onPress: () => p('AND'),
                            style: [{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }, 'AND' === a && { backgroundColor: '#FFF' }],
                            children: (0, y.jsx)(l.default, { style: { fontSize: 11, fontWeight: 'bold', color: 'AND' === a ? '#007AFF' : '#8E8E93' }, children: "\u3059\u3079\u3066\u542b\u3080" })
                          }),
                          (0, y.jsx)(s.default, {
                            onPress: () => p('OR'),
                            style: [{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }, 'OR' === a && { backgroundColor: '#FFF' }],
                            children: (0, y.jsx)(l.default, { style: { fontSize: 11, fontWeight: 'bold', color: 'OR' === a ? '#007AFF' : '#8E8E93' }, children: "\u3044\u305a\u308c\u304b\u542b\u3080" })
                          })
                        ]
                      })
                    ]
                  }),
                  (0, y.jsxs)(r.default, {
                    horizontal: !0,
                    showsHorizontalScrollIndicator: !1,
                    style: { flexDirection: 'row', marginBottom: 8 },
                    contentContainerStyle: { gap: 8, paddingVertical: 4 },
                    children: [
                      (0, y.jsx)(s.default, {
                        style: [F.tagChip, 0 === e.length && F.tagChipActive, { backgroundColor: 0 === e.length ? '#007AFF' : '#E5E5EA' }],
                        onPress: () => m([]),
                        children: (0, y.jsx)(l.default, { style: [F.tagChipText, 0 === e.length && { color: '#FFF' }], children: "\u3059\u3079\u3066\u89e3\u9664" })
                      }),
                      ge.map(t => {
                        const n = e.includes(t);
                        return (0, y.jsx)(s.default, {
                          style: [F.tagChip, n && F.tagChipActive, { backgroundColor: n ? '#007AFF' : '#F2F2F7' }],
                          onPress: () => j(t),
                          children: (0, y.jsx)(l.default, { style: [F.tagChipText, n && { color: '#FFF' }], children: t.replace(/^#/, '') })
                        }, `tag-${t}`);
                      })
                    ]
                  })
                ]
              }),
              (0, y.jsx)(o.default, {
                style: { marginBottom: 12 },
                children: (0, y.jsx)(we, {
                  options: ['\u6708\u3054\u3068', '\u5e74\u5ea6', '\u671f\u9593\u6307\u5b9a', '\u76f4\u8fd130\u65e5', '\u3059\u3079\u3066'],
                  selected: R,
                  onSelect: I,
                  isWrap: !0
                })
              }),
              '\u671f\u9593\u6307\u5b9a' === R && (0, y.jsxs)(o.default, {
                style: F.customRangeContainer,
                children: [
                  (0, y.jsx)(s.default, { style: F.dateBtn, onPress: () => ue('start'), children: (0, y.jsxs)(l.default, { style: F.dateLabel, children: ["\u958b\u59cb: ", q.toLocaleDateString('ja-JP')] }) }),
                  (0, y.jsx)(h.Ionicons, { name: "arrow-forward", size: 16, color: "#8E8E93" }),
                  (0, y.jsx)(s.default, { style: F.dateBtn, onPress: () => ue('end'), children: (0, y.jsxs)(l.default, { style: F.dateLabel, children: ["\u7d42\u4e86: ", Q.toLocaleDateString('ja-JP')] }) })
                ]
              }),
              '\u6708\u3054\u3068' === R && (0, y.jsxs)(o.default, {
                style: F.monthNav,
                children: [
                  (0, y.jsx)(s.default, { style: F.monthNavBtn, onPress: () => he(-1), children: (0, y.jsx)(h.Ionicons, { name: "chevron-back", size: 20, color: "#007AFF" }) }),
                  (0, y.jsxs)(l.default, { style: F.monthNavText, children: [V >= 4 ? `${$}\u5e74\u5ea6` : $ - 1 + "\u5e74\u5ea6", " ", V, "\u6708"] }),
                  (0, y.jsx)(s.default, { style: F.monthNavBtn, onPress: () => he(1), children: (0, y.jsx)(h.Ionicons, { name: "chevron-forward", size: 20, color: "#007AFF" }) })
                ]
              }),
              '\u5e74\u5ea6' === R && (0, y.jsxs)(o.default, {
                style: F.monthNav,
                children: [
                  (0, y.jsx)(s.default, { style: F.monthNavBtn, onPress: () => fe(-1), children: (0, y.jsx)(h.Ionicons, { name: "chevron-back", size: 20, color: "#007AFF" }) }),
                  (0, y.jsxs)(l.default, { style: F.monthNavText, children: [_ , "\u5e74\u5ea6"] }),
                  (0, y.jsx)(s.default, { style: F.monthNavBtn, onPress: () => fe(1), children: (0, y.jsx)(h.Ionicons, { name: "chevron-forward", size: 20, color: "#007AFF" }) })
                ]
              }),
              'member' !== k && (0, y.jsxs)(o.default, {
                style: F.rankingSettingsContainer,
                children: [
                  (0, y.jsx)(l.default, { style: F.rankingSettingsLabel, children: "\u30e9\u30f3\u30ad\u30f3\u30b0\u5bfe\u8c61\u306e\u57fa\u6e96 (\u6700\u591a\u6bd4)" }),
                  (0, y.jsx)(o.default, {
                    style: F.ratioButtonRow,
                    children: [{ label: '1/2 (50%)', val: .5 }, { label: '1/3 (33%)', val: .33 }, { label: '1/4 (25%)', val: .25 }].map(e => (0, y.jsx)(s.default, {
                      onPress: () => { const t = Math.abs(be - e.val) < .01 ? 0 : e.val; S(R, { type: 'ratio', value: t }); },
                      style: [F.ratioBtn, Math.abs(be - e.val) < .01 && F.ratioBtnActive],
                      children: (0, y.jsx)(l.default, { style: [F.ratioBtnText, Math.abs(be - e.val) < .01 && F.ratioBtnTextActive], children: e.label })
                    }, `ratio-${e.val}`))
                  }),
                  ye > 0 && (0, y.jsx)(l.default, { style: F.ratioHintText, children: je > 0 ? `\u73fe\u5728\u3001${je}\u5c04\u4ee5\u4e0a\u304c\u30e9\u30f3\u30ad\u30f3\u30b0\u5bfe\u8c61\u3067\u3059\uff08\u6700\u591a: ${ye}\u5c04\uff09` : '\u5168\u30e1\u30f3\u30d0\u30fc\u304c\u30e9\u30f3\u30ad\u30f3\u30b0\u5bfe\u8c61\u3067\u3059' })
                ]
              }),
              'member' !== k && (0, y.jsxs)(y.Fragment, {
                children: [
                  (0, y.jsx)(o.default, { style: F.filterDivider }),
                  (0, y.jsx)(we, { label: "\u6027\u5225:", options: ['\u5168\u54e1', '\u7537\u5b50', '\u5973\u5b50'], selected: W, onSelect: L }),
                  (0, y.jsx)(o.default, { style: F.filterDivider }),
                  (0, y.jsx)(we, { label: "\u5b66\u5e74:", options: ['\u5168\u5b66\u5e74', '1\u5e74', '2\u5e74', '3\u5e74', '4\u5e74'], selected: O, onSelect: P }),
                  (0, y.jsx)(o.default, { style: F.filterDivider }),
                  (0, y.jsxs)(o.default, {
                    style: F.toggleRow,
                    children: [
                      (0, y.jsx)(l.default, { style: F.toggleLabel, children: "\u5352\u696d\u751f\u3092\u8868\u793a" }),
                      (0, y.jsx)(s.default, { style: [F.miniBtn, v && F.miniBtnActive], onPress: () => setAlumni(!v), children: (0, y.jsx)(l.default, { style: [F.miniBtnText, v && F.miniBtnTextActive], children: v ? 'ON' : 'OFF' }) })
                    ]
                  })
                ]
              })
            ]
          }),
          'member' === k && Ce[0] && (0, y.jsxs)(o.default, {
            style: F.memberDashboard,
            children: [
              (0, y.jsxs)(o.default, {
                style: F.dashboardHeader,
                children: [
                  (0, y.jsx)(l.default, { style: F.dashboardTitle, children: "\u30de\u30a4\u30fb\u30d1\u30d5\u30a9\u30fc\u30de\u30f3\u30b9\u7d71\u8a08" }),
                  (0, y.jsx)(l.default, { style: F.dashboardPeriod, children: R })
                ]
              }),
              (0, y.jsxs)(o.default, {
                style: F.mainStatsRow,
                children: [
                  (0, y.jsxs)(o.default, {
                    style: F.mainStatItem,
                    children: [
                      (0, y.jsx)(l.default, { style: F.mainStatLabel, children: "\u7684\u4e2d\u7387" }),
                      (0, y.jsxs)(l.default, { style: F.mainStatValue, children: [Ce[0].rate.toFixed(1), (0, y.jsx)(l.default, { style: { fontSize: 16 }, children: "%" })] })
                    ]
                  }),
                  (0, y.jsxs)(o.default, {
                    style: F.mainStatItem,
                    children: [
                      (0, y.jsx)(l.default, { style: F.mainStatLabel, children: "\u7684\u4e2d/\u5c04\u6570" }),
                      (0, y.jsxs)(l.default, { style: F.mainStatValue, children: [Ce[0].hits, (0, y.jsxs)(l.default, { style: { fontSize: 16, color: '#8E8E93' }, children: [" / ", Ce[0].shots] })] })
                    ]
                  })
                ]
              }),
              (0, y.jsx)(Ee, { data: ke, selectedLabel: selectedTrendLabel, onSelectLabel: setSelectedTrendLabel }),
              (0, y.jsxs)(o.default, {
                style: { marginTop: 20, alignItems: 'center' },
                children: [
                  (0, y.jsx)(l.default, { style: [F.sectionSubTitle, { alignSelf: 'flex-start' }], children: selectedTrendLabel ? `\u77e2\u6240\u306e\u50be\u5411 (${selectedTrendLabel})` : "\u77e2\u6240\u306e\u50be\u5411 (\u96c6\u8a08)" }),
                  (0, y.jsx)(o.default, {
                    style: { width: '100%', marginBottom: 12 },
                    children: (0, y.jsx)(we, {
                      options: [
                        { label: '霞的(尺二寸)', value: 'kasumi36' },
                        { label: '星的(尺二寸)', value: 'hoshi36' },
                        { label: '星的(八寸)', value: 'hoshi24' }
                      ],
                      selected: myTargetType,
                      onSelect: setMyTargetType,
                      isWrap: !0
                    })
                  }),
                  (0, y.jsx)(ArrowLocationView, { arrowLocations: gatherAllArrowLocations(B, D, selectedTrendLabel), size: 200, targetType: myTargetType, hideNumbers: !0 })
                ]
              }),
              (0, y.jsxs)(o.default, {
                style: { marginTop: 20 },
                children: [
                  (0, y.jsx)(l.default, { style: F.sectionSubTitle, children: "\u7acb\u3061\u9806\u5225\u306e\u7684\u4e2d\u7387 (1-4\u5c04\u76ee)" }),
                  (0, y.jsx)(o.default, {
                    style: F.statsGrid,
                    children: Array.from({ length: 4 }).map((e, t) => {
                      const n = Ce[0].perShotStats[t] || { shots: 0, hits: 0 };
                      const a = n.shots > 0 ? n.hits / n.shots * 100 : 0;
                      return (0, y.jsxs)(o.default, {
                        style: F.statBox,
                        children: [
                          (0, y.jsxs)(l.default, { style: F.statBoxTitle, children: [t + 1, "\u5c04\u76ee"] }),
                          (0, y.jsxs)(l.default, { style: F.statBoxRateDash, children: [a.toFixed(0), (0, y.jsx)(l.default, { style: { fontSize: 10 }, children: "%" })] }),
                          (0, y.jsxs)(l.default, { style: F.statBoxCounts, children: [n.hits, "/", n.shots] })
                        ]
                      }, `per-shot-${t}`);
                    })
                  })
                ]
              }),
              (0, y.jsxs)(o.default, {
                style: { marginTop: 24 },
                children: [
                  (0, y.jsx)(l.default, { style: F.sectionSubTitle, children: "\u7acb\u306e\u7d50\u679c\u5206\u5e03 (4\u5c04\u5358\u4f4d)" }),
                  (0, y.jsx)(o.default, {
                    style: F.patternsCardDash,
                    children: [{ label: '\u7686\u4e2d', key: 'kaichu', color: '#FF9500' }, { label: '\u4e09\u4e2d', key: 'sanchu', color: '#34C759' }, { label: '\u7fbd\u5206', key: 'hake', color: '#007AFF' }, { label: '\u4e00\u4e2d', key: 'icchu', color: '#5856D6' }, { label: '\u6b8b\u5ff5', key: 'zannen', color: '#FF3B30' }].map(e => {
                      const t = Ce[0].patterns[e.key] || 0;
                      const n = Object.values(Ce[0].patterns).reduce((e, t) => e + t, 0);
                      const a = n > 0 ? t / n * 100 : 0;
                      return (0, y.jsxs)(o.default, {
                        style: F.patternLine,
                        children: [
                          (0, y.jsx)(o.default, { style: { width: 45 }, children: (0, y.jsx)(l.default, { style: F.patternLabelText, children: e.label }) }),
                          (0, y.jsx)(o.default, { style: { flex: 1 }, children: (0, y.jsx)(o.default, { style: F.barContainer, children: (0, y.jsx)(o.default, { style: [F.barFill, { width: `${Math.max(a, t > 0 ? 3 : 0)}%`, backgroundColor: e.color }] }) }) }),
                          (0, y.jsx)(o.default, { style: { width: 50, alignItems: 'flex-end' }, children: (0, y.jsxs)(l.default, { style: F.patternValueText, children: [t, "\u56de"] }) })
                        ]
                      }, e.key);
                    })
                  })
                ]
              })
            ]
          }),
          'member' !== k && (0, y.jsx)(o.default, {
            style: F.searchBarContainer,
            children: (0, y.jsxs)(o.default, {
              style: F.searchBar,
              children: [
                (0, y.jsx)(h.Ionicons, { name: "search", size: 18, color: "#007AFF", style: F.searchIcon }),
                (0, y.jsx)(d.default, { style: F.searchInput, placeholder: "\u30e1\u30f3\u30d0\u30fc\u540d\u3092\u691c\u7d22...", placeholderTextColor: "#8E8E93", value: oe, onChangeText: le }),
                !!oe && (0, y.jsx)(s.default, { onPress: () => le(''), style: { padding: 4 }, children: (0, y.jsx)(h.Ionicons, { name: "close-circle", size: 18, color: "#C7C7CC" }) })
              ]
            })
          }),
          'member' !== k && (0, y.jsxs)(o.default, {
            style: F.listContainer,
            children: [
              Ce.map(e => (0, y.jsxs)(s.default, {
                style: F.rowCard,
                onPress: () => re(e),
                children: [
                  (0, y.jsxs)(o.default, {
                    style: F.rowLeft,
                    children: [
                      (0, y.jsx)(o.default, { style: F.rankBadge, children: (0, y.jsx)(l.default, { style: F.rankText, children: 'member' === k ? '-' : e.displayRank }) }),
                      (0, y.jsxs)(o.default, {
                        style: F.nameContainer,
                        children: [
                          (0, y.jsx)(l.default, { style: [F.memberName, { color: '#000' }], children: e.name }),
                          (0, y.jsxs)(l.default, { style: F.memberSub, children: ['group' === k && (e.termKi ? `${e.termKi}\u671f / ` : ''), 'group' === k && (e.grade === 5 || e.graduationYear ? '\u5352\u696d\u751f' : e.grade === 0 ? '\u305d\u306e\u4ed6' : `${e.grade}\u5e74`), " / ", 'group' === k && `${e.gender}`] })
                        ]
                      })
                    ]
                  }),
                  (0, y.jsxs)(o.default, {
                    style: F.rowRight,
                    children: [
                      (0, y.jsxs)(l.default, { style: [F.rateText, { color: e.rate >= 50 ? '#D32F2F' : '#000' }], children: [e.rate.toFixed(1), "%"] }),
                      (0, y.jsxs)(l.default, { style: F.shotScoreText, children: [e.hits, "/", e.shots] })
                    ]
                  })
                ]
              }, typeof e.id === 'string' ? e.id : `member-${e.name}`)),
              pe.length > 0 && (0, y.jsxs)(o.default, {
                style: { marginTop: 24 },
                children: [
                  (0, y.jsxs)(o.default, {
                    style: { padding: 10, backgroundColor: '#F2F2F7', borderRadius: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
                    children: [
                      (0, y.jsx)(h.Ionicons, { name: "information-circle-outline", size: 14, color: "#8E8E93", style: { marginRight: 6 } }),
                      (0, y.jsxs)(l.default, { style: { fontSize: 11, color: '#8E8E93', fontWeight: 'bold' }, children: ["\u30e9\u30f3\u30ad\u30f3\u30b0\u9078\u5916 (", je, "\u5c04\u672a\u6e80)"] })
                    ]
                  }),
                  pe.map(e => (0, y.jsxs)(s.default, {
                    style: [F.rowCard, { opacity: .6 }],
                    onPress: () => re(e),
                    children: [
                      (0, y.jsx)(o.default, {
                        style: F.rowLeft,
                        children: (0, y.jsxs)(o.default, {
                          style: F.nameContainer,
                          children: [
                            (0, y.jsx)(l.default, { style: [F.memberName, { color: '#000' }], children: e.name }),
                            (0, y.jsxs)(l.default, { style: F.memberSub, children: ['group' === k && (e.termKi ? `${e.termKi}\u671f / ` : ''), 'group' === k && (e.grade === 5 || e.graduationYear ? '\u5352\u696d\u751f' : e.grade === 0 ? '\u305d\u306e\u4ed6' : `${e.grade}\u5e74`), " / ", 'group' === k && `${e.gender}`] })
                          ]
                        })
                      }),
                      (0, y.jsxs)(o.default, {
                        style: F.rowRight,
                        children: [
                          (0, y.jsxs)(l.default, { style: F.rateText, children: [e.rate.toFixed(1), "%"] }),
                          (0, y.jsxs)(l.default, { style: F.shotScoreText, children: [e.hits, "/", e.shots] })
                        ]
                      })
                    ]
                  }, typeof e.id === 'string' ? e.id : `low-member-${e.name}`))
                ]
              }),
              0 === Fe.length && (0, y.jsx)(l.default, { style: F.noDataText, children: "\u6761\u4ef6\u306b\u4e00\u81f4\u3059\u308b\u30e1\u30f3\u30d0\u30fc\u304c\u3044\u307e\u305b\u3093" })
            ]
          })
        ]
      }),
      (0, y.jsx)(f.CustomCalendarModal, {
        visible: Z,
        onClose: () => ee(!1),
        selectedDate: 'start' === te ? q : Q,
        onSelectDate: e => { 'start' === te ? K(e) : X(e), ee(!1); },
        title: 'start' === te ? '\u958b\u59cb\u65e5\u3092\u9078\u629e' : '\u7d42\u4e86\u65e5\u3092\u9078\u629e'
      }),
      (0, y.jsx)(i.default, {
        visible: !!ae,
        transparent: !0,
        animationType: "fade",
        children: (0, y.jsx)(o.default, {
          style: F.modalOverlay,
          children: (0, y.jsx)(o.default, {
            style: [F.modalContent, { maxHeight: '85%' }],
            children: ae && (0, y.jsxs)(r.default, {
              showsVerticalScrollIndicator: !1,
              children: [
                (0, y.jsxs)(l.default, { style: F.modalTitle, children: [ae.name, "\u306e\u5206\u6790\u8a73\u7d30"] }),
                (0, y.jsxs)(l.default, { style: F.modalDesc, children: [R, "\u306e\u6210\u7e3e (", ae.hits, "/", ae.shots, ") ", ae.rate.toFixed(1), "%"] }),
                 (0, y.jsx)(o.default, { style: { marginBottom: 20 }, children: (0, y.jsx)(Ee, { data: Be, selectedLabel: selectedModalTrendLabel, onSelectLabel: setSelectedModalTrendLabel }) }),
                 (0, y.jsxs)(o.default, {
                   style: { marginBottom: 20, alignItems: 'center' },
                   children: [
                     (0, y.jsx)(l.default, { style: [{ fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 8, alignSelf: 'flex-start' }], children: selectedModalTrendLabel ? `\u77e2\u6240\u306e\u50be\u5411 (${selectedModalTrendLabel})` : "\u77e2\u6240\u306e\u50be\u5411 (\u96c6\u8a08)" }),
                     (0, y.jsx)(o.default, {
                       style: { width: '100%', marginBottom: 12 },
                       children: (0, y.jsx)(we, {
                         options: [
                           { label: '霞的(尺二寸)', value: 'kasumi36' },
                           { label: '星的(尺二寸)', value: 'hoshi36' },
                           { label: '星的(八寸)', value: 'hoshi24' }
                         ],
                         selected: modalTargetType,
                         onSelect: setModalTargetType,
                         isWrap: !0
                       })
                     }),
                     (0, y.jsx)(ArrowLocationView, { arrowLocations: gatherAllArrowLocations(ae.id, ae.name, selectedModalTrendLabel), size: 200, targetType: modalTargetType, hideNumbers: !0 })
                   ]
                 }),
                 (0, y.jsxs)(o.default, {
                   style: { marginBottom: 16 },
                   children: [
                     (0, y.jsx)(l.default, { style: { fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 8 }, children: "\u7acb\u3061\u9806\u5225\u306e\u7684\u4e2d\u7387 (1-4\u5c04\u76ee)" }),
                    (0, y.jsx)(o.default, {
                      style: F.statsGrid,
                      children: Array.from({ length: 4 }).map((e, t) => {
                        const n = ae.perShotStats[t] || { shots: 0, hits: 0 };
                        const a = n.shots > 0 ? n.hits / n.shots * 100 : 0;
                        return (0, y.jsxs)(o.default, {
                          style: F.statBox,
                          children: [
                            (0, y.jsxs)(l.default, { style: F.statBoxTitle, children: [t + 1, "\u5c04\u76ee"] }),
                            (0, y.jsxs)(l.default, { style: F.statBoxRate, children: [a.toFixed(0), "%"] }),
                            (0, y.jsxs)(l.default, { style: F.statBoxCounts, children: [n.hits, "/", n.shots] })
                          ]
                        }, `per-shot-modal-${t}`);
                      })
                    })
                  ]
                }),
                (0, y.jsxs)(o.default, {
                  style: { marginBottom: 24 },
                  children: [
                    (0, y.jsx)(l.default, { style: { fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 12 }, children: "\u7acb\u306e\u7d50\u679c\u5206\u5e03 (4\u5c04\u5358\u4f4d)" }),
                    (0, y.jsx)(o.default, {
                      style: F.patternsCard,
                      children: [{ label: '皆中', key: 'kaichu', color: '#FF9500' }, { label: '三中', key: 'sanchu', color: '#34C759' }, { label: '羽分', key: 'hake', color: '#007AFF' }, { label: '一中', key: 'icchu', color: '#5856D6' }, { label: '残念', key: 'zannen', color: '#FF3B30' }].map(e => {
                        const t = ae.patterns[e.key] || 0;
                        const n = Object.values(ae.patterns).reduce((e, t) => e + t, 0);
                        const a = n > 0 ? t / n * 100 : 0;
                        return (0, y.jsxs)(o.default, {
                          style: F.patternLine,
                          children: [
                            (0, y.jsx)(o.default, { style: { width: 45 }, children: (0, y.jsx)(l.default, { style: F.patternLabelText, children: e.label }) }),
                            (0, y.jsx)(o.default, { style: { flex: 1 }, children: (0, y.jsx)(o.default, { style: F.barContainer, children: (0, y.jsx)(o.default, { style: [F.barFill, { width: `${Math.max(a, t > 0 ? 3 : 0)}%`, backgroundColor: e.color }] }) }) }),
                            (0, y.jsx)(o.default, { style: { width: 50, alignItems: 'flex-end' }, children: (0, y.jsxs)(l.default, { style: F.patternValueText, children: [t, "\u56de"] }) })
                          ]
                        }, e.key);
                      })
                    })
                  ]
                }),
                (0, y.jsx)(s.default, { style: F.closeBtn, onPress: () => re(null), children: (0, y.jsx)(l.default, { style: F.closeBtnText, children: "\u9589\u3058\u308b" }) })
              ]
            })
          })
        })
      })
    ]
  }));
}

const F = a.default.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 20, paddingTop: c.SAFE_TOP_PADDING + 10, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E' },
  content: { padding: 16 },
  filtersCard: Object.assign({ backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 }, (0, m.getShadowStyle)({ shadowOpacity: .05, shadowRadius: 10, elevation: 3 })),
  segmentLabel: { fontSize: 13, fontWeight: 'bold', color: '#8E8E93', marginBottom: 10, width: 60 },
  segmentWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  segmentContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 3, height: 52 },
  segmentButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  segmentButtonActive: Object.assign({ backgroundColor: '#FFF' }, (0, m.getShadowStyle)({ shadowOpacity: .1, shadowRadius: 2, elevation: 2 })),
  segmentText: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold' },
  segmentTextActive: { color: '#007AFF' },
  customRangeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 10, marginBottom: 16 },
  dateBtn: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 13, color: '#1C1C1E', fontWeight: '600' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 8, marginBottom: 16 },
  monthNavBtn: { padding: 4 },
  monthNavText: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', marginHorizontal: 20 },
  rankingSettingsContainer: { marginTop: 8, padding: 12, backgroundColor: '#F9F9FB', borderRadius: 12 },
  rankingSettingsLabel: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginBottom: 8 },
  ratioButtonRow: { flexDirection: 'row', gap: 8 },
  ratioBtn: { flex: 1, paddingVertical: 6, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center' },
  ratioBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  ratioBtnText: { fontSize: 11, color: '#8E8E93', fontWeight: 'bold' },
  ratioBtnTextActive: { color: '#FFF' },
  ratioHintText: { fontSize: 10, color: '#8E8E93', marginTop: 8, textAlign: 'center' },
  filterDivider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 4 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel: { fontSize: 13, color: '#1C1C1E', fontWeight: '600' },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: '#E5E5EA' },
  miniBtnActive: { backgroundColor: '#34C759' },
  miniBtnText: { fontSize: 11, fontWeight: 'bold', color: '#8E8E93' },
  miniBtnTextActive: { color: '#FFF' },
  memberDashboard: Object.assign({ backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16 }, (0, m.getShadowStyle)({ shadowOpacity: .1, shadowRadius: 15, elevation: 5 })),
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  dashboardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  dashboardPeriod: { fontSize: 12, color: '#8E8E93' },
  mainStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  mainStatItem: { flex: 1, backgroundColor: '#F8F9FF', padding: 16, borderRadius: 16 },
  mainStatLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  mainStatValue: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  graphContainer: { marginBottom: 10 },
  graphTitle: { fontSize: 14, fontWeight: 'bold', color: '#3A3A3C' },
  noDataGraph: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12 },
  trendUnitSelector: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2 },
  unitBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  unitBtnActive: { backgroundColor: '#FFF' },
  unitBtnText: { fontSize: 10, fontWeight: 'bold', color: '#8E8E93' },
  unitBtnTextActive: { color: '#007AFF' },
  sectionSubTitle: { fontSize: 14, fontWeight: 'bold', color: '#3A3A3C', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: '#F2F2F7', padding: 10, borderRadius: 12, alignItems: 'center' },
  statBoxTitle: { fontSize: 10, color: '#8E8E93', marginBottom: 4 },
  statBoxRateDash: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  statBoxRate: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  statBoxCounts: { fontSize: 10, color: '#8E8E93' },
  patternsCardDash: { backgroundColor: '#F2F2F7', padding: 16, borderRadius: 16 },
  patternsCard: { backgroundColor: '#F8F8F8', padding: 16, borderRadius: 16 },
  patternLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  patternLabelText: { fontSize: 12, color: '#3A3A3C', fontWeight: '600' },
  barContainer: { height: 8, backgroundColor: '#E5E5EA', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  patternValueText: { fontSize: 12, color: '#1C1C1E', fontWeight: 'bold' },
  searchBarContainer: { marginBottom: 12 },
  searchBar: Object.assign({ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 44 }, (0, m.getShadowStyle)({ shadowOpacity: .05, shadowRadius: 5, elevation: 2 })),
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  listContainer: { gap: 10 },
  rowCard: Object.assign({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12 }, (0, m.getShadowStyle)({ shadowOpacity: .05, shadowRadius: 5, elevation: 2 })),
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93' },
  nameContainer: { gap: 2 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  memberSub: { fontSize: 11, color: '#8E8E93' },
  rowRight: { alignItems: 'flex-end' },
  rateText: { fontSize: 17, fontWeight: 'bold', color: '#007AFF' },
  shotScoreText: { fontSize: 11, color: '#8E8E93' },
  noDataText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 15 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F2F2F7' },
  tagChipActive: { backgroundColor: '#007AFF' },
  tagChipText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#8E8E93', marginBottom: 20, textAlign: 'center' },
  closeBtn: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  pointDetailCard: { marginTop: 16, padding: 12, backgroundColor: '#F8F9FF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  detailLabel: { fontSize: 13, fontWeight: 'bold', color: '#007AFF' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  detailText: { fontSize: 12, color: '#3A3A3C' },
  detailStats: { fontSize: 12, fontWeight: 'bold', color: '#1C1C1E' },
  detailMore: { fontSize: 10, color: '#8E8E93', marginTop: 4, textAlign: 'center' }
});
