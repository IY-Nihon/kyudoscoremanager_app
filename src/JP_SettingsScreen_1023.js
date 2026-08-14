/**
 * Module ID: 1023
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const _a = typeof id !== 'undefined' ? id : 1023;
const _m = module;
const _e = exports;
const _d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
function t(e) {
  if (e && e.__esModule) return e;
  var t = {};
  return (
    e &&
      Object.keys(e).forEach(function (l) {
        var o = Object.getOwnPropertyDescriptor(e, l);
        Object.defineProperty(
          t,
          l,
          o.get
            ? o
            : {
                enumerable: !0,
                get: function () {
                  return e[l];
                },
              }
        );
      }),
    (t.default = e),
    t
  );
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'SettingsScreen', {
    enumerable: !0,
    get: function () {
      return w;
    },
  }));
var _xlsx = require('./JP_excelExport'),
  themeMod = require('./theme'),
  l = e(require('./module_37')),
  o = e(require('./default_144')),
  n = e(require('./default_217')),
  a = e(require('./default_45')),
  s = e(require('./default_297')),
  d = e(require('./default_382')),
  c = e(require('./default_396')),
  u = e(require('./module_198')),
  f = e(require('./default_386')),
  m = e(require('./default_398')),
  h = e(require('./default_218')),
  x = require('./IS_WEB_199'),
  y = require('./JP_useScoreStore_174'),
  案内 = require('./JP_TutorialGuide'),
  p = require('./AntDesign_600'),
  j = require('./module_420'),
  F = require('./JP_CustomCalendarModal_695'),
  C = t(require('./module_1024')),
  b = t(require('./module_1029')),
  S = require('./JP_module_1033'),
  E = require('./db_178'),
  B = require('./module_191'),
  I = require('./module_592'),
  T = require('./module_427'),
  _F = require('./module_188'),
  _G = require('expo-image-picker'),
  _RN = require('react-native'),
  _IM = require('expo-image-manipulator');
// ログアウトの確認の文言は src/logoutPrompt.js にある（画面を動かさずに
// 出し分けを検査できるようにするため）
const {
  logoutMessage: ログアウトの文言,
  logoutButtonLabel: ログアウトのボタン名,
  logoutButtonsDisabled: ログアウトのボタンを止める,
  shouldTrySendFirst: 先に送信すべきか,
} = require('./logoutPrompt');

// ─────────────────────────────────────────
// 書き出しの共通ヘルパー
// ─────────────────────────────────────────

// Excel が日付として解釈でき、文字列ソートも崩れない形式にする。
function csvDate(ts) {
  const d = new Date(ts);
  const p2 = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
}

// memberId（無ければ氏名）でメンバーを引く。学年・性別・期の補完に使う。
function findMemberInfo(archer, memberList, alumniList, normalizeName) {
  const all = [].concat(memberList || [], alumniList || []);
  const nm = normalizeName(archer.name || '');
  return (
    all.find(function (m) {
      return (archer.memberId && m.id === archer.memberId) || (m.name && normalizeName(m.name) === nm);
    }) || null
  );
}

const w = () => {
    const { mode: themeMode, setThemeMode: setThemeModeFn } = themeMod.useThemeMode();
    const {
        currentFreshmanTerm: e = 1,
        alumni: t = [],
        trash: I = [],
        shotsPerRound: w = 8,
        updateCurrentFreshmanTerm: v,
        showSyncErrorPopups: A = !0,
        setShowSyncErrorPopups: k,
        syncStatus: z = 'IDLE',
        lastSyncTime: P,
        isNetworkOnline: R = !0,
        syncAllToCloud: W,
        activeGroupId: L,
        activeGroupName: $,
        updateGroupName: _,
        activeRole: V,
        myMemberId: M,
        myMemberName: H,
        members: O = [],
        setAuth: N,
        isAdminMode: G,
        setAdminMode: Y,
        verifyGroupPassword: J,
        tagTemplates: q = [],
        addTagTemplate: U,
        removeTagTemplate: Q,
        autoPromotionEnabled: K = !0,
        setAutoPromotionEnabled: X,
        enableArrowLocation,
        arrowTargetType,
        setEnableArrowLocation,
        setArrowTargetType,
        sessions: sList = [],
      } = (0, y.useScoreStore)(),
      [Z, ee] = l.default.useState(!1),
      [te, le] = l.default.useState(!1),
      [re, oe] = l.default.useState(!1),
      // ログアウトの確認の段階。'確認' → '送信中' → '送信済み' / '失敗'
      [ログアウトの段階, ログアウトの段階を設定] = l.default.useState('確認'),
      [残った未送信, 残った未送信を設定] = l.default.useState(0),
      [ne, ae] = l.default.useState(''),
      [se, ie] = l.default.useState(''),
      [de, ce] = l.default.useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      [ue, fe] = l.default.useState(new Date()),
      [me, he] = l.default.useState('all'),
      [xe, ge] = l.default.useState(''),
      [ye, pe] = l.default.useState('standard'),
      [je, Fe] = l.default.useState(!1),
      [Ce, be] = l.default.useState('start'),
      [Se, Ee] = l.default.useState(''),
      [Be, Ie] = l.default.useState([]),
      [Te, we] = l.default.useState('AND'),
      [De, ve] = l.default.useState(!1),
      [Ae, ke] = l.default.useState(!1),
      [ze, Pe] = l.default.useState(''),
      [Re, We] = l.default.useState(!1),
      [showPw, setShowPw] = l.default.useState(!1),
      [showTitleSuggestions, setShowTitleSuggestions] = l.default.useState(!1),
      [showMemberSuggestions, setShowMemberSuggestions] = l.default.useState(!1),
      [selectedKeywords, setSelectedKeywords] = l.default.useState([]),
      [selectedMembers, setSelectedMembers] = l.default.useState([]),
      [inquiryVisible, setInquiryVisible] = l.default.useState(!1),
      [inquiryEmail, setInquiryEmail] = l.default.useState(''),
      [inquiryContent, setInquiryContent] = l.default.useState(''),
      [inquirySending, setInquirySending] = l.default.useState(!1),
      [inquiryImages, setInquiryImages] = l.default.useState([]),
      [inquiryImageUploading, setInquiryImageUploading] = l.default.useState(!1),
      titleScrollRef = l.default.useRef(null),
      memberScrollRef = l.default.useRef(null),
      titleRefCallback = l.default.useCallback((e) => {
        if (x.IS_WEB) {
          if (titleScrollRef.current && titleScrollRef.current._wheelHandler) {
            const t = titleScrollRef.current.getScrollableNode
              ? titleScrollRef.current.getScrollableNode()
              : titleScrollRef.current;
            t && t.removeEventListener('wheel', titleScrollRef.current._wheelHandler);
          }
          titleScrollRef.current = e;
          const t = e && e.getScrollableNode ? e.getScrollableNode() : e;
          if (t) {
            const e = (e) => {
              ((t.scrollLeft += e.deltaY), e.preventDefault());
            };
            (t.addEventListener('wheel', e, { passive: !1 }), (titleScrollRef.current._wheelHandler = e));
          }
        } else titleScrollRef.current = e;
      }, []),
      memberRefCallback = l.default.useCallback((e) => {
        if (x.IS_WEB) {
          if (memberScrollRef.current && memberScrollRef.current._wheelHandler) {
            const t = memberScrollRef.current.getScrollableNode
              ? memberScrollRef.current.getScrollableNode()
              : memberScrollRef.current;
            t && t.removeEventListener('wheel', memberScrollRef.current._wheelHandler);
          }
          memberScrollRef.current = e;
          const t = e && e.getScrollableNode ? e.getScrollableNode() : e;
          if (t) {
            const e = (e) => {
              ((t.scrollLeft += e.deltaY), e.preventDefault());
            };
            (t.addEventListener('wheel', e, { passive: !1 }), (memberScrollRef.current._wheelHandler = e));
          }
        } else memberScrollRef.current = e;
      }, []),
      Le = new Date(),
      $e = Le.getMonth() + 1 >= 4 ? Le.getFullYear() : Le.getFullYear() - 1,
      [Ve, Me] = l.default.useState($e),
      He = (e) => {
        Me((t) => t + e);
      },
      titleSuggestions = l.default.useMemo(() => {
        try {
          const src =
            'member' === V && M
              ? sList.filter(
                  (s) =>
                    s &&
                    s.archers &&
                    s.archers.some(
                      (a) =>
                        a &&
                        (a.memberId === M ||
                          (H && !a.memberId && a.name && a.name.replace(/\s*\(\d+\)$/, '').trim() === H))
                    )
                )
              : sList;
          if (!src) return [];
          const titles = src.map((s) => s.title).filter((t) => t && t.trim() !== '');
          return Array.from(new Set(titles)).slice(0, 10);
        } catch (e) {
          return [];
        }
      }, [sList, V, M, H]),
      memberSuggestions = l.default.useMemo(() => {
        try {
          if ('member' === V) return H ? [H] : [];
          const sortMembers = (e, t) => {
            const l = e.grade === undefined || e.grade === null ? 99 : Number(e.grade),
              o = t.grade === undefined || t.grade === null ? 99 : Number(t.grade),
              n = 0 === l ? 99 : l,
              a = 0 === o ? 99 : o;
            if (n !== a) return n - a;
            const s = (e) => {
              const t = (e || '').trim();
              return '男子' === t ? 0 : '女子' === t ? 1 : 2;
            };
            return s(e.gender) - s(t.gender) || (e.name || '').localeCompare(t.name || '', 'ja');
          };
          const list = [...O, ...t]
            .sort(sortMembers)
            .map((m) => m.name)
            .filter((n) => n && n.trim() !== '');
          return Array.from(new Set(list));
        } catch (e) {
          return [];
        }
      }, [O, t, V, H]),
      Oe = l.default.useMemo(() => {
        const t = new Set(),
          src =
            'member' === V && M
              ? sList.filter(
                  (s) =>
                    s &&
                    s.archers &&
                    s.archers.some(
                      (a) =>
                        a &&
                        (a.memberId === M ||
                          (H && !a.memberId && a.name && a.name.replace(/\s*\(\d+\)$/, '').trim() === H))
                    )
                )
              : sList;
        return (
          src.forEach((e) => {
            e.tags && Array.isArray(e.tags) && e.tags.forEach((e) => t.add(e));
          }),
          Array.from(t).sort((e, t) => e.localeCompare(t))
        );
      }, [sList, V, M, H]),
      Ne = (e) => {
        Ie((t) => (t.includes(e) ? t.filter((t) => t !== e) : [...t, e]));
      },
      Ge = async (e) => {
        try {
          const { sessions: l, members: o } = y.useScoreStore.getState(),
            n = 'member' === V ? M : null,
            rSessions = n
              ? l.filter(
                  (e) =>
                    e &&
                    e.archers &&
                    e.archers.some(
                      (t) =>
                        t &&
                        (t.memberId === n ||
                          (H && !t.memberId && t.name && t.name.replace(/\s*\(\d+\)$/, '').trim() === H))
                    )
                )
              : l,
            a = rSessions.filter((t) => {
              if ('all' === e) return !0;
              const l = new Date(t.date);
              if ('fiscal' === e) {
                const e = l.getFullYear();
                return (l.getMonth() + 1 >= 4 ? e : e - 1) === Ve;
              }
              if ('custom' === e) {
                const e = new Date(de);
                e.setHours(0, 0, 0, 0);
                const o = new Date(ue);
                if ((o.setHours(23, 59, 59, 999), l < e || l > o)) return !1;
                if (Be.length > 0) {
                  const e = t.tags || [];
                  if ('AND' === Te) {
                    if (!Be.every((t) => e.includes(t))) return !1;
                  } else if (!Be.some((t) => e.includes(t))) return !1;
                }
                if (selectedKeywords.length > 0) {
                  const e = t.title?.toLowerCase() || '',
                    l = t.note?.toLowerCase() || '',
                    o = new Date(t.date),
                    n = `${o.getFullYear()}/${String(o.getMonth() + 1).padStart(2, '0')}/${String(o.getDate()).padStart(2, '0')}`,
                    a = selectedKeywords.some((t) => {
                      const a = t.toLowerCase();
                      return e.includes(a) || l.includes(a) || n.includes(a);
                    });
                  if (!a) return !1;
                }
                if (xe) {
                  const e = xe.toLowerCase(),
                    l = t.title?.toLowerCase().includes(e),
                    o = t.note?.toLowerCase().includes(e),
                    n = new Date(t.date),
                    a =
                      `${n.getFullYear()}/${String(n.getMonth() + 1).padStart(2, '0')}/${String(n.getDate()).padStart(2, '0')}`.includes(
                        e
                      );
                  if (!(l || o || a)) return !1;
                }
                return !0;
              }
              return !0;
            });
          if (0 === a.length) {
            const e = '対象期間のデータがありません';
            return void (x.IS_WEB ? window.alert(e) : u.default.alert('通知', e));
          }
          const s = (e) => (e || '').replace(/\s*\(\d+\)$/, '').trim();
          let d = '';
          let xlsxHeaders = [],
            xlsxRows = [];
          if ('matrix' !== ye) {
            const mList = o,
              aList = t;
            xlsxHeaders = [
              '日付',
              'タイトル',
              '射手名',
              '学年',
              '性別',
              '期',
              '的中数',
              '総矢数',
              '的中率',
              'タグ',
              'メモ',
              '統計対象',
            ];
            a.forEach((t) => {
              if (!t || !t.archers || !Array.isArray(t.archers)) return;
              const dateStr = csvDate(t.date);
              t.archers.forEach((l) => {
                if (!l || l.isSeparator || l.isTotalCalculator) return;
                if (n) {
                  if (
                    l.memberId !== n &&
                    !(H && !l.memberId && l.name && l.name.replace(/\s*\(\d+\)$/, '').trim() === H)
                  )
                    return;
                } else if ('custom' === e) {
                  if (selectedMembers.length > 0) {
                    if (!selectedMembers.includes(s(l.name))) return;
                  } else if (!('all' === me || (l.name && l.name.toLowerCase().includes(me.toLowerCase()))))
                    return;
                }
                const hits = (Array.isArray(l.marks) ? l.marks : []).filter((e) => '○' === e).length,
                  shots = t.shotCount || 0,
                  rateNum = shots > 0 ? Number(((hits / shots) * 100).toFixed(1)) : 0,
                  mi = findMemberInfo(l, mList, aList, s),
                  gradeV = mi && null != mi.grade ? mi.grade : null != l.grade ? l.grade : '',
                  genderV = mi && mi.gender ? mi.gender : l.gender || '',
                  termV = mi && null != mi.termKi ? mi.termKi : '',
                  tagsV = (t.tags || []).join(' '),
                  noteV = t.note || '',
                  statV = !1 === t.includeInStats ? 'FALSE' : 'TRUE';
                xlsxRows.push([
                  dateStr,
                  t.title || '',
                  s(l.name),
                  gradeV,
                  genderV,
                  termV,
                  hits,
                  shots,
                  rateNum,
                  tagsV,
                  noteV,
                  statV,
                ]);
              });
            });
          } else {
            const l = new Set();
            a.forEach((e) => {
              const t = new Date(e.date);
              l.add(
                `${t.getFullYear()}/${(t.getMonth() + 1).toString().padStart(2, '0')}/${t.getDate().toString().padStart(2, '0')}`
              );
            });
            const c = Array.from(l).sort(),
              u = new Map();
            a.forEach((t) => {
              t.archers.forEach((t) => {
                if (!t || t.isSeparator || t.isTotalCalculator) return;
                if (n) {
                  if (
                    t.memberId !== n &&
                    !(H && !t.memberId && t.name && t.name.replace(/\s*\(\d+\)$/, '').trim() === H)
                  )
                    return;
                } else if ('custom' === e) {
                  if (selectedMembers.length > 0) {
                    if (!selectedMembers.includes(s(t.name || '不明'))) return;
                  } else if (!('all' === me || (t.name && t.name.toLowerCase().includes(me.toLowerCase()))))
                    return;
                }
                const l = s(t.name || '不明'),
                  o = t.memberId || l || 'unknown';
                u.has(o) || u.set(o, { id: t.memberId || '', name: l });
              });
            });
            const f = [...o, ...t];
            u.forEach((e, t) => {
              const l = f.find((t) => t.id === e.id || t.name === e.name);
              l && ((e.grade = l.grade), (e.name = l.name));
            });
            const m = Array.from(u.values()).sort((e, t) =>
                e.grade !== t.grade ? (e.grade || 9) - (t.grade || 9) : e.name.localeCompare(t.name, 'ja-JP')
              ),
              h = c.map((e) => {
                const t = e.split('/');
                return `${parseInt(t[1])}月${parseInt(t[2])}日`;
              });
            xlsxHeaders = ['氏名', '学年', '的中率', '的中数', '総矢数'].concat(h);
            m.forEach((e) => {
              let t = 0,
                l = 0;
              const o = [];
              c.forEach((n) => {
                let s = 0,
                  d2 = 0,
                  c2 = !1;
                a.forEach((t) => {
                  const l = new Date(t.date);
                  `${l.getFullYear()}/${(l.getMonth() + 1).toString().padStart(2, '0')}/${l.getDate().toString().padStart(2, '0')}` ===
                    n &&
                    t.archers.forEach((l) => {
                      if (!l || l.isSeparator || l.isTotalCalculator) return;
                      if (e.id ? l.memberId === e.id : l.name === e.name) {
                        c2 = !0;
                        const e2 = Array.isArray(l.marks) ? l.marks : [];
                        ((s += e2.filter((e) => '○' === e).length), (d2 += t.shotCount));
                      }
                    });
                });
                c2 ? (o.push(`${s}/${d2}`), (t += s), (l += d2)) : o.push('');
              });
              const n2 = l > 0 ? Number(((t / l) * 100).toFixed(1)) : 0;
              xlsxRows.push([e.name, null != e.grade ? e.grade : '', n2, t, l].concat(o));
            });
          }
          const stamp = csvDate(Date.now()),
            rangeLabel = 'fiscal' === e ? `${Ve}nendo` : 'custom' === e ? 'filtered' : 'all',
            fname = `kyudo_records_${rangeLabel}_${stamp}.xlsx`;
          if (!x.IS_WEB) {
            u.default.alert('未対応', '書き出しはWeb版のみ対応しています。');
            return;
          }
          if (0 === xlsxRows.length) {
            const msg = '対象のデータがありません';
            window.alert(msg);
            return;
          }
          await _xlsx.exportXlsx(
            xlsxHeaders,
            xlsxRows,
            fname,
            'matrix' === ye
              ? [16, 7, 9, 9, 9].concat(xlsxHeaders.slice(5).map(() => 9))
              : [12, 20, 14, 6, 8, 6, 9, 9, 9, 16, 24, 10],
            'matrix' === ye ? '集計' : '記録'
          );
        } catch (e) {
          console.error('Export Error:', e);
          const t = 'ファイルの生成に失敗しました。';
          x.IS_WEB ? window.alert(t) : u.default.alert('エラー', t);
        }
      },
      pickInquiryImage = async () => {
        try {
          if (inquiryImages.length >= 3) {
            const msg = '画像は最大3枚まで添付できます。';
            return void (x.IS_WEB ? window.alert(msg) : u.default.alert('エラー', msg));
          }
          const perm = await _G.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            const msg = '画像ライブラリへのアクセスが許可されていません。';
            return void (x.IS_WEB ? window.alert(msg) : u.default.alert('エラー', msg));
          }
          const res = await _G.launchImageLibraryAsync({
            mediaTypes: _G.MediaTypeOptions ? _G.MediaTypeOptions.Images : ['images'],
            quality: 0.8,
          });
          if (res.canceled || !res.assets || !res.assets.length) return;
          const asset = res.assets[0];
          let quality = 0.5,
            width = 1000,
            base64 = null;
          for (let attempt = 0; attempt < 5; attempt++) {
            const manipulated = await _IM.manipulateAsync(asset.uri, [{ resize: { width } }], {
              compress: quality,
              format: _IM.SaveFormat.JPEG,
              base64: !0,
            });
            base64 = manipulated.base64;
            if (!base64 || base64.length <= 300000) break;
            width = Math.round(width * 0.75);
            quality = Math.max(0.3, quality - 0.1);
          }
          if (!base64) {
            const msg = '画像の読み込みに失敗しました。';
            return void (x.IS_WEB ? window.alert(msg) : u.default.alert('エラー', msg));
          }
          if (base64.length > 300000) {
            const msg = '画像サイズが大きすぎます。別の画像（より小さいサイズ・低解像度）を選んでください。';
            return void (x.IS_WEB ? window.alert(msg) : u.default.alert('エラー', msg));
          }
          setInquiryImages((prev) => [...prev, `data:image/jpeg;base64,${base64}`]);
        } catch (e) {
          console.error('[Settings] Inquiry image pick error:', e);
        }
      },
      Ye = (e, t) =>
        (0, T.jsxs)(o.default, {
          style: D.section,
          children: [
            (0, T.jsx)(n.default, { style: D.sectionTitle, children: e }),
            (0, T.jsx)(o.default, { style: D.sectionContainer, children: t }),
          ],
        }),
      Je = (e, t, l, a = '#007AFF', s, d = !1) =>
        (0, T.jsxs)(h.default, {
          // 使い方の案内が指す先。行の名前をそのまま目印にする
          ref: (node) => 案内.setTutorialTargetNode(`設定.${t}`, node),
          style: ({ hovered: e }) => [D.item, e && D.hovered, x.IS_WEB && !!l && { cursor: 'pointer' }],
          onPress: l,
          disabled: !l,
          children: [
            (0, T.jsxs)(o.default, {
              style: D.itemLeft,
              children: [
                (0, T.jsx)(p.Ionicons, { name: e, size: 22, color: a, style: D.itemIcon }),
                (0, T.jsx)(n.default, { style: [D.itemText, d && { color: '#FF3B30' }], children: t }),
              ],
            }),
            (0, T.jsx)(o.default, {
              style: D.itemRight,
              children: s || (0, T.jsx)(p.Ionicons, { name: 'chevron-forward', size: 18, color: '#C6C6C8' }),
            }),
          ],
        });
    return (0, T.jsxs)(j.SafeAreaView, {
      style: D.safeArea,
      edges: ['left', 'right'],
      children: [
        (0, T.jsx)(F.CustomCalendarModal, {
          visible: je,
          onClose: () => Fe(!1),
          selectedDate: 'start' === Ce ? de : ue,
          onSelectDate: (e) => {
            ('start' === Ce ? ce(e) : fe(e), Fe(!1));
          },
          title: 'start' === Ce ? '開始日を選択' : '終了日を選択',
        }),
        (0, T.jsxs)(s.default, {
          style: D.container,
          children: [
            (0, T.jsx)(n.default, { style: D.headerTitle, children: '設定' }),
            Ye(
              'アカウント',
              (0, T.jsxs)(T.Fragment, {
                children: [
                  (0, T.jsxs)(o.default, {
                    style: D.item,
                    children: [
                      (0, T.jsxs)(o.default, {
                        style: D.itemLeft,
                        children: [
                          (0, T.jsx)(p.Ionicons, {
                            name: 'business-outline',
                            size: 22,
                            color: '#007AFF',
                            style: D.itemIcon,
                          }),
                          (0, T.jsx)(n.default, { style: D.itemText, children: '団体ID / 団体名' }),
                        ],
                      }),
                      (0, T.jsxs)(n.default, {
                        style: D.timestamp,
                        children: [L || '---', ' / ', $ || '未設定'],
                      }),
                    ],
                  }),
                  (0, T.jsxs)(o.default, {
                    style: D.item,
                    children: [
                      (0, T.jsxs)(o.default, {
                        style: D.itemLeft,
                        children: [
                          (0, T.jsx)(p.Ionicons, {
                            name: 'person-outline',
                            size: 22,
                            color: '#5856D6',
                            style: D.itemIcon,
                          }),
                          (0, T.jsx)(n.default, { style: D.itemText, children: 'ログイン種別' }),
                        ],
                      }),
                      (0, T.jsx)(n.default, {
                        style: D.timestamp,
                        children:
                          'group' === V
                            ? '団体アカウント'
                            : `メンバー (${(() => {
                                const e = O.find((e) => e.id === M);
                                return e?.personalId
                                  ? `ID: ${e.personalId} / ${e.name || H || ''}`
                                  : H || M || '---';
                              })()})`,
                      }),
                    ],
                  }),
                  // 初めての人向けの案内。初回は自動で出るが、ここからいつでも見返せる。
                  // ライブ中は始めない（案内中の書き換えが全員の画面に流れてしまう）
                  Je('school-outline', '使い方を見る', () => {
                    if ('ライブ中' === 案内.startTutorial()) {
                      const e = 'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。';
                      x.IS_WEB ? window.alert(e) : u.default.alert('使い方を見る', e);
                    }
                  }),
                  Je('help-circle-outline', '運用ガイド・ヘルプ', () => le(!0)),
                  Je(
                    'log-out-outline',
                    'ログアウト',
                    () => {
                      // ログアウトは手元の記録を全部捨てるので、送れていないものが
                      // 何件あるかを先に数えて確認に出す。送信するかどうかは
                      // 利用者が押してから
                      (残った未送信を設定(y.useScoreStore.getState().countUnsynced()),
                        ログアウトの段階を設定('確認'),
                        oe(!0));
                    },
                    '#FF3B30',
                    null,
                    !0
                  ),
                ],
              })
            ),
            Ye(
              '表示',
              (0, T.jsxs)(o.default, {
                style: [D.item, { flexDirection: 'column', alignItems: 'stretch' }],
                children: [
                  (0, T.jsxs)(o.default, {
                    style: [D.itemLeft, { marginBottom: 10 }],
                    children: [
                      (0, T.jsx)(p.Ionicons, {
                        name: 'contrast-outline',
                        size: 22,
                        color: '#5856D6',
                        style: { marginRight: 12 },
                      }),
                      (0, T.jsxs)(o.default, {
                        children: [
                          (0, T.jsx)(n.default, { style: D.itemText, children: '外観' }),
                          (0, T.jsx)(n.default, {
                            style: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
                            children: '画面全体の配色を切り替えます',
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, T.jsxs)(o.default, {
                    style: { flexDirection: 'row', marginHorizontal: -4 },
                    children: [
                      (0, T.jsx)(d.default, {
                        style: [D.radioBtn, themeMode === 'light' && D.radioBtnActive],
                        onPress: () => setThemeModeFn('light'),
                        children: (0, T.jsx)(n.default, {
                          style: [D.radioBtnText, themeMode === 'light' && D.radioBtnTextActive],
                          children: 'ライト',
                        }),
                      }),
                      (0, T.jsx)(d.default, {
                        style: [D.radioBtn, themeMode === 'dark' && D.radioBtnActive],
                        onPress: () => setThemeModeFn('dark'),
                        children: (0, T.jsx)(n.default, {
                          style: [D.radioBtnText, themeMode === 'dark' && D.radioBtnTextActive],
                          children: 'ダーク',
                        }),
                      }),
                      (0, T.jsx)(d.default, {
                        style: [D.radioBtn, themeMode === 'system' && D.radioBtnActive],
                        onPress: () => setThemeModeFn('system'),
                        children: (0, T.jsx)(n.default, {
                          style: [D.radioBtnText, themeMode === 'system' && D.radioBtnTextActive],
                          children: '端末に合わせる',
                        }),
                      }),
                    ],
                  }),
                ],
              })
            ),
            'member' !== V &&
              Ye(
                '基本設定',
                (0, T.jsxs)(T.Fragment, {
                  children: [
                    'group' === V &&
                      (0, T.jsx)(o.default, {
                        style: D.item,
                        children: (0, T.jsxs)(o.default, {
                          style: [D.itemLeft, { flex: 1 }],
                          children: [
                            (0, T.jsx)(p.Ionicons, {
                              name: 'business-outline',
                              size: 22,
                              color: '#007AFF',
                              style: D.itemIcon,
                            }),
                            (0, T.jsxs)(n.default, { style: D.itemText, children: ['団体ID: ', L] }),
                          ],
                        }),
                      }),
                    'group' === V &&
                      (0, T.jsxs)(o.default, {
                        style: [D.item, { flexDirection: 'column', alignItems: 'stretch' }],
                        children: [
                          (0, T.jsxs)(o.default, {
                            style: [D.itemLeft, { marginBottom: 8 }],
                            children: [
                              (0, T.jsx)(p.Ionicons, {
                                name: 'pencil-outline',
                                size: 22,
                                color: '#007AFF',
                                style: D.itemIcon,
                              }),
                              (0, T.jsx)(n.default, { style: D.itemText, children: '団体名' }),
                            ],
                          }),
                          (0, T.jsx)(m.default, {
                            style: D.filterInput,
                            placeholder: '団体名を入力',
                            value: $ || '',
                            onChangeText: _,
                          }),
                        ],
                      }),
                    'group' === V &&
                      (0, T.jsxs)(o.default, {
                        style: D.item,
                        children: [
                          (0, T.jsxs)(o.default, {
                            style: [D.itemLeft, { flex: 1 }],
                            children: [
                              (0, T.jsx)(p.Ionicons, {
                                name: 'sparkles-outline',
                                size: 22,
                                color: '#5856D6',
                                style: D.itemIcon,
                              }),
                              (0, T.jsxs)(o.default, {
                                style: { flex: 1, paddingRight: 8 },
                                children: [
                                  (0, T.jsx)(n.default, { style: D.itemText, children: '4月1日の自動進級' }),
                                  (0, T.jsx)(n.default, {
                                    style: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
                                    children: '毎年4月1日に自動で学年を更新し、4年生を卒業生へ移動します',
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, T.jsx)(c.default, {
                            value: K,
                            onValueChange: X,
                            trackColor: { false: '#D1D1D6', true: '#34C759' },
                          }),
                        ],
                      }),
                    'group' === V &&
                      (0, T.jsxs)(o.default, {
                        style: D.item,
                        children: [
                          (0, T.jsxs)(o.default, {
                            style: [D.itemLeft, { flex: 1 }],
                            children: [
                              (0, T.jsx)(p.Ionicons, {
                                name: 'school-outline',
                                size: 22,
                                color: '#AF52DE',
                                style: D.itemIcon,
                              }),
                              (0, T.jsxs)(o.default, {
                                style: { flex: 1, paddingRight: 8 },
                                children: [
                                  (0, T.jsx)(n.default, { style: D.itemText, children: '現在の期 (新入生)' }),
                                  (0, T.jsx)(n.default, {
                                    style: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
                                    children: '新入生（1年生）が何期生にあたるかを設定します',
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, T.jsxs)(o.default, {
                            style: D.stepperContainer,
                            children: [
                              (0, T.jsx)(m.default, {
                                style: [D.stepperValue, { width: 40, textAlign: 'center', padding: 0 }],
                                value: String(e),
                                onChangeText: (e) => {
                                  const t = parseInt(e.replace(/[^0-9]/g, ''));
                                  isNaN(t) ? '' === e && v(0) : v(t);
                                },
                                keyboardType: 'number-pad',
                              }),
                              (0, T.jsx)(n.default, {
                                style: { fontSize: 14, color: '#8E8E93', marginRight: 8 },
                                children: '期',
                              }),
                              (0, T.jsxs)(o.default, {
                                style: D.stepperControls,
                                children: [
                                  (0, T.jsx)(h.default, {
                                    style: ({ hovered: e }) => [
                                      D.stepperBtn,
                                      e && { backgroundColor: '#D1D1D6' },
                                    ],
                                    onPress: () => v(Math.max(1, e - 1)),
                                    children: (0, T.jsx)(p.Ionicons, {
                                      name: 'remove',
                                      size: 20,
                                      color: '#007AFF',
                                    }),
                                  }),
                                  (0, T.jsx)(o.default, { style: D.stepperDivider }),
                                  (0, T.jsx)(h.default, {
                                    style: ({ hovered: e }) => [
                                      D.stepperBtn,
                                      e && { backgroundColor: '#D1D1D6' },
                                    ],
                                    onPress: () => v(e + 1),
                                    children: (0, T.jsx)(p.Ionicons, {
                                      name: 'add',
                                      size: 20,
                                      color: '#007AFF',
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    'group' === V &&
                      (0, T.jsxs)(o.default, {
                        style: [D.item, { flexDirection: 'column', alignItems: 'stretch' }],
                        children: [
                          (0, T.jsx)(o.default, {
                            style: {
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 12,
                            },
                            children: (0, T.jsxs)(o.default, {
                              style: D.itemLeft,
                              children: [
                                (0, T.jsx)(p.Ionicons, {
                                  name: 'pricetags-outline',
                                  size: 22,
                                  color: '#FF9500',
                                  style: D.itemIcon,
                                }),
                                (0, T.jsx)(n.default, { style: D.itemText, children: 'タグの定型文' }),
                              ],
                            }),
                          }),
                          (0, T.jsx)(o.default, {
                            style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
                            children: q.map((e) =>
                              (0, T.jsxs)(
                                o.default,
                                {
                                  style: {
                                    backgroundColor: '#E5E5EA',
                                    borderRadius: 16,
                                    paddingLeft: 12,
                                    paddingRight: 6,
                                    paddingVertical: 4,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 4,
                                  },
                                  children: [
                                    (0, T.jsx)(n.default, {
                                      style: { fontSize: 13, color: '#000' },
                                      children: e,
                                    }),
                                    (0, T.jsx)(h.default, {
                                      onPress: () => Q(e),
                                      style: ({ hovered: e }) => [
                                        e && { opacity: 0.7 },
                                        x.IS_WEB && { cursor: 'pointer' },
                                      ],
                                      children: (0, T.jsx)(p.Ionicons, {
                                        name: 'close-circle',
                                        size: 18,
                                        color: '#8E8E93',
                                      }),
                                    }),
                                  ],
                                },
                                `template-${e}`
                              )
                            ),
                          }),
                          (0, T.jsxs)(o.default, {
                            style: { flexDirection: 'row', gap: 8 },
                            children: [
                              (0, T.jsx)(m.default, {
                                style: [D.filterInput, { flex: 1, paddingVertical: 8 }],
                                placeholder: '新しいタグを追加',
                                value: Se,
                                onChangeText: Ee,
                                onSubmitEditing: () => {
                                  Se.trim() &&
                                    (U(Se.trim().startsWith('#') ? Se.trim() : `#${Se.trim()}`), Ee(''));
                                },
                              }),
                              (0, T.jsx)(h.default, {
                                style: ({ hovered: e }) => [
                                  {
                                    backgroundColor: '#007AFF',
                                    borderRadius: 8,
                                    paddingHorizontal: 16,
                                    justifyContent: 'center',
                                  },
                                  e && { backgroundColor: '#0062CC' },
                                  x.IS_WEB && { cursor: 'pointer' },
                                ],
                                onPress: () => {
                                  Se.trim() &&
                                    (U(Se.trim().startsWith('#') ? Se.trim() : `#${Se.trim()}`), Ee(''));
                                },
                                children: (0, T.jsx)(n.default, {
                                  style: { color: '#FFF', fontWeight: 'bold' },
                                  children: '追加',
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                  ],
                })
              ),
            Ye(
              '矢所の記録',
              (0, T.jsxs)(T.Fragment, {
                children: [
                  (0, T.jsxs)(o.default, {
                    // 使い方の案内が指す先。この行は Je() を通らない作りなので、
                    // ここで直接登録する
                    ref: (node) => 案内.setTutorialTargetNode('設定.矢所の記録機能を有効化', node),
                    style: D.item,
                    children: [
                      (0, T.jsxs)(o.default, {
                        style: [D.itemLeft, { flex: 1 }],
                        children: [
                          (0, T.jsx)(p.Ionicons, {
                            name: 'location-outline',
                            size: 22,
                            color: '#34C759',
                            style: D.itemIcon,
                          }),
                          (0, T.jsxs)(o.default, {
                            style: { flex: 1, paddingRight: 8 },
                            children: [
                              (0, T.jsx)(n.default, {
                                style: D.itemText,
                                children: '矢所の記録機能を有効化',
                              }),
                              (0, T.jsx)(n.default, {
                                style: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
                                children: '記録時に矢所も記録できるようにします',
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, T.jsx)(c.default, {
                        value: enableArrowLocation,
                        onValueChange: setEnableArrowLocation,
                        trackColor: { false: '#D1D1D6', true: '#34C759' },
                      }),
                    ],
                  }),
                  enableArrowLocation &&
                    (0, T.jsxs)(o.default, {
                      style: [D.item, { flexDirection: 'column', alignItems: 'stretch' }],
                      children: [
                        (0, T.jsxs)(o.default, {
                          style: [D.itemLeft, { marginBottom: 8 }],
                          children: [
                            (0, T.jsx)(p.Ionicons, {
                              name: 'disc-outline',
                              size: 22,
                              color: '#34C759',
                              style: D.itemIcon,
                            }),
                            (0, T.jsx)(n.default, { style: D.itemText, children: '使用する的の種類' }),
                          ],
                        }),
                        (0, T.jsxs)(o.default, {
                          style: D.flexRow,
                          children: [
                            (0, T.jsx)(d.default, {
                              onPress: () => setArrowTargetType('kasumi36'),
                              style: [D.radioBtn, 'kasumi36' === arrowTargetType && D.radioBtnActive],
                              children: (0, T.jsx)(n.default, {
                                style: [
                                  D.radioBtnText,
                                  'kasumi36' === arrowTargetType && D.radioBtnTextActive,
                                ],
                                children: '霞的',
                              }),
                            }),
                            (0, T.jsx)(d.default, {
                              onPress: () => setArrowTargetType('hoshi36'),
                              style: [D.radioBtn, 'hoshi36' === arrowTargetType && D.radioBtnActive],
                              children: (0, T.jsx)(n.default, {
                                style: [
                                  D.radioBtnText,
                                  'hoshi36' === arrowTargetType && D.radioBtnTextActive,
                                ],
                                children: '星的',
                              }),
                            }),
                            (0, T.jsx)(d.default, {
                              onPress: () => setArrowTargetType('hoshi24'),
                              style: [D.radioBtn, 'hoshi24' === arrowTargetType && D.radioBtnActive],
                              children: (0, T.jsx)(n.default, {
                                style: [
                                  D.radioBtnText,
                                  'hoshi24' === arrowTargetType && D.radioBtnTextActive,
                                ],
                                children: '星的(八寸)',
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                ],
              })
            ),
            'member' !== V &&
              Ye(
                '管理者設定',
                (0, T.jsxs)(o.default, {
                  style: D.item,
                  // 使い方の案内から指せるように登録する
                  ref: (node) => 案内.setTutorialTargetNode('設定.管理者モード', node),
                  children: [
                    (0, T.jsxs)(o.default, {
                      style: [D.itemLeft, { flex: 1 }],
                      children: [
                        (0, T.jsx)(p.Ionicons, {
                          name: 'shield-checkmark-outline',
                          size: 22,
                          color: '#FF3B30',
                          style: D.itemIcon,
                        }),
                        (0, T.jsxs)(o.default, {
                          style: { flex: 1, paddingRight: 8 },
                          children: [
                            (0, T.jsx)(n.default, { style: D.itemText, children: '管理者モード' }),
                            (0, T.jsx)(n.default, {
                              style: { fontSize: 11, color: '#8E8E93', marginTop: 2, flexShrink: 1 },
                              numberOfLines: 0,
                              children:
                                'オンにすると、保存済みの記録をあとから直せます。各部員の個人ID（数字）も表示されます',
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, T.jsx)(c.default, {
                      value: G,
                      onValueChange: async (e) => {
                        e ? (Pe(''), ke(!0)) : Y(!1);
                      },
                      trackColor: { false: '#D1D1D6', true: '#FF3B30' },
                    }),
                  ],
                })
              ),
            Ye(
              'データ管理',
              (0, T.jsxs)(T.Fragment, {
                children: [
                  'member' === V &&
                    (0, T.jsxs)(o.default, {
                      style: {
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: '#FFF9E6',
                        marginBottom: 8,
                        borderRadius: 8,
                        marginHorizontal: 16,
                      },
                      children: [
                        (0, T.jsxs)(o.default, {
                          style: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
                          children: [
                            (0, T.jsx)(p.Ionicons, {
                              name: 'information-circle-outline',
                              size: 18,
                              color: '#FF9500',
                            }),
                            (0, T.jsx)(n.default, {
                              style: { fontSize: 13, fontWeight: 'bold', color: '#FF9500', marginLeft: 4 },
                              children: '個人用モードの同期について',
                            }),
                          ],
                        }),
                        (0, T.jsx)(n.default, {
                          style: { fontSize: 12, color: '#666', lineHeight: 18 },
                          children:
                            '同期時、クラウドには自分を含む全員の記録が送信されますが、完了後にこの端末からは自分以外の氏名や的中データが自動的に削除されます。これにより、履歴や分析には自分のデータのみが表示されるようになります。',
                        }),
                      ],
                    }),
                  Je(
                    'share-outline',
                    'データをExcel形式で書き出し',
                    async () => {
                      ee(!0);
                    },
                    '#34C759'
                  ),
                  (0, T.jsxs)(o.default, {
                    style: D.item,
                    children: [
                      (0, T.jsxs)(o.default, {
                        style: D.itemLeft,
                        children: [
                          (0, T.jsx)(p.Ionicons, {
                            name: 'notifications-outline',
                            size: 22,
                            color: '#FF9500',
                            style: D.itemIcon,
                          }),
                          (0, T.jsx)(n.default, { style: D.itemText, children: '同期エラーを通知' }),
                        ],
                      }),
                      (0, T.jsx)(c.default, {
                        value: A,
                        onValueChange: k,
                        trackColor: { false: '#D1D1D6', true: '#34C759' },
                      }),
                    ],
                  }),
                  Je('mail-outline', 'お問い合わせ', () => setInquiryVisible(true), '#FF9500'),
                  (0, T.jsxs)(h.default, {
                    style: ({ hovered: e }) => [D.item, e && D.hovered, x.IS_WEB && { cursor: 'pointer' }],
                    onPress: W,
                    children: [
                      (0, T.jsxs)(o.default, {
                        style: D.itemLeft,
                        children: [
                          (0, T.jsx)(p.Ionicons, {
                            name: 'cloud-upload-outline',
                            size: 22,
                            color: '#5856D6',
                            style: D.itemIcon,
                          }),
                          (0, T.jsx)(n.default, { style: D.itemText, children: 'クラウドへ同期' }),
                        ],
                      }),
                      (0, T.jsxs)(o.default, {
                        style: D.itemRight,
                        children: [
                          (0, T.jsx)(n.default, {
                            style: D.timestamp,
                            children: P ? new Date(P).toLocaleTimeString('ja-JP') : '同期済み' === z ? '' : z,
                          }),
                          (0, T.jsx)(p.Ionicons, { name: 'chevron-forward', size: 18, color: '#C6C6C8' }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
            ),
            (0, T.jsxs)(o.default, {
              style: D.footer,
              children: [
                (0, T.jsx)(n.default, {
                  style: D.versionText,
                  children: 'Version 2.0.0 (Expo SQLite/Firebase)',
                }),
                (0, T.jsxs)(n.default, {
                  style: D.statusText,
                  children: [
                    '● ',
                    R ? 'Firebase 接続済み' : '未接続',
                    ' | ',
                    P ? `最終同期: ${new Date(P).toLocaleString('ja-JP')}` : z,
                  ],
                }),
              ],
            }),
          ],
        }),
        (0, T.jsx)(f.default, {
          visible: Z,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => ee(!1),
          children: (0, T.jsxs)(o.default, {
            style: D.modalBackdrop,
            children: [
              (0, T.jsx)(d.default, {
                style: a.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => ee(!1),
              }),
              (0, T.jsxs)(o.default, {
                style: D.modalContent,
                children: [
                  (0, T.jsx)(n.default, { style: D.modalTitle, children: 'Excel形式で書き出し' }),
                  De
                    ? (0, T.jsxs)(s.default, {
                        style: { width: '100%', maxHeight: 450 },
                        children: [
                          (0, T.jsxs)(o.default, {
                            style: D.filterGroup,
                            children: [
                              (0, T.jsx)(n.default, { style: D.filterLabel, children: '出力形式' }),
                              (0, T.jsxs)(o.default, {
                                style: D.flexRow,
                                children: [
                                  (0, T.jsx)(d.default, {
                                    onPress: () => pe('standard'),
                                    style: [D.radioBtn, 'standard' === ye && D.radioBtnActive],
                                    children: (0, T.jsx)(n.default, {
                                      style: [D.radioBtnText, 'standard' === ye && D.radioBtnTextActive],
                                      children: '標準形式',
                                    }),
                                  }),
                                  (0, T.jsx)(d.default, {
                                    onPress: () => pe('matrix'),
                                    style: [D.radioBtn, 'matrix' === ye && D.radioBtnActive],
                                    children: (0, T.jsx)(n.default, {
                                      style: [D.radioBtnText, 'matrix' === ye && D.radioBtnTextActive],
                                      children: '印刷向形式',
                                    }),
                                  }),
                                ],
                              }),
                              (0, T.jsx)(n.default, {
                                style: D.ratioHintText,
                                children:
                                  'standard' === ye
                                    ? '1行に1記録を出力します。データ加工に適しています。'
                                    : 'メンバーを各行、日付を各列に配置します。掲示や閱覧に適しています。',
                              }),
                            ],
                          }),
                          (0, T.jsxs)(o.default, {
                            style: D.filterGroup,
                            children: [
                              (0, T.jsx)(n.default, { style: D.filterLabel, children: '日付範囲' }),
                              (0, T.jsxs)(o.default, {
                                style: D.flexRow,
                                children: [
                                  (0, T.jsx)(d.default, {
                                    style: D.dateSelector,
                                    onPress: () => {
                                      (be('start'), Fe(!0));
                                    },
                                    children: (0, T.jsx)(n.default, {
                                      style: D.dateSelectorText,
                                      children: de.toLocaleDateString('ja-JP'),
                                    }),
                                  }),
                                  (0, T.jsx)(n.default, { style: { marginHorizontal: 8 }, children: '〜' }),
                                  (0, T.jsx)(d.default, {
                                    style: D.dateSelector,
                                    onPress: () => {
                                      (be('end'), Fe(!0));
                                    },
                                    children: (0, T.jsx)(n.default, {
                                      style: D.dateSelectorText,
                                      children: ue.toLocaleDateString('ja-JP'),
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, T.jsxs)(o.default, {
                            style: D.filterGroup,
                            children: [
                              (0, T.jsx)(n.default, {
                                style: D.filterLabel,
                                children: 'キーワード (タイトル・メモ)',
                              }),
                              (0, T.jsx)(m.default, {
                                style: D.filterInput,
                                placeholder: 'キーワードで絞り込み',
                                value: xe,
                                onChangeText: ge,
                                onFocus: () => setShowTitleSuggestions(!0),
                                onBlur: () => setTimeout(() => setShowTitleSuggestions(!1), 200),
                                placeholderTextColor: '#C6C6C8',
                              }),
                              titleSuggestions.length > 0 &&
                                (0, T.jsx)(s.default, {
                                  ref: titleRefCallback,
                                  horizontal: !0,
                                  keyboardShouldPersistTaps: 'always',
                                  showsHorizontalScrollIndicator: !1,
                                  style: [D.suggestionsContainer, x.IS_WEB && { overflowX: 'auto' }],
                                  children: titleSuggestions.map((e) => {
                                    const t = selectedKeywords.includes(e);
                                    return (0, T.jsx)(
                                      d.default,
                                      {
                                        onPress: () =>
                                          setSelectedKeywords((t) =>
                                            t.includes(e) ? t.filter((t) => t !== e) : [...t, e]
                                          ),
                                        style: [D.suggestionChip, t && { backgroundColor: '#007AFF' }],
                                        children: (0, T.jsx)(n.default, {
                                          style: [D.suggestionText, t && { color: '#FFF' }],
                                          children: e,
                                        }),
                                      },
                                      `suggest-title-${e}`
                                    );
                                  }),
                                }),
                              selectedKeywords.length > 0 &&
                                (0, T.jsx)(d.default, {
                                  onPress: () => setSelectedKeywords([]),
                                  style: { marginTop: 4, alignSelf: 'flex-start' },
                                  children: (0, T.jsx)(n.default, {
                                    style: { fontSize: 12, color: '#007AFF' },
                                    children: '選択をクリア',
                                  }),
                                }),
                            ],
                          }),
                          'member' !== V &&
                            (0, T.jsxs)(o.default, {
                              style: D.filterGroup,
                              children: [
                                (0, T.jsx)(n.default, { style: D.filterLabel, children: 'メンバー名' }),
                                (0, T.jsx)(m.default, {
                                  style: D.filterInput,
                                  placeholder: '未入力ですべて対象',
                                  value: 'all' === me ? '' : me,
                                  onChangeText: (e) => he(e || 'all'),
                                  onFocus: () => setShowMemberSuggestions(!0),
                                  onBlur: () => setTimeout(() => setShowMemberSuggestions(!1), 200),
                                  placeholderTextColor: '#C6C6C8',
                                }),
                                memberSuggestions.length > 0 &&
                                  (0, T.jsx)(s.default, {
                                    ref: memberRefCallback,
                                    horizontal: !0,
                                    keyboardShouldPersistTaps: 'always',
                                    showsHorizontalScrollIndicator: !1,
                                    style: [D.suggestionsContainer, x.IS_WEB && { overflowX: 'auto' }],
                                    children: memberSuggestions.map((e) => {
                                      const t = selectedMembers.includes(e);
                                      return (0, T.jsx)(
                                        d.default,
                                        {
                                          onPress: () =>
                                            setSelectedMembers((t) =>
                                              t.includes(e) ? t.filter((t) => t !== e) : [...t, e]
                                            ),
                                          style: [D.suggestionChip, t && { backgroundColor: '#007AFF' }],
                                          children: (0, T.jsx)(n.default, {
                                            style: [D.suggestionText, t && { color: '#FFF' }],
                                            children: e,
                                          }),
                                        },
                                        `suggest-member-${e}`
                                      );
                                    }),
                                  }),
                                selectedMembers.length > 0 &&
                                  (0, T.jsx)(d.default, {
                                    onPress: () => setSelectedMembers([]),
                                    style: { marginTop: 4, alignSelf: 'flex-start' },
                                    children: (0, T.jsx)(n.default, {
                                      style: { fontSize: 12, color: '#007AFF' },
                                      children: '選択をクリア',
                                    }),
                                  }),
                              ],
                            }),
                          (0, T.jsxs)(o.default, {
                            style: D.filterGroup,
                            children: [
                              (0, T.jsxs)(o.default, {
                                style: {
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 4,
                                },
                                children: [
                                  (0, T.jsx)(n.default, { style: D.filterLabel, children: 'タグ絞り込み' }),
                                  (0, T.jsxs)(o.default, {
                                    style: {
                                      flexDirection: 'row',
                                      backgroundColor: '#E5E5EA',
                                      borderRadius: 8,
                                      padding: 2,
                                    },
                                    children: [
                                      (0, T.jsx)(d.default, {
                                        onPress: () => we('AND'),
                                        style: [
                                          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                                          'AND' === Te && { backgroundColor: '#FFF' },
                                        ],
                                        children: (0, T.jsx)(n.default, {
                                          style: {
                                            fontSize: 11,
                                            fontWeight: 'bold',
                                            color: 'AND' === Te ? '#007AFF' : '#8E8E93',
                                          },
                                          children: 'すべて含む',
                                        }),
                                      }),
                                      (0, T.jsx)(d.default, {
                                        onPress: () => we('OR'),
                                        style: [
                                          { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
                                          'OR' === Te && { backgroundColor: '#FFF' },
                                        ],
                                        children: (0, T.jsx)(n.default, {
                                          style: {
                                            fontSize: 11,
                                            fontWeight: 'bold',
                                            color: 'OR' === Te ? '#007AFF' : '#8E8E93',
                                          },
                                          children: 'いずれか含む',
                                        }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, T.jsx)(o.default, {
                                style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
                                children:
                                  Oe.length > 0
                                    ? Oe.map((e) => {
                                        const t = Be.includes(e);
                                        return (0, T.jsx)(
                                          d.default,
                                          {
                                            onPress: () => Ne(e),
                                            style: [
                                              D.tagChip,
                                              t && D.tagChipActive,
                                              {
                                                backgroundColor: t ? '#007AFF' : '#F2F2F7',
                                                paddingVertical: 6,
                                                marginVertical: 2,
                                              },
                                            ],
                                            children: (0, T.jsx)(n.default, {
                                              style: [D.tagChipText, t && { color: '#FFF' }],
                                              children: e.replace(/^#/, ''),
                                            }),
                                          },
                                          `export-tag-${e}`
                                        );
                                      })
                                    : (0, T.jsx)(n.default, {
                                        style: { fontSize: 12, color: '#8E8E93' },
                                        children: '使用されているタグがありません',
                                      }),
                              }),
                              Be.length > 0 &&
                                (0, T.jsx)(d.default, {
                                  onPress: () => Ie([]),
                                  style: { marginTop: 8 },
                                  children: (0, T.jsx)(n.default, {
                                    style: { fontSize: 12, color: '#007AFF' },
                                    children: '選択をクリア',
                                  }),
                                }),
                            ],
                          }),
                          (0, T.jsxs)(o.default, {
                            style: [D.modalButtons, { marginTop: 20 }],
                            children: [
                              (0, T.jsx)(h.default, {
                                style: ({ hovered: e }) => [
                                  D.modalBtn,
                                  { backgroundColor: '#007AFF' },
                                  e && { backgroundColor: '#0062CC' },
                                  x.IS_WEB && { cursor: 'pointer' },
                                ],
                                onPress: () => {
                                  (ee(!1), ve(!1), Ge('custom'));
                                },
                                children: (0, T.jsx)(n.default, {
                                  style: [D.modalBtnText, { color: '#FFF' }],
                                  children: 'この条件で書き出す',
                                }),
                              }),
                              (0, T.jsx)(h.default, {
                                style: ({ hovered: e }) => [
                                  D.modalBtn,
                                  { backgroundColor: '#F2F2F7' },
                                  e && { backgroundColor: '#E5E5EA' },
                                  x.IS_WEB && { cursor: 'pointer' },
                                ],
                                onPress: () => ve(!1),
                                children: (0, T.jsx)(n.default, {
                                  style: [D.modalBtnText, { color: '#007AFF' }],
                                  children: '戻る',
                                }),
                              }),
                            ],
                          }),
                        ],
                      })
                    : (0, T.jsxs)(T.Fragment, {
                        children: [
                          (0, T.jsx)(n.default, {
                            style: D.modalMessage,
                            children: '書き出すデータの範囲を選択してください。',
                          }),
                          (0, T.jsxs)(o.default, {
                            style: D.modalButtons,
                            children: [
                              (0, T.jsx)(h.default, {
                                style: ({ hovered: e }) => [
                                  D.modalBtn,
                                  { backgroundColor: '#F2F2F7' },
                                  e && { backgroundColor: '#E5E5EA' },
                                  x.IS_WEB && { cursor: 'pointer' },
                                ],
                                onPress: () => ee(!1),
                                children: (0, T.jsx)(n.default, {
                                  style: [D.modalBtnText, { color: '#007AFF' }],
                                  children: 'キャンセル',
                                }),
                              }),
                              (0, T.jsxs)(o.default, {
                                style: D.monthNav,
                                children: [
                                  (0, T.jsx)(d.default, {
                                    style: D.monthNavBtn,
                                    onPress: () => He(-1),
                                    children: (0, T.jsx)(p.Ionicons, {
                                      name: 'chevron-back',
                                      size: 20,
                                      color: '#007AFF',
                                    }),
                                  }),
                                  (0, T.jsxs)(n.default, {
                                    style: D.monthNavText,
                                    children: [Ve, '年度のデータ'],
                                  }),
                                  (0, T.jsx)(d.default, {
                                    style: D.monthNavBtn,
                                    onPress: () => He(1),
                                    children: (0, T.jsx)(p.Ionicons, {
                                      name: 'chevron-forward',
                                      size: 20,
                                      color: '#007AFF',
                                    }),
                                  }),
                                ],
                              }),
                              (0, T.jsx)(h.default, {
                                style: ({ hovered: e }) => [
                                  D.modalBtn,
                                  { backgroundColor: '#007AFF', marginTop: 8 },
                                  e && { backgroundColor: '#0062CC' },
                                  x.IS_WEB && { cursor: 'pointer' },
                                ],
                                onPress: () => {
                                  (ee(!1), Ge('fiscal'));
                                },
                                children: (0, T.jsxs)(n.default, {
                                  style: [D.modalBtnText, { color: '#FFF' }],
                                  children: [Ve, '年度を書き出す'],
                                }),
                              }),
                              (0, T.jsx)(h.default, {
                                style: ({ hovered: e }) => [
                                  D.modalBtn,
                                  { backgroundColor: '#34C759' },
                                  e && { backgroundColor: '#28A745' },
                                  x.IS_WEB && { cursor: 'pointer' },
                                ],
                                onPress: () => {
                                  (ee(!1), Ge('all'));
                                },
                                children: (0, T.jsx)(n.default, {
                                  style: [D.modalBtnText, { color: '#FFF' }],
                                  children: 'すべてのデータ',
                                }),
                              }),
                              (0, T.jsx)(h.default, {
                                style: ({ hovered: e }) => [
                                  D.modalBtn,
                                  { backgroundColor: '#5856D6' },
                                  e && { backgroundColor: '#4845C6' },
                                  x.IS_WEB && { cursor: 'pointer' },
                                ],
                                onPress: () => ve(!0),
                                children: (0, T.jsx)(n.default, {
                                  style: [D.modalBtnText, { color: '#FFF' }],
                                  children: '詳細な条件で絞り込む...',
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                ],
              }),
            ],
          }),
        }),
        (0, T.jsx)(f.default, {
          visible: Ae,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => ke(!1),
          children: (0, T.jsxs)(o.default, {
            style: D.modalBackdrop,
            children: [
              (0, T.jsx)(d.default, {
                style: a.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => !Re && ke(!1),
              }),
              (0, T.jsxs)(o.default, {
                style: D.modalContent,
                children: [
                  (0, T.jsx)(n.default, { style: D.modalTitle, children: '管理者認証' }),
                  (0, T.jsx)(n.default, {
                    style: D.modalMessage,
                    children: '団体パスワードを入力してください',
                  }),
                  (0, T.jsxs)(o.default, {
                    style: [
                      D.filterInput,
                      {
                        width: '100%',
                        marginBottom: 15,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                      },
                    ],
                    children: [
                      (0, T.jsx)(m.default, {
                        style: { flex: 1, height: 48, fontSize: 16 },
                        placeholder: 'パスワード',
                        secureTextEntry: !showPw,
                        value: ze,
                        onChangeText: Pe,
                        autoFocus: !0,
                      }),
                      (0, T.jsx)(h.default, {
                        onPress: () => setShowPw(!showPw),
                        style: { padding: 4 },
                        children: (0, T.jsx)(p.Ionicons, {
                          name: showPw ? 'eye-off' : 'eye',
                          size: 20,
                          color: '#8E8E93',
                        }),
                      }),
                    ],
                  }),
                  (0, T.jsxs)(o.default, {
                    style: D.modalButtonsRow,
                    children: [
                      (0, T.jsx)(h.default, {
                        style: ({ hovered: e }) => [
                          D.modalBtn,
                          { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                          e && { backgroundColor: '#E5E5EA' },
                          x.IS_WEB && { cursor: 'pointer' },
                        ],
                        onPress: () => ke(!1),
                        disabled: Re,
                        children: (0, T.jsx)(n.default, {
                          style: [D.modalBtnText, { color: '#007AFF' }],
                          children: 'キャンセル',
                        }),
                      }),
                      (0, T.jsx)(h.default, {
                        style: ({ hovered: e }) => [
                          D.modalBtn,
                          { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                          e && { backgroundColor: '#0062CC' },
                          x.IS_WEB && { cursor: 'pointer' },
                        ],
                        onPress: async () => {
                          if (ze) {
                            We(!0);
                            try {
                              (await J(ze))
                                ? (Y(!0), ke(!1), Pe(''))
                                : u.default.alert('エラー', 'パスワードが正しくありません。');
                            } catch (e) {
                              u.default.alert('エラー', '認証に失敗しました。');
                            } finally {
                              We(!1);
                            }
                          }
                        },
                        disabled: Re || !ze,
                        children: (0, T.jsx)(n.default, {
                          style: [D.modalBtnText, { color: '#FFF' }],
                          children: Re ? '認証中...' : '認証',
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        (0, T.jsx)(f.default, {
          visible: re,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => oe(!1),
          children: (0, T.jsxs)(o.default, {
            style: D.modalBackdrop,
            children: [
              (0, T.jsx)(d.default, {
                style: a.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => oe(!1),
              }),
              (0, T.jsxs)(o.default, {
                style: D.modalContent,
                children: [
                  (0, T.jsx)(n.default, { style: D.modalTitle, children: 'ログアウト' }),
                  (0, T.jsx)(n.default, {
                    style: D.modalMessage,
                    children: ログアウトの文言(ログアウトの段階, 残った未送信),
                  }),
                  (0, T.jsxs)(o.default, {
                    style: D.modalButtonsRow,
                    children: [
                      (0, T.jsx)(h.default, {
                        style: ({ hovered: e }) => [
                          D.modalBtn,
                          { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                          e && { backgroundColor: '#E5E5EA' },
                          x.IS_WEB && { cursor: 'pointer' },
                          ログアウトのボタンを止める(ログアウトの段階) && { opacity: 0.4 },
                        ],
                        disabled: ログアウトのボタンを止める(ログアウトの段階),
                        onPress: () => oe(!1),
                        children: (0, T.jsx)(n.default, {
                          style: [D.modalBtnText, { color: '#007AFF' }],
                          children: 'キャンセル',
                        }),
                      }),
                      (0, T.jsx)(h.default, {
                        style: ({ hovered: e }) => [
                          D.modalBtn,
                          { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                          e && { backgroundColor: '#D63027' },
                          x.IS_WEB && { cursor: 'pointer' },
                          ログアウトのボタンを止める(ログアウトの段階) && { opacity: 0.4 },
                        ],
                        disabled: ログアウトのボタンを止める(ログアウトの段階),
                        onPress: async () => {
                          // 未送信があるうちは、まず送信を試す。送れなかったときだけ
                          // 「捨てて抜ける」を選べるようにする
                          if (先に送信すべきか(ログアウトの段階, 残った未送信)) {
                            ログアウトの段階を設定('送信中');
                            let 残り = 残った未送信;
                            try {
                              残り = await y.useScoreStore.getState().flushUnsyncedForLogout();
                            } catch (e) {
                              残り = y.useScoreStore.getState().countUnsynced();
                            }
                            残った未送信を設定(残り);
                            if (残り > 0) return void ログアウトの段階を設定('失敗');
                            ログアウトの段階を設定('送信済み');
                            await new Promise((e) => setTimeout(e, 900));
                          }
                          oe(!1);
                          try {
                            if ('member' === V && E.auth.currentUser) {
                              await _F
                                .deleteDoc(_F.doc(E.db, 'member_claims', E.auth.currentUser.uid))
                                .catch(() => {});
                            }
                            (await (0, B.signOut)(E.auth), N(null, null, null, null));
                          } catch (e) {
                            console.error('Logout error:', e);
                          }
                        },
                        children: (0, T.jsx)(n.default, {
                          style: [D.modalBtnText, { color: '#FFF' }],
                          children: ログアウトのボタン名(ログアウトの段階, 残った未送信),
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        (0, T.jsx)(f.default, {
          visible: te,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => le(!1),
          children: (0, T.jsxs)(o.default, {
            style: D.modalBackdrop,
            children: [
              (0, T.jsx)(d.default, {
                style: a.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => le(!1),
              }),
              (0, T.jsxs)(o.default, {
                style: D.modalContent,
                children: [
                  (0, T.jsx)(n.default, { style: D.modalTitle, children: '運用ガイド' }),
                  (0, T.jsxs)(o.default, {
                    style: {
                      width: '100%',
                      marginBottom: 20,
                      backgroundColor: '#FFF9E6',
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#FFE066',
                      marginTop: 8,
                    },
                    children: [
                      (0, T.jsxs)(o.default, {
                        style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
                        children: [
                          (0, T.jsx)(p.Ionicons, { name: 'alert-circle', size: 18, color: '#FF9500' }),
                          (0, T.jsx)(n.default, {
                            style: { fontSize: 14, fontWeight: 'bold', color: '#FF9500', marginLeft: 6 },
                            children: 'セキュリティとログイン',
                          }),
                        ],
                      }),
                      (0, T.jsxs)(n.default, {
                        style: { fontSize: 13, color: '#666', lineHeight: 20 },
                        children: [
                          '・「団体ID」はメンバーログインに必要です。メンバー全員に共有してください。',
                          '\n',
                          '・「パスワード」は管理者のみが知るものとして厳重に保管してください。',
                          '\n',
                          '・メールアドレス変更の際は、セキュリティ保護のため旧アドレス宛に確認メールが自動送信されます。',
                        ],
                      }),
                    ],
                  }),
                  (0, T.jsx)(h.default, {
                    style: ({ hovered: e }) => [
                      D.modalBtn,
                      { backgroundColor: '#F2F2F7', width: '100%' },
                      e && { backgroundColor: '#E5E5EA' },
                      x.IS_WEB && { cursor: 'pointer' },
                    ],
                    onPress: () => le(!1),
                    children: (0, T.jsx)(n.default, {
                      style: [D.modalBtnText, { color: '#007AFF' }],
                      children: '閉じる',
                    }),
                  }),
                ],
              }),
            ],
          }),
        }),
        (0, T.jsx)(F.CustomCalendarModal, {
          visible: je,
          onClose: () => Fe(!1),
          selectedDate: 'start' === Ce ? de : ue,
          onSelectDate: (e) => {
            'start' === Ce ? ce(e) : fe(e);
          },
          title: 'start' === Ce ? '開始日を選択' : '終了日を選択',
        }),
        (0, T.jsx)(f.default, {
          visible: inquiryVisible,
          transparent: true,
          animationType: 'fade',
          onRequestClose: () => !inquirySending && setInquiryVisible(false),
          children: (0, T.jsxs)(o.default, {
            style: D.modalBackdrop,
            children: [
              (0, T.jsx)(d.default, {
                style: a.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => !inquirySending && setInquiryVisible(false),
              }),
              (0, T.jsxs)(o.default, {
                style: D.modalContent,
                children: [
                  (0, T.jsx)(n.default, {
                    style: D.modalTitle,
                    children: 'お問い合わせ',
                  }),
                  (0, T.jsx)(n.default, {
                    style: { fontSize: 13, color: '#8E8E93', marginBottom: 12, textAlign: 'center' },
                    children: '開発者へお問い合わせを送信します',
                  }),
                  (0, T.jsx)(m.default, {
                    style: [D.filterInput, { width: '100%', marginBottom: 10 }],
                    placeholder: 'メールアドレス',
                    value: inquiryEmail,
                    onChangeText: (e) => setInquiryEmail(e),
                    keyboardType: 'email-address',
                    autoCapitalize: 'none',
                    editable: !inquirySending,
                  }),
                  (0, T.jsx)(m.default, {
                    style: [
                      D.filterInput,
                      { width: '100%', marginBottom: 15, height: 120, textAlignVertical: 'top' },
                    ],
                    placeholder: 'お問い合わせ内容',
                    value: inquiryContent,
                    onChangeText: (e) => setInquiryContent(e),
                    multiline: true,
                    editable: !inquirySending,
                  }),
                  inquiryImages.length > 0
                    ? (0, T.jsx)(_RN.ScrollView, {
                        horizontal: true,
                        showsHorizontalScrollIndicator: false,
                        style: { width: '100%', marginBottom: 10 },
                        contentContainerStyle: { gap: 8 },
                        children: inquiryImages.map((uri, idx) =>
                          (0, T.jsxs)(
                            _RN.View,
                            {
                              style: { width: 100, height: 100, position: 'relative' },
                              children: [
                                (0, T.jsx)(_RN.Image, {
                                  source: { uri },
                                  style: {
                                    width: 100,
                                    height: 100,
                                    borderRadius: 8,
                                    backgroundColor: '#F2F2F7',
                                  },
                                  resizeMode: 'cover',
                                }),
                                (0, T.jsx)(h.default, {
                                  onPress: () => setInquiryImages((prev) => prev.filter((_, i) => i !== idx)),
                                  disabled: inquirySending,
                                  style: {
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    borderRadius: 10,
                                    padding: 3,
                                  },
                                  children: (0, T.jsx)(p.Ionicons, {
                                    name: 'close',
                                    size: 14,
                                    color: '#FFF',
                                  }),
                                }),
                              ],
                            },
                            `inquiry-img-${idx}`
                          )
                        ),
                      })
                    : null,
                  inquiryImages.length < 3
                    ? (0, T.jsxs)(h.default, {
                        onPress: pickInquiryImage,
                        disabled: inquirySending,
                        style: ({ hovered: e }) => [
                          {
                            width: '100%',
                            marginBottom: 15,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            borderWidth: 1,
                            borderColor: '#C6C6C8',
                            borderStyle: 'dashed',
                            borderRadius: 8,
                            paddingVertical: 12,
                          },
                          e && { backgroundColor: '#F2F2F7' },
                          x.IS_WEB && { cursor: 'pointer' },
                        ],
                        children: [
                          (0, T.jsx)(p.Ionicons, { name: 'image-outline', size: 18, color: '#8E8E93' }),
                          (0, T.jsx)(n.default, {
                            style: { fontSize: 13, color: '#8E8E93' },
                            children:
                              inquiryImages.length > 0
                                ? '画像を追加（任意・最大3枚）'
                                : '画像を添付（任意・最大3枚）',
                          }),
                        ],
                      })
                    : null,
                  (0, T.jsxs)(o.default, {
                    style: D.modalButtonsRow,
                    children: [
                      (0, T.jsx)(h.default, {
                        style: ({ hovered: e }) => [
                          D.modalBtn,
                          { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                          e && { backgroundColor: '#E5E5EA' },
                          x.IS_WEB && { cursor: 'pointer' },
                        ],
                        onPress: () => {
                          setInquiryVisible(false);
                          setInquiryEmail('');
                          setInquiryContent('');
                          setInquiryImages([]);
                        },
                        disabled: inquirySending,
                        children: (0, T.jsx)(n.default, {
                          style: [D.modalBtnText, { color: '#007AFF' }],
                          children: 'キャンセル',
                        }),
                      }),
                      (0, T.jsx)(h.default, {
                        style: ({ hovered: e }) => [
                          D.modalBtn,
                          { backgroundColor: '#FF9500', flex: 1, marginLeft: 5 },
                          e && { backgroundColor: '#E68A00' },
                          x.IS_WEB && { cursor: 'pointer' },
                        ],
                        onPress: async () => {
                          const emailVal = inquiryEmail;
                          const contentVal = inquiryContent;
                          if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                            const msg = '有効なメールアドレスを入力してください';
                            x.IS_WEB ? window.alert(msg) : u.default.alert('エラー', msg);
                            return;
                          }
                          if (!contentVal.trim()) {
                            const msg = 'お問い合わせ内容を入力してください';
                            x.IS_WEB ? window.alert(msg) : u.default.alert('エラー', msg);
                            return;
                          }
                          setInquirySending(true);
                          try {
                            await _F.addDoc(_F.collection(E.db, 'inquiries'), {
                              email: emailVal,
                              content: contentVal,
                              imagesBase64: inquiryImages || [],
                              createdAt: new Date(),
                              groupId: L || '',
                              groupName: $ || '',
                              role: V || '',
                              memberId: V === 'member' ? M || '' : '',
                              memberName: V === 'member' ? H || '' : '',
                            });
                            const msg = 'お問い合わせを送信しました';
                            x.IS_WEB ? window.alert(msg) : u.default.alert('完了', msg);
                            setInquiryVisible(false);
                            setInquiryEmail('');
                            setInquiryContent('');
                            setInquiryImages([]);
                          } catch (err) {
                            console.error('Inquiry send error:', err);
                            const msg = '送信に失敗しました。再度お試しください。';
                            x.IS_WEB ? window.alert(msg) : u.default.alert('エラー', msg);
                          } finally {
                            setInquirySending(false);
                          }
                        },
                        disabled: inquirySending,
                        children: (0, T.jsx)(n.default, {
                          style: [D.modalBtnText, { color: '#FFF' }],
                          children: inquirySending ? '送信中...' : '送信',
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  },
  D = a.default.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F2F2F7',
      paddingTop: x.IS_WEB ? x.WEB_TOP_PADDING : x.SAFE_TOP_PADDING,
    },
    container: { flex: 1 },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 10,
      color: '#1a1a1a',
    },
    section: { marginTop: 20, marginBottom: 10 },
    sectionTitle: {
      fontSize: 13,
      color: '#8E8E93',
      textTransform: 'uppercase',
      marginLeft: 32,
      marginBottom: 6,
    },
    sectionContainer: {
      backgroundColor: '#FFF',
      borderTopWidth: a.default.hairlineWidth,
      borderBottomWidth: a.default.hairlineWidth,
      borderColor: '#C6C6C8',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginLeft: 16,
      borderBottomWidth: a.default.hairlineWidth,
      borderBottomColor: '#C6C6C8',
      backgroundColor: '#FFF',
    },
    hovered: { backgroundColor: '#F2F2F7' },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    itemIcon: { width: 24, marginRight: 12 },
    itemText: { fontSize: 17, color: '#000' },
    iconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    itemRight: { flexDirection: 'row', alignItems: 'center' },
    timestamp: { fontSize: 12, color: '#8E8E93' },
    footer: { marginTop: 30, marginBottom: 50, alignItems: 'center' },
    versionText: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
    statusText: { fontSize: 12, color: '#34C759' },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '85%',
      maxWidth: 350,
      backgroundColor: '#FFF',
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    modalMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
    modalButtons: { width: '100%', gap: 10 },
    modalButtonsRow: { flexDirection: 'row', width: '100%', gap: 10 },
    radioBtn: {
      flex: 1,
      paddingVertical: 8,
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    radioBtnActive: { backgroundColor: '#007AFF' },
    radioBtnText: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold' },
    radioBtnTextActive: { color: '#FFF' },
    ratioHintText: { fontSize: 11, color: '#8E8E93', marginTop: 6, paddingHorizontal: 4 },
    dateSelector: {
      flex: 1,
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    dateSelectorText: { fontSize: 14, color: '#000' },
    modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    modalBtnText: { fontSize: 16, fontWeight: 'bold' },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      paddingVertical: 4,
    },
    monthNavBtn: { padding: 8 },
    monthNavText: { fontSize: 14, fontWeight: 'bold', flex: 1, textAlign: 'center', color: '#000' },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      height: 36,
      paddingLeft: 12,
    },
    stepperValue: { fontSize: 16, color: '#000', marginRight: 8 },
    stepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E5E5EA',
      borderRadius: 8,
      height: 32,
      marginRight: 2,
    },
    stepperBtn: { paddingHorizontal: 12, height: '100%', justifyContent: 'center', alignItems: 'center' },
    stepperDivider: { width: 1, height: 20, backgroundColor: '#C6C6C8' },
    filterGroup: { width: '100%', marginBottom: 16 },
    filterLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 4, fontWeight: '600' },
    filterInput: {
      backgroundColor: '#F2F2F7',
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: '#000',
      borderWidth: 1,
      borderColor: '#E5E5EA',
    },
    flexRow: { flexDirection: 'row', alignItems: 'center' },
    supportButton: Object.assign(
      {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FF2D55',
        marginHorizontal: 16,
        marginVertical: 8,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
      },
      (0, I.getShadowStyle)({
        shadowColor: '#FF2D55',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      })
    ),
    supportButtonHovered: { backgroundColor: '#E0284A', transform: [{ scale: 0.99 }] },
    supportButtonContent: { flexDirection: 'row', alignItems: 'center' },
    supportButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    tagChip: {
      backgroundColor: '#F2F2F7',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#E5E5EA',
    },
    tagChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    tagChipText: { fontSize: 13, color: '#000' },
    suggestionsContainer: { flexDirection: 'row', marginTop: 8, paddingVertical: 4 },
    suggestionChip: {
      backgroundColor: '#E5E5EA',
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginRight: 6,
    },
    suggestionText: { fontSize: 12, color: '#333' },
  });
