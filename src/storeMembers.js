'use strict';

/**
 * 店の操作のうち、部員（名簿）を扱うもの：足す・直す・消す、逆引き表、名前のずれを直す、個人IDをそろえる、弓具。
 * （2026-10-05 に useScoreStore.js から分けた。中身は変えていない。店の名指しは 場.店 にした）
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
} = require('./storeShared');

const 部員の操作 = (書く, 状態, そのまま書く) => ({
  addMember: (名前, 性別, 学年, 期) => {
    if (!状態().activeGroupId || 'group' !== 状態().activeRole)
      return void Alert.alert('権限エラー', 'メンバーの追加は団体ログイン、かつ管理者のみ可能です。');
    const 整えた名前 = 名前 ? 名前.trim() : '';
    const 新しい部員 = {
      id: generateUUID(),
      personalId: generateUniquePersonalId(状態().members, 状態().alumni),
      name: 整えた名前,
      gender: 性別,
      grade: 学年,
      termKi: 期 || 状態().currentFreshmanTerm - (学年 - 1),
      lastModified: Date.now(),
      syncStatus: '未同期',
    };
    if (
      (書く({ members: [...状態().members, 新しい部員], lastLocalChange: Date.now() }), 状態().activeGroupId)
    ) {
      const 送る中身 = Object.assign({}, 新しい部員, {
        lastModified: Firestore.serverTimestamp(),
        syncStatus: '同期済み',
      });
      Firestore.setDoc(
        Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 新しい部員.id),
        送る中身
      )
        .then(() => {
          状態().syncMemberLookup();
          // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
          // 変わるので、一致する場合に限る（記録側と同じ考え方）。
          書く((前) => ({
            members: 前.members.map((部員) =>
              部員 && 部員.id === 新しい部員.id && 部員.lastModified === 新しい部員.lastModified
                ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                : 部員
            ),
          }));
        })
        .catch((誤り) => console.error('Add Member Sync Error:', 誤り));
    }
  },
  updateMember: (部員ID, 変更) => {
    if (!状態().activeGroupId || 'group' !== 状態().activeRole)
      return void Alert.alert('権限エラー', 'メンバーの編集は団体ログイン時のみ可能です。');
    if (undefined !== 変更.grade) {
      const 今日 = new Date();
      const 年 = 今日.getFullYear();
      const 月 = 今日.getMonth() + 1;
      const 年度 = 月 >= 4 ? 年 : 年 - 1;
      5 === Number(変更.grade) ? (変更.graduationYear = 年度) : (変更.graduationYear = null);
    }
    状態().members.find((部員) => 部員.id === 部員ID);
    let 直す中身 = Object.assign({}, 変更);
    if (undefined !== 変更.grade && undefined === 変更.termKi) {
      const 期 = 状態().currentFreshmanTerm - (変更.grade - 1);
      直す中身.termKi = 期;
    }
    const 直した部員 = 状態().members.map((部員) =>
      部員.id === 部員ID
        ? Object.assign({}, 部員, 直す中身, { lastModified: Date.now(), syncStatus: '未同期' })
        : 部員
    );
    書く({ members: 直した部員, lastLocalChange: Date.now() });
    if (undefined !== 変更.name || undefined !== 変更.gender || undefined !== 変更.grade) {
      // 射手の並びに、直した名前・性別・学年を写す。部員に結び付いた射手（memberId）だけ。
      // 途中交代で入った人は、名前だけ（交代の欄は名前しか持たない）
      const 射手たちを直す = (射手たち) => {
        let 触った = false;
        const 直した射手 = 射手たち
          .map((射手) =>
            射手 && 射手.memberId === 部員ID
              ? ((触った = true),
                Object.assign({}, 射手, {
                  name: undefined !== 変更.name ? 変更.name : 射手.name,
                  gender: undefined !== 変更.gender ? 変更.gender : 射手.gender,
                  grade: undefined !== 変更.grade ? 変更.grade : 射手.grade,
                  lastModified: Date.now(),
                }))
              : 射手
          )
          .map((射手) => {
            if (射手 && 射手.substitutionIds) {
              let 交代を直した = false;
              const 交代 = Object.assign({}, 射手.substitutions || {});
              if (
                (Object.entries(射手.substitutionIds).forEach(([番, id]) => {
                  const 添字 = Number(番);
                  id === 部員ID &&
                    undefined !== 変更.name &&
                    ((交代[添字] = 変更.name), (交代を直した = true));
                }),
                交代を直した)
              )
                return (
                  (触った = true),
                  Object.assign({}, 射手, { substitutions: 交代, lastModified: Date.now() })
                );
            }
            return 射手;
          });
        return { 直した射手, 触った };
      };
      const 記録に写す = (一覧) => {
        let 変わった = false;
        return {
          newList: 一覧.map((記録) => {
            if (!記録 || !記録.archers) return 記録;
            const { 直した射手, 触った } = 射手たちを直す(記録.archers);
            if (触った) {
              変わった = true;
              const 名前たち = Array.from(
                new Set(直した射手.map((射手) => (射手 && 射手.name ? 射手.name.trim() : '')).filter(Boolean))
              );
              return Object.assign({}, 記録, {
                archers: 直した射手,
                archerNames: 名前たち,
                lastModified: Date.now(),
              });
            }
            return 記録;
          }),
          changed: 変わった,
        };
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
      const { newList, changed } = 記録に写す(元の記録);
      const { newList: ごみ箱の一覧, changed: ごみ箱が変わった } = 記録に写す(元のごみ箱);
      if (
        (changed || ごみ箱が変わった) &&
        (書く({ sessions: newList, trash: ごみ箱の一覧, lastLocalChange: Date.now() }), 状態().activeGroupId)
      ) {
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
              const 送る中身 = JSON.parse(JSON.stringify(記録));
              送る中身.lastModified = Firestore.serverTimestamp();
              書き込み.push({ 置き場, id: 記録.id, 送る中身 });
            }
          });
        };
        if (changed) 集める(newList, 元の記録, 'sessions');
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
    状態().activeGroupId &&
      (場.部員を送る予約[部員ID] && clearTimeout(場.部員を送る予約[部員ID]),
      (場.部員を送る予約[部員ID] = setTimeout(async () => {
        const 部員 = 状態().members.find((部員1人) => 部員1人.id === 部員ID);
        if (部員) {
          // 送った版の更新日時。送信中にもう一度編集された場合、その
          // 新しい内容に「同期済み」を付けないための目印。
          const 送った版 = 部員.lastModified;
          const 送る中身 = Object.assign({}, 部員, {
            lastModified: Firestore.serverTimestamp(),
            syncStatus: '同期済み',
          });
          Firestore.updateDoc(
            Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員ID),
            送る中身
          )
            .then(() => {
              console.log(`[Store] Debounced Member Sync Success: ${部員.name}`);
              書く((前) => ({
                members: 前.members.map((部員1人) =>
                  部員1人 && 部員1人.id === 部員ID && 部員1人.lastModified === 送った版
                    ? Object.assign({}, 部員1人, { syncStatus: '同期済み' })
                    : 部員1人
                ),
              }));
              delete 場.部員を送る予約[部員ID];
            })
            .catch((誤り) => {
              console.error('Update Member Sync Error:', 誤り);
              delete 場.部員を送る予約[部員ID];
            });
        }
      }, 300)));
  },
  deleteMember: (部員ID) => {
    if (!状態().activeGroupId || 'group' !== 状態().activeRole)
      return void Alert.alert('権限エラー', 'メンバーの削除は団体ログイン時のみ可能です。');
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
          'group' === 状態().activeRole
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
    if (!団体 || 'group' !== activeRole || !Firebaseの器.db) return;
    try {
      const col = Firestore.collection(Firebaseの器.db, `groups/${団体}/member_lookup`);
      const snap = await Firestore.getDocs(col);
      const want = new Map();
      (members || []).forEach((部員) => {
        if (部員 && 部員.id && /^\d{4}$/.test(部員.personalId || '')) want.set(部員.personalId, 部員.id);
      });
      const batch = Firestore.writeBatch(Firebaseの器.db);
      let 件数 = 0;
      const 今いる部員 = new Set((members || []).filter((部員) => 部員 && 部員.id).map((部員) => 部員.id));
      snap.forEach((文書) => {
        // 招待リンクの合言葉（src/memberInvite.js）は個人ID ではないので、下の突き合わせに
        // かけない（かけると「知らない番号」として消してしまう）。メンバーから外れた人の
        // 合言葉だけ片付ける。名簿が空のとき（まだ読めていないことがある）は消さない。
        // 個人ID の文書は次の整理で作り直されるが、合言葉は作り直せないので。
        // 最後の 1 人を消したときは deleteMember が名指しで取り消す
        const 中身 = 文書.data() || {};
        if (中身.招待 === true) {
          if (今いる部員.size && !今いる部員.has(中身.memberId)) {
            batch.delete(文書.ref);
            件数++;
          }
          return;
        }
        const 欲しい部員ID = want.get(文書.id);
        if (!欲しい部員ID) {
          batch.delete(文書.ref);
          件数++;
        } else if (文書.data().memberId === 欲しい部員ID) {
          want.delete(文書.id);
        }
      });
      want.forEach((memberId, pid) => {
        batch.set(Firestore.doc(Firebaseの器.db, `groups/${団体}/member_lookup`, pid), {
          memberId,
          // Date で置く（管理画面で日時として読める。読むのは人だけ）
          updatedAt: new Date(),
        });
        件数++;
      });
      if (件数 > 0) {
        await batch.commit();
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
   * （団体 910280 で、94 件のうち 52 件。src/memberNameSync.js）。見つけて直す。
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
    if (!団体 || 'group' !== 今.activeRole || !今.isNetworkOnline || 今.isLiveActive) return;
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
        (一覧 || []).filter((記録) => 記録 && '未同期' === 記録.syncStatus).map((記録) => 記録.id)
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
          if (!記録 || !直した.has(置き場 + '/' + 記録.id) || '未同期' === 記録.syncStatus) return 記録;
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
    const { members: 部員たち, alumni, activeGroupId: 団体 } = 状態();
    // 名簿を書けるのは団体アカウントだけ。部員の端末で走ると、他人の
    // 個人IDを勝手に振ってしまう。しかも逆引き表（こちらは団体限定）は
    // 更新されないため、その人がログインできなくなる。
    if (!団体 || 'group' !== 状態().activeRole) return;
    const _ensureDb = await waitForDb();
    if (!_ensureDb) {
      console.warn('[Store] ensurePersonalIds: db still undefined after await, aborting');
      return;
    }
    const 部員の写し = [...部員たち];
    const 卒業生の写し = [...alumni];
    let 変わった = false;
    const 使われている個人ID = () =>
      [
        ...部員の写し.map((部員) => 部員.personalId),
        ...卒業生の写し.map((卒業生) => 卒業生.personalId),
      ].filter((個人ID) => !!個人ID);
    const 形が正しい = (id) => !!id && /^\d{4}$/.test(id);
    const 空いている番号を作る = (使われている) => {
      let 候補 = '';
      let 回数 = 0;
      do {
        候補 = Math.floor(1e3 + 9e3 * Math.random()).toString();
        回数++;
      } while (使われている.includes(候補) && 回数 < 5e3);
      return 候補;
    };
    const 一括 = Firestore.writeBatch(Firebaseの器.db);
    let 件数 = 0;
    for (let 番 = 0; 番 < 部員の写し.length; 番++)
      if (!形が正しい(部員の写し[番].personalId)) {
        const 使われている = 使われている個人ID();
        const 今 = Date.now();
        // 送信が済むまでは「未同期」にしておく。送信が失われた場合、
        // 「同期済み」だと送り直しの対象にならず、クラウドにIDが無いまま
        // 固定される。すると別の端末が別のIDを振り、端末ごとに食い違う。
        部員の写し[番] = Object.assign({}, 部員の写し[番], {
          personalId: 空いている番号を作る(使われている),
          lastModified: 今,
          syncStatus: '未同期',
        });
        一括.set(
          Firestore.doc(Firebaseの器.db, `groups/${団体}/members`, 部員の写し[番].id),
          Object.assign({}, 部員の写し[番], {
            syncStatus: '同期済み',
            lastModified: Firestore.serverTimestamp(),
          })
        );
        件数++;
        変わった = true;
      }
    for (let 番 = 0; 番 < 卒業生の写し.length; 番++)
      if (!形が正しい(卒業生の写し[番].personalId)) {
        const 使われている = 使われている個人ID();
        const 今 = Date.now();
        // メンバーと同じ理由で「未同期」にする
        卒業生の写し[番] = Object.assign({}, 卒業生の写し[番], {
          personalId: 空いている番号を作る(使われている),
          lastModified: 今,
          syncStatus: '未同期',
        });
        一括.set(
          Firestore.doc(Firebaseの器.db, `groups/${団体}/alumni`, 卒業生の写し[番].id),
          Object.assign({}, 卒業生の写し[番], {
            syncStatus: '同期済み',
            lastModified: Firestore.serverTimestamp(),
          })
        );
        件数++;
        変わった = true;
      }
    if (変わった) {
      書く({ members: 部員の写し, alumni: 卒業生の写し, lastLocalChange: Date.now() });
      if (件数 > 0) {
        // 完了は待たない。通信できないと終わらず、この先の逆引き表の
        // 更新まで止まってしまう。届いた分は syncSessions が印を
        // 付け替え、届かなければ送り直す。
        const 送った版 = new Map(
          [...部員の写し, ...卒業生の写し].filter((人) => 人 && 人.id).map((人) => [人.id, 人.lastModified])
        );
        一括.commit()
          .then(() => {
            書く((前) => ({
              members: 前.members.map((部員) =>
                部員 && 送った版.has(部員.id) && 部員.lastModified === 送った版.get(部員.id)
                  ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                  : 部員
              ),
              alumni: 前.alumni.map((卒業生) =>
                卒業生 && 送った版.has(卒業生.id) && 卒業生.lastModified === 送った版.get(卒業生.id)
                  ? Object.assign({}, 卒業生, { syncStatus: '同期済み' })
                  : 卒業生
              ),
            }));
          })
          .catch((誤り) => console.error('[Store] 個人IDの送信に失敗:', 誤り));
      }
      console.log(`Ensured personal IDs: Updated ${件数} non-compliant IDs.`);
    }
    await 状態().syncMemberLookup();
  },
  // 弓具の履歴を足す。
  //
  // ここが無いまま MemberScreen が addEquipment を取り出していたため、
  // 「履歴を追加」を押しても何も起きなかった（消すほうだけ在った）。
  // 消すほうと同じ形にそろえてある：手元を先に直し、送れたら印を下ろす。
  addEquipment: (memberId, 中身) => {
    if (!状態().弓具を触れるか(memberId)) return;
    const 今 = Date.now();
    const 新しい記録 = {
      id: generateUUID(),
      date: Number(中身?.date) || 今,
      note: (中身?.note || '').trim(),
      weight: (中身?.weight || '').trim(),
    };
    const 直した = 状態().members.map((部員) => {
      if (部員.id !== memberId) return 部員;
      // 新しいものが上に来るように、日付の降順で並べておく。
      // 画面側もそう並べて見せている
      const 並び = [...(部員.equipments || []), 新しい記録].sort((a, b) => b.date - a.date);
      return Object.assign({}, 部員, { equipments: 並び, lastModified: 今, syncStatus: '未同期' });
    });
    書く({ members: 直した, lastLocalChange: 今 });
    const 本人 = 直した.find((部員) => 部員.id === memberId);
    if (本人 && 状態().activeGroupId) {
      const 送る形 = Object.assign({}, 本人, {
        lastModified: Firestore.serverTimestamp(),
        syncStatus: '同期済み',
      });
      Firestore.updateDoc(
        Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, memberId),
        送る形
      )
        .then(() => {
          // 印を付けるのは送った版だけ（消すほうと同じ考え方）
          書く((前) => ({
            members: 前.members.map((部員) =>
              部員 && 部員.id === memberId && 部員.lastModified === 本人.lastModified
                ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                : 部員
            ),
          }));
        })
        .catch((err) => console.error('Add Equipment Sync Error:', err));
    }
  },
  deleteEquipment: (memberId, 記録ID) => {
    if (!状態().弓具を触れるか(memberId)) return;
    const 今 = Date.now();
    const 直した = 状態().members.map((部員) => {
      if (部員.id === memberId) {
        const 今の弓具 = 部員.equipments || [];
        return Object.assign({}, 部員, {
          equipments: 今の弓具.filter((記録) => 記録.id !== 記録ID),
          lastModified: 今,
          syncStatus: '未同期',
        });
      }
      return 部員;
    });
    書く({ members: 直した, lastLocalChange: 今 });
    const 本人 = 直した.find((部員) => 部員.id === memberId);
    if (本人 && 状態().activeGroupId) {
      const 送る形 = Object.assign({}, 本人, {
        lastModified: Firestore.serverTimestamp(),
        syncStatus: '同期済み',
      });
      Firestore.updateDoc(
        Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, memberId),
        送る形
      )
        .then(() => {
          // 印を付けるのは送った版だけ（記録側と同じ考え方）
          書く((前) => ({
            members: 前.members.map((部員) =>
              部員 && 部員.id === memberId && 部員.lastModified === 本人.lastModified
                ? Object.assign({}, 部員, { syncStatus: '同期済み' })
                : 部員
            ),
          }));
        })
        .catch((誤り) => console.error('Delete Equipment Sync Error:', 誤り));
    }
  },
});

module.exports = { 部員の操作 };
