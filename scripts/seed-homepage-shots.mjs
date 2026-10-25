/**
 * 紹介ページ（homepage）の出欠の写真を撮るための団体を、検証環境に作る（作り直す）。
 *
 *   node scripts/seed-homepage-shots.mjs
 *
 * 出欠の出席率の分母は、雲の「公式練習日」（groups/{団体}/officialPracticeDays）。紹介ページのほかの写真は
 * 通信なしで端末の控えに見本を入れて撮るが、出欠だけはそれでは 0/0 になる。そこで検証環境に団体を 1 つ置き、
 * 撮るときはそこへログインする（撮り方は homepage/scripts/screenshots/shoot-attendance.mjs）。
 *
 * 部員はほかの写真と同じ見本の名前（homepage/scripts/screenshots/demo-data.mjs の名簿。どれも実在しない）。
 * 2026 年 8 月の練習日（火・木・土の 13 日）に、来た人だけの記録を 1 件ずつ置く。出席率がばらけるよう、
 * 休む日の数を人ごとに決めてある。
 * 団体の帳面・同意の記録・設定は、アプリの「団体アカウントを新規作成する」（src/LoginScreen.js の 団体を作る）と同じ形。
 *
 * 検証環境専用。本番を指していたら止まる。流すたびに、部員・記録・練習日を同じ中身に戻す（前のぶんは消す）。
 */
import { createRequire } from 'node:module';
import { configFor, signIn, setDoc, req, 検証のパスワード } from './fb-rest.mjs';
import { 団体を借りる } from './stg-fixtures.mjs';

const require = createRequire(import.meta.url);
const 学 = require('../src/gakunen.js');
const 法 = require('../src/legalDocs.js');

const { apiKey, projectId } = configFor('stg');
if (!apiKey || projectId !== 'kyudoscoremanager-stg') {
  console.error('停止：.env.development.local が検証環境を指していません');
  process.exit(1);
}

// 台帳で持ち主を確かめてから書く。他の検証用団体を上書きしないため
const 台帳 = 団体を借りる('100010', 'seed-homepage-shots.mjs');
const 団体 = { id: 台帳.id, name: 台帳.名, email: 台帳.email };

// [名前, 学年, 性別, 休んだ日の数]
const 名簿 = [
  ['山田太郎', 1, '男子', 1],
  ['加藤翼', 1, '男子', 2],
  ['木村慎太', 1, '男子', 1],
  ['斎藤誠', 1, '男子', 3],
  ['松本拓也', 1, '男子', 2],
  ['井上陽太', 1, '男子', 1],
  ['中村結衣', 1, '女子', 0],
  ['高橋蒼', 2, '男子', 1],
  ['小林大和', 2, '男子', 4],
  ['伊藤蓮', 2, '男子', 2],
  ['渡邊翔太', 2, '男子', 3],
  ['佐藤陽菜', 2, '女子', 0],
  ['鈴木莉子', 2, '女子', 2],
  ['田中湊', 3, '男子', 1],
  ['山本大翔', 3, '男子', 5],
  ['吉田芽依', 3, '女子', 1],
  ['清水澪', 3, '女子', 2],
  ['林紬', 3, '女子', 0],
  ['渡辺樹', 4, '男子', 3],
  ['佐々木朝陽', 4, '男子', 1],
  ['松井楓', 4, '女子', 1],
  ['石川葵', 4, '女子', 2],
];
const 部員 = 名簿.map(([name, grade, gender], 番) => ({
  id: `mem-hp-${String(番 + 1).padStart(2, '0')}`,
  personalId: String(3001 + 番),
  name,
  grade,
  gender,
  termKi: 54 - grade,
}));

// 練習日は曜日を決めて週 3 日（火・木・土。10/25 本人）
const 練習の曜日 = [2, 4, 6];
const 練習日 = Array.from({ length: 31 }, (_, i) => i + 1)
  .filter((日) => 練習の曜日.includes(new Date(Date.UTC(2026, 7, 日)).getUTCDay()))
  .map((日) => `2026-08-${String(日).padStart(2, '0')}`);

/** 休んだ日（練習日の何番目か）。人ごとにずらして、同じ日に休みが固まらないようにする */
const 休んだ日 = (番) => Array.from({ length: 名簿[番][3] }, (_, k) => (番 * 5 + k * 3) % 練習日.length);

