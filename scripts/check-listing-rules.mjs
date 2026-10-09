/**
 * 紹介への掲載の許可（groups/{団体}/config/listing）を、団体の持ち主だけが書けるか（firestore.rules・2026-10-09）を、
 * 検証環境の Firestore に当てて確かめる。
 *
 *   node scripts/check-listing-rules.mjs
 *
 * 部員の端末（個人ログイン）から団体の答えを変えられないことを見たいので、REST を直に叩く（改造した端末の役）。
 * 書くのは 団体 100003 の config/listing・確かめ用の仮の設定（config/zz確かめ…）・確かめ用の所属のしるし
 * （member_claims/{匿名の uid}）だけで、終わったら全部消す。config/listing は e2e/listingConsent.spec.mjs も
 * 前後で消すので、同じ時間に流さない。ほかの文書には触らない（DELETE はこの 3 つだけ）。
 */
import { configFor, signIn, signInAnonymously, req, setDoc, listAll } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
if (projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：検証環境を指していません');
  process.exit(1);
}
const 団体 = '100003';
const 持ち主 = await signIn(apiKey, 'stg-c@example.com', 'StgTest!2026');
if (!持ち主) throw new Error('検証環境の団体 100003 に入れませんでした');

// 部員：匿名で入り、名簿の 1 人として所属のしるしを置く（アプリの個人ログインと同じ形）
const 匿名 = await signInAnonymously(apiKey);
const 名簿 = await listAll(projectId, `/groups/${団体}/members`, 持ち主);
const 部員 = 名簿.find((m) => /^\d{4}$/.test(m.data.personalId || ''));
if (!部員) throw new Error('個人IDのある部員がいません');
const しるし = `/member_claims/${匿名.uid}`;
const 置いた = await setDoc(projectId, しるし, { groupId: 団体, memberId: 部員.id, personalId: 部員.data.personalId, claimedAt: new Date() }, 匿名.idToken);
if (置いた.status !== 200) throw new Error('所属のしるしを置けませんでした ' + 置いた.status);

const 許可 = `/groups/${団体}/config/listing`;
const 仮の設定 = `/groups/${団体}/config/zz確かめ${Date.now().toString(36)}`;
const 答え = { 載せ方: '地域', 名前: '', 地域: '関東', ホームページ: true, 他校への案内: true, 聞いた文の版: 'ルール確認' };
const 結果 = [];
const 確かめる = (題, 実際, 期待) => {
  const ok = 期待.includes(実際);
  結果.push(ok);
  console.log(`  ${ok ? '○' : '×'} ${題}：${実際}${ok ? '' : `（期待は ${期待.join('/')}）`}`);
};
try {
  console.log(`接続先: ${projectId}・団体 ${団体}`);
  確かめる('持ち主が許可を書く', (await setDoc(projectId, 許可, 答え, 持ち主)).status, [200]);
  確かめる('部員が許可を読む', (await req(projectId, 許可, { token: 匿名.idToken })).status, [200]);
  確かめる('部員が許可を書き換える', (await setDoc(projectId, 許可, { ...答え, 載せ方: '団体名' }, 匿名.idToken)).status, [403]);
  確かめる('部員が許可を消す', (await req(projectId, 許可, { token: 匿名.idToken, method: 'DELETE' })).status, [403]);
  確かめる('部員がほかの設定を書く（これまでどおり）', (await setDoc(projectId, 仮の設定, { 確かめ: true }, 匿名.idToken)).status, [200]);
  確かめる('所属のない匿名が許可を読む', (await req(projectId, 許可, { token: (await signInAnonymously(apiKey)).idToken })).status, [403]);
} finally {
  await req(projectId, 仮の設定, { token: 持ち主, method: 'DELETE' });
  await req(projectId, 許可, { token: 持ち主, method: 'DELETE' });
  await req(projectId, しるし, { token: 匿名.idToken, method: 'DELETE' });
}
const 落ち = 結果.filter((x) => !x).length;
console.log(落ち ? `\n${落ち} 件が期待と違う` : '\n全部期待どおり');
process.exit(落ち ? 1 : 0);
