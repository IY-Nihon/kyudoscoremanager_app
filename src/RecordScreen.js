/**
 * Module ID: 593
 */
'use strict';

const _e = exports;

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
var RN = require('react-native'),
  t = require('react'),
  o = e(t),
  l = e(require('./View')),
  n = e(require('./ScrollView')),
  s = e(require('./StyleSheet')),
  a = e(require('./Text')),
  d = e(require('./Modal')),
  c = e(require('./TextInput')),
  u = e(require('./alertBridge')),
  f = e(require('./Pressable'));
require('./platform');
var h = e(require('./TouchableOpacity')),
  m = require('./IS_WEB');
require('react-native-safe-area-context');
var x = require('./useScoreStore'),
  案内 = require('./TutorialGuide'),
  在 = require('./livePresence'),
  y = require('./ArcherColumnView'),
  組 = require('./teamGrouping'),
  b = require('./LabelColumn'),
  F = require('./uiConfig'),
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
  })(require('expo-haptics')),
  S = require('./ArcherActionModal'),
  p = require('@expo/vector-icons'),
  C = require('./SaveSessionModal'),
  AttendanceCheckModal = require('./AttendanceCheckModal').AttendanceCheckModal,
  I = require('./ManualSubstitutionModal'),
  v = require('./formatMemberName'),
  B = require('./shadowStyle'),
  A = require('./themedJsx'),
  { ArrowLocationPopover } = require('./ArrowLocationPopover'),
  { OCRRecordModal } = require('./OCRRecordModal'),
  { LiveShareModal } = require('./LiveShareModal'),
  期限 = require('./liveShare');
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
        setSeparatorTeam: 区切りにチーム名を付ける,
        toggleTotalScope: 合計の範囲を切り替える,
        列を動かす,
        列を並べ替える,
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
        // 閉じたますを押した時刻。開け方を知らせる合図
        閉じたますを押した時刻 = 0,
        // 閲覧用でますを押した時刻。閲覧用だと知らせる合図
        閲覧でますを押した時刻 = 0,
        // 記録表の並べ方。真なら名前が左、○×が右へ伸びる
        横に並べる = !1,
        set横に並べる,
        // 上下の帯を畳んでいるか。端末に残す（並べ方と同じ扱い）
        帯を畳む: 畳む覚え = !1,
        set帯を畳む,
        // ライブに「見るだけ」で入っているか
        ライブは見るだけ = !1,
      } = (0, x.useScoreStore)(),
      se = 'number' == typeof q && !isNaN(q) && q > 0 ? q : 1;
    if (!re) return null;
    // ライブに何台つないでいるか。電波の切れる弓道場で、
    // 相手に届いているかをその場で見るために出す（src/livePresence.js）
    const 接続の文言 = 在.台数の文言((0, x.useScoreStore)((e) => e.ライブの接続台数));
    // ライブをURLで配る窓。主催者だけが開ける
    const [共有の窓, 共有の窓を出す] = (0, t.useState)(!1);
    // 共有リンクだけで来ている人。団体の名簿を持っていない
    const 来客 = (0, x.useScoreStore)((e) => e.共有の来客);
    // よその団体のライブに共有リンクで入っているか。保存はさせない
    const よその団体 = (0, x.useScoreStore)((e) => e.よその団体のライブ);
    // 配ったリンクの期限。帯に「あと30分」を出すために見る
    const ライブの期限 = (0, x.useScoreStore)((e) => e.いまのライブの期限);
    // 残りは時間で減るので、こちらから数え直さないと止まって見える。
    // ただし数え直すたびに記録画面ぜんぶが描き直る。いつ起きればよいかは
    // liveShare の 次に数え直すまで が決める（帯に出るころまでは眠る）
    const [いま, いまを進める] = (0, t.useState)(() => Date.now());
    (0, t.useEffect)(() => {
      const 次 = 期限.次に数え直すまで(ライブの期限, いま);
      if (次 === null) return;
      const 札 = setTimeout(() => いまを進める(Date.now()), 次);
      return () => clearTimeout(札);
    }, [ライブの期限, いま]);
    // 近いときだけ出す。ずっと出していると場所を取るだけで読まれなくなる
    const 期限の残り = 期限.期限の短い文言(ライブの期限, いま);
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
      // 区切りにチーム名を付ける窓（リーグの大学名）。
      // どの区切りを触っているかと、入力中の文字を持つ
      [チーム名を付ける区切り, setチーム名を付ける区切り] = (0, t.useState)(null),
      [チーム名の下書き, setチーム名の下書き] = (0, t.useState)(''),
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
      // 参加のしかたを聞いている最中のライブ名。null なら聞いていない
      [参加のしかたを聞く, 参加のしかたを聞くを置く] = (0, t.useState)(null),
      // アプリ内の確認。{ 文, 実行 } を入れると出る。ブラウザの確認窓は使わない
      [確認, 確認を置く] = (0, t.useState)(null),
      閉じた知らせを出した = o.default.useRef(0),
      閲覧の知らせを出した = o.default.useRef(0),
      Ve = o.default.useRef(null),
      Ue = o.default.useRef(null),
      Ge = (e) => {
        (je(e), setTimeout(() => je(null), 1500));
      };
    (o.default.useEffect(() => {
      // 同期の失敗はいつも知らせる。切り替えで消せるようにしていたころは、
      // 切っていることを忘れたまま何日も同期できていない状態になり得た。
      // しかも切り替えは保存されておらず、開き直すと勝手に戻っていた
      '同期エラー' === z && je('同期エラー: クラウドとの同期に失敗しました');
    }, [z]),
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
      // 閉じたますを押されたら、開け方を知らせる。
      // 黙って何も起きないと、壊れたと思って何度も押すことになる
      o.default.useEffect(() => {
        if (閉じたますを押した時刻 > 0 && 閉じた知らせを出した.current < 閉じたますを押した時刻) {
          ((閉じた知らせを出した.current = 閉じたますを押した時刻),
            Ge('このマスは鍵がかかっています。長押しで開きます'),
            j.notificationAsync(j.NotificationFeedbackType.Warning));
        }
      }, [閉じたますを押した時刻]),
      // 閲覧用でますを押されたら、閲覧用だと知らせる。
      // 黙って何も起きないと、届いていないのか壊れたのか分からない
      o.default.useEffect(() => {
        if (閲覧でますを押した時刻 > 0 && 閲覧の知らせを出した.current < 閲覧でますを押した時刻) {
          ((閲覧の知らせを出した.current = 閲覧でますを押した時刻), 閲覧中に押された());
        }
      }, [閲覧でますを押した時刻]),
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
    // 閲覧用のときは何も変えず、そのことだけ短く知らせる。
    // 押しても無反応だと、壊れたのか決まりなのか分からない
    const 閲覧中に押された = () => {
      (Ge('閲覧用で参加しています'), j.notificationAsync(j.NotificationFeedbackType.Warning));
    };
    // ライブに入る。ポップアップから呼ぶので、画面の上のほうに置く
    const ライブに入る = (名, 見るだけ) => {
      (Ge(見るだけ ? '閲覧用で参加しています...' : '記録用で参加しています...'),
        Oe(!1),
        x.useScoreStore.getState().joinLiveSync(名, 見るだけ),
        j.notificationAsync(j.NotificationFeedbackType.Success));
    };
    // 閲覧用で入っているあいだは、鍵ボタンなども触れないようにする
    const $e = !!(K && ライブは見るだけ),
      qe = (e, t, o) => {
        // 閲覧用のときは人の選択も開かない。開いても名前も交代も削除も
        // 止めてあるので、開くだけ無駄に迷わせる
        if ($e) return void 閲覧中に押された();
        // 共有リンクで来た人は団体の名簿を持っていない。開いても空の一覧が
        // 出るだけなので、開かずに理由を伝える
        if (来客)
          return void (Ge('共有リンクでは名前を選べません'),
          j.notificationAsync(j.NotificationFeedbackType.Warning));
        j.impactAsync(j.ImpactFeedbackStyle.Medium);
        k.find((t) => t.id === e) && (fe(e), ge(o), ce(!0));
      },
      // ── 立ち順を指で動かす（長押しで掴んで、滑らせて、離す）───────────
      //
      // 表は横に流れるので、掴む前は今までどおりスクロールできるようにする。
      // 掴んでいる間だけスクロールを止め、そのあいだの横の動きを並べ替えに使う。
      // 掴まないまま指を滑らせると、表が動くのか列が動くのか分からなくなる。
      [掴んだ列, set掴んだ列] = (0, t.useState)(null),
      [落とす先, set落とす先] = (0, t.useState)(null),
      // 指の横の位置（名前の行の中での座標）。運ぶ札をここに置く
      [指の横, set指の横] = (0, t.useState)(null),
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

    // ── 立ち順を指で動かす仕掛け ────────────────────────────────
    //
    // 名前の欄を長押しすると、その列を掴む。掴んでいる間だけ表のスクロールを
    // 止め、指の下にある列を「落とす先」として光らせる。指を離した所へ入れる。
    // 動かすのは離したとき1回だけなので、取り消し1回で元に戻る。
    //
    // PanResponder は作り直さない（作り直すと掴んでいる最中に取り落とす）。
    // そのぶん中で使う値が古くなるので、毎回の描画で「手」を入れ替える。
    const 名の欄のnode = (0, t.useRef)({}),
      掴んだ列のref = (0, t.useRef)(null),
      落とす先のref = (0, t.useRef)(null),
      動かし始めた = (0, t.useRef)(!1),
      測る手 = (0, t.useRef)(null),
      離す手 = (0, t.useRef)(null),
      並べ替えの手 = (0, t.useRef)(null),
      名の行のnode = (0, t.useRef)(null);

    // いま画面に描く並び。掴んでいる間は「離したらこうなる」並びを先に見せる。
    // 指の下の列と入れ替えて描くので、出来上がりを見てから離せる。
    // 掴んだ列は抜けた跡として薄く残し、指には別の札（下の 運ぶ札）が付いてくる
    const 見えている並び = (() => {
      const 一覧 = (Array.isArray(k) ? k : []).filter((e) => !!e);
      if (!掴んだ列 || null === 落とす先) return 一覧;
      const いま = 一覧.findIndex((x) => x.id === 掴んだ列);
      if (いま < 0 || いま === 落とす先) return 一覧;
      const 写し = [...一覧];
      写し.splice(落とす先, 0, 写し.splice(いま, 1)[0]);
      return 写し;
    })();

    // 指のいる場所（ページの座標）から、その下にある列の番号を出す。
    // 縦に並べているときは横の位置で、横に並べているときは縦の位置で決める
    //（縦の表は列が横に並び、横の表は上から下へ積まれるため）。
    // 端からはみ出したときは、いちばん近い端の列にする。
    // 測るのは「いま描いている並び」。掴んだ列は指の下にあるので、
    // そのまま同じ番号が返り、行ったり来たりしない
    測る手.current = (指の位置) => {
      const 一覧 = 見えている並び;
      const 箱 = [];
      for (let i = 0; i < 一覧.length; i++) {
        const node = 名の欄のnode.current[一覧[i].id];
        if (!node || 'function' != typeof node.getBoundingClientRect) continue;
        const r = node.getBoundingClientRect();
        const ずれ =
          'undefined' == typeof window ? 0 : (横に並べる ? window.scrollY : window.scrollX) || 0;
        箱.push({
          i,
          頭: (横に並べる ? r.top : r.left) + ずれ,
          尻: (横に並べる ? r.bottom : r.right) + ずれ,
        });
      }
      if (!箱.length) return null;
      for (const x of 箱) if (指の位置 >= x.頭 && 指の位置 <= x.尻) return x.i;
      const 手前 = 箱.reduce((a, b) => (a.頭 < b.頭 ? a : b));
      const 奥 = 箱.reduce((a, b) => (a.尻 > b.尻 ? a : b));
      if (指の位置 < 手前.頭) return 手前.i;
      if (指の位置 > 奥.尻) return 奥.i;
      return null;
    };

    // 指の動きを直に受ける（横に並べたとき用）。
    // 掴んでいないときは何もしないので、ふつうの押す・流すの邪魔をしない
    const 指が動いた = (ev) => {
      if (!掴んだ列のref.current) return;
      const e = ev && ev.nativeEvent ? ev.nativeEvent : ev;
      if (!e) return;
      const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || null;
      const 縦位置 = e.pageY != null ? e.pageY : t ? t.pageY : null;
      if (縦位置 == null) return;
      動かし始めた.current = !0;
      const 行 = 名の行のnode.current;
      if (行 && 'function' == typeof 行.getBoundingClientRect) {
        const r = 行.getBoundingClientRect();
        const ずれ = 'undefined' != typeof window && window.scrollY ? window.scrollY : 0;
        set指の横(縦位置 - (r.top + ずれ));
      }
      const i = 測る手.current ? 測る手.current(縦位置) : null;
      if (null !== i && i !== 落とす先のref.current) {
        ((落とす先のref.current = i), set落とす先(i));
      }
    };
    const 指を離した = () => {
      if (!掴んだ列のref.current) return;
      離す手.current && 離す手.current();
    };

    // 掴む／掴みを解く。縦でも横でも同じものを使う
    const 掴む = (id) => {
      if ($e) return void 閲覧中に押された();
      ((掴んだ列のref.current = id),
        (落とす先のref.current = null),
        (動かし始めた.current = !1),
        set掴んだ列(id),
        set落とす先(null),
        Ge('動かす先へ指をすべらせて、離してください'),
        j.impactAsync(j.ImpactFeedbackStyle.Medium));
    };
    // 掴んだだけで動かさずに離したときは、掴みを解く。
    // 動かし始めていれば PanResponder が受け持つので触らない
    const 掴みを見直す = () => {
      setTimeout(() => {
        if (!動かし始めた.current && 掴んだ列のref.current) 掴むのをやめる();
      }, 60);
    };

    const 掴むのをやめる = () => {
      ((掴んだ列のref.current = null),
        (落とす先のref.current = null),
        (動かし始めた.current = !1),
        set掴んだ列(null),
        set落とす先(null),
        set指の横(null));
    };

    離す手.current = () => {
      const id = 掴んだ列のref.current,
         先 = 落とす先のref.current;
      掴むのをやめる();
      if (!id || null === 先) return;
      // 画面にはもう「離したらこうなる」並びが出ている。その並びのとおりに
      // 決めるだけなので、指していた番号をそのまま渡す
      const 元の一覧 = (Array.isArray(k) ? k : []).filter((e) => !!e);
      const いま = 元の一覧.findIndex((x) => x.id === id);
      if (いま < 0 || いま === 先) return;
      (列を並べ替える(id, 先), Ge('立ち順を変えました'));
      j.impactAsync(j.ImpactFeedbackStyle.Medium);
    };

    if (!並べ替えの手.current)
      並べ替えの手.current = RN.PanResponder.create({
        // 掴んでいないときは何も奪わない。ふつうのスクロールと押すが効く
        onStartShouldSetPanResponder: () => !1,
        onMoveShouldSetPanResponder: () => !!掴んだ列のref.current,
        // 掴んでいる間は、子（ますや名前のボタン）や外の流れより先に受け取る。
        // 先取りしないと、横に並べたときに指の動きが流れ側へ持っていかれて、
        // 掴めているのに動かせない（実際そうなった）
        onStartShouldSetPanResponderCapture: () => !!掴んだ列のref.current,
        onMoveShouldSetPanResponderCapture: () => !!掴んだ列のref.current,
        onPanResponderGrant: () => {
          動かし始めた.current = !0;
        },
        onPanResponderMove: (_e, g) => {
          // 札を指に付いてこさせる。名前の並びの端からの座標に直して置く
          const 行 = 名の行のnode.current;
          if (行 && 'function' == typeof 行.getBoundingClientRect) {
            const r = 行.getBoundingClientRect();
            const ずれ =
              'undefined' == typeof window ? 0 : (横に並べる ? window.scrollY : window.scrollX) || 0;
            set指の横((横に並べる ? g.moveY : g.moveX) - ((横に並べる ? r.top : r.left) + ずれ));
          }
          const i = 測る手.current ? 測る手.current(横に並べる ? g.moveY : g.moveX) : null;
          if (null !== i && i !== 落とす先のref.current) {
            ((落とす先のref.current = i), set落とす先(i));
          }
        },
        onPanResponderRelease: () => 離す手.current && 離す手.current(),
        onPanResponderTerminate: () => 掴むのをやめる(),
      });

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
              // 指の下にどの列が居るかを測るために、節を覚えておく。
              // 縦と同じ入れ物を使う（並べ方が変わっても測り方は同じ）
              if (node) 名の欄のnode.current[射手.id] = node;
              else delete 名の欄のnode.current[射手.id];
              if (順 === 案内が指す順()) 案内.setTutorialTargetNode('記録.射手選択', node);
            },
            testID:
              '名の欄-' +
              (射手.isSeparator ? '区切り' : 射手.isTotalCalculator ? '合計' : '射手') +
              '-' +
              射手.id,
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
              // チームの色。縦では名前の上に細い帯で出しているので、横では
              // 名前の左に出す（並べ方を変えても、どのチームかは分かるように）
              ...(() => {
                const 色 = (組.チームを割り当てる(見えている並び).find(
                  (x) => x && x.id === 射手.id
                ) || {}).色;
                return 色 ? { borderLeftWidth: 3 * se, borderLeftColor: 色 } : null;
              })(),
              // 掴んでいる列は、抜けた跡として薄く残す（縦と同じ）
              ...(掴んだ列 === 射手.id
                ? { opacity: 0.35, backgroundColor: 'rgba(0,122,255,0.10)' }
                : null),
            },
            children: 射手.isSeparator
              ? (0, A.jsx)(h.default, {
                  style: { alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' },
                  // 縦の表と同じにする。押すと窓が開き、そこでチーム名を付けたり
                  // 消したりできる。横だけ「押す＝そのまま消す」のままだと、
                  // 向きを変えただけで振る舞いが変わって驚く
                  onPress: () => qe(射手.id, 射手.name, 順),
                  onLongPress: () => 掴む(射手.id),
                  onPressOut: () => 掴みを見直す(),
                  delayLongPress: 400,
                  disabled: $e,
                  children: 組.区切りのチーム名(射手)
                    ? (0, A.jsx)(a.default, {
                        style: {
                          fontSize: 11 * se,
                          fontWeight: '700',
                          textAlign: 'center',
                          color: 組.チームの色(組.区切りのチーム名(射手)) || '#8E8E93',
                        },
                        numberOfLines: 2,
                        children: 組.区切りのチーム名(射手),
                      })
                    : (0, A.jsx)(p.Ionicons, {
                        name: 'ellipsis-horizontal',
                        size: 20 * se,
                        color: '#8E8E93',
                      }),
                })
              : (0, A.jsxs)(h.default, {
                  style: { alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' },
                  onPress: () => qe(射手.id, 射手.name, 順),
                  onLongPress: () => 掴む(射手.id),
                  onPressOut: () => 掴みを見直す(),
                  delayLongPress: 400,
                  children: [
                    (0, A.jsx)(a.default, {
                      style: [W.footerName, { color: 射手.name ? '#000' : '#8E8E93', fontSize: 13 * se }],
                      numberOfLines: 1,
                      // 手前の計もまとめる合計は「総計」。ふつうの「計」と
                      // 見分けが付かないと、どこまでの合計か分からない
                      children: 射手.isTotalCalculator
                        ? 射手.またぐ合計
                          ? '総計'
                          : '合計'
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
        // 掴んでいる間は「離したらこうなる」並びを先に描く（縦と同じ）
        const 一覧 = 見えている並び;
        return [
          (0, A.jsx)(
            n.default,
            {
              showsVerticalScrollIndicator: !1,
              bounces: !1,
              // 掴んでいる間は流さない。流すと、表が動くのか列が動くのか
              // 分からなくなる
              scrollEnabled: !掴んだ列,
              style: { flexGrow: 0 },
              children: (0, A.jsxs)(l.default, {
                style: { flexDirection: 'row', minWidth: '100%' },
                children: [
                  (0, A.jsxs)(l.default, {
                    style: { backgroundColor: '#F2F2F7', zIndex: 10 },
                    // 掴んでいる間だけ、縦の動きを並べ替えに使う。
                    //
                    // 横では PanResponder が指の動きを受け取れなかった（掴めるのに
                    // 動かせない）。縦のときは横の動きなので取り合いにならないが、
                    // 横のときは縦の動きで、外側の流れと競合するらしい。
                    // ここは指の動きを直に見る（矢所の窓と同じやり方）
                    onTouchMove: (ev) => 指が動いた(ev),
                    onTouchEnd: () => 指を離した(),
                    onTouchCancel: () => 掴むのをやめる(),
                    onMouseMove: (ev) => 指が動いた(ev),
                    onMouseUp: () => 指を離した(),
                    ref: (node) => {
                      名の行のnode.current = node;
                    },
                    children: [
                      // 運ぶ札。縦と同じものを、上下の座標に置き換えて出す
                      運ぶ札(),
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
                              onLongPressSeparator: () => {
                                if ($e) return void 閲覧中に押された();
                                (setチーム名の下書き(射手.teamName || ''),
                                  setチーム名を付ける区切り(射手.id));
                              },
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
    /**
     * 運ぶ札。掴んだ列の名前が指に付いてくる。
     *
     * 表そのものは「離したらこうなる」並びで描いてあるので、
     * 札＝いま持っているもの、表＝置いたあとの姿、になる。
     * 縦は列が横に並ぶので左の座標に、横は上下に積むので上の座標に置く。
     * 中身は同じなので、2か所に書き写さずここ1つにする。
     */
    const 運ぶ札 = () => {
      if (!掴んだ列 || null === 指の横) return null;
      const 持ち物 = 見えている並び.find((x) => x && x.id === 掴んだ列);
      if (!持ち物) return null;
      const 名 = 持ち物.isTotalCalculator
        ? 持ち物.またぐ合計
          ? '総計'
          : '合計'
        : 持ち物.isSeparator
          ? 組.区切りのチーム名(持ち物) || '間隔'
          : 持ち物.name
            ? (0, v.formatMemberName)(持ち物.name, oe)
            : '選択';
      const 太さ =
        (持ち物.isSeparator ? F.UIConfig.separatorWidth : F.UIConfig.cellWidth) * se;
      // 縦は「幅＝列の太さ／高さ＝名前の欄の高さ」、横はその逆
      const 置き方 = 横に並べる
        ? {
            left: 0,
            top: 指の横 - 太さ / 2,
            width: 名前の幅,
            height: 太さ,
          }
        : {
            left: 指の横 - 太さ / 2,
            top: -6 * se,
            width: 太さ,
            height: F.UIConfig.footerHeight * se,
          };
      return (0, A.jsx)(
        l.default,
        {
          pointerEvents: 'none',
          style: {
            position: 'absolute',
            ...置き方,
            backgroundColor: '#FFF',
            borderWidth: 2,
            borderColor: '#007AFF',
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            // 影は直に書く。この部品の中では shadowStyle の読み込み名が
            // 別の変数に隠れていて、呼ぶと落ちる（実際に落ちた）
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 8,
          },
          children: (0, A.jsx)(a.default, {
            style: {
              fontSize: 13 * se,
              fontWeight: '700',
              color: '#007AFF',
              textAlign: 'center',
            },
            numberOfLines: 2,
            children: 名,
          }),
        },
        '運ぶ札'
      );
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
          ? (0, A.jsxs)(X ? h.default : l.default, {
              // 主催者は帯を押すと、リンクで配る窓が開く。
              // ライブ中しか出ない帯なので、ここに置くのがいちばん近い
              style: [W.liveStatusHeader, W.liveActiveHeader, { marginHorizontal: 8, borderRadius: 8 }],
              onPress: X ? () => 共有の窓を出す(!0) : void 0,
              children: [
                (0, A.jsx)(p.Ionicons, { name: 'radio-outline', size: 12, color: '#FFF' }),
                (0, A.jsxs)(a.default, {
                  style: W.liveStatusText,
                  numberOfLines: 1,
                  children: ['ライブ中', ライブは見るだけ ? '（閲覧用）' : '', ': ', Y],
                }),
                X
                  ? (0, A.jsx)(p.Ionicons, { name: 'share-outline', size: 12, color: '#FFF' })
                  : null,
                接続の文言
                  ? (0, A.jsxs)(l.default, {
                      style: W.liveCount,
                      children: [
                        (0, A.jsx)(p.Ionicons, { name: 'ellipse', size: 7, color: '#34C759' }),
                        (0, A.jsx)(a.default, { style: W.liveCountText, children: 接続の文言 }),
                      ],
                    })
                  : null,
                // 期限が近いときだけ。字は最小限にして、意味は色で持たせる。
                // 帯は1行なので、長い文を入れるとライブ名が潰れる
                期限の残り
                  ? (0, A.jsxs)(l.default, {
                      style: W.liveLimit,
                      children: [
                        (0, A.jsx)(p.Ionicons, { name: 'time-outline', size: 10, color: '#FFF' }),
                        (0, A.jsx)(a.default, { style: W.liveLimitText, children: 期限の残り }),
                      ],
                    })
                  : null,
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
                    if ($e) return void 閲覧中に押された();
                    Ce(!0);
                  },
                  hitSlop: { top: 20, bottom: 20, left: 20, right: 20 },
                  // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
                  // web の TouchableOpacity は aria-label を見るので、両方渡す
                  accessible: !0,
                  accessibilityRole: 'button',
                  accessibilityLabel: 'リセット',
                  'aria-label': 'リセット',
                  accessibilityHint: '記録表を空にします',
                  style: ({ hovered: e }) => [
                    W.resetBtn,
                    $e && { opacity: 0.4 },
                    e && m.IS_WEB && { opacity: 0.8 },
                  ],
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
                // ライブ中だけ出す「配る」。帯を押しても開くが、
                // 押せると分かる形が無いと見つけられない。
                //
                // 帯は主催者しか押せないのに、こちらは部員にも出す。食い違いに
                // 見えるが、2026-08-31 に承知のうえでこうすると決めた。
                // 先に押した部員が合言葉と期限を決め、期限はあとからは主催者でも
                // 延ばせない。それでも部員なら誰が配ってもよい、という判断。
                // 直すときは帯（onPress: X ? … ）と揃えること。
                K && !来客
                  ? (0, A.jsxs)(h.default, {
                      style: W.shareBtn,
                      // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
                      // web の TouchableOpacity は aria-label を見るので、両方渡す
                      accessible: !0,
                      accessibilityRole: 'button',
                      accessibilityLabel: 'ライブをリンクで配る',
                      'aria-label': 'ライブをリンクで配る',
                      onPress: () => 共有の窓を出す(!0),
                      children: [
                        (0, A.jsx)(p.Ionicons, { name: 'share-outline', size: 16, color: '#007AFF' }),
                        (0, A.jsx)(a.default, { style: W.shareBtnText, children: '配る' }),
                      ],
                    })
                  : null,
                (0, A.jsxs)(h.default, {
                  ref: 案内のライブボタン,
                  onPress: () => {
                    // 共有リンクで来た人は、抜けたら見るものが無い。
                    // ライブから出るだけだと空の記録表に取り残されるので、
                    // 入口の画面まで戻す
                    K
                      ? (来客
                          ? x.useScoreStore.getState().共有の来客をやめる()
                          : x.useScoreStore.getState().stopLiveSync(),
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
                  // 閲覧用のときは射数だけ薄くする。表示（大きさ）は触れてよい
                  style: [W.zoomContainer, $e && { opacity: 0.4 }],
                  children: [
                    (0, A.jsx)(h.default, {
                      onPress: () => {
                        if ($e) return void 閲覧中に押された();
                        Xe(Math.max(4, T - 4));
                      },
                      disabled: T <= 4,
                      accessible: !0,
                      accessibilityRole: 'button',
                      accessibilityLabel: '射数を4本減らす',
                      'aria-label': '射数を4本減らす',
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
                        if ($e) return void 閲覧中に押された();
                        Xe(Math.min(500, T + 4));
                      },
                      disabled: T >= 500,
                      accessible: !0,
                      accessibilityRole: 'button',
                      accessibilityLabel: '射数を4本増やす',
                      'aria-label': '射数を4本増やす',
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
                      accessible: !0,
                      accessibilityRole: 'button',
                      accessibilityLabel: '表示を小さくする',
                      'aria-label': '表示を小さくする',
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
                      accessible: !0,
                      accessibilityRole: 'button',
                      accessibilityLabel: '表示を大きくする',
                      'aria-label': '表示を大きくする',
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
        (0, A.jsx)(LiveShareModal, {
          visible: 共有の窓,
          onClose: () => 共有の窓を出す(!1),
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
                                            u.default.alert(
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
                                          // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                                          accessible: !0,
                                          accessibilityRole: 'button',
                                          accessibilityLabel: 'このライブを消す',
                                          'aria-label': 'このライブを消す',
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
                          // 参加のしかたを選ぶ。見るだけなら盤面を書き換えない
                          // 参加のしかたは画面の中のポップアップで選ぶ
                          const t = () => 参加のしかたを聞くを置く(e);
                          if (k.length > 0) {
                            確認を置く({
                              文: '手元の記録が消去され、ライブ参加データで上書きされます。よろしいですか？',
                              実行: t,
                            });
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
              accessible: !0,
              accessibilityRole: 'button',
              accessibilityLabel: 畳む覚え ? '操作の帯を開く' : '操作の帯を畳む',
              'aria-label': 畳む覚え ? '操作の帯を開く' : '操作の帯を畳む',
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
                          children: 見えている並び.map((e, t) =>
                              (0, A.jsx)(
                                y.ArcherColumnView,
                                {
                                  archer: e,
                                  shots: T,
                                  // ドラッグ中は「入れた結果」の並びを渡す。計もチームも
                                  // その並びで数え直るので、離す前に出来上がりが見える
                                  allArchers: 見えている並び,
                                  indexInList: t,
                                  showFooter: !1,
                                  isReadOnly: $e,
                                  onPressName: () => qe(e.id, e.name, t),
                                  onDelete: () => M(e.id),
                                  onLongPressSeparator: () => {
                                    if ($e) return void 閲覧中に押された();
                                    (setチーム名の下書き(e.teamName || ''),
                                      setチーム名を付ける区切り(e.id));
                                  },
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
                      // 掴んでいる間は流さない。流すと、表が動くのか列が動くのか
                      // 分からなくなる
                      scrollEnabled: !掴んだ列,
                      style: { flexGrow: 0, flexShrink: 1 },
                      ref: Ue,
                      onScroll: (e) => {
                        const t = e.nativeEvent.contentOffset.x;
                        Ve.current?.scrollTo({ x: t, animated: !1 });
                      },
                      scrollEventThrottle: 16,
                      children: (0, A.jsx)(l.default, {
                        style: [W.gridRow, { flexDirection: 'row-reverse' }],
                        // 掴んでいる間だけ、横の動きを並べ替えに使う
                        ...(並べ替えの手.current ? 並べ替えの手.current.panHandlers : {}),
                        ref: (node) => {
                          名の行のnode.current = node;
                        },
                        children: [
                          運ぶ札(),
                          ...見えている並び.map((e, t) => {
                            return (0, A.jsx)(
                              l.default,
                              {
                                // 使い方の案内が指す先。まだ名前の入っていない列を選ぶ。
                                // 名前入りの列を指すと、押しても名前の数が増えず先へ進めない。
                                // 繰り返しの中なのでフックは使えない
                                ref: (node) => {
                                  // 指の下にどの列が居るかを測るために、節を覚えておく
                                  if (node) 名の欄のnode.current[e.id] = node;
                                  else delete 名の欄のnode.current[e.id];
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
                                  // 掴んでいる列は、抜けた跡として薄く残す。
                                  // どこへ入るかは並びそのもので見せるので、
                                  // 落とす先を別に光らせる必要はない
                                  ...(掴んだ列 === e.id
                                    ? {
                                        opacity: 0.35,
                                        backgroundColor: 'rgba(0,122,255,0.10)',
                                      }
                                    : null),
                                },
                                children: e.isSeparator
                                  ? (0, A.jsx)(h.default, {
                                      style: {
                                        alignItems: 'center',
                                        width: '100%',
                                        height: '100%',
                                        justifyContent: 'center',
                                      },
                                      // 位置ではなく列のIDで名づける。並べ替えても
                                      // 同じ列を追える（ます-<射手ID>-<射番> と同じ流儀）
                                      testID: '名の欄-区切り-' + e.id,
                                      // 押すと窓が開く。以前は押す＝そのまま消すで、
                                      // チーム名は長押しでしか入れられなかった。
                                      // 消す道は窓の中の「削除」に移してある
                                      onPress: () => qe(e.id, e.name, t),
                                      // 長押しは「掴む」。チーム名は窓から入れる
                                      //（長押ししか道が無くて気づけなかった）
                                      onLongPress: () => 掴む(e.id),
                                      onPressOut: () => 掴みを見直す(),
                                      delayLongPress: 400,
                                      disabled: $e,
                                      // 名前が付いていれば名前を、なければ「⋯」。
                                      // ×印だったころは押す＝消すに見えて、名前を
                                      // 入れられることに気づけなかった
                                      children: 組.区切りのチーム名(e)
                                        ? (0, A.jsx)(a.default, {
                                            style: {
                                              fontSize: 11 * se,
                                              fontWeight: '700',
                                              textAlign: 'center',
                                              color: 組.チームの色(組.区切りのチーム名(e)) || '#8E8E93',
                                            },
                                            numberOfLines: 3,
                                            children: 組.区切りのチーム名(e),
                                          })
                                        : (0, A.jsx)(p.Ionicons, {
                                            name: 'ellipsis-horizontal',
                                            size: 24 * se,
                                            color: '#8E8E93',
                                          }),
                                    })
                                  : (0, A.jsxs)(h.default, {
                                      style: [
                                        {
                                          alignItems: 'center',
                                          width: '100%',
                                          height: '100%',
                                          justifyContent: 'center',
                                        },
                                        // チームの色を、名前の欄の上に細い帯で出す。
                                        // 字を染めると読みにくいので帯にする
                                        (() => {
                                          const 色 = (組.チームを割り当てる(見えている並び).find(
                                            (x) => x && x.id === e.id
                                          ) || {}).色;
                                          return 色 ? { borderTopWidth: 3 * se, borderTopColor: 色 } : null;
                                        })(),
                                      ],
                                      // 押すと窓が開く。合計の列なら、そこで
                                      // 数える範囲を変えたり消したりできる。
                                      // ここで範囲の切り替えだけを行うと、
                                      // 窓が開かなくなって消せなくなる（実際そうなった）
                                      testID:
                                        '名の欄-' + (e.isTotalCalculator ? '合計' : '射手') + '-' + e.id,
                                      onPress: () => qe(e.id, e.name, t),
                                      onLongPress: () => 掴む(e.id),
                                      onPressOut: () => 掴みを見直す(),
                                      delayLongPress: 400,
                                      children: [
                                        (0, A.jsx)(a.default, {
                                          style: [
                                            W.footerName,
                                            { color: e.name ? '#000' : '#8E8E93', fontSize: 14 * se },
                                          ],
                                          numberOfLines: 2,
                                          // 手前の計もまとめる合計は「総計」。
                                          // どちらを見ているか、見出しで分かるようにする
                                          children: e.isTotalCalculator
                                            ? e.またぐ合計
                                              ? '総計'
                                              : '合計'
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
                        ],
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
                    accessible: !0,
                    accessibilityRole: 'button',
                    accessibilityLabel: '取り消し',
                    'aria-label': '取り消し',
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
                    accessible: !0,
                    accessibilityRole: 'button',
                    accessibilityLabel: 'やり直し',
                    'aria-label': 'やり直し',
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
                style: [W.addBtns, $e && { opacity: 0.4 }],
                children: [
                  (0, A.jsxs)(f.default, {
                    ref: 案内の人ボタン,
                    style: ({ hovered: e }) => [
                      W.addBtn,
                      { backgroundColor: 'rgba(0,122,255,0.1)' },
                      e && m.IS_WEB && { backgroundColor: 'rgba(0,122,255,0.2)' },
                    ],
                    // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
                    // web の TouchableOpacity は aria-label を見るので、両方渡す
                    accessible: !0,
                    accessibilityRole: 'button',
                    accessibilityLabel: '射手を追加',
                    'aria-label': '射手を追加',
                    accessibilityHint: '記録表にひとり足します',
                    onPress: () => {
                      if ($e) return void 閲覧中に押された();
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
                      if ($e) return void 閲覧中に押された();
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
                      if ($e) return void 閲覧中に押された();
                      (j.impactAsync(j.ImpactFeedbackStyle.Light), L());
                    },
                    // 入れたあと、その列を押すと「この立ちだけ」と
                    // 「手前の計もまとめた総計」を切り替えられる
                    accessibilityHint: '合計の列を足します。入れたあと列を押すと、数える範囲を変えられます',
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
                      if ($e) return void 閲覧中に押された();
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
                  ($e || よその団体) && { opacity: 0.4 },
                  e && m.IS_WEB && { opacity: 0.9, transform: [{ scale: 1.02 }] },
                ],
                // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
                // web の TouchableOpacity は aria-label を見るので、両方渡す
                accessible: !0,
                accessibilityRole: 'button',
                accessibilityLabel: '終了して保存',
                'aria-label': '終了して保存',
                accessibilityHint: 'いまの記録表を履歴に残します',
                onPress: () => {
                  if ($e) return void 閲覧中に押された();
                  // よその団体のライブは、自分の記録として残さない。
                  // 押しても無反応だと壊れたのか決まりなのか分からないので、理由を言う
                  if (よその団体)
                    return void (Ge('共有されたライブは、主催者の側で保存されます'),
                    j.notificationAsync(j.NotificationFeedbackType.Warning));
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
          // 合計の列が、いま手前の計もまとめて数えているか。窓の中で切り替える
          またぐ合計: (Array.isArray(k) ? k : []).find((e) => e && e.id === ue)?.またぐ合計 || !1,
          on合計の範囲: () => {
            if ($e) return void 閲覧中に押された();
            const 列 = (Array.isArray(k) ? k : []).find((e) => e && e.id === ue);
            合計の範囲を切り替える(ue);
            Ge(列?.またぐ合計 ? 'この立ちだけの合計にしました' : '手前の計もまとめた総計にしました');
            ce(!1);
          },
          // 区切りにチーム名を付ける道。窓からも入れるようにした
          いまのチーム名: 組.区切りのチーム名(
            (Array.isArray(k) ? k : []).find((e) => e && e.id === ue) || {}
          ) || '',
          onチーム名: () => {
            if ($e) return void 閲覧中に押された();
            const 列 = (Array.isArray(k) ? k : []).find((e) => e && e.id === ue);
            (setチーム名の下書き((列 && 列.teamName) || ''), setチーム名を付ける区切り(ue));
            ce(!1);
          },
          // 立ち順の入れ替え。store には並びの向き（前・後）で渡す。
          // 字をどう出すかは並べ方しだいなので、それは窓へ伝える
          //（縦は右／左、横は上／下）。端の列では、その向きを出さない
          横に並べている: !!横に並べる,
          手前へ動かせる: (() => {
            const 並び = (Array.isArray(k) ? k : []).filter((e) => !!e);
            return 並び.findIndex((e) => e.id === ue) > 0;
          })(),
          奥へ動かせる: (() => {
            const 並び = (Array.isArray(k) ? k : []).filter((e) => !!e);
            const i = 並び.findIndex((e) => e.id === ue);
            return i >= 0 && i < 並び.length - 1;
          })(),
          on動かす: (向き) => {
            if ($e) return void 閲覧中に押された();
            列を動かす(ue, 向き);
            Ge(
              '前' === 向き
                ? 横に並べる
                  ? '上へ動かしました'
                  : '右へ動かしました'
                : 横に並べる
                  ? '下へ動かしました'
                  : '左へ動かしました'
            );
          },
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
        (0, A.jsx)(d.default, {
          visible: null !== 参加のしかたを聞く,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => 参加のしかたを聞くを置く(null),
          children: (0, A.jsxs)(f.default, {
            style: {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: 40,
            },
            onPress: () => 参加のしかたを聞くを置く(null),
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
                  (0, A.jsxs)(l.default, {
                    style: {
                      padding: 16,
                      borderBottomWidth: s.default.hairlineWidth,
                      borderBottomColor: '#C6C6C8',
                      alignItems: 'center',
                    },
                    children: [
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
                        children: '参加のしかた',
                      }),
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 15, color: '#3C3C43', marginTop: 4 },
                        children: 参加のしかたを聞く || '',
                      }),
                    ],
                  }),
                  (0, A.jsxs)(f.default, {
                    style: ({ hovered: e }) => [
                      {
                        padding: 16,
                        alignItems: 'center',
                        borderBottomWidth: s.default.hairlineWidth,
                        borderBottomColor: '#C6C6C8',
                      },
                      e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                    ],
                    onPress: () => {
                      const 名 = 参加のしかたを聞く;
                      (参加のしかたを聞くを置く(null), 名 && ライブに入る(名, !1));
                    },
                    children: [
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
                        children: '記録用',
                      }),
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
                        children: '○×を入れられます',
                      }),
                    ],
                  }),
                  (0, A.jsxs)(f.default, {
                    style: ({ hovered: e }) => [
                      { padding: 16, alignItems: 'center' },
                      e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                    ],
                    onPress: () => {
                      const 名 = 参加のしかたを聞く;
                      (参加のしかたを聞くを置く(null), 名 && ライブに入る(名, !0));
                    },
                    children: [
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
                        children: '閲覧用',
                      }),
                      (0, A.jsx)(a.default, {
                        style: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
                        children: '画面を見るだけ。○×は入れません',
                      }),
                    ],
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
                onPress: () => 参加のしかたを聞くを置く(null),
                children: (0, A.jsx)(a.default, {
                  style: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
                  children: 'キャンセル',
                }),
              }),
            ],
          }),
        }),
        (0, A.jsx)(d.default, {
          visible: null !== 確認,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => 確認を置く(null),
          children: (0, A.jsxs)(f.default, {
            style: {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 24,
            },
            onPress: () => 確認を置く(null),
            children: [
              (0, A.jsxs)(l.default, {
                style: {
                  width: '100%',
                  maxWidth: 400,
                  backgroundColor: '#FFF',
                  borderRadius: 14,
                  overflow: 'hidden',
                },
                children: [
                  (0, A.jsx)(l.default, {
                    style: { padding: 20 },
                    children: (0, A.jsx)(a.default, {
                      style: { fontSize: 15, color: '#1C1C1E', lineHeight: 22 },
                      children: (確認 && 確認.文) || '',
                    }),
                  }),
                  (0, A.jsxs)(l.default, {
                    style: {
                      flexDirection: 'row',
                      borderTopWidth: s.default.hairlineWidth,
                      borderTopColor: '#C6C6C8',
                    },
                    children: [
                      (0, A.jsx)(f.default, {
                        style: ({ hovered: e }) => [
                          { flex: 1, padding: 16, alignItems: 'center' },
                          e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                        ],
                        onPress: () => 確認を置く(null),
                        children: (0, A.jsx)(a.default, {
                          style: { fontSize: 17, color: '#007AFF' },
                          children: 'キャンセル',
                        }),
                      }),
                      (0, A.jsx)(f.default, {
                        style: ({ hovered: e }) => [
                          {
                            flex: 1,
                            padding: 16,
                            alignItems: 'center',
                            borderLeftWidth: s.default.hairlineWidth,
                            borderLeftColor: '#C6C6C8',
                          },
                          e && m.IS_WEB && { backgroundColor: '#F2F2F7' },
                        ],
                        onPress: () => {
                          const 手 = 確認 && 確認.実行;
                          (確認を置く(null), 手 && 手());
                        },
                        children: (0, A.jsx)(a.default, {
                          style: { fontSize: 17, color: '#007AFF', fontWeight: 'bold' },
                          children: 'OK',
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        (0, A.jsx)(OCRRecordModal, {
          visible: showOCRModal,
          onClose: () => setShowOCRModal(!1),
          members: oe,
          alumni: (0, x.useScoreStore)((e) => e.alumni) || [],
          shotsPerRound: T,
          // 取り込みは記録表を丸ごと置き換える。中身があるなら先に確かめてもらう
          hasExistingRecord: k.length > 0,
          onApply: (newArchers, 読み取りの種類) => {
            // 画像は setState で直に盤面を差し替えるため、ストアの止めが効かない。
            // 閲覧用のときはここで返す
            if ($e) return void 閲覧中に押された();
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
          // 矢所を押しただけでは閉じない。置いた場所を見て、ずれていれば
          // 置き直せるようにするため。閉じるのは「完了」を押したとき
          onSave: () => {},
        }),
        // 区切りにチーム名を付ける窓。リーグで大学名を出すため。
        // 区切りより左（並びでは後ろ）がそのチームになるので、
        // 1回入れれば複数人に付く
        (0, A.jsx)(d.default, {
          visible: !!チーム名を付ける区切り,
          transparent: !0,
          animationType: 'fade',
          onRequestClose: () => setチーム名を付ける区切り(null),
          children: (0, A.jsxs)(l.default, {
            style: W.modalBackdrop,
            children: [
              (0, A.jsx)(h.default, {
                style: s.default.absoluteFill,
                activeOpacity: 1,
                onPress: () => setチーム名を付ける区切り(null),
              }),
              (0, A.jsxs)(l.default, {
                style: W.modalContent,
                children: [
                  (0, A.jsx)(a.default, { style: W.modalTitle, children: 'チーム名' }),
                  (0, A.jsx)(a.default, {
                    style: W.modalMessage,
                    children:
                      // 記録表は右から左へ並ぶ（row-reverse）。並びで「後ろ」の
                      // 射手は、画面では区切りの左に出る。「右」と書いていたころは
                      // 案内と逆の側に色が付いて見えた
                      'この区切りより左の射手が、そのチームになります。大学名などを入れてください。空にすると、ただの間隔に戻ります。',
                  }),
                  (0, A.jsx)(c.default, {
                    style: W.チーム名の入力,
                    value: チーム名の下書き,
                    onChangeText: setチーム名の下書き,
                    placeholder: '例: ◯◯大学',
                    maxLength: 20,
                    autoFocus: !0,
                    returnKeyType: 'done',
                    onSubmitEditing: () => {
                      (区切りにチーム名を付ける(チーム名を付ける区切り, チーム名の下書き),
                        setチーム名を付ける区切り(null));
                    },
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
                        onPress: () => setチーム名を付ける区切り(null),
                        children: (0, A.jsx)(a.default, {
                          style: [W.modalBtnText, { color: '#007AFF' }],
                          children: 'キャンセル',
                        }),
                      }),
                      (0, A.jsx)(f.default, {
                        style: ({ hovered: e }) => [
                          W.modalBtn,
                          { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                          e && m.IS_WEB && { opacity: 0.9 },
                        ],
                        onPress: () => {
                          (区切りにチーム名を付ける(チーム名を付ける区切り, チーム名の下書き),
                            setチーム名を付ける区切り(null));
                        },
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
    // ライブをリンクで配るボタン。ライブ中だけ出る
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,122,255,0.1)',
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 3,
      marginRight: 6,
    },
    shareBtnText: { color: '#007AFF', fontSize: 11, fontWeight: 'bold' },
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
    // ライブ名が長いときは、名前のほうを縮めて台数を残す。
    // 台数は「相手に届いているか」を見るためのもので、消えると意味が無い
    liveStatusText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', flexShrink: 1 },
    liveCount: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
    liveCountText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
    // 期限が近いことの札。台数と同じ形にして、狭いときはライブ名の側を縮ませる。
    // 帯そのものが青（主催者）か灰（参加者）なので、札は赤地で浮かせる
    liveLimit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      flexShrink: 0,
      backgroundColor: '#FF3B30',
      paddingHorizontal: 5,
      borderRadius: 8,
    },
    liveLimitText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
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
      // 表より上、他の画面より下。記録画面は他のタブへ移っても裏で生きているので、
      // 1e4 のように高くすると履歴のごみ箱など別の画面のボタンの上に乗る
      zIndex: 5,
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
      // 保存は肯定的な操作。赤は「リセット」など戻せない操作のために取っておく。
      // 同じ赤だと、色から手がかりが取れない
      backgroundColor: '#007AFF',
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderRadius: 8,
      minWidth: 64,
      justifyContent: 'center',
      flexShrink: 0,
    },
    saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
    // 区切りに付けるチーム名の入力欄
    チーム名の入力: {
      borderWidth: 1,
      borderColor: '#D1D1D6',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: '#000',
      marginTop: 4,
      marginBottom: 14,
    },
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
