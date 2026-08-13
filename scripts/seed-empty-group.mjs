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
import { configFor, signIn, setDoc } from './fb-rest.mjs';

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

const PW = 'StgTest!2026';
const 団体 = { id: '100005', name: 'テスト団体E（部員0人）', email: 'stg-empty@example.com' };

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

// members・alumni・sessions は作らない。まっさらな状態が要るため
console.log('  部員・卒業生・記録は作らない（作りたての状態を再現）');
console.log(`\n完了。団体ID ${団体.id} / ${団体.email} でログインできます。`);
