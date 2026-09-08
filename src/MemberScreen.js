/**
 * Module ID: 1022
 */
'use strict';

const _e = exports;

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'MemberScreen', {
    enumerable: !0,
    get: function () {
      return C;
    },
  }));
var t = require('react'),
  n = e(require('./View')),
  o = e(require('./Text')),
  l = e(require('./StyleSheet')),
  a = e(require('./FlatList')),
  s = e(require('./TouchableOpacity')),
  c = e(require('./TextInput')),
  u = e(require('./SafeAreaView')),
  流れ = e(require('./ScrollView')),
  g = e(require('./Modal')),
  f = e(require('./alertBridge')),
  h = e(require('./Pressable')),
  m = require('./IS_WEB'),
  x = require('./useScoreStore'),
  案内 = require('./TutorialGuide'),
  p = require('@expo/vector-icons'),
  b = require('./shadowStyle'),
  y = require('./themedJsx');
var CC = require('./CustomCalendarModal');

const C = () => {
  const {
    members: e = [],
    addMember: l,
    updateMember: b,
    deleteMember: C,
    incrementAllGrades: F,
    activeGroupId: I,
    publicGroupId: S,
    isAdminMode: B,
    activeRole: E,
    myMemberId: w,
  } = (0, x.useScoreStore)();
  // 使い方の案内が指す先
  const 案内の部員追加 = 案内.useTutorialTarget('メンバー.追加');
  const [T, W] = (0, t.useState)('');
  const [z, D] = (0, t.useState)(!1);
  const [q, v] = (0, t.useState)(null);
  const [k, A] = (0, t.useState)('');
  const [R, H] = (0, t.useState)('未設定');
  const [P, _] = (0, t.useState)('1');
  const [M, O] = (0, t.useState)('');
  const G = (0, x.useScoreStore)((e) => e.currentFreshmanTerm);
  const [L, N] = (0, t.useState)(!1);
  const [V, K] = (0, t.useState)(new Date().toISOString().split('T')[0]);
  const [Y, $] = (0, t.useState)('');
  const [U, J] = (0, t.useState)('');
  const { addEquipment: Q, deleteEquipment: X } = (0, x.useScoreStore)();
  const [isAlumniExpanded, setIsAlumniExpanded] = (0, t.useState)(false);
  const [calVis, setCalVis] = (0, t.useState)(false);

  // 個人ログインでは自分だけを出す。他人は開けない作りなので、並べても
  // 押せない行が続くだけだった。人数の多い団体ほど自分を探しにくい。
  // 弓具を登録しに来る人にとって、この画面に用があるのは自分の行だけ
  const 見せる名簿 = 'member' === E ? (e || []).filter((x) => x && x.id === w) : e || [];

  const filteredMembers = 見せる名簿.filter(
    (e) => e && e.name && e.name.toLowerCase().includes(T.toLowerCase())
  );

  const activeMembers = filteredMembers
    .filter((m) => (m.grade || 0) < 5)
    .sort((e, t) => {
      const n = void 0 === e.grade || null === e.grade ? 99 : Number(e.grade),
        o = void 0 === t.grade || null === t.grade ? 99 : Number(t.grade),
        l = 0 === n ? 99 : n,
        a = 0 === o ? 99 : o;
      if (l !== a) return l - a;
      const s = (e) => {
          const t = (e || '').trim();
          return '男子' === t ? 0 : '女子' === t ? 1 : 2;
        },
        c = s(e.gender) - s(t.gender);
      return 0 !== c ? c : (e.name || '').localeCompare(t.name || '', 'ja');
    });

  const graduateMembers = filteredMembers
    .filter((m) => m.grade === 5)
    .sort((e, t) => {
      const kiA = e.termKi || 0;
      const kiB = t.termKi || 0;
      if (kiB !== kiA) return kiB - kiA;
      const s = (e) => {
          const t = (e || '').trim();
          return '男子' === t ? 0 : '女子' === t ? 1 : 2;
        },
        c = s(e.gender) - s(t.gender);
      return 0 !== c ? c : (e.name || '').localeCompare(t.name || '', 'ja');
    });

  const graduateGroups = graduateMembers.reduce((groups, member) => {
    const ki = member.termKi || '期不明';
    if (!groups[ki]) groups[ki] = [];
    groups[ki].push(member);
    return groups;
  }, {});

  const renderMemberCard = (e) => {
    const t =
      e.equipments && e.equipments.length > 0 ? [...e.equipments].sort((e, t) => t.date - e.date)[0] : null;
    return (0, y.jsxs)(
      h.default,
      {
        style: ({ hovered: e_h }) => [
          j.memberCard,
          e_h && { backgroundColor: 'rgba(0,122,255,0.05)' },
          m.IS_WEB && { cursor: 'pointer' },
        ],
        onPress: () => {
          'member' !== E || e.id === w
            ? ee(e)
            : f.default.alert('制限', 'メンバーモードでは自分以外の情報は編集できません。');
        },
        children: [
          (0, y.jsxs)(n.default, {
            style: j.memberInfoMain,
            children: [
              (0, y.jsxs)(n.default, {
                style: j.nameRow,
                children: [
                  (0, y.jsx)(o.default, {
                    style: [
                      j.genderDot,
                      {
                        color: '男子' === e.gender ? '#007AFF' : '女子' === e.gender ? '#FF2D55' : '#8E8E93',
                      },
                    ],
                    children: '●',
                  }),
                  (0, y.jsx)(o.default, { style: j.memberName, numberOfLines: 1, children: e.name }),
                ],
              }),
              (0, y.jsxs)(o.default, {
                style: j.memberSub,
                children: [
                  e.termKi ? `${e.termKi}期 / ` : '',
                  e.gender,
                  ' / ',
                  e.grade === 5 ? '卒業生' : e.grade > 0 ? `${e.grade}年` : 'その他',
                ],
              }),
            ],
          }),
          (0, y.jsxs)(n.default, {
            style: j.memberEqInfo,
            children: [
              // 弓力は弓具の中身。個人ログインでは自分のぶんだけ見せる。
              // 他人の行では「弓具未登録」も出さない（登録の有無も中身のうち）
              'member' === E && e.id !== w
                ? null
                : t?.weight
                  ? (0, y.jsx)(n.default, {
                      style: j.listWeightBadge,
                      children: (0, y.jsxs)(o.default, {
                        style: j.listWeightText,
                        children: [
                          t.weight,
                          (0, y.jsx)(o.default, { style: { fontSize: 10 }, children: 'kg' }),
                        ],
                      }),
                    })
                  : (0, y.jsx)(o.default, { style: j.noEqText, children: '弓具未登録' }),
              (0, y.jsx)(p.Ionicons, { name: 'chevron-forward', size: 16, color: '#C7C7CC' }),
            ],
          }),
        ],
      },
      typeof e.id === 'string' ? e.id : `member-${e.name}`
    );
  };

  // 個人ログインでは、自分の編集をはじめから開いておく。
  // 一覧に自分1人しか出ないので、そこを押させる一手間に意味がない。
  // 名簿は雲から遅れて届くので、届いたところで一度だけ開く
  const 自分を開いた = (0, t.useRef)(!1);
  (0, t.useEffect)(() => {
    if ('member' !== E || 自分を開いた.current) return;
    const 自分 = (e || []).find((x) => x && x.id === w);
    if (!自分) return;
    ((自分を開いた.current = !0), ee(自分));
  }, [E, e, w]);

  const ee = (e) => {
      if ((v(e), A(e.name), H(e.gender), _(e.grade.toString()), !e.termKi && G)) {
        const t = e.grade || 1;
        O(t >= 1 && t <= 5 ? String(G - (t - 1)) : '');
      } else O(e.termKi?.toString() || '');
      D(!0);
    },
    te = (e, t) => {
      const n = `${t} さんを削除しますか？`,
        o = () => {
          (C(e), D(!1));
        };
      // ブラウザの確認窓は使わない。受け口（alertBridge）がアプリの中の窓へ流す
      f.default.alert('確認', n, [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: o },
      ]);
    };

  /**
   * 弓具変更履歴の中身。窓の中にも、個人ログインの編集画面の中にも同じものを出す。
   *
   * 個人ログインでは一覧も窓も挟まず、自分の編集と履歴をそのまま出す（本人しか
   * 触れないので、隠す意味がない）。同じ見た目を2か所に書き写すと必ずずれるので、
   * ここ1つにして呼び分ける。
   *
   * @param {string} 部員id  誰の履歴か
   * @param {boolean} 閉じるを出す 窓として出すときだけ true（見出しと×を付ける）
   */
  const 弓具履歴の中身 = (部員id, 閉じるを出す) => {
    const t = e.find((e) => e.id === 部員id);
    return t
      ? (0, y.jsxs)(y.Fragment, {
          children: [
            // 見出しと×は、窓として出すときだけ。編集画面の中に並べるときは、
            // すぐ上に「弓具管理」の見出しが在るので二重になる
            閉じるを出す
              ? (0, y.jsxs)(n.default, {
                  style: j.eqModalHeader,
                  children: [
                    (0, y.jsxs)(o.default, {
                      style: j.modalTitle,
                      children: ['弓具変更履歴 (', t.name, ')'],
                    }),
                    (0, y.jsx)(s.default, {
                      onPress: () => {
                        N(!1);
                        setCalVis(false);
                      },
                      children: (0, y.jsx)(p.Ionicons, { name: 'close', size: 24, color: '#8E8E93' }),
                    }),
                  ],
                })
              : null,
            (0, y.jsxs)(n.default, {
              style: j.eqForm,
              children: [
                (0, y.jsxs)(n.default, {
                  style: j.eqInputRow,
                  children: [
                    (0, y.jsx)(s.default, {
                      style: [j.eqInput, { flex: 1, minWidth: 0, justifyContent: 'center' }],
                      onPress: () => setCalVis(true),
                      children: (0, y.jsx)(o.default, {
                        style: { fontSize: 15, color: '#000' },
                        children: V,
                      }),
                    }),
                    (0, y.jsxs)(n.default, {
                      style: [j.eqWeightInputWrapper, { flex: 1, minWidth: 0 }],
                      children: [
                        (0, y.jsx)(c.default, {
                          style: j.eqInputInside,
                          placeholder: '弓力',
                          value: U,
                          onChangeText: (text) => {
                            let filtered = text.replace(/[^0-9.]/g, '');
                            const dotPos = filtered.indexOf('.');
                            if (dotPos !== -1) {
                              const intPart = filtered.slice(0, dotPos).slice(0, 3);
                              const decPart = filtered
                                .slice(dotPos + 1)
                                .replace(/\./g, '')
                                .slice(0, 1);
                              filtered = intPart + '.' + decPart;
                            } else {
                              filtered = filtered.slice(0, 3);
                            }
                            J(filtered);
                          },
                          keyboardType: 'decimal-pad',
                        }),
                        (0, y.jsx)(o.default, { style: j.kgUnit, children: 'kg' }),
                      ],
                    }),
                  ],
                }),
                (0, y.jsx)(c.default, {
                  style: [j.eqInput, { height: 60 }],
                  placeholder: '内容 (弦交換、弓の変更など)',
                  value: Y,
                  onChangeText: $,
                  multiline: !0,
                }),
                (0, y.jsx)(s.default, {
                  style: j.eqAddBtn,
                  onPress: () => {
                    (Y.trim() || U.trim()) &&
                      (Q(t.id, { date: new Date(V).getTime() || Date.now(), note: Y, weight: U }),
                      $(''),
                      J(''));
                  },
                  children: (0, y.jsx)(o.default, {
                    style: j.eqAddBtnText,
                    children: '履歴を追加',
                  }),
                }),
              ],
            }),
            (0, y.jsx)(a.default, {
              // 画面として出すときは、外側の ScrollView が流す。
              // ここでも流すと入れ子になって、指の動きを取り合う
              scrollEnabled: !!閉じるを出す,
              data: [...(t.equipments || [])].sort((e, t) => t.date - e.date),
              keyExtractor: (e, index) =>
                typeof e.id === 'string' ? e.id : `eq-${index}-${e.date}`,
              contentContainerStyle: { padding: 15 },
              renderItem: ({ item: e }) =>
                (0, y.jsxs)(n.default, {
                  style: j.eqItem,
                  children: [
                    (0, y.jsxs)(n.default, {
                      style: { flex: 1, marginRight: 8 },
                      children: [
                        (0, y.jsxs)(n.default, {
                          style: j.eqItemHeader,
                          children: [
                            (0, y.jsx)(o.default, {
                              style: j.eqItemDate,
                              children: new Date(e.date).toLocaleDateString(),
                            }),
                            e.weight &&
                              (0, y.jsx)(n.default, {
                                style: j.eqWeightBadge,
                                children: (0, y.jsxs)(o.default, {
                                  style: j.eqWeightText,
                                  children: [e.weight, ' kg'],
                                }),
                              }),
                          ],
                        }),
                        (0, y.jsx)(o.default, { style: j.eqItemNote, children: e.note }),
                      ],
                    }),
                    (0, y.jsx)(s.default, {
                      // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                      accessible: !0,
                      accessibilityRole: 'button',
                      accessibilityLabel: 'この弓具の記録を消す',
                      'aria-label': 'この弓具の記録を消す',
                      onPress: () => X(t.id, e.id),
                      style: { padding: 4 },
                      children: (0, y.jsx)(p.Ionicons, {
                        name: 'trash-outline',
                        size: 20,
                        color: '#FF3B30',
                      }),
                    }),
                  ],
                }),
              ListEmptyComponent: (0, y.jsx)(o.default, {
                style: j.emptyText,
                children: '履歴がありません',
              }),
            }),
          ],
        })
      : null;
  };

  /**
   * メンバー編集の中身。団体ログインでは窓の中、個人ログインでは画面そのものに出す。
   *
   * 個人ログインでは一覧に自分しか出ないので、押して窓を開かせる一手間に意味がない。
   * 同じ見た目を2か所に書き写すと必ずずれるので、ここ1つにして呼び分ける。
   */
  const 編集の中身 = (窓として出す) =>
    (0, y.jsxs)(n.default, {
            // 窓のときは窓の見た目、画面のときは画面いっぱいに広げる。
            // 窓の枠のまま画面に置くと、右half が空いたままになる
            style: 窓として出す
              ? j.modalContent
              : { flex: 1, width: '100%', backgroundColor: '#FFF' },
            children: [
              // 見出しと×は窓のときだけ。画面のときは上に「自分の情報」が在る
              窓として出す
                ? (0, y.jsxs)(n.default, {
                    style: j.modalHeader,
                    children: [
                      (0, y.jsx)(o.default, {
                        style: j.modalTitle,
                        children: q ? 'メンバー編集' : '新規登録',
                      }),
                      (0, y.jsx)(s.default, {
                        onPress: () => D(!1),
                        style: j.closeBtn,
                        children: (0, y.jsx)(p.Ionicons, { name: 'close', size: 24, color: '#8E8E93' }),
                      }),
                    ],
                  })
                : null,
              (0, y.jsxs)(n.default, {
                style: { padding: 20 },
                children: [
                  // 個人ログインでは名前も変えられない。名簿は団体で管理する
                  // ものなので、本人が動かすと記録の名寄せまでずれる
                  ...(窓として出す
                    ? [
                                      (0, y.jsx)(o.default, { style: j.label, children: '名前' }),
                                      (0, y.jsx)(c.default, {
                                        style: j.input,
                                        value: k,
                                        onChangeText: A,
                                        placeholder: '例: 山田 太郎',
                                        placeholderTextColor: '#C7C7CC',
                                      }),
                                      (0, y.jsx)(o.default, {
                                        style: j.inputHelperText,
                                        children: '姓名の間にスペースを入力してください',
                                      }),
                                      q &&
                                        q.personalId &&
                                        (0, y.jsxs)(y.Fragment, {
                                          children: [
                                            (0, y.jsx)(o.default, { style: j.label, children: '個人ID (自動採番)' }),
                                            (0, y.jsx)(n.default, {
                                              style: [j.input, { justifyContent: 'center', opacity: 0.6 }],
                                              children: (0, y.jsx)(o.default, {
                                                style: { fontSize: 16 },
                                                children: B || q.id === w ? q.personalId : '******** (管理者のみ表示)',
                                              }),
                                            }),
                                          ],
                                        }),
                      ]
                    : []),
                  // 性別・学年・期は団体で管理する項目。個人ログインでは
                  // 見るだけにする。本人が動かすと名簿と食い違い、進級や
                  // 卒業の扱いまでずれる
                  窓として出す
                    ? (0, y.jsxs)(y.Fragment, { children: [
                    (0, y.jsx)(o.default, { style: j.label, children: '性別' }),
                    (0, y.jsx)(n.default, {
                      style: j.genderRow,
                      children: ['男子', '女子', '未設定'].map((e) =>
                        (0, y.jsx)(
                          h.default,
                          {
                            style: ({ hovered: t }) => [
                              j.genderBtn,
                              R === e && j.genderBtnActive,
                              t && R !== e && { backgroundColor: '#E5E5EA' },
                            ],
                            onPress: () => H(e),
                            children: (0, y.jsx)(o.default, {
                              style: [j.genderBtnText, R === e && j.genderBtnTextActive],
                              children: e,
                            }),
                          },
                          e
                        )
                      ),
                    }),
                    (0, y.jsx)(o.default, { style: j.label, children: '学年' }),
                    (0, y.jsxs)(n.default, {
                      style: j.stepperContainer,
                      children: [
                        (0, y.jsx)(o.default, {
                          style: j.stepperValue,
                          children: '0' === P ? 'その他' : '5' === P ? '卒業生' : `${P}年生`,
                        }),
                        (0, y.jsxs)(n.default, {
                          style: j.stepperControls,
                          children: [
                            (0, y.jsx)(h.default, {
                              style: ({ hovered: e }) => [j.stepperBtn, e && { backgroundColor: '#D1D1D6' }],
                              onPress: () => {
                                const e = parseInt(P) || 0;
                                if (e > 0) {
                                  const t = e - 1;
                                  (_(String(t)), G && t >= 1 && t <= 5 && O(String(G - (t - 1))));
                                }
                              },
                              children: (0, y.jsx)(p.Ionicons, { name: 'remove', size: 24, color: '#007AFF' }),
                            }),
                            (0, y.jsx)(n.default, { style: j.stepperDivider }),
                            (0, y.jsx)(h.default, {
                              style: ({ hovered: e }) => [j.stepperBtn, e && { backgroundColor: '#D1D1D6' }],
                              onPress: () => {
                                const e = parseInt(P) || 0;
                                if (e < 5) {
                                  const t = e + 1;
                                  (_(String(t)), G && t >= 1 && t <= 5 && O(String(G - (t - 1))));
                                }
                              },
                              children: (0, y.jsx)(p.Ionicons, { name: 'add', size: 24, color: '#007AFF' }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, y.jsx)(o.default, { style: j.label, children: '期' }),
                    (0, y.jsx)(c.default, {
                      style: j.input,
                      value: M,
                      onChangeText: O,
                      placeholder: '例: 70',
                      keyboardType: 'number-pad',
                      placeholderTextColor: '#C7C7CC',
                    }),
                      ] })
                    : (0, y.jsxs)(n.default, {
                        style: j.きまり,
                        children: [
                          (0, y.jsxs)(n.default, {
                            style: j.きまりの行,
                            children: [
                              (0, y.jsx)(o.default, { style: j.きまりの名, children: '名前' }),
                              (0, y.jsx)(o.default, { style: j.きまりの値, children: k || '未設定' }),
                            ],
                          }),
                          q && q.personalId
                            ? (0, y.jsxs)(n.default, {
                                style: j.きまりの行,
                                children: [
                                  (0, y.jsx)(o.default, { style: j.きまりの名, children: '個人ID' }),
                                  (0, y.jsx)(o.default, {
                                    style: j.きまりの値,
                                    children: q.personalId,
                                  }),
                                ],
                              })
                            : null,
                          (0, y.jsxs)(n.default, {
                            style: j.きまりの行,
                            children: [
                              (0, y.jsx)(o.default, { style: j.きまりの名, children: '性別' }),
                              (0, y.jsx)(o.default, { style: j.きまりの値, children: R || '未設定' }),
                            ],
                          }),
                          (0, y.jsxs)(n.default, {
                            style: j.きまりの行,
                            children: [
                              (0, y.jsx)(o.default, { style: j.きまりの名, children: '学年' }),
                              (0, y.jsx)(o.default, {
                                style: j.きまりの値,
                                children: '5' === P ? '卒業生' : '0' === P ? 'その他' : `${P}年`,
                              }),
                            ],
                          }),
                          (0, y.jsxs)(n.default, {
                            style: [j.きまりの行, { borderBottomWidth: 0 }],
                            children: [
                              (0, y.jsx)(o.default, { style: j.きまりの名, children: '期' }),
                              (0, y.jsx)(o.default, {
                                style: j.きまりの値,
                                children: M ? `${M}期` : '未設定',
                              }),
                            ],
                          }),
                          (0, y.jsx)(o.default, {
                            style: j.きまりの但し書き,
                            children: '名前・性別・学年・期は団体の担当者が直します',
                          }),
                        ],
                      }),
                  // 弓具は、団体アカウントか本人だけ。個人ログインで他人の
                  // 画面を開く道は塞いであるが、ここでも確かめる
                  q &&
                    ('member' !== E || q.id === w) &&
                    (0, y.jsxs)(y.Fragment, {
                      children: [
                        (0, y.jsx)(o.default, { style: j.label, children: '弓具管理' }),
                        // 個人ログインでは、窓を挟まずにそのまま履歴を出す。
                        // 自分のぶんしか触れないので、隠す意味がない
                        'member' === E
                          ? 弓具履歴の中身(q?.id, !1)
                          : (0, y.jsxs)(h.default, {
                              style: ({ hovered: e }) => [
                                j.eqHistoryBtn,
                                e && { backgroundColor: '#E5E5EA' },
                              ],
                              onPress: () => N(!0),
                              children: [
                                (0, y.jsx)(p.Ionicons, {
                                  name: 'construct-outline',
                                  size: 20,
                                  color: '#007AFF',
                                }),
                                (0, y.jsx)(o.default, {
                                  style: j.eqHistoryBtnText,
                                  children: '弓具変更履歴を表示・編集',
                                }),
                              ],
                            }),
                      ],
                    }),
                  ...(窓として出す ? [
                    (0, y.jsxs)(n.default, {
                      style: j.modalFooter,
                      children: [
                        q && 'member' !== E
                          ? (0, y.jsxs)(s.default, {
                              style: j.deleteBtn,
                              onPress: () => te(q.id, q.name),
                              children: [
                                (0, y.jsx)(p.Ionicons, {
                                  name: 'trash-outline',
                                  size: 18,
                                  color: '#FF3B30',
                                  style: { marginRight: 4 },
                                }),
                                (0, y.jsx)(o.default, { style: j.deleteBtnText, children: 'メンバーを削除' }),
                              ],
                            })
                          : (0, y.jsx)(n.default, {}),
                        (0, y.jsx)(s.default, {
                          style: j.saveBtn,
                          onPress: () => {
                            if (!k.trim())
                              return void f.default.alert('お知らせ', '名前を入力してください');
                            const e = parseInt(P) || 0,
                              t = '' === M ? void 0 : parseInt(M) || void 0;
                            (q ? b(q.id, { name: k, gender: R, grade: e, termKi: t }) : l(k, R, e, t), D(!1));
                          },
                          children: (0, y.jsx)(o.default, { style: j.saveBtnText, children: '保存する' }),
                        }),
                      ],
                    }),
                  ] : []),
                ],
              }),
            ],
          });

  // ── 個人ログインの画面 ──────────────────────────────
  //
  // 出るのは自分1人だけなので、一覧から選ばせる作りをそのまま使うと、
  // 「1行だけの一覧を押して窓を開く」という空回りになる。ここは自分の
  // 情報と弓具だけを、そのまま並べた画面にする。
  // 中身（編集の欄・弓具の履歴）は団体ログインと同じものを呼んでいるので、
  // 直すところは1か所で済む。
  if ('member' === E) {
    const 自分 = (e || []).find((x) => x && x.id === w);
    return (0, y.jsxs)(u.default, {
      style: j.safeArea,
      children: [
        (0, y.jsxs)(n.default, {
          style: j.header,
          children: [
            (0, y.jsxs)(n.default, {
              children: [
                (0, y.jsx)(o.default, { style: j.title, children: '自分の情報' }),
                (S || I) &&
                  (0, y.jsx)(n.default, {
                    style: j.headerGroupIdBadge,
                    children: (0, y.jsxs)(o.default, {
                      style: j.headerGroupIdText,
                      children: ['団体ID: ', S || I],
                    }),
                  }),
              ],
            }),
          ],
        }),
        自分
          ? (0, y.jsx)(流れ.default, {
              style: { flex: 1 },
              contentContainerStyle: { flexGrow: 1, paddingBottom: 32 },
              children: 編集の中身(!1),
            })
          : (0, y.jsx)(n.default, {
              style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
              children: (0, y.jsx)(o.default, {
                style: j.emptyText,
                children: '自分の情報を読み込んでいます',
              }),
            }),
        (0, y.jsx)(CC.CustomCalendarModal, {
          visible: calVis,
          onClose: () => setCalVis(false),
          selectedDate: new Date(V + 'T12:00:00'),
          onSelectDate: (date) => {
            (K(
              date.getFullYear() +
                '-' +
                String(date.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(date.getDate()).padStart(2, '0')
            ),
              setCalVis(false));
          },
        }),
      ],
    });
  }

  return (0, y.jsxs)(u.default, {
    style: j.safeArea,
    children: [
      (0, y.jsxs)(n.default, {
        style: j.header,
        children: [
          (0, y.jsxs)(n.default, {
            children: [
              (0, y.jsx)(o.default, { style: j.title, children: 'メンバー管理' }),
              (S || I) &&
                (0, y.jsx)(n.default, {
                  style: j.headerGroupIdBadge,
                  children: (0, y.jsxs)(o.default, {
                    style: j.headerGroupIdText,
                    children: ['団体ID: ', S || I],
                  }),
                }),
            ],
          }),
          (0, y.jsx)(n.default, {
            style: { flexDirection: 'row', gap: 16 },
            children:
              'member' !== E &&
              (0, y.jsx)(h.default, {
                ref: 案内の部員追加,
                style: ({ hovered: e }) => [
                  j.addBtn,
                  e && { backgroundColor: 'rgba(0,122,255,0.05)', borderRadius: 8, padding: 4 },
                ],
                // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                accessible: !0,
                accessibilityRole: 'button',
                accessibilityLabel: '部員を追加',
                'aria-label': '部員を追加',
                onPress: () => {
                  (v(null), A(''), H('未設定'), _('1'), O(G ? String(G) : ''), D(!0));
                },
                children: (0, y.jsx)(p.Ionicons, { name: 'person-add', size: 24, color: '#007AFF' }),
              }),
          }),
        ],
      }),
      (0, y.jsxs)(n.default, {
        style: j.searchBar,
        children: [
          (0, y.jsx)(p.Ionicons, { name: 'search', size: 18, color: '#8E8E93' }),
          (0, y.jsx)(c.default, {
            style: j.searchInput,
            placeholder: 'メンバーを検索...',
            value: T,
            onChangeText: W,
          }),
          '' !== T &&
            (0, y.jsx)(s.default, {
              // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
              accessible: !0,
              accessibilityRole: 'button',
              accessibilityLabel: '絞り込みを消す',
              'aria-label': '絞り込みを消す',
              onPress: () => W(''),
              children: (0, y.jsx)(p.Ionicons, { name: 'close-circle', size: 18, color: '#8E8E93' }),
            }),
        ],
      }),
      (0, y.jsxs)(a.default, {
        data: activeMembers,
        keyExtractor: (e, index) => (typeof e.id === 'string' ? e.id : `member-${index}-${e.name}`),
        contentContainerStyle: j.listContent,
        ListEmptyComponent:
          activeMembers.length === 0 && graduateMembers.length === 0
            ? (0, y.jsx)(n.default, {
                style: j.empty,
                children: (0, y.jsx)(o.default, { style: j.emptyText, children: 'メンバーがいません' }),
              })
            : null,
        renderItem: ({ item: e }) => renderMemberCard(e),
        ListFooterComponent:
          graduateMembers.length > 0
            ? (0, y.jsxs)(n.default, {
                style: { marginTop: 10 },
                children: [
                  (0, y.jsxs)(h.default, {
                    style: j.alumniHeader,
                    onPress: () => setIsAlumniExpanded(!isAlumniExpanded),
                    children: [
                      (0, y.jsx)(o.default, {
                        style: j.alumniHeaderText,
                        children: `卒業生を表示 (${graduateMembers.length}名)`,
                      }),
                      (0, y.jsx)(p.Ionicons, {
                        name: isAlumniExpanded ? 'chevron-up' : 'chevron-down',
                        size: 20,
                        color: '#8E8E93',
                      }),
                    ],
                  }),
                  isAlumniExpanded &&
                    Object.keys(graduateGroups)
                      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
                      .map((ki) =>
                        (0, y.jsxs)(
                          n.default,
                          {
                            style: { marginTop: 10 },
                            children: [
                              (0, y.jsx)(o.default, {
                                style: j.alumniGroupTitle,
                                children: ki === '期不明' ? '期不明' : `${ki}期`,
                              }),
                              graduateGroups[ki].map(renderMemberCard),
                            ],
                          },
                          `group-${ki}`
                        )
                      ),
                ],
              })
            : null,
      }),

      (0, y.jsx)(g.default, {
        visible: z,
        animationType: 'slide',
        transparent: !0,
        children: (0, y.jsx)(n.default, {
          style: j.modalOverlay,
          children: 編集の中身(!0),
        }),
      }),
      (0, y.jsx)(g.default, {
        visible: L,
        animationType: 'slide',
        transparent: !0,
        children: (0, y.jsx)(n.default, {
          style: j.modalOverlay,
          children: (0, y.jsx)(n.default, {
            style: [j.modalContent, { height: '80%', padding: 0 }],
            children: 弓具履歴の中身(q?.id, !0),
          }),
        }),
      }),
      (0, y.jsx)(CC.CustomCalendarModal, {
        visible: calVis,
        onClose: () => setCalVis(false),
        selectedDate: new Date(V + 'T12:00:00'),
        onSelectDate: (date) => {
          K(
            date.getFullYear() +
              '-' +
              String(date.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date.getDate()).padStart(2, '0')
          );
        },
      }),
    ],
  });
};

const j = l.default.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingTop: m.IS_WEB ? m.WEB_TOP_PADDING : m.SAFE_TOP_PADDING,
  },
  header: {
    minHeight: m.IS_WEB ? 60 : 70,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: l.default.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 12,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  listContent: { padding: 12 },
  memberCard: Object.assign(
    {
      backgroundColor: '#FFF',
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    (0, b.getShadowStyle)({
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    })
  ),
  memberInfoMain: { flex: 1, marginRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  genderDot: { fontSize: 12 },
  memberName: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  memberSub: { fontSize: 12, color: '#8E8E93' },
  memberPersonalId: { fontSize: 11, color: '#007AFF', fontWeight: 'bold', marginTop: 2 },
  headerGroupIdBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  headerGroupIdText: { fontSize: 10, color: '#8E8E93', fontWeight: 'bold' },
  memberEqInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listWeightBadge: {
    backgroundColor: '#E1F0FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    minWidth: 45,
    alignItems: 'center',
  },
  listWeightText: { fontSize: 13, color: '#007AFF', fontWeight: 'bold' },
  noEqText: { fontSize: 11, color: '#C7C7CC' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: l.default.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#F9F9F9',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  closeBtn: { position: 'absolute', right: 16 },
  // 個人ログインで「見るだけ」の項目を並べる一枚。
  // 入力欄と見た目を分けて、触れないことがひと目で分かるようにする
  きまり: {
    backgroundColor: '#F7F7FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 2,
    marginTop: 4,
  },
  きまりの行: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  きまりの名: { fontSize: 14, color: '#8E8E93' },
  きまりの値: { fontSize: 15, color: '#000', fontWeight: '600' },
  きまりの但し書き: { fontSize: 11, color: '#8E8E93', paddingVertical: 8 },
  label: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F2F2F7',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#000',
  },
  inputHelperText: { fontSize: 11, color: '#8E8E93', marginTop: 4, marginLeft: 4 },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: '#007AFF' },
  genderBtnText: { color: '#000', fontWeight: '500' },
  genderBtnTextActive: { color: '#FFF' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 8,
  },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  deleteBtnText: { color: '#FF3B30', fontSize: 15, fontWeight: '500' },
  cancelBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  saveBtn: {
    paddingHorizontal: 24,
    height: 44,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    height: 44,
    paddingLeft: 16,
  },
  stepperValue: { fontSize: 16, color: '#000' },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    marginRight: 2,
    height: 40,
  },
  stepperBtn: { paddingHorizontal: 16, height: '100%', justifyContent: 'center', alignItems: 'center' },
  stepperDivider: { width: 1, height: 24, backgroundColor: '#C6C6C8' },
  eqHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  eqHistoryBtnText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
  eqModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: l.default.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  eqForm: {
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: l.default.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  eqInputRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  eqInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    height: 40,
  },
  eqAddBtn: { backgroundColor: '#34C759', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  eqAddBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  eqItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: l.default.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  eqItemHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  eqItemDate: { fontSize: 14, color: '#8E8E93', fontWeight: '600' },
  eqItemNote: { fontSize: 16, color: '#000' },
  eqWeightBadge: { backgroundColor: '#E5E5EA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  eqWeightText: { fontSize: 12, color: '#000', fontWeight: '700' },
  eqWeightInputWrapper: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 40,
  },
  eqInputInside: { flex: 1, minWidth: 0, height: 40, fontSize: 15 },
  kgUnit: { marginLeft: 4, color: '#8E8E93', fontSize: 14, fontWeight: 'bold' },
  alumniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  alumniHeaderText: { fontSize: 15, fontWeight: 'bold', color: '#8E8E93' },
  alumniGroupTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginLeft: 4,
    marginBottom: 8,
    marginTop: 12,
  },
});
