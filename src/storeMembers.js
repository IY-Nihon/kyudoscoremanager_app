'use strict';

const 個人ID = require('./kojinId');

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
  waitForDb,
  ライブへ盤面を送る,
  名前の整合,
  場,
  雲へ書く記録,
  送った版に印を付ける,
  送った版の表,
  雲から読んだか,
} = require('./storeShared');
const 学 = require('./gakunen');
const 区 = require('./kubun');

/**
 * 逆引き表（member_lookup）を合わせた跡。店ごとに持つ（状態 を鍵にする）。端末には残さない：
 * 起動して最初は必ず雲を読む（ほかの端末が表を変えていることがある）
 *   済み … 最後に雲と合わせ終えたときの名簿と削除の控えの印。同じなら読まない
 *   走っている・もう一度 … 同時に 2 本走らせない。走っている間に呼ばれたら、終わってから 1 回だけ見直す
 */
const 逆引きの跡 = new WeakMap();
const 逆引きの印 = (団体, 部員たち, 削除の控え) =>
  JSON.stringify([
    団体,
    (部員たち || [])
      .filter((部員) => 部員 && 部員.id)
      .map((部員) => 部員.id)
      .sort(),
    Object.keys(削除の控え || {}).sort(),
  ]);

/**
 * 個人ID は逆引き表（groups/{団体}/member_lookup/{個人ID} → memberId）にだけ置く（2026-11-04。C）。
 * 前は名簿の文書（members・alumni）にも personalId を置いていて、部員はみな名簿を読めるので全員の個人ID が見えた。
 * 持ち主の端末は逆引き表を読んで 個人IDの表（memberId → 個人ID）を店に持つ（メンバーのタブ・設定はここから）。
 * 部員の端末には届かない（決まりで逆引き表は持ち主だけが読める。自分の個人ID は自分の所属の証から読む）
 */
async function 逆引き表を読む(団体) {
  const 返り = await Firestore.getDocs(Firestore.collection(Firebaseの器.db, `groups/${団体}/member_lookup`));
  const 行たち = [];
  返り.forEach((文書) => 行たち.push(Object.assign({}, 文書.data() || {}, { 個人ID: 文書.id, ref: 文書.ref })));
  return { 行たち, 雲から: 雲から読んだか(返り) };
}

/** 逆引き表の行から 個人IDの表（memberId → 個人ID）を作る。招待の合言葉は入れない。同じ人に 2 つあれば 6 字を選ぶ */
function 個人IDの表を作る(行たち) {
  const 表 = {};
  for (const 行 of 行たち || []) {
    if (!行 || 行.招待 === true || !行.memberId || !個人ID.個人IDの形か(行.個人ID)) continue;
    const 前 = 表[行.memberId];
    if (!前 || (!個人ID.新しい形.test(前) && 個人ID.新しい形.test(行.個人ID))) 表[行.memberId] = 行.個人ID;
  }
  return 表;
}

/** 名簿・卒業生の手元の写しから personalId を外す（雲の文書から消したあと。前の版が置いたもの） */
const 個人IDを外す = (人) => {
  if (!人 || !('personalId' in 人)) return 人;
  const 写し = Object.assign({}, 人);
  delete 写し.personalId;
  return 写し;
};

/** メンバー（卒業生も）を雲へ書く形にする。雲には「同期済み」として書く（記録と同じ） */
const 雲へ送る人 = (人) =>
  Object.assign({}, 人, { lastModified: Firestore.serverTimestamp(), syncStatus: '同期済み' });

/**
 * 部員の端末（個人ログイン）から雲へ書く形。部員が触れるのは自分の弓具だけなので、弓具だけを送る。
 * 名簿を丸ごと送ると、団体が直した名前・学年を部員の端末の古い写しで戻してしまう
 */
