'use strict';

/**
 * 店の操作のうち、部員（名簿）を扱うもの：足す・直す・消す、逆引き表、名前のずれを直す、個人IDをそろえる、弓具。
 * （2026-10-05 に useScoreStore.js から分けた。店の名指しは 場.店 にした）
 * 店（useScoreStore.js）が ...部員の操作(書く, 状態, そのまま書く) で広げる。
 */
const {
  Alert,
  Firebaseの器,
  Firestore,
  generateUUID,
  generateUniquePersonalId,
  waitForDb,
  ライブへ盤面を送る,
  名前の整合,
  場,
  雲へ書く記録,
  送った版に印を付ける,
  送った版の表,
} = require('./storeShared');
const 学 = require('./gakunen');
const 区 = require('./kubun');

/** メンバー（卒業生も）を雲へ書く形にする。雲には「同期済み」として書く（記録と同じ） */
const 雲へ送る人 = (人) =>
  Object.assign({}, 人, { lastModified: Firestore.serverTimestamp(), syncStatus: '同期済み' });

/** 雲へ届いたメンバーを、送った版のまま手元に残っていれば同期済みにする */
const 届いた人を同期済みに = (書く, 送った人たち) => {
  const 版 = 送った版の表(送った人たち);
  書く((前) => ({ members: 送った版に印を付ける(前.members, 版) }));
};

