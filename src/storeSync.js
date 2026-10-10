'use strict';

/**
 * 店の操作のうち、雲（Firestore）との同期と購読：差分の同期・まとめて送る・ログアウト前に送り切る・起動時の取り込み・
 * まとめて取り直す、記録・ゴミ箱・名簿・卒業生の購読、定期の同期、通信の見張り。
 * （2026-10-05 に useScoreStore.js から分けた。中身は変えていない。店の名指しは 場.店 にした）
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
} = require('./storeShared');

const 同期の操作 = (書く, 状態, そのまま書く) => ({
  /**
   * 雲と突き合わせて、まだ送れていないものを送り直す。
   * @param {{取りに行かない?: boolean}} [選び] 取りに行かない … 雲から取らず、送り直しだけ。
   *   起動時は直前に fetchAndOverwriteFromCloud が全部取っていて、見張りも
   *   これから届くので、ここでもう一度取るのは同じものを 3 回読むことになる
   */
  // 上から引っ張って更新（src/hikiOroshi.js）。送っていない記録を送り、ほかの端末の変更（記録・名簿・ゴミ箱・卒業生）を取る
  雲から取り直す: async () => {
    行動を控える('引いて更新', '');
    await 状態().syncSessions();
  },
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
    if ((await 状態().checkAndAutoIncrementGrades(), 場.進級の確認を済ませた))
      return void console.log('[syncSessions] Already syncing, skipping...');
    場.進級の確認を済ませた = true;
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
      // この関数の後ろで局所的な M を宣言しているため、下の forEach の中で
      // M.getState() を呼ぶと「初期化前の参照」で例外になり、同期が丸ごと
      // 止まる。団体IDはここで控えておく。
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
      if (選び && 選び.取りに行かない) {
        記録の返り = 部員の返り = ごみ箱の返り = 卒業生の返り = 空;
      } else if (差分で取れるか) {
        // 集まりごとの境目より後に変わった文書だけを取る（境目の決め方は syncRules の 境目を進める）。
        // 境目は日時型で渡す。Firestore の範囲の問い合わせは同じ型の値にしか当たらず、
        // 数で渡すと serverTimestamp で書いた lastModified（日時型）の文書が 1 件も返らない。
        // 2026-08-03 に書き込みを serverTimestamp へ移してから、ここは何も取ってこなかった
        //（見張りが代わりに届けていたので気づかなかった。2026-09-24 に本番で確かめて直した）。
        // 境目ちょうど（>=）から取る。同じ時刻の書き込みを取りこぼさないためで、読み直すのは
        // 境目と同じ時刻の文書だけ（前は 10 秒の余裕を取り、その間の文書を毎回読み直していた）
        const 基準 = (種) => Firestore.Timestamp.fromMillis(Math.max(0, 始めの境目[種] || 0));
        記録の返り = await Firestore.getDocs(
          Firestore.query(記録の置き場, Firestore.where('lastModified', '>=', 基準('記録')))
        );
        // 境目は差分の問い合わせの結果だけで決める（id で取った分は数えない）
        const 取り直し = await idで記録を取る(記録の置き場, 取り戻す記録);
        取り戻した記録 = 取り直し.文書たち;
        雲から取り戻せた = 取り直し.雲から;
        部員の返り = await Firestore.getDocs(
          Firestore.query(部員の置き場, Firestore.where('lastModified', '>=', 基準('部員')))
        );
        ごみ箱の返り = await Firestore.getDocs(
          Firestore.query(ごみ箱の置き場, Firestore.where('lastModified', '>=', 基準('ごみ箱')))
        );
        卒業生の返り = await Firestore.getDocs(
          Firestore.query(卒業生の置き場, Firestore.where('lastModified', '>=', 基準('卒業生')))
        );
      } else {
        記録の返り = await Firestore.getDocs(
          Firestore.query(記録の置き場, Firestore.orderBy('date', 'desc'), Firestore.limit(100))
        );
        部員の返り = await Firestore.getDocs(部員の置き場);
        ごみ箱の返り = await Firestore.getDocs(ごみ箱の置き場);
        卒業生の返り = await Firestore.getDocs(卒業生の置き場);
      }
      let 最新の時刻 = 前回の同期時刻;
      const ミリ秒にする = (値) => (値?.toMillis ? 値.toMillis() : 値 || 0);
      const 雲の記録 = [];
      // 差分（か全件）で届いた記録と、id で取り直した記録。同じ id は差分の方を使う
      const 取り込む記録 = [];
      const 届いたid = new Set();
      記録の返り.forEach((文書) => (取り込む記録.push(文書), 届いたid.add(文書.id)));
      for (const 文書 of 取り戻した記録) if (!届いたid.has(文書.id)) 取り込む記録.push(文書);
      取り込む記録.forEach((文書) => {
        const 中身 = 記録の日時を数に(文書.data());
        const 更新時刻 = ミリ秒にする(中身.lastModified);
        更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
        const cleanedTags =
          中身.tags && Array.isArray(中身.tags)
            ? Array.from(new Set(中身.tags.map(normalizeTag).filter(Boolean)))
            : [];
        const originalTags = 中身.tags || [];
        const isModified =
          cleanedTags.length !== originalTags.length ||
          cleanedTags.some((タグ, 番) => タグ !== originalTags[番]);
        if (isModified && Firebaseの器.db && 団体ID) {
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
      const 雲の部員 = [];
      部員の返り.forEach((文書) => {
        const 中身 = 文書.data();
        const 更新時刻 = ミリ秒にする(中身.lastModified);
        更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
        雲の部員.push(
          Object.assign({}, 中身, { id: 文書.id, lastModified: 更新時刻, syncStatus: '同期済み' })
        );
      });
      const 雲のごみ箱 = [];
      ごみ箱の返り.forEach((文書) => {
        const 中身 = 記録の日時を数に(文書.data());
        const 更新時刻 = ミリ秒にする(中身.lastModified);
        更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
        雲のごみ箱.push(
          Object.assign({}, 中身, { id: 文書.id, lastModified: 更新時刻, syncStatus: '同期済み' })
        );
      });
      const 雲の卒業生 = [];
      卒業生の返り.forEach((文書) => {
        const 中身 = 文書.data();
        const 更新時刻 = ミリ秒にする(中身.lastModified);
        更新時刻 > 最新の時刻 && (最新の時刻 = 更新時刻);
        雲の卒業生.push(
          Object.assign({}, 中身, { id: 文書.id, lastModified: 更新時刻, syncStatus: '同期済み' })
        );
      });
      console.log(
        `[syncSessions] Fetched counts: S=${雲の記録.length}, M=${雲の部員.length}, T=${雲のごみ箱.length}, A=${雲の卒業生.length}`
      );
      const 記録の合流 = mergeById(状態().sessions, 雲の記録, false, false);
      const 部員の合流 = mergeById(状態().members, 雲の部員, false, false);
      const ごみ箱の合流 = mergeById(状態().trash, 雲のごみ箱, false, false);
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
          .filter((記録1件) => 記録1件 && '未同期' === 記録1件.syncStatus)
          .map((記録1件) => 記録1件.id),
        ...同期規則.雲で戻された記録(雲の記録, ごみ箱の合流),
      ]);
      const ごみ箱 = ごみ箱の合流.filter((記録1件) => 記録1件 && !復元待ち.has(記録1件.id));
      const ごみ箱のID = new Set(ごみ箱.map((記録1件) => 記録1件.id));
      const 記録 = 記録の合流.filter((記録1件) => !ごみ箱のID.has(記録1件.id));
      const 未送信の記録 = 記録.filter((記録1件) => '未同期' === 記録1件.syncStatus);
      let 記録の一覧 = 記録;
      // 下のブロックでは e が一括送信の入れ物に隠れるので、状態の更新役を
      // ここで控えておく（ブロックの中から外の e は参照できない）。
      const 反映 = 書く;
      if (未送信の記録.length > 0) {
        console.log(`[syncSessions] Syncing ${未送信の記録.length} pending sessions...`);
        const 一括 = Firestore.writeBatch(Firebaseの器.db);
        const 今 = Date.now();
        const 送った版 = new Map(未送信の記録.map((記録) => [記録.id, 記録.lastModified]));
        未送信の記録.forEach((記録) => {
          const 送る形 = JSON.parse(
            JSON.stringify(Object.assign({}, 記録, { syncStatus: '同期済み', lastModified: 今 }))
          );
          一括.set(
            Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id),
            Object.assign(雲へ書く記録(送る形), { lastModified: Firestore.serverTimestamp() })
          );
          // 戻した記録なら、クラウドのゴミ箱からも取り下げる。存在しない場合は
          // 何も起きないので、新規の記録に対しても安全。
          一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id));
        });
        // 送信の完了は待たない。通信できないと一括送信は終わらないため、
        // 待つとこの関数自体が返らず、同期中の目印が立ったままになって
        // 以後の同期がすべて飛ばされる。届いた時点で印を付け替える。
        //
        // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
        // 変わるので、一致する場合に限る。これをしないと、まだ届いて
        // いない新しい内容が同期済みに見え、次の突き合わせでクラウドの
        // 古い写しに負けて編集が消える。
        一括.commit()
          .then(() => {
            反映((前) => ({
              sessions: 前.sessions.map((記録) =>
                記録 && 送った版.has(記録.id) && 記録.lastModified === 送った版.get(記録.id)
                  ? Object.assign({}, 記録, { syncStatus: '同期済み', lastModified: 今 })
                  : 記録
              ),
            }));
          })
          .catch((誤り) => {
            console.error('[syncSessions] 記録の送信に失敗:', 誤り);
          });
      }
      // 送信が済んでいない削除を送り直す。通信できないときに削除した場合、
      // 待ち行列ごと失われることがあり、そのままだと次の全件取得で記録が
      // 復活してしまう。
      // 送り直すのは「この端末で捨てて、まだ送れていない」ものだけ。
      // クラウドの写しを読み込んだだけの項目まで送ると、ゴミ箱を空にした
      // 直後に読み込んだ分が戻ってきてしまう。
      const 未送信の削除 = ごみ箱.filter(
        (記録1件) => 記録1件 && 記録1件.id && 記録1件.pendingDelete && '未同期' === 記録1件.syncStatus
      );
      if (未送信の削除.length > 0) {
        console.log(`[syncSessions] Syncing ${未送信の削除.length} pending deletions...`);
        try {
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          const 送った削除 = new Map(未送信の削除.map((記録) => [記録.id, 記録.lastModified]));
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
            一括.set(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id), 雲へ書く記録(送る形));
          });
          // 記録の送信と同じ理由で完了は待たない。印を付けるのも
          // 送った版だけにする。
          一括.commit()
            .then(() => {
              反映((前) => ({
                trash: 前.trash.map((記録) =>
                  記録 && 送った削除.has(記録.id) && 記録.lastModified === 送った削除.get(記録.id)
                    ? Object.assign({}, 記録, { syncStatus: '同期済み', pendingDelete: false })
                    : 記録
                ),
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
      const 未送信のメンバー =
        'group' === 状態().activeRole
          ? 部員.filter((部員1人) => 部員1人 && 部員1人.id && '未同期' === 部員1人.syncStatus)
          : [];
      if (未送信のメンバー.length > 0) {
        console.log(`[syncSessions] Syncing ${未送信のメンバー.length} pending members...`);
        try {
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          const 送ったメンバー = new Map(
            未送信のメンバー.map((部員1人) => [部員1人.id, 部員1人.lastModified])
          );
          未送信のメンバー.forEach((一人) => {
            const 送る形 = dropUndefinedDeep(Object.assign({}, 一人, { syncStatus: '同期済み' }));
            送る形.lastModified = Firestore.serverTimestamp();
            一括.set(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 一人.id),
              送る形
            );
          });
          // 完了は待たない（記録・ゴミ箱と同じ理由）
          一括.commit()
            .then(() => {
              反映((前) => ({
                members: 前.members.map((一人) =>
                  一人 && 送ったメンバー.has(一人.id) && 一人.lastModified === 送ったメンバー.get(一人.id)
                    ? Object.assign({}, 一人, { syncStatus: '同期済み' })
                    : 一人
                ),
              }));
              状態().syncMemberLookup();
            })
            .catch((誤り) => {
              console.error('[syncSessions] メンバーの送り直しに失敗:', 誤り);
            });
        } catch (誤り) {
          console.error('[syncSessions] メンバーの送り直しの組み立てに失敗:', 誤り);
        }
      }
      // 卒業生も同じ。個人IDの自動採番は卒業生にも振るので、送り直しが
      // 無いと手元にしかないIDが永久に届かず、端末ごとに食い違う。
      const 未送信の卒業生 =
        'group' === 状態().activeRole
          ? 卒業生.filter((卒業生1人) => 卒業生1人 && 卒業生1人.id && '未同期' === 卒業生1人.syncStatus)
          : [];
      if (未送信の卒業生.length > 0) {
        console.log(`[syncSessions] Syncing ${未送信の卒業生.length} pending alumni...`);
        try {
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          const 送った卒業生 = new Map(未送信の卒業生.map((一人) => [一人.id, 一人.lastModified]));
          未送信の卒業生.forEach((一人) => {
            const 送る形 = dropUndefinedDeep(Object.assign({}, 一人, { syncStatus: '同期済み' }));
            送る形.lastModified = Firestore.serverTimestamp();
            一括.set(
              Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`, 一人.id),
              送る形
            );
          });
          一括.commit()
            .then(() => {
              反映((前) => ({
                alumni: 前.alumni.map((一人) =>
                  一人 && 送った卒業生.has(一人.id) && 一人.lastModified === 送った卒業生.get(一人.id)
                    ? Object.assign({}, 一人, { syncStatus: '同期済み' })
                    : 一人
                ),
              }));
            })
            .catch((誤り) => {
              console.error('[syncSessions] 卒業生の送り直しに失敗:', 誤り);
            });
        } catch (誤り) {
          console.error('[syncSessions] 卒業生の送り直しの組み立てに失敗:', 誤り);
        }
      }
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
              記録: 差分で取れるか ? 進める('記録', 記録の返り) : (境目の元 || {}).記録 || 0,
              部員: 進める('部員', 部員の返り),
              ごみ箱: 進める('ごみ箱', ごみ箱の返り),
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
        状態().ensurePersonalIds();
      }, 500);
      // メンバーも記録も雲から読めたときだけ、名前のずれを直す（古い名簿で前の名前に戻さない）
      if (雲から読んだか(記録の返り) && 雲から読んだか(部員の返り)) {
        setTimeout(() => {
          状態().名前のずれを直す();
        }, 2000);
      }
    } catch (誤り) {
      console.error('[syncSessions] Error:', 誤り);
      不具合を控える('記録の同期', 誤り);
      書く({ syncStatus: '同期エラー' });
      if (入り直せば直るか(誤り)) 書く({ 再ログインの案内: 入り直しの案内 });
    } finally {
      場.進級の確認を済ませた = false;
    }
  },
  syncAllToCloud: async () => {
    行動を控える('クラウドへ同期', (状態().sessions || []).length + '件');
    const { activeGroupId, activeRole, isNetworkOnline } = 状態();
    if (activeGroupId && isNetworkOnline)
      if ('member' !== activeRole) {
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
          // 送っている最中の編集に「同期済み」を付けないようにする
          const 控える = (一覧) =>
            new Map(
              (一覧 || []).filter((一つ) => 一つ && 一つ.id).map((一つ) => [一つ.id, 一つ.lastModified])
            );
          const 送った記録 = 控える(状態().sessions);
          const 送った名簿 = 控える(状態().members);
          const 送った卒業生 = 控える(状態().alumni);
          状態().members.forEach((部員) => {
            if (部員 && 部員.id) {
              書き込み.push({
                type: 'set',
                ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員.id),
                data: サーバーの時刻で(部員),
              });
            }
          });
          状態().alumni.forEach((卒業生) => {
            if (卒業生 && 卒業生.id) {
              書き込み.push({
                type: 'set',
                ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`, 卒業生.id),
                data: サーバーの時刻で(卒業生),
              });
            }
          });
          状態().sessions.forEach((記録) => {
            if (記録 && 記録.id) {
              const 送る形 = 雲へ書く記録(サーバーの時刻で(Object.assign({}, 記録, { syncStatus: '同期済み' })));
              書き込み.push({
                type: 'set',
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
                type: 'set',
                ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
                data: 送る形,
              });
            }
          });
          書き込み.push({
            type: 'set',
            ref: Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/config`, 'app_settings'),
            data: {
              currentFreshmanTerm: 状態().currentFreshmanTerm,
              tagTemplates: 状態().tagTemplates,
              lastPromotionYear: 状態().lastPromotionYear,
              lastModified: Date.now(),
            },
          });
          const 一括の上限 = 400;
          for (let 頭 = 0; 頭 < 書き込み.length; 頭 += 一括の上限) {
            const 切れ端 = 書き込み.slice(頭, 頭 + 一括の上限);
            const 一括 = Firestore.writeBatch(Firebaseの器.db);
            切れ端.forEach((書き込み1件) => {
              'set' === 書き込み1件.type
                ? 一括.set(書き込み1件.ref, 書き込み1件.data)
                : 'delete' === 書き込み1件.type && 一括.delete(書き込み1件.ref);
            });
            await 一括.commit();
          }
          // 印を付けるのは「送った版」だけ。送っている最中に編集された
          // ものまで送信済みにすると、その新しい内容が送り直しの対象から
          // 外れてクラウドへ届かないままになる（記録の保存や編集と同じ考え方）
          const 済ませる = (一覧, 送った版) =>
            一覧.map((一つ) =>
              一つ && 送った版.has(一つ.id) && 一つ.lastModified === 送った版.get(一つ.id)
                ? Object.assign({}, 一つ, { syncStatus: '同期済み' })
                : 一つ
            );
          const 記録 = 済ませる(状態().sessions, 送った記録);
          const 部員 = 済ませる(状態().members, 送った名簿);
          const 卒業生 = 済ませる(状態().alumni, 送った卒業生);
          書く({
            sessions: 記録,
            members: 部員,
            alumni: 卒業生,
            syncStatus: '同期済み',
            lastSyncTime: Date.now(),
          });
          console.log('[Store] Loading:', 'クラウドへの送信が完了しました');
        } catch (誤り) {
          console.error('Full Sync Error:', 誤り?.message || 誤り);
          不具合を控える('クラウドへ同期', 誤り);
          書く({ syncStatus: '同期エラー' });
        }
      } else console.log('[Store] Member role: syncAllToCloud is strictly restricted.');
  },
  /** まだ送れていないものの数を数える */
  countUnsynced: () => {
    const 数 = (一覧) =>
      Array.isArray(一覧) ? 一覧.filter((一つ) => 一つ && '未同期' === 一つ.syncStatus).length : 0;
    const { sessions, members, alumni, trash } = 状態();
    return 数(sessions) + 数(members) + 数(alumni) + 数(trash);
  },
  /**
   * ログアウトの前に、送れていないものを送り切ろうとする。
   * 残った数を返す。0 なら失われるものは無い。
   *
   * ログアウトは手元の記録を全部捨てるので、ここで送っておかないと
   * 圏外で保存してそのまま抜けた分が失われる。送信の完了は待たない作りな
   * ので、印が「同期済み」に変わるのを少しの間だけ見張る（最大3秒）。
   */
  flushUnsyncedForLogout: async () => {
    if (0 === 状態().countUnsynced()) return 0;
    if (!状態().isNetworkOnline) return 状態().countUnsynced();
    try {
      await 状態().syncSessions();
    } catch (誤り) {
      console.error('[Store] flushUnsyncedForLogout error:', 誤り);
    }
    for (let 回 = 0; 回 < 15; 回++) {
      if (0 === 状態().countUnsynced()) return 0;
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
  起動時に取り込む: async () => {
    const 様子 = 状態();
    const しかた = 同期規則.起動のしかた({
      団体: 様子.activeGroupId,
      境目: 様子.雲の境目,
      全部そろえた時刻: 様子.全部そろえた時刻,
      記録の数: (様子.sessions || []).length,
      部員の数: (様子.members || []).length,
    });
    if ('全部' === しかた) return 状態().fetchAndOverwriteFromCloud();
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
    if ('同期エラー' === 状態().syncStatus) return 状態().fetchAndOverwriteFromCloud();
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
      const 部員の返り = await Firestore.getDocs(
        Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/members`)
      );
      let 部員 = [];
      部員の返り.forEach((文書) => 部員.push(文書.data()));
      const 記録の返り = await Firestore.getDocs(
        Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`)
      );
      let 記録 = [];
      記録の返り.forEach((文書) => 記録.push(記録の日時を数に(文書.data())));
      console.log('[Store] Loading:', `セッション ${記録.length}件を取得しました`);
      const ごみ箱の返り = await Firestore.getDocs(
        Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`)
      );
      let 雲のごみ箱 = [];
      ごみ箱の返り.forEach((文書) => 雲のごみ箱.push(記録の日時を数に(文書.data())));
      const 卒業生の返り = await Firestore.getDocs(
        Firestore.collection(Firebaseの器.db, `groups/${状態().activeGroupId}/alumni`)
      );
      let 卒業生 = [];
      卒業生の返り.forEach((文書) => 卒業生.push(文書.data()));
      const 設定の帳面 = await Firestore.getDoc(
        Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/config`, 'app_settings')
      );
      let currentFreshmanTerm = 状態().currentFreshmanTerm;
      let tagTemplates = 状態().tagTemplates;
      let lastPromotionYear = 状態().lastPromotionYear;
      if (設定の帳面.exists()) {
        const 設定 = 設定の帳面.data();
        設定 &&
          (undefined !== 設定.currentFreshmanTerm && (currentFreshmanTerm = 設定.currentFreshmanTerm),
          undefined !== 設定.tagTemplates && (tagTemplates = 設定.tagTemplates),
          undefined !== 設定.lastPromotionYear && (lastPromotionYear = 設定.lastPromotionYear));
      }
      const 記録の合流 = mergeById(状態().sessions, 記録, false, true);
      const 部員の合流 = mergeById(状態().members, 部員, false, true);
      const ごみ箱の合流 = mergeById(状態().trash, 雲のごみ箱, false, true);
      // ゴミ箱に入っているものは履歴に出さない。削除がまだクラウドへ届いて
      // いないとき、ここで書き戻すと記録が復活してしまう。
      // 逆に、戻したばかりでまだ送信できていない記録は、クラウドのゴミ箱の
      // 写しがあってもゴミ箱に入れ直さない。
      const 復元待ち = new Set(
        記録の合流
          .filter((記録1件) => 記録1件 && '未同期' === 記録1件.syncStatus)
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
      if (控えのid.length > 0) {
        const 期限 = Date.now() - 2592e6;
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
        if (消し直す.length > 0) {
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
      if (メンバーの控えのid.length > 0) {
        const 期限 = Date.now() - 2592e6;
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
        if (消し直す.length > 0) {
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
        alumni: mergeById(状態().alumni, 卒業生, false, true),
        currentFreshmanTerm,
        tagTemplates,
        lastPromotionYear,
        syncStatus: '同期済み',
        lastSyncTime: Date.now(),
        // 4 つとも雲から全件を読んだときだけ、境目を決め直し、全部そろえたことにする
        // （差分の同期と起動の判断に使う）。電波が無く端末の控えから答えたときは触らない
        ...([記録の返り, 部員の返り, ごみ箱の返り, 卒業生の返り].every(雲から読んだか)
          ? {
              雲の境目: {
                団体: 状態().activeGroupId,
                記録: 同期規則.境目を進める(0, 読んだままの中身(記録の返り)),
                部員: 同期規則.境目を進める(0, 読んだままの中身(部員の返り)),
                ごみ箱: 同期規則.境目を進める(0, 読んだままの中身(ごみ箱の返り)),
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
      if (入り直せば直るか(誤り)) 書く({ 再ログインの案内: 入り直しの案内 });
    }
  },

  listenToSessions: async () => {
    const { activeGroupId: 団体, activeRole: 役割, myMemberId: 自分の部員ID, myMemberName } = 状態();
    if (!団体) return;
    const _sessDb = await waitForDb();
    if (!_sessDb) {
      console.warn('[Store] listenToSessions: db still undefined after await, aborting');
      return;
    }
    状態().stopListeningToSessions();
    console.log('[Store] Starting real-time session listener');
    const 記録の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/sessions`);
    const m_30 = Date.now() - 2592000000;
    // 雲の date は数から日時型へ移している途中（2026-09-24〜）。範囲の問い合わせは
    // 同じ型の値にしか当たらないので、数と日時型の両方で絞る。数だけで絞ると、
    // 日時型になった記録が 1 件も届かず、画面から消える
    const 問い = Firestore.query(
      記録の置き場,
      Firestore.or(
        Firestore.where('date', '>', m_30),
        Firestore.where('date', '>', Firestore.Timestamp.fromMillis(m_30))
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
          const cleanedTags =
            中身.tags && Array.isArray(中身.tags)
              ? Array.from(new Set(中身.tags.map(normalizeTag).filter(Boolean)))
              : [];
          const originalTags = 中身.tags || [];
          const isModified =
            cleanedTags.length !== originalTags.length ||
            cleanedTags.some((タグ, 番) => タグ !== originalTags[番]);
          if (isModified && Firebaseの器.db && Firebaseの器.db._delegate && 'member' !== 役割) {
            const 場所 = Firestore.doc(
              Firebaseの器.db,
              `groups/${場.店.getState().activeGroupId}/sessions`,
              文書.id
            );
            Firestore.updateDoc(場所, { tags: cleanedTags }).catch((誤り) =>
              console.error('[Store] Auto cleanup sync failed:', 誤り)
            );
          }
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
          if (localSession && (pendingTimer || '未同期' === localSession.syncStatus)) return localSession;
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
        if (同期規則.一覧が同じか(手元の記録, 並べた記録) && '同期済み' === 状態().syncStatus) {
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
        if (入り直せば直るか(誤り)) 書く({ 再ログインの案内: 入り直しの案内 });
      }
    );
    書く({ sessionUnsubscribe: 止める });
  },
  stopListeningToSessions: () => {
    const { sessionUnsubscribe } = 状態();
    sessionUnsubscribe &&
      (console.log('[Store] Stopping real-time session listener'),
      sessionUnsubscribe(),
      書く({ sessionUnsubscribe: null }));
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
    console.log('[Store] Starting real-time trash listener');
    const ごみ箱の置き場 = Firestore.collection(Firebaseの器.db, `groups/${団体}/trash`);
    const 問い = Firestore.query(ごみ箱の置き場, Firestore.limit(200));
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
          return 手元の && 手元の.pendingDelete && '未同期' === 記録.syncStatus
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
            '未同期' === 記録1件.syncStatus &&
            !クラウドのid.has(記録1件.id)
        );
        const 新しいゴミ箱 = 未送信の削除.length > 0 ? [...写し, ...未送信の削除] : 写し;
        新しいゴミ箱.sort((甲, 乙) => trashedAtMillis(乙) - trashedAtMillis(甲));
        // 戻したばかりでまだ送れていない記録は、クラウドのゴミ箱に写しが
        // あっても履歴から外さない。外すと復元が取り消されて見える。
        // 完全に消したものは、クラウドにまだ残っていても画面に出さない
        const 完全削除ずみ = new Set(Object.keys(状態().permanentlyDeleted || {}));
        const 出すゴミ箱 = 新しいゴミ箱.filter((記録1件) => 記録1件 && !完全削除ずみ.has(記録1件.id));
        const 捨てたid = new Set(出すゴミ箱.map((記録1件) => 記録1件.id));
        const 残す = 状態().sessions.filter(
          (記録1件) => 記録1件 && (!捨てたid.has(記録1件.id) || '未同期' === 記録1件.syncStatus)
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
    trashUnsubscribe &&
      (console.log('[Store] Stopping real-time trash listener'),
      trashUnsubscribe(),
      書く({ trashUnsubscribe: null }));
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
        const 合流した = mergeById(状態().members, 雲の部員, false, true).filter(
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
    memberUnsubscribe &&
      (console.log('[Store] Stopping real-time member listener'),
      memberUnsubscribe(),
      書く({ memberUnsubscribe: null }));
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
        const 合流した = mergeById(状態().alumni, 雲の卒業生, false, true);
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
    alumniUnsubscribe &&
      (console.log('[Store] Stopping real-time alumni listener'),
      alumniUnsubscribe(),
      書く({ alumniUnsubscribe: null }));
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
    const 時計 = setInterval(() => {
      状態().syncSessions();
    }, 3e5);
    書く({ syncIntervalId: 時計 });
  },
  stopPeriodicSync: () => {
    const 時計 = 状態().syncIntervalId;
    時計 &&
      (console.log('[Store] Stopping periodic sync'), clearInterval(時計), 書く({ syncIntervalId: null }));
    状態().stopListeningToSessions();
    状態().stopListeningToTrash();
    状態().stopListeningToMembers();
    状態().stopListeningToAlumni();
  },
  setupNetworkListener: () => {
    console.log('[Store] Setting up network listener');
    return netinfo.addEventListener((様子) => {
      const 前はつながっていた = 状態().isNetworkOnline;
      const つながっている = !(!様子.isConnected || false === 様子.isInternetReachable);
      つながっている !== 前はつながっていた &&
        (console.log('[Store] Network state changed: ' + (つながっている ? 'Online' : 'Offline')),
        書く({ isNetworkOnline: つながっている }),
        つながっている &&
          !前はつながっていた &&
          (console.log('[Store] Connection restored. Triggering auto-sync...'),
          // 電波が切れている最中にこそ失敗するので、戻ったときに出し直す。
          // 便りの仕組みが転んでも、自動同期まで巻き添えにしない
          溜まりを流し直す(),
          状態()
            .syncSessions()
            .catch((誤り) => console.error('[Store] Auto-sync failed:', 誤り))));
    });
  },
});

module.exports = { 同期の操作 };