const 弓具だけ送る形 = (人) => ({
  equipments: 人.equipments || [],
  lastModified: Firestore.serverTimestamp(),
});

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
    // 個人ID は名簿の文書に置かない。逆引き表に振る（送ったあとの ensurePersonalIds）
    const 新しい部員 = {
      id: generateUUID(),
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
          届いた人を同期済みに(書く, [新しい部員]);
          // 足した人に個人ID を振る（逆引き表に書く）
          return 状態().ensurePersonalIds();
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
    const 消す人 = 状態().members.find((部員) => 部員 && 部員.id === 部員ID);
    const 表の個人ID = (状態().個人IDの表 || {})[部員ID];
    const 消す個人ID = 個人ID.個人IDの形か(表の個人ID || '')
      ? 表の個人ID
      : 消す人 && 個人ID.個人IDの形か(消す人.personalId || '')
        ? 消す人.personalId
        : null;
    const 残す表 = Object.assign({}, 状態().個人IDの表 || {});
    delete 残す表[部員ID];
    書く({
      個人IDの表: 残す表,
      members: 状態().members.filter((部員) => 部員.id !== 部員ID),
      deletedMembers: 控え,
      lastLocalChange: Date.now(),
    });
    Firestore.deleteDoc(Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/members`, 部員ID))
      .then(() =>
        Promise.all([
          状態().syncMemberLookup(),
          // その人の個人ID の行も名指しで消す。逆引き表の整理は、名簿が空に見えるときは行を消さないので、
          // 最後の 1 人を消したときに残ってしまう
          消す個人ID
            ? Firestore.deleteDoc(
                Firestore.doc(Firebaseの器.db, `groups/${状態().activeGroupId}/member_lookup`, 消す個人ID)
              )
            : null,
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
  /**
   * 逆引き表を整える（団体ログインの端末だけ）。消した人・卒業生に移った人の行を消し、同じ人に 2 つ以上ある
   * 個人ID の行は表で選んだもの（6 字）だけ残す。名簿に見えないだけの人の行は消さない（前は手元の名簿に
   * いない人の行を消していて、ほかの端末で足したばかりの人が入れなくなることがあった。消した人が残っても、
   * 中継が名簿にいるかを見るので入れない）。名簿と削除の控えが、前に整え終えたときと同じなら読まない
   */
  syncMemberLookup: async () => {
    const { activeGroupId: 団体, activeRole, members } = 状態();
    if (!団体 || activeRole !== 'group' || !Firebaseの器.db) return;
    if (!逆引きの跡.has(状態)) 逆引きの跡.set(状態, { 済み: null, 走っている: false, もう一度: false });
    const 跡 = 逆引きの跡.get(状態);
    if (跡.走っている) {
      跡.もう一度 = true;
      return;
    }
    const 印 = 逆引きの印(団体, members, 状態().deletedMembers);
    if (跡.済み === 印) return;
    跡.走っている = true;
    try {
      const { 行たち, 雲から } = await 逆引き表を読む(団体);
      const 今いる部員 = new Set((members || []).filter((部員) => 部員 && 部員.id).map((部員) => 部員.id));
      const 外れた人 = new Set([
        ...Object.keys(状態().deletedMembers || {}),
        ...(状態().alumni || []).filter((人) => 人 && 人.id).map((人) => 人.id),
      ]);
      const 表 = 個人IDの表を作る(行たち);
      const 一括 = Firestore.writeBatch(Firebaseの器.db);
      let 件数 = 0;
      const 残る行 = [];
      for (const 行 of 行たち) {
        const 消す =
          (外れた人.has(行.memberId) && !今いる部員.has(行.memberId)) ||
          // 同じ人のもう 1 つの個人ID（振り直す前の古い ID が残っていた）
          (行.招待 !== true && 今いる部員.has(行.memberId) && 表[行.memberId] && 表[行.memberId] !== 行.個人ID);
        if (消す) {
          一括.delete(行.ref);
          件数++;
        } else 残る行.push(行);
      }
      if (件数 > 0) {
        await 一括.commit();
        console.log('[Store] member_lookup tidied:', 件数);
      }
      if (状態().activeGroupId === 団体) 書く({ 個人IDの表: 個人IDの表を作る(残る行) });
      // 済みにするのは、雲から読めて、書き込みも届いてから（控えから答えた表で済みにしない）
      if (雲から) 跡.済み = 印;
    } catch (誤り) {
      console.error('[Store] syncMemberLookup error:', 誤り);
    } finally {
      跡.走っている = false;
    }
    if (跡.もう一度) {
      跡.もう一度 = false;
      await 状態().syncMemberLookup();
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
  /**
   * 個人ID を確かめ、持っていない人・使えない ID の人に振る（逆引き表に書く。団体ログインの端末だけ）。
   *   古い桁も替える … まだ 4 桁の人も 6 字に替える（設定の「全員の個人IDを新しくする」）
   *   全員を替える … 6 字の人も替える（漏れた ID を配り直すため。2026-11-04）
   * 逆引き表を雲から読めたときだけ振る（前は開いた直後・雲を読まずに済ませた同期でも、端末の古い名簿で
   * 名簿の文書を merge なしで書き、ほかの端末の直しを戻したり、配った ID を別の乱数に替えたりした。A1）。
   * 前の版が名簿の文書に置いた personalId は、逆引き表に無ければ足してから、名簿の文書から消す（移し替え。C）。
   * 替えた人の前の ID は逆引き表から消えるので、その場で使えなくなる（入っている端末はそのまま）
   * @returns {Promise<Array<{id: string, 名前: string, 個人ID: string}>>} 振った・替えた人
   */
  ensurePersonalIds: async (古い桁も替える = false, 全員を替える = false) => {
    const 団体 = 状態().activeGroupId;
    // 逆引き表を読み書きできるのは団体アカウントだけ
    if (!団体 || 状態().activeRole !== 'group') return [];
    if (!(await waitForDb())) {
      console.warn('[Store] ensurePersonalIds: db still undefined after await, aborting');
      return [];
    }
    let 行たち;
    try {
      const 読んだ = await 逆引き表を読む(団体);
      if (!読んだ.雲から) return [];
      行たち = 読んだ.行たち;
    } catch (誤り) {
      console.warn('[Store] ensurePersonalIds: 逆引き表を読めませんでした', 誤り && 誤り.message);
      return [];
    }
    if (状態().activeGroupId !== 団体) return [];
    const 表 = 個人IDの表を作る(行たち);
    const 使っている = new Set(行たち.map((行) => 行.個人ID));
    const 部員たち = (状態().members || []).filter((部員) => 部員 && 部員.id);
    const 一括 = Firestore.writeBatch(Firebaseの器.db);
    let 件数 = 0;
    const 振った = [];
    const 置く = (memberId, 新しいID) => {
      一括.set(Firestore.doc(Firebaseの器.db, `groups/${団体}/member_lookup`, 新しいID), {
        memberId,
        // Date で置く（管理画面で日時として読める。読むのは人だけ）
        updatedAt: new Date(),
      });
      使っている.add(新しいID);
      表[memberId] = 新しいID;
      件数++;
    };
    for (const 部員 of 部員たち) {
      let 今のID = 表[部員.id] || '';
      // 移し替え：名簿の文書に残っている個人ID が逆引き表に無ければ足す（ほかの人が使っていなければ）
      if (!今のID && 個人ID.使える個人IDか(部員.personalId || '') && !使っている.has(部員.personalId)) {
        置く(部員.id, 部員.personalId);
        今のID = 部員.personalId;
      }
      const 替える =
        !今のID ||
        !個人ID.使える個人IDか(今のID) ||
        (古い桁も替える && !個人ID.新しい形.test(今のID)) ||
        全員を替える;
      if (!替える) continue;
      const 新しいID = 個人ID.個人IDを作る([...使っている]);
      if (今のID && 使っている.has(今のID)) {
        一括.delete(Firestore.doc(Firebaseの器.db, `groups/${団体}/member_lookup`, 今のID));
        件数++;
      }
      置く(部員.id, 新しいID);
      振った.push({ id: 部員.id, 名前: 部員.name || '', 個人ID: 新しいID });
    }
    if (件数 > 0) {
      try {
        await 一括.commit();
      } catch (誤り) {
        console.error('[Store] 個人IDを書けませんでした:', 誤り);
        return [];
      }
      console.log(`Ensured personal IDs: ${振った.length} assigned`);
    }
    if (状態().activeGroupId === 団体) 書く({ 個人IDの表: Object.assign({}, 表) });
    // 移し替えの仕上げ：名簿・卒業生の文書から personalId を消す（逆引き表に載ったあと）。手元の写しからも外す。
    // 消せなくても次にまた試す（決まりは消すのを通す。足す・変えるは断る）
    const 消す人 = [
      ...(状態().members || []).filter((人) => 人 && 人.id && 'personalId' in 人).map((人) => ['members', 人.id]),
      ...(状態().alumni || []).filter((人) => 人 && 人.id && 'personalId' in 人).map((人) => ['alumni', 人.id]),
    ];
    if (消す人.length && typeof Firestore.deleteField === 'function') {
      const 消す一括 = Firestore.writeBatch(Firebaseの器.db);
      for (const [置き場, id] of 消す人.slice(0, 400))
        消す一括.update(Firestore.doc(Firebaseの器.db, `groups/${団体}/${置き場}`, id), {
          personalId: Firestore.deleteField(),
        });
      try {
        await 消す一括.commit();
        const 外した = new Set(消す人.slice(0, 400).map(([, id]) => id));
        書く((前) => ({
          members: (前.members || []).map((人) => (人 && 外した.has(人.id) ? 個人IDを外す(人) : 人)),
          alumni: (前.alumni || []).map((人) => (人 && 外した.has(人.id) ? 個人IDを外す(人) : 人)),
        }));
      } catch (誤り) {
        console.warn('[Store] 名簿の文書から個人IDを消せませんでした（次にまた試す）:', 誤り && 誤り.message);
      }
    }
    await 状態().syncMemberLookup();
    return 振った;
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
    状態().activeRole === 'group' ? 雲へ送る人(本人) : 弓具だけ送る形(本人)
  )
    .then(() => 届いた人を同期済みに(書く, [本人]))
    .catch((誤り) => console.error(`${名} Sync Error:`, 誤り));
}

module.exports = { 部員の操作, 弓具だけ送る形, 届いた人を同期済みに };
