/**
 * Module ID: 593
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const _a = typeof id !== 'undefined' ? id : 593;
const _m = module;
const _e = exports;
const _d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
function e(e) {
  return e && e.__esModule ? e : { default: e };
}
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'RecordScreen', {
    enumerable: !0,
    get: function () {
      return k;
    },
  }));
var t = require('./module_37'),
  o = e(t),
  l = e(require('./default_144')),
  n = e(require('./default_297')),
  s = e(require('./default_45')),
  a = e(require('./default_217')),
  d = e(require('./default_386')),
  c = e(require('./default_398')),
  u = e(require('./module_198')),
  f = e(require('./default_218'));
require('./module_98');
var h = e(require('./default_382')),
  m = require('./IS_WEB_199');
require('./module_420');
var x = require('./JP_useScoreStore_174'),
  案内 = require('./JP_TutorialGuide'),
  y = require('./JP_ArcherColumnView_594'),
  b = require('./JP_LabelColumn_688'),
  F = require('./module_595'),
  j = (function (e) {
    if (e && e.__esModule) return e;
    var t = {};
    return (
      e &&
        Object.keys(e).forEach(function (o) {
          var l = Object.getOwnPropertyDescriptor(e, o);
          Object.defineProperty(
            t,
            o,
            l.get
              ? l
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
  S = require('./JP_ArcherActionModal_689'),
  p = require('./AntDesign_600'),
  C = require('./JP_SaveSessionModal_690'),
  AttendanceCheckModal = require('./AttendanceCheckModal').AttendanceCheckModal,
  I = require('./JP_ManualSubstitutionModal_691'),
  v = require('./JP_module_687'),
  B = require('./module_592'),
  A = require('./module_427'),
  { ArrowLocationPopover } = require('./ArrowLocationPopover'),
  { OCRRecordModal } = require('./JP_OCRRecordModal');
const k = () => {
    const {
        activeSessionID: e,
        isAdminMode: B = !1,
        archers: k = [],
        shotsPerRound: T = 8,
        syncStatus: z = 'IDLE',
        lastSyncTime: w,
        isNetworkOnline: E = !0,
        offlineSaveWarning: オフライン保存の警告 = null,
        addArcher: R,
        addSeparator: P,
        addTotalCalculator: L,
        undo: D,
        redo: H,
        historyStack: _ = [],
        redoStack: O = [],
        deleteArcher: M,
        clearArcherMarks: N,
        setArcherMember: V,
        saveSession: U,
        setShotsPerRound: G,
        showSyncErrorPopups: $ = !0,
        viewScale: q = 1,
        setViewScale: J,
        isLiveActive: K = !1,
        setIsLiveActive: Q,
        isHost: X = !1,
        liveSessionName: Y,
        includeInStats: Z = !0,
        setIncludeInStats: ee,
        resetCurrentSession: te,
        members: oe = [],
        isHydrated: re,
        lastResetHandled: le,
        // 誰かがライブ中に取り消し／やり直しをしたときの知らせ
        historyNoticeAt: 共有履歴の知らせ,
        historyNoticeKind: 共有履歴の種類,
        // 共有履歴の目印。取り消し・やり直しが押せるかの判定に使う
        historySharedLen: 共有履歴の位置,
        historySharedMax: 共有履歴の上限,
        activeGroupId: ne,
        publicGroupId: ie,
        activeArrowLocationEdit,
        setActiveArrowLocationEdit,
        // 「終了・保存」で出欠確認を出すか（設定で切れる）
        保存時に出欠を確認する = !0,
        // 長押しでますを開けた時刻。知らせを出す合図
        鍵を開けた時刻 = 0,
        // 記録表の並べ方。真なら名前が左、○×が右へ伸びる
        横に並べる = !1,
        set横に並べる,
        // 上下の帯を畳んでいるか。端末に残す（並べ方と同じ扱い）
        帯を畳む: 畳む覚え = !1,
        set帯を畳む,
      } = (0, x.useScoreStore)(),
      se = 'number' == typeof q && !isNaN(q) && q > 0 ? q : 1;
    if (!re) return null;
    const ae = (0, x.useScoreStore)((e) => e.liveSessionsList),
      [de, ce] = (0, t.useState)(!1),
      [ue, fe] = (0, t.useState)(null),
      [he, ge] = (0, t.useState)(0),
      [me, xe] = (0, t.useState)(!1),
      [ye, be] = (0, t.useState)(!1),
      [Fe, je] = (0, t.useState)(null),
      [警告を閉じた, 警告を閉じる] = (0, t.useState)(!1),
      Se = o.default.useRef(0),
      共有履歴を出した = o.default.useRef(0),
      鍵の知らせを出した = o.default.useRef(0),
      // 使い方の案内が指す先
      案内の人ボタン = 案内.useTutorialTarget('記録.人'),
      案内の記録表 = 案内.useTutorialTarget('記録.表'),
      案内の射数 = 案内.useTutorialTarget('記録.射数'),
      案内の拡大 = 案内.useTutorialTarget('記録.拡大'),
      案内の間隔 = 案内.useTutorialTarget('記録.間隔'),
      案内の計 = 案内.useTutorialTarget('記録.計'),
      案内のリセット = 案内.useTutorialTarget('記録.リセット'),
      案内の画像 = 案内.useTutorialTarget('記録.画像'),
      案内の取り消し = 案内.useTutorialTarget('記録.取り消し'),
      案内のライブボタン = 案内.useTutorialTarget('記録.ライブ'),
      案内の保存ボタン = 案内.useTutorialTarget('記録.保存'),
      // ライブ中は全員で1本の共有履歴を使うので、押せるかどうかも
      // 共有の目印で決める。手元の履歴だけで見ると、ライブ中に
      // やり直しが永久に押せないままになる
      ライブの知らせに任せる = !(!K || !Y),
      戻せる = ライブの知らせに任せる ? (共有履歴の位置 || 0) > 0 : _.length > 0,
      進める = ライブの知らせに任せる ? (共有履歴の位置 || 0) < (共有履歴の上限 || 0) : O.length > 0,
      [pe, Ce] = (0, t.useState)(!1),
      [Ie, ve] = (0, t.useState)(!1),
      [Be, Ae] = (0, t.useState)(8),
      [ke, We] = (0, t.useState)(!1),
      [Te, ze] = (0, t.useState)(''),
      [we, Ee] = (0, t.useState)(!1),
      [Re, Pe] = (0, t.useState)(null),
      [Le, De] = (0, t.useState)(''),
      [He, Oe] = (0, t.useState)(!1),
      [Me, Ne] = (0, t.useState)(null),
      [showAttendance, setShowAttendance] = (0, t.useState)(!1),
      [tempAttendance, setTempAttendance] = (0, t.useState)(null),
      [showOCRModal, setShowOCRModal] = (0, t.useState)(!1),
      // 上下の帯を畳んでいるか。記録表を広く使いたいときに畳む。
      // 画面を移る帯（記録/履歴/…）はここでは隠さない（移動できなくなるため）
      _畳みは使わない = null,
      Ve = o.default.useRef(null),
      Ue = o.default.useRef(null),
      Ge = (e) => {
        (je(e), setTimeout(() => je(null), 1500));
      };
    (o.default.useEffect(() => {
      '同期エラー' === z && $ && je('同期エラー: クラウドとの同期に失敗しました');
    }, [z, $]),
      o.default.useEffect(() => {
        if (le > 0 && Se.current < le) {
          const e = le === x.useScoreStore.getState().lastPushedTimestamp;
          ((Se.current = le),
            e || (Ge('リセットしました。'), j.notificationAsync(j.NotificationFeedbackType.Warning)));
        }
      }, [le]),
      // 誰かがライブ中に取り消し／やり直しをしたら短く知らせる。
      // 盤面が突然戻るので、理由が分かったほうが親切（リセットと同じ考え方）
      o.default.useEffect(() => {
        if (共有履歴の知らせ > 0 && 共有履歴を出した.current < 共有履歴の知らせ) {
          ((共有履歴を出した.current = 共有履歴の知らせ),
            Ge(`${共有履歴の種類 || '取り消し'}されました。`),
            j.notificationAsync(j.NotificationFeedbackType.Warning));
        }
      }, [共有履歴の知らせ, 共有履歴の種類]),
      // 長押しでますを開けたら短く知らせる。
      // 灰色が戻るだけでは、押さえが届いたのか分かりにくい
      o.default.useEffect(() => {
        if (鍵を開けた時刻 > 0 && 鍵の知らせを出した.current < 鍵を開けた時刻) {
          ((鍵の知らせを出した.current = 鍵を開けた時刻),
            Ge('このマスの鍵を開けました'),
            j.notificationAsync(j.NotificationFeedbackType.Success));
        }
      }, [鍵を開けた時刻]),
      o.default.useEffect(() => {
        x.useScoreStore.getState().loadData();
      }, []),
      o.default.useEffect(() => {
        let e;
        return (
          He &&
            'join' === Re &&
            (x.useScoreStore.getState().fetchActiveLiveSessions(),
            (e = x.useScoreStore.getState().listenToLiveSessions())),
          () => {
            e && e();
          }
        );
      }, [He, Re]));
    new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    // 案内の最中は畳まない。案内が指す先は全部この帯の中にあり、
    // 畳んだままだと指せないうえ、押す操作そのものができない
    // フックは必ず呼ぶ。&& の右に置くと、畳む・戻すでフックの数が変わり、
    // React が描き直しに失敗して取っ手ごと消える（実際に消えていた）
    const 案内中 = 案内.use案内中();
    const 帯を畳む = 畳む覚え && !案内中;
    const $e = !1,
      qe = (e, t, o) => {
        j.impactAsync(j.ImpactFeedbackStyle.Medium);
        k.find((t) => t.id === e) && (fe(e), ge(o), ce(!0));
      },
      [Je, Ke] = (0, t.useState)(!1),
      // 拡大率の選択が出ているか（Excel の倍率と同じ考え方）
      [拡大選択中, 拡大を選ぶ] = (0, t.useState)(!1),
      // 拡大率のバーの幅。指の位置を倍率に直すのに使う
      [溝の幅, 溝の幅を置く] = (0, t.useState)(0),
      // 拡大率の下限・上限。バーも一覧もこの幅で動かす
      拡大の下 = 0.5,
      拡大の上 = 2,
      // バーのどこを触ったかを倍率に直す。1%きざみで止める
      触った所を倍率に = (x) => {
        if (!溝の幅) return se;
        const 割合 = Math.min(1, Math.max(0, x / 溝の幅));
        const 生 = 拡大の下 + 割合 * (拡大の上 - 拡大の下);
        return Math.round(生 * 100) / 100;
      },
      倍率を割合に = (倍) =>
        Math.min(1, Math.max(0, (倍 - 拡大の下) / (拡大の上 - 拡大の下))),
      バーを動かす = (e) => {
        const 倍 = 触った所を倍率に(e.nativeEvent.locationX);
        if (Math.abs(倍 - se) > 0.001) J(倍);
      },
      Qe = () => Ke(!1),
      Xe = (e) => {
        e < T && k.some((t) => t && Array.isArray(t.marks) && t.marks.slice(e).some((e) => '' !== e))
          ? (Ae(e), ve(!0))
          : (G(e), j.impactAsync(j.ImpactFeedbackStyle.Medium));
      },
      Ye = () => {
        const e = parseInt(Te, 10);
        !isNaN(e) && e >= 1 && e <= 500
          ? (We(!1), Xe(e))
          : (je('1〜500までの数字を入力してください'), setTimeout(() => je(null), 1500));
      },
      Ze = (e) => {
        (Ee(!1),
          Pe(e),
          De(''),
          setTimeout(() => {
            Oe(!0);
          }, 100));
      },
      et = l.default;
    // ── 横に並べた記録表 ──
    // 縦の表は「射数が縦、名前は下、右から左」。横はそれを90度まわして
    // 「名前が左、射数が右へ、上から下へ」にする。○×のますも、鍵も、
    // 途中交代も同じ部品をそのまま使う（並べ方だけを変える）。
    // 左の名前だけは動かさず、○×の側だけ横に流す
    const 名前の幅 = 100 * se,
      行の高さ = (射手) =>
        (射手 && 射手.isSeparator ? F.UIConfig.separatorWidth : F.UIConfig.cellHeight) * se,
      // 案内が指す先。縦の足元と同じ決まりで、まだ名前の入っていない人を選ぶ
      案内が指す順 = () => {
        const 一覧 = (Array.isArray(k) ? k : []).filter((e) => !!e);
        const 指す = 一覧.findIndex((a) => a && !a.name && !a.isSeparator && !a.isTotalCalculator);
        return 指す < 0 ? 0 : 指す;
      },
      横の名前セル = (射手, 順) =>
        (0, A.jsx)(
          l.default,
          {
            ref: (node) => {
              if (順 === 案内が指す順()) 案内.setTutorialTargetNode('記録.射手選択', node);
            },
            style: {
              width: 名前の幅,
              height: 行の高さ(射手),
              backgroundColor: 射手.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
              borderBottomWidth: 射手.isSeparator || 射手.isTotalCalculator ? 1.5 : 1,
              borderBottomColor: '#000',
              borderTopWidth: 射手.isSeparator || 射手.isTotalCalculator ? 1.5 : 0,
              borderTopColor: '#000',
              borderRightWidth: 1.5,
              borderRightColor: '#000',
              paddingHorizontal: 4,
              justifyContent: 'center',
              alignItems: 'center',
            },
            children: 射手.isSeparator
              ? (0, A.jsx)(h.default, {
                  style: { alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' },
                  onPress: () => M(射手.id),
                  disabled: $e,
                  children: (0, A.jsx)(p.Ionicons, { name: 'close-circle', size: 20 * se, color: '#8E8E93' }),
                })
              : (0, A.jsxs)(h.default, {
                  style: { alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' },
                  onPress: () => qe(射手.id, 射手.name, 順),
                  children: [
                    (0, A.jsx)(a.default, {
                      style: [W.footerName, { color: 射手.name ? '#000' : '#8E8E93', fontSize: 13 * se }],
                      numberOfLines: 1,
                      children: 射手.isTotalCalculator
                        ? '合計'
                        : 射手.name
                          ? (0, v.formatMemberName)(射手.name, oe)
                          : '選択',
                    }),
                    射手.isGuest || (!射手.isTotalCalculator && '' !== 射手.name)
                      ? (0, A.jsxs)(l.default, {
                          style: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
                          children: [
                            射手.isGuest
                              ? (0, A.jsx)(a.default, {
                                  style: [W.guestLabel, { fontSize: 9 * se }],
                                  children: '(ゲスト)',
                                })
                              : null,
                            !射手.isTotalCalculator && '' !== 射手.name
                              ? (0, A.jsx)(l.default, {
                                  style: {
                                    paddingHorizontal: 4,
                                    paddingVertical: 1,
                                    borderRadius: 10,
                                    backgroundColor:
                                      射手.isGuest ||
                                      !射手.gender ||
                                      射手.gender === '未設定' ||
                                      !['男子', '女子'].includes(射手.gender)
                                        ? '#8E8E93'
                                        : '男子' === 射手.gender
                                          ? '#007AFF'
                                          : '#FF2D55',
                                  },
                                  children: (0, A.jsx)(p.Ionicons, {
                                    name: 'person',
                                    size: 9 * se,
                                    color: '#FFF',
                                  }),
                                })
                              : null,
                          ],
                        })
                      : null,
                  ],
                }),
          },
          typeof 射手.id === 'string' ? `名-${射手.id}` : `名-${順}`
        ),
      横の表 = () => {
        const 一覧 = (Array.isArray(k) ? k : []).filter((e) => !!e);
        return [
          (0, A.jsx)(
            n.default,
            {
              showsVerticalScrollIndicator: !1,
              bounces: !1,
              style: { flexGrow: 0 },
              children: (0, A.jsxs)(l.default, {
                style: { flexDirection: 'row', minWidth: '100%' },
                children: [
                  (0, A.jsxs)(l.default, {
                    style: { backgroundColor: '#F2F2F7', zIndex: 10 },
                    children: [
                      (0, A.jsx)(l.default, {
                        style: {
                          width: 名前の幅,
                          height: F.UIConfig.cellHeight * se,
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: '#F2F2F7',
                          borderTopWidth: 1.5,
                          borderTopColor: '#000',
                          // 見出しと本体の区切り。射数の見出しの線（3px）と太さをそろえる
                          borderBottomWidth: 3,
                          borderBottomColor: '#000',
                          borderRightWidth: 1.5,
                          borderRightColor: '#000',
                        },
                        children: (0, A.jsx)(a.default, {
                          style: { fontSize: 10 * se, fontWeight: 'bold', color: '#3C3C43' },
                          children: '名',
                        }),
                      }),
                      一覧.map((射手, 順) => 横の名前セル(射手, 順)),
                    ],
                  }),
                  (0, A.jsx)(n.default, {
                    horizontal: !0,
                    showsHorizontalScrollIndicator: !0,
                    style: { flexGrow: 0, flexShrink: 1 },
                    children: (0, A.jsxs)(l.default, {
                      style: {
                        flexDirection: 'column',
                        width: F.UIConfig.cellWidth * (T + 1) * se,
                      },
                      children: [
                        (0, A.jsx)(b.LabelColumn, { shots: T, showFooter: !1, 横並び: !0 }),
                        一覧.map((射手, 順) =>
                          (0, A.jsx)(
                            y.ArcherColumnView,
                            {
                              archer: 射手,
                              shots: T,
                              allArchers: 一覧,
                              indexInList: 順,
                              showFooter: !1,
                              横並び: !0,
                              isReadOnly: $e,
                              onPressName: () => qe(射手.id, 射手.name, 順),
                              onDelete: () => M(射手.id),
                            },
                            typeof 射手.id === 'string' ? 射手.id : `行-${順}`
                          )
                        ),
                      ],
                    }),
                  }),
                ],
              }),
            },
            '横の表'
          ),
        ];
      };
    return (0, A.jsxs)(et, {
      style: W.safeArea,
      edges: ['top', 'left', 'right', 'bottom'],
      children: [
        オフライン保存の警告 && !警告を閉じた
          ? (0, A.jsx)(h.default, {
              style: { backgroundColor: '#B00020', paddingVertical: 8, paddingHorizontal: 12 },
              onPress: () => 警告を閉じる(!0),
              children: (0, A.jsx)(a.default, {
                style: { color: '#FFF', fontSize: 12, lineHeight: 17, textAlign: 'center' },
                children: `${オフライン保存の警告}（タップで閉じる）`,
              }),
            })
          : null,
        K && Y
          ? (0, A.jsxs)(l.default, {
              style: [W.liveStatusHeader, W.liveActiveHeader, { marginHorizontal: 8, borderRadius: 8 }],
              children: [
                (0, A.jsx)(p.Ionicons, { name: 'radio-outline', size: 12, color: '#FFF' }),
                (0, A.jsxs)(a.default, {
                  style: W.liveStatusText,
                  numberOfLines: 1,
                  children: ['ライブ中: ', Y],
                }),
              ],
            })
          : null,
        帯を畳む
          ? null
          : (0, A.jsxs)(l.default, {
          style: [W.navBar, { zIndex: 1e4 }],
          children: [
            (0, A.jsxs)(l.default, {
              style: W.navLeft,
              children: [
                (0, A.jsx)(f.default, {
                  ref: 案内のリセット,
                  onPress: () => {
                    Ce(!0);
                  },
                  hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
                  style: ({ hovered: e }) => [W.resetBtn, e && m.IS_WEB && { opacity: 0.8 }],
                  children: (0, A.jsx)(a.default, { style: W.resetBtnText, children: 'リセット' }),
                }),
                (0, A.jsxs)(l.default, {
                  style: W.syncContainer,
                  children: [
                    E && '同期エラー' !== z
                      ? '同期中' === z
                        ? (0, A.jsx)(p.Ionicons, { name: 'cloud-upload-outline', size: 14, color: '#007AFF' })
                        : '同期済み' === z
                          ? (0, A.jsx)(p.Ionicons, { name: 'cloud-done-outline', size: 14, color: '#34C759' })
                          : (0, A.jsx)(p.Ionicons, { name: 'cloud-outline', size: 14, color: '#8E8E93' })
                      : (0, A.jsx)(p.Ionicons, { name: 'cloud-offline-outline', size: 14, color: '#FF3B30' }),
                    !1,
                  ],
                }),
                // 団体IDはここに出さない。細い画面でヘッダーが2段になり、
                // 記録表の見える範囲を削っていた。記録中に見るものでもないので
                // 設定タブへ譲る（設定の先頭に出ている）
              ],
            }),
            (0, A.jsxs)(l.default, {
              style: W.navRight,
              children: [
                (0, A.jsxs)(h.default, {
                  ref: 案内のライブボタン,
                  onPress: () => {
                    K
                      ? (x.useScoreStore.getState().stopLiveSync(),
                        j.notificationAsync(j.NotificationFeedbackType.Warning))
                      : Ee(!0);
                  },
                  style: [W.liveBtn, K && W.liveBtnActive],
                  children: [
                    (0, A.jsx)(p.Ionicons, {
                      name: 'radio-outline',
                      size: 16,
                      color: K ? '#FFF' : '#007AFF',
                    }),
                    (0, A.jsx)(a.default, {
                      style: [W.liveBtnText, K && W.liveBtnTextActive],
                      children: K ? (X ? '停止' : '退出') : 'ライブ',
                    }),
                  ],
                }),
                // 立ちの増減。1立ち＝4射なので、4射ずつ動かす。
                // 真ん中の「8射」を押せば、これまでどおり一覧から選べる
                (0, A.jsxs)(l.default, {
                  ref: 案内の射数,
                  style: W.zoomContainer,
                  children: [
                    (0, A.jsx)(h.default, {
                      onPress: () => {
                        Xe(Math.max(4, T - 4));
                      },
                      disabled: T <= 4,
                      style: W.zoomBtn,
                      children: (0, A.jsx)(p.Ionicons, {
                        name: 'remove-circle-outline',
                        size: 22,
                        color: T <= 4 ? '#C7C7CC' : '#007AFF',
                      }),
                    }),
                    (0, A.jsx)(h.default, {
                      onPress: () => Ke(!0),
                      style: W.shotsToggle,
                      children: (0, A.jsxs)(a.default, { style: W.shotsText, children: [T, '射'] }),
                    }),
                    (0, A.jsx)(h.default, {
                      onPress: () => {
                        // 手入力と同じ上限(500)で止める。ここだけ上限が無いと、
                        // 押し続けてアプリが認めていない射数まで行けてしまう
                        Xe(Math.min(500, T + 4));
                      },
                      disabled: T >= 500,
                      style: W.zoomBtn,
                      children: (0, A.jsx)(p.Ionicons, {
                        name: 'add-circle-outline',
                        size: 22,
                        color: T >= 500 ? '#C7C7CC' : '#007AFF',
                      }),
                    }),
                  ],
                }),
                // ％だけでは何の割合か分からないので、見出しを上に置く。
                // ここは「表示」と短くする。細い画面ではヘッダーが2段になり、
                // 記録表の見える範囲を削っていた。押した先のダイアログには
                // 場所があるので、そちらは「表示の大きさ」のままにしてある
                (0, A.jsxs)(h.default, {
                  ref: 案内の拡大,
                  onPress: () => 拡大を選ぶ(!0),
                  style: W.zoomToggle,
                  children: [
                    (0, A.jsx)(a.default, { style: W.zoomLabel, children: '表示' }),
                    (0, A.jsxs)(l.default, {
                      style: W.zoomValue,
                      children: [
                        (0, A.jsxs)(a.default, {
                          style: W.zoomText,
                          children: [Math.round(se * 100), '%'],
                        }),
                        (0, A.jsx)(p.Ionicons, { name: 'chevron-down', size: 10, color: '#007AFF' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // 拡大率の選択。射数の選択と同じ形にしてある
        (0, A.jsx)(d.default, {
          visible: 拡大選択中,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => 拡大を選ぶ(!1),
          children: (0, A.jsxs)(l.default, {
            style: {
              flex: 1,
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: 40,
            },
            children: [
              // 背景は「中身の親」ではなく「兄弟」にしてある。
              // 親にすると、バーを掴んで離したときの click が背景まで伝わり、
              // 倍率を合わせるたびに閉じてしまう
              (0, A.jsx)(f.default, {
                style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
                onPress: () => 拡大を選ぶ(!1),
              }),
              (0, A.jsxs)(l.default, {
              style: {
                width: '90%',
                maxWidth: 400,
                backgroundColor: '#FFF',
                borderRadius: 14,
                overflow: 'hidden',
              },
              children: [
                (0, A.jsx)(l.default, {
                  style: {
                    padding: 16,
                    borderBottomWidth: s.default.hairlineWidth,
                    borderBottomColor: '#C6C6C8',
                    alignItems: 'center',
                  },
                  children: (0, A.jsx)(a.default, {
                    style: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
                    children: '表示の大きさ',
                  }),
                }),
                // バーでも動かせるようにする。⊖ ⊕ は 5% ずつ
                (0, A.jsxs)(l.default, {
                  style: W.バーの行,
                  children: [
                    (0, A.jsx)(h.default, {
                      onPress: () => J(Math.max(拡大の下, Math.round((se - 0.05) * 20) / 20)),
                      disabled: se <= 拡大の下 + 0.001,
                      style: W.zoomBtn,
                      children: (0, A.jsx)(p.Ionicons, {
                        name: 'remove-circle-outline',
                        size: 24,
                        color: se <= 拡大の下 + 0.001 ? '#C7C7CC' : '#007AFF',
                      }),
                    }),
                    (0, A.jsxs)(l.default, {
                      style: W.溝の当たり,
                      onLayout: (e) => 溝の幅を置く(e.nativeEvent.layout.width),
                      onStartShouldSetResponder: () => !0,
                      onMoveShouldSetResponder: () => !0,
                      onResponderGrant: バーを動かす,
                      onResponderMove: バーを動かす,
                      children: [
                        (0, A.jsx)(l.default, { style: W.溝 }),
                        (0, A.jsx)(l.default, {
                          style: [W.溝の済み, { width: `${倍率を割合に(se) * 100}%` }],
                        }),
                        (0, A.jsx)(l.default, {
                          style: [W.つまみ, { left: `${倍率を割合に(se) * 100}%` }],
                        }),
                      ],
                    }),
                    (0, A.jsx)(h.default, {
                      onPress: () => J(Math.min(拡大の上, Math.round((se + 0.05) * 20) / 20)),
                      disabled: se >= 拡大の上 - 0.001,
                      style: W.zoomBtn,
                      children: (0, A.jsx)(p.Ionicons, {
                        name: 'add-circle-outline',
                        size: 24,
                        color: se >= 拡大の上 - 0.001 ? '#C7C7CC' : '#007AFF',
                      }),
                    }),
                    (0, A.jsxs)(a.default, {
                      style: W.バーの数字,
                      children: [Math.round(se * 100), '%'],
                    }),
                  ],
                }),
                [0.5, 0.75, 1, 1.25, 1.5, 2].map((倍) =>
                  (0, A.jsx)(
                    f.default,
                    {
                      style: ({ hovered: e }) => [
                        {
                          padding: 16,
                          alignItems: 'center',
                          borderBottomWidth: s.default.hairlineWidth,
                          borderBottomColor: '#C6C6C8',
                        },
                        e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                        Math.abs(se - 倍) < 0.01 && { backgroundColor: '#EAF3FF' },
                      ],
                      onPress: () => {
                        (J(倍), j.impactAsync(j.ImpactFeedbackStyle.Light), 拡大を選ぶ(!1));
                      },
                      children: (0, A.jsxs)(a.default, {
                        style: {
                          fontSize: 20,
                          color: '#007AFF',
                          fontWeight: Math.abs(se - 倍) < 0.01 ? 'bold' : 'normal',
                        },
                        children: [Math.round(倍 * 100), '%', 1 === 倍 ? '（標準）' : ''],
                      }),
                    },
                    `zoom-option-${倍}`
                  )
                ),
                (0, A.jsx)(f.default, {
                  style: ({ hovered: e }) => [
                    { padding: 16, alignItems: 'center' },
                    e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                  ],
                  onPress: () => 拡大を選ぶ(!1),
                  children: (0, A.jsx)(a.default, {
                    style: { fontSize: 17, color: '#8E8E93' },
                    children: 'キャンセル',
                  }),
                }),
              ],
              }),
            ],
          }),
        }),
        (0, A.jsx)(d.default, {
          visible: Je,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: Qe,
          children: (0, A.jsxs)(f.default, {
            style: {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: 40,
            },
            onPress: Qe,
            children: [
              (0, A.jsxs)(l.default, {
                style: {
                  width: '90%',
                  maxWidth: 400,
                  backgroundColor: '#FFF',
                  borderRadius: 14,
                  overflow: 'hidden',
                },
                children: [
                  (0, A.jsx)(l.default, {
                    style: {
                      padding: 16,
                      borderBottomWidth: s.default.hairlineWidth,
                      borderBottomColor: '#C6C6C8',
                      alignItems: 'center',
                    },
                    children: (0, A.jsx)(a.default, {
                      style: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
                      children: '射数の設定',
                    }),
                  }),
                  [4, 8, 12, 16, 20].map((e) =>
                    (0, A.jsx)(
                      f.default,
                      {
                        style: ({ hovered: e }) => [
                          {
                            padding: 18,
                            alignItems: 'center',
                            borderBottomWidth: s.default.hairlineWidth,
                            borderBottomColor: '#C6C6C8',
                          },
                          e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                        ],
                        onPress: () => {
                          (Xe(e), Qe());
                        },
                        children: (0, A.jsxs)(a.default, {
                          style: { fontSize: 20, color: '#007AFF' },
                          children: [e, '射'],
                        }),
                      },
                      `shot-option-${e}`
                    )
                  ),
                  (0, A.jsx)(f.default, {
                    style: ({ hovered: e }) => [
                      { padding: 18, alignItems: 'center' },
                      e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                    ],
                    onPress: () => {
                      (Qe(),
                        setTimeout(() => {
                          (ze(String(T)), We(!0));
                        }, 100));
                    },
                    children: (0, A.jsx)(a.default, {
                      style: { fontSize: 20, color: '#007AFF' },
                      children: '任意...',
                    }),
                  }),
                ],
              }),
              (0, A.jsx)(f.default, {
                style: ({ hovered: e }) => [
                  {
                    width: '90%',
                    maxWidth: 400,
                    backgroundColor: '#FFF',
                    borderRadius: 14,
                    marginTop: 8,
                    padding: 18,
                    alignItems: 'center',
                  },
                  e && m.IS_WEB && { opacity: 0.8 },
                ],
                onPress: Qe,
                children: (0, A.jsx)(a.default, {
                  style: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
                  children: 'キャンセル',
                }),
              }),
            ],
          }),
        }),
        (0, A.jsx)(d.default, {
          visible: we,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => Ee(!1),
          children: (0, A.jsxs)(h.default, {
            style: {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: 40,
            },
            activeOpacity: 1,
            onPress: () => Ee(!1),
            children: [
              (0, A.jsxs)(l.default, {
                style: {
                  width: '90%',
                  maxWidth: 400,
                  backgroundColor: '#FFF',
                  borderRadius: 14,
                  overflow: 'hidden',
                },
                children: [
                  (0, A.jsx)(h.default, {
                    style: {
                      padding: 18,
                      alignItems: 'center',
                      borderBottomWidth: s.default.hairlineWidth,
                      borderBottomColor: '#C6C6C8',
                    },
                    onPress: () => Ze('host'),
                    children: (0, A.jsx)(a.default, {
                      style: { fontSize: 20, color: '#007AFF' },
                      children: 'ライブ記録を開始',
                    }),
                  }),
                  (0, A.jsx)(h.default, {
                    style: { padding: 18, alignItems: 'center' },
                    onPress: () => Ze('join'),
                    children: (0, A.jsx)(a.default, {
                      style: { fontSize: 20, color: '#007AFF' },
                      children: 'ライブ記録に参加',
                    }),
                  }),
                ],
              }),
              (0, A.jsx)(h.default, {
                style: {
                  width: '90%',
                  maxWidth: 400,
                  backgroundColor: '#FFF',
                  borderRadius: 14,
                  marginTop: 8,
                  padding: 18,
                  alignItems: 'center',
                },
                onPress: () => Ee(!1),
                children: (0, A.jsx)(a.default, {
                  style: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
                  children: 'キャンセル',
                }),
              }),
            ],
          }),
        }),
        (0, A.jsx)(d.default, {
          visible: He,
          transparent: !0,
          animationType: 'fade',
          children: (0, A.jsx)(l.default, {
            style: {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
            },
            children: (0, A.jsxs)(l.default, {
              style: {
                width: 300,
                backgroundColor: '#FFF',
                borderRadius: 12,
                padding: 20,
                alignItems: 'center',
                maxHeight: '80%',
              },
              children: [
                (0, A.jsx)(a.default, {
                  style: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
                  children: 'host' === Re ? 'ライブを開始' : 'ライブに参加',
                }),
                'host' === Re
                  ? (0, A.jsxs)(A.Fragment, {
                      children: [
                        (0, A.jsx)(a.default, {
                          style: { fontSize: 14, color: '#666', marginBottom: 16 },
                          children: 'セッション名を入力してください',
                        }),
                        (0, A.jsx)(c.default, {
                          style: {
                            width: '100%',
                            borderWidth: 1,
                            borderColor: '#CCC',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16,
                            marginBottom: 20,
                          },
                          value: Le,
                          // 名前を直したら注意書きも消す。残すと、直したのに
                          // 「使えません」が出たままで、何が悪いのか分からない
                          onChangeText: (e) => {
                            (De(e), Ne(null));
                          },
                          placeholder: 'session_name_123',
                          autoCapitalize: 'none',
                          autoCorrect: !1,
                          autoFocus: !0,
                        }),
                        Me &&
                          (0, A.jsx)(a.default, {
                            style: {
                              color: '#FF3B30',
                              fontSize: 13,
                              textAlign: 'center',
                              marginBottom: 12,
                              fontWeight: 'bold',
                            },
                            children: Me,
                          }),
                      ],
                    })
                  : (0, A.jsxs)(l.default, {
                      style: { width: '100%' },
                      children: [
                        (0, A.jsxs)(l.default, {
                          style: {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12,
                          },
                          children: [
                            (0, A.jsx)(a.default, {
                              style: { fontSize: 14, color: '#666' },
                              children: 'アクティブなセッション一覧',
                            }),
                            (0, A.jsx)(h.default, {
                              onPress: () => {
                                (x.useScoreStore.getState().fetchActiveLiveSessions(), Ge('更新しました'));
                              },
                              children: (0, A.jsx)(p.Ionicons, {
                                name: 'refresh',
                                size: 20,
                                color: '#007AFF',
                              }),
                            }),
                          ],
                        }),
                        (0, A.jsx)(n.default, {
                          style: { width: '100%', maxHeight: 300, marginBottom: 20 },
                          children:
                            Array.isArray(ae) && 0 !== ae.length
                              ? ae.map((e) =>
                                  (0, A.jsxs)(
                                    l.default,
                                    {
                                      style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#EEE',
                                        backgroundColor: Le === e ? '#E5F1FF' : '#FFF',
                                      },
                                      children: [
                                        (0, A.jsx)(h.default, {
                                          style: { flex: 1, padding: 16 },
                                          // 選び直したら注意書きも消す（入力欄と揃える）
                                          onPress: () => {
                                            (De(e), Ne(null));
                                          },
                                          children: (0, A.jsx)(a.default, {
                                            style: { fontSize: 16, color: '#333' },
                                            children: e,
                                          }),
                                        }),
                                        (0, A.jsx)(h.default, {
                                          style: { padding: 16 },
                                          onPress: () => {
                                            m.IS_WEB
                                              ? window.confirm(`セッション「${e}」を完全に削除しますか？`) &&
                                                x.useScoreStore.getState().deleteLiveSession(e)
                                              : u.default.alert(
                                                  'セッション削除',
                                                  `セッション「${e}」を完全に削除しますか？`,
                                                  [
                                                    { text: 'キャンセル', style: 'cancel' },
                                                    {
                                                      text: '削除',
                                                      style: 'destructive',
                                                      onPress: () =>
                                                        x.useScoreStore.getState().deleteLiveSession(e),
                                                    },
                                                  ]
                                                );
                                          },
                                          children: (0, A.jsx)(p.Ionicons, {
                                            name: 'trash-outline',
                                            size: 20,
                                            color: '#FF3B30',
                                          }),
                                        }),
                                      ],
                                    },
                                    `live-session-${e}`
                                  )
                                )
                              : (0, A.jsx)(a.default, {
                                  style: { textAlign: 'center', color: '#888', padding: 20 },
                                  children: '現在アクティブな記録はありません',
                                }),
                        }),
                      ],
                    }),
                (0, A.jsxs)(l.default, {
                  style: { flexDirection: 'row', gap: 12 },
                  children: [
                    (0, A.jsx)(h.default, {
                      style: {
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: '#F2F2F7',
                        alignItems: 'center',
                      },
                      onPress: () => Oe(!1),
                      children: (0, A.jsx)(a.default, {
                        style: { fontSize: 16, color: '#007AFF', fontWeight: 'bold' },
                        children: 'キャンセル',
                      }),
                    }),
                    (0, A.jsx)(h.default, {
                      style: {
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: Le.trim() ? '#007AFF' : '#CCC',
                        alignItems: 'center',
                      },
                      onPress: async () => {
                        if (!Le.trim()) return;
                        const e = Le.trim();
                        // Realtime Database の枝の名前に使えない字を弾く。
                        // とくに「/」は例外にならず階層の区切りとして通ってしまい、
                        // 「5/8」のような日付を入れると 5 の下に 8 が作られる。
                        // そうなると参加一覧にも出ず、参加も削除もできないライブが残る
                        const 使えない字 = x.ライブ名に使えない字(e);
                        if (使えない字)
                          return void (Ne(`ライブ名に ${使えない字} は使えません。別の名前を入力してください。`),
                          j.impactAsync(j.ImpactFeedbackStyle.Heavy));
                        if ((Ne(null), 'host' === Re)) {
                          Ge('ライブを開始しています...');
                          const 結果 = await x.useScoreStore.getState().startLiveSync(e);
                          if ('開始した' === 結果)
                            return void (Oe(!1), j.notificationAsync(j.NotificationFeedbackType.Success));
                          // 「同名あり」と「確かめられなかった」を区別する。
                          // 元はどちらも「既に使用されています」と出していて、
                          // 通信が乱れただけのときに誤った案内になっていた
                          return void (Ne(
                            '同名あり' === 結果
                              ? `'${e}' は既に使用されています。別の名前を入力してください。`
                              : '通信が不安定なため開始できませんでした。電波の良い場所でもう一度お試しください。'
                          ),
                          j.impactAsync(j.ImpactFeedbackStyle.Heavy));
                        }
                        if ('join' === Re) {
                          if (!x.useScoreStore.getState().liveSessionsList.includes(e))
                            return void Ne(`'${e}' というセッションは見つかりませんでした。`);
                          const t = () => {
                            (Ge('ライブに参加しています...'),
                              Oe(!1),
                              x.useScoreStore.getState().joinLiveSync(e),
                              j.notificationAsync(j.NotificationFeedbackType.Success));
                          };
                          if (k.length > 0) {
                            const e =
                              '手元の記録が消去され、ライブ参加データで上書きされます。よろしいですか？';
                            m.IS_WEB
                              ? window.confirm(e) && t()
                              : u.default.alert('確認', e, [
                                  { text: 'キャンセル', style: 'cancel' },
                                  { text: 'OK', onPress: t },
                                ]);
                          } else t();
                        }
                      },
                      disabled: !Le.trim(),
                      children: (0, A.jsx)(a.default, {
                        style: { fontSize: 16, color: '#FFF', fontWeight: 'bold' },
                        children: '決定',
                      }),
                    }),
                  ],
                }),
              ],
            }),
          }),
        }),
        (0, A.jsxs)(l.default, {
          style: [W.gridArea, { justifyContent: 'center', alignItems: 'center' }],
          children: [
            // 帯を畳む取っ手。記録表の区画の中に置くので、上の帯があっても
            // 無くても重ならない
            (0, A.jsx)(f.default, {
              onPress: () => {
                (set帯を畳む && set帯を畳む(!畳む覚え), j.impactAsync(j.ImpactFeedbackStyle.Light));
              },
              testID: '帯の開け閉め',
              hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
              style: ({ hovered: e }) => [W.帯の取っ手, e && m.IS_WEB && { opacity: 0.85 }],
              children: (0, A.jsx)(p.Ionicons, {
                name: 帯を畳む ? 'chevron-down' : 'chevron-up',
                size: 18,
                color: '#8E8E93',
              }),
            }),
            (0, A.jsxs)(l.default, {
              ref: 案内の記録表,
              style: { maxHeight: '100%', flexDirection: 'column', maxWidth: '100%' },
              children: 横に並べる
                ? 横の表()
                : [
                (0, A.jsx)(n.default, {
                  showsVerticalScrollIndicator: !1,
                  bounces: !1,
                  style: { flexGrow: 0 },
                  children: (0, A.jsxs)(l.default, {
                    style: { flexDirection: 'row-reverse', minWidth: '100%' },
                    children: [
                      (0, A.jsx)(l.default, {
                        style: { backgroundColor: '#F2F2F7', zIndex: 10 },
                        children: (0, A.jsx)(b.LabelColumn, { shots: T, showFooter: !1 }),
                      }),
                      (0, A.jsx)(n.default, {
                        horizontal: !0,
                        showsHorizontalScrollIndicator: !0,
                        style: { flexGrow: 0, flexShrink: 1 },
                        ref: Ve,
                        onScroll: (e) => {
                          const t = e.nativeEvent.contentOffset.x;
                          Ue.current?.scrollTo({ x: t, animated: !1 });
                        },
                        scrollEventThrottle: 16,
                        children: (0, A.jsx)(l.default, {
                          style: [W.gridRow, { flexDirection: 'row-reverse' }],
                          children: (Array.isArray(k) ? k : [])
                            .filter((e) => !!e)
                            .map((e, t) =>
                              (0, A.jsx)(
                                y.ArcherColumnView,
                                {
                                  archer: e,
                                  shots: T,
                                  allArchers: Array.isArray(k) ? k : [],
                                  indexInList: t,
                                  showFooter: !1,
                                  isReadOnly: $e,
                                  onPressName: () => qe(e.id, e.name, t),
                                  onDelete: () => M(e.id),
                                },
                                typeof e.id === 'string' ? e.id : `archer-${t}`
                              )
                            ),
                        }),
                      }),
                    ],
                  }),
                }),
                (0, A.jsxs)(l.default, {
                  style: {
                    height: F.UIConfig.footerHeight * se,
                    flexDirection: 'row-reverse',
                    borderTopWidth: 1.5,
                    borderTopColor: '#000',
                  },
                  children: [
                    (0, A.jsx)(l.default, {
                      style: {
                        width: F.UIConfig.headerWidth * se,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F2F2F7',
                        borderLeftWidth: 1.5,
                        borderLeftColor: '#000',
                        borderRightWidth: 1.5,
                        borderRightColor: '#000',
                      },
                      children: (0, A.jsx)(a.default, {
                        style: { fontSize: 10 * se, fontWeight: 'bold', color: '#3C3C43' },
                        children: '名',
                      }),
                    }),
                    (0, A.jsx)(n.default, {
                      horizontal: !0,
                      showsHorizontalScrollIndicator: !1,
                      style: { flexGrow: 0, flexShrink: 1 },
                      ref: Ue,
                      onScroll: (e) => {
                        const t = e.nativeEvent.contentOffset.x;
                        Ve.current?.scrollTo({ x: t, animated: !1 });
                      },
                      scrollEventThrottle: 16,
                      children: (0, A.jsx)(l.default, {
                        style: [W.gridRow, { flexDirection: 'row-reverse' }],
                        children: (Array.isArray(k) ? k : [])
                          .filter((e) => !!e)
                          .map((e, t) => {
                            return (0, A.jsx)(
                              l.default,
                              {
                                // 使い方の案内が指す先。まだ名前の入っていない列を選ぶ。
                                // 名前入りの列を指すと、押しても名前の数が増えず先へ進めない。
                                // 繰り返しの中なのでフックは使えない
                                ref: (node) => {
                                  const 一覧 = (Array.isArray(k) ? k : []).filter((e) => !!e);
                                  let 指す = 一覧.findIndex(
                                    (a) => a && !a.name && !a.isSeparator && !a.isTotalCalculator
                                  );
                                  if (指す < 0) 指す = 0;
                                  if (t === 指す) 案内.setTutorialTargetNode('記録.射手選択', node);
                                },
                                style: {
                                  width:
                                    (e.isSeparator ? F.UIConfig.separatorWidth : F.UIConfig.cellWidth) * se,
                                  height: F.UIConfig.footerHeight * se,
                                  backgroundColor: e.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                                  borderRightWidth: e.isSeparator || e.isTotalCalculator ? 1.5 : 1,
                                  borderRightColor: '#000',
                                  borderLeftWidth: e.isSeparator || e.isTotalCalculator ? 1.5 : 0,
                                  borderLeftColor: '#000',
                                  padding: 4,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                },
                                children: e.isSeparator
                                  ? (0, A.jsx)(h.default, {
                                      style: {
                                        alignItems: 'center',
                                        width: '100%',
                                        height: '100%',
                                        justifyContent: 'center',
                                      },
                                      onPress: () => M(e.id),
                                      disabled: $e,
                                      children: (0, A.jsx)(p.Ionicons, {
                                        name: 'close-circle',
                                        size: 24 * se,
                                        color: '#8E8E93',
                                      }),
                                    })
                                  : (0, A.jsxs)(h.default, {
                                      style: {
                                        alignItems: 'center',
                                        width: '100%',
                                        height: '100%',
                                        justifyContent: 'center',
                                      },
                                      onPress: () => qe(e.id, e.name, t),
                                      children: [
                                        (0, A.jsx)(a.default, {
                                          style: [
                                            W.footerName,
                                            { color: e.name ? '#000' : '#8E8E93', fontSize: 14 * se },
                                          ],
                                          numberOfLines: 2,
                                          children: e.isTotalCalculator
                                            ? '合計'
                                            : e.name
                                              ? ((o = e.name), (0, v.formatMemberName)(o, oe))
                                              : '選択',
                                        }),
                                        !!e.isGuest &&
                                          (0, A.jsx)(a.default, {
                                            style: [W.guestLabel, { fontSize: 9 * se }],
                                            children: '(ゲスト)',
                                          }),
                                        !e.isTotalCalculator && '' !== e.name
                                          ? (0, A.jsx)(l.default, {
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
                                              children: (0, A.jsx)(p.Ionicons, {
                                                name: 'person',
                                                size: 10 * se,
                                                color: '#FFF',
                                              }),
                                            })
                                          : null,
                                      ],
                                    }),
                              },
                              typeof e.id === 'string' ? `footer-${e.id}` : `footer-${t}`
                            );
                            var o;
                          }),
                      }),
                    }),
                  ],
                }),
              ],
            }),
            0 === k.length &&
              (0, A.jsxs)(l.default, {
                style: W.emptyOverlay,
                children: [
                  (0, A.jsx)(a.default, { style: W.emptyTitle, children: '記録を始めましょう' }),
                  (0, A.jsx)(a.default, { style: W.emptyHint, children: '下の「人」ボタンで射手を追加' }),
                ],
              }),
          ],
        }),
        帯を畳む
          ? null
          : (0, A.jsx)(l.default, {
          style: W.toolbar,
          children: (0, A.jsxs)(A.Fragment, {
            children: [
              (0, A.jsxs)(l.default, {
                ref: 案内の取り消し,
                style: W.historyBtns,
                children: [
                  (0, A.jsx)(f.default, {
                    style: ({ hovered: e }) => [
                      W.historyBtn,
                      { opacity: 戻せる ? 1 : 0.3 },
                      e && 戻せる && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                    ],
                    onPress: () => {
                      // ライブ中は共有の知らせ（「取り消しされました。」）が
                      // 押した本人にも出る。ここでも出すと二つ重なる
                      戻せる &&
                        (D(),
                        ライブの知らせに任せる || Ge('元に戻しました'),
                        j.impactAsync(j.ImpactFeedbackStyle.Light));
                    },
                    disabled: !戻せる,
                    // 自動での確かめ用。絵だけのボタンは外から指せない
                    testID: '取り消し',
                    children: (0, A.jsx)(p.Ionicons, { name: 'arrow-undo', size: 24, color: '#8E8E93' }),
                  }),
                  (0, A.jsx)(f.default, {
                    style: ({ hovered: e }) => [
                      W.historyBtn,
                      { opacity: 進める ? 1 : 0.3 },
                      e && 進める && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                    ],
                    onPress: () => {
                      進める &&
                        (H(),
                        ライブの知らせに任せる || Ge('やり直しました'),
                        j.impactAsync(j.ImpactFeedbackStyle.Light));
                    },
                    disabled: !進める,
                    testID: 'やり直し',
                    children: (0, A.jsx)(p.Ionicons, { name: 'arrow-redo', size: 24, color: '#8E8E93' }),
                  }),
                  // 記録表の並べ方を変える。絵だけでは向きが読み取りにくいので、
                  // 押したあとに何になったかを短く知らせる
                  (0, A.jsxs)(f.default, {
                    style: ({ hovered: e }) => [
                      W.historyBtn,
                      // 取り消し・やり直しと同じ幅にそろえる。絵が小さいぶん
                      // 放っておくと28pxになり、この並びで一番押しにくいボタンになる
                      { alignItems: 'center', minWidth: 32 },
                      e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                    ],
                    onPress: () => {
                      const 次 = !横に並べる;
                      (set横に並べる && set横に並べる(次),
                        Ge(次 ? '横に並べました' : '縦に並べました'),
                        j.impactAsync(j.ImpactFeedbackStyle.Light));
                    },
                    testID: '並べ方',
                    children: [
                      (0, A.jsx)(p.Ionicons, {
                        name: 横に並べる ? 'phone-portrait-outline' : 'phone-landscape-outline',
                        size: 20,
                        color: '#8E8E93',
                      }),
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 9, color: '#8E8E93', marginTop: 1 },
                        children: 横に並べる ? '縦へ' : '横へ',
                      }),
                    ],
                  }),
                ],
              }),
              (0, A.jsxs)(l.default, {
                style: W.addBtns,
                children: [
                  (0, A.jsxs)(f.default, {
                    ref: 案内の人ボタン,
                    style: ({ hovered: e }) => [
                      W.addBtn,
                      { backgroundColor: 'rgba(0,122,255,0.1)' },
                      e && m.IS_WEB && { backgroundColor: 'rgba(0,122,255,0.2)' },
                    ],
                    onPress: () => {
                      (j.impactAsync(j.ImpactFeedbackStyle.Medium), R());
                    },
                    children: [
                      (0, A.jsx)(p.Ionicons, { name: 'person-add', size: 24, color: '#007AFF' }),
                      (0, A.jsx)(a.default, { style: [W.addLabel, { color: '#007AFF' }], children: '人' }),
                    ],
                  }),
                  (0, A.jsxs)(f.default, {
                    ref: 案内の間隔,
                    style: ({ hovered: e }) => [
                      W.addBtn,
                      { backgroundColor: 'rgba(255,149,0,0.1)' },
                      e && m.IS_WEB && { backgroundColor: 'rgba(255,149,0,0.2)' },
                    ],
                    onPress: () => {
                      (j.impactAsync(j.ImpactFeedbackStyle.Light), P());
                    },
                    children: [
                      (0, A.jsx)(p.Ionicons, { name: 'pause', size: 24, color: '#FF9500' }),
                      (0, A.jsx)(a.default, { style: [W.addLabel, { color: '#FF9500' }], children: '間隔' }),
                    ],
                  }),
                  (0, A.jsxs)(f.default, {
                    ref: 案内の計,
                    style: ({ hovered: e }) => [
                      W.addBtn,
                      { backgroundColor: 'rgba(52,199,89,0.1)' },
                      e && m.IS_WEB && { backgroundColor: 'rgba(52,199,89,0.2)' },
                    ],
                    onPress: () => {
                      (j.impactAsync(j.ImpactFeedbackStyle.Light), L());
                    },
                    children: [
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 22, fontWeight: 'bold', color: '#34C759' },
                        children: '\u03a3',
                      }),
                      (0, A.jsx)(a.default, { style: [W.addLabel, { color: '#34C759' }], children: '計' }),
                    ],
                  }),
                  (0, A.jsxs)(f.default, {
                    ref: 案内の画像,
                    style: ({ hovered: e }) => [
                      W.addBtn,
                      { backgroundColor: 'rgba(142,142,147,0.1)' },
                      e && m.IS_WEB && { backgroundColor: 'rgba(142,142,147,0.2)' },
                    ],
                    onPress: () => {
                      (j.impactAsync(j.ImpactFeedbackStyle.Medium), setShowOCRModal(!0));
                    },
                    children: [
                      (0, A.jsx)(p.Ionicons, { name: 'camera', size: 24, color: '#8E8E93' }),
                      (0, A.jsx)(a.default, { style: [W.addLabel, { color: '#8E8E93' }], children: '画像' }),
                    ],
                  }),
                ],
              }),
              (0, A.jsx)(f.default, {
                ref: 案内の保存ボタン,
                style: ({ hovered: e }) => [
                  W.saveBtn,
                  e && m.IS_WEB && { opacity: 0.9, transform: [{ scale: 1.02 }] },
                ],
                onPress: () => {
                  if (0 === k.length) return;
                  // 設定で出欠確認を切っていれば、窓を飛ばして保存へ進む。
                  // 出欠は空のまま保存する。記録に出ている人は出欠画面で
                  // そのまま出席として数えられる（遅刻・早退の区別は付かない）
                  if (保存時に出欠を確認する) setShowAttendance(!0);
                  else (setTempAttendance(null), xe(!0));
                },
                children: (0, A.jsx)(a.default, { style: W.saveBtnText, children: '終了・保存' }),
              }),
            ],
          }),
        }),
        (0, A.jsx)(S.ArcherActionModal, {
          交代を消せる: !0,
          visible: de,
          archerId: ue || '',
          archerOrigIdx: he,
          isSeparator: (Array.isArray(k) ? k : []).find((e) => e && e.id === ue)?.isSeparator || !1,
          isTotalCalculator:
            (Array.isArray(k) ? k : []).find((e) => e && e.id === ue)?.isTotalCalculator || !1,
          onClose: () => ce(!1),
          onSubstitution: () => be(!0),
        }),
        (0, A.jsx)(AttendanceCheckModal, {
          visible: showAttendance,
          onClose: () => setShowAttendance(!1),
          onConfirm: (attendance) => {
            (setTempAttendance(attendance), setShowAttendance(!1), xe(!0));
          },
          members: oe,
          activeArchers: k,
        }),
        (0, A.jsx)(C.SaveSessionModal, {
          visible: me,
          onClose: () => xe(!1),
          onSave: (e, t, o, l) => {
            (xe(!1), j.notificationAsync(j.NotificationFeedbackType.Success));
            const n = l
              .split(/[,\u3001\s]+/)
              .map((e) => (e.startsWith('#') ? e : `#${e}`))
              .map((e) => e.trim())
              .filter((e) => '#' !== e);
            (U(e, t, o, n, tempAttendance),
              x.useScoreStore.getState().setCurrentSessionTags([]),
              Ge('保存しました'));
          },
        }),
        (0, A.jsx)(I.ManualSubstitutionModal, { visible: ye, archerId: ue, onClose: () => be(!1) }),
        (0, A.jsx)(d.default, {
          visible: pe,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => Ce(!1),
          children: (0, A.jsxs)(l.default, {
            style: W.modalBackdrop,
            children: [
              (0, A.jsx)(h.default, {
                style: s.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => Ce(!1),
              }),
              (0, A.jsxs)(l.default, {
                style: W.modalContent,
                children: [
                  (0, A.jsx)(a.default, { style: W.modalTitle, children: 'すべての記録をリセット' }),
                  (0, A.jsx)(a.default, {
                    style: W.modalMessage,
                    children:
                      '現在入力されているすべての的中記録と交代設定、およびすべてのデータが削除されます。リセットしてよろしいですか？',
                  }),
                  (0, A.jsxs)(l.default, {
                    style: W.modalButtonsRow,
                    children: [
                      (0, A.jsx)(f.default, {
                        style: ({ hovered: e }) => [
                          W.modalBtn,
                          { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                          e && m.IS_WEB && { backgroundColor: '#E5E5EA' },
                        ],
                        onPress: () => Ce(!1),
                        children: (0, A.jsx)(a.default, {
                          style: [W.modalBtnText, { color: '#007AFF' }],
                          children: 'キャンセル',
                        }),
                      }),
                      (0, A.jsx)(f.default, {
                        style: ({ hovered: e }) => [
                          W.modalBtn,
                          { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                          e && m.IS_WEB && { opacity: 0.8 },
                        ],
                        onPress: () => {
                          (Ce(!1),
                            te(),
                            j.notificationAsync(j.NotificationFeedbackType.Warning),
                            Ge('リセットしました。'));
                        },
                        children: (0, A.jsx)(a.default, {
                          style: [W.modalBtnText, { color: '#FFF' }],
                          children: 'リセット',
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        (0, A.jsx)(d.default, {
          visible: Ie,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => ve(!1),
          children: (0, A.jsxs)(l.default, {
            style: W.modalBackdrop,
            children: [
              (0, A.jsx)(h.default, {
                style: s.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => ve(!1),
              }),
              (0, A.jsxs)(l.default, {
                style: W.modalContent,
                children: [
                  (0, A.jsx)(a.default, { style: W.modalTitle, children: '射数を減らしますか？' }),
                  (0, A.jsxs)(a.default, {
                    style: W.modalMessage,
                    children: [
                      '射数を',
                      Be,
                      '射に減らすと、後ろの入力済みデータがすべて削除されます。よろしいですか？',
                    ],
                  }),
                  (0, A.jsxs)(l.default, {
                    style: W.modalButtonsRow,
                    children: [
                      (0, A.jsx)(h.default, {
                        style: [W.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }],
                        onPress: () => ve(!1),
                        children: (0, A.jsx)(a.default, {
                          style: [W.modalBtnText, { color: '#007AFF' }],
                          children: 'キャンセル',
                        }),
                      }),
                      (0, A.jsx)(h.default, {
                        style: [W.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }],
                        onPress: () => {
                          (ve(!1), G(Be), j.impactAsync(j.ImpactFeedbackStyle.Medium));
                        },
                        children: (0, A.jsx)(a.default, {
                          style: [W.modalBtnText, { color: '#FFF' }],
                          children: '削除して変更',
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        (0, A.jsx)(d.default, {
          visible: ke,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => We(!1),
          children: (0, A.jsxs)(l.default, {
            style: W.modalBackdrop,
            children: [
              (0, A.jsx)(h.default, {
                style: s.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => We(!1),
              }),
              (0, A.jsxs)(l.default, {
                style: W.modalContent,
                children: [
                  (0, A.jsx)(a.default, { style: W.modalTitle, children: '射数の詳細設定' }),
                  (0, A.jsx)(a.default, {
                    style: W.modalMessage,
                    children: '1〜500本の間で入力してください',
                  }),
                  (0, A.jsx)(c.default, {
                    style: W.modalInput,
                    keyboardType: 'number-pad',
                    value: Te,
                    onChangeText: ze,
                    onSubmitEditing: Ye,
                    autoFocus: !0,
                  }),
                  (0, A.jsxs)(l.default, {
                    style: W.modalButtonsRow,
                    children: [
                      (0, A.jsx)(f.default, {
                        style: ({ hovered: e }) => [
                          W.modalBtn,
                          { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                          e && m.IS_WEB && { backgroundColor: '#E5E5EA' },
                        ],
                        onPress: () => We(!1),
                        children: (0, A.jsx)(a.default, {
                          style: [W.modalBtnText, { color: '#007AFF' }],
                          children: 'キャンセル',
                        }),
                      }),
                      (0, A.jsx)(f.default, {
                        style: ({ hovered: e }) => [
                          W.modalBtn,
                          { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                          e && m.IS_WEB && { opacity: 0.8 },
                        ],
                        onPress: Ye,
                        children: (0, A.jsx)(a.default, {
                          style: [W.modalBtnText, { color: '#FFF' }],
                          children: '決定',
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        Fe
          ? (0, A.jsx)(l.default, {
              style: W.feedbackOverlay,
              children: (0, A.jsx)(a.default, { style: W.feedbackText, children: Fe }),
            })
          : null,
        (0, A.jsx)(OCRRecordModal, {
          visible: showOCRModal,
          onClose: () => setShowOCRModal(!1),
          members: oe,
          alumni: (0, x.useScoreStore)((e) => e.alumni) || [],
          shotsPerRound: T,
          // 取り込みは記録表を丸ごと置き換える。中身があるなら先に確かめてもらう
          hasExistingRecord: k.length > 0,
          onApply: (newArchers, 読み取りの種類) => {
            const store = x.useScoreStore.getState();
            store.historyStack &&
              store.historyStack.length >= 0 &&
              x.useScoreStore.setState({
                // 履歴には射手の一覧をそのまま積む（店の中の積み方と同じ）。
                // ここだけ { archers, activeSessionID } という形で積んでいたため、
                // 取り込んだ直後に取り消しを押すと盤面が空になっていた
                historyStack: [...store.historyStack, [...k]],
                redoStack: [],
              });
            // 読み取った○×は「いま入れたもの」として扱う。
            // 印を付けないと初めから閉じてしまい、直すのが全部長押しになる。
            // 盤面より先に印を付ける。逆にすると印の無い盤面が一度描かれ、
            // 読み取った○×が一瞬すべて灰色に光ってから戻る
            x.useScoreStore.getState().入れた印をまとめて付ける(newArchers);
            x.useScoreStore.setState({ archers: newArchers });
            // 紙の記録は氏名と○×を、立ち順表は並びだけを読む。
            // どちらも同じ処理を通るので、文言は種類で分ける
            Ge(
              'record' === 読み取りの種類 ? '画像から記録を読み取りました' : '画像から立ち順を登録しました'
            );
            j.notificationAsync(j.NotificationFeedbackType.Success);
          },
        }),
        (0, A.jsx)(ArrowLocationPopover, {
          visible: !!activeArrowLocationEdit,
          onClose: () => setActiveArrowLocationEdit(null),
          archerId: activeArrowLocationEdit?.archerId,
          shotIndex: activeArrowLocationEdit?.shotIndex,
          currentMark: activeArrowLocationEdit?.currentMark,
          arrowLocations: activeArrowLocationEdit?.arrowLocations,
          onSave: () => setActiveArrowLocationEdit(null),
        }),
      ],
    });
  },
  W = s.default.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFF',
      paddingTop: m.IS_WEB ? m.WEB_TOP_PADDING : m.SAFE_TOP_PADDING,
    },
    navBar: {
      minHeight: 48,
      backgroundColor: '#FFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      // 細い画面では右の群が下の段へ回る。
      // 一列に詰め込むと端が切れて、押せないボタンが出てしまう
      flexWrap: 'wrap',
      rowGap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5EA',
    },
    navLeft: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
    syncContainer: { flexDirection: 'row', alignItems: 'center' },
    syncTimeText: { fontSize: 9, color: '#8E8E93' },
    // 群（ライブ／立ちの増減／表示の大きさ）どうしは離し、群の中はくっつける
    navRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    resetBtn: {
      zIndex: 10001,
      backgroundColor: '#FF3B30',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      marginRight: 2,
    },
    resetBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    groupBadge: {
      marginLeft: 4,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    groupBadgeWeb: Object.assign(
      {
        backgroundColor: 'rgba(0,122,255,0.1)',
        borderColor: 'rgba(0,122,255,0.2)',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
      },
      (0, B.getShadowStyle)({
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      })
    ),
    liveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,122,255,0.1)',
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 3,
    },
    liveBtnActive: { backgroundColor: '#FF3B30' },
    liveBtnText: { fontSize: 12, color: '#007AFF', fontWeight: 'bold' },
    liveBtnTextActive: { color: '#FFF' },
    zoomContainer: { flexDirection: 'row', alignItems: 'center', gap: 0 },
    zoomBtn: { padding: 1 },
    shotsToggle: { paddingHorizontal: 2, paddingVertical: 4, zIndex: 10001, minWidth: 34, alignItems: 'center' },
    shotsText: { fontSize: 13, color: '#5856D6', fontWeight: 'bold' },
    // 拡大率。押せることが分かるよう、軽く枠で囲う
    zoomToggle: {
      flexDirection: 'column',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#C7C7CC',
      minWidth: 62,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoomLabel: { fontSize: 9, color: '#8E8E93', fontWeight: '600' },
    zoomValue: { flexDirection: 'row', alignItems: 'center', gap: 1 },
    zoomText: { fontSize: 12, color: '#007AFF', fontWeight: 'bold' },
    // 拡大率のバー。溝そのものは細いので、当たり判定だけ広く取る
    バーの行: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#EFEFF4',
    },
    溝の当たり: { flex: 1, height: 36, justifyContent: 'center' },
    溝: { height: 4, borderRadius: 2, backgroundColor: '#E5E5EA' },
    溝の済み: {
      position: 'absolute',
      left: 0,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#007AFF',
    },
    つまみ: {
      position: 'absolute',
      width: 22,
      height: 22,
      marginLeft: -11,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#C7C7CC',
      ...(m.IS_WEB ? { boxShadow: '0 1px 4px rgba(0,0,0,0.3)' } : { elevation: 3 }),
    },
    バーの数字: { fontSize: 13, color: '#3C3C43', fontWeight: 'bold', minWidth: 44, textAlign: 'right' },
    liveStatusHeader: {
      height: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#8E8E93',
      gap: 6,
    },
    liveHostHeader: { backgroundColor: '#007AFF' },
    liveJoinHeader: { backgroundColor: '#007AFF' },
    liveActiveHeader: { backgroundColor: '#007AFF' },
    liveStatusText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    gridArea: { flex: 1, backgroundColor: '#FFF' },
    tallWrapper: { flex: 1, flexDirection: 'column' },
    gridRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', minWidth: '100%' },
    fixedFooter: {
      flexDirection: 'row',
      height: F.UIConfig.footerHeight,
      backgroundColor: '#F2F2F7',
      borderTopWidth: 1,
      borderTopColor: '#C6C6C8',
    },
    footerLabelCell: {
      width: F.UIConfig.headerWidth,
      height: F.UIConfig.footerHeight,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      borderRightWidth: 1,
      borderRightColor: '#000',
    },
    footerLabelText: { fontSize: 10, fontWeight: 'bold', color: '#3C3C43' },
    footerNameCell: {
      height: F.UIConfig.footerHeight,
      justifyContent: 'center',
      alignItems: 'center',
      borderRightWidth: 1,
      borderRightColor: '#000',
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      padding: 4,
    },
    footerName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
    guestLabel: { fontSize: 9, color: '#8E8E93' },
    emptyOverlay: Object.assign({}, s.default.absoluteFillObject, {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFF',
    }),
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
    emptyHint: { fontSize: 14, color: '#8E8E93' },
    // 帯を畳む取っ手。畳んでいても押せるように浮かせる
    帯の取っ手: {
      position: 'absolute',
      right: 8,
      top: 8,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(242,242,247,0.95)',
      borderWidth: s.default.hairlineWidth,
      borderColor: '#C6C6C8',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1e4,
    },
    toolbar: {
      height: m.IS_WEB ? 70 : 80,
      backgroundColor: '#FFF',
      borderTopWidth: s.default.hairlineWidth,
      borderTopColor: '#C6C6C8',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    // はみ出しても隣を覆わないように、この箱の中で切る（念のための二重の備え）
    addBtns: { flexDirection: 'row', gap: 4, flex: 1, justifyContent: 'center', minWidth: 0, overflow: 'hidden' },
    addBtn: {
      flex: 1,
      // 狭い画面では縮ませる。minWidth を置くと入り切らないぶんが枠の外へ
      // あふれ、justifyContent: center のせいで左右へ均等に漏れて、
      // 隣のボタンを覆う。320px幅の端末で「並べ方」が押せなくなっていた
      minWidth: 0,
      maxWidth: 62,
      height: 56,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addLabel: { fontSize: 10, marginTop: 4, fontWeight: 'bold' },
    historyBtns: { flexDirection: 'row', gap: 2 },
    historyBtn: { padding: 4 },
    saveBtn: {
      backgroundColor: '#FF3B30',
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 64,
      justifyContent: 'center',
      flexShrink: 0,
    },
    saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
    feedbackOverlay: {
      position: 'absolute',
      bottom: 100,
      // 知らせの帯は見せるだけ。指は下の記録表へ通す。
      // 長押しで鍵を開けた直後は、まさにその下のますを押したいことが多い
      pointerEvents: 'none',
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    feedbackText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
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
    modalInput: {
      width: '100%',
      height: 44,
      borderWidth: 1,
      borderColor: '#C6C6C8',
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 18,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalButtonsRow: { flexDirection: 'row', width: '100%' },
    modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    modalBtnText: { fontSize: 16, fontWeight: 'bold' },
  });
