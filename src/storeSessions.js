'use strict';

/**
 * 店の操作のうち、記録（練習・試合）を扱うもの：保存する・開く・履歴の記録を記録画面で直す・消す・ゴミ箱・戻す、
 * 交代、射数、端末の記録を読む／片付ける。
 * （2026-10-05 に useScoreStore.js から分けた。中身は変えていない。店の名指しは 場.店 にした）
 * 店（useScoreStore.js）が ...記録の操作(書く, 状態, そのまま書く) で広げる。
 */
const {
  Alert,
  Firebaseの器,
  Firestore,
  RTDB,
  generateUUID,
  waitForDb,
  ライブの枝,
  ライブへ盤面を送る,
  不具合を控える,
  共有履歴の場所,
  写しの場所,
  団体の枝,
  在席の場所,
  期限の場所,
  秘,
  行動を控える,
  記録の射手を整える,
  雲へ書く記録,
} = require('./storeShared');

const 記録の操作 = (書く, 状態, そのまま書く) => ({
  saveSession: async (題, 覚え書き, 統計に入れる, タグ, attendanceData) => {
    行動を控える('記録を保存', (状態().archers || []).length + '人');
    // 閲覧用は記録として残さない。画面側でも保存の帯を薄くしてあるが、
    // 道が増えたときに漏れないよう、ここでも止める
    if (状態().書き換えを止めるか()) return;
    // よその団体のライブも、自分の記録には残さない（保存を止めるか を参照）
    if (状態().保存を止めるか()) return;
    const 記録ID = 状態().activeSessionID || generateUUID();
    const { archers, shotsPerRound, activeGroupId, activeRole, myMemberId } = 状態();
    const 射手たち = Array.isArray(archers) ? archers : [];
    const 記録 = {
      id: 記録ID,
      date: Date.now(),
      title: 題,
      note: 覚え書き,
      archers: JSON.parse(JSON.stringify(射手たち)),
      archerNames: Array.from(
        new Set(射手たち.map((射手) => (射手 && 射手.name ? 射手.name.trim() : '')).filter(Boolean))
      ),
      shotCount: shotsPerRound || 8,
      includeInStats: 統計に入れる,
      tags: タグ,
      attendance: attendanceData,
      syncStatus: '未同期',
      lastModified: Date.now(),
    };
    // 個人モードでの上書きは、手元に確定する前に止める。
    // 雲には聞かない。以前は getDoc で確かめていたが、電波が弱い（つながって
    // いるのに応答が来ない）と返らず、保存が終わらないまま記録表が残り、もう一度
    // 押せてしまった（2026-09-19）。新しい記録（id を今作った）は雲に無いので
    // 見る必要がなく、履歴から載せた記録なら手元の控えの 同期済み が雲にある印
    if (activeGroupId && 'member' === activeRole && 状態().activeSessionID) {
      const 手元 = (Array.isArray(状態().sessions) ? 状態().sessions : []).find(
        (記録1件) => 記録1件 && 記録1件.id === 記録ID
      );
      if (手元 && '同期済み' === 手元.syncStatus) {
        const 文 = 'この記録はすでにクラウドに存在するため、個人モードからは更新できません。';
        return void Alert.alert('保存制限', 文);
      }
    }
    // まず手元に確定する。クラウドの応答は待たない。
    // 待つと、通信できないときに射手が消えず履歴にも出ないうえ、
    // 画面には何も知らされないままになる。
    const 元のライブ名 = 状態().liveSessionName;
    状態().stopLiveSync(true);
    書く((前) => ({
      sessions: [記録, ...前.sessions.filter((記録1件) => 記録1件.id !== 記録ID)],
      activeSessionID: null,
      archers: [],
      isLiveActive: false,
      ライブの続き: null,
      isHost: false,
      liveSessionName: null,
      lastLocalChange: Date.now(),
      syncStatus: '未同期',
      // 盤面を片付けたので、遡れる手も捨てる。リセットと同じ扱い。
      // 残すと、保存したあとに取り消しを押すと保存済みの盤面が戻り、
      // そのままもう一度保存すると同じ記録が二重に入る
      historyStack: [],
      redoStack: [],
      historySharedLen: 0,
      historySharedMax: 0,
    })); // ライブ記録の後始末。届かなくても保存には影響させない
    const 枝 = ライブの枝();
    // 共有していたライブは、団体の枝の道しるべと閲覧用の写しも残る。
    // 消さないと、参加一覧に入れないライブが並び、写しも読めたままになる
    const 団 = 団体の枝();
    const 閲覧枝 = 状態().いまのライブの閲覧枝;
    if (元のライブ名 && Firebaseの器.rtdb && 枝) {
      const ライブの節点 = RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${元のライブ名}`);
      RTDB.update(RTDB.ref(Firebaseの器.rtdb, `live_sessions/${枝}/${元のライブ名}/state`), {
        status: 'finished',
        timestamp: RTDB.serverTimestamp(),
      }).catch(() => {});
      if (秘.枝として使えるか(閲覧枝))
        RTDB.update(RTDB.ref(Firebaseの器.rtdb, 写しの場所(閲覧枝, 元のライブ名)), {
          status: 'finished',
          timestamp: RTDB.serverTimestamp(),
        }).catch(() => {});
      setTimeout(async () => {
        const 落とす = (道) => RTDB.remove(RTDB.ref(Firebaseの器.rtdb, 道)).catch(() => {});
        await Promise.all([
          RTDB.remove(ライブの節点).catch(() => {}),
          // 共有履歴と在席は別の枝にあるので、明示的に消す
          落とす(共有履歴の場所(枝, 元のライブ名)),
          落とす(在席の場所(枝, 元のライブ名)),
          // 共有していたときの道しるべと写しも消す
          団 && 団 !== 枝 ? 落とす(`live_sessions/${団}/${元のライブ名}`) : null,
          秘.枝として使えるか(閲覧枝) ? 落とす(`live_view/${閲覧枝}/${元のライブ名}`) : null,
        ]);
        // 期限は最後。中身が残っているうちは決まりが消させない
        // （消せると、期限を外してリンクをよみがえらせられてしまう）。
        // 団体の枝には期限が無いので、共有していたときだけ
        if (団 && 団 !== 枝) {
          await 落とす(期限の場所(枝));
          if (秘.枝として使えるか(閲覧枝)) await 落とす(期限の場所(閲覧枝));
        }
      }, 2e3);
    }
    // クラウドへ送る。ここも待たない。
    // 届くまでは「未同期」のままにしておく。そうすれば syncSessions の
    // 再送で拾われ、通信が戻ったときに自動で送られる。
    if (activeGroupId) {
      // 日付と射手の更新日時は日時型で送る（雲へ書く記録）
      const 送る形 = 雲へ書く記録(JSON.parse(JSON.stringify(記録)));
      送る形.syncStatus = '同期済み';
      送る形.lastModified = Firestore.serverTimestamp();
      Firestore.setDoc(Firestore.doc(Firebaseの器.db, `groups/${activeGroupId}/sessions`, 記録ID), 送る形, {
        merge: true,
      })
        .then(() => {
          // 印を付けるのは送った版だけ。送信中に編集されると更新日時が
          // 変わるので、一致する場合に限る（updateSession と同じ考え方）。
          書く((前) => ({
            sessions: 前.sessions.map((記録1件) =>
              記録1件 && 記録1件.id === 記録ID && 記録1件.lastModified === 記録.lastModified
                ? Object.assign({}, 記録1件, { syncStatus: '同期済み' })
                : 記録1件
            ),
            syncStatus: '同期済み',
          }));
        })
        .catch((誤り) => {
          console.error('Save Session Cloud Error:', 誤り);
          不具合を控える('記録の保存（クラウド）', 誤り);
          書く({ syncStatus: '同期エラー' });
        });
    }
  },
  loadSession: (記録ID) => {
    const 記録 = (Array.isArray(状態().sessions) ? 状態().sessions : []).find(
      (記録1件) => 記録1件 && 記録1件.id === 記録ID
    );
    if (記録)
      書く({
        archers: 記録.archers,
        shotsPerRound: 記録.shotCount,
        activeSessionID: 記録.id,
        historyStack: [],
        redoStack: [],
      });
  },
  /**
   * 履歴の記録を、記録画面に載せて直す（管理者モードの履歴から）。
   *
   * 履歴の詳細で直せるのは ○×・鍵・名前・削除だけで、人や間隔や計を足す、
   * 並べ替える、矢所、射数を変える、はできなかった（使う人：「普通の記録表で
   * できることをすべて」2026-09-17）。記録画面そのものに載せ替えれば道具は
   * 全部そのまま使える。いま記録中の盤面は 控え に取り、終えるときに据え直す。
   * 端末に残す（partialize）ので、途中で閉じても元の盤面は失われない。
   *
   * ライブ中は載せ替えない（盤面がライブと結びついている）。
   * @returns {boolean} 載せ替えたか
   */
  履歴の記録を記録画面で開く: (id) => {
    const 店 = 状態();
    if (店.履歴の編集 || 店.isLiveActive) return false;
    const 記録 = (Array.isArray(店.sessions) ? 店.sessions : []).find(
      (記録1件) => 記録1件 && 記録1件.id === id
    );
    if (!記録) return false;
    行動を控える('履歴の記録を記録画面で開く', id);
    書く({
      履歴の編集: {
        id,
        控え: {
          archers: 店.archers,
          shotsPerRound: 店.shotsPerRound,
          activeSessionID: 店.activeSessionID,
          historyStack: 店.historyStack,
          redoStack: 店.redoStack,
        },
      },
      archers: JSON.parse(JSON.stringify(記録の射手を整える(記録))),
      shotsPerRound: 記録.shotCount || 8,
      // 記録中の id を外す。付けたままだと「終了・保存」やライブがその記録に結びつく
      activeSessionID: null,
      historyStack: [],
      redoStack: [],
    });
    return true;
  },
  /**
   * 記録画面での履歴の直しを終える。保存するなら記録を書き戻し（題・メモ・タグ・日付は
   * そのまま）、どちらでも直す前の盤面を据え直す
   */
  履歴の編集を終える: (保存する) => {
    const 店 = 状態();
    const 編集 = 店.履歴の編集;
    if (!編集) return;
    if (保存する) {
      const 射手たち = JSON.parse(JSON.stringify(Array.isArray(店.archers) ? 店.archers : []));
      店.updateSession(編集.id, {
        archers: 射手たち,
        shotCount: 店.shotsPerRound,
        archerNames: Array.from(
          new Set(射手たち.map((射手) => (射手 && 射手.name ? 射手.name.trim() : '')).filter(Boolean))
        ),
      });
    }
    行動を控える('履歴の編集を終える', 保存する ? '保存' : '取りやめ');
    書く(Object.assign({ 履歴の編集: null }, 編集.控え));
  },
  deleteSession: async (記録ID) => {
    const 元 = Array.isArray(状態().sessions) ? 状態().sessions : [];
    const 消す記録 = 元.find((記録) => 記録 && 記録.id === 記録ID);
    const 残り = 元.filter((記録) => 記録 && 記録.id !== 記録ID);
    // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
    // ときに削除がクラウドへ届かないまま消し込まれ、次の全件取得で
    // 記録が復活しゴミ箱からも消えてしまう。
    //
    // pendingDelete は「この端末で捨てて、まだ送れていない」という印。
    // クラウドの写しを読み込んだだけの項目と区別するために要る。これが
    // ないと、ゴミ箱を空にした直後に写しを読み込んだ項目まで送り直しの
    // 対象になり、空にしたはずのものが戻ってしまう。
    書く(
      消す記録
        ? {
            sessions: 残り,
            trash: [
              ...状態().trash,
              Object.assign({}, 消す記録, { syncStatus: '未同期', pendingDelete: true }),
            ],
          }
        : { sessions: 残り }
    );
    try {
      const 一括 = Firestore.writeBatch(Firebaseの器.db);
      if (
        (一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録ID)),
        消す記録)
      ) {
        const ごみ箱に置く形 = 雲へ書く記録(
          JSON.parse(JSON.stringify(Object.assign({}, 消す記録, { syncStatus: 'trashed' })))
        );
        ごみ箱に置く形.lastModified = Firestore.serverTimestamp();
        ごみ箱に置く形.deletedAt = Firestore.serverTimestamp();
        一括.set(
          Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録ID),
          ごみ箱に置く形
        );
      }
      // 完了は待たない。通信できないと終わらないため、呼び出し側が
      // 待つと画面が反応しなくなる。送信は待ち行列に任せる。
      一括.commit().catch((誤り) => console.error('Delete Session Error:', 誤り));
    } catch (誤り) {
      console.error('Delete Session Error:', 誤り);
    }
  },
  emptyTrash: async () => {
    const { trash, activeGroupId: 団体 } = 状態();
    if (!trash || 0 === trash.length) return;
    const 消すID = trash.map((記録) => 記録.id);
    // 通信できるかで送信を止めない。止めると手元からだけ消えて、クラウドの
    // ゴミ箱は残り、次の全件取得で消したはずのものが戻ってきてしまう。
    // 通信できないときは Firestore の待ち行列に入り、つながった時点で送られる。
    // 完全に消したことを控えておく。送信が失われても、次の取得で
    // 戻ってこないようにするため。
    const 控え = Object.assign({}, 状態().permanentlyDeleted);
    消すID.forEach((id) => {
      控え[id] = Date.now();
    });
    if (
      (console.log('[Store] Emptying trash:', 消すID.length, 'items'),
      書く({ trash: [], permanentlyDeleted: 控え }),
      団体)
    )
      try {
        const 一括 = Firestore.writeBatch(Firebaseの器.db);
        消すID.forEach((id) => {
          一括.delete(Firestore.doc(Firebaseの器.db, `groups/${団体}/trash`, id));
        });
        // 完了は待たない（deleteSession と同じ理由）
        一括.commit()
          .then(() => console.log('[Store] Cloud trash emptied'))
          .catch((誤り) => console.error('[Store] Error emptying cloud trash:', 誤り));
      } catch (誤り) {
        console.error('[Store] Error emptying cloud trash:', 誤り);
      }
  },
  deleteTrashItems: async (消すID) => {
    if (消すID && 0 !== 消すID.length)
      try {
        const { trash: ごみ箱, activeGroupId: 団体 } = 状態();
        console.log('[Store] Deleting trash items:', 消すID);
        if (団体) console.log(`[Store] Target Firestore path: groups/${団体}/trash/`);
        const 残り = (ごみ箱 || []).filter((記録) => 記録 && !消すID.includes(記録.id));
        // emptyTrash と同じく、完全に消したことを控えておく
        const 控え = Object.assign({}, 状態().permanentlyDeleted);
        消すID.forEach((id) => {
          id && (控え[id] = Date.now());
        });
        // emptyTrash と同じ理由で、通信できるかでは止めない
        if ((書く({ trash: 残り, permanentlyDeleted: 控え }), 団体)) {
          const 一括 = Firestore.writeBatch(Firebaseの器.db);
          let 件数 = 0;
          消すID.forEach((id) => {
            id && (一括.delete(Firestore.doc(Firebaseの器.db, `groups/${団体}/trash`, id)), 件数++);
          });
          if (件数 > 0)
            一括.commit()
              .then(() => console.log('[Store] Successfully deleted trash items from cloud'))
              .catch((誤り) => console.error('[Store] Delete trash items error:', 誤り));
        } else console.warn('[Store] Skipping cloud deletion: activeGroupId が無い');
      } catch (誤り) {
        console.error('[Store] Delete trash items error:', 誤り);
      }
    else console.warn('[Store] deleteTrashItems called with no IDs');
  },
  deleteMultipleSessions: async (消すID) => {
    const 消す記録 = 状態().sessions.filter((記録) => 消すID.includes(記録.id));
    const 残り = 状態().sessions.filter((記録) => !消すID.includes(記録.id));
    書く({
      sessions: 残り,
      trash: [
        ...状態().trash,
        ...消す記録.map((記録) => Object.assign({}, 記録, { syncStatus: '未同期', pendingDelete: true })),
      ],
    });
    try {
      const 一括 = Firestore.writeBatch(Firebaseの器.db);
      消すID.forEach((id) =>
        一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, id))
      );
      消す記録.forEach((記録) => {
        const ごみ箱に置く形 = 雲へ書く記録(JSON.parse(JSON.stringify(Object.assign({}, 記録, { syncStatus: 'trashed' }))));
        ごみ箱に置く形.lastModified = Firestore.serverTimestamp();
        ごみ箱に置く形.deletedAt = Firestore.serverTimestamp();
        一括.set(
          Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録.id),
          ごみ箱に置く形
        );
      });
      一括.commit().catch((誤り) => console.error('Batch Delete Error:', 誤り));
    } catch (誤り) {
      console.error('Batch Delete Error:', 誤り);
    }
  },
  restoreSession: async (記録ID) => {
    const ごみ箱 = Array.isArray(状態().trash) ? 状態().trash : [];
    const 戻す記録 = ごみ箱.find((記録) => 記録 && 記録.id === 記録ID);
    if (!戻す記録) return;
    const 戻した形 = Object.assign({}, 戻す記録, {
      // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
      // ときに復元がクラウドへ届かないまま同期済み扱いになり、次の全件取得
      // でゴミ箱へ戻ってしまう。
      syncStatus: '未同期',
      // ゴミ箱側の印は記録に持ち込まない
      pendingDelete: undefined,
    });
    const 今の記録 = Array.isArray(状態().sessions) ? 状態().sessions : [];
    // 戻したなら、完全に消した控えからも外す。残っていると画面に出なくなる
    const 控え = Object.assign({}, 状態().permanentlyDeleted);
    delete 控え[記録ID];
    書く({
      trash: ごみ箱.filter((記録) => 記録 && 記録.id !== 記録ID),
      sessions: [戻した形, ...今の記録],
      permanentlyDeleted: 控え,
    });
    try {
      const 一括 = Firestore.writeBatch(Firebaseの器.db);
      一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, 記録ID));
      const 送る形 = 雲へ書く記録(JSON.parse(JSON.stringify(戻した形)));
      送る形.lastModified = Firestore.serverTimestamp();
      一括.set(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録ID), 送る形);
      一括.commit().catch((誤り) => console.error('Restore Session Error:', 誤り));
    } catch (誤り) {
      console.error('Restore Session Error:', 誤り);
    }
  },
  restoreTrashItems: async (戻すID) => {
    if (!戻すID || 0 === 戻すID.length) return;
    const ごみ箱 = 状態().trash || [];
    const 戻す記録 = ごみ箱.filter((記録) => 戻すID.includes(記録.id));
    const 残り = ごみ箱.filter((記録) => !戻すID.includes(記録.id));
    const 戻した形 = 戻す記録.map((記録) =>
      Object.assign({}, 記録, {
        syncStatus: '未同期',
        // ゴミ箱側の印は記録に持ち込まない
        pendingDelete: undefined,
      })
    );
    // restoreSession と同じく、完全に消した控えから外す
    const 控え = Object.assign({}, 状態().permanentlyDeleted);
    戻すID.forEach((id) => delete 控え[id]);
    書く({ trash: 残り, sessions: [...戻した形, ...状態().sessions], permanentlyDeleted: 控え });
    try {
      const 一括 = Firestore.writeBatch(Firebaseの器.db);
      戻すID.forEach((id) =>
        一括.delete(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/trash`, id))
      );
      戻した形.forEach((記録) => {
        const 送る形 = 雲へ書く記録(JSON.parse(JSON.stringify(記録)));
        送る形.lastModified = Firestore.serverTimestamp();
        一括.set(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/sessions`, 記録.id), 送る形);
      });
      一括.commit().catch((誤り) => console.error('Restore Trash Items Error:', 誤り));
    } catch (誤り) {
      console.error('Restore Trash Items Error:', 誤り);
    }
  },
  updateState: (変更) => {
    書く(変更);
  },
  updateSession: async (記録ID, 変更) => {
    const 今の記録 = 状態().sessions || [];
    const 位置 = 今の記録.findIndex((記録) => 記録 && 記録.id === 記録ID);
    if (-1 === 位置) return;
    const 元の記録 = 今の記録[位置];
    if ('member' === 状態().activeRole && 変更.archers && 変更.archers.length < 元の記録.archers.length)
      return void console.warn('[updateSession] Prevented accidental data stripping in member mode');
    // 送信が済むまでは「未同期」にしておく。こうしないと、通信できない
    // ときに編集がクラウドへ届かないまま同期済み扱いになり、他の記録が
    // 更新された拍子にクラウドの古い写しで上書きされて編集が消える。
    const 直した記録 = Object.assign({}, 今の記録[位置], 変更, {
      lastModified: Date.now(),
      syncStatus: '未同期',
    });
    const 直した一覧 = [...今の記録];
    直した一覧[位置] = 直した記録;
    書く({ sessions: 直した一覧 });
    const 団体 = 状態().activeGroupId;
    if (!団体) return;
    if (状態()._pendingUpdateTimers[記録ID]) clearTimeout(状態()._pendingUpdateTimers[記録ID]);
    const 予約 = setTimeout(() => {
      // タイマーの控えは先に片付ける。通信できないと送信は終わらないので、
      // 送信の完了を待って片付けると残り続けてしまう。
      書く((前) => {
        const 予約の表 = Object.assign({}, 前._pendingUpdateTimers);
        return (delete 予約の表[記録ID], { _pendingUpdateTimers: 予約の表 });
      });
      const 記録 = 状態().sessions.find((記録1件) => 記録1件 && 記録1件.id === 記録ID);
      if (!記録) return;
      // 送った版の更新日時を控える。送信中にもう一度編集されると
      // 更新日時が変わるので、戻ってきたときに一致する場合だけ印を付ける。
      // これをしないと、まだ届いていない新しい内容が「同期済み」に見え、
      // 次の突き合わせでクラウドの古い写しに負けて編集が消える。
      //
      // 「同じ物を指しているか」では駄目。リスナーが中身はそのままに
      // 記録を作り直すことがあり、変わっていなくても別物になる。
      const 送った版 = 記録.lastModified;
      const 送る形 = 雲へ書く記録(JSON.parse(JSON.stringify(記録)));
      // 送信の完了は待たない。通信できないときは Firestore の待ち行列に
      // 入り、つながった時点で送られる。
      送る形.lastModified = Firestore.serverTimestamp();
      Firestore.updateDoc(Firestore.doc(Firebaseの器.db, `groups/${団体}/sessions`, 記録ID), 送る形)
        .then(() => {
          console.log(`[Store] Debounced sync finished for ${記録ID}`);
          書く((前) => ({
            sessions: 前.sessions.map((記録1件) =>
              記録1件 && 記録1件.id === 記録ID && 記録1件.lastModified === 送った版
                ? Object.assign({}, 記録1件, { syncStatus: '同期済み' })
                : 記録1件
            ),
          }));
        })
        .catch((誤り) => {
          console.error('Update Session Sync Error:', 誤り);
        });
    }, 800);
    書く((前) => ({
      _pendingUpdateTimers: Object.assign({}, 前._pendingUpdateTimers, { [記録ID]: 予約 }),
    }));
  },
  setSubstitution: (射手ID, 番, 名前, 部員ID) => {
    if (状態().書き換えを止めるか()) return;
    // 交代も一手として積む。積まないと、○×の取り消しを続けたときに
    // 交代を入れる前の控えまで戻り、交代ごと巻き添えで消えていた。
    // 射数の変更（setShotsPerRound）と同じ考え方
    const 変える前 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 交代の中身 = (一覧) => {
      const 射手 = (一覧 || []).find((射手1人) => 射手1人 && 射手1人.id === 射手ID);
      if (!射手) return '';
      return JSON.stringify([射手.substitutions || {}, 射手.substitutionIds || {}]);
    };
    const 前の交代 = 交代の中身(変える前);
    const 直した = 変える前.map((射手) => {
      if (射手 && 射手.id === 射手ID) {
        const 交代 = Object.assign({}, 射手.substitutions || {});
        if ('' !== 名前) {
          交代[番] = 名前;
          const 交代の部員 = Object.assign({}, 射手.substitutionIds || {});
          return (
            部員ID ? (交代の部員[番] = 部員ID) : delete 交代の部員[番],
            Object.assign({}, 射手, {
              substitutions: 交代,
              substitutionIds: 交代の部員,
              lastModified: Date.now(),
            })
          );
        }
        if ((delete 交代[番], 射手.substitutionIds)) {
          const 交代の部員 = Object.assign({}, 射手.substitutionIds);
          return (
            delete 交代の部員[番],
            Object.assign({}, 射手, {
              substitutions: 交代,
              substitutionIds: 交代の部員,
              lastModified: Date.now(),
            })
          );
        }
        return Object.assign({}, 射手, { substitutions: 交代, lastModified: Date.now() });
      }
      return 射手;
    });
    // 同じ内容を選び直したときは積まない。押しても何も起きない
    // 一手が挟まり、取り消しが空振りして見える
    const 交代が変わる = 交代の中身(直した) !== 前の交代;
    書く(
      Object.assign(
        { archers: 直した, lastLocalChange: Date.now() },
        交代が変わる ? { historyStack: [...状態().historyStack, 変える前], redoStack: [] } : null
      )
    );
    const { isLiveActive, liveSessionName, shotsPerRound } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, shotsPerRound);
  },
  setShotsPerRound: (本数) => {
    if (状態().書き換えを止めるか()) return;
    // 射数を減らすと○×を切り捨てる。取り消しで戻せるよう、変える前の
    // 盤面を一手として積む。控えの○×の長さがそのときの射数になるので、
    // 取り消し側はそれを見て射数ごと戻す
    const 変える前 = Array.isArray(状態().archers) ? 状態().archers : [];
    const 射数が変わる = 本数 !== 状態().shotsPerRound;
    const 直した = (Array.isArray(状態().archers) ? 状態().archers : []).map((射手) => {
      if (!射手 || 射手.isSeparator) return 射手;
      const 今の印 = Array.isArray(射手.marks) ? 射手.marks : [];
      const 新しい印 = [...今の印];
      return (
        本数 > 今の印.length ? 新しい印.push(...Array(本数 - 今の印.length).fill('')) : 新しい印.splice(本数),
        Object.assign({}, 射手, { marks: 新しい印, lastModified: Date.now() })
      );
    });
    書く(
      Object.assign(
        { shotsPerRound: 本数, archers: 直した, lastLocalChange: Date.now() },
        // 同じ射数を選び直したときは積まない。押しても何も起きない
        // 一手が挟まり、取り消しが空振りして見える
        射数が変わる ? { historyStack: [...状態().historyStack, 変える前], redoStack: [] } : null
      )
    );
    const { isLiveActive, liveSessionName } = 状態();
    if (isLiveActive && liveSessionName) ライブへ盤面を送る(liveSessionName, 直した, 本数);
  },
  loadData: () => {
    状態().checkOfflineSave();
    状態().syncSessions();
  },
  // オフライン保存が効いているかを確かめ、効いていなければ画面に出す文言を持たせる。
  // 効いていない状態で電波の無い場所で保存すると、画面を閉じた時点で
  // 送信待ちごと記録が失われるため、黙って進ませない。
  checkOfflineSave: async () => {
    try {
      await waitForDb();
      const 控えの様子 = require('./db').persistence || {};
      if ('ok' === 控えの様子.state || 'pending' === 控えの様子.state)
        return void (状態().offlineSaveWarning && 書く({ offlineSaveWarning: null }));
      const 文 =
        'multipleTabs' === 控えの様子.state
          ? 'この記録画面が複数のタブで開かれているため、電波のない場所での保存が保護されません。他のタブを閉じて開き直してください。'
          : 'このブラウザでは電波のない場所での保存が保護されません。通信できる場所で保存してください。';
      console.warn('[Store] オフライン保存が無効です:', 控えの様子);
      書く({ offlineSaveWarning: 文 });
    } catch (誤り) {
      console.warn('[Store] オフライン保存の確認に失敗:', 誤り);
    }
  },
  clearAllData: () =>
    書く({
      sessions: [],
      members: [],
      history: [],
      alumni: [],
      trash: [],
      archers: [],
      activeSessionID: null,
    }),
});

module.exports = { 記録の操作 };
