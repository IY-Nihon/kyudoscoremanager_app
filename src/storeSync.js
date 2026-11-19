'use strict';

/**
 * 店の操作のうち、雲（Firestore）との同期と購読：差分の同期・まとめて送る・ログアウト前に送り切る・起動時の取り込み・
 * まとめて取り直す、記録・ゴミ箱・名簿・卒業生の購読、定期の同期、通信の見張り。
 * （2026-10-05 に useScoreStore.js から分けた。店の名指しは 場.店）
 * 店（useScoreStore.js）が ...同期の操作(書く, 状態, そのまま書く) で広げる。
 */
const {
  Firebaseの器,
  Firestore,
  dropUndefinedDeep,
  idで記録を取る,
  mergeById,
  netinfo,
  normalizeTag,
  trashedAtMillis,
  waitForDb,
  不具合を控える,
  入り直しの案内,
  入り直せば直るか,
  同期規則,
  場,
  溜まりを流し直す,
  行動を控える,
  記録の射手を整える,
  記録の日時を数に,
  雲へ書く記録,
  読んだままの中身,
  雲から読んだか,
  分けた一括,
  送った版に印を付ける,
  送った版の表,
  名簿へ書く形,
} = require('./storeShared');
const 役の決まり = require('./yaku');
const 学 = require('./gakunen');
const 自分の記録 = require('./jibunKiroku');

/** 記録が変わった印やアプリに戻ったことで中継から取り直すのは、続いても 10 秒に 1 回まで（3 段目） */
const 取り直しの間 = 10 * 1000;
/** 中継から取り直す（記録を直接読めない役の端末だけ）。続けて呼ばれたら 1 回にまとめ、間を空ける */
function 中継から取り直す(状態) {
  if (場.記録の取り直し待ち) return;
  const 待つ = Math.max(1500, (場.最後に記録を取り直した || 0) + 取り直しの間 - Date.now());
  場.記録の取り直し待ち = setTimeout(() => {
    場.記録の取り直し待ち = null;
    if (!役の決まり.自分の分だけか(状態())) return;
    // 同期の途中なら、終わってから取り直す（途中の同期は、この変わりより前に読み始めているかもしれない。11/20 の見直し）
    if (場.同期している) return 中継から取り直す(状態);
    場.最後に記録を取り直した = Date.now();
    Promise.resolve(状態().syncSessions()).catch((誤り) =>
      console.warn('[Store] 記録の取り直しに失敗:', 誤り)
    );
  }, 待つ);
}

/**
 * 記録のタグを整える（# を付けてそろえ、重なりを外す）。変わったかも返す（変わっていれば雲も直す）
 * @returns {{ タグ: string[], 変わった: boolean }}
 */
function タグを整える(中身) {
  const 元 = Array.isArray(中身.tags) ? 中身.tags : [];
  const タグ = Array.from(new Set(元.map(normalizeTag).filter(Boolean)));
  return { タグ, 変わった: タグ.length !== 元.length || タグ.some((一つ, 番) => 一つ !== 元[番]) };
}

// 消したもの（記録・メンバー）の控えを持つ長さ。雲から消えたのを確かめられないまま、これを過ぎたら手放す
const 消した控えを持つ長さ = 30 * 24 * 60 * 60 * 1000;

