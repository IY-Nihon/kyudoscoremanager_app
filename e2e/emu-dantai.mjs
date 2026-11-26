/**
 * その検査だけが使う団体を、エミュレーターの中に回ごとに作る（2026-11-26 本人「落ちないように調整して」）。
 * npm run e2e:emu のときだけ使える（管理の資格 Bearer owner。e2e/emu-fetch.mjs が手元のエミュレーターへ向ける）。
 *
 * 検証の団体を借りると、並べて流したときにほかの検査と取り合った：
 * - 管理者の合言葉の検査は前は 100007 で流していたが、記録の直し・アカウントの削除の検査も管理者モードに入り（入るときに
 *   合言葉を作る）、先に作られて「初めて」の窓が出ずに落ちた。3 機種を一度に流すと、この検査どうしでも取り合った
 * - ほかの検査の団体を借りると、その団体に団体アカウントの端末がもう 1 台入り、記録を作って消す検査（ゴミ箱の巡り）が
 *   落ちた（100008 で試した）
 * - 退部の検査は 100002 でメンバーを足し、ライブの合言葉を作り直していた（同じ団体を使う検査がほかに 6 つある。
 *   test/e2eSetup.test.js の重なりの検査が止めた）
 * 空の団体（100005。学年は既定の大学）の帳面を写し、登録メールアドレスと口座だけ新しくする。
 * エミュレーターは毎回控えから立て直すので、作った団体は次の回に残らない
 */
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

export const 文書の根 =
  'https://firestore.googleapis.com/v1/projects/kyudoscoremanager-stg/databases/(default)/documents';
export const 管理 = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

/** 文書を、下の集まりごと写す。替える は字の欄を替える・外す はその欄を写さない */
async function 写す(元, 先, 替える = {}, 外す = []) {
  const 文書 = await (await fetch(`${文書の根}/${元}`, { headers: 管理 })).json();
  if (文書.fields) {
    const 欄 = { ...文書.fields };
    for (const 鍵 of 外す) delete 欄[鍵];
    for (const [鍵, 値] of Object.entries(替える)) 欄[鍵] = { stringValue: 値 };
    const 書いた = await fetch(`${文書の根}/${先}`, {
      method: 'PATCH',
      headers: 管理,
      body: JSON.stringify({ fields: 欄 }),
    });
    if (!書いた.ok) throw new Error(`${先} を書けない（${書いた.status}）`);
  }
  const 集まり =
    (
      await (
        await fetch(`${文書の根}/${元}:listCollectionIds`, { method: 'POST', headers: 管理, body: '{}' })
      ).json()
    ).collectionIds || [];
  for (const 名 of 集まり) {
    const 一覧 =
      (await (await fetch(`${文書の根}/${元}/${名}?pageSize=300`, { headers: 管理 })).json()).documents || [];
    for (const 子 of 一覧) {
      const 子の名 = 子.name.split('/').pop();
      await 写す(`${元}/${名}/${子の名}`, `${先}/${名}/${子の名}`);
    }
  }
}

/**
 * 名簿でその名前の人を引く。{ id: 名簿の文書の名前, 個人ID: 招待でない逆引き表の文書の名前（まだ無ければ null） }。
 * 名簿にいなければ null
 */
export async function 名簿で引く(団体, 名前) {
  const 読む = async (集まり) =>
    (await (await fetch(`${文書の根}/groups/${団体}/${集まり}?pageSize=300`, { headers: 管理 })).json())
      .documents || [];
  const 人 = (await 読む('members')).find((文書) => 文書.fields?.name?.stringValue === 名前);
  if (!人) return null;
  const id = 人.name.split('/').pop();
  const 行 = (await 読む('member_lookup')).find(
    (文書) => 文書.fields?.memberId?.stringValue === id && 文書.fields?.招待?.booleanValue !== true
  );
  return { id, 個人ID: 行 ? 行.name.split('/').pop() : null };
}

/**
 * 新しい団体を作り、その団体ID を返す。団体アカウントのパスワードは検証の試しのパスワード（検証のパスワード）。
 * 呼び名 は登録メールアドレスに入れる（stg-呼び名-団体ID@example.com。どの検査が作ったか分かるように）
 */
export async function 検査の団体を作る(呼び名) {
  let id = null;
  for (let 回 = 0; 回 < 20 && !id; 回++) {
    const 候補 = String(700000 + Math.floor(Math.random() * 100000));
    if ((await fetch(`${文書の根}/group_accounts/${候補}`, { headers: 管理 })).status === 404) id = 候補;
  }
  if (!id) throw new Error('空いている団体IDが見つからない');
  const メール = `stg-${呼び名}-${id}@example.com`;
  // 口座を作り、メールを確認済みにする（決まりの isGroupOwner は確認済みのメールを見る）
  const 作った = await (
    await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=emu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: メール, password: 検証のパスワード(), returnSecureToken: true }),
    })
  ).json();
  if (!作った.localId) throw new Error('口座を作れない: ' + JSON.stringify(作った).slice(0, 200));
  const 確かめた = await fetch(
    'https://identitytoolkit.googleapis.com/v1/projects/kyudoscoremanager-stg/accounts:update',
    { method: 'POST', headers: 管理, body: JSON.stringify({ localId: 作った.localId, emailVerified: true }) }
  );
  if (!確かめた.ok) throw new Error(`メールを確認済みにできない（${確かめた.status}）`);
  await 写す('group_accounts/100005', `group_accounts/${id}`, { id, email: メール });
  await 写す('groups/100005', `groups/${id}`, {}, ['liveSecret']);
  return id;
}
