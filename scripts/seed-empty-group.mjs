/**
 * 検証用に「部員0人の団体」を1つ作る。
 *
 *   node scripts/seed-empty-group.mjs
 *
 * 使い方の案内（チュートリアル）が本当に必要なのは、作ったばかりで部員が
 * 1人もいない団体。既存の検証用団体はどれも部員入りなので、初回の道筋を
 * そのまま踏める団体をここで用意する。
 *
 * 検証環境（kyudoscoremanager-stg）専用。本番を指していたら止まる。
 * 団体IDは他の検証用スクリプトと重ならないものを使うこと
 * （100001〜100003＝seed-stg、100009＝verify-scale-state の168人）。
 * 合言葉は seed-stg.mjs と同じものを使う（検証専用・リポジトリに平文）。
 */
import { configFor, signIn, setDoc, req } from './fb-rest.mjs';
import { 団体を借りる, 合言葉 as PW } from './stg-fixtures.mjs';

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

// 台帳で持ち主を確かめてから書く。他の検証用団体を上書きしないため
const 台帳 = 団体を借りる('100005', 'seed-empty-group.mjs');
const 団体 = { id: 台帳.id, name: 台帳.名, email: 台帳.email };

const token = await signIn(apiKey, 団体.email, PW, { create: true });
console.log(`■ 団体 ${団体.id}（${団体.email}）`);

await setDoc(
  projectId,
  `/group_accounts/${団体.id}`,
  { id: 団体.id, name: 団体.name, email: 団体.email, createdAt: Date.now() },
  token
);
console.log('  group_accounts を作成');

await setDoc(projectId, `/groups/${団体.id}`, { groupName: 団体.name }, token);
console.log('  groups/{id} 親ドキュメントを作成');

// 前に流したときの残りを消して、まっさらへ戻す。
// 案内の確認では中で部員を1人登録するので、消さないと「作りたて」でなくなる
const 残り = await req(projectId, `/groups/${団体.id}/members`, { token, query: '?pageSize=300' });
const 消す対象 = (残り.json && 残り.json.documents) || [];
for (const d of 消す対象) {
  const 名 = d.name.split('/').pop();
  await req(projectId, `/groups/${団体.id}/members/${名}`, { token, method: 'DELETE' });
}
console.log(`  前に登録された部員 ${消す対象.length}件を消した（まっさらに戻す）`);

// members・alumni・sessions は作らない。まっさらな状態が要るため
console.log('  部員・卒業生・記録は作らない（作りたての状態を再現）');
console.log(`\n完了。団体ID ${団体.id} / ${団体.email} でログインできます。`);
