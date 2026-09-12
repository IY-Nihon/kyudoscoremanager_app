/**
 * Module ID: accountDeletion
 *
 * 団体アカウントを消す。
 *
 * ■ 何をするか
 *   1. 団体に属するものを、ぜんぶ deleted_accounts/{団体ID} の下へ写す
 *      （記録・部員・卒業生・ゴミ箱・設定・公式練習日・逆引き表・団体の文書・
 *        アカウントの文書・同意の記録）。運営者だけが読める場所
 *   2. 元の場所から消す（groups/{団体ID} の下 → groups の文書 → private → group_accounts）
 *   3. ログインの口座（Firebase Auth）を消す
 *
 * ■ なぜ写してから消すか
 *   規約第18条は「削除した団体データは復旧できない」と書いているが、押し間違いや
 *   なりすましの申出に備えて、30日だけ運営者の手元に残す（プライバシーポリシー
 *   第18条第3項）。30日を過ぎたものは scripts/prune-deleted-accounts.mjs で消す。
 *
 * ■ 順番の理由
 *   決まり（firestore.rules）は、団体の持ち主かどうかを group_accounts の email で
 *   確かめる。group_accounts を先に消すと、そのあとの書き込みが全部断られる。
 *   だから group_accounts はいちばん最後。写しは最初に全部書く（途中で止まっても、
 *   もう一度やり直せば同じところに上書きされるだけ）。
 *
 * ■ 消さないもの
 *   ・部員の所属クレーム（member_claims）… 本人しか消せない。部員が居なくなれば
 *     決まりの側で効かなくなる（SEC-7）
 *   ・ライブの枝（RTDB）… 団体IDではなく合言葉の枝で、期限が来れば消える。
 *     ライブ中は消させない（呼ぶ側で止める）
 *
 * Firestore の関数（a）と Auth の関数（o）は呼ぶ側から渡す。検査では偽物が入る。
 */
'use strict';

const 保管日数 = 30;
const 写す下位 = ['sessions', 'members', 'alumni', 'trash', 'config', 'officialPracticeDays', 'member_lookup'];
/** 1回の一括送信に載せる数。Firestore の上限は500 */
const 一括の上限 = 400;

/**
 * @param {object} 道具 { db, a: firebase/firestore, auth, o: firebase/auth }
 * @param {{団体ID:string, email:string, 合言葉:string, 進み?:(文:string)=>void}} 注文
 * @returns {Promise<{件数:object}>}
 */
async function 団体を消す(道具, 注文) {
  const { db, a, auth, o } = 道具;
  const { 団体ID, email, 合言葉 } = 注文;
  const 進み = 注文.進み || (() => {});
  if (!団体ID) throw new Error('団体IDがありません');
  if (!email) throw new Error('メールアドレスがありません');

  // 本人確認。消す直前にもう一度合言葉で入り直す（Auth の口座を消すには
  // 直近のログインが要る。管理者モードの認証から時間が経っていても通るように）
  進み('本人確認');
  await o.signInWithEmailAndPassword(auth, email, 合言葉);

  // ── 1. 写す ──
  進み('写しを作成');
  const 元 = `groups/${団体ID}`;
  const 先 = `deleted_accounts/${団体ID}`;
  const 件数 = {};
  let 一括 = a.writeBatch(db);
  let 載せた = 0;
  const 送る = async () => {
    if (!載せた) return;
    await 一括.commit();
    一括 = a.writeBatch(db);
    載せた = 0;
  };
  const 載せる = async (作用) => {
    作用(一括);
    載せた++;
    if (載せた >= 一括の上限) await 送る();
  };
  const 下位の中身 = {};
  for (const 名 of 写す下位) {
    const 束 = await a.getDocs(a.collection(db, `${元}/${名}`));
    const 一覧 = [];
    束.forEach((d) => 一覧.push({ id: d.id, 値: d.data() }));
    下位の中身[名] = 一覧;
    件数[名] = 一覧.length;
    for (const { id, 値 } of 一覧) {
      await 載せる((b) => b.set(a.doc(db, `${先}/${名}`, id), 値));
    }
  }
  const 団体の文書 = await a.getDoc(a.doc(db, 'groups', 団体ID));
  const 口座の文書 = await a.getDoc(a.doc(db, 'group_accounts', 団体ID));
  const 内緒 = await a.getDocs(a.collection(db, `group_accounts/${団体ID}/private`));
  const 内緒の一覧 = [];
  内緒.forEach((d) => 内緒の一覧.push({ id: d.id, 値: d.data() }));
  const 今 = Date.now();
  const 群 = 団体の文書.exists() ? 団体の文書.data() : null;
  await 載せる((b) =>
    b.set(a.doc(db, 'deleted_accounts', 団体ID), {
      id: 団体ID,
      email,
      団体名: (群 && (群.name || 群.groupName)) || null,
      deletedAt: 今,
      // これを過ぎたら運営者の道具が消す（scripts/prune-deleted-accounts.mjs）
      expireAt: 今 + 保管日数 * 86400000,
      group: 群,
      account: 口座の文書.exists() ? 口座の文書.data() : null,
      private: Object.fromEntries(内緒の一覧.map(({ id, 値 }) => [id, 値])),
      件数,
    })
  );
  await 送る();

  // ── 2. 消す ──
  進み('元の場所から削除');
  for (const 名 of 写す下位) {
    for (const { id } of 下位の中身[名]) {
      await 載せる((b) => b.delete(a.doc(db, `${元}/${名}`, id)));
    }
  }
  if (団体の文書.exists()) await 載せる((b) => b.delete(a.doc(db, 'groups', 団体ID)));
  for (const { id } of 内緒の一覧) {
    await 載せる((b) => b.delete(a.doc(db, `group_accounts/${団体ID}/private`, id)));
  }
  await 送る();
  // 決まりの都合で最後（上の説明）。これを消すと団体IDでログインできなくなる
  if (口座の文書.exists()) await a.deleteDoc(a.doc(db, 'group_accounts', 団体ID));

  // ── 3. 口座を消す ──
  進み('ログイン口座を削除');
  if (auth && auth.currentUser && typeof o.deleteUser === 'function') {
    await o.deleteUser(auth.currentUser);
  }
  return { 件数 };
}

module.exports = { 団体を消す, 保管日数, 写す下位 };