// 決まった並びで ○× を作る（流すたびに同じ中身にするため、乱数は使わない）
function 印(種, 本数) {
  const 率 = 0.3 + (種 % 5) * 0.08;
  let s = 種 * 7919 + 13;
  return Array.from({ length: 本数 }, () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 < 率 ? '○' : '×';
  });
}

/** 書く。断られたらその場で止める（fb-rest の setDoc は投げないので、ここで見る） */
async function 書く(道, 中身, token) {
  const r = await setDoc(projectId, 道, 中身, token);
  if (r.status !== 200) {
    console.error(`停止：${道} を書けませんでした（${r.status}）`, JSON.stringify(r.json).slice(0, 300));
    process.exit(1);
  }
}

/** 集まりの中を全部消す（前に流したぶん・撮影のあいだに増えたぶん） */
async function 空にする(集まり, token) {
  const r = await req(projectId, `/groups/${団体.id}/${集まり}`, { token, query: '?pageSize=300' });
  const 文書 = (r.json && r.json.documents) || [];
  for (const d of 文書) {
    const 名 = d.name.split('/').pop();
    await req(projectId, `/groups/${団体.id}/${集まり}/${名}`, { token, method: 'DELETE' });
  }
  return 文書.length;
}

const token = await signIn(apiKey, 団体.email, 検証のパスワード(), { create: true });
console.log(`■ 団体 ${団体.id}（${団体.email}）`);

// 公開の帳面はログインに要る 2 つだけ（firestore.rules の group_accounts）。名前と同意は private へ
await 書く(`/group_accounts/${団体.id}`, { id: 団体.id, email: 団体.email }, token);
await 書く(
  `/group_accounts/${団体.id}/private/consent`,
  Object.assign({ name: 団体.name, createdAt: new Date() }, 法.同意の記録()),
  token
);
await 書く(`/groups/${団体.id}`, { groupName: 団体.name }, token);
// 期を出す（「53期 / 男子 / 1年」。10/25 本人）。進級した年を置いて、進級の窓を出さない
await 書く(
  `/groups/${団体.id}/config/app_settings`,
  {
    groupType: 学.既定の種類,
    promotionCheck: true,
    useTerm: true,
    currentFreshmanTerm: 53,
    autoPromotionEnabled: false,
    lastPromotionYear: 2026,
    tagTemplates: ['#正規練習', '#自主稽古'],
  },
  token
);

const 消した = {
  部員: await 空にする('members', token),
  記録: await 空にする('sessions', token),
  練習日: await 空にする('officialPracticeDays', token),
  ゴミ箱: await 空にする('trash', token),
};
console.log(
  `  前のぶんを消した：${Object.entries(消した)
    .map(([k, v]) => `${k} ${v}`)
    .join('・')}`
);

for (const m of 部員) {
  await 書く(`/groups/${団体.id}/members/${m.id}`, Object.assign({}, m, { lastModified: new Date() }), token);
}
console.log(`  部員 ${部員.length}人`);

for (const 日 of 練習日) {
  await 書く(`/groups/${団体.id}/officialPracticeDays/${日}`, { date: 日, created: new Date() }, token);
}
console.log(`  練習日 ${練習日.length}日（2026年8月）`);

for (const [何番目, 日] of 練習日.entries()) {
  const 来た人 = 部員.filter((_, 番) => !休んだ日(番).includes(何番目));
  const id = `ses-hp-${日.slice(5).replace('-', '')}`;
  // 日本時間の 18 時
  const 日時 = Date.UTC(2026, 7, Number(日.slice(8)), 9, 0, 0);
  await 書く(
    `/groups/${団体.id}/sessions/${id}`,
    {
      id,
      date: 日時,
      title: '通常練習',
      note: '',
      shotCount: 4,
      includeInStats: true,
      tags: ['#正規練習'],
      archerNames: 来た人.map((m) => m.name),
      archers: 来た人.map((m, i) => ({
        id: `a${i + 1}`,
        name: m.name,
        memberId: m.id,
        marks: 印(何番目 * 31 + 部員.indexOf(m), 4),
      })),
      lastModified: new Date(),
    },
    token
  );
}
console.log(`  記録 ${練習日.length}件（練習日ごとに、来た人だけ）`);
console.log(`\n完了。団体ID ${団体.id} / ${団体.email} でログインして、出欠の 2 枚を撮ってください。`);