const 部員の操作 = (書く, 状態, そのまま書く) => ({
  /**
   * 部員を足す。足すもの … 区分（divisionIds）・入会した年（joinedYear。学年の無い団体）。
   * 区分は今の一覧にある id だけを残す（src/kubun.js の 付けられる区分）
   */
  addMember: (名前, 性別, 学年, 期, 足すもの) => {
    if (!状態().activeGroupId || 状態().activeRole !== 'group') {
      Alert.alert('権限エラー', 'メンバーの追加は団体ログイン、かつ管理者のみ可能です。');
      return;
    }
    const 整えた名前 = 名前 ? 名前.trim() : '';
    const 新しい部員 = {
      id: generateUUID(),
      personalId: generateUniquePersonalId(状態().members, 状態().alumni),
      name: 整えた名前,
      gender: 性別,
      grade: 学年,
      // 期を使わない団体・その他の人には期を付けない（前は既定の 1 期から逆算して 0 期・−1 期が入っていた）
      termKi:
        期 ||
        (状態().useTerm && 学.期を付ける学年か(学年) ? 学.学年の期(状態().currentFreshmanTerm, 学年) : null),
      lastModified: Date.now(),
      syncStatus: '未同期',
    };
    const 足す = 足すもの || {};
    if (Array.isArray(足す.divisionIds) && 足す.divisionIds.length)
      新しい部員.divisionIds = 区.付けられる区分(足す.divisionIds, 状態().divisions);
    if (Number.isFinite(足す.joinedYear)) 新しい部員.joinedYear = 足す.joinedYear;
    書く({ members: [...状態().members, 新しい部員], lastLocalChange: Date.now() });
    if (状態().activeGroupId) {
      Firestore.setDoc(
        Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 新しい部員.id),
        雲へ送る人(新しい部員)
      )
        .then(() => {
          状態().syncMemberLookup();
          届いた人を同期済みに(書く, [新しい部員]);
        })
        .catch((誤り) => console.error('Add Member Sync Error:', 誤り));
    }
  },
  updateMember: (部員ID, 変更) => {
    if (!状態().activeGroupId || 状態().activeRole !== 'group') {
      Alert.alert('権限エラー', 'メンバーの編集は団体ログイン時のみ可能です。');
      return;
    }
    let 直す中身 = Object.assign({}, 変更);
    // 卒業・退部にしたら、現役だった最後の年度を書き留める（出欠の画面が年度ごとの現役を決めるのに使う）。
    // 在籍に戻したら消す。前の形の卒業の印（graduationYear）も消す（src/gakunen.js の 在籍の状態）
    if (変更.enrollment !== undefined) {
      const 抜けた = 学.在籍.卒業 === 変更.enrollment || 学.在籍.退部 === 変更.enrollment;
      if (変更.leftYear === undefined) 直す中身.leftYear = 抜けた ? 学.年度() : null;
      直す中身.graduationYear = null;
    }
    if (変更.grade !== undefined && 変更.termKi === undefined) {
      // 学年を変えたら期も合わせる（期を使う団体の在籍の学年だけ。その他にしたら期を空にする）
      if (!学.期を付ける学年か(変更.grade)) 直す中身.termKi = null;
      else if (状態().useTerm) 直す中身.termKi = 学.学年の期(状態().currentFreshmanTerm, 変更.grade);
    }
    // 送らない項目（undefined）は前の値のまま。残すと雲へ送るときに断られる
    //（期を使わない団体では画面が termKi: undefined を付けて送り、直した人が雲へ届いていなかった。10/25）
    for (const 鍵 of Object.keys(直す中身)) if (直す中身[鍵] === undefined) delete 直す中身[鍵];
    const 直した部員 = 状態().members.map((部員) =>
      部員.id === 部員ID
        ? Object.assign({}, 部員, 直す中身, { lastModified: Date.now(), syncStatus: '未同期' })
        : 部員
    );
    書く({ members: 直した部員, lastLocalChange: Date.now() });
    if (変更.name !== undefined || 変更.gender !== undefined || 変更.grade !== undefined) {
      // 射手の並びに、直した名前・性別・学年を写す。部員に結び付いた射手（memberId）だけ。
      // 途中交代で入った人は、名前だけ（交代の欄は名前しか持たない）
      const 射手たちを直す = (射手たち) => {
        let 触った = false;
        const 直した射手 = 射手たち
          .map((射手) => {
            if (!射手 || 射手.memberId !== 部員ID) return 射手;
            触った = true;
            return Object.assign({}, 射手, {
              name: 変更.name !== undefined ? 変更.name : 射手.name,
              gender: 変更.gender !== undefined ? 変更.gender : 射手.gender,
              grade: 変更.grade !== undefined ? 変更.grade : 射手.grade,
              lastModified: Date.now(),
            });
          })
          .map((射手) => {
            if (射手 && 射手.substitutionIds) {
              let 交代を直した = false;
              const 交代 = Object.assign({}, 射手.substitutions || {});
              Object.entries(射手.substitutionIds).forEach(([番, id]) => {
                const 添字 = Number(番);
                if (id === 部員ID && 変更.name !== undefined) {
                  交代[添字] = 変更.name;
                  交代を直した = true;
                }
              });
              if (交代を直した) {
                触った = true;
                return Object.assign({}, 射手, { substitutions: 交代, lastModified: Date.now() });
              }
            }
            return 射手;
          });
        return { 直した射手, 触った };
      };
      const 記録に写す = (一覧) => {
        let 変わった = false;
        const 直した一覧 = 一覧.map((記録) => {
          if (!記録 || !記録.archers) return 記録;
          const { 直した射手, 触った } = 射手たちを直す(記録.archers);
          if (!触った) return 記録;
          変わった = true;
          return Object.assign({}, 記録, {
            archers: 直した射手,
            archerNames: 名前の整合.射手の名前たち(直した射手),
            lastModified: Date.now(),
          });
        });
        return { 直した一覧, 変わった };
      };
      // いま記録している盤面（記録の画面）と、取り消しの控えにも写す。盤面は記録に保存するまで
      // sessions に入らないので、写さないと、名前を直しても記録の画面は古い名前のまま残っていた。
      // ライブ中なら、参加している人の画面にも新しい名前を送る
      {
        const 盤面 = Array.isArray(状態().archers) ? 状態().archers : [];
        const 盤 = 射手たちを直す(盤面);
        if (盤.触った) {
          const 控えを直す = (控え) =>
            Array.isArray(控え)
              ? 控え.map((一枚) => (Array.isArray(一枚) ? 射手たちを直す(一枚).直した射手 : 一枚))
              : 控え;
          書く({
            archers: 盤.直した射手,
            historyStack: 控えを直す(状態().historyStack),
            redoStack: 控えを直す(状態().redoStack),
            lastLocalChange: Date.now(),
          });
          const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
          if (isLiveActive && liveSessionName)
            ライブへ盤面を送る(liveSessionName, 盤.直した射手, shotsPerRound);
        }
      }
      const 元の記録 = 状態().sessions;
      const 元のごみ箱 = 状態().trash;
      const { 直した一覧: 記録の一覧, 変わった: 記録が変わった } = 記録に写す(元の記録);
      const { 直した一覧: ごみ箱の一覧, 変わった: ごみ箱が変わった } = 記録に写す(元のごみ箱);
      const 変わった = 記録が変わった || ごみ箱が変わった;
      if (変わった) 書く({ sessions: 記録の一覧, trash: ごみ箱の一覧, lastLocalChange: Date.now() });
      if (変わった && 状態().activeGroupId) {
        // 書き込みは少しずつ（5 件ずつ、間を空けて）送る。
        // ・一括書き込みは 1 回 500 件までで、記録が 500 件を超えるメンバーを直すと、1 回で送って
        //   丸ごと失敗していた（手元は新しい名前になり、クラウドと他の端末は古い名前のまま）
        // ・Firestore は、書く前に中身を端末の保存領域（IndexedDB）へ控える。記録 151 件を 1 回で渡すと、
        //   控えるのに約 4 秒、画面が止まった（保存を押したあと固まる。2026-10-03 に再現）。
        //   少しずつなら 1 回あたり 0.1 秒ほどで、止まって見えない
        // 途中で閉じても、送れなかった記録は雲に前の名前が残るだけで、次に団体の端末が
        // 開いたときの「名前のずれを直す」が直す
        const 書き込み = [];
        const 集める = (一覧, 元の一覧, 置き場) => {
          一覧.forEach((記録, 番) => {
            if (記録.lastModified !== 元の一覧[番].lastModified) {
              const 送る中身 = 雲へ書く記録(JSON.parse(JSON.stringify(記録)));
              送る中身.lastModified = Firestore.serverTimestamp();
              書き込み.push({ 置き場, id: 記録.id, 送る中身 });
            }
          });
        };
        if (記録が変わった) 集める(記録の一覧, 元の記録, 'sessions');
        if (ごみ箱が変わった) 集める(ごみ箱の一覧, 元のごみ箱, 'trash');
        const 団体ID = 状態().activeGroupId;
        const 少しずつ送る = (頭) => {
          // 途中で別の団体に入り直したら、続きは送らない
          if (頭 >= 書き込み.length || 状態().activeGroupId !== 団体ID) return;
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          書き込み.slice(頭, 頭 + 5).forEach(({ 置き場, id, 送る中身 }) => {
            一括.set(Firestore.doc(Firebaseの器.db, `groups/${団体ID}/${置き場}`, id), 送る中身, {
              merge: true,
            });
          });
          一括.commit().catch((誤り) => console.error('Member Linkage Sync Error:', 誤り));
          setTimeout(() => 少しずつ送る(頭 + 5), 30);
        };
        少しずつ送る(0);
      }
    }
    if (状態().activeGroupId) {
      // 続けて直したときは、最後の 1 回だけ送る
      if (場.部員を送る予約[部員ID]) clearTimeout(場.部員を送る予約[部員ID]);
      場.部員を送る予約[部員ID] = setTimeout(() => {
        const 部員 = 状態().members.find((部員1人) => 部員1人.id === 部員ID);
        if (!部員) return;
        Firestore.updateDoc(
          Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員ID),
          雲へ送る人(部員)
        )
          .then(() => {
            console.log(`[Store] Debounced Member Sync Success: ${部員.name}`);
            届いた人を同期済みに(書く, [部員]);
          })
          .catch((誤り) => console.error('Update Member Sync Error:', 誤り))
          .finally(() => {
            delete 場.部員を送る予約[部員ID];
          });
      }, 300);
    }
  },
  deleteMember: (部員ID) => {
    if (!状態().activeGroupId || 状態().activeRole !== 'group') {
      Alert.alert('権限エラー', 'メンバーの削除は団体ログイン時のみ可能です。');
      return;
    }
    // 消したことを控えに残す。送信が失われても、次の受け取りで
    // 復活させないため。クラウドから消えたのを確かめてから控えを外す
    const 控え = Object.assign({}, 状態().deletedMembers);
    控え[部員ID] = Date.now();
    書く({
      members: 状態().members.filter((部員) => 部員.id !== 部員ID),
      deletedMembers: 控え,
      lastLocalChange: Date.now(),
    });
    Firestore.deleteDoc(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員ID))
      .then(() =>
        Promise.all([
          状態().syncMemberLookup(),
          // その人の招待リンクを取り消す（名簿が空になっても残らないよう名指しで）
          状態().activeRole === 'group'
            ? require('./memberInvite').招待を取り消す(
                { Firestore, db: Firebaseの器.db },
                状態().activeGroupId,
                部員ID
              )
            : null,
        ])
      )
      .catch((誤り) => console.error('Delete Member Sync Error:', 誤り));
  },
  syncMemberLookup: async () => {
    const { activeGroupId: 団体, activeRole, members } = 状態();
    if (!団体 || activeRole !== 'group' || !Firebaseの器.db) return;
    try {
      const 返り = await Firestore.getDocs(
        Firestore.collection(Firebaseの器.db, `groups/${団体}/member_lookup`)
      );
      // 個人ID → メンバーの id。雲にまだ無い（か違う）ものが残り、最後に書く
      const 作る表 = new Map();
      (members || []).forEach((部員) => {
        if (部員 && 部員.id && /^\d{4}$/.test(部員.personalId || '')) 作る表.set(部員.personalId, 部員.id);
      });
      const 一括 = Firestore.writeBatch(Firebaseの器.db);
      let 件数 = 0;
      const 今いる部員 = new Set((members || []).filter((部員) => 部員 && 部員.id).map((部員) => 部員.id));
      返り.forEach((文書) => {
        // 招待リンクの合言葉（src/memberInvite.js）は個人ID ではないので、下の突き合わせに
        // かけない（かけると「知らない番号」として消してしまう）。メンバーから外れた人の
        // 合言葉だけ片付ける。名簿が空のとき（まだ読めていないことがある）は消さない。
        // 個人ID の文書は次の整理で作り直されるが、合言葉は作り直せないので。
        // 最後の 1 人を消したときは deleteMember が名指しで取り消す
        const 中身 = 文書.data() || {};
        if (中身.招待 === true) {
          if (今いる部員.size && !今いる部員.has(中身.memberId)) {
            一括.delete(文書.ref);
            件数++;
          }
          return;
        }
        const 欲しい部員ID = 作る表.get(文書.id);
        if (!欲しい部員ID) {
          一括.delete(文書.ref);
          件数++;
        } else if (中身.memberId === 欲しい部員ID) {
          作る表.delete(文書.id);
        }
      });
      作る表.forEach((memberId, pid) => {
        一括.set(Firestore.doc(Firebaseの器.db, `groups/${団体}/member_lookup`, pid), {
          memberId,
          // Date で置く（管理画面で日時として読める。読むのは人だけ）
          updatedAt: new Date(),
        });
        件数++;
      });
      if (件数 > 0) {
        await 一括.commit();
        console.log('[Store] member_lookup synced:', 件数);
      }
    } catch (誤り) {
      console.error('[Store] syncMemberLookup error:', 誤り);
    }
  },
  /**
   * 記録の射手の名前が、メンバーのいまの名前とずれていたら直す（団体ログインの端末だけ）。
   *
   * 名前を直したときの書き換え（updateMember）が一部の記録に届かず、前の名前が残ることがあった
   * （本番の団体A で、94 件のうち 52 件。src/memberNameSync.js）。見つけて直す。
   *
   * ・クラウドの最新の記録を読み直して、射手の名前だけ変えて書く（トランザクション）。手元の古い写しで
   *   ほかの端末の最新の○×を上書きしない
   * ・手元に送信待ちの編集がある記録は触らない（こちらの書き込みで更新日時が進み、送信待ちの編集が
   *   古い扱いにならないように。次の機会に直す）
   * ・同期でメンバーも記録も雲から読んだあとだけ呼ぶ（古い名簿で名前を前の名前に戻さない）。
   *   1 回に 100 件まで、60 秒より短い間隔では走らない
   */
  名前のずれを直す: async () => {
    const 今 = 状態();
    const 団体 = 今.activeGroupId;
    if (!団体 || 今.activeRole !== 'group' || !今.isNetworkOnline || 今.isLiveActive) return;
    if (場.名前を合わせている || Date.now() - 場.最後に名前を合わせた時刻 < 60 * 1000) return;
    // 卒業生の一覧（古い）を先に、部員を後に渡す。同じ id が両方に居たら、いまの部員の名前が勝つ
    const 名前表を作る = () => 名前の整合.名前表を作る(状態().alumni, 状態().members);
    const 名前表 = 名前表を作る();
    const 対象 = [];
    for (const [置き場, 一覧] of [
      ['sessions', 今.sessions],
      ['trash', 今.trash],
    ]) {
      const 送信待ち = new Set(
        (一覧 || []).filter((記録) => 記録 && 記録.syncStatus === '未同期').map((記録) => 記録.id)
      );
      for (const ずれ of 名前の整合.ずれのある記録たち(一覧, 名前表)) {
        if (!送信待ち.has(ずれ.id)) 対象.push({ 置き場, id: ずれ.id });
      }
    }
    if (!対象.length) return;
    場.名前を合わせている = true;
    場.最後に名前を合わせた時刻 = Date.now();
    try {
      if (!(await waitForDb())) return;
      const 直した = new Map(); // 置き場/id → 雲に書いた archerNames
      for (const { 置き場, id } of 対象.slice(0, 100)) {
        // 途中で別の団体に入り直したり、ログアウトしたら、続きは直さない
        if (状態().activeGroupId !== 団体) break;
        try {
          const 名前たち = await Firestore.runTransaction(Firebaseの器.db, async (取引) => {
            const 参照 = Firestore.doc(Firebaseの器.db, `groups/${団体}/${置き場}`, id);
            const 文書 = await 取引.get(参照);
            if (!文書.exists()) return null;
            const 中身 = 文書.data();
            // 名前表は、書く直前のいまの名簿から作り直す。直している最中にメンバーの名前が
            // 直されても、前の名前に戻さない（100 件を順に直すと、数十秒かかることがある）
            const { 直した射手, 触った } = 名前の整合.射手たちを合わせる(中身.archers, 名前表を作る());
            if (!触った) return null;
            const 名前たち = 名前の整合.射手の名前たち(直した射手);
            取引.update(参照, {
              archers: 直した射手,
              archerNames: 名前たち,
              lastModified: Firestore.serverTimestamp(),
            });
            return 名前たち;
          });
          if (名前たち) 直した.set(置き場 + '/' + id, 名前たち);
        } catch (誤り) {
          console.warn('[名前のずれを直す] 1 件直せませんでした:', id, 誤り && 誤り.message);
        }
      }
      if (!直した.size) return;
      // 手元にも写す。射手の名前だけ（手元の○×などは、雲の写しで置き換えない）
      const 写す = (一覧, 置き場) =>
        (一覧 || []).map((記録) => {
          if (!記録 || !直した.has(置き場 + '/' + 記録.id) || 記録.syncStatus === '未同期') return 記録;
          const { 直した射手, 触った } = 名前の整合.射手たちを合わせる(記録.archers, 名前表を作る());
          return 触った
            ? Object.assign({}, 記録, {
                archers: 直した射手,
                archerNames: 名前の整合.射手の名前たち(直した射手),
                lastModified: Date.now(),
              })
            : 記録;
        });
      書く((前) => ({ sessions: 写す(前.sessions, 'sessions'), trash: 写す(前.trash, 'trash') }));
      console.log(`[名前のずれを直す] ${直した.size} 件の記録の名前を、メンバーのいまの名前に合わせました`);
    } catch (誤り) {
      console.warn('[名前のずれを直す] 失敗:', 誤り && 誤り.message);
    } finally {
      場.名前を合わせている = false;
    }
  },
  ensurePersonalIds: async () => {
    const 団体 = 状態().activeGroupId;
    // 名簿を書けるのは団体アカウントだけ。部員の端末で走ると、他人の
    // 個人IDを勝手に振ってしまう。しかも逆引き表（こちらは団体限定）は
    // 更新されないため、その人がログインできなくなる。
    if (!団体 || 状態().activeRole !== 'group') return;
    const _ensureDb = await waitForDb();
    if (!_ensureDb) {
      console.warn('[Store] ensurePersonalIds: db still undefined after await, aborting');
      return;
    }
    // 名簿は待ったあとで読む。待つ前の写しで書くと、その間に届いた名簿の変更を古い一覧で消す
    const 部員の写し = [...(状態().members || [])];
    const 卒業生の写し = [...(状態().alumni || [])];
    const 使われている個人ID = () =>
      [
        ...部員の写し.map((部員) => 部員.personalId),
        ...卒業生の写し.map((卒業生) => 卒業生.personalId),
      ].filter((個人ID) => !!個人ID);
    const 形が正しい = (id) => !!id && /^\d{4}$/.test(id);
    const 空いている番号を作る = (使われている) => {
      let 候補;
      let 回数 = 0;
      do {
        候補 = Math.floor(1e3 + 9e3 * Math.random()).toString();
        回数++;
      } while (使われている.includes(候補) && 回数 < 5e3);
      return 候補;
    };
    const 一括 = Firestore.writeBatch(Firebaseの器.db);
    let 件数 = 0;
    // 形の正しくない個人ID を振り直す。手元は送信が済むまで「未同期」にしておく。送信が失われた場合、
    // 「同期済み」だと送り直しの対象にならず、クラウドにIDが無いまま固定される。
    // すると別の端末が別のIDを振り、端末ごとに食い違う
    const 振り直す = (写し, 置き場) => {
      for (let 番 = 0; 番 < 写し.length; 番++) {
        if (形が正しい(写し[番].personalId)) continue;
        写し[番] = Object.assign({}, 写し[番], {
          personalId: 空いている番号を作る(使われている個人ID()),
          lastModified: Date.now(),
          syncStatus: '未同期',
        });
        一括.set(
          Firestore.doc(Firebaseの器.db, `groups/${団体}/${置き場}`, 写し[番].id),
          雲へ送る人(写し[番])
        );
        件数++;
      }
    };
    振り直す(部員の写し, 'members');
    振り直す(卒業生の写し, 'alumni');
    if (件数 > 0) {
      書く({ members: 部員の写し, alumni: 卒業生の写し, lastLocalChange: Date.now() });
      // 完了は待たない。通信できないと終わらず、この先の逆引き表の
      // 更新まで止まってしまう。届かなければ syncSessions が送り直す
      const 送った版 = 送った版の表([...部員の写し, ...卒業生の写し]);
      一括.commit()
        .then(() =>
          書く((前) => ({
            members: 送った版に印を付ける(前.members, 送った版),
            alumni: 送った版に印を付ける(前.alumni, 送った版),
          }))
        )
        .catch((誤り) => console.error('[Store] 個人IDの送信に失敗:', 誤り));
      console.log(`Ensured personal IDs: Updated ${件数} non-compliant IDs.`);
    }
    await 状態().syncMemberLookup();
  },
  /** 弓具の履歴を足す。新しいものが上に来るように、日付の降順で並べておく（画面もそう見せている） */
  addEquipment: (memberId, 中身) => {
    if (!状態().弓具を触れるか(memberId)) return;
    const 新しい記録 = {
      id: generateUUID(),
      date: Number(中身?.date) || Date.now(),
      note: (中身?.note || '').trim(),
      weight: (中身?.weight || '').trim(),
    };
    弓具を書き換える(書く, 状態, memberId, 'Add Equipment', (弓具) =>
      [...弓具, 新しい記録].sort((a, b) => b.date - a.date)
    );
  },
  deleteEquipment: (memberId, 記録ID) => {
    if (!状態().弓具を触れるか(memberId)) return;
    弓具を書き換える(書く, 状態, memberId, 'Delete Equipment', (弓具) =>
      弓具.filter((記録) => 記録.id !== 記録ID)
    );
  },
});

/**
 * その人の弓具の履歴を書き換える。手元を先に直し（未同期）、雲へ送れたら同期済みにする。
 * 扱ってよいか（弓具を触れるか）は呼ぶ側の入口で確かめる
 */
function 弓具を書き換える(書く, 状態, memberId, 名, 直し方) {
  const 今 = Date.now();
  const 直した = 状態().members.map((部員) =>
    部員.id === memberId
      ? Object.assign({}, 部員, {
          equipments: 直し方(部員.equipments || []),
          lastModified: 今,
          syncStatus: '未同期',
        })
      : 部員
  );
  書く({ members: 直した, lastLocalChange: 今 });
  const 本人 = 直した.find((部員) => 部員.id === memberId);
  if (!本人 || !状態().activeGroupId) return;
  Firestore.updateDoc(
    Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, memberId),
    雲へ送る人(本人)
  )
    .then(() => 届いた人を同期済みに(書く, [本人]))
    .catch((誤り) => console.error(`${名} Sync Error:`, 誤り));
}

module.exports = { 部員の操作 };
