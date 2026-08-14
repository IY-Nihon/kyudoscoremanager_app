/**
 * 使い方の案内に載せる「実画面の写真」を撮るための見本データを作る。
 *
 *   node scripts/seed-tutorial-shots.mjs
 *
 * 初めて使う人には履歴も分析も空なので、案内でそこを指しても何も伝わらない。
 * 実際の画面を撮って案内に載せるため、その撮影用の中身をここで用意する。
 *
 * 撮影用の団体（100006）にだけ書く。他の検証用団体には触れない。
 * 撮り直すときは、このスクリプトを流してから 100006 でログインし、
 * 履歴タブと分析タブを撮る。
 *
 * 検証環境専用。本番を指していたら止まる。
 */
import { configFor, signIn, setDoc } from './fb-rest.mjs';
import { 団体を借りる, 合言葉 as PW } from './stg-fixtures.mjs';

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

// 台帳で持ち主を確かめてから書く。他の検証用団体を上書きしないため
const 台帳 = 団体を借りる('100006', 'seed-tutorial-shots.mjs');
const 団体 = { id: 台帳.id, name: 台帳.名, email: 台帳.email };

const 部員 = [
  { id: 'mem-shot-1', personalId: '2001', name: '山田 太郎', gender: '男子', grade: 3, termKi: 51 },
  { id: 'mem-shot-2', personalId: '2002', name: '鈴木 花子', gender: '女子', grade: 2, termKi: 52 },
  { id: 'mem-shot-3', personalId: '2003', name: '田中 一郎', gender: '男子', grade: 1, termKi: 53 },
];

// 月をまたいで少しずつ上がっていく形にする。分析のグラフに動きが出る
const 練習 = [
  { 月: 4, 日: 12, 題: '通常練習', 的中: [2, 1, 2] },
  { 月: 5, 日: 10, 題: '通常練習', 的中: [2, 2, 1] },
  { 月: 6, 日: 7, 題: '記録会', 的中: [3, 2, 2] },
  { 月: 7, 日: 5, 題: '通常練習', 的中: [3, 3, 2] },
  { 月: 8, 日: 8, 題: '通常練習', 的中: [3, 3, 3] },
  { 月: 8, 日: 10, 題: '記録会', 的中: [4, 3, 3] },
  { 月: 8, 日: 12, 題: '通常練習', 的中: [4, 4, 3] },
];

const 印 = (当たり, 射数) =>
  Array.from({ length: 射数 }, (_, i) => (i < 当たり ? '○' : '×'));

const token = await signIn(apiKey, 団体.email, PW, { create: true });
console.log(`■ 団体 ${団体.id}（${団体.email}）`);

await setDoc(
  projectId,
  `/group_accounts/${団体.id}`,
  { id: 団体.id, name: 団体.name, email: 団体.email, createdAt: Date.now() },
  token
);
await setDoc(projectId, `/groups/${団体.id}`, { groupName: 団体.name }, token);

for (const m of 部員) {
  await setDoc(
    projectId,
    `/groups/${団体.id}/members/${m.id}`,
    Object.assign({}, m, { lastModified: Date.now() }),
    token
  );
}
console.log(`  部員 ${部員.length}人`);

await setDoc(
  projectId,
  `/groups/${団体.id}/config/app_settings`,
  {
    currentFreshmanTerm: 53,
    autoPromotionEnabled: true,
    tagTemplates: ['#正規練習', '#自主稽古'],
    lastPromotionYear: 2026,
  },
  token
);

let n = 0;
for (const p of 練習) {
  n++;
  const 日時 = new Date(2026, p.月 - 1, p.日, 18, 0, 0).getTime();
  await setDoc(
    projectId,
    `/groups/${団体.id}/sessions/ses-shot-${String(n).padStart(2, '0')}`,
    {
      id: `ses-shot-${String(n).padStart(2, '0')}`,
      date: 日時,
      title: p.題,
      note: '',
      shotCount: 4,
      includeInStats: true,
      tags: ['#正規練習'],
      archerNames: 部員.map((m) => m.name),
      archers: 部員.map((m, i) => ({
        id: `a${i + 1}`,
        name: m.name,
        memberId: m.id,
        marks: 印(p.的中[i], 4),
      })),
      lastModified: Date.now(),
    },
    token
  );
}
console.log(`  練習 ${練習.length}件（4月〜8月）`);
console.log(`\n完了。団体ID ${団体.id} / ${団体.email} でログインして、履歴と分析を撮ってください。`);
