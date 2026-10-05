'use strict';

// 店の外側の部品（書き換える値の入れ物 場・ライブ・同期・不具合の便り・端末への控えの手助け）は
// storeShared.js にある（2026-10-05 に分けた）
const {
  場, ひ, 秘, 共, 端, 消去, 控えの書き出し, 控えの置き場, 行動を控える, ライブの枝, 団体の枝, 道しるべの場所, 移ったら付いていく, 写しの場所, 道しるべたちを拾う,
  行動の控えを捨てる, 溜まりを流し直す, 入り直せば直るか, 入り直しの案内, 不具合を控える, zustand, FirebaseAuth, Firestore, RTDB, Alert,
  IS_WEB, generateUUID, middleware, netinfo, Firebaseの器, waitForDb, 同期規則, 名前の整合,
  generateUniquePersonalId, mergeById, 届いた射手に合わせる, 差分を当てる, 射数差を当てる, 盤面を射数にそろえる, 項目差分を当てる,
  restampChangedArchers, dropUndefinedDeep, trashedAtMillis, normalizeTag, cleanUpTagsArray,
  参加できるライブ, cleanUpSessions, 記録の射手を整える, 記録の日時を数に, 外した記録のid, 雲から読んだか, idで記録を取る, 読んだままの中身, 載っている印を捨てる,
  載っている盤面を控える, ライブへ盤面を送る, 印は盤面を正に, ライブへ1射を送る, ライブの盤面を読み取る, 在席の場所, 写しを見るのをやめる, 在席を終える, 在席を始める,
  共有履歴の場所, つなげなくなった, 弾かれたか, 期限を控える, 期限で閉じるか, 期限の場所, いまの見当, サーバー時刻, 共有履歴へ積む, 共有履歴の目印を受け取る, 履歴の一手,
  控えの射数,
} = require('./storeShared');
// 操作の固まりは別のファイル（2026-10-05 に分けた）
const { 盤面の操作 } = require('./storeBoard');
const { 部員の操作 } = require('./storeMembers');
const { 記録の操作 } = require('./storeSessions');
const { 同期の操作 } = require('./storeSync');
const { ライブの操作 } = require('./storeLive');
Object.defineProperty(exports, '__esModule', { value: true });
// 端末への控えを待たずに書く／待ちを変える（検査と、閉じる前に確実に書きたいとき用）
exports.控えを今すぐ書く = () => 控えの書き出し.今すぐ();
exports.控えの待ちを変える = (ms) => {
  控えの書き出し.遅らせ = ms;
};
Object.defineProperty(exports, 'useScoreStore', {
  enumerable: true,
  get: function () {
    return useScoreStore;
  },
});
// ライブ名の検査。画面から使う
Object.defineProperty(exports, 'ライブ名に使えない字', {
  enumerable: true,
  get: function () {
    return 同期規則.ライブ名に使えない字;
  },
});
const useScoreStore = zustand.create()(
  middleware.persist(
    (そのまま書く, 状態) => {
      const 書く = (変更) => {
        let 中身 = 'function' == typeof 変更 ? 変更(状態()) : 変更;
        // 同期できたなら、入り直しの案内は下ろす。書き換えは幾つもあるので、
        // 1つずつ消して回らずにここで拾う
        中身 && '同期済み' === 中身.syncStatus && (中身.再ログインの案内 = null);
        中身 &&
          (中身.sessions && (中身.sessions = cleanUpSessions(中身.sessions)),
          中身.trash && (中身.trash = cleanUpSessions(中身.trash)));
        if (
          中身 &&
          Array.isArray(中身.historyStack) &&
          !場.履歴を積まない &&
          中身.historyStack.length > (状態().historyStack || []).length &&
          状態().isLiveActive &&
          状態().liveSessionName
        )
          共有履歴へ積む(
            中身.historyStack[中身.historyStack.length - 1],
            中身.archers || 状態().archers,
            状態
          );
        そのまま書く(中身);
      };
      return {
        // 矢所の記録は既定でオフ。要る団体だけが設定で入れる
        enableArrowLocation: false,
        // 矢所の入れ方（設定）。的で＝矢所の画面の的で○×も一緒に（既定）／○×のあと＝○×の 0.5 秒後に的の窓／
        // まとめて＝あとで人ごとに 4 本ずつ。2026-10-05 の聞き取りで決めた（src/yadokoroRules.js）
        矢所の入れ方: '的で',
        // 開いている矢所の窓（{ 射手ID, 射番 }）。○×のあと・マスの長押しで開く。端末に残さない
        矢所の窓: null,
        // 誤タップ防止。入れたますを少し経ってから閉じる。
        // 同期する中身ではなく、画面の上の守りなので archers には持たせない。
        // 既定はオフ（2026-09-13、使う人の指示。以前はオンだった。端末に残っている
        // 設定はそのまま。入れ直したい人は設定で切り替える）
        自動ロックする: false,
        // 「終了・保存」を押したときに出欠確認を出すか。
        // 切ると、出欠の窓を飛ばして保存の窓へ進む。記録に出ている人は
        // 出欠画面でそのまま出席として数えられるので、毎回聞かれたくない
        // 団体はここで切れる（遅刻・早退の区別だけ付かなくなる）
        保存時に出欠を確認する: true,
        // 記録表の並べ方。切り替えると、名前が左・○×が右へ伸びる横の表になる。
        // 端末ごとの好みなので残す（同じ団体でも人によって持ち方が違う）
        横に並べる: false,
        // 記録画面の上下の帯を畳んでいるか。並べ方と同じく端末ごとの好みなので残す
        帯を畳む: false,
        // 帯を畳む取っ手を左上に置いているか（既定は右上）。指で引いて動かせる。
        // 右利きは右、左利きは左が押しやすいので、端末ごとの好みとして残す
        帯の取っ手は左: false,
        // ライブに「見るだけ」で入っているか。入れているときは盤面を書き換えない。
        // 端末には残さない（次に参加するときは、そのつど選ぶ）
        ライブは見るだけ: false,
        自動ロックまでの秒: 3,
        // { 'archerId:射番': 入れた時刻 }。時間が経ったものを閉じたとみなす
        入れた時刻: {},
        // 長押しでますを開けた時刻。記録画面がこれを見て短く知らせる。
        // 端末に残す値ではないので、保存の対象には入れない
        鍵を開けた時刻: 0,
        // 閉じたますを押した時刻。開け方が分からないまま何度も押す人が
        // いるので、押されたら記録画面が「長押しで開きます」と知らせる
        閉じたますを押した時刻: 0,
        // 閲覧用のときにますを押した時刻。こちらは「閲覧用で参加しています」
        閲覧でますを押した時刻: 0,
        // 規約とプライバシーポリシーの同意を取り直す必要があるか。
        // 起動のたびにクラウドの記録から数え直すので、端末には残さない
        同意の確認が要る: false,
        arrowTargetType: 'kasumi36',
        activeGroupId: null,
        activeGroupName: null,
        publicGroupId: null,
        activeRole: null,
        myMemberId: null,
        myMemberName: null,
        activeUserEmail: null,
        memberAuthVersion: 0,
        archers: [],
        members: [],
        alumni: [],
        history: [],
        sessions: [],
        trash: [],
        shotsPerRound: 8,
        activeSessionID: null,
        historyStack: [],
        redoStack: [],
        // 履歴の記録を記録画面で直しているあいだの目印。{ id, 控え }。
        // 控え は直す前の盤面（archers など）で、終えるときに据え直す
        履歴の編集: null,
        viewScale: 1,
        syncStatus: '未同期',
        lastSyncTime: null,
        // 差分の同期の境目（サーバーの時刻）。{ 団体, 記録, 部員, ごみ箱, 卒業生 }。
        // 決め方は syncRules の 境目を進める。lastSyncTime（端末の時刻・画面の表示用）とは別
        雲の境目: null,
        // 最後に全件をそろえた時刻（端末の時刻）。7 日たったら起動のときに全件を取り直す
        全部そろえた時刻: 0,
        // 端末の控えに入りきらず、控えから外した記録の id（src/localTrim.js）。
        // 控えを書くときに決める（partialize）。起動したら、差分の同期と一緒に id で取り直し、
        // 雲から取り直せたら空にする（取り直せるまでは控えにも残る）
        端末から外した記録: [],
        offlineSaveWarning: null,
        // 入り直しが要るときの案内。permission-denied を拾ったときだけ立てる
        再ログインの案内: null,
        // 完全に消した記録の控え（id → 消した時刻）。ゴミ箱から完全に削除した
        // けれど、その削除がまだクラウドへ届いていないものを覚えておく。
        // これが無いと、通信できないときに「削除 → ゴミ箱を空にする」と操作し、
        // 送信待ちが失われた場合に、消したはずの記録が次の取得で戻ってくる。
        // クラウドから消えたことを確認できたら控えも消す。
        permanentlyDeleted: {},
        // 消したメンバーのうち、まだクラウドへ届いていないものの控え。
        // 名簿の受け取りは「クラウドに在って手元に無いものは足す」ので、
        // これが無いと、送信が失われたときに消したメンバーが復活する。
        // 記録側の permanentlyDeleted と同じ考え方。
        deletedMembers: {},
        isNetworkOnline: true,
        isAdminMode: false,
        autoPromotionEnabled: true,
        _pendingUpdateTimers: {},
        includeInStats: true,
        lastLocalChange: 0,
        lastResetHandled: 0,
        // 入って最初の1通かどうか。最初の1通に載っている片付けは
        // 「入る前に起きたこと」なので知らせない（共有履歴の知らせと同じ考え方）
        resetIsFirstSnapshot: false,
        lastPushedTimestamp: 0,
        // ライブ中の共有履歴の目印。len は「いま何手ぶん適用しているか」、
        // max は「やり直せる上限」。どちらも state 経由で全員に配られる
        historySharedLen: 0,
        historySharedMax: 0,
        historyIsFirstSnapshot: false,
        // 取り消し・やり直しの通知を出したかどうかの控え
        historyHandledAt: 0,
        // 画面へ知らせるための材料（誰かが取り消した／やり直した）
        historyNoticeAt: 0,
        historyNoticeKind: null,
        showTrash: false,
        sessionUnsubscribe: null,
        trashUnsubscribe: null,
        memberUnsubscribe: null,
        alumniUnsubscribe: null,
        configUnsubscribe: null,
        showAlumniInAnalysis: false,
        showAlumniInPicker: false,
        currentFreshmanTerm: 1,
        historyViewMode: 'list',
        selectedHistorySessionId: null,
        isAdminModePending: false,
        isLiveActive: false,
        ライブの続き: null,
        isHost: false,
        liveSessionName: null,
        // 帯にカウントダウンを出すために持つ。盤面に載ってくる期限の控え。
        // 期限が無いライブでは null（「期限なし」と「まだ来ていない」は
        // どちらも null でよい。帯は期限があるときしか出さないため）
        いまのライブの期限: null,
        isIncomingLiveSync: false,
        liveSessionsList: [],
        analysisSelectedTags: [],
        analysisTagLogic: 'AND',
        historySelectedTags: [],
        historyTagLogic: 'AND',
        currentSessionTags: [],
        tagTemplates: ['#立', '#練習試合', '#大会', '#自主練習', '#合宿'],
        initializationLogs: [],
        syncIntervalId: null,
        lastPromotionYear: null,
        // 比較のひな型。端末に持つだけで、クラウドへは送らない。
        // 誰と誰を並べて見るかは、見る人の手元の都合で、団体で揃えるものではない
        比較のひな型: [],
        // ライブを置く枝の合言葉。{ 団体, 合言葉 } の形で持つ。
        // 団体まで一緒に持たないと、移った先で前の団体の枝を使ってしまう
        ライブの合言葉: null,
        // ライブにつないでいる台数。端末には残さない（開き直せば数え直す）
        ライブの接続台数: 0,
        // 共有のライブに入っているときの、そのライブ専用の枝。
        // 入っていなければ null で、そのときは団体の枝を使う
        いまのライブの枝: null,
        // 共有のライブの閲覧用の写しを置く枝。編集する側だけが持つ
        いまのライブの閲覧枝: null,
        // 閲覧用のリンクで入っているか。写しを読むだけで、何も書かない
        写しを見ているか: false,
        // 共有リンクだけで来ている人か（団体に入っていない）。
        // 端末には残さない。閉じたら終わり、リンクを開き直せばまた入れる
        共有の来客: false,
        // いま入っているのが、よその団体のライブか。
        // 共有リンクで入ったときに決める。自分の団体のライブなら偽
        よその団体のライブ: false,
        // 共有のライブの道しるべ。{ ライブ名: { 共有の枝, 閲覧の枝 } }。
        // 参加一覧を読むたびに作り直すので、端末には残さない
        共有のライブたち: {},
        _pendingMemberTimers: {},
        isHydrated: false,
        analysisRankingSettings: {
          '月ごと': { type: 'ratio', value: 0 },
          '期間指定': { type: 'ratio', value: 0 },
          '直近30日': { type: 'ratio', value: 0 },
          '今年度': { type: 'ratio', value: 0 },
          'すべて': { type: 'ratio', value: 0 },
        },
        focusedMemberId: null,
        currentRouteName: null,
        updateLoadingLog: (文) => {
          const 今まで = 状態().initializationLogs || [];
          書く({ initializationLogs: [...今まで, 文] });
          console.log('[Store] Loading:', 文);
        },
        setCurrentRouteName: (名前) => 書く({ currentRouteName: 名前 }),
        setMemberAuthVersion: (版) => 書く({ memberAuthVersion: 版 }),
        setFocusedMemberId: (id) => 書く({ focusedMemberId: id }),
        setAuth: (団体ID, 役割, 部員ID, メール = null, 公開の団体ID = null, 団体名 = null, 部員名 = null) => {
          null === 団体ID
            ? // 出たら行動の控えも捨てる。次に入った人の不具合の便りに、
              // 前の人が何をしていたかが付いていくのは筋が悪い
              (行動の控えを捨てる(),
              (場.合言葉の取り寄せ = null),
              書く({
                // ライブの合言葉も捨てる。団体を見て弾いてはいるが、
                // 出た人の端末に団体の秘密を残す理由が無い
                ライブの合言葉: null,
                activeGroupId: null,
                activeGroupName: null,
                publicGroupId: null,
                activeRole: null,
                myMemberId: null,
                myMemberName: null,
                activeUserEmail: null,
                sessions: [],
                members: [],
                history: [],
                alumni: [],
                trash: [],
                archers: [],
                activeSessionID: null,
                雲の境目: null,
                全部そろえた時刻: 0,
                端末から外した記録: [],
                // 履歴の記録を直している途中の控えも、団体を離れるときに捨てる
                履歴の編集: null,
                analysisSelectedTags: [],
                historySelectedTags: [],
                historyTagLogic: 'AND',
                tagTemplates: ['立', '練習試合', '大会', '自主練習', '合宿'],
                initializationLogs: [],
                isAdminMode: false,
                isAdminModePending: false,
              }),
              状態().stopPeriodicSync(),
              状態().stopListeningToSessions(),
              状態().stopListeningToMembers(),
              状態().stopListeningToAlumni(),
              状態().stopListeningToTrash(),
              状態().configUnsubscribe && (状態().configUnsubscribe(), 書く({ configUnsubscribe: null })))
            : (団体ID !== 状態().activeGroupId &&
                // 別の団体へ入るときは、前の団体の控えと境目を持ち越さない
                //（招待リンクで入り直すときなど、出ずに入ることがある）
                書く({
                  sessions: [],
                  members: [],
                  alumni: [],
                  trash: [],
                  雲の境目: null,
                  全部そろえた時刻: 0,
                  端末から外した記録: [],
                }),
              書く({
                activeGroupId: 団体ID,
                activeGroupName: 団体名 || 状態().activeGroupName,
                activeRole: 役割,
                myMemberId: 部員ID,
                myMemberName: 部員名 || 状態().myMemberName,
                activeUserEmail: メール,
                publicGroupId: 公開の団体ID || ('group' === 役割 ? 団体ID : 状態().publicGroupId),
                isAdminMode: false,
                isAdminModePending: false,
              }),
              状態().listenToConfig(),
              状態().listenToSessions(),
              状態().listenToMembers(),
              状態().listenToAlumni(),
              状態().listenToTrash());
        },
        setAnalysisSelectedTags: (タグたち) => 書く({ analysisSelectedTags: タグたち }),
        toggleAnalysisTag: (タグ) => {
          const 今の = 状態().analysisSelectedTags || [];
          if (今の.includes(タグ)) 書く({ analysisSelectedTags: 今の.filter((タグ1つ) => タグ1つ !== タグ) });
          else 書く({ analysisSelectedTags: [...今の, タグ] });
        },
        setAnalysisTagLogic: (論理) => 書く({ analysisTagLogic: 論理 }),
        比較のひな型を足す: (名前, 部員idたち) =>
          書く({
            比較のひな型: ひ.ひな型を足す(状態().比較のひな型, {
              名前,
              部員idたち,
              団体id: 状態().activeGroupId || '',
            }),
          }),
        比較のひな型を消す: (id) => 書く({ 比較のひな型: ひ.ひな型を消す(状態().比較のひな型, id) }),
        setAnalysisRankingSetting: async (鍵, 値) => {
          const 今 = Date.now();
          const 今の設定 = 状態().analysisRankingSettings || {};
          const 新しい設定 = Object.assign({}, 今の設定, { [鍵]: 値 });
          書く({ analysisRankingSettings: 新しい設定, lastLocalChange: 今 });
          const { activeGroupId, isNetworkOnline } = 状態();
          if (isNetworkOnline && activeGroupId)
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                { analysisRankingSettings: 新しい設定, lastModified: Firestore.serverTimestamp() },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] setAnalysisRankingSetting sync error:', 誤り);
            }
        },
        setHistorySelectedTags: (タグたち) => 書く({ historySelectedTags: タグたち }),
        toggleHistoryTag: (タグ) => {
          const 今の = 状態().historySelectedTags || [];
          if (今の.includes(タグ)) 書く({ historySelectedTags: 今の.filter((タグ1つ) => タグ1つ !== タグ) });
          else 書く({ historySelectedTags: [...今の, タグ] });
        },
        setHistoryTagLogic: (論理) => 書く({ historyTagLogic: 論理 }),
        setCurrentSessionTags: (タグたち) => 書く({ currentSessionTags: タグたち }),
        toggleCurrentSessionTag: (タグ) => {
          const 今の = 状態().currentSessionTags || [];
          if (今の.includes(タグ)) 書く({ currentSessionTags: 今の.filter((タグ1つ) => タグ1つ !== タグ) });
          else 書く({ currentSessionTags: [...今の, タグ] });
        },
        setTagTemplates: async (タグたち) => {
          const 今 = Date.now();
          const 整えた = Array.from(new Set((タグたち || []).map(normalizeTag).filter(Boolean)));
          書く({ tagTemplates: 整えた, lastLocalChange: 今 });
          const { activeGroupId, isNetworkOnline } = 状態();
          if (isNetworkOnline && activeGroupId)
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                {
                  tagTemplates: 整えた,
                  currentFreshmanTerm: 状態().currentFreshmanTerm,
                  lastModified: Firestore.serverTimestamp(),
                },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] setTagTemplates sync error:', 誤り);
            }
        },
        addTagTemplate: async (タグ) => {
          const 今の = 状態().tagTemplates || [];
          const 整えた = normalizeTag(タグ);
          if (整えた && !今の.includes(整えた)) {
            const 今 = Date.now();
            const 新しい一覧 = [...今の, 整えた];
            書く({ tagTemplates: 新しい一覧, lastLocalChange: 今 });
            const { activeGroupId, isNetworkOnline } = 状態();
            if (isNetworkOnline && activeGroupId)
              try {
                await Firestore.setDoc(
                  Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                  {
                    tagTemplates: 新しい一覧,
                    currentFreshmanTerm: 状態().currentFreshmanTerm,
                    lastModified: Firestore.serverTimestamp(),
                  },
                  { merge: true }
                );
              } catch (誤り) {
                console.error('[Store] addTagTemplate sync error:', 誤り);
              }
          }
        },
        removeTagTemplate: async (タグ) => {
          const 今 = Date.now();
          const 新しい一覧 = (状態().tagTemplates || []).filter((タグ1つ) => タグ1つ !== タグ);
          書く({ tagTemplates: 新しい一覧, lastLocalChange: 今 });
          const { activeGroupId, isNetworkOnline } = 状態();
          if (isNetworkOnline && activeGroupId)
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                {
                  tagTemplates: 新しい一覧,
                  currentFreshmanTerm: 状態().currentFreshmanTerm,
                  lastModified: Firestore.serverTimestamp(),
                },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] removeTagTemplate sync error:', 誤り);
            }
        },
        setShowAlumniInAnalysis: (値) => 書く({ showAlumniInAnalysis: 値 }),
        setShowAlumniInPicker: (値) => 書く({ showAlumniInPicker: 値 }),
        setIncludeInStats: (値) => 書く({ includeInStats: 値 }),
        ...盤面の操作(書く, 状態, そのまま書く),
        ...ライブの操作(書く, 状態, そのまま書く),
        ...部員の操作(書く, 状態, そのまま書く),
        ...記録の操作(書く, 状態, そのまま書く),
        // 同意の記録を確かめる。起動のたびに1回だけ呼ぶ。
        // ・記録が無い団体（同意の画面を入れる前から使っている）
        //     運営者が口頭で同意を得ているので、記録だけを静かに補う
        // ・記録はあるが版が古い（文書を改定した）
        //     取り直しが要るので、画面に出すための印を立てる
        // 部員の端末からは団体の帳面を書き換えられないので、何もしない
        /**
         * ライブを置く枝の合言葉を用意する。
         *
         * groups/{団体} に置く。そこは所属を確かめてからでないと読めないので
         * （firestore.rules の canAccess）、正しい部員だけが知る。
         * 無ければ作って書くが、2台が同時に作ると後勝ちで食い違う。
         * 書いたあとに必ず読み直して、実際に載っているほうを採る。
         */
        ライブの合言葉を用意する: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!Firebaseの器.db || !団体) return null;
          const 控え = 状態().ライブの合言葉;
          if (控え && 控え.団体 === 団体 && 秘.枝として使えるか(控え.合言葉)) return 控え.合言葉;
          // 取り寄せは1本にまとめる。3か所から呼ぶので、
          // まとめないと同じ団体に別々の合言葉を書き合ってしまう。
          // まとめてよいのは同じ団体のときだけ。団体を移った直後に前の団体ぶんを
          // 使い回すと、移った先の練習を前の団体の枝へ流してしまう
          if (場.合言葉の取り寄せ && 場.合言葉の取り寄せ.団体 === 団体) return 場.合言葉の取り寄せ.約束;
          const 場所 = Firestore.doc(Firebaseの器.db, `groups/${団体}`);
          const 一度 = async () => {
            const 今 = await Firestore.getDoc(場所);
            const 有 = (今.data() || {}).liveSecret;
            if (秘.枝として使えるか(有)) return 有;
            await Firestore.setDoc(場所, { liveSecret: 秘.合言葉を作る() }, { merge: true });
            // 読み直す。同時に作られていたら、相手のほうが載っている
            const 後 = await Firestore.getDoc(場所);
            const 決 = (後.data() || {}).liveSecret;
            return 秘.枝として使えるか(決) ? 決 : null;
          };
          const 約束 = (async () => {
            // 起動の直後は Firestore がまだ繋がっておらず、読みが
            // 「client is offline」で失敗する。一度で諦めると、その画面を
            // 開いているあいだライブがまったく使えなくなるので、待って試し直す
            let 待ち = 500;
            for (let 回 = 0; 回 < 6; 回++) {
              try {
                const 決 = await 一度();
                if (決) {
                  // 待っているあいだに団体を移っていたら、この合言葉は返さない。
                  // 返すと、移った先の練習を前の団体の枝へ流してしまう
                  if (状態().activeGroupId !== 団体) return null;
                  書く({ ライブの合言葉: { 団体, 合言葉: 決 } });
                  return 決;
                }
              } catch (誤り) {
                console.warn('[Store] ライブの合言葉を用意できませんでした', 誤り);
              }
              if (状態().activeGroupId !== 団体) return null; // 団体が変わったら追わない
              await new Promise((解く) => setTimeout(解く, 待ち));
              待ち = Math.min(待ち * 2, 8000);
            }
            return null;
          })();
          場.合言葉の取り寄せ = { 団体, 約束 };
          // 片付けるのは自分が置いたものだけ。団体を移って別の取り寄せが
          // 始まっていたら、そちらを消してしまわない
          約束.finally(() => {
            if (場.合言葉の取り寄せ && 場.合言葉の取り寄せ.約束 === 約束) 場.合言葉の取り寄せ = null;
          });
          return 約束;
        },
        同意を確かめる: async () => {
          const { activeGroupId: 団体, activeRole: 役, publicGroupId: 公開ID } = 状態();
          if ('group' !== 役) return;
          const id = (公開ID || 団体 || '').toUpperCase();
          if (!id) return;
          try {
            // 帳面そのものが無い団体には、何も作らない。
            // 作ると、存在しない団体の同意記録が生まれる
            const 帳面 = await Firestore.getDoc(Firestore.doc(Firebaseの器.db, 'group_accounts', id));
            if (!帳面.exists()) return;
            // 同意の記録は private に置く。誰でも読める場所に置くと、
            // 団体IDを知る者に「いつ・どうやって同意を得たか」まで見える
            const 場所 = Firestore.doc(Firebaseの器.db, 'group_accounts', id, 'private', 'consent');
            const 中身 = await Firestore.getDoc(場所);
            const 法 = require('./legalDocs');
            // 記録が無いのが、画面を入れる前からの団体。静かに補う
            const 版 = 中身.exists() ? (中身.data() || {}).同意の版 : undefined;
            if (!版) {
              await Firestore.setDoc(場所, 法.口頭での同意の記録(), { merge: true });
              return;
            }
            // 口頭で同意を得ている移りは、画面で求め直さず記録だけ進める。
            // どの移りが済んでいるかは legalDocs.js の 口頭で済んでいる移り に書く
            if (法.口頭で済んでいるか(版)) {
              await Firestore.setDoc(
                場所,
                法.口頭での同意の記録(`口頭（${法.同意の版} 版の内容を説明のうえ同意。前の記録は ${版}）`),
                { merge: true }
              );
              return;
            }
            if (法.同意を取り直すか(版)) 書く({ 同意の確認が要る: true });
          } catch (誤り) {
            // 確かめられなくても、使えなくする話ではない。次に入ったときにまた試す
            console.warn('[Store] 同意の確認に失敗:', 誤り);
          }
        },
        // 同意してもらえた。記録して印を下ろす
        同意を記録する: async () => {
          const { activeGroupId: 団体, activeRole: 役, publicGroupId: 公開ID } = 状態();
          書く({ 同意の確認が要る: false });
          if ('group' !== 役) return;
          const id = (公開ID || 団体 || '').toUpperCase();
          if (!id) return;
          try {
            const 場所 = Firestore.doc(Firebaseの器.db, 'group_accounts', id, 'private', 'consent');
            await Firestore.setDoc(場所, require('./legalDocs').同意の記録(), { merge: true });
          } catch (誤り) {
            // 書けなかったときは印を立て直す。次の起動でまた聞く
            console.warn('[Store] 同意の記録に失敗:', 誤り);
            書く({ 同意の確認が要る: true });
          }
        },
        // あとにする。記録は残さないので、次の起動でまた出る
        同意をあとにする: () => 書く({ 同意の確認が要る: false }),
        verifyGroupPassword: async (合言葉) => {
          const { activeUserEmail, activeGroupId, publicGroupId } = 状態();
          let 宛先 = activeUserEmail || Firebaseの器.auth.currentUser?.email;
          if (!宛先 && (activeGroupId || publicGroupId)) {
            console.log('[Store] Fetching group email for password verification...');
            const 団体ID = publicGroupId || activeGroupId;
            try {
              const 帳面の場所 = Firestore.doc(Firebaseの器.db, 'group_accounts', 団体ID.toUpperCase());
              const 帳面 = await Firestore.getDoc(帳面の場所);
              帳面.exists() && (宛先 = 帳面.data().email);
            } catch (誤り) {
              console.error('[Store] Failed to fetch group email:', 誤り);
            }
          }
          if (!宛先) return (console.warn('[Store] verifyGroupPassword: No email found to verify.'), false);
          try {
            return (await FirebaseAuth.signInWithEmailAndPassword(Firebaseの器.auth, 宛先, 合言葉), true);
          } catch (誤り) {
            return (console.error('[Store] verifyGroupPassword error:', 誤り), false);
          }
        },
        setAdminMode: (値) => 書く({ isAdminMode: 値, isAdminModePending: false }),
        /**
         * 団体アカウントを消す（設定 → アカウント → アカウントを削除する）。
         * 団体アカウントで入っていて、管理者モードで、ライブ中でないときだけ。
         * 中身は src/accountDeletion.js。返り値は { ok, 訳 }。ok なら呼ぶ側で
         * setAuth(null) して入口へ戻す
         */
        deleteGroupAccount: async (合言葉, 進み) => {
          const {
            activeGroupId: 団体ID,
            activeRole: 役,
            isAdminMode: 管理者,
            isLiveActive: ライブ中,
            activeUserEmail: 控えの宛先,
          } = 状態();
          if ('group' !== 役 || !団体ID)
            return { ok: false, 訳: '団体アカウントで入っているときだけ消せます' };
          if (!管理者) return { ok: false, 訳: '管理者モードをオンにしてください' };
          if (ライブ中) return { ok: false, 訳: 'ライブ記録中は消せません。先にライブを止めてください' };
          if (!合言葉) return { ok: false, 訳: 'パスワードを入れてください' };
          let 宛先 = 控えの宛先 || Firebaseの器.auth.currentUser?.email;
          if (!宛先) {
            try {
              const 帳面 = await Firestore.getDoc(Firestore.doc(Firebaseの器.db, 'group_accounts', 団体ID));
              帳面.exists() && (宛先 = 帳面.data().email);
            } catch (誤り) {
              console.error('[Store] deleteGroupAccount: email lookup failed', 誤り);
            }
          }
          if (!宛先) return { ok: false, 訳: 'メールアドレスが分かりません' };
          try {
            状態().stopPeriodicSync();
            状態().stopListeningToSessions();
            状態().stopListeningToMembers();
            状態().stopListeningToAlumni();
            状態().stopListeningToTrash();
            const 結果 = await 消去.団体を消す(
              { db: Firebaseの器.db, a: Firestore, auth: Firebaseの器.auth, o: FirebaseAuth },
              { 団体ID, email: 宛先, 合言葉, 進み }
            );
            return { ok: true, 件数: 結果.件数 };
          } catch (誤り) {
            console.error('[Store] deleteGroupAccount failed:', 誤り);
            const 符号 = String((誤り && 誤り.code) || '');
            const 訳 = /wrong-password|invalid-credential|invalid-login/.test(符号)
              ? 'パスワードが正しくありません'
              : /permission-denied/.test(符号)
                ? '削除の権限がありません（決まりが古いままかもしれません）'
                : /network/.test(符号)
                  ? '通信エラーが発生しました。電波の良い場所でもう一度お試しください'
                  : '削除に失敗しました: ' + String((誤り && 誤り.message) || 誤り);
            return { ok: false, 訳 };
          }
        },
        updateGroupName: async (名前) => {
          const { activeGroupId } = 状態();
          if (activeGroupId) {
            書く({ activeGroupName: 名前 });
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, 'groups', activeGroupId),
                { groupName: 名前 },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] updateGroupName error:', 誤り);
            }
          }
        },
        setAutoPromotionEnabled: async (入れる) => {
          const { activeGroupId } = 状態();
          if (activeGroupId) {
            書く({ autoPromotionEnabled: 入れる });
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                { autoPromotionEnabled: 入れる },
                { merge: true }
              );
            } catch (誤り) {
              console.error('[Store] setAutoPromotionEnabled error:', 誤り);
            }
          }
        },
        setIsAdminModePending: (値) => 書く({ isAdminModePending: 値 }),
        setHistoryViewMode: (値) => 書く({ historyViewMode: 値 }),
        setSelectedHistorySessionId: (値) => 書く({ selectedHistorySessionId: 値 }),
        setViewScale: (値) => 書く({ viewScale: Math.max(0.5, Math.min(2, 値)) }),
        setIsLiveActive: (入れる) => {
          if ((書く({ isLiveActive: 入れる }), 入れる)) {
            const 記録ID = 状態().activeSessionID || 'live-current';
            const 名前 = 状態().liveSessionName || 記録ID;
            const 射手たち = 状態().archers || [];
            const 枝 = ライブの枝();
            if (Firebaseの器.rtdb && 枝)
              RTDB.set(
                RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${名前}/state`),
                JSON.parse(
                  JSON.stringify({
                    archers: Array.isArray(射手たち) ? 射手たち : [],
                    shotsPerRound: 状態().shotsPerRound,
                    timestamp: Date.now(),
                  })
                )
              ).catch((誤り) => console.error('Live Sync Error:', 誤り));
          }
        },
        checkAndAutoIncrementGrades: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!団体) return;
          const 今日 = new Date();
          const 年 = 今日.getFullYear();
          const 月 = 今日.getMonth() + 1;
          const 日 = 今日.getDate();
          const 四月を過ぎた = 月 > 4 || (4 === 月 && 日 >= 1);
          let hasPromotionRecord = false;
          try {
            console.log('[AutoPromotion] Fetching latest app_settings...');
            const 設定の帳面 = await Firestore.getDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings')
            );
            if (設定の帳面.exists()) {
              const 設定 = 設定の帳面.data();
              const 取り込む = {};
              'number' == typeof 設定.currentFreshmanTerm &&
                (取り込む.currentFreshmanTerm = 設定.currentFreshmanTerm);
              Array.isArray(設定.tagTemplates) && (取り込む.tagTemplates = 設定.tagTemplates);
              'number' == typeof 設定.lastPromotionYear &&
                ((hasPromotionRecord = true), (取り込む.lastPromotionYear = 設定.lastPromotionYear));
              'boolean' == typeof 設定.autoPromotionEnabled &&
                (取り込む.autoPromotionEnabled = 設定.autoPromotionEnabled);
              書く(取り込む);
            }
          } catch (誤り) {
            return void console.error('[AutoPromotion] Failed to fetch config:', 誤り);
          }
          if (!hasPromotionRecord) {
            const base = 四月を過ぎた ? 年 : 年 - 1;
            console.log(`[AutoPromotion] No record yet. Storing baseline year ${base} without promoting.`);
            書く({ lastPromotionYear: base });
            // 送信の完了は待たない。この関数は syncSessions の先頭で待たれて
            // いるため、通信できないときにここで止まると同期そのものが動かなく
            // なる。手元の値は先に入れてあり、送信は待ち行列に任せる。
            Firestore.setDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings'),
              { lastPromotionYear: base, lastModified: Firestore.serverTimestamp() },
              { merge: true }
            ).catch((誤り) => {
              console.error('[AutoPromotion] Failed to store baseline year:', 誤り);
            });
            return;
          }
          const { autoPromotionEnabled, lastPromotionYear } = 状態();
          if (autoPromotionEnabled && 四月を過ぎた && lastPromotionYear < 年) {
            console.log(`[AutoPromotion] Performing annual promotion for year ${年}...`);
            try {
              await 状態().incrementAllGrades();
            } catch (誤り) {
              console.error('[AutoPromotion] Failed:', 誤り);
            }
          }
        },
        ...同期の操作(書く, 状態, そのまま書く),
        
        
        incrementAllGrades: async () => {
          const { activeGroupId: 団体, alumni: 卒業生, currentFreshmanTerm, isNetworkOnline } = 状態();
          if (!団体) return;
          const 今 = Date.now();
          const 今年 = new Date().getFullYear();
          if (!isNetworkOnline)
            return void console.warn('[incrementAllGrades] Offline. Skipping promotion until online.');
          try {
            const 設定の帳面 = await Firestore.getDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings')
            );
            if (設定の帳面.exists()) {
              const 設定 = 設定の帳面.data();
              if (設定.lastPromotionYear && 設定.lastPromotionYear >= 今年)
                return (
                  console.log(
                    `[incrementAllGrades] Skipped: Promotion for year ${今年} already completed according to Firestore.`
                  ),
                  void 書く({ lastPromotionYear: 設定.lastPromotionYear })
                );
            }
          } catch (誤り) {
            return void console.error('[incrementAllGrades] Failed to re-verify settings:', 誤り);
          }
          let 雲の部員;
          try {
            const 返り = await Firestore.getDocs(
              Firestore.collection(Firebaseの器.db, `groups/${団体}/members`)
            );
            雲の部員 = [];
            返り.forEach((文書) => 雲の部員.push(Object.assign({}, 文書.data(), { id: 文書.id })));
          } catch (誤り) {
            return void console.error('[incrementAllGrades] Failed to fetch members:', 誤り);
          }
          console.log(
            `[Store] incrementAllGrades: Starting atomic promotion process... (${雲の部員.length} members from cloud)`
          );
          const dropUndefined = (元) => {
            const 出 = {};
            for (const 鍵 in 元) undefined !== 元[鍵] && (出[鍵] = 元[鍵]);
            return 出;
          };
          const gradeOf = (部員) => {
            const 値 = 部員 ? 部員.grade : null;
            if (null == 値 || '' === 値) return NaN;
            const 数 = Number(値);
            return isNaN(数) ? NaN : 数;
          };
          const skippedGrades = 雲の部員
            .filter((部員1人) => isNaN(gradeOf(部員1人)))
            .map((部員1人) => 部員1人.name || 部員1人.id);
          if (skippedGrades.length)
            console.warn('[incrementAllGrades] 学年が未設定のため据え置いたメンバー:', skippedGrades);
          const 進級後の部員 = [];
          雲の部員.forEach((部員) => {
            const 学年 = gradeOf(部員);
            if (isNaN(学年) || 学年 < 1 || 学年 >= 5)
              進級後の部員.push(Object.assign({}, 部員, { lastModified: 今, syncStatus: '同期済み' }));
            else if (学年 >= 4)
              進級後の部員.push(
                Object.assign({}, 部員, { grade: 5, lastModified: 今, syncStatus: '同期済み' })
              );
            else
              進級後の部員.push(
                Object.assign({}, 部員, { grade: 学年 + 1, lastModified: 今, syncStatus: '同期済み' })
              );
          });
          const 次の期 = (currentFreshmanTerm || 0) + 1;
          if (isNetworkOnline)
            try {
              const 書き込み = [];
              進級後の部員.forEach((部員) => {
                書き込み.push({
                  type: 'set',
                  ref: Firestore.doc(Firebaseの器.db, `groups/${団体}/members`, 部員.id),
                  data: dropUndefined(Object.assign({}, 部員, { lastModified: Firestore.serverTimestamp() })),
                });
              });
              書き込み.push({
                type: 'set',
                ref: Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings'),
                data: {
                  currentFreshmanTerm: 次の期,
                  lastPromotionYear: 今年,
                  lastModified: Firestore.serverTimestamp(),
                },
              });
              for (let 頭 = 0; 頭 < 書き込み.length; 頭 += 400) {
                const 切れ端 = 書き込み.slice(頭, 頭 + 400);
                const 一括 = Firestore.writeBatch(Firebaseの器.db);
                切れ端.forEach((書き込み1件) => {
                  'set' === 書き込み1件.type
                    ? 一括.set(書き込み1件.ref, 書き込み1件.data, { merge: true })
                    : 'delete' === 書き込み1件.type && 一括.delete(書き込み1件.ref);
                });
                await 一括.commit();
              }
              console.log('[Store] incrementAllGrades: Cloud sync successful.');
            } catch (誤り) {
              return (
                console.error('[incrementAllGrades] Cloud sync failed:', 誤り),
                void Alert.alert(
                  '進級処理エラー',
                  'クラウドとの同期に失敗しました。時間をおいて再度お試しください。'
                )
              );
            }
          const 卒業生の写し = 卒業生;
          書く({
            members: 進級後の部員,
            alumni: 卒業生の写し,
            currentFreshmanTerm: 次の期,
            lastPromotionYear: 今年,
            lastLocalChange: 今,
            lastSyncTime: 今,
          });
          console.log('[Store] incrementAllGrades: Promotion process completed.');
        },
        updateCurrentFreshmanTerm: async (期) => {
          const { activeGroupId, autoPromotionEnabled, tagTemplates, lastPromotionYear, isNetworkOnline } =
            状態();
          if (
            (書く({ currentFreshmanTerm: 期, lastLocalChange: Date.now() }), isNetworkOnline && activeGroupId)
          )
            try {
              await Firestore.setDoc(
                Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/config`, 'app_settings'),
                {
                  currentFreshmanTerm: 期,
                  autoPromotionEnabled,
                  tagTemplates,
                  lastPromotionYear,
                  lastModified: Firestore.serverTimestamp(),
                },
                { merge: true }
              );
              書く({ syncStatus: '同期済み', lastSyncTime: Date.now() });
            } catch (誤り) {
              console.error('Update Term Sync Error:', 誤り);
              不具合を控える('期の更新', 誤り);
              書く({ syncStatus: '同期エラー' });
            }
        },
        resetCurrentSession: (相手にも知らせる = true) => {
          if (状態().書き換えを止めるか()) return;
          const 今 = Date.now();
          // 片付けるとサーバーの marks_by_id も空になるので、控えも捨てる。
          // 残すと「前と同じだから送らなくてよい」と誤って判断する。片付けた
          // あと同じ記録を読み込み直すと、○×が片付ける前と一字一句同じに
          // なり、その送信が丸ごと飛ばされて相手の画面に出ない。
          // 知らせを受け取った側（o が偽）も、サーバーは同じく空なので捨てる
          載っている印を捨てる();
          書く({
            archers: [],
            historyStack: [],
            redoStack: [],
            activeSessionID: null,
            currentSessionTags: [],
            lastLocalChange: 今,
            lastResetHandled: 相手にも知らせる ? 今 : 状態().lastResetHandled,
            // 盤面を捨てたので、遡れる手も捨てる。ライブ中でないときに
            // historyStack を空にするのと同じ扱い。残すと、リセットしたあとの
            // 取り消しで、消したはずの盤面が戻ってくる
            historySharedLen: 0,
            historySharedMax: 0,
          });
          const { isLiveActive, liveSessionName } = 状態();
          const 枝 = ライブの枝();
          if (相手にも知らせる && isLiveActive && liveSessionName && Firebaseの器.rtdb && 枝) {
            const 盤面の場所 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${liveSessionName}/state`);
            RTDB.update(盤面の場所, {
              archers: [],
              marks_by_id: {},
              archer_timestamps: {},
              reset_at: 今,
              timestamp: 今,
              updated_at: RTDB.serverTimestamp(),
              // 共有履歴の目印も全員ぶん戻す
              history_len: 0,
              history_max: 0,
            }).catch((誤り) => console.error('Reset Live Sync Error:', 誤り));
            書く({ lastPushedTimestamp: 今 });
          }
        },
        recoverPassword: async (メール) => {
          if (!状態().isNetworkOnline) return { success: false, error: 'オフラインのため実行できません' };
          try {
            return (
              await FirebaseAuth.sendPasswordResetEmail(Firebaseの器.auth, メール),
              // 住所そのものは出さない。部活の共用端末では、次に使う人が
              // 開発者ツールで読める（復旧用の住所なので、知られたくない）
              console.log('[Store] パスワード再設定のメールを送りました'),
              { success: true }
            );
          } catch (誤り) {
            return (
              console.error('Password Recovery Error:', 誤り),
              { success: false, error: 誤り.message || 'パスワードリセットメールの送信に失敗しました' }
            );
          }
        },
        listenToConfig: async () => {
          const { activeGroupId: 団体 } = 状態();
          if (!団体) return;
          const _cfgDb = await waitForDb();
          if (!_cfgDb) {
            console.warn('[Store] listenToConfig: db still undefined after await, aborting');
            return;
          }
          try {
            const 設定の帳面 = await Firestore.getDoc(
              Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings')
            );
            if (設定の帳面.exists()) {
              const 設定 = 設定の帳面.data();
              console.log('[Store] Config initial fetch from cloud:', 設定);
              書く({
                autoPromotionEnabled: false !== 設定.autoPromotionEnabled,
                currentFreshmanTerm: 設定.currentFreshmanTerm || 状態().currentFreshmanTerm,
                tagTemplates: 設定.tagTemplates || 状態().tagTemplates,
                lastPromotionYear: 設定.lastPromotionYear || 状態().lastPromotionYear,
              });
            }
            const 団体の帳面 = await Firestore.getDoc(Firestore.doc(Firebaseの器.db, 'groups', 団体));
            if (団体の帳面.exists()) {
              const 団体の中身 = 団体の帳面.data();
              if (団体の中身.groupName) 書く({ activeGroupName: 団体の中身.groupName });
            }
          } catch (誤り) {
            console.warn('[Store] Initial config fetch failed (offline?), falling back to local.', 誤り);
          }
          const _existing = 状態().configUnsubscribe;
          if (_existing) {
            _existing();
            書く({ configUnsubscribe: null });
            console.log('[Store] listenToConfig: stopped existing listener');
          }
          const 設定を止める = Firestore.onSnapshot(
            Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'app_settings'),
            (返り) => {
              if (返り.exists()) {
                const 設定 = 返り.data();
                console.log('[Store] Config updated from cloud (snapshot):', 設定);
                書く({
                  autoPromotionEnabled: false !== 設定.autoPromotionEnabled,
                  currentFreshmanTerm: 設定.currentFreshmanTerm || 状態().currentFreshmanTerm,
                  tagTemplates: 設定.tagTemplates || 状態().tagTemplates,
                  lastPromotionYear: 設定.lastPromotionYear || 状態().lastPromotionYear,
                  analysisRankingSettings: 設定.analysisRankingSettings || 状態().analysisRankingSettings,
                });
              }
            },
            // 受け口を付けないと、断られたとき（出たあと・権限が変わったとき）に
            // SDK が「Uncaught Error in snapshot listener」を吐くだけで、何が起きたか残らない
            (誤り) => {
              console.error('[Store] Config listener error:', 誤り);
              不具合を控える('設定の受信', 誤り);
            }
          );
          const 団体名を止める = Firestore.onSnapshot(
            Firestore.doc(Firebaseの器.db, 'groups', 団体),
            (返り) => {
              if (返り.exists()) {
                const 団体の中身 = 返り.data();
                if (団体の中身.groupName) 書く({ activeGroupName: 団体の中身.groupName });
              }
            },
            (誤り) => {
              console.error('[Store] Group name listener error:', 誤り);
              不具合を控える('団体名の受信', 誤り);
            }
          );
          書く({
            configUnsubscribe: () => {
              設定を止める();
              団体名を止める();
            },
          });
        },
      };
    },
    {
      name: 'archery-score-storage',
      // JSON にする前の写しを受け取り、少しまとめてから書く（控えの書き出し）
      storage: 控えの置き場,
      partialize: (状態の中身) => {
        // 端末には、予算に収まるぶんだけ残す。雲には全部あるので、
        // 次に開いたときに取り直せる。まだ送れていない記録は必ず残す
        //（落とすとその練習ぶんがどこにも無くなる。src/localTrim.js）
        const 残す記録 = 端.端末に残す記録(状態の中身.sessions, {
          最後に送った時刻: 状態の中身.lastSyncTime || 0,
        });
        return {
          archers: 状態の中身.archers,
          members: 状態の中身.members,
          sessions: 残す記録,
          // 外した記録は差分の同期では戻ってこない（変わっていないので）。id だけ残し、
          // 次の起動で id で取り直す（起動時に取り込む）。数百件でも数 KB
          端末から外した記録: 外した記録のid(状態の中身.sessions, 残す記録, 状態の中身.端末から外した記録),
          history: 状態の中身.history,
          alumni: 状態の中身.alumni,
          trash: 状態の中身.trash,
          permanentlyDeleted: 状態の中身.permanentlyDeleted,
          deletedMembers: 状態の中身.deletedMembers,
          shotsPerRound: 状態の中身.shotsPerRound,
          activeSessionID: 状態の中身.activeSessionID,
          viewScale: 状態の中身.viewScale,
          includeInStats: 状態の中身.includeInStats,
          lastSessionTags: 状態の中身.tagTemplates,
          currentSessionTags: 状態の中身.currentSessionTags,
          activeGroupId: 状態の中身.activeGroupId,
          activeGroupName: 状態の中身.activeGroupName,
          publicGroupId: 状態の中身.publicGroupId,
          activeRole: 状態の中身.activeRole,
          activeUserEmail: 状態の中身.activeUserEmail,
          myMemberId: 状態の中身.myMemberId,
          myMemberName: 状態の中身.myMemberName,
          memberAuthVersion: 状態の中身.memberAuthVersion,
          analysisSelectedTags: 状態の中身.analysisSelectedTags,
          analysisTagLogic: 状態の中身.analysisTagLogic,
          historySelectedTags: 状態の中身.historySelectedTags,
          historyTagLogic: 状態の中身.historyTagLogic,
          tagTemplates: 状態の中身.tagTemplates,
          currentFreshmanTerm: 状態の中身.currentFreshmanTerm,
          lastPromotionYear: 状態の中身.lastPromotionYear,
          lastSyncTime: 状態の中身.lastSyncTime,
          雲の境目: 状態の中身.雲の境目,
          全部そろえた時刻: 状態の中身.全部そろえた時刻,
          isAdminMode: 状態の中身.isAdminMode,
          autoPromotionEnabled: 状態の中身.autoPromotionEnabled,
          analysisRankingSettings: 状態の中身.analysisRankingSettings,
          enableArrowLocation: 状態の中身.enableArrowLocation,
          矢所の入れ方: 状態の中身.矢所の入れ方,
          自動ロックする: 状態の中身.自動ロックする,
          保存時に出欠を確認する: 状態の中身.保存時に出欠を確認する,
          横に並べる: 状態の中身.横に並べる,
          帯を畳む: 状態の中身.帯を畳む,
          帯の取っ手は左: 状態の中身.帯の取っ手は左,
          arrowTargetType: 状態の中身.arrowTargetType,
          比較のひな型: 状態の中身.比較のひな型,
          ライブの合言葉: 状態の中身.ライブの合言葉,
          ライブの続き: 状態の中身.ライブの続き,
          履歴の編集: 状態の中身.履歴の編集,
        };
      },
      onRehydrateStorage: () => {
        console.log('[Store] Hydration starting...');
        const 始めた時刻 = Date.now();
        return (戻した状態, 誤り) => {
          const かかった時間 = Date.now() - 始めた時刻;
          if (誤り) console.error(`[Store] Hydration error (after ${かかった時間}ms):`, 誤り);
          else if (戻した状態) {
            console.log(`[Store] Hydration finished successfully (Duration: ${かかった時間}ms)`);
            const updates = { isHydrated: true };
            if (戻した状態.sessions) {
              updates.sessions = cleanUpSessions(戻した状態.sessions);
            }
            if (戻した状態.trash) {
              updates.trash = cleanUpSessions(戻した状態.trash);
            }
            if (戻した状態.historySelectedTags) {
              updates.historySelectedTags = cleanUpTagsArray(戻した状態.historySelectedTags);
            }
            if (戻した状態.analysisSelectedTags) {
              updates.analysisSelectedTags = cleanUpTagsArray(戻した状態.analysisSelectedTags);
            }
            if (戻した状態.currentSessionTags) {
              updates.currentSessionTags = cleanUpTagsArray(戻した状態.currentSessionTags);
            }
            if (戻した状態.tagTemplates) {
              updates.tagTemplates = cleanUpTagsArray(戻した状態.tagTemplates);
            }
            if (!Array.isArray(戻した状態.archers)) {
              console.warn('[Store] archers was not an array, recovering...');
              updates.archers = [];
            }
            if (
              'number' != typeof 戻した状態.viewScale ||
              isNaN(戻した状態.viewScale) ||
              戻した状態.viewScale <= 0
            ) {
              console.warn('[Store] Invalid viewScale detected during hydration, resetting to 1.0');
              updates.viewScale = 1;
            }
            if ('function' == typeof 戻した状態.updateState) {
              戻した状態.updateState(updates);
            }
            if ('function' == typeof 戻した状態.ensurePersonalIds) {
              戻した状態.ensurePersonalIds();
            }
          } else {
            console.warn(`[Store] Hydration yielded empty state (after ${かかった時間}ms)`);
            const いまの状態 = useScoreStore.getState();
            if (
              いまの状態 &&
              false === いまの状態.isHydrated &&
              'function' == typeof いまの状態.updateState
            ) {
              console.log('[Store] Forcing isHydrated: true even for empty state');
              いまの状態.updateState({ isHydrated: true });
            }
          }
        };
      },
    }
  )
);
// 外側の部品（storeShared.js）が店を読むところ。読み込みを輪にしないため、できたあとに入れる
場.店 = useScoreStore;
