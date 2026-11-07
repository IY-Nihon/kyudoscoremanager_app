/**
 * 個人ID を名簿の文書から逆引き表へ移す（全団体を一度に。2026-11-04。C）。
 *
 *   npm run ops:migrate-personal-ids       … 本番・数えるだけ（何も書かない）
 *   npm run ops:migrate-personal-ids:run   … 本番・移す
 *   node scripts/migrate-personal-ids.mjs stg [移す]   … 検証環境
 *
 * 前は名簿の文書（groups/{団体}/members・alumni）に personalId を置いていて、部員はみな名簿を読めるので、
 * 全員の個人ID が見えた。いまは逆引き表（groups/{団体}/member_lookup/{個人ID} → memberId）にだけ置く。
 * アプリも持ち主の端末を開いたときに同じ移し替えをする（src/storeMembers.js の ensurePersonalIds）。
 * これは開かない団体の分も一度に済ませる台本。
 *
 * することは団体ごとに
 *   1. 名簿の文書の personalId が逆引き表に無ければ足す（同じ ID をほかの人が使っていれば足さない。数えて知らせる）
 *   2. 名簿・卒業生の文書から personalId を消す
 * 個人ID は変えない（入っている部員はそのまま。ID を配り直すのは団体の担当者が設定から）。
 * 決まり（firestore.rules）を配ったあとに走らせる。所有者の権限で書くので、決まりは通らない。
 *
 * ■ 無料枠：読むのは団体ごとに 名簿・卒業生・逆引き表（全部で数百回）。書くのは移す人の数だけ
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
const 移す = process.argv[3] === '移す';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/migrate-personal-ids.mjs <stg|prod> [移す]');
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const refresh = fs.existsSync(設定) ? JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token : null;
if (!refresh) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}
const { access_token } = await (
  await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
).json();
if (!access_token) {
  console.error('access token を取れませんでした');
  process.exit(1);
}
const 頭 = { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' };
const 文書の根 = `projects/${企画}/databases/(default)/documents`;
const 根 = `https://firestore.googleapis.com/v1/${文書の根}`;

async function 取る(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    const j = await (await fetch(`${根}/${道}?pageSize=300${token ? `&pageToken=${token}` : ''}`, { headers: 頭 })).json();
    if (j.error) throw new Error(`${道} を読めません: ${j.error.message || ''}`);
    (j.documents || []).forEach((d) => 出.push(d));
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return 出;
}
const 番号 = (文書) => 文書.name.split('/').pop();
const 個人IDの形 = /^([A-HJKMNP-Z2-9]{6}|[0-9]{4})$/;

async function 書く(書き込み) {
  for (let 番 = 0; 番 < 書き込み.length; 番 += 400) {
    const r = await fetch(`https://firestore.googleapis.com/v1/${文書の根}:commit`, {
      method: 'POST',
      headers: 頭,
      body: JSON.stringify({ writes: 書き込み.slice(番, 番 + 400) }),
    });
    if (!r.ok) throw new Error(`書けませんでした（${r.status}）: ${(await r.text()).slice(0, 300)}`);
  }
}

console.log(`接続先: ${企画}（${移す ? '移す' : '数えるだけ'}）`);
const 団体たち = (await 取る('groups')).map(番号);
const 合計 = { 団体: 0, 足す: 0, 消す: 0, 重なり: 0 };
for (const 団体 of 団体たち) {
  const [部員, 卒業生, 逆引き] = await Promise.all([
    取る(`groups/${団体}/members`),
    取る(`groups/${団体}/alumni`),
    取る(`groups/${団体}/member_lookup`),
  ]);
  const 表 = new Map(逆引き.map((d) => [番号(d), d.fields?.memberId?.stringValue || '']));
  const 書き込み = [];
  let 足す = 0;
  let 重なり = 0;
  for (const d of 部員) {
    const id = d.fields?.personalId?.stringValue || '';
    if (!個人IDの形.test(id)) continue;
    if (!表.has(id)) {
      足す++;
      表.set(id, 番号(d));
      書き込み.push({
        update: {
          name: `${文書の根}/groups/${団体}/member_lookup/${id}`,
          fields: { memberId: { stringValue: 番号(d) }, 形: { integerValue: '2' }, updatedAt: { timestampValue: new Date().toISOString() } },
        },
        currentDocument: { exists: false },
      });
    } else if (表.get(id) !== 番号(d)) 重なり++;
  }
  const 消す人 = [...部員.map((d) => ['members', d]), ...卒業生.map((d) => ['alumni', d])].filter(
    ([, d]) => d.fields && 'personalId' in d.fields
  );
  for (const [, d] of 消す人)
    // 欄を書かずに updateMask に名前だけ渡すと、その欄が消える（ほかの欄はそのまま）
    書き込み.push({ update: { name: d.name, fields: {} }, updateMask: { fieldPaths: ['personalId'] }, currentDocument: { exists: true } });
  if (!足す && !消す人.length && !重なり) continue;
  合計.団体++;
  合計.足す += 足す;
  合計.消す += 消す人.length;
  合計.重なり += 重なり;
  console.log(`団体 ${合計.団体}: 逆引き表に足す ${足す}・名簿から消す ${消す人.length}${重なり ? `・同じ ID をほかの人が使っている ${重なり}（足さない）` : ''}`);
  if (移す && 書き込み.length) await 書く(書き込み);
}
console.log(
  `\n合計: ${合計.団体} 団体・逆引き表に足す ${合計.足す}・名簿から消す ${合計.消す}・重なり ${合計.重なり}` +
    (移す ? '（移しました）' : '\n数えるだけです。移すときは npm run ops:migrate-personal-ids:run')
);
