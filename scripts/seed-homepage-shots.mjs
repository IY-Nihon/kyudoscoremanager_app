/**
 * 紹介ページ（homepage）の写真と、AI の答えの確かめに使う団体を、検証環境に作る（作り直す）。
 *
 *   node scripts/seed-homepage-shots.mjs
 *
 * 出欠の出席率の分母は、雲の「公式練習日」（groups/{団体}/officialPracticeDays）。紹介ページのほかの写真は
 * 通信なしで端末の控えに見本を入れて撮るが、出欠だけはそれでは 0/0 になる。そこで検証環境に団体を 1 つ置き、
 * 撮るときはそこへログインする（撮り方は homepage/scripts/screenshots/shoot-attendance.mjs。8 月を写す）。
 *
 * 部員はほかの写真と同じ見本の名前（homepage/scripts/screenshots/demo-data.mjs の名簿。どれも実在しない）。
 * 練習日は火・木・土。来た人だけの記録を練習日ごとに 1 件置く。出席率がばらけるよう、休む日の数を人ごとに決めてある。
 *   ・2026 年 8 月 … 4 射（1 立）。紹介ページの出欠の写真はこの月
 *   ・9 月〜10 月 24 日 … 8 射（2 立）。AI の比べる道具を確かめられるよう、傾向を入れてある（下の 傾向）
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

// [名前, 学年, 性別, 休んだ日の数（月ごと）]
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

/** 日本時間のその日の 0 時（ms） */
const 日本の0時 = (年, 月, 日) => Date.UTC(年, 月 - 1, 日, -9, 0, 0);

// 9 月 15 日に弓力を 12kg → 13kg に上げた人（AI の「弓を変えてから」を確かめる）
const 弓力を上げた人 = '木村慎太';
const 弓力を上げた日 = 日本の0時(2026, 9, 15);

const 部員 = 名簿.map(([name, grade, gender], 番) => ({
  id: `mem-hp-${String(番 + 1).padStart(2, '0')}`,
  personalId: String(3001 + 番),
  name,
  grade,
  gender,
  termKi: 54 - grade,
  ...(name === 弓力を上げた人
    ? {
        equipments: [
          { id: 'eq-hp-1', date: 日本の0時(2026, 4, 1), weight: 12 },
          { id: 'eq-hp-2', date: 弓力を上げた日, weight: 13 },
        ],
      }
    : {}),
}));

// 練習日は曜日を決めて週 3 日（火・木・土。10/25 本人）。10 月は 24 日まで
const 練習の曜日 = [2, 4, 6];
const 月たち = [
  { 月: 8, 本数: 4, 最後の日: 31 },
  { 月: 9, 本数: 8, 最後の日: 30 },
  { 月: 10, 本数: 8, 最後の日: 24 },
].map((m) => ({
  ...m,
  練習日: Array.from({ length: m.最後の日 }, (_, i) => i + 1)
    .filter((日) => 練習の曜日.includes(new Date(Date.UTC(2026, m.月 - 1, 日)).getUTCDay()))
    .map((日) => `2026-${String(m.月).padStart(2, '0')}-${String(日).padStart(2, '0')}`),
}));

/** 休んだ日（その月の練習日の何番目か）。人ごとにずらして、同じ日に休みが固まらないようにする */
const 休んだ日 = (番, 日数) => Array.from({ length: 名簿[番][3] }, (_, k) => (番 * 5 + k * 3) % 日数);

// 8 月の ○×（紹介ページの写真を撮ったときのまま変えない。流すたびに同じ中身にするため、乱数は使わない）
function 八月の印(種, 本数) {
  const 率 = 0.3 + (種 % 5) * 0.08;
  let s = 種 * 7919 + 13;
  return Array.from({ length: 本数 }, () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 < 率 ? '○' : '×';
  });
}

/**
 * 9〜10 月の傾向。AI の比べる道具（src/chatStats.js）の答えを確かめるときの見当
 *   ・下がる … 10 月に 25 ポイント落ちる（「最近的中率が落ちている人」）
 *   ・上がる … 10 月に 25 ポイント上がる（「調子を上げているのは」）
 *   ・後半で崩れる … 1〜4 射目は 10 ポイント上、5〜8 射目は 30 ポイント下（「後半に崩れる人」）
 *   ・弓力を上げた人 … 上げた日から 15 ポイント上がる（「弓を変えてから」）
 */
const 傾向 = {
  下がる: ['山田太郎', '小林大和', '渡辺樹'],
  上がる: ['中村結衣', '伊藤蓮', '石川葵'],
  後半で崩れる: ['斎藤誠', '鈴木莉子'],
};