const 同期の操作 = (書く, 状態, そのまま書く) => ({
  // 上から引っ張って更新（src/hikiOroshi.js）。送っていない記録を送り、ほかの端末の変更（記録・名簿・ゴミ箱・卒業生）を取る
  雲から取り直す: async () => {
    行動を控える('引いて更新', '');
    await 状態().syncSessions();
  },
  /**
   * 雲と突き合わせて、まだ送れていないものを送り直す。
   * @param {{取りに行かない?: boolean, 記録は取らない?: boolean}} [選び] 取りに行かない … 雲から取らず、送り直しだけ。
   *   起動時は直前に fetchAndOverwriteFromCloud が全部取っていて、見張りも
   *   これから届くので、ここでもう一度取るのは同じものを 3 回読むことになる。
   *   記録は取らない … 記録を直接読めない役で、記録を中継から取らない（5 分ごとの同期。3 段目の取り直しは
   *   開いた・戻った・引いた・記録が変わった印のときだけ。11/19 本人）
   *
   * 記録を直接読めない役（部員（自分）。src/yaku.js の 自分の分だけか）は、記録を中継（/jibun）から自分の行だけ
   * 受け取り、ゴミ箱は読まない（決まりの memberSeesAll。3 段目・11/19 本人）。中継が古いときは前の道（直接読む）
   */
  syncSessions: async (選び) => {
    if (!状態().activeGroupId) return;
    const _syncDb = await waitForDb();
    if (!_syncDb) {
      console.warn('[Store] syncSessions: db still undefined after await, aborting');
      // ここは黙って同期エラーにしていた。利用者の画面には帯が出るのに
      // こちらには何も残らないので、原因が分からないまま止まる
      //（2026-09-09、スマホで同期に失敗したときに便りが1通も無かった）
      不具合を控える('記録の同期', new Error('雲との連絡口が用意できませんでした'));
      書く({ syncStatus: '同期エラー' });
      return;
    }
    await 状態().checkAndAutoIncrementGrades();
    if (場.同期している) {
      console.log('[syncSessions] Already syncing, skipping...');
      return;
    }
    場.同期している = true;
    const 前回の同期時刻 = 状態().lastSyncTime || 0;
    // 差分で取れるのは、この団体で全件をそろえたあと（境目がある）ときだけ
    const 始めの境目 = 状態().雲の境目;
    const 差分で取れるか =
      !!始めの境目 && 始めの境目.団体 === 状態().activeGroupId && 状態().全部そろえた時刻 > 0;
    console.log(
      '[Store] Syncing:',
      `同期を開始中 (前回: ${前回の同期時刻 ? new Date(前回の同期時刻).toLocaleString() : 'なし'} / ${差分で取れるか ? '差分' : '全件'})...`
    );
    書く({ syncStatus: '同期中' });
    try {
      // 始めたときの団体。読んでいるあいだに団体を移っても、取り違えないよう控えておく
      const 団体ID = 状態().activeGroupId;
      const 記録の置き場 = Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`);
      const 部員の置き場 = Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/members`);
      const ごみ箱の置き場 = Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`);
      const 卒業生の置き場 = Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`);
      let 記録の返り;
      let 部員の返り;
      let ごみ箱の返り;
      let 卒業生の返り;
      // 控えから外した記録を id で取り直したもの（差分で届いたものと合わせて取り込む）。
      // 起動のときに限らず、取り直せていないものが残っていれば周期の同期でも取り直す
      let 取り戻した記録 = [];
      const 取り戻す記録 = 差分で取れるか ? [...(状態().端末から外した記録 || [])] : [];
      let 雲から取り戻せた = false;
      // 取り直しを頼んだ id（終わったら一覧から除く。数千件でも重くならないよう Set で持つ）
      const 取り直したid = new Set(取り戻す記録);
      const 空 = { forEach: () => {} };
      // 3 段目：記録を直接読めない役は、記録を中継から自分の行だけ受け取る
      let 中継の答え = null;
      if (役の決まり.自分の分だけか(状態()) && !(選び && 選び.取りに行かない)) {
        // 電波が無いと分かっているときも中継を呼ばない（つながったら同期が走る。setupNetworkListener）
        中継の答え =
          (選び && 選び.記録は取らない) || !状態().isNetworkOnline
            ? { 記録たち: [], 外す: [], 消えた: [], 境目: { 記録: 0, ごみ箱: 0 }, idで取れた: false }
            : await 自分の記録.中継から取る({
                団体: 団体ID,
                形: 差分で取れるか ? '差分' : '全部',
                境目: 差分で取れるか ? { 記録: 始めの境目.記録, ごみ箱: 始めの境目.ごみ箱 } : {},
                ids: 取り戻す記録,
              });
        // 中継が古い（/jibun が無い）ときは前の道（直接読む）。中継を配るまでのつなぎ
        if (中継の答え.古い中継) 中継の答え = null;
      }
      if (選び && 選び.取りに行かない) {
        記録の返り = 部員の返り = ごみ箱の返り = 卒業生の返り = 空;
      } else if (中継の答え) {
        記録の返り = 自分の記録.返りの形(中継の答え.記録たち);
        ごみ箱の返り = 空;
        雲から取り戻せた = 中継の答え.idで取れた;
        const 境目より後 = (置き場, 種) =>
          Firestore.getDocs(
            Firestore.query(
              置き場,
              Firestore.where(
                'lastModified',
                '>=',
                Firestore.Timestamp.fromMillis(Math.max(0, 始めの境目[種] || 0))
              )
            )
          );
        [部員の返り, 卒業生の返り] = await Promise.all(
          差分で取れるか
            ? [境目より後(部員の置き場, '部員'), 境目より後(卒業生の置き場, '卒業生')]
            : [Firestore.getDocs(部員の置き場), Firestore.getDocs(卒業生の置き場)]
        );
      } else if (差分で取れるか) {
        // 集まりごとの境目より後に変わった文書だけを取る（境目の決め方は syncRules の 境目を進める）。
        // 境目は日時型で渡す。Firestore の範囲の問い合わせは同じ型の値にしか当たらず、
        // 数で渡すと serverTimestamp で書いた lastModified（日時型）の文書が 1 件も返らない。
        // 2026-08-03 に書き込みを serverTimestamp へ移してから、ここは何も取ってこなかった
        //（見張りが代わりに届けていたので気づかなかった。2026-09-24 に本番で確かめて直した）。
        // 境目ちょうど（>=）から取る。同じ時刻の書き込みを取りこぼさないためで、読み直すのは
        // 境目と同じ時刻の文書だけ（前は 10 秒の余裕を取り、その間の文書を毎回読み直していた）
        // 5 つの読みは互いに待たずに並べて投げる（順に待つと、電波の弱い所で往復の数だけ遅れる）
        const 基準 = (種) => Firestore.Timestamp.fromMillis(Math.max(0, 始めの境目[種] || 0));
        const 境目より後 = (置き場, 種) =>
          Firestore.getDocs(Firestore.query(置き場, Firestore.where('lastModified', '>=', 基準(種))));
        let 取り直し;
        [記録の返り, 取り直し, 部員の返り, ごみ箱の返り, 卒業生の返り] = await Promise.all([
          境目より後(記録の置き場, '記録'),
          // 境目は差分の問い合わせの結果だけで決める（id で取った分は数えない）
          idで記録を取る(記録の置き場, 取り戻す記録),
          境目より後(部員の置き場, '部員'),
          境目より後(ごみ箱の置き場, 'ごみ箱'),
          境目より後(卒業生の置き場, '卒業生'),
        ]);
        取り戻した記録 = 取り直し.文書たち;
        雲から取り戻せた = 取り直し.雲から;
      } else {
        [記録の返り, 部員の返り, ごみ箱の返り, 卒業生の返り] = await Promise.all([
          Firestore.getDocs(
            Firestore.query(記録の置き場, Firestore.orderBy('date', 'desc'), Firestore.limit(100))
          ),
          Firestore.getDocs(部員の置き場),
          Firestore.getDocs(ごみ箱の置き場),
          Firestore.getDocs(卒業生の置き場),
        ]);
      }
      // 読んでいるあいだに別の団体へ入り直していたら（電波の弱い所で読みが遅れた）、この同期は捨てる。
      // 進めると、前の団体の記録を新しい団体の履歴に混ぜ、送れていない記録を新しい団体の置き場へ書いた（A6）
      if (状態().activeGroupId !== 団体ID) {
        console.warn('[syncSessions] 同期の途中で団体が変わったので、この同期は捨てます');
        return;
      }
      let 最新の時刻 = 前回の同期時刻;
      // 日時を数に直し、いちばん新しい変更の時刻も控える（終わりの記録に出すだけ）
      const ミリ秒にする = (値) => {
        const 時刻 = 値?.toMillis ? 値.toMillis() : 値 || 0;
        if (時刻 > 最新の時刻) 最新の時刻 = 時刻;
        return 時刻;
      };
      const 雲の記録 = [];
      // 差分（か全件）で届いた記録と、id で取り直した記録。同じ id は差分の方を使う
      const 取り込む記録 = [];
      const 届いたid = new Set();
      記録の返り.forEach((文書) => {
        取り込む記録.push(文書);
        届いたid.add(文書.id);
      });
      for (const 文書 of 取り戻した記録) if (!届いたid.has(文書.id)) 取り込む記録.push(文書);
      取り込む記録.forEach((文書) => {
        const 中身 = 記録の日時を数に(文書.data());
        const 更新時刻 = ミリ秒にする(中身.lastModified);
        const { タグ: cleanedTags, 変わった } = タグを整える(中身);
        // 中継から受け取った（自分の行だけの）記録では雲へ書かない（直すのは団体の端末）。「直す」の無い部員は
        // ほかの人の記録を書き換えられない（4 段目）ので、記録を直せる端末だけ
        const 直せる端末 = 状態().activeRole === 'group' || 役の決まり.できるか(状態(), '記録を直す');
        if (変わった && Firebaseの器.db && 団体ID && !中継の答え && 直せる端末) {
          const 場所 = Firestore.doc(Firebaseの器.db, `groups/${団体ID}/sessions`, 文書.id);
          Firestore.updateDoc(場所, { tags: cleanedTags }).catch((誤り) =>
            console.error('[Store] syncSessions Auto cleanup failed:', 誤り)
          );
        }
        雲の記録.push(
          Object.assign({}, 中身, {
            id: 文書.id,
            tags: cleanedTags,
            // 見張りと同じように形を整える。ここを抜かすと、
            // 取りにいった方から壊れた記録がそのまま入ってくる
            archers: 記録の射手を整える(中身),
            lastModified: 更新時刻,
            syncStatus: '同期済み',
          })
        );
      });
      // 名簿・ゴミ箱・卒業生は、届いた中身に id と数の日時を足すだけ（ゴミ箱は記録なので日時も数に）
      const 店の形にする = (返り, 整える = (中身) => 中身) => {
        const 出 = [];
        返り.forEach((文書) => {
          const 中身 = 整える(文書.data());
          出.push(
            Object.assign({}, 中身, {
              id: 文書.id,
              lastModified: ミリ秒にする(中身.lastModified),
              syncStatus: '同期済み',
            })
          );
        });
        return 出;
      };
      const 雲の部員 = 店の形にする(部員の返り);
      const 雲のごみ箱 = 店の形にする(ごみ箱の返り, 記録の日時を数に);
      const 雲の卒業生 = 店の形にする(卒業生の返り);
      console.log(
        `[syncSessions] Fetched counts: S=${雲の記録.length}, M=${雲の部員.length}, T=${雲のごみ箱.length}, A=${雲の卒業生.length}`
      );
      let 記録の合流 = mergeById(状態().sessions, 雲の記録, false, false);
      // 中継の答えで、写っていない記録とゴミ箱へ移った記録を手元から外す（送れていない記録は残す）
      if (中継の答え) 記録の合流 = 自分の記録.外すものを外す(記録の合流, 中継の答え);
      // 消したのにまだ雲へ届いていないメンバーは、雲に残っていても戻さない（見張り・全件の取り直しと同じ。A4）
      const 消したメンバー = new Set(Object.keys(状態().deletedMembers || {}));
      const 部員の合流 = mergeById(
        状態().members,
        雲の部員.filter((部員1人) => !消したメンバー.has(部員1人.id)),
        false,
        false
      );
      // 記録を直接読めない役は、ゴミ箱を持たない（ほかの人の記録が入っている）
      const ごみ箱の合流 = 中継の答え ? [] : mergeById(状態().trash, 雲のごみ箱, false, false);
      const 卒業生の合流 = mergeById(状態().alumni, 雲の卒業生, false, false);
      const 卒業生のID = new Set(卒業生の合流.map((卒業生1人) => 卒業生1人.id));
      const 部員 = 部員の合流.filter((部員1人) => !卒業生のID.has(部員1人.id));
      const 部員のID = new Set(部員.map((部員1人) => 部員1人.id));
      const 卒業生 = 卒業生の合流.filter((卒業生1人) => !部員のID.has(卒業生1人.id));
      記録の合流.sort((甲, 乙) => {
        const 甲の時刻 = 甲.date ? new Date(甲.date).getTime() : 0;
        return (乙.date ? new Date(乙.date).getTime() : 0) - 甲の時刻;
      });
      // 戻した記録がまだクラウドへ届いていないときは、クラウド側のゴミ箱の
      // 写しで消し込まない。届くまでは手元の「戻した」状態を優先する。
      // ほかの端末が戻した記録（雲の記録のほうがゴミ箱の写しより新しい）も同じ。
      // 手元のゴミ箱に古い写しが残っていても、履歴に出す（syncRules の 雲で戻された記録）
      const 復元待ち = new Set([
        ...記録の合流
          .filter((記録1件) => 記録1件 && 記録1件.syncStatus === '未同期')
          .map((記録1件) => 記録1件.id),
        ...同期規則.雲で戻された記録(雲の記録, ごみ箱の合流),
      ]);
      const ごみ箱 = ごみ箱の合流.filter((記録1件) => 記録1件 && !復元待ち.has(記録1件.id));
      const ごみ箱のID = new Set(ごみ箱.map((記録1件) => 記録1件.id));
      const 記録 = 記録の合流.filter((記録1件) => !ごみ箱のID.has(記録1件.id));
      // 送れない（決まりに断られた）印の付いた記録は、一括に入れない（一括ごと断られ、ほかの記録も送れなくなる。
      // 起動のたびに印を外して 1 回だけ送り直す。4 段目・11/20 本人）
      const 未送信の記録 = 記録.filter((記録1件) => 記録1件.syncStatus === '未同期' && !記録1件.送れない);
      let 記録の一覧 = 記録;
      // 記録を付けられない役（見るだけなど）に替わった端末は送らない。決まりに一括ごと断られ、送るたびに失敗が
      // 続くだけなので。記録は「未同期」のまま端末に残し、設定の役の下で件数を知らせる。役を戻してもらうと、
      // 次の同期で送られる（11/19 本人）
      if (未送信の記録.length > 0 && !役の決まり.役で付けられないか(状態())) {
        console.log(`[syncSessions] Syncing ${未送信の記録.length} pending sessions...`);
        // 1 件で set と delete の 2 つ使う。250 件を超えると 1 つの束に収まらないので分ける
        const 一括 = 分けた一括(Firebaseの器.db);
        const 今 = Date.now();
        const 送った版 = 送った版の表(未送信の記録);
        const 送る団体 = 状態().activeGroupId;
        // 「直す」の無い役の部員の端末にある送れていない記録は、その人が作ったもの（ほかの人の保存した記録は直せない）。
        // 作った人の印が無ければ付けて送る（決まりは、自分が作った記録の送り直しだけ通す。4 段目・11/20 本人）
        const 自分で作った =
          状態().activeRole === 'member' &&
          !役の決まり.部品で持つか(役の決まり.自分の部品(状態()), '記録を直す');
        const 送るもの = 未送信の記録.map((記録) => {
          const 送る形 = JSON.parse(
            JSON.stringify(Object.assign({}, 記録, { syncStatus: '同期済み', lastModified: 今 }))
          );
          delete 送る形.送れない; // 端末の中だけの印
          if (自分で作った && !送る形.createdBy && 状態().myMemberId)
            送る形.createdBy = String(状態().myMemberId);
          const 中身 = Object.assign(雲へ書く記録(送る形), { lastModified: Firestore.serverTimestamp() });
          return { 記録, 中身 };
        });
        送るもの.forEach(({ 記録, 中身 }) => {
          一括.set(Firestore.doc(Firebaseの器.db, `groups/${送る団体}/sessions`, 記録.id), 中身);
          // 戻した記録なら、クラウドのゴミ箱からも取り下げる。存在しない場合は
          // 何も起きないので、新規の記録に対しても安全。
          // ゴミ箱に書けるのは決まりで団体だけ。部員の端末で一括に入れると一括ごと断られ、
          // 送れていない記録をいつまでも送り直せなかった（A2）
          if (役の決まり.できるか(状態(), '記録を消す'))
            一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id));
        });
        // 送信の完了は待たない。通信できないと一括送信は終わらないため、
        // 待つとこの関数自体が返らず、同期中の目印が立ったままになって
        // 以後の同期がすべて飛ばされる。届いた時点で、送った版だけ印を付け替える（送った版に印を付ける）
        一括.commit()
          .then(() => {
            書く((前) => ({
              sessions: 送った版に印を付ける(前.sessions, 送った版, {
                syncStatus: '同期済み',
                lastModified: 今,
              }),
            }));
          })
          .catch(async (誤り) => {
            console.error('[syncSessions] 記録の送信に失敗:', 誤り);
            // 部員の端末で決まりに断られたら、1 件ずつ送り直し、断られた記録だけに「送れない」の印を付ける（作った人の印の
            // 無い前の記録への送り直しなど。ほかの記録まで送れなくならないように。設定の役の下で件数を知らせる。4 段目）
            if (!誤り || 誤り.code !== 'permission-denied' || 状態().activeRole !== 'member') return;
            for (const { 記録, 中身 } of 送るもの) {
              if (状態().activeGroupId !== 送る団体) return;
              try {
                await Firestore.setDoc(
                  Firestore.doc(Firebaseの器.db, `groups/${送る団体}/sessions`, 記録.id),
                  中身
                );
                書く((前) => ({
                  sessions: 送った版に印を付ける(前.sessions, 送った版の表([記録]), {
                    syncStatus: '同期済み',
                    lastModified: 今,
                  }),
                }));
              } catch (一件の誤り) {
                if (一件の誤り && 一件の誤り.code === 'permission-denied')
                  書く((前) => ({
                    sessions: 前.sessions.map((一つ) =>
                      一つ && 一つ.id === 記録.id && 一つ.syncStatus === '未同期'
                        ? Object.assign({}, 一つ, { 送れない: true })
                        : 一つ
                    ),
                  }));
              }
            }
          });
      }
      // 送信が済んでいない削除を送り直す。通信できないときに削除した場合、
      // 待ち行列ごと失われることがあり、そのままだと次の全件取得で記録が
      // 復活してしまう。
      // 送り直すのは「この端末で捨てて、まだ送れていない」ものだけ。
      // クラウドの写しを読み込んだだけの項目まで送ると、ゴミ箱を空にした
      // 直後に読み込んだ分が戻ってきてしまう。
      const 未送信の削除 = ごみ箱.filter(
        (記録1件) => 記録1件 && 記録1件.id && 記録1件.pendingDelete && 記録1件.syncStatus === '未同期'
      );
      // 送り直すのは団体ログインのときだけ。記録を消す・ゴミ箱に書くのは決まりで団体だけ（firestore.rules・
      // 2026-11-02）。部員の端末から送ると断られ続ける（部員には消す操作を出していないので、残っているのは
      // 同じ端末で前に団体で入っていたときのものだけ）
      if (未送信の削除.length > 0 && 役の決まり.できるか(状態(), '記録を消す')) {
        console.log(`[syncSessions] Syncing ${未送信の削除.length} pending deletions...`);
        try {
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          const 送った削除 = 送った版の表(未送信の削除);
          未送信の削除.forEach((記録) => {
            一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id));
            const 送る形 = dropUndefinedDeep(Object.assign({}, 記録, { syncStatus: 'trashed' }));
            // pendingDelete は端末の中だけの印。クラウドへは持ち込まない
            delete 送る形.pendingDelete;
            送る形.lastModified = Firestore.serverTimestamp();
            // 捨てた日時は日時型で送る。手元では数で持っている（記録の日時を数に）
            送る形.deletedAt = 送る形.deletedAt
              ? Firestore.Timestamp.fromMillis(同期規則.toMillis(送る形.deletedAt))
              : Firestore.serverTimestamp();
            一括.set(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
              雲へ書く記録(送る形)
            );
          });
          // 記録の送信と同じ理由で完了は待たない。印を付けるのも
          // 送った版だけにする。
          一括.commit()
            .then(() => {
              書く((前) => ({
                trash: 送った版に印を付ける(前.trash, 送った削除, {
                  syncStatus: '同期済み',
                  pendingDelete: false,
                }),
              }));
            })
            .catch((誤り) => {
              console.error('[syncSessions] 削除の送り直しに失敗:', 誤り);
            });
        } catch (誤り) {
          console.error('[syncSessions] 削除の送り直しの組み立てに失敗:', 誤り);
        }
      }
      // 完全に消したものは、クラウドにまだ残っていても画面に出さない。
      // 控えの整理と消し直しは、記録もゴミ箱も全件そろう
      // fetchAndOverwriteFromCloud 側で行う（ここは差分取得なので、
      // クラウドに残っているかを正しく判定できない）。
      const 完全削除ずみ = new Set(Object.keys(状態().permanentlyDeleted || {}));
      // 送信が済んでいないメンバーを送り直す。記録やゴミ箱と同じで、
      // 通信できないときの変更は待ち行列ごと失われることがあり、
      // そのままだと手元にしかない氏名や学年が永久に届かない。
      // 名簿を書けるのは団体アカウントだけなので、部員では試みない。
      const 未送信のメンバー = 役の決まり.できるか(状態(), 'メンバーを管理する')
        ? 部員.filter((部員1人) => 部員1人 && 部員1人.id && 部員1人.syncStatus === '未同期')
        : [];
      // 名簿・卒業生の送り直し。完了は待たない（記録・ゴミ箱と同じ理由）。印を付けるのも送った版だけ
      const 人を送り直す = (未送信, 置き場, 店の鍵, 名, 届いたら) => {
        if (!未送信.length) return;
        console.log(`[syncSessions] Syncing ${未送信.length} pending ${置き場}...`);
        try {
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          const 送った版 = 送った版の表(未送信);
          未送信.forEach((一人) => {
            const 送る形 = dropUndefinedDeep(
              Object.assign({}, 名簿へ書く形(一人), { syncStatus: '同期済み' })
            );
            送る形.lastModified = Firestore.serverTimestamp();
            一括.set(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/${置き場}`, 一人.id),
              送る形
            );
          });
          一括.commit()
            .then(() => {
              書く((前) => ({ [店の鍵]: 送った版に印を付ける(前[店の鍵], 送った版) }));
              if (届いたら) 届いたら();
            })
            .catch((誤り) => {
              console.error(`[syncSessions] ${名}の送り直しに失敗:`, 誤り);
            });
        } catch (誤り) {
          console.error(`[syncSessions] ${名}の送り直しの組み立てに失敗:`, 誤り);
        }
      };
      人を送り直す(未送信のメンバー, 'members', 'members', 'メンバー', () => 状態().syncMemberLookup());
      // 部員の端末は、自分の弓具だけを送り直す（部員が触れるのは自分の弓具だけ。丸ごと送ると、
      // 団体が直した名前・学年を古い写しで戻してしまう）
      const 送れていない自分 =
        状態().activeRole === 'member' && 状態().myMemberId
          ? 部員.find(
              (一人) => 一人 && String(一人.id) === String(状態().myMemberId) && 一人.syncStatus === '未同期'
            )
          : null;
      if (送れていない自分) {
        const { 弓具だけ送る形, 届いた人を同期済みに } = require('./storeMembers');
        Firestore.updateDoc(
          Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 送れていない自分.id),
          弓具だけ送る形(送れていない自分)
        )
          .then(() => 届いた人を同期済みに(書く, [送れていない自分]))
          .catch((誤り) => console.error('[syncSessions] 弓具の送り直しに失敗:', 誤り));
      }
      // 卒業生も同じ。個人IDの自動採番は卒業生にも振るので、送り直しが
      // 無いと手元にしかないIDが永久に届かず、端末ごとに食い違う。
      const 未送信の卒業生 = 役の決まり.できるか(状態(), 'メンバーを管理する')
        ? 卒業生.filter((卒業生1人) => 卒業生1人 && 卒業生1人.id && 卒業生1人.syncStatus === '未同期')
        : [];
      人を送り直す(未送信の卒業生, 'alumni', 'alumni', '卒業生');
      // 境目を進める。差分で取ったときは 4 つとも、全件の道では記録を 100 件しか
      // 取らないので記録以外だけ（記録の境目は全件取得でしか決めない）。
      // いまの境目と比べて大きい方にする（途中で全件取得が走っていても下げない）
      // 端末の控えから答えた集まり（電波が無い）は進めない（雲から読んだか を参照）
      const 今の境目 = 状態().雲の境目;
      const 境目の元 = 今の境目 && 今の境目.団体 === 団体ID ? 今の境目 : null;
      const 進める = (種, 返り) =>
        雲から読んだか(返り)
          ? 同期規則.境目を進める((境目の元 || {})[種], 読んだままの中身(返り))
          : (境目の元 || {})[種] || 0;
      const 新しい境目 =
        差分で取れるか || 境目の元
          ? {
              団体: 団体ID,
              // どの道でそろえた境目か（中継・直接・古い中継）。全件の取り込みが決める。ここでは引き継ぐ
              取り方: (境目の元 || {}).取り方,
              // 中継から受け取ったときは、中継が読んだ文書の時刻で進める（返るのは自分の写った記録だけなので）
              記録: 中継の答え
                ? Math.max((境目の元 || {}).記録 || 0, 中継の答え.境目.記録)
                : 差分で取れるか
                  ? 進める('記録', 記録の返り)
                  : (境目の元 || {}).記録 || 0,
              部員: 進める('部員', 部員の返り),
              ごみ箱: 中継の答え
                ? Math.max((境目の元 || {}).ごみ箱 || 0, 中継の答え.境目.ごみ箱)
                : 進める('ごみ箱', ごみ箱の返り),
              卒業生: 進める('卒業生', 卒業生の返り),
            }
          : 今の境目;
      書く({
        // 完全に消したものは、クラウドにまだ残っていても画面に出さない
        sessions: 記録の一覧.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
        members: 部員,
        trash: ごみ箱.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
        alumni: 卒業生,
        syncStatus: '同期済み',
        // 端末の時刻（画面の「最終同期」と、端末に残す記録の間引きに使う）
        lastSyncTime: Date.now(),
        雲の境目: 新しい境目,
        // 雲から取り直せたら、外した記録の一覧を空にする（雲に無い id はゴミ箱へ移ったもの）。
        // 控えから答えたときは残す（控えに無い記録は戻っていないので）
        ...(取り戻す記録.length && 雲から取り戻せた
          ? {
              端末から外した記録: (状態().端末から外した記録 || []).filter((id) => !取り直したid.has(id)),
            }
          : {}),
      });
      console.log(`[syncSessions] Finished. 最新の変更: ${最新の時刻}`);
      setTimeout(() => {
        Promise.resolve(状態().ensurePersonalIds()).catch((誤り) =>
          console.warn('[Store] 個人IDを確かめられませんでした', 誤り)
        );
      }, 500);
      // メンバーも記録も雲から読めたときだけ、名前のずれを直す（古い名簿で前の名前に戻さない）。
      // 雲を読まずに済ませた同期（取りに行かない）は読めたうちに入らない（前は空の返りを「雲から読んだ」と見ていた。A6）
      if (!(選び && 選び.取りに行かない) && 雲から読んだか(記録の返り) && 雲から読んだか(部員の返り)) {
        setTimeout(() => {
          状態().名前のずれを直す();
        }, 2000);
      }
    } catch (誤り) {
      console.error('[syncSessions] Error:', 誤り);
      不具合を控える('記録の同期', 誤り);
      書く({ syncStatus: '同期エラー' });
      if (入り直せば直るか(誤り) && !状態().出ている途中)
        書く({ 再ログインの案内: 入り直しの案内, 入り直しが要る: !状態().入り直しをあとに });
    } finally {
      場.同期している = false;
    }
  },
  // 設定の「クラウドへ同期」の行は 2026-11-13 に消した（本人。全件を書き直すので全員の端末が読み直し、
  // ほかの端末の新しい直しを古い中身で上書きしえた）。画面からは呼ばれない。ふだんの送りは syncSessions
  syncAllToCloud: async () => {
    行動を控える('クラウドへ同期', (状態().sessions || []).length + '件');
    const { activeGroupId, activeRole, isNetworkOnline } = 状態();
    if (!activeGroupId || !isNetworkOnline) return;
    // 名簿や設定まで丸ごと書くので、団体アカウントだけ
    if (activeRole === 'member') {
      console.log('[Store] Member role: syncAllToCloud is strictly restricted.');
      return;
    }
    console.log('[Store] Loading:', 'クラウドへの同期を開始...');
    書く({ syncStatus: '同期中' });
    try {
      const 写す = (値) => JSON.parse(JSON.stringify(値));
      // 更新日時はサーバーの時刻で付ける（ほかの書き込みと同じ）。端末の時計の数で
      // 書くと、差分の同期（日時型で問い合わせる）に当たらず、ほかの端末へ届かない。
      // 写す（JSON）を通すと印が壊れるので、写したあとに付ける
      const サーバーの時刻で = (中身) =>
        Object.assign(写す(中身), { lastModified: Firestore.serverTimestamp() });
      const 書き込み = [];
      // 送る時点の更新日時を控えておく。送り終えたあとに照合して、
      // 送っている最中の編集に「同期済み」を付けないようにする（送った版に印を付ける）
      const 送った記録 = 送った版の表(状態().sessions || []);
      const 送った名簿 = 送った版の表(状態().members || []);
      const 送った卒業生 = 送った版の表(状態().alumni || []);
      状態().members.forEach((部員) => {
        if (部員 && 部員.id) {
          書き込み.push({
            ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員.id),
            data: サーバーの時刻で(名簿へ書く形(部員)),
          });
        }
      });
      状態().alumni.forEach((卒業生) => {
        if (卒業生 && 卒業生.id) {
          書き込み.push({
            ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`, 卒業生.id),
            data: サーバーの時刻で(名簿へ書く形(卒業生)),
          });
        }
      });
      状態().sessions.forEach((記録) => {
        if (記録 && 記録.id) {
          const 送る形 = 雲へ書く記録(サーバーの時刻で(Object.assign({}, 記録, { syncStatus: '同期済み' })));
          書き込み.push({
            ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id),
            data: 送る形,
          });
        }
      });
      状態().trash.forEach((記録) => {
        if (記録 && 記録.id) {
          const 送る形 = 雲へ書く記録(サーバーの時刻で(記録));
          // pendingDelete は端末の中だけの印。クラウドへは持ち込まない
          // （syncSessions の送り直しと同じ扱い）
          delete 送る形.pendingDelete;
          // 捨てた日時は日時型で送る（syncSessions の送り直しと同じ）
          送る形.deletedAt = 送る形.deletedAt
            ? Firestore.Timestamp.fromMillis(同期規則.toMillis(送る形.deletedAt))
            : Firestore.serverTimestamp();
          書き込み.push({
            ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
            data: 送る形,
          });
        }
      });
      書き込み.push({
        ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/config`, 'app_settings'),
        data: {
          currentFreshmanTerm: 状態().currentFreshmanTerm,
          tagTemplates: 状態().tagTemplates,
          lastPromotionYear: 状態().lastPromotionYear,
          lastModified: Firestore.serverTimestamp(),
        },
        // 重ねて書く。上書きすると、ここで送らない順位の基準や自動進級の設定が消える
        重ねる: true,
      });
      const 一括の上限 = 400;
      for (let 頭 = 0; 頭 < 書き込み.length; 頭 += 一括の上限) {
        const 切れ端 = 書き込み.slice(頭, 頭 + 一括の上限);
        const 一括 = Firestore.writeBatch(Firebaseの器.db);
        切れ端.forEach(({ ref, data, 重ねる }) => {
          if (重ねる) 一括.set(ref, data, { merge: true });
          else 一括.set(ref, data);
        });
        await 一括.commit();
      }
      // 印を付けるのは「送った版」だけ（送った版に印を付ける）
      書く({
        sessions: 送った版に印を付ける(状態().sessions, 送った記録),
        members: 送った版に印を付ける(状態().members, 送った名簿),
        alumni: 送った版に印を付ける(状態().alumni, 送った卒業生),
        syncStatus: '同期済み',
        lastSyncTime: Date.now(),
      });
      console.log('[Store] Loading:', 'クラウドへの送信が完了しました');
    } catch (誤り) {
      console.error('Full Sync Error:', 誤り?.message || 誤り);
      不具合を控える('クラウドへ同期', 誤り);
      書く({ syncStatus: '同期エラー' });
    }
  },
  /** まだ送れていないものの数を数える */
  countUnsynced: () => {
    const 数 = (一覧) =>
      Array.isArray(一覧) ? 一覧.filter((一つ) => 一つ && 一つ.syncStatus === '未同期').length : 0;
    const { sessions, members, alumni, trash } = 状態();
    return 数(sessions) + 数(members) + 数(alumni) + 数(trash);
  },
  /**
   * ログアウトの前に、送れていないものを送り切ろうとする。
   * 残った数を返す。0 なら失われるものは無い。
   *
   * ログアウトすると手元の記録は消える（送れていないものは団体ごとの控えに残す。src/unsentStash.js）。
   * 送れるものはここで送っておく。送信の完了は待たない作りなので、印が「同期済み」に変わるのを
   * 少しの間だけ見張る（最大3秒）。
   */
  flushUnsyncedForLogout: async () => {
    if (状態().countUnsynced() === 0) return 0;
    if (!状態().isNetworkOnline) return 状態().countUnsynced();
    try {
      await 状態().syncSessions();
    } catch (誤り) {
      console.error('[Store] flushUnsyncedForLogout error:', 誤り);
    }
    for (let 回 = 0; 回 < 15; 回++) {
      if (状態().countUnsynced() === 0) return 0;
      await new Promise((解く) => setTimeout(解く, 200));
    }
    return 状態().countUnsynced();
  },
  /**
   * 起動のときの取り込み。前に全件をそろえてから 7 日以内で、端末に控えがあれば、
   * 差分（境目より後に変わった文書）だけを取る。それ以外は全件を取り直す。
   *
   * 全件取得は、記録・メンバー・ゴミ箱・卒業生をすべて読む（大きい団体で 1 回 250 件ほど）。
   * そのあと付ける見張りも、メンバー・ゴミ箱・卒業生を丸ごと読み直すので、起動のたびに
   * 同じものを 2 回読んでいた。差分なら、変わった文書だけで済む。
   * 消えた文書は差分に出てこないが、メンバー・ゴミ箱・卒業生は見張りが丸ごと見ているので
   * 届き、記録は消すときにゴミ箱へ移すので届く（syncRules の 起動のしかた）
   */
  /**
   * 役（config/roles）を雲から読み直す（3 段目・11/20 の見直し）。起動の取り込みの前に呼ぶ。閉じている間に役が
   * 替わっていると、控えの古い役で記録の取り方（直接読む／中継から自分の行だけ）を決めてしまい、新しい決まりに
   * 断られて「ログインし直してください」が出る。読めなければ控えの役で続ける
   */
  役を読み直す: async () => {
    const 団体 = 状態().activeGroupId;
    if (!団体 || 状態().activeRole !== 'member' || !Firebaseの器.db) return;
    try {
      const 返り = await Firestore.getDoc(Firestore.doc(Firebaseの器.db, `groups/${団体}/config`, 'roles'));
      if (状態().activeGroupId !== 団体) return;
      const 中身 = 返り.exists() ? 返り.data() : null;
      書く({ 役の設定: 中身 ? { 役: 中身.役 || {}, 割り当て: 中身.割り当て || {} } : null });
    } catch (誤り) {
      console.warn('[Store] 役を読み直せませんでした（控えの役で続けます）:', 誤り && 誤り.message);
    }
  },
  起動時に取り込む: async () => {
    await 状態().役を読み直す();
    // 送れない（決まりに断られた）印は、起動のたびに外して 1 回だけ送り直す（役が替わって送れるようになっていることがある）
    if ((状態().sessions || []).some((記録) => 記録 && 記録.送れない))
      書く((前) => ({
        sessions: 前.sessions.map((記録) =>
          記録 && 記録.送れない ? Object.assign({}, 記録, { 送れない: false }) : 記録
        ),
      }));
    const 様子 = 状態();
    let しかた = 同期規則.起動のしかた({
      団体: 様子.activeGroupId,
      境目: 様子.雲の境目,
      全部そろえた時刻: 様子.全部そろえた時刻,
      記録の数: (様子.sessions || []).length,
      部員の数: (様子.members || []).length,
    });
    // 記録を直接読めない役なのに、境目を中継でそろえていない（3 段目より前の控え・閉じている間に役が替わった）ときは、
    // 全部を中継から取り直す。差分だけでは、前に届いていたほかの人の行が 7 日ごとの全件まで端末に残る（11/20 の見直し）。
    // 中継が古くて直接そろえたとき（古い中継）は、毎回は取り直さない
    const 取り方 = 様子.雲の境目 && 様子.雲の境目.取り方;
    if (役の決まり.自分の分だけか(様子) && 取り方 !== '中継' && 取り方 !== '古い中継') しかた = '全部';
    if (しかた === '全部') return 状態().fetchAndOverwriteFromCloud();
    // 控えに入りきらず外した記録は、差分に出てこないので id で取り直す（syncSessions が
    // 端末から外した記録 を見て取り直し、雲から取り直せたら空にする）
    const 取り戻す記録 = Array.isArray(様子.端末から外した記録) ? 様子.端末から外した記録 : [];
    console.log(
      '[Store] Loading: 前回からの差分だけを取り込みます' +
        (取り戻す記録.length ? `（控えから外した ${取り戻す記録.length} 件は id で取り直す）` : '')
    );
    await 状態().syncSessions();
    // 差分で取れなかった（通信・権限など）ときは、全件で取り直す。
    // 同じ理由で失敗するなら、全件取得のほうが帯や便りを出す
    if (状態().syncStatus === '同期エラー') return 状態().fetchAndOverwriteFromCloud();
  },
  fetchAndOverwriteFromCloud: async () => {
    console.log('[Store] Loading:', 'クラウドからの取得を開始...');
    書く({ syncStatus: '同期中' });
    const _fetchDb = await waitForDb();
    if (!_fetchDb) {
      console.warn('[Store] fetchAndOverwriteFromCloud: db still undefined after await, aborting');
      // 同期と同じく、黙って終わらせない
      不具合を控える('クラウドから取得', new Error('雲との連絡口が用意できませんでした'));
      書く({ syncStatus: '同期エラー' });
      return;
    }
    try {
      // 始めたときの団体。読み終えたときに団体が変わっていたら、書かずに捨てる（A6。syncSessions と同じ）
      const 始めた団体 = 状態().activeGroupId;
      // 置き場を丸ごと読む。中身は文書の data のまま（記録とゴミ箱は日時を数に直す）
      const 全部読む = async (置き場, 整える = (中身) => 中身) => {
        const 返り = await Firestore.getDocs(
          Firestore.collection(Firebaseの器.db, `groups/${始めた団体}/${置き場}`)
        );
        const 中身たち = [];
        返り.forEach((文書) => 中身たち.push(整える(文書.data())));
        return [返り, 中身たち];
      };
      // 3 段目：記録を直接読めない役（部員（自分））は、記録を中継から自分の行だけ受け取り、ゴミ箱は読まない（11/19 本人）。
      // 中継が古い（/jibun が無い）ときは前の道（直接読む）
      let 中継の答え = null;
      let 中継が古い = false;
      if (役の決まり.自分の分だけか(状態())) {
        中継の答え = await 自分の記録.中継から取る({ 団体: 始めた団体, 形: '全部' });
        if (中継の答え.古い中継) {
          中継の答え = null;
          中継が古い = true;
        }
      }
      const [部員の返り, 部員] = await 全部読む('members');
      const [記録の返り, 記録] = 中継の答え
        ? [自分の記録.返りの形(中継の答え.記録たち), 中継の答え.記録たち.map(記録の日時を数に)]
        : await 全部読む('sessions', 記録の日時を数に);
      console.log('[Store] Loading:', `セッション ${記録.length}件を取得しました`);
      const [ごみ箱の返り, 雲のごみ箱] = 中継の答え
        ? [自分の記録.返りの形([]), []]
        : await 全部読む('trash', 記録の日時を数に);
      const [卒業生の返り, 卒業生] = await 全部読む('alumni');
      const 設定の帳面 = await Firestore.getDoc(
        Firestore.doc(Firebaseの器.db, `groups/${始めた団体}/config`, 'app_settings')
      );
      if (状態().activeGroupId !== 始めた団体) {
        console.warn('[Store] 取り込みの途中で団体が変わったので、取り込んだものは捨てます');
        return;
      }
      let currentFreshmanTerm = 状態().currentFreshmanTerm;
      let tagTemplates = 状態().tagTemplates;
      let lastPromotionYear = 状態().lastPromotionYear;
      // 学年まわり（団体の種類・進級の確認・期を使う。src/gakunen.js の 設定から読む）
      let 学年まわり = {};
      if (設定の帳面.exists()) {
        const 設定 = 設定の帳面.data();
        if (設定) {
          if (設定.currentFreshmanTerm !== undefined) {
            currentFreshmanTerm = 設定.currentFreshmanTerm;
          }
          if (設定.tagTemplates !== undefined) {
            tagTemplates = 設定.tagTemplates;
          }
          if (設定.lastPromotionYear !== undefined) {
            lastPromotionYear = 設定.lastPromotionYear;
          }
          学年まわり = 学.設定から読む(設定);
        }
      }
      // 雲に無いものを手元から外す（purge）のは、雲から全件を読めたときだけ。
      // 電波が無いと Firestore は端末の控え（見張っていた直近の分だけ）から答えるので、
      // 外すと控えに無い古い記録が手元から消え、差分の同期では戻らなかった（Gemini の見直し）
      const 記録の合流 = mergeById(状態().sessions, 記録, false, 雲から読んだか(記録の返り));
      const 部員の合流 = mergeById(状態().members, 部員, false, 雲から読んだか(部員の返り));
      const ごみ箱の合流 = mergeById(状態().trash, 雲のごみ箱, false, 雲から読んだか(ごみ箱の返り));
      // ゴミ箱に入っているものは履歴に出さない。削除がまだクラウドへ届いて
      // いないとき、ここで書き戻すと記録が復活してしまう。
      // 逆に、戻したばかりでまだ送信できていない記録は、クラウドのゴミ箱の
      // 写しがあってもゴミ箱に入れ直さない。
      const 復元待ち = new Set(
        記録の合流
          .filter((記録1件) => 記録1件 && 記録1件.syncStatus === '未同期')
          .map((記録1件) => 記録1件.id)
      );
      const ごみ箱 = ごみ箱の合流.filter((記録1件) => 記録1件 && !復元待ち.has(記録1件.id));
      const ごみ箱のID = new Set(ごみ箱.map((記録1件) => 記録1件.id));
      const 残る記録 = 記録の合流.filter((記録1件) => 記録1件 && !ごみ箱のID.has(記録1件.id));
      // 完全に消したものの後始末。ここは記録もゴミ箱も全件そろっているので、
      // クラウドから本当に消えたかを正しく判定できる。
      //   ・まだ残っている → 消し直して控えは残す
      //   ・もう無い       → 消し終わったので控えから外す
      //   ・30日を過ぎた   → 手放す（控えが際限なく増えないように）
      const 控え = 状態().permanentlyDeleted || {};
      const 控えのid = Object.keys(控え);
      let 完全削除ずみ = new Set(控えのid);
      // 端末の控えからの答えでは「もう無い」と決められない。そのときは控えを整理しない
      if (控えのid.length > 0 && 雲から読んだか(記録の返り) && 雲から読んだか(ごみ箱の返り)) {
        const 期限 = Date.now() - 消した控えを持つ長さ;
        const クラウドに有る = new Set(
          [...記録, ...雲のごみ箱].filter((記録1件) => 記録1件 && 記録1件.id).map((記録1件) => 記録1件.id)
        );
        const 消し直す = 控えのid.filter((id) => 控え[id] >= 期限 && クラウドに有る.has(id));
        const 残す = {};
        消し直す.forEach((id) => {
          残す[id] = 控え[id];
        });
        完全削除ずみ = new Set(消し直す);
        if (消し直す.length !== 控えのid.length)
          console.log(`[Store] 完全削除の控えを整理: ${控えのid.length}件 → ${消し直す.length}件`);
        // 消し直すのは消せる人だけ（団体の口座と、役に「消す」のある個人ログイン。決まりと同じ）
        if (消し直す.length > 0 && 役の決まり.できるか(状態(), '記録を消す')) {
          console.log(`[Store] クラウドに残っている ${消し直す.length}件 を消し直します`);
          try {
            const 一括 = Firestore.writeBatch(Firebaseの器.db);
            消し直す.forEach((id) => {
              一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, id));
              一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, id));
            });
            一括.commit().catch((誤り) => {
              console.error('[Store] 完全削除の送り直しに失敗:', 誤り);
            });
          } catch (誤り) {
            console.error('[Store] 完全削除の送り直しの組み立てに失敗:', 誤り);
          }
        }
        書く({ permanentlyDeleted: 残す });
      }
      // 消したメンバーの控えも同じように整理する。
      //   ・まだクラウドに残っている → 消し直して控えは残す
      //   ・もう無い                 → 消し終わったので控えから外す
      //   ・30日を過ぎた             → 手放す
      const メンバーの控え = 状態().deletedMembers || {};
      const メンバーの控えのid = Object.keys(メンバーの控え);
      let 削除ずみのメンバー = new Set(メンバーの控えのid);
      if (メンバーの控えのid.length > 0 && 雲から読んだか(部員の返り)) {
        const 期限 = Date.now() - 消した控えを持つ長さ;
        const クラウドに有る = new Set(
          (部員 || []).filter((部員1人) => 部員1人 && 部員1人.id).map((部員1人) => 部員1人.id)
        );
        const 消し直す = メンバーの控えのid.filter(
          (id) => メンバーの控え[id] >= 期限 && クラウドに有る.has(id)
        );
        const 残す = {};
        消し直す.forEach((id) => {
          残す[id] = メンバーの控え[id];
        });
        削除ずみのメンバー = new Set(消し直す);
        // 名簿を消すのも、メンバーを管理できる人だけ（決まりと同じ）
        if (消し直す.length > 0 && 役の決まり.できるか(状態(), 'メンバーを管理する')) {
          console.log(`[Store] クラウドに残っているメンバー ${消し直す.length}件 を消し直します`);
          try {
            const 一括 = Firestore.writeBatch(Firebaseの器.db);
            消し直す.forEach((id) => {
              一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, id));
            });
            一括.commit().catch((誤り) => {
              console.error('[Store] メンバーの削除の送り直しに失敗:', 誤り);
            });
          } catch (誤り) {
            console.error('[Store] メンバーの削除の送り直しの組み立てに失敗:', 誤り);
          }
        }
        書く({ deletedMembers: 残す });
      }
      書く({
        members: 部員の合流.filter((部員1人) => 部員1人 && !削除ずみのメンバー.has(部員1人.id)),
        sessions: 残る記録.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
        trash: ごみ箱.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)),
        alumni: mergeById(状態().alumni, 卒業生, false, 雲から読んだか(卒業生の返り)),
        currentFreshmanTerm,
        tagTemplates,
        lastPromotionYear,
        ...学年まわり,
        syncStatus: '同期済み',
        lastSyncTime: Date.now(),
        // 4 つとも雲から全件を読んだときだけ、境目を決め直し、全部そろえたことにする
        // （差分の同期と起動の判断に使う）。電波が無く端末の控えから答えたときは触らない
        ...([記録の返り, 部員の返り, ごみ箱の返り, 卒業生の返り].every(雲から読んだか)
          ? {
              雲の境目: {
                団体: 状態().activeGroupId,
                // どの道でそろえたか。記録を直接読めない役で '中継' でなければ、次の起動で全部を中継から取り直す
                取り方: 中継の答え ? '中継' : 中継が古い ? '古い中継' : '直接',
                記録: 中継の答え
                  ? 中継の答え.境目.記録
                  : 同期規則.境目を進める(0, 読んだままの中身(記録の返り)),
                部員: 同期規則.境目を進める(0, 読んだままの中身(部員の返り)),
                ごみ箱: 中継の答え
                  ? 中継の答え.境目.ごみ箱
                  : 同期規則.境目を進める(0, 読んだままの中身(ごみ箱の返り)),
                卒業生: 同期規則.境目を進める(0, 読んだままの中身(卒業生の返り)),
              },
              全部そろえた時刻: Date.now(),
              端末から外した記録: [],
            }
          : {}),
      });
      console.log('[Store] Loading:', '同期が完了しました');
    } catch (誤り) {
      console.error('Fetch Overwrite Error:', 誤り);
      不具合を控える('クラウドから取得', 誤り);
      書く({ syncStatus: '同期エラー' });
      if (入り直せば直るか(誤り) && !状態().出ている途中)
        書く({ 再ログインの案内: 入り直しの案内, 入り直しが要る: !状態().入り直しをあとに });
    }
  },

  listenToSessions: async () => {
    const { activeGroupId: 団体 } = 状態();
    if (!団体) return;
    const _sessDb = await waitForDb();
    if (!_sessDb) {
      console.warn('[Store] listenToSessions: db still undefined after await, aborting');
      return;
    }
    状態().stopListeningToSessions();
    // 記録を直接読めない役は、記録の代わりに「記録が変わった印」を見張る（3 段目）
    if (役の決まり.自分の分だけか(状態())) return 状態().記録の印を見張る();
    console.log('[Store] Starting real-time session listener');
    const 記録の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/sessions`);
    // 見張るのは直近 30 日の記録だけ（古い記録は 7 日ごとの全件のそろえ直しで届く）
    const 見張る始まり = Date.now() - 30 * 24 * 60 * 60 * 1000;
    // 雲の date は数から日時型へ移している途中（2026-09-24〜）。範囲の問い合わせは
    // 同じ型の値にしか当たらないので、数と日時型の両方で絞る。数だけで絞ると、
    // 日時型になった記録が 1 件も届かず、画面から消える
    const 問い = Firestore.query(
      記録の置き場,
      Firestore.or(
        Firestore.where('date', '>', 見張る始まり),
        Firestore.where('date', '>', Firestore.Timestamp.fromMillis(見張る始まり))
      ),
      Firestore.orderBy('date', 'desc'),
      Firestore.limit(100)
    );
    const 止める = Firestore.onSnapshot(
      問い,
      (返り) => {
        const 雲の記録 = [];
        返り.forEach((文書) => {
          const 中身 = 記録の日時を数に(文書.data());
          // 雲のタグを直すのは syncSessions の側だけ（ここは手元で整えて受け取る）
          const { タグ: cleanedTags } = タグを整える(中身);
          雲の記録.push(
            Object.assign({}, 中身, {
              id: 文書.id,
              tags: cleanedTags,
              // tags と同じように、ここで形を整えてから渡す
              archers: 記録の射手を整える(中身),
              syncStatus: 文書.metadata && 文書.metadata.hasPendingWrites ? '未同期' : '同期済み',
            })
          );
        });
        const 手元の記録 = 状態().sessions;
        const 雲にあるID = new Set(雲の記録.map((記録1件) => 記録1件.id));
        const merged = 雲の記録.map((cloudSession) => {
          const pendingTimer = 状態()._pendingUpdateTimers[cloudSession.id];
          const localSession = 手元の記録.find((記録1件) => 記録1件 && 記録1件.id === cloudSession.id);
          // 送信待ちの編集は、クラウドの古い写しで上書きしない。タイマーが動いて
          // いる 800ms の間だけでなく、送信が済むまで（「未同期」の間）守る。
          if (localSession && (pendingTimer || localSession.syncStatus === '未同期')) return localSession;
          return cloudSession;
        });
        // 見張りが受け取るのは直近30日・最大100件だけ。手元にあってその中に無い記録は、
        // 見張りの窓の外なので届かないだけのことが多い。だから見張りでは落とさない
        // （一律に落としていたころは、30日を過ぎた記録が見張りが動くたびに履歴から消えた）。
        // 雲で消えたことは、ゴミ箱へ移ったこと（ゴミ箱の見張りが履歴から外す）と、
        // 7 日ごとの全件のそろえ直し（起動時に取り込む）で届く。
        // 前は「雲に在った印（serverCreatedTime）があり窓の中なら落とす」分岐があったが、
        // その印をどこでも付けておらず、働いていなかった（2026-09-24 に片付けた）
        const 手元だけの記録 = 手元の記録.filter((記録1件) => !雲にあるID.has(記録1件.id));
        // 完全に消したものは、クラウドにまだ残っていても画面に出さない
        const 完全削除ずみ = new Set(Object.keys(状態().permanentlyDeleted || {}));
        const 並べた記録 = [...merged, ...手元だけの記録].filter(
          (記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id)
        );
        並べた記録.sort((甲, 乙) => (乙.date || 0) - (甲.date || 0));
        // 同じ中身なら書かない。書くと画面ぜんぶの描き直しと端末への控えの
        // 書き直し（大きい団体で 2MB）が走る。起動時は直前の全件取得と同じものが届く
        if (同期規則.一覧が同じか(手元の記録, 並べた記録) && 状態().syncStatus === '同期済み') {
          console.log(`[Store] Real-time session update received: ${雲の記録.length} items (no change)`);
          return;
        }
        書く({ sessions: 並べた記録, syncStatus: '同期済み', lastSyncTime: Date.now() });
        console.log(
          `[Store] Real-time session update received: ${雲の記録.length} items (reflected deletions)`
        );
      },
      (誤り) => {
        console.error('[Store] Real-time session listener error:', 誤り);
        不具合を控える('記録の受信', 誤り);
        書く({ syncStatus: '同期エラー' });
        if (入り直せば直るか(誤り) && !状態().出ている途中)
          書く({ 再ログインの案内: 入り直しの案内, 入り直しが要る: !状態().入り直しをあとに });
      }
    );
    書く({ sessionUnsubscribe: 止める });
  },
  /**
   * 記録が変わった印を見張る（3 段目・11/19 本人「すぐ届く」）。記録を直接読めない役の端末で、記録の見張りの代わりに使う。
   * 印（groups/{団体}/changes/sessions の at。書くのは src/storeShared.js）が進んだら、ほかの端末が記録かゴミ箱を
   * 書いたので中継から取り直す。アプリに戻ったときも取り直す（中継から取り直す が 10 秒に 1 回までにまとめる）。
   * 止めるのは stopListeningToSessions（同じ止め口に置く）
   */
  記録の印を見張る: () => {
    const 団体 = 状態().activeGroupId;
    if (!団体 || !Firebaseの器.db) return;
    console.log('[Store] 記録が変わった印を見張ります（記録は中継から取ります）');
    let 前の時刻 = null;
    const 印を止める = Firestore.onSnapshot(
      Firestore.doc(Firebaseの器.db, `groups/${団体}/changes`, 'sessions'),
      (返り) => {
        if (状態().activeGroupId !== 団体) return;
        const 中身 = 返り.exists() ? 返り.data() : null;
        const 印 = 中身 && 中身.at;
        // この端末が書いて届く前の印は時刻が無い（0）。届いたあとの印で取り直す
        const 時刻 = 印 && typeof 印.toMillis === 'function' ? 印.toMillis() : 0;
        // 最初の 1 回は、最後に同期したあとに印が進んでいたら取り直す（起動の取り込みと見張りを付けるまでの間に、
        // ほかの端末が保存したとき。11/20 の見直し）
        const 前 = 前の時刻 !== null ? 前の時刻 : 状態().lastSyncTime || 0;
        if (時刻 > 前) 中継から取り直す(状態);
        前の時刻 = Math.max(前の時刻 || 0, 時刻);
      },
      // 印の決まりを配る前は読めない。開いた・戻った・引いたときには取るので、黙って続ける
      (誤り) => console.warn('[Store] 記録が変わった印を見張れません:', 誤り && 誤り.message)
    );
    // アプリに戻ったら取り直す
    const 戻ったら = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      中継から取り直す(状態);
    };
    const 外すもの = [];
    try {
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('visibilitychange', 戻ったら);
        外すもの.push(() => document.removeEventListener('visibilitychange', 戻ったら));
      } else {
        const AppState = require('react-native').AppState;
        const 手 =
          AppState && AppState.addEventListener
            ? AppState.addEventListener('change', (様子) => 様子 === 'active' && 戻ったら())
            : null;
        if (手 && 手.remove) 外すもの.push(() => 手.remove());
      }
    } catch {
      /* 戻ったことが分からない場でも、印と引いて更新では取れる */
    }
    書く({
      sessionUnsubscribe: () => {
        印を止める();
        外すもの.forEach((外す) => 外す());
        if (場.記録の取り直し待ち) clearTimeout(場.記録の取り直し待ち);
        場.記録の取り直し待ち = null;
      },
    });
  },
  /**
   * 役が替わって記録の取り方（直接読む／中継から自分の行だけ）が変わったら、見張りを付け直して全部取り直す（3 段目）。
   * 全員を見る役になったら雲から全部、自分の分だけになったら中継の答えで置き換える（ほかの人の行を手元に残さない）
   */
  記録の取り方を役に合わせる: () => {
    if (!状態().activeGroupId) return;
    状態().stopListeningToSessions();
    状態().stopListeningToTrash();
    状態().listenToSessions();
    状態().listenToTrash();
    return 状態().fetchAndOverwriteFromCloud();
  },
  stopListeningToSessions: () => {
    const { sessionUnsubscribe } = 状態();
    if (sessionUnsubscribe) {
      console.log('[Store] Stopping real-time session listener');
      sessionUnsubscribe();
      書く({ sessionUnsubscribe: null });
    }
  },
  listenToTrash: async () => {
    const { activeGroupId: 団体 } = 状態();
    if (!団体) return;
    const _trashDb = await waitForDb();
    if (!_trashDb) {
      console.warn('[Store] listenToTrash: db still undefined after await, aborting');
      return;
    }
    状態().stopListeningToTrash();
    // 記録を直接読めない役は、ゴミ箱を読まない（3 段目。ほかの人の記録が入っている）
    if (役の決まり.自分の分だけか(状態())) return;
    console.log('[Store] Starting real-time trash listener');
    const ごみ箱の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/trash`);
    // 見張るのは 200 件まで（読みの無料枠を守る）。上限に届いたときは途中までの一覧なので、手元のゴミ箱を
    // 一覧で置き換えない（前は置き換えていて、200 件を超える団体では、差分の同期で届いた新しく捨てた記録が
    // 見張りのたびにゴミ箱から消えた。A6）。全部そろえるのは 7 日ごとの全件の取り直し
    const 見張る上限 = 200;
    const 問い = Firestore.query(ごみ箱の置き場, Firestore.limit(見張る上限));
    const 止める = Firestore.onSnapshot(
      問い,
      (返り) => {
        const 雲のごみ箱 = [];
        返り.forEach((文書) => {
          const 中身 = 記録の日時を数に(文書.data());
          雲のごみ箱.push(
            Object.assign({}, 中身, {
              id: 文書.id,
              syncStatus: 文書.metadata && 文書.metadata.hasPendingWrites ? '未同期' : '同期済み',
            })
          );
        });
        // 手元で捨てた印は、送信が終わるまで持ち越す。クラウドの写しには
        // この印が無いので、そのまま置き換えると数百msで消えてしまい、
        // あとで送信が失われても送り直せなくなる。
        // 写しの syncStatus が「同期済み」＝送信が終わった、なので落とす。
        const 手元のゴミ箱 = new Map(
          (状態().trash || [])
            .filter((記録1件) => 記録1件 && 記録1件.id)
            .map((記録1件) => [記録1件.id, 記録1件])
        );
        const 写し = 雲のごみ箱.map((記録) => {
          const 手元の = 手元のゴミ箱.get(記録.id);
          return 手元の && 手元の.pendingDelete && 記録.syncStatus === '未同期'
            ? Object.assign({}, 記録, { pendingDelete: true })
            : 記録;
        });
        // まだ送れていない削除は、クラウドの写しに無くても残す。ここで
        // 消すと送り直しの対象から外れ、次の全件取得で記録が復活する。
        const クラウドのid = new Set(写し.map((記録1件) => 記録1件.id));
        const 未送信の削除 = (状態().trash || []).filter(
          (記録1件) =>
            記録1件 &&
            記録1件.id &&
            記録1件.pendingDelete &&
            記録1件.syncStatus === '未同期' &&
            !クラウドのid.has(記録1件.id)
        );
        const 途中まで = 雲のごみ箱.length >= 見張る上限;
        const 新しいゴミ箱 = 途中まで
          ? [
              ...写し,
              ...(状態().trash || []).filter(
                (記録1件) => 記録1件 && 記録1件.id && !クラウドのid.has(記録1件.id)
              ),
            ]
          : 未送信の削除.length > 0
            ? [...写し, ...未送信の削除]
            : 写し;
        新しいゴミ箱.sort((甲, 乙) => trashedAtMillis(乙) - trashedAtMillis(甲));
        // 戻したばかりでまだ送れていない記録は、クラウドのゴミ箱に写しが
        // あっても履歴から外さない。外すと復元が取り消されて見える。
        // 完全に消したものは、クラウドにまだ残っていても画面に出さない
        const 完全削除ずみ = new Set(Object.keys(状態().permanentlyDeleted || {}));
        const 出すゴミ箱 = 新しいゴミ箱.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id));
        const 捨てたid = new Set(出すゴミ箱.map((記録1件) => 記録1件.id));
        const 残す = 状態().sessions.filter(
          (記録1件) => 記録1件 && (!捨てたid.has(記録1件.id) || 記録1件.syncStatus === '未同期')
        );
        const 残す記録 = 残す.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id));
        if (
          同期規則.一覧が同じか(状態().trash, 出すゴミ箱) &&
          同期規則.一覧が同じか(状態().sessions, 残す記録)
        ) {
          console.log(`[Store] Real-time trash update received: ${雲のごみ箱.length} items (no change)`);
          return;
        }
        書く({ trash: 出すゴミ箱, sessions: 残す記録 });
        console.log(
          `[Store] Real-time trash update received: ${雲のごみ箱.length} items (purged from sessions)`
        );
      },
      (誤り) => {
        console.error('[Store] Real-time trash listener error:', 誤り);
      }
    );
    書く({ trashUnsubscribe: 止める });
  },
  stopListeningToTrash: () => {
    const { trashUnsubscribe } = 状態();
    if (trashUnsubscribe) {
      console.log('[Store] Stopping real-time trash listener');
      trashUnsubscribe();
      書く({ trashUnsubscribe: null });
    }
  },
  listenToMembers: async () => {
    const { activeGroupId: 団体 } = 状態();
    if (!団体) return;
    const _membDb = await waitForDb();
    if (!_membDb) {
      console.warn('[Store] listenToMembers: db still undefined after await, aborting');
      return;
    }
    状態().stopListeningToMembers();
    console.log('[Store] Starting real-time member listener');
    const 部員の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/members`);
    const 止める = Firestore.onSnapshot(
      部員の置き場,
      (返り) => {
        const 雲の部員 = [];
        返り.forEach((文書) => {
          const 中身 = 文書.data();
          雲の部員.push(Object.assign({}, 中身, { id: 文書.id, syncStatus: '同期済み' }));
        });
        // 消したのにクラウドへ届いていないメンバーは、受け取っても戻さない
        const 削除ずみ = new Set(Object.keys(状態().deletedMembers || {}));
        // 端末の控え（fromCache）から来た一覧は途中までのことがある。そのときは「雲に無い」を理由に消さない。
        // 個人ログインの「自分の情報」が一瞬「読み込んでいます」に戻った（2026-10-24、E2E で 5 回に 1 回）
        const 控えからか = !!(返り.metadata && 返り.metadata.fromCache);
        const 合流した = mergeById(状態().members, 雲の部員, false, !控えからか).filter(
          (部員1人) => 部員1人 && !削除ずみ.has(部員1人.id)
        );
        if (同期規則.一覧が同じか(状態().members, 合流した)) {
          console.log(`[Store] Real-time member update received: ${雲の部員.length} items (no change)`);
          return;
        }
        書く({ members: 合流した, lastSyncTime: Date.now() });
        console.log(`[Store] Real-time member update received: ${雲の部員.length} items`);
      },
      (誤り) => {
        console.error('[Store] Real-time member listener error:', 誤り);
      }
    );
    書く({ memberUnsubscribe: 止める });
  },
  stopListeningToMembers: () => {
    const { memberUnsubscribe } = 状態();
    if (memberUnsubscribe) {
      console.log('[Store] Stopping real-time member listener');
      memberUnsubscribe();
      書く({ memberUnsubscribe: null });
    }
  },
  listenToAlumni: async () => {
    const { activeGroupId: 団体 } = 状態();
    if (!団体) return;
    const _alumDb = await waitForDb();
    if (!_alumDb) {
      console.warn('[Store] listenToAlumni: db still undefined after await, aborting');
      return;
    }
    状態().stopListeningToAlumni();
    console.log('[Store] Starting real-time alumni listener');
    const 卒業生の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/alumni`);
    const 止める = Firestore.onSnapshot(
      卒業生の置き場,
      (返り) => {
        const 雲の卒業生 = [];
        返り.forEach((文書) => {
          const 中身 = 文書.data();
          雲の卒業生.push(Object.assign({}, 中身, { id: 文書.id, syncStatus: '同期済み' }));
        });
        // 端末の控え（fromCache）から来た一覧は途中までのことがある。名簿の見張りと同じく、そのときは消さない
        const 控えからか = !!(返り.metadata && 返り.metadata.fromCache);
        const 合流した = mergeById(状態().alumni, 雲の卒業生, false, !控えからか);
        if (同期規則.一覧が同じか(状態().alumni, 合流した)) {
          console.log(`[Store] Real-time alumni update received: ${雲の卒業生.length} items (no change)`);
          return;
        }
        書く({ alumni: 合流した, lastSyncTime: Date.now() });
        console.log(`[Store] Real-time alumni update received: ${雲の卒業生.length} items`);
      },
      (誤り) => {
        console.error('[Store] Real-time alumni listener error:', 誤り);
      }
    );
    書く({ alumniUnsubscribe: 止める });
  },
  stopListeningToAlumni: () => {
    const { alumniUnsubscribe } = 状態();
    if (alumniUnsubscribe) {
      console.log('[Store] Stopping real-time alumni listener');
      alumniUnsubscribe();
      書く({ alumniUnsubscribe: null });
    }
  },
  startPeriodicSync: () => {
    状態().stopPeriodicSync();
    console.log('[Store] Starting sync (Real-time listeners + 5min config sync)');
    状態().listenToConfig();
    状態().listenToSessions();
    状態().listenToTrash();
    状態().listenToMembers();
    状態().listenToAlumni();
    // 直前の fetchAndOverwriteFromCloud で全部取っていて、見張りもいま付けた。
    // ここでは送り直しだけ（取りに行かない）。5 分ごとのほうは取りに行く
    //（見張りが黙って切れたときの保険）
    状態().syncSessions({ 取りに行かない: true });
    // 記録を直接読めない役は、5 分ごとには中継を呼ばない（取るのは開いた・戻った・引いた・記録が変わった印のとき。
    // 11/19 本人）。名簿の差分と送り直しはする
    const 時計 = setInterval(() => {
      状態().syncSessions(役の決まり.自分の分だけか(状態()) ? { 記録は取らない: true } : undefined);
    }, 3e5);
    書く({ syncIntervalId: 時計 });
  },
  stopPeriodicSync: () => {
    const 時計 = 状態().syncIntervalId;
    if (時計) {
      console.log('[Store] Stopping periodic sync');
      clearInterval(時計);
      書く({ syncIntervalId: null });
    }
    状態().stopListeningToSessions();
    状態().stopListeningToTrash();
    状態().stopListeningToMembers();
    状態().stopListeningToAlumni();
  },
  setupNetworkListener: () => {
    console.log('[Store] Setting up network listener');
    return netinfo.addEventListener((様子) => {
      const 前はつながっていた = 状態().isNetworkOnline;
      const つながっている = !(!様子.isConnected || 様子.isInternetReachable === false);
      if (つながっている !== 前はつながっていた) {
        console.log('[Store] Network state changed: ' + (つながっている ? 'Online' : 'Offline'));
        書く({ isNetworkOnline: つながっている });
        if (つながっている && !前はつながっていた) {
          console.log('[Store] Connection restored. Triggering auto-sync...');
          // 電波が切れている最中にこそ失敗するので、戻ったときに出し直す。
          // 便りの仕組みが転んでも、自動同期まで巻き添えにしない
          溜まりを流し直す();
          状態()
            .syncSessions()
            .catch((誤り) => console.error('[Store] Auto-sync failed:', 誤り));
        }
      }
    });
  },
});

module.exports = { 同期の操作 };
