'use strict';

const RN = require('react-native');
const React = require('react');
const View = require('./View').default;
const ScrollView = require('./ScrollView').default;
const StyleSheet = require('./StyleSheet').default;
const Text = require('./Text').default;
const Modal = require('./Modal').default;
const TextInput = require('./TextInput').default;
const Alert = require('./alertBridge').default;
const Pressable = require('./Pressable').default;
const TouchableOpacity = require('./TouchableOpacity').default;
const { IS_WEB, SAFE_TOP_PADDING, WEB_TOP_PADDING } = require('./IS_WEB');
const { useScoreStore, ライブ名に使えない字 } = require('./useScoreStore');
const 案内 = require('./TutorialGuide');
const 在 = require('./livePresence');
const { ArcherColumnView } = require('./ArcherColumnView');
const 組 = require('./teamGrouping');
const { LabelColumn } = require('./LabelColumn');
const { UIConfig } = require('./uiConfig');
const ExpoHaptics = require('expo-haptics');
const { ArcherActionModal } = require('./ArcherActionModal');
const Icons = require('@expo/vector-icons');
const { SaveSessionModal } = require('./SaveSessionModal');
const AttendanceCheckModal = require('./AttendanceCheckModal').AttendanceCheckModal;
const { ManualSubstitutionModal } = require('./ManualSubstitutionModal');
const 窓 = require('./AppDialog');
const 航 = require('@react-navigation/native');
const { formatMemberName } = require('./formatMemberName');
const { getShadowStyle } = require('./shadowStyle');
const { ArrowLocationPopover } = require('./ArrowLocationPopover');
const { OCRRecordModal } = require('./OCRRecordModal');
const { LiveShareModal } = require('./LiveShareModal');
const 期限 = require('./liveShare');
const RecordScreen = () => {
  const {
    activeSessionID,
    isAdminMode = false,
    archers = [],
    shotsPerRound = 8,
    syncStatus = 'IDLE',
    lastSyncTime,
    isNetworkOnline = true,
    offlineSaveWarning: オフライン保存の警告 = null,
    再ログインの案内 = null,
    addArcher,
    addSeparator,
    setSeparatorTeam: 区切りにチーム名を付ける,
    toggleTotalScope: 合計の範囲を切り替える,
    列を動かす,
    列を並べ替える,
    addTotalCalculator,
    undo,
    redo,
    historyStack = [],
    redoStack = [],
    deleteArcher,
    clearArcherMarks,
    setArcherMember,
    saveSession,
    setShotsPerRound,
    viewScale = 1,
    setViewScale,
    isLiveActive = false,
    setIsLiveActive,
    isHost = false,
    liveSessionName,
    includeInStats = true,
    setIncludeInStats,
    resetCurrentSession,
    members = [],
    isHydrated,
    lastResetHandled,
    // 誰かがライブ中に取り消し／やり直しをしたときの知らせ
    historyNoticeAt: 共有履歴の知らせ,
    historyNoticeKind: 共有履歴の種類,
    // 共有履歴の目印。取り消し・やり直しが押せるかの判定に使う
    historySharedLen: 共有履歴の位置,
    historySharedMax: 共有履歴の上限,
    activeGroupId,
    publicGroupId,
    activeArrowLocationEdit,
    setActiveArrowLocationEdit,
    // 「終了・保存」で出欠確認を出すか（設定で切れる）
    保存時に出欠を確認する = true,
    // 長押しでますを開けた時刻。知らせを出す合図
    鍵を開けた時刻 = 0,
    // 閉じたますを押した時刻。開け方を知らせる合図
    閉じたますを押した時刻 = 0,
    // 閲覧用でますを押した時刻。閲覧用だと知らせる合図
    閲覧でますを押した時刻 = 0,
    // 記録表の並べ方。真なら名前が左、○×が右へ伸びる
    横に並べる = false,
    set横に並べる,
    // 上下の帯を畳んでいるか。端末に残す（並べ方と同じ扱い）
    帯を畳む: 畳む覚え = false,
    set帯を畳む,
    // 畳む取っ手を左上に置いているか。指で引いて左右へ動かせる（端末に残す）
    帯の取っ手は左 = false,
    set帯の取っ手は左,
    // ライブに「見るだけ」で入っているか
    ライブは見るだけ = false,
    // 履歴の記録を記録画面で直しているあいだの目印（管理者モードの履歴から）
    履歴の編集 = null,
    履歴の編集を終える,
    sessions: 記録たち = [],
  } = useScoreStore();
  const 航路 = 航.useNavigation();
  // ライブ中の帯。主催者は押して配る窓を開けるので、押せる部品にする
  const ライブの帯 = isHost ? TouchableOpacity : View;
  const 倍率 = 'number' == typeof viewScale && !isNaN(viewScale) && viewScale > 0 ? viewScale : 1;
  if (!isHydrated) return null;
  // ライブに何台つないでいるか。電波の切れる弓道場で、
  // 相手に届いているかをその場で見るために出す（src/livePresence.js）
  const 接続の文言 = 在.台数の文言(useScoreStore((状態) => 状態.ライブの接続台数));
  // ライブをURLで配る窓。主催者だけが開ける
  const [共有の窓, 共有の窓を出す] = React.useState(false);
  // 共有リンクだけで来ている人。団体の名簿を持っていない
  const 来客 = useScoreStore((状態) => 状態.共有の来客);
  // よその団体のライブに共有リンクで入っているか。保存はさせない
  const よその団体 = useScoreStore((状態) => 状態.よその団体のライブ);
  // 配ったリンクの期限。帯に「あと30分」を出すために見る
  const ライブの期限 = useScoreStore((状態) => 状態.いまのライブの期限);
  // 残りは時間で減るので、こちらから数え直さないと止まって見える。
  // ただし数え直すたびに記録画面ぜんぶが描き直る。いつ起きればよいかは
  // liveShare の 次に数え直すまで が決める（帯に出るころまでは眠る）
  const [いま, いまを進める] = React.useState(() => Date.now());
  React.useEffect(() => {
    const 次 = 期限.次に数え直すまで(ライブの期限, いま);
    if (次 === null) return;
    const 札 = setTimeout(() => いまを進める(Date.now()), 次);
    return () => clearTimeout(札);
  }, [ライブの期限, いま]);
  // 近いときだけ出す。ずっと出していると場所を取るだけで読まれなくなる
  const 期限の残り = 期限.期限の短い文言(ライブの期限, いま);
  const ライブの一覧 = useScoreStore((状態) => 状態.liveSessionsList);
  const [人の窓, 人の窓を出す] = React.useState(false);
  const [選んだ射手ID, 選んだ射手IDを置く] = React.useState(null);
  const [選んだ射手の順, 選んだ射手の順を置く] = React.useState(0);
  const [保存の窓, 保存の窓を出す] = React.useState(false);
  const [交代の窓, 交代の窓を出す] = React.useState(false);
  const [知らせ, 知らせを置く] = React.useState(null);
  const [警告を閉じた, 警告を閉じる] = React.useState(false);
  const 扱ったリセット = React.useRef(0);
  const 共有履歴を出した = React.useRef(0);
  const 鍵の知らせを出した = React.useRef(0);
  const // 使い方の案内が指す先
    案内の人ボタン = 案内.useTutorialTarget('記録.人');
  const 案内の記録表 = 案内.useTutorialTarget('記録.表');
  const 案内の射数 = 案内.useTutorialTarget('記録.射数');
  const 案内の拡大 = 案内.useTutorialTarget('記録.拡大');
  const 案内の間隔 = 案内.useTutorialTarget('記録.間隔');
  const 案内の計 = 案内.useTutorialTarget('記録.計');
  const 案内のリセット = 案内.useTutorialTarget('記録.リセット');
  const 案内の画像 = 案内.useTutorialTarget('記録.画像');
  const 案内の取り消し = 案内.useTutorialTarget('記録.取り消し');
  const 案内のライブボタン = 案内.useTutorialTarget('記録.ライブ');
  const 案内の保存ボタン = 案内.useTutorialTarget('記録.保存');
  const // ライブ中は全員で1本の共有履歴を使うので、押せるかどうかも
    // 共有の目印で決める。手元の履歴だけで見ると、ライブ中に
    // やり直しが永久に押せないままになる
    ライブの知らせに任せる = !(!isLiveActive || !liveSessionName);
  const 戻せる = ライブの知らせに任せる ? (共有履歴の位置 || 0) > 0 : historyStack.length > 0;
  const 進める = ライブの知らせに任せる
    ? (共有履歴の位置 || 0) < (共有履歴の上限 || 0)
    : redoStack.length > 0;
  const [リセットの窓, リセットの窓を出す] = React.useState(false);
  const // 区切りにチーム名を付ける窓（リーグの大学名）。
    // どの区切りを触っているかと、入力中の文字を持つ
    [チーム名を付ける区切り, setチーム名を付ける区切り] = React.useState(null);
  const [チーム名の下書き, setチーム名の下書き] = React.useState('');
  const [射数を減らす確認, 射数を減らす確認を出す] = React.useState(false);
  const [減らす先の射数, 減らす先の射数を置く] = React.useState(8);
  const [射数の入力窓, 射数の入力窓を出す] = React.useState(false);
  const [射数の下書き, 射数の下書きを置く] = React.useState('');
  const [ライブの選び窓, ライブの選び窓を出す] = React.useState(false);
  const [ライブの種類, ライブの種類を置く] = React.useState(null);
  const [ライブ名の下書き, ライブ名の下書きを置く] = React.useState('');
  const [ライブ名の窓, ライブ名の窓を出す] = React.useState(false);
  const [ライブ名の注意, ライブ名の注意を置く] = React.useState(null);
  const [showAttendance, setShowAttendance] = React.useState(false);
  const [tempAttendance, setTempAttendance] = React.useState(null);
  const [showOCRModal, setShowOCRModal] = React.useState(false);
  const // 上下の帯を畳んでいるか。記録表を広く使いたいときに畳む。
    // 画面を移る帯（記録/履歴/…）はここでは隠さない（移動できなくなるため）
    _畳みは使わない = null;
  const // 参加のしかたを聞いている最中のライブ名。null なら聞いていない
    [参加のしかたを聞く, 参加のしかたを聞くを置く] = React.useState(null);
  const // アプリ内の確認。{ 文, 実行 } を入れると出る。ブラウザの確認窓は使わない
    [確認, 確認を置く] = React.useState(null);
  const 閉じた知らせを出した = React.useRef(0);
  const 閲覧の知らせを出した = React.useRef(0);
  const 上の横流し = React.useRef(null);
  const 下の横流し = React.useRef(null);
  const 知らせる = (文) => {
    知らせを置く(文);
    setTimeout(() => 知らせを置く(null), 1500);
  };
  React.useEffect(() => {
    // 同期の失敗はいつも知らせる。切り替えで消せるようにしていたころは、
    // 切っていることを忘れたまま何日も同期できていない状態になり得た。
    // しかも切り替えは保存されておらず、開き直すと勝手に戻っていた
    if ('同期エラー' === syncStatus) 知らせを置く('同期エラー: クラウドとの同期に失敗しました');
  }, [syncStatus]);
  React.useEffect(() => {
    if (lastResetHandled > 0 && 扱ったリセット.current < lastResetHandled) {
      const 自分のリセット = lastResetHandled === useScoreStore.getState().lastPushedTimestamp;
      扱ったリセット.current = lastResetHandled;
      自分のリセット ||
        (知らせる('リセットしました。'),
        ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));
    }
  }, [lastResetHandled]);
  // 誰かがライブ中に取り消し／やり直しをしたら短く知らせる。
  // 盤面が突然戻るので、理由が分かったほうが親切（リセットと同じ考え方）
  React.useEffect(() => {
    if (共有履歴の知らせ > 0 && 共有履歴を出した.current < 共有履歴の知らせ) {
      共有履歴を出した.current = 共有履歴の知らせ;
      知らせる(`${共有履歴の種類 || '取り消し'}されました。`);
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
    }
  }, [共有履歴の知らせ, 共有履歴の種類]);
  // 長押しでますを開けたら短く知らせる。
  // 灰色が戻るだけでは、押さえが届いたのか分かりにくい
  React.useEffect(() => {
    if (鍵を開けた時刻 > 0 && 鍵の知らせを出した.current < 鍵を開けた時刻) {
      鍵の知らせを出した.current = 鍵を開けた時刻;
      知らせる('このマスの鍵を開けました');
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
    }
  }, [鍵を開けた時刻]);
  // 閉じたますを押されたら、開け方を知らせる。
  // 黙って何も起きないと、壊れたと思って何度も押すことになる
  React.useEffect(() => {
    if (閉じたますを押した時刻 > 0 && 閉じた知らせを出した.current < 閉じたますを押した時刻) {
      閉じた知らせを出した.current = 閉じたますを押した時刻;
      知らせる('このマスは鍵がかかっています。長押しで開きます');
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
    }
  }, [閉じたますを押した時刻]);
  // 閲覧用でますを押されたら、閲覧用だと知らせる。
  // 黙って何も起きないと、届いていないのか壊れたのか分からない
  React.useEffect(() => {
    if (閲覧でますを押した時刻 > 0 && 閲覧の知らせを出した.current < 閲覧でますを押した時刻) {
      閲覧の知らせを出した.current = 閲覧でますを押した時刻;
      閲覧中に押された();
    }
  }, [閲覧でますを押した時刻]);
  React.useEffect(() => {
    useScoreStore.getState().loadData();
  }, []);
  // アプリを閉じて戻ったとき、続けていたライブへ戻る（ライブが終わっていれば
  // 記録表を片付ける）。開いた直後は合言葉や Realtime Database がまだ用意できて
  // いないことがあるので、少し置いてもう一度だけ試す。画面が前に出たときにも見る
  React.useEffect(() => {
    let 止めた = false;
    const 試す = () => {
      if (止めた) return;
      const 店 = useScoreStore.getState();
      if (店.isLiveActive || !店.ライブの続き || 'function' !== typeof 店.ライブに戻る) return;
      Promise.resolve(店.ライブに戻る()).catch(() => {});
    };
    試す();
    const 後で = setTimeout(試す, 4000);
    const もっと後で = setTimeout(試す, 15000);
    const 見張り = RN.AppState.addEventListener('change', (状態) => {
      if ('active' === 状態) 試す();
    });
    return () => {
      止めた = true;
      clearTimeout(後で);
      clearTimeout(もっと後で);
      if (見張り && 見張り.remove) 見張り.remove();
    };
  }, []);
  React.useEffect(() => {
    let 止める;
    return (
      ライブ名の窓 &&
        'join' === ライブの種類 &&
        (useScoreStore.getState().fetchActiveLiveSessions(),
        (止める = useScoreStore.getState().listenToLiveSessions())),
      () => {
        if (止める) 止める();
      }
    );
  }, [ライブ名の窓, ライブの種類]);
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
    知らせる('閲覧用で参加しています');
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
  };
  // ライブに入る。ポップアップから呼ぶので、画面の上のほうに置く
  const ライブに入る = (名, 見るだけ) => {
    知らせる(見るだけ ? '閲覧用で参加しています...' : '記録用で参加しています...');
    ライブ名の窓を出す(false);
    useScoreStore.getState().joinLiveSync(名, 見るだけ);
    ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
  };
  // 閲覧用で入っているあいだは、鍵ボタンなども触れないようにする
  const 見るだけ中 = !!(isLiveActive && ライブは見るだけ);
  const 人を選ぶ = (射手ID, _, 順) => {
    // 閲覧用のときは人の選択も開かない。開いても名前も交代も削除も
    // 止めてあるので、開くだけ無駄に迷わせる
    if (見るだけ中) return void 閲覧中に押された();
    // 共有リンクで来た人は団体の名簿を持っていない。開いても空の一覧が
    // 出るだけなので、開かずに理由を伝える
    if (来客)
      return void (知らせる('共有リンクでは名前を選べません'),
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
    archers.find((x) => x.id === 射手ID) &&
      (選んだ射手IDを置く(射手ID), 選んだ射手の順を置く(順), 人の窓を出す(true));
  };
  const // ── 立ち順を指で動かす（長押しで掴んで、滑らせて、離す）───────────
    //
    // 表は横に流れるので、掴む前は今までどおりスクロールできるようにする。
    // 掴んでいる間だけスクロールを止め、そのあいだの横の動きを並べ替えに使う。
    // 掴まないまま指を滑らせると、表が動くのか列が動くのか分からなくなる。
    [掴んだ列, set掴んだ列] = React.useState(null);
  const [落とす先, set落とす先] = React.useState(null);
  const // 指の横の位置（名前の行の中での座標）。運ぶ札をここに置く
    [指の横, set指の横] = React.useState(null);
  const [射数の窓, 射数の窓を出す] = React.useState(false);
  const // 拡大率の選択が出ているか（Excel の倍率と同じ考え方）
    [拡大選択中, 拡大を選ぶ] = React.useState(false);
  const // 拡大率のバーの幅。指の位置を倍率に直すのに使う
    [溝の幅, 溝の幅を置く] = React.useState(0);
  const // 拡大率の下限・上限。バーも一覧もこの幅で動かす
    拡大の下 = 0.5;
  const 拡大の上 = 2;
  const // バーのどこを触ったかを倍率に直す。1%きざみで止める
    触った所を倍率に = (x) => {
      if (!溝の幅) return 倍率;
      const 割合 = Math.min(1, Math.max(0, x / 溝の幅));
      const 生 = 拡大の下 + 割合 * (拡大の上 - 拡大の下);
      return Math.round(生 * 100) / 100;
    };
  const 倍率を割合に = (倍) => Math.min(1, Math.max(0, (倍 - 拡大の下) / (拡大の上 - 拡大の下)));
  const バーを動かす = (e) => {
    const 倍 = 触った所を倍率に(e.nativeEvent.locationX);
    if (Math.abs(倍 - 倍率) > 0.001) setViewScale(倍);
  };
  const 射数の窓を閉じる = () => 射数の窓を出す(false);
  const 射数を変える = (本数) => {
    本数 < shotsPerRound &&
    archers.some(
      (射手) => 射手 && Array.isArray(射手.marks) && 射手.marks.slice(本数).some((印) => '' !== 印)
    )
      ? (減らす先の射数を置く(本数), 射数を減らす確認を出す(true))
      : (setShotsPerRound(本数), ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium));
  };
  const 入力した射数で決める = () => {
    const 本数 = parseInt(射数の下書き, 10);
    !isNaN(本数) && 本数 >= 1 && 本数 <= 500
      ? (射数の入力窓を出す(false), 射数を変える(本数))
      : (知らせを置く('1〜500までの数字を入力してください'), setTimeout(() => 知らせを置く(null), 1500));
  };
  const ライブを始める窓へ = (種類) => {
    ライブの選び窓を出す(false);
    ライブの種類を置く(種類);
    ライブ名の下書きを置く('');
    setTimeout(() => {
      ライブ名の窓を出す(true);
    }, 100);
  };
  const Et要素 = View;
  // ── 帯を畳む取っ手を、指で左上・右上へ動かす仕掛け ───────────────
  //
  // AI チャットの丸いボタンと同じ考え方。取っ手を横へ引いて離すと、近いほうの
  // 上の角に吸い付く。下の角には行かせない（記録表の下は操作の帯で、そこに
  // 重なると邪魔になる）。押すだけなら、これまでどおり畳む・開く。
  //
  // 動かす最中は Animated で横にずらし、離したら側を決めて店に残す。
  // 側が変わったときは、置き場（left か right か）が変わるぶんを差し引いて
  // 見た目の位置を保ってから 0 へ戻す（いきなり反対側へ飛ばない）
  const 取っ手のずれ = React.useRef(new RN.Animated.Value(0)).current;
  const 取っ手の区画の幅 = React.useRef(0);
  const 取っ手は左のref = React.useRef(!!帯の取っ手は左);
  const 取っ手を引いた = React.useRef(false);
  const 取っ手の手 = React.useRef(null);
  取っ手は左のref.current = !!帯の取っ手は左;
  if (!取っ手の手.current)
    取っ手の手.current = RN.PanResponder.create({
      // 触れた時点で先取りして責任を持つ。動き始めてから取りにいく作りだと、
      // Web では指（マウス）が取っ手の外へ出た後の move は取っ手の枝に届かず、
      // 速く引くと一度も掴めない（react-native-web は責任者と的の共通の親までしか聞かない）。
      // 押すだけなら、中の Pressable の onPress が click で受ける（責任とは別の道）
      onStartShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponder: () => true,
      // Web では引いている最中に字の選択が始まると、選択の合図で責任を取り上げられて
      // 取っ手が止まる（react-native-web の responder は selectionchange で終わらせる）。
      // 取り上げは断り、始まってしまった選択はその場で解く
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => {
        if (!取っ手を引いた.current) {
          if (!(Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy))) return;
          取っ手を引いた.current = true;
        }
        取っ手のずれ.setValue(g.dx);
        if (IS_WEB && typeof window !== 'undefined' && window.getSelection) {
          try {
            const 選択 = window.getSelection();
            if (選択 && !選択.isCollapsed) 選択.removeAllRanges();
          } catch (t) {
            /* 解けなくても引く動きは続く */
          }
        }
      },
      onPanResponderRelease: (_e, g) => {
        // 引いていなければ押しただけ。畳む・開くは Pressable の onPress（click）に任せる
        if (!取っ手を引いた.current) return;
        const 幅 = 取っ手の区画の幅.current || 0;
        const 左だった = 取っ手は左のref.current;
        const // 取っ手の左端の座標（8 は余白、36 は取っ手の幅）
          元の左端 = 左だった ? 8 : Math.max(8, 幅 - 8 - 36);
        const いまの中心 = 元の左端 + 18 + g.dx;
        const 左へ = 幅 > 0 ? いまの中心 < 幅 / 2 : 左だった;
        if (左へ !== 左だった) {
          const 新しい左端 = 左へ ? 8 : Math.max(8, 幅 - 8 - 36);
          取っ手のずれ.setValue(元の左端 + g.dx - 新しい左端);
          if (set帯の取っ手は左) set帯の取っ手は左(左へ);
          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
        }
        RN.Animated.spring(取っ手のずれ, { toValue: 0, useNativeDriver: false, bounciness: 6 }).start();
        // 引き終わりの直後に来る click で畳まないよう、印は一拍おいて下ろす
        setTimeout(() => {
          取っ手を引いた.current = false;
        }, 0);
      },
      onPanResponderTerminate: () => {
        RN.Animated.spring(取っ手のずれ, { toValue: 0, useNativeDriver: false }).start();
        setTimeout(() => {
          取っ手を引いた.current = false;
        }, 0);
      },
    });
  // ── 立ち順を指で動かす仕掛け ────────────────────────────────
  //
  // 名前の欄を長押しすると、その列を掴む。掴んでいる間だけ表のスクロールを
  // 止め、指の下にある列を「落とす先」として光らせる。指を離した所へ入れる。
  // 動かすのは離したとき1回だけなので、取り消し1回で元に戻る。
  //
  // PanResponder は作り直さない（作り直すと掴んでいる最中に取り落とす）。
  // そのぶん中で使う値が古くなるので、毎回の描画で「手」を入れ替える。
  const 名の欄のnode = React.useRef({});
  const 掴んだ列のref = React.useRef(null);
  const 落とす先のref = React.useRef(null);
  const 動かし始めた = React.useRef(false);
  const 測る手 = React.useRef(null);
  const 離す手 = React.useRef(null);
  const 並べ替えの手 = React.useRef(null);
  const 名の行のnode = React.useRef(null);
  // いま画面に描く並び。掴んでいる間は「離したらこうなる」並びを先に見せる。
  // 指の下の列と入れ替えて描くので、出来上がりを見てから離せる。
  // 掴んだ列は抜けた跡として薄く残し、指には別の札（下の 運ぶ札）が付いてくる
  const 見えている並び = (() => {
    const 一覧 = (Array.isArray(archers) ? archers : []).filter((x) => !!x);
    if (!掴んだ列 || null === 落とす先) return 一覧;
    const いま = 一覧.findIndex((列) => 列.id === 掴んだ列);
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
      const ずれ = 'undefined' == typeof window ? 0 : (横に並べる ? window.scrollY : window.scrollX) || 0;
      箱.push({ i, 頭: (横に並べる ? r.top : r.left) + ずれ, 尻: (横に並べる ? r.bottom : r.right) + ずれ });
    }
    if (!箱.length) return null;
    for (const 枠 of 箱) if (指の位置 >= 枠.頭 && 指の位置 <= 枠.尻) return 枠.i;
    const 手前 = 箱.reduce((甲, 乙) => (甲.頭 < 乙.頭 ? 甲 : 乙));
    const 奥 = 箱.reduce((甲, 乙) => (甲.尻 > 乙.尻 ? 甲 : 乙));
    if (指の位置 < 手前.頭) return 手前.i;
    if (指の位置 > 奥.尻) return 奥.i;
    return null;
  };
  // 指の動きを直に受ける（横に並べたとき用）。
  // 掴んでいないときは何もしないので、ふつうの押す・流すの邪魔をしない
  const 指が動いた = (ev) => {
    if (!掴んだ列のref.current) return;
    const 出来事 = ev && ev.nativeEvent ? ev.nativeEvent : ev;
    if (!出来事) return;
    const 触れた指 =
      (出来事.touches && 出来事.touches[0]) || (出来事.changedTouches && 出来事.changedTouches[0]) || null;
    const 縦位置 = 出来事.pageY != null ? 出来事.pageY : 触れた指 ? 触れた指.pageY : null;
    if (縦位置 == null) return;
    動かし始めた.current = true;
    const 行 = 名の行のnode.current;
    if (行 && 'function' == typeof 行.getBoundingClientRect) {
      const r = 行.getBoundingClientRect();
      const ずれ = 'undefined' != typeof window && window.scrollY ? window.scrollY : 0;
      set指の横(縦位置 - (r.top + ずれ));
    }
    const i = 測る手.current ? 測る手.current(縦位置) : null;
    if (null !== i && i !== 落とす先のref.current) {
      落とす先のref.current = i;
      set落とす先(i);
    }
  };
  const 指を離した = () => {
    if (!掴んだ列のref.current) return;
    if (離す手.current) 離す手.current();
  };
  // 掴む／掴みを解く。縦でも横でも同じものを使う
  const 掴む = (id) => {
    if (見るだけ中) return void 閲覧中に押された();
    掴んだ列のref.current = id;
    落とす先のref.current = null;
    動かし始めた.current = false;
    set掴んだ列(id);
    set落とす先(null);
    知らせる('動かす先へ指をすべらせて、離してください');
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
  };
  // 掴んだだけで動かさずに離したときは、掴みを解く。
  // 動かし始めていれば PanResponder が受け持つので触らない
  const 掴みを見直す = () => {
    setTimeout(() => {
      if (!動かし始めた.current && 掴んだ列のref.current) 掴むのをやめる();
    }, 60);
  };
  const 掴むのをやめる = () => {
    掴んだ列のref.current = null;
    落とす先のref.current = null;
    動かし始めた.current = false;
    set掴んだ列(null);
    set落とす先(null);
    set指の横(null);
  };
  離す手.current = () => {
    const id = 掴んだ列のref.current;
    const 先 = 落とす先のref.current;
    掴むのをやめる();
    if (!id || null === 先) return;
    // 画面にはもう「離したらこうなる」並びが出ている。その並びのとおりに
    // 決めるだけなので、指していた番号をそのまま渡す
    const 元の一覧 = (Array.isArray(archers) ? archers : []).filter((x) => !!x);
    const いま = 元の一覧.findIndex((列) => 列.id === id);
    if (いま < 0 || いま === 先) return;
    列を並べ替える(id, 先);
    知らせる('立ち順を変えました');
    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
  };
  // 表の外で指を離しても、掴みを解く。
  //
  // 横に並べたときは、指の動きを名前の行が直に受けている。行の外まで
  // 動かして離すと、その行の「離した」が来ないまま掴んだ状態が残り、
  // 押していない指に札が付いてくる（2026-09-09 に踏んだ）。
  // 窓ごと受け止めれば、どこで離しても必ず終わる。
  React.useEffect(() => {
    if (!掴んだ列 || !IS_WEB || 'undefined' == typeof window) return;
    const 終わる = () => 離す手.current && 離す手.current();
    window.addEventListener('mouseup', 終わる);
    window.addEventListener('touchend', 終わる);
    window.addEventListener('touchcancel', 終わる);
    return () => {
      window.removeEventListener('mouseup', 終わる);
      window.removeEventListener('touchend', 終わる);
      window.removeEventListener('touchcancel', 終わる);
    };
  }, [掴んだ列]);
  if (!並べ替えの手.current)
    並べ替えの手.current = RN.PanResponder.create({
      // 掴んでいないときは何も奪わない。ふつうのスクロールと押すが効く
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => !!掴んだ列のref.current,
      // 掴んでいる間は、子（ますや名前のボタン）や外の流れより先に受け取る。
      // 先取りしないと、横に並べたときに指の動きが流れ側へ持っていかれて、
      // 掴めているのに動かせない（実際そうなった）
      onStartShouldSetPanResponderCapture: () => !!掴んだ列のref.current,
      onMoveShouldSetPanResponderCapture: () => !!掴んだ列のref.current,
      onPanResponderGrant: () => {
        動かし始めた.current = true;
      },
      onPanResponderMove: (_e, g) => {
        // 札を指に付いてこさせる。名前の並びの端からの座標に直して置く
        const 行 = 名の行のnode.current;
        if (行 && 'function' == typeof 行.getBoundingClientRect) {
          const r = 行.getBoundingClientRect();
          const ずれ = 'undefined' == typeof window ? 0 : (横に並べる ? window.scrollY : window.scrollX) || 0;
          set指の横((横に並べる ? g.moveY : g.moveX) - ((横に並べる ? r.top : r.left) + ずれ));
        }
        const i = 測る手.current ? 測る手.current(横に並べる ? g.moveY : g.moveX) : null;
        if (null !== i && i !== 落とす先のref.current) {
          落とす先のref.current = i;
          set落とす先(i);
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
  const 名前の幅 = 100 * 倍率;
  const 行の高さ = (射手) =>
    (射手 && 射手.isSeparator ? UIConfig.separatorWidth : UIConfig.cellHeight) * 倍率;
  const // 案内が指す先。縦の足元と同じ決まりで、まだ名前の入っていない人を選ぶ
    案内が指す順 = () => {
      const 一覧 = (Array.isArray(archers) ? archers : []).filter((x) => !!x);
      const 指す = 一覧.findIndex((x) => x && !x.name && !x.isSeparator && !x.isTotalCalculator);
      return 指す < 0 ? 0 : 指す;
    };
  const 横の名前セル = (射手, 順) => (
    <View
      key={typeof 射手.id === 'string' ? `名-${射手.id}` : `名-${順}`}
      ref={(node) => {
        // 指の下にどの列が居るかを測るために、節を覚えておく。
        // 縦と同じ入れ物を使う（並べ方が変わっても測り方は同じ）
        if (node) 名の欄のnode.current[射手.id] = node;
        else delete 名の欄のnode.current[射手.id];
        if (順 === 案内が指す順()) 案内.setTutorialTargetNode('記録.射手選択', node);
      }}
      testID={
        '名の欄-' + (射手.isSeparator ? '区切り' : 射手.isTotalCalculator ? '合計' : '射手') + '-' + 射手.id
      }
      style={{
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
          const 色 = (組.チームを割り当てる(見えている並び).find((列) => 列 && 列.id === 射手.id) || {}).色;
          return 色 ? { borderLeftWidth: 3 * 倍率, borderLeftColor: 色 } : null;
        })(),
        // 掴んでいる列は、抜けた跡として薄く残す（縦と同じ）
        ...(掴んだ列 === 射手.id ? { opacity: 0.35, backgroundColor: 'rgba(0,122,255,0.10)' } : null),
      }}
    >
      {射手.isSeparator ? (
        <TouchableOpacity
          style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }} // 縦の表と同じにする。押すと窓が開き、そこでチーム名を付けたり
          // 消したりできる。横だけ「押す＝そのまま消す」のままだと、
          // 向きを変えただけで振る舞いが変わって驚く
          onPress={() => 人を選ぶ(射手.id, 射手.name, 順)}
          onLongPress={() => 掴む(射手.id)}
          onPressOut={() => 掴みを見直す()}
          delayLongPress={400}
          disabled={見るだけ中}
        >
          {組.区切りのチーム名(射手) ? (
            <Text
              style={{
                fontSize: 11 * 倍率,
                fontWeight: '700',
                textAlign: 'center',
                color: 組.チームの色(組.区切りのチーム名(射手)) || '#8E8E93',
              }}
              numberOfLines={2}
            >
              {組.区切りのチーム名(射手)}
            </Text>
          ) : (
            <Icons.Ionicons name="ellipsis-horizontal" size={20 * 倍率} color="#8E8E93" />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
          onPress={() => 人を選ぶ(射手.id, 射手.name, 順)}
          onLongPress={() => 掴む(射手.id)}
          onPressOut={() => 掴みを見直す()}
          delayLongPress={400}
        >
          <Text
            style={[styles.footerName, { color: 射手.name ? '#000' : '#8E8E93', fontSize: 13 * 倍率 }]}
            numberOfLines={1}
          >
            {/* 手前の計もまとめる合計は「総計」。ふつうの「計」と */
            /* 見分けが付かないと、どこまでの合計か分からない */}
            {射手.isTotalCalculator
              ? 射手.またぐ合計
                ? '総計'
                : '合計'
              : 射手.name
                ? formatMemberName(射手.name, members)
                : '選択'}
          </Text>
          {射手.isGuest || (!射手.isTotalCalculator && '' !== 射手.name) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
              {射手.isGuest ? (
                <Text style={[styles.guestLabel, { fontSize: 9 * 倍率 }]}>(ゲスト)</Text>
              ) : null}
              {!射手.isTotalCalculator && '' !== 射手.name ? (
                <View
                  style={{
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
                  }}
                >
                  <Icons.Ionicons name="person" size={9 * 倍率} color="#FFF" />
                </View>
              ) : null}
            </View>
          ) : null}
        </TouchableOpacity>
      )}
    </View>
  );
  const 横の表 = () => {
    // 掴んでいる間は「離したらこうなる」並びを先に描く（縦と同じ）
    const 一覧 = 見えている並び;
    return [
      <ScrollView
        key={'横の表'}
        showsVerticalScrollIndicator={false}
        bounces={false} // 掴んでいる間は流さない。流すと、表が動くのか列が動くのか
        // 分からなくなる
        scrollEnabled={!掴んだ列}
        style={{ flexGrow: 0 }}
      >
        <View style={{ flexDirection: 'row', minWidth: '100%' }}>
          <View
            style={{ backgroundColor: '#F2F2F7', zIndex: 10 }} // 掴んでいる間だけ、縦の動きを並べ替えに使う。
            //
            // 横では PanResponder が指の動きを受け取れなかった（掴めるのに
            // 動かせない）。縦のときは横の動きなので取り合いにならないが、
            // 横のときは縦の動きで、外側の流れと競合するらしい。
            // ここは指の動きを直に見る（矢所の窓と同じやり方）
            onTouchMove={(出来事) => 指が動いた(出来事)}
            onTouchEnd={() => 指を離した()}
            onTouchCancel={() => 掴むのをやめる()}
            onMouseMove={(出来事) => 指が動いた(出来事)}
            onMouseUp={() => 指を離した()}
            ref={(node) => {
              名の行のnode.current = node;
            }}
          >
            {/* 運ぶ札。縦と同じものを、上下の座標に置き換えて出す */}
            {運ぶ札()}
            <View
              style={{
                width: 名前の幅,
                height: UIConfig.cellHeight * 倍率,
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
              }}
            >
              <Text style={{ fontSize: 10 * 倍率, fontWeight: 'bold', color: '#3C3C43' }}>名</Text>
            </View>
            {一覧.map((射手, 順) => 横の名前セル(射手, 順))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator style={{ flexGrow: 0, flexShrink: 1 }}>
            <View style={{ flexDirection: 'column', width: UIConfig.cellWidth * (shotsPerRound + 1) * 倍率 }}>
              <LabelColumn shots={shotsPerRound} showFooter={false} 横並び />
              {一覧.map((射手, 順) => (
                <ArcherColumnView
                  key={typeof 射手.id === 'string' ? 射手.id : `行-${順}`}
                  archer={射手}
                  shots={shotsPerRound}
                  allArchers={一覧}
                  indexInList={順}
                  showFooter={false}
                  横並び
                  isReadOnly={見るだけ中}
                  onPressName={() => 人を選ぶ(射手.id, 射手.name, 順)}
                  onDelete={() => deleteArcher(射手.id)}
                  onLongPressSeparator={() => {
                    if (見るだけ中) return void 閲覧中に押された();
                    setチーム名の下書き(射手.teamName || '');
                    setチーム名を付ける区切り(射手.id);
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>,
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
    const 持ち物 = 見えている並び.find((列) => 列 && 列.id === 掴んだ列);
    if (!持ち物) return null;
    const 名 = 持ち物.isTotalCalculator
      ? 持ち物.またぐ合計
        ? '総計'
        : '合計'
      : 持ち物.isSeparator
        ? 組.区切りのチーム名(持ち物) || '間隔'
        : 持ち物.name
          ? formatMemberName(持ち物.name, members)
          : '選択';
    const 太さ = (持ち物.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * 倍率;
    // 縦は「幅＝列の太さ／高さ＝名前の欄の高さ」、横はその逆
    const 置き方 = 横に並べる
      ? { left: 0, top: 指の横 - 太さ / 2, width: 名前の幅, height: 太さ }
      : { left: 指の横 - 太さ / 2, top: -6 * 倍率, width: 太さ, height: UIConfig.footerHeight * 倍率 };
    return (
      <View
        key={'運ぶ札'}
        pointerEvents="none"
        testID="運ぶ札"
        style={{
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
        }}
      >
        <Text
          style={{ fontSize: 13 * 倍率, fontWeight: '700', color: '#007AFF', textAlign: 'center' }}
          numberOfLines={2}
        >
          {名}
        </Text>
      </View>
    );
  };
  return (
    <Et要素 style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* 入り直しが要るときは、そちらを先に出す。同期エラーの帯だけでは */
      /* 何をすればよいか分からず、記録が届かないまま使い続けることになる */}
      {再ログインの案内 || (オフライン保存の警告 && !警告を閉じた) ? (
        <TouchableOpacity
          style={{ backgroundColor: '#B00020', paddingVertical: 8, paddingHorizontal: 12 }}
          onPress={() => 警告を閉じる(true)}
        >
          <Text style={{ color: '#FFF', fontSize: 12, lineHeight: 17, textAlign: 'center' }}>
            {再ログインの案内 ? 再ログインの案内 : `${オフライン保存の警告}（タップで閉じる）`}
          </Text>
        </TouchableOpacity>
      ) : null}
      {/* 履歴の記録を直しているあいだの帯。ここから保存して履歴へ戻るか、やめて戻る。 */
      /* 「終了・保存」とライブはこの間は出さない（記録が二重になる・ライブに結びつく） */}
      {履歴の編集
        ? (() => {
            const 記録 = 記録たち.find((x) => x && x.id === 履歴の編集.id);
            const 題 = 記録
              ? (記録.title && String(記録.title).trim()) || new Date(記録.date).toLocaleDateString('ja-JP')
              : '';
            const 戻る = (保存する) => {
              履歴の編集を終える(保存する);
              知らせる(保存する ? '履歴の記録に保存しました' : '直す前の記録表に戻しました');
              航路.navigate('履歴');
            };
            return (
              <View
                style={[
                  styles.liveStatusHeader,
                  {
                    backgroundColor: '#FF9500',
                    height: 'auto',
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    marginHorizontal: 8,
                    borderRadius: 8,
                  },
                ]}
                testID="履歴の編集の帯"
              >
                <Icons.Ionicons name="create-outline" size={13} color="#FFF" />
                <Text style={[styles.liveStatusText, { flex: 1 }]} numberOfLines={1}>
                  履歴の記録を直しています{題 ? '：' + 題 : ''}
                </Text>
                <TouchableOpacity
                  onPress={() => 戻る(true)}
                  style={{
                    backgroundColor: '#FFF',
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                  accessibilityRole="button"
                >
                  <Text style={{ color: '#FF9500', fontSize: 12, fontWeight: 'bold' }}>保存して戻る</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    窓.出す('直すのをやめますか', '変えたところは履歴に残りません。', [
                      { text: '続ける', style: 'cancel' },
                      { text: 'やめる', style: 'destructive', onPress: () => 戻る(false) },
                    ])
                  }
                  style={{
                    borderColor: '#FFF',
                    borderWidth: 1,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                  accessibilityRole="button"
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>やめる</Text>
                </TouchableOpacity>
              </View>
            );
          })()
        : null}
      {isLiveActive && liveSessionName ? (
        // 主催者は帯を押すと、リンクで配る窓が開く。
        // ライブ中しか出ない帯なので、ここに置くのがいちばん近い
        <ライブの帯
          style={[styles.liveStatusHeader, styles.liveActiveHeader, { marginHorizontal: 8, borderRadius: 8 }]}
          onPress={isHost ? () => 共有の窓を出す(true) : undefined}
        >
          <Icons.Ionicons name="radio-outline" size={12} color="#FFF" />
          <Text style={styles.liveStatusText} numberOfLines={1}>
            ライブ中{ライブは見るだけ ? '（閲覧用）' : ''}
            {': '}
            {liveSessionName}
          </Text>
          {isHost ? <Icons.Ionicons name="share-outline" size={12} color="#FFF" /> : null}
          {接続の文言 ? (
            <View style={styles.liveCount}>
              <Icons.Ionicons name="ellipse" size={7} color="#34C759" />
              <Text style={styles.liveCountText}>{接続の文言}</Text>
            </View>
          ) : null}
          {/* 期限が近いときだけ。字は最小限にして、意味は色で持たせる。 */}
          {/* 帯は1行なので、長い文を入れるとライブ名が潰れる */}
          {期限の残り ? (
            <View style={styles.liveLimit}>
              <Icons.Ionicons name="time-outline" size={10} color="#FFF" />
              <Text style={styles.liveLimitText}>{期限の残り}</Text>
            </View>
          ) : null}
        </ライブの帯>
      ) : null}
      {帯を畳む ? null : (
        <View style={[styles.navBar, { zIndex: 1e4 }]}>
          <View style={styles.navLeft}>
            <Pressable
              ref={案内のリセット}
              onPress={() => {
                if (見るだけ中) return void 閲覧中に押された();
                リセットの窓を出す(true);
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
              // web の TouchableOpacity は aria-label を見るので、両方渡す
              accessible
              accessibilityRole="button"
              accessibilityLabel="リセット"
              aria-label="リセット"
              accessibilityHint="記録表を空にします"
              style={({ hovered }) => [
                styles.resetBtn,
                見るだけ中 && { opacity: 0.4 },
                hovered && IS_WEB && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.resetBtnText}>リセット</Text>
            </Pressable>
            <View style={styles.syncContainer}>
              {isNetworkOnline && '同期エラー' !== syncStatus ? (
                '同期中' === syncStatus ? (
                  <Icons.Ionicons name="cloud-upload-outline" size={14} color="#007AFF" />
                ) : '同期済み' === syncStatus ? (
                  <Icons.Ionicons name="cloud-done-outline" size={14} color="#34C759" />
                ) : (
                  <Icons.Ionicons name="cloud-outline" size={14} color="#8E8E93" />
                )
              ) : (
                <Icons.Ionicons name="cloud-offline-outline" size={14} color="#FF3B30" />
              )}
              {false}
            </View>
            {/* 団体IDはここに出さない。細い画面でヘッダーが2段になり、 */
            /* 記録表の見える範囲を削っていた。記録中に見るものでもないので */
            /* 設定タブへ譲る（設定の先頭に出ている） */}
          </View>
          <View style={styles.navRight}>
            {/* ライブ中だけ出す「配る」。帯を押しても開くが、 */
            /* 押せると分かる形が無いと見つけられない。 */
            /*  */
            /* 帯は主催者しか押せないのに、こちらは部員にも出す。食い違いに */
            /* 見えるが、2026-08-31 に承知のうえでこうすると決めた。 */
            /* 先に押した部員が合言葉と期限を決め、期限はあとからは主催者でも */
            /* 延ばせない。それでも部員なら誰が配ってもよい、という判断。 */
            /* 直すときは帯（onPress: X ? … ）と揃えること。 */}
            {isLiveActive && !来客 ? (
              <TouchableOpacity
                style={styles.shareBtn} // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
                // web の TouchableOpacity は aria-label を見るので、両方渡す
                accessible
                accessibilityRole="button"
                accessibilityLabel="ライブをリンクで配る"
                aria-label="ライブをリンクで配る"
                onPress={() => 共有の窓を出す(true)}
              >
                <Icons.Ionicons name="share-outline" size={16} color="#007AFF" />
                <Text style={styles.shareBtnText}>配る</Text>
              </TouchableOpacity>
            ) : null}
            {/* 履歴の記録を直しているあいだはライブに入らない（盤面がライブと結びつく） */}
            {履歴の編集 ? null : (
              <TouchableOpacity
                ref={案内のライブボタン}
                onPress={() => {
                  // 共有リンクで来た人は、抜けたら見るものが無い。
                  // ライブから出るだけだと空の記録表に取り残されるので、
                  // 入口の画面まで戻す
                  isLiveActive
                    ? (来客
                        ? useScoreStore.getState().共有の来客をやめる()
                        : useScoreStore.getState().stopLiveSync(),
                      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning))
                    : ライブの選び窓を出す(true);
                }}
                style={[styles.liveBtn, isLiveActive && styles.liveBtnActive]}
              >
                <Icons.Ionicons name="radio-outline" size={16} color={isLiveActive ? '#FFF' : '#007AFF'} />
                <Text style={[styles.liveBtnText, isLiveActive && styles.liveBtnTextActive]}>
                  {isLiveActive ? (isHost ? '停止' : '退出') : 'ライブ'}
                </Text>
              </TouchableOpacity>
            )}
            {/* 立ちの増減。1立ち＝4射なので、4射ずつ動かす。 */
            /* 真ん中の「8射」を押せば、これまでどおり一覧から選べる */}
            <View
              ref={案内の射数} // 閲覧用のときは射数だけ薄くする。表示（大きさ）は触れてよい
              style={[styles.zoomContainer, 見るだけ中 && { opacity: 0.4 }]}
            >
              <TouchableOpacity
                onPress={() => {
                  if (見るだけ中) return void 閲覧中に押された();
                  射数を変える(Math.max(4, shotsPerRound - 4));
                }}
                disabled={shotsPerRound <= 4}
                accessible
                accessibilityRole="button"
                accessibilityLabel="射数を4本減らす"
                aria-label="射数を4本減らす"
                style={styles.zoomBtn}
              >
                <Icons.Ionicons
                  name="remove-circle-outline"
                  size={22}
                  color={shotsPerRound <= 4 ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => 射数の窓を出す(true)} style={styles.shotsToggle}>
                <Text style={styles.shotsText}>{shotsPerRound}射</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // 手入力と同じ上限(500)で止める。ここだけ上限が無いと、
                  // 押し続けてアプリが認めていない射数まで行けてしまう
                  if (見るだけ中) return void 閲覧中に押された();
                  射数を変える(Math.min(500, shotsPerRound + 4));
                }}
                disabled={shotsPerRound >= 500}
                accessible
                accessibilityRole="button"
                accessibilityLabel="射数を4本増やす"
                aria-label="射数を4本増やす"
                style={styles.zoomBtn}
              >
                <Icons.Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={shotsPerRound >= 500 ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>
            </View>
            {/* ％だけでは何の割合か分からないので、見出しを上に置く。 */
            /* ここは「表示」と短くする。細い画面ではヘッダーが2段になり、 */
            /* 記録表の見える範囲を削っていた。押した先のダイアログには */
            /* 場所があるので、そちらは「表示の大きさ」のままにしてある */}
            <TouchableOpacity ref={案内の拡大} onPress={() => 拡大を選ぶ(true)} style={styles.zoomToggle}>
              <Text style={styles.zoomLabel}>表示</Text>
              <View style={styles.zoomValue}>
                <Text style={styles.zoomText}>{Math.round(倍率 * 100)}%</Text>
                <Icons.Ionicons name="chevron-down" size={10} color="#007AFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* 拡大率の選択。射数の選択と同じ形にしてある */}
      <Modal visible={拡大選択中} transparent animationType="fade" onRequestClose={() => 拡大を選ぶ(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 }}>
          {/* 背景は「中身の親」ではなく「兄弟」にしてある。 */
          /* 親にすると、バーを掴んで離したときの click が背景まで伝わり、 */
          /* 倍率を合わせるたびに閉じてしまう */}
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onPress={() => 拡大を選ぶ(false)}
          />
          <View
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: '#FFF',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: '#C6C6C8',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '600' }}>表示の大きさ</Text>
            </View>
            {/* バーでも動かせるようにする。⊖ ⊕ は 5% ずつ */}
            <View style={styles.バーの行}>
              <TouchableOpacity
                onPress={() => setViewScale(Math.max(拡大の下, Math.round((倍率 - 0.05) * 20) / 20))}
                disabled={倍率 <= 拡大の下 + 0.001}
                accessible
                accessibilityRole="button"
                accessibilityLabel="表示を小さくする"
                aria-label="表示を小さくする"
                style={styles.zoomBtn}
              >
                <Icons.Ionicons
                  name="remove-circle-outline"
                  size={24}
                  color={倍率 <= 拡大の下 + 0.001 ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>
              <View
                style={styles.溝の当たり}
                onLayout={(出来事) => 溝の幅を置く(出来事.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={バーを動かす}
                onResponderMove={バーを動かす}
              >
                <View style={styles.溝} />
                <View style={[styles.溝の済み, { width: `${倍率を割合に(倍率) * 100}%` }]} />
                <View style={[styles.つまみ, { left: `${倍率を割合に(倍率) * 100}%` }]} />
              </View>
              <TouchableOpacity
                onPress={() => setViewScale(Math.min(拡大の上, Math.round((倍率 + 0.05) * 20) / 20))}
                disabled={倍率 >= 拡大の上 - 0.001}
                accessible
                accessibilityRole="button"
                accessibilityLabel="表示を大きくする"
                aria-label="表示を大きくする"
                style={styles.zoomBtn}
              >
                <Icons.Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={倍率 >= 拡大の上 - 0.001 ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>
              <Text style={styles.バーの数字}>{Math.round(倍率 * 100)}%</Text>
            </View>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((倍) => (
              <Pressable
                key={`zoom-option-${倍}`}
                style={({ hovered }) => [
                  {
                    padding: 16,
                    alignItems: 'center',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: '#C6C6C8',
                  },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                  Math.abs(倍率 - 倍) < 0.01 && { backgroundColor: '#EAF3FF' },
                ]}
                onPress={() => {
                  setViewScale(倍);
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                  拡大を選ぶ(false);
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: '#007AFF',
                    fontWeight: Math.abs(倍率 - 倍) < 0.01 ? 'bold' : 'normal',
                  }}
                >
                  {Math.round(倍 * 100)}%{1 === 倍 ? '（標準）' : ''}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={({ hovered }) => [
                { padding: 16, alignItems: 'center' },
                hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
              ]}
              onPress={() => 拡大を選ぶ(false)}
            >
              <Text style={{ fontSize: 17, color: '#8E8E93' }}>キャンセル</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={射数の窓} transparent animationType="fade" onRequestClose={射数の窓を閉じる}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 40,
          }}
          onPress={射数の窓を閉じる}
        >
          <View
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: '#FFF',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: '#C6C6C8',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '600' }}>射数の設定</Text>
            </View>
            {[4, 8, 12, 16, 20].map((本数) => (
              <Pressable
                key={`shot-option-${本数}`}
                style={({ hovered }) => [
                  {
                    padding: 18,
                    alignItems: 'center',
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: '#C6C6C8',
                  },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => {
                  射数を変える(本数);
                  射数の窓を閉じる();
                }}
              >
                <Text style={{ fontSize: 20, color: '#007AFF' }}>{本数}射</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ hovered }) => [
                { padding: 18, alignItems: 'center' },
                hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
              ]}
              onPress={() => {
                射数の窓を閉じる();
                setTimeout(() => {
                  射数の下書きを置く(String(shotsPerRound));
                  射数の入力窓を出す(true);
                }, 100);
              }}
            >
              <Text style={{ fontSize: 20, color: '#007AFF' }}>任意...</Text>
            </Pressable>
          </View>
          <Pressable
            style={({ hovered }) => [
              {
                width: '90%',
                maxWidth: 400,
                backgroundColor: '#FFF',
                borderRadius: 14,
                marginTop: 8,
                padding: 18,
                alignItems: 'center',
              },
              hovered && IS_WEB && { opacity: 0.8 },
            ]}
            onPress={射数の窓を閉じる}
          >
            <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
          </Pressable>
        </Pressable>
      </Modal>
      <LiveShareModal visible={共有の窓} onClose={() => 共有の窓を出す(false)} />
      <Modal
        visible={ライブの選び窓}
        transparent
        animationType="fade"
        onRequestClose={() => ライブの選び窓を出す(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 40,
          }}
          activeOpacity={1}
          onPress={() => ライブの選び窓を出す(false)}
        >
          <View
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: '#FFF',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              style={{
                padding: 18,
                alignItems: 'center',
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: '#C6C6C8',
              }}
              onPress={() => ライブを始める窓へ('host')}
            >
              <Text style={{ fontSize: 20, color: '#007AFF' }}>ライブ記録を開始</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 18, alignItems: 'center' }}
              onPress={() => ライブを始める窓へ('join')}
            >
              <Text style={{ fontSize: 20, color: '#007AFF' }}>ライブ記録に参加</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: '#FFF',
              borderRadius: 14,
              marginTop: 8,
              padding: 18,
              alignItems: 'center',
            }}
            onPress={() => ライブの選び窓を出す(false)}
          >
            <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal visible={ライブ名の窓} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 300,
              backgroundColor: '#FFF',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
              maxHeight: '80%',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              {'host' === ライブの種類 ? 'ライブを開始' : 'ライブに参加'}
            </Text>
            {'host' === ライブの種類 ? (
              <>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                  セッション名を入力してください
                </Text>
                <TextInput
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    borderColor: '#CCC',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    marginBottom: 20,
                  }}
                  value={ライブ名の下書き} // 名前を直したら注意書きも消す。残すと、直したのに
                  // 「使えません」が出たままで、何が悪いのか分からない
                  onChangeText={(文) => {
                    ライブ名の下書きを置く(文);
                    ライブ名の注意を置く(null);
                  }}
                  placeholder="session_name_123"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {ライブ名の注意 && (
                  <Text
                    style={{
                      color: '#FF3B30',
                      fontSize: 13,
                      textAlign: 'center',
                      marginBottom: 12,
                      fontWeight: 'bold',
                    }}
                  >
                    {ライブ名の注意}
                  </Text>
                )}
              </>
            ) : (
              <View style={{ width: '100%' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#666' }}>アクティブなセッション一覧</Text>
                  <TouchableOpacity
                    onPress={() => {
                      useScoreStore.getState().fetchActiveLiveSessions();
                      知らせる('更新しました');
                    }}
                  >
                    <Icons.Ionicons name="refresh" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ width: '100%', maxHeight: 300, marginBottom: 20 }}>
                  {Array.isArray(ライブの一覧) && 0 !== ライブの一覧.length ? (
                    ライブの一覧.map((名前) => (
                      <View
                        key={`live-session-${名前}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderBottomWidth: 1,
                          borderBottomColor: '#EEE',
                          backgroundColor: ライブ名の下書き === 名前 ? '#E5F1FF' : '#FFF',
                        }}
                      >
                        <TouchableOpacity
                          style={{ flex: 1, padding: 16 }} // 選び直したら注意書きも消す（入力欄と揃える）
                          onPress={() => {
                            ライブ名の下書きを置く(名前);
                            ライブ名の注意を置く(null);
                          }}
                        >
                          <Text style={{ fontSize: 16, color: '#333' }}>{名前}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ padding: 16 }}
                          onPress={() => {
                            Alert.alert('セッション削除', `セッション「${名前}」を完全に削除しますか？`, [
                              { text: 'キャンセル', style: 'cancel' },
                              {
                                text: '削除',
                                style: 'destructive',
                                onPress: () => useScoreStore.getState().deleteLiveSession(名前),
                              },
                            ]);
                          }} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel="このライブを消す"
                          aria-label="このライブを消す"
                        >
                          <Icons.Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                      現在アクティブな記録はありません
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#F2F2F7',
                  alignItems: 'center',
                }}
                onPress={() => ライブ名の窓を出す(false)}
              >
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: ライブ名の下書き.trim() ? '#007AFF' : '#CCC',
                  alignItems: 'center',
                }}
                onPress={async () => {
                  if (!ライブ名の下書き.trim()) return;
                  const 名前 = ライブ名の下書き.trim();
                  // Realtime Database の枝の名前に使えない字を弾く。
                  // とくに「/」は例外にならず階層の区切りとして通ってしまい、
                  // 「5/8」のような日付を入れると 5 の下に 8 が作られる。
                  // そうなると参加一覧にも出ず、参加も削除もできないライブが残る
                  const 使えない字 = ライブ名に使えない字(名前);
                  if (使えない字)
                    return void (ライブ名の注意を置く(
                      `ライブ名に ${使えない字} は使えません。別の名前を入力してください。`
                    ),
                    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
                  if ((ライブ名の注意を置く(null), 'host' === ライブの種類)) {
                    知らせる('ライブを開始しています...');
                    const 結果 = await useScoreStore.getState().startLiveSync(名前);
                    if ('開始した' === 結果)
                      return void (ライブ名の窓を出す(false),
                      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));
                    // 「同名あり」と「確かめられなかった」を区別する。
                    // 元はどちらも「既に使用されています」と出していて、
                    // 通信が乱れただけのときに誤った案内になっていた
                    return void (ライブ名の注意を置く(
                      '同名あり' === 結果
                        ? `'${名前}' は既に使用されています。別の名前を入力してください。`
                        : '通信が不安定なため開始できませんでした。電波の良い場所でもう一度お試しください。'
                    ),
                    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
                  }
                  if ('join' === ライブの種類) {
                    if (!useScoreStore.getState().liveSessionsList.includes(名前))
                      return void ライブ名の注意を置く(`'${名前}' というセッションは見つかりませんでした。`);
                    // 参加のしかたを選ぶ。見るだけなら盤面を書き換えない
                    // 参加のしかたは画面の中のポップアップで選ぶ
                    const 聞く = () => 参加のしかたを聞くを置く(名前);
                    if (archers.length > 0) {
                      確認を置く({
                        文: '手元の記録が消去され、ライブ参加データで上書きされます。よろしいですか？',
                        実行: 聞く,
                      });
                    } else 聞く();
                  }
                }}
                disabled={!ライブ名の下書き.trim()}
              >
                <Text style={{ fontSize: 16, color: '#FFF', fontWeight: 'bold' }}>決定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View
        style={[styles.gridArea, { justifyContent: 'center', alignItems: 'center' }]}
        onLayout={(出来事) => {
          取っ手の区画の幅.current = 出来事.nativeEvent.layout.width;
        }}
      >
        {/* 帯を畳む取っ手。記録表の区画の中に置くので、上の帯があっても */
        /* 無くても重ならない。横へ引くと左上・右上へ動かせる（上の仕掛け） */}
        <RN.Animated.View
          {...取っ手の手.current.panHandlers}
          testID="帯の取っ手の置き場"
          style={[
            styles.帯の取っ手の置き場,
            帯の取っ手は左 ? { left: 8 } : { right: 8 },
            { transform: [{ translateX: 取っ手のずれ }] },
          ]}
        >
          <Pressable
            onPress={() => {
              if (取っ手を引いた.current) return;
              if (set帯を畳む) set帯を畳む(!畳む覚え);
              ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
            }}
            testID="帯の開け閉め"
            accessible
            accessibilityRole="button"
            accessibilityLabel={畳む覚え ? '操作の帯を開く' : '操作の帯を畳む'}
            accessibilityHint="横へ引くと左上・右上へ動かせます"
            aria-label={畳む覚え ? '操作の帯を開く' : '操作の帯を畳む'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ hovered }) => [styles.帯の取っ手, hovered && IS_WEB && { opacity: 0.85 }]}
          >
            <Icons.Ionicons name={帯を畳む ? 'chevron-down' : 'chevron-up'} size={18} color="#8E8E93" />
          </Pressable>
        </RN.Animated.View>
        <View ref={案内の記録表} style={{ maxHeight: '100%', flexDirection: 'column', maxWidth: '100%' }}>
          {横に並べる
            ? 横の表()
            : [
                <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flexGrow: 0 }}>
                  <View style={{ flexDirection: 'row-reverse', minWidth: '100%' }}>
                    <View style={{ backgroundColor: '#F2F2F7', zIndex: 10 }}>
                      <LabelColumn shots={shotsPerRound} showFooter={false} />
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator
                      style={{ flexGrow: 0, flexShrink: 1 }}
                      ref={上の横流し}
                      onScroll={(出来事) => {
                        const 横の位置 = 出来事.nativeEvent.contentOffset.x;
                        下の横流し.current?.scrollTo({ x: 横の位置, animated: false });
                      }}
                      scrollEventThrottle={16}
                    >
                      <View style={[styles.gridRow, { flexDirection: 'row-reverse' }]}>
                        {見えている並び.map((射手, 順) => (
                          <ArcherColumnView
                            key={typeof 射手.id === 'string' ? 射手.id : `archer-${順}`}
                            archer={射手}
                            shots={shotsPerRound} // ドラッグ中は「入れた結果」の並びを渡す。計もチームも
                            // その並びで数え直るので、離す前に出来上がりが見える
                            allArchers={見えている並び}
                            indexInList={順}
                            showFooter={false}
                            isReadOnly={見るだけ中}
                            onPressName={() => 人を選ぶ(射手.id, 射手.name, 順)}
                            onDelete={() => deleteArcher(射手.id)}
                            onLongPressSeparator={() => {
                              if (見るだけ中) return void 閲覧中に押された();
                              setチーム名の下書き(射手.teamName || '');
                              setチーム名を付ける区切り(射手.id);
                            }}
                          />
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>,
                <View
                  style={{
                    height: UIConfig.footerHeight * 倍率,
                    flexDirection: 'row-reverse',
                    borderTopWidth: 1.5,
                    borderTopColor: '#000',
                  }}
                >
                  <View
                    style={{
                      width: UIConfig.headerWidth * 倍率,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#F2F2F7',
                      borderLeftWidth: 1.5,
                      borderLeftColor: '#000',
                      borderRightWidth: 1.5,
                      borderRightColor: '#000',
                    }}
                  >
                    <Text style={{ fontSize: 10 * 倍率, fontWeight: 'bold', color: '#3C3C43' }}>名</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false} // 掴んでいる間は流さない。流すと、表が動くのか列が動くのか
                    // 分からなくなる
                    scrollEnabled={!掴んだ列}
                    style={{ flexGrow: 0, flexShrink: 1 }}
                    ref={下の横流し}
                    onScroll={(出来事) => {
                      const 横の位置 = 出来事.nativeEvent.contentOffset.x;
                      上の横流し.current?.scrollTo({ x: 横の位置, animated: false });
                    }}
                    scrollEventThrottle={16}
                  >
                    <View
                      style={[styles.gridRow, { flexDirection: 'row-reverse' }]}
                      {...(並べ替えの手.current ? 並べ替えの手.current.panHandlers : {})}
                      ref={(node) => {
                        名の行のnode.current = node;
                      }}
                    >
                      {運ぶ札()}
                      {[
                        ...見えている並び.map((射手, 順) => {
                          return (
                            <View
                              key={typeof 射手.id === 'string' ? `footer-${射手.id}` : `footer-${順}`} // 使い方の案内が指す先。まだ名前の入っていない列を選ぶ。
                              // 名前入りの列を指すと、押しても名前の数が増えず先へ進めない。
                              // 繰り返しの中なのでフックは使えない
                              ref={(node) => {
                                // 指の下にどの列が居るかを測るために、節を覚えておく
                                if (node) 名の欄のnode.current[射手.id] = node;
                                else delete 名の欄のnode.current[射手.id];
                                const 一覧 = (Array.isArray(archers) ? archers : []).filter((x) => !!x);
                                let 指す = 一覧.findIndex(
                                  (x) => x && !x.name && !x.isSeparator && !x.isTotalCalculator
                                );
                                if (指す < 0) 指す = 0;
                                if (順 === 指す) 案内.setTutorialTargetNode('記録.射手選択', node);
                              }}
                              style={{
                                width:
                                  (射手.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * 倍率,
                                height: UIConfig.footerHeight * 倍率,
                                backgroundColor: 射手.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7',
                                borderRightWidth: 射手.isSeparator || 射手.isTotalCalculator ? 1.5 : 1,
                                borderRightColor: '#000',
                                borderLeftWidth: 射手.isSeparator || 射手.isTotalCalculator ? 1.5 : 0,
                                borderLeftColor: '#000',
                                padding: 4,
                                justifyContent: 'center',
                                alignItems: 'center',
                                // 掴んでいる列は、抜けた跡として薄く残す。
                                // どこへ入るかは並びそのもので見せるので、
                                // 落とす先を別に光らせる必要はない
                                ...(掴んだ列 === 射手.id
                                  ? { opacity: 0.35, backgroundColor: 'rgba(0,122,255,0.10)' }
                                  : null),
                              }}
                            >
                              {射手.isSeparator ? (
                                <TouchableOpacity
                                  style={{
                                    alignItems: 'center',
                                    width: '100%',
                                    height: '100%',
                                    justifyContent: 'center',
                                  }} // 位置ではなく列のIDで名づける。並べ替えても
                                  // 同じ列を追える（ます-<射手ID>-<射番> と同じ流儀）
                                  testID={'名の欄-区切り-' + 射手.id} // 押すと窓が開く。以前は押す＝そのまま消すで、
                                  // チーム名は長押しでしか入れられなかった。
                                  // 消す道は窓の中の「削除」に移してある
                                  onPress={() => 人を選ぶ(射手.id, 射手.name, 順)} // 長押しは「掴む」。チーム名は窓から入れる
                                  //（長押ししか道が無くて気づけなかった）
                                  onLongPress={() => 掴む(射手.id)}
                                  onPressOut={() => 掴みを見直す()}
                                  delayLongPress={400}
                                  disabled={見るだけ中}
                                >
                                  {/* 名前が付いていれば名前を、なければ「⋯」。 */
                                  /* ×印だったころは押す＝消すに見えて、名前を */
                                  /* 入れられることに気づけなかった */}
                                  {組.区切りのチーム名(射手) ? (
                                    <Text
                                      style={{
                                        fontSize: 組.区切りの名の字(倍率, UIConfig).fontSize,
                                        lineHeight: 組.区切りの名の字(倍率, UIConfig).lineHeight,
                                        fontWeight: '700',
                                        textAlign: 'center',
                                        color: 組.チームの色(組.区切りのチーム名(射手)) || '#8E8E93',
                                      }} // 欄の高さに入るだけ行を使う。3 行では
                                      // 「日本大学工科」が「日本大.」に切れて分からなかった
                                      numberOfLines={組.区切りの名の字(倍率, UIConfig).numberOfLines}
                                    >
                                      {組.区切りのチーム名(射手)}
                                    </Text>
                                  ) : (
                                    <Icons.Ionicons
                                      name="ellipsis-horizontal"
                                      size={24 * 倍率}
                                      color="#8E8E93"
                                    />
                                  )}
                                </TouchableOpacity>
                              ) : (
                                <TouchableOpacity
                                  style={[
                                    {
                                      alignItems: 'center',
                                      width: '100%',
                                      height: '100%',
                                      justifyContent: 'center',
                                    },
                                    // チームの色を、名前の欄の上に細い帯で出す。
                                    // 字を染めると読みにくいので帯にする
                                    (() => {
                                      const 色 = (
                                        組
                                          .チームを割り当てる(見えている並び)
                                          .find((列) => 列 && 列.id === 射手.id) || {}
                                      ).色;
                                      return 色 ? { borderTopWidth: 3 * 倍率, borderTopColor: 色 } : null;
                                    })(),
                                  ]} // 押すと窓が開く。合計の列なら、そこで
                                  // 数える範囲を変えたり消したりできる。
                                  // ここで範囲の切り替えだけを行うと、
                                  // 窓が開かなくなって消せなくなる（実際そうなった）
                                  testID={
                                    '名の欄-' + (射手.isTotalCalculator ? '合計' : '射手') + '-' + 射手.id
                                  }
                                  onPress={() => 人を選ぶ(射手.id, 射手.name, 順)}
                                  onLongPress={() => 掴む(射手.id)}
                                  onPressOut={() => 掴みを見直す()}
                                  delayLongPress={400}
                                >
                                  <Text
                                    style={[
                                      styles.footerName,
                                      { color: 射手.name ? '#000' : '#8E8E93', fontSize: 14 * 倍率 },
                                    ]}
                                    numberOfLines={2}
                                  >
                                    {/* 手前の計もまとめる合計は「総計」。 */
                                    /* どちらを見ているか、見出しで分かるようにする */}
                                    {射手.isTotalCalculator
                                      ? 射手.またぐ合計
                                        ? '総計'
                                        : '合計'
                                      : 射手.name
                                        ? formatMemberName(射手.name, members)
                                        : '選択'}
                                  </Text>
                                  {!!射手.isGuest && (
                                    <Text style={[styles.guestLabel, { fontSize: 9 * 倍率 }]}>(ゲスト)</Text>
                                  )}
                                  {!射手.isTotalCalculator && '' !== 射手.name ? (
                                    <View
                                      style={{
                                        marginTop: 2,
                                        paddingHorizontal: 4,
                                        paddingVertical: 2,
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
                                      }}
                                    >
                                      <Icons.Ionicons name="person" size={10 * 倍率} color="#FFF" />
                                    </View>
                                  ) : null}
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        }),
                      ]}
                    </View>
                  </ScrollView>
                </View>,
              ]}
        </View>
        {0 === archers.length && (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyTitle}>記録を始めましょう</Text>
            <Text style={styles.emptyHint}>下の「人」ボタンで射手を追加</Text>
          </View>
        )}
      </View>
      {帯を畳む ? null : (
        <View style={styles.toolbar}>
          <>
            <View ref={案内の取り消し} style={styles.historyBtns}>
              <Pressable
                style={({ hovered }) => [
                  styles.historyBtn,
                  { opacity: 戻せる ? 1 : 0.3 },
                  hovered && 戻せる && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => {
                  // ライブ中は共有の知らせ（「取り消しされました。」）が
                  // 押した本人にも出る。ここでも出すと二つ重なる
                  戻せる &&
                    (undo(),
                    ライブの知らせに任せる || 知らせる('元に戻しました'),
                    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));
                }}
                disabled={!戻せる} // 自動での確かめ用。絵だけのボタンは外から指せない
                testID="取り消し"
                accessible
                accessibilityRole="button"
                accessibilityLabel="取り消し"
                aria-label="取り消し"
              >
                <Icons.Ionicons name="arrow-undo" size={24} color="#8E8E93" />
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.historyBtn,
                  { opacity: 進める ? 1 : 0.3 },
                  hovered && 進める && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => {
                  進める &&
                    (redo(),
                    ライブの知らせに任せる || 知らせる('やり直しました'),
                    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));
                }}
                disabled={!進める}
                testID="やり直し"
                accessible
                accessibilityRole="button"
                accessibilityLabel="やり直し"
                aria-label="やり直し"
              >
                <Icons.Ionicons name="arrow-redo" size={24} color="#8E8E93" />
              </Pressable>
              {/* 記録表の並べ方を変える。絵だけでは向きが読み取りにくいので、 */
              /* 押したあとに何になったかを短く知らせる */}
              <Pressable
                style={({ hovered }) => [
                  styles.historyBtn,
                  // 取り消し・やり直しと同じ幅にそろえる。絵が小さいぶん
                  // 放っておくと28pxになり、この並びで一番押しにくいボタンになる
                  { alignItems: 'center', minWidth: 32 },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => {
                  const 次 = !横に並べる;
                  if (set横に並べる) set横に並べる(次);
                  知らせる(次 ? '横に並べました' : '縦に並べました');
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                }}
                testID="並べ方"
              >
                <Icons.Ionicons
                  name={横に並べる ? 'phone-portrait-outline' : 'phone-landscape-outline'}
                  size={20}
                  color="#8E8E93"
                />
                <Text style={{ fontSize: 9, color: '#8E8E93', marginTop: 1 }}>
                  {横に並べる ? '縦へ' : '横へ'}
                </Text>
              </Pressable>
            </View>
            <View style={[styles.addBtns, 見るだけ中 && { opacity: 0.4 }]}>
              <Pressable
                ref={案内の人ボタン}
                style={({ hovered }) => [
                  styles.addBtn,
                  { backgroundColor: 'rgba(0,122,255,0.1)' },
                  hovered && IS_WEB && { backgroundColor: 'rgba(0,122,255,0.2)' },
                ]} // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
                // web の TouchableOpacity は aria-label を見るので、両方渡す
                accessible
                accessibilityRole="button"
                accessibilityLabel="射手を追加"
                aria-label="射手を追加"
                accessibilityHint="記録表にひとり足します"
                onPress={() => {
                  if (見るだけ中) return void 閲覧中に押された();
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
                  addArcher();
                }}
              >
                <Icons.Ionicons name="person-add" size={24} color="#007AFF" />
                <Text style={[styles.addLabel, { color: '#007AFF' }]}>人</Text>
              </Pressable>
              <Pressable
                ref={案内の間隔}
                style={({ hovered }) => [
                  styles.addBtn,
                  { backgroundColor: 'rgba(255,149,0,0.1)' },
                  hovered && IS_WEB && { backgroundColor: 'rgba(255,149,0,0.2)' },
                ]}
                onPress={() => {
                  if (見るだけ中) return void 閲覧中に押された();
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                  addSeparator();
                }}
              >
                <Icons.Ionicons name="pause" size={24} color="#FF9500" />
                <Text style={[styles.addLabel, { color: '#FF9500' }]}>間隔</Text>
              </Pressable>
              <Pressable
                ref={案内の計}
                style={({ hovered }) => [
                  styles.addBtn,
                  { backgroundColor: 'rgba(52,199,89,0.1)' },
                  hovered && IS_WEB && { backgroundColor: 'rgba(52,199,89,0.2)' },
                ]}
                onPress={() => {
                  if (見るだけ中) return void 閲覧中に押された();
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                  addTotalCalculator();
                }} // 入れたあと、その列を押すと「この立ちだけ」と
                // 「手前の計もまとめた総計」を切り替えられる
                accessibilityHint="合計の列を足します。入れたあと列を押すと、数える範囲を変えられます"
              >
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#34C759' }}>Σ</Text>
                <Text style={[styles.addLabel, { color: '#34C759' }]}>計</Text>
              </Pressable>
              <Pressable
                ref={案内の画像}
                style={({ hovered }) => [
                  styles.addBtn,
                  { backgroundColor: 'rgba(142,142,147,0.1)' },
                  hovered && IS_WEB && { backgroundColor: 'rgba(142,142,147,0.2)' },
                ]}
                onPress={() => {
                  if (見るだけ中) return void 閲覧中に押された();
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
                  setShowOCRModal(true);
                }}
              >
                <Icons.Ionicons name="camera" size={24} color="#8E8E93" />
                <Text style={[styles.addLabel, { color: '#8E8E93' }]}>画像</Text>
              </Pressable>
            </View>
            <Pressable
              ref={案内の保存ボタン}
              style={({ hovered }) => [
                styles.saveBtn,
                履歴の編集 && { backgroundColor: '#FF9500' },
                (見るだけ中 || よその団体) && { opacity: 0.4 },
                hovered && IS_WEB && { opacity: 0.9, transform: [{ scale: 1.02 }] },
              ]} // 絵だけのボタンは読み上げに何も伝わらない。端末は accessibilityLabel、
              // web の TouchableOpacity は aria-label を見るので、両方渡す
              accessible
              accessibilityRole="button"
              accessibilityLabel={履歴の編集 ? '履歴に保存して戻る' : '終了して保存'}
              aria-label={履歴の編集 ? '履歴に保存して戻る' : '終了して保存'}
              accessibilityHint={
                履歴の編集 ? '直した内容を履歴の記録に書き戻します' : 'いまの記録表を履歴に残します'
              }
              onPress={() => {
                // 履歴の記録を直しているあいだは、新しい記録にせず元の記録へ書き戻す
                if (履歴の編集) {
                  履歴の編集を終える(true);
                  知らせる('履歴の記録に保存しました');
                  航路.navigate('履歴');
                  return;
                }
                if (見るだけ中) return void 閲覧中に押された();
                // よその団体のライブは、自分の記録として残さない。
                // 押しても無反応だと壊れたのか決まりなのか分からないので、理由を言う
                if (よその団体)
                  return void (知らせる('共有されたライブは、主催者の側で保存されます'),
                  ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning));
                if (0 === archers.length) return;
                // 設定で出欠確認を切っていれば、窓を飛ばして保存へ進む。
                // 出欠は空のまま保存する。記録に出ている人は出欠画面で
                // そのまま出席として数えられる（遅刻・早退の区別は付かない）
                if (保存時に出欠を確認する) setShowAttendance(true);
                else {
                  setTempAttendance(null);
                  保存の窓を出す(true);
                }
              }}
            >
              <Text style={styles.saveBtnText}>{履歴の編集 ? '保存して戻る' : '終了・保存'}</Text>
            </Pressable>
          </>
        </View>
      )}
      <ArcherActionModal
        交代を消せる
        visible={人の窓}
        archerId={選んだ射手ID || ''}
        archerOrigIdx={選んだ射手の順}
        isSeparator={
          (Array.isArray(archers) ? archers : []).find((x) => x && x.id === 選んだ射手ID)?.isSeparator ||
          false
        }
        isTotalCalculator={
          (Array.isArray(archers) ? archers : []).find((x) => x && x.id === 選んだ射手ID)
            ?.isTotalCalculator || false
        } // 合計の列が、いま手前の計もまとめて数えているか。窓の中で切り替える
        またぐ合計={
          (Array.isArray(archers) ? archers : []).find((x) => x && x.id === 選んだ射手ID)?.またぐ合計 || false
        }
        on合計の範囲={() => {
          if (見るだけ中) return void 閲覧中に押された();
          const 列 = (Array.isArray(archers) ? archers : []).find((x) => x && x.id === 選んだ射手ID);
          合計の範囲を切り替える(選んだ射手ID);
          知らせる(列?.またぐ合計 ? 'この立ちだけの合計にしました' : '手前の計もまとめた総計にしました');
          人の窓を出す(false);
        }} // 区切りにチーム名を付ける道。窓からも入れるようにした
        いまのチーム名={
          組.区切りのチーム名(
            (Array.isArray(archers) ? archers : []).find((x) => x && x.id === 選んだ射手ID) || {}
          ) || ''
        }
        onチーム名={() => {
          if (見るだけ中) return void 閲覧中に押された();
          const 列 = (Array.isArray(archers) ? archers : []).find((x) => x && x.id === 選んだ射手ID);
          setチーム名の下書き((列 && 列.teamName) || '');
          setチーム名を付ける区切り(選んだ射手ID);
          人の窓を出す(false);
        }} // 立ち順の入れ替え。store には並びの向き（前・後）で渡す。
        // 字をどう出すかは並べ方しだいなので、それは窓へ伝える
        //（縦は右／左、横は上／下）。端の列では、その向きを出さない
        横に並べている={!!横に並べる}
        手前へ動かせる={(() => {
          const 並び = (Array.isArray(archers) ? archers : []).filter((x) => !!x);
          return 並び.findIndex((x) => x.id === 選んだ射手ID) > 0;
        })()}
        奥へ動かせる={(() => {
          const 並び = (Array.isArray(archers) ? archers : []).filter((x) => !!x);
          const 順 = 並び.findIndex((x) => x.id === 選んだ射手ID);
          return 順 >= 0 && 順 < 並び.length - 1;
        })()}
        on動かす={(向き) => {
          if (見るだけ中) return void 閲覧中に押された();
          列を動かす(選んだ射手ID, 向き);
          知らせる(
            '前' === 向き
              ? 横に並べる
                ? '上へ動かしました'
                : '右へ動かしました'
              : 横に並べる
                ? '下へ動かしました'
                : '左へ動かしました'
          );
        }}
        onClose={() => 人の窓を出す(false)}
        onSubstitution={() => 交代の窓を出す(true)}
      />
      <AttendanceCheckModal
        visible={showAttendance}
        onClose={() => setShowAttendance(false)}
        onConfirm={(attendance) => {
          setTempAttendance(attendance);
          setShowAttendance(false);
          保存の窓を出す(true);
        }}
        members={members}
        activeArchers={archers}
      />
      <SaveSessionModal
        visible={保存の窓}
        onClose={() => 保存の窓を出す(false)}
        onSave={(題, 覚え書き, 統計に入れる, タグの文) => {
          保存の窓を出す(false);
          ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
          const タグ = タグの文
            .split(/[,\u3001\s]+/)
            .map((x) => (x.startsWith('#') ? x : `#${x}`))
            .map((x) => x.trim())
            .filter((x) => '#' !== x);
          saveSession(題, 覚え書き, 統計に入れる, タグ, tempAttendance);
          useScoreStore.getState().setCurrentSessionTags([]);
          知らせる('保存しました');
        }}
      />
      <ManualSubstitutionModal
        visible={交代の窓}
        archerId={選んだ射手ID}
        onClose={() => 交代の窓を出す(false)}
      />
      <Modal
        visible={リセットの窓}
        transparent
        animationType="fade"
        onRequestClose={() => リセットの窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => リセットの窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>すべての記録をリセット</Text>
            <Text style={styles.modalMessage}>
              現在入力されているすべての的中記録と交代設定、およびすべてのデータが削除されます。リセットしてよろしいですか？
            </Text>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && IS_WEB && { backgroundColor: '#E5E5EA' },
                ]}
                onPress={() => リセットの窓を出す(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                  hovered && IS_WEB && { opacity: 0.8 },
                ]}
                onPress={() => {
                  リセットの窓を出す(false);
                  resetCurrentSession();
                  ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
                  知らせる('リセットしました。');
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>リセット</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={射数を減らす確認}
        transparent
        animationType="fade"
        onRequestClose={() => 射数を減らす確認を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => 射数を減らす確認を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>射数を減らしますか？</Text>
            <Text style={styles.modalMessage}>
              射数を{減らす先の射数}射に減らすと、後ろの入力済みデータがすべて削除されます。よろしいですか？
            </Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]}
                onPress={() => 射数を減らす確認を出す(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]}
                onPress={() => {
                  射数を減らす確認を出す(false);
                  setShotsPerRound(減らす先の射数);
                  ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>削除して変更</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={射数の入力窓}
        transparent
        animationType="fade"
        onRequestClose={() => 射数の入力窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => 射数の入力窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>射数の詳細設定</Text>
            <Text style={styles.modalMessage}>1〜500本の間で入力してください</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={射数の下書き}
              onChangeText={射数の下書きを置く}
              onSubmitEditing={入力した射数で決める}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && IS_WEB && { backgroundColor: '#E5E5EA' },
                ]}
                onPress={() => 射数の入力窓を出す(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                  hovered && IS_WEB && { opacity: 0.8 },
                ]}
                onPress={入力した射数で決める}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>決定</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {知らせ ? (
        <View style={styles.feedbackOverlay}>
          <Text style={styles.feedbackText}>{知らせ}</Text>
        </View>
      ) : null}
      <Modal
        visible={null !== 参加のしかたを聞く}
        transparent
        animationType="fade"
        onRequestClose={() => 参加のしかたを聞くを置く(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 40,
          }}
          onPress={() => 参加のしかたを聞くを置く(null)}
        >
          <View
            style={{
              width: '90%',
              maxWidth: 400,
              backgroundColor: '#FFF',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: '#C6C6C8',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '600' }}>参加のしかた</Text>
              <Text style={{ fontSize: 15, color: '#3C3C43', marginTop: 4 }}>{参加のしかたを聞く || ''}</Text>
            </View>
            <Pressable
              style={({ hovered }) => [
                {
                  padding: 16,
                  alignItems: 'center',
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: '#C6C6C8',
                },
                hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
              ]}
              onPress={() => {
                const 名 = 参加のしかたを聞く;
                参加のしかたを聞くを置く(null);
                if (名) ライブに入る(名, false);
              }}
            >
              <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>記録用</Text>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>○×を入れられます</Text>
            </Pressable>
            <Pressable
              style={({ hovered }) => [
                { padding: 16, alignItems: 'center' },
                hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
              ]}
              onPress={() => {
                const 名 = 参加のしかたを聞く;
                参加のしかたを聞くを置く(null);
                if (名) ライブに入る(名, true);
              }}
            >
              <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>閲覧用</Text>
              <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>
                画面を見るだけ。○×は入れません
              </Text>
            </Pressable>
          </View>
          <Pressable
            style={({ hovered }) => [
              {
                width: '90%',
                maxWidth: 400,
                backgroundColor: '#FFF',
                borderRadius: 14,
                marginTop: 8,
                padding: 18,
                alignItems: 'center',
              },
              hovered && IS_WEB && { opacity: 0.8 },
            ]}
            onPress={() => 参加のしかたを聞くを置く(null)}
          >
            <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={null !== 確認} transparent animationType="fade" onRequestClose={() => 確認を置く(null)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
          onPress={() => 確認を置く(null)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFF',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 15, color: '#1C1C1E', lineHeight: 22 }}>
                {(確認 && 確認.文) || ''}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: '#C6C6C8',
              }}
            >
              <Pressable
                style={({ hovered }) => [
                  { flex: 1, padding: 16, alignItems: 'center' },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => 確認を置く(null)}
              >
                <Text style={{ fontSize: 17, color: '#007AFF' }}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  {
                    flex: 1,
                    padding: 16,
                    alignItems: 'center',
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderLeftColor: '#C6C6C8',
                  },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => {
                  const 手 = 確認 && 確認.実行;
                  確認を置く(null);
                  if (手) 手();
                }}
              >
                <Text style={{ fontSize: 17, color: '#007AFF', fontWeight: 'bold' }}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
      <OCRRecordModal
        visible={showOCRModal}
        onClose={() => setShowOCRModal(false)}
        members={members}
        alumni={useScoreStore((状態) => 状態.alumni) || []}
        shotsPerRound={shotsPerRound}
        hasExistingRecord={archers.length > 0} // いまの記録表で埋まっている射数（いちばん後ろの○×の位置）。
        // 窓の側で、写真で読めた射数と比べて多いほうに射数を合わせる
        記入済みの射数={Math.max(
          0,
          ...(Array.isArray(archers) ? archers : []).map((射手) => {
            if (!射手 || 射手.isSeparator || !Array.isArray(射手.marks)) return 0;
            let 後ろ = 0;
            射手.marks.forEach((印, 番) => {
              if (印) 後ろ = 番 + 1;
            });
            return 後ろ;
          })
        )}
        onApply={(newArchers, 読み取りの種類, 入れ方, 射数) => {
          // 画像は setState で直に盤面を差し替えるため、ストアの止めが効かない。
          // 閲覧用のときはここで返す
          if (見るだけ中) return void 閲覧中に押された();
          // 射数を写真と記録表の多いほうに合わせる（設定より多ければ広げ、少なければ縮める。
          // 埋まった○×は縮めても消えない）。先に合わせないと、いまの並びと読み取った
          // 並びで○×の長さが食い違う
          if (Number.isInteger(射数) && 射数 >= 1 && 射数 !== shotsPerRound) setShotsPerRound(射数);
          const store = useScoreStore.getState();
          if (store.historyStack && store.historyStack.length >= 0)
            useScoreStore.setState({
              // 履歴には射手の一覧をそのまま積む（店の中の積み方と同じ）。
              // ここだけ { archers, activeSessionID } という形で積んでいたため、
              // 取り込んだ直後に取り消しを押すと盤面が空になっていた
              historyStack: [...store.historyStack, [...archers]],
              redoStack: [],
            }); // 読み取った○×は「いま入れたもの」として扱う。
          // 印を付けないと初めから閉じてしまい、直すのが全部長押しになる。
          // 盤面より先に印を付ける。逆にすると印の無い盤面が一度描かれ、
          // 読み取った○×が一瞬すべて灰色に光ってから戻る
          // 後ろに足すときは、いまの並びの後ろへ繋ぐ。区切りは入れない
          //（区切るかどうかは、写真の中に板が2つ在るときだけ窓の側で決める）
          // 射数を合わせたあとの並びを店から取り直す（k は合わせる前の写し）
          const いまの並び = useScoreStore.getState().archers;
          const 入れる並び =
            '後ろに足す' === 入れ方
              ? [...(Array.isArray(いまの並び) ? いまの並び : []), ...newArchers]
              : newArchers;
          useScoreStore.getState().入れた印をまとめて付ける(newArchers);
          useScoreStore.setState({ archers: 入れる並び });
          // 紙の記録は氏名と○×を、立ち順表は並びだけを読む。
          // どちらも同じ処理を通るので、文言は種類で分ける
          知らせる(
            'record' === 読み取りの種類 ? '画像から記録を読み取りました' : '画像から立ち順を登録しました'
          );
          ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success);
        }}
      />
      <ArrowLocationPopover
        visible={!!activeArrowLocationEdit}
        onClose={() => setActiveArrowLocationEdit(null)}
        archerId={activeArrowLocationEdit?.archerId}
        shotIndex={activeArrowLocationEdit?.shotIndex}
        currentMark={activeArrowLocationEdit?.currentMark}
        arrowLocations={activeArrowLocationEdit?.arrowLocations} // 矢所を押しただけでは閉じない。置いた場所を見て、ずれていれば
        // 置き直せるようにするため。閉じるのは「完了」を押したとき
        onSave={() => {}}
      />
      {/* 区切りにチーム名を付ける窓。リーグで大学名を出すため。 */
      /* 区切りより左（並びでは後ろ）がそのチームになるので、 */
      /* 1回入れれば複数人に付く */}
      <Modal
        visible={!!チーム名を付ける区切り}
        transparent
        animationType="fade"
        onRequestClose={() => setチーム名を付ける区切り(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setチーム名を付ける区切り(null)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>チーム名</Text>
            <Text style={styles.modalMessage}>
              {/* 記録表は右から左へ並ぶ（row-reverse）。並びで「後ろ」の */
              /* 射手は、画面では区切りの左に出る。「右」と書いていたころは */
              /* 案内と逆の側に色が付いて見えた */}
              この区切りより左の射手が、そのチームになります。大学名などを入れてください。空にすると、ただの間隔に戻ります。
            </Text>
            <TextInput
              style={styles.チーム名の入力}
              value={チーム名の下書き}
              onChangeText={setチーム名の下書き}
              placeholder="例: ◯◯大学"
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                区切りにチーム名を付ける(チーム名を付ける区切り, チーム名の下書き);
                setチーム名を付ける区切り(null);
              }}
            />
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && IS_WEB && { backgroundColor: '#E5E5EA' },
                ]}
                onPress={() => setチーム名を付ける区切り(null)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                  hovered && IS_WEB && { opacity: 0.9 },
                ]}
                onPress={() => {
                  区切りにチーム名を付ける(チーム名を付ける区切り, チーム名の下書き);
                  setチーム名を付ける区切り(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>決定</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Et要素>
  );
};
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF', paddingTop: IS_WEB ? WEB_TOP_PADDING : SAFE_TOP_PADDING },
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
    getShadowStyle({
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
  shotsToggle: {
    paddingHorizontal: 2,
    paddingVertical: 4,
    zIndex: 10001,
    minWidth: 34,
    alignItems: 'center',
  },
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
  溝の済み: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: '#007AFF' },
  つまみ: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    ...(IS_WEB ? { boxShadow: '0 1px 4px rgba(0,0,0,0.3)' } : { elevation: 3 }),
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
    height: UIConfig.footerHeight,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#C6C6C8',
  },
  footerLabelCell: {
    width: UIConfig.headerWidth,
    height: UIConfig.footerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  footerLabelText: { fontSize: 10, fontWeight: 'bold', color: '#3C3C43' },
  footerNameCell: {
    height: UIConfig.footerHeight,
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
  emptyOverlay: Object.assign({}, StyleSheet.absoluteFillObject, {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  }),
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#8E8E93' },
  // 帯を畳む取っ手の置き場。畳んでいても押せるように浮かせる。
  // 左右どちらに置くか（left / right）は描くときに足す
  帯の取っ手の置き場: {
    position: 'absolute',
    top: 8,
    // 引き始めで字の選択が始まらないように
    userSelect: 'none',
    // 表より上、他の画面より下。記録画面は他のタブへ移っても裏で生きているので、
    // 1e4 のように高くすると履歴のごみ箱など別の画面のボタンの上に乗る
    zIndex: 5,
  },
  帯の取っ手: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(242,242,247,0.95)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    height: IS_WEB ? 70 : 80,
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#C6C6C8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  // はみ出しても隣を覆わないように、この箱の中で切る（念のための二重の備え）
  addBtns: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    overflow: 'hidden',
  },
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.RecordScreen = RecordScreen;