/** 9〜10 月の ○×。人の地力（35〜64%）に傾向を足して、決まった並びで引く */
function 傾向の印(番, 月, 日時, 何番目, 本数) {
  const 名 = 名簿[番][0];
  let 地力 = 0.35 + ((番 * 37) % 30) / 100;
  if (月 === 10 && 傾向.下がる.includes(名)) 地力 -= 0.25;
  if (月 === 10 && 傾向.上がる.includes(名)) 地力 += 0.25;
  if (名 === 弓力を上げた人 && 日時 >= 弓力を上げた日) 地力 += 0.15;
  let s = (番 + 1) * 104729 + 月 * 7919 + 何番目 * 31 + 17;
  return Array.from({ length: 本数 }, (_, 射目) => {
    let 率 = 地力;
    if (傾向.後半で崩れる.includes(名)) 率 += 射目 < 4 ? 0.1 : -0.3;
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648 < Math.min(0.95, Math.max(0.05, 率)) ? '○' : '×';
  });
}

// 9〜10 月に矢所を付ける人（AI の「矢所の傾向」と図を確かめる）。外れは右下に抜けやすい
const 矢所を付ける人 = '高橋蒼';

/**
 * 矢所。的の中心が 0、ふちが 1（src/ArrowLocationView.js と同じ）。中りは的の中、外れはすぐ外。
 * 外れは右下へ寄せる。流すたびに同じ点にするため、乱数は使わない
 */
function 矢所(marks, 種) {
  let s = 種 * 48271 + 11;
  const 次 = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  return marks.map((印) => {
    const 中り = 印 === '○';
    const 角 = 中り ? 次() * Math.PI * 2 : Math.PI / 4 + (次() - 0.5) * Math.PI * 0.9;
    const 遠さ = 中り ? 0.1 + 次() * 0.75 : 1.06 + 次() * 0.2;
    return { x: Math.cos(角) * 遠さ, y: Math.sin(角) * 遠さ, targetType: 'kasumi36' };
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

/** 集まりの中を全部消す（前に流したぶん・撮影や確かめのあいだに増えたぶん） */
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
  逆引き表: await 空にする('member_lookup', token),
};
console.log(
  `  前のぶんを消した：${Object.entries(消した)
    .map(([k, v]) => `${k} ${v}`)
    .join('・')}`
);

for (const m of 部員) {
  await 書く(`/groups/${団体.id}/members/${m.id}`, Object.assign({}, m, { lastModified: new Date() }), token);
  // 個人ログイン（団体ID と個人ID）で入れるように、逆引き表も置く（AI の個人向けの答えを確かめる）
  await 書く(
    `/groups/${団体.id}/member_lookup/${m.personalId}`,
    { memberId: m.id, updatedAt: new Date() },
    token
  );
}
console.log(`  部員 ${部員.length}人（弓力を変えた人：${弓力を上げた人}）`);

let 記録の数 = 0;
for (const { 月, 本数, 練習日 } of 月たち) {
  for (const 日 of 練習日) {
    await 書く(`/groups/${団体.id}/officialPracticeDays/${日}`, { date: 日, created: new Date() }, token);
  }
  for (const [何番目, 日] of 練習日.entries()) {
    const 来た人 = 部員.filter((_, 番) => !休んだ日(番, 練習日.length).includes(何番目));
    const id = `ses-hp-${日.slice(5).replace('-', '')}`;
    // 日本時間の 18 時
    const 日時 = 日本の0時(2026, 月, Number(日.slice(8))) + 18 * 3600000;
    await 書く(
      `/groups/${団体.id}/sessions/${id}`,
      {
        id,
        date: 日時,
        title: '通常練習',
        note: '',
        shotCount: 本数,
        includeInStats: true,
        tags: ['#正規練習'],
        archerNames: 来た人.map((m) => m.name),
        archers: 来た人.map((m, i) => {
          const 番 = 部員.indexOf(m);
          const marks = 月 === 8 ? 八月の印(何番目 * 31 + 番, 本数) : 傾向の印(番, 月, 日時, 何番目, 本数);
          return {
            id: `a${i + 1}`,
            name: m.name,
            memberId: m.id,
            marks,
            ...(月 !== 8 && m.name === 矢所を付ける人
              ? { arrowLocations: 矢所(marks, 番 * 101 + 何番目 * 7 + 月) }
              : {}),
          };
        }),
        lastModified: new Date(),
      },
      token
    );
    記録の数++;
  }
  console.log(`  ${月}月：練習日と記録 ${練習日.length}件（${本数}射）`);
}
console.log(`  記録 ${記録の数}件`);
console.log(`\n完了。団体ID ${団体.id} / ${団体.email} でログインできます（出欠の写真は 8 月を撮る）。`);
