/**
 * 「使っている部として、紹介に載せてよいか」の答えを一覧にする（2026-10-09・読むだけ）。
 *
 *   node scripts/list-listing-consent.mjs                 （検証環境）
 *   node scripts/list-listing-consent.mjs prod            （本番）
 *   node scripts/list-listing-consent.mjs prod 日数 90     （使っている団体を「直近 90 日に記録がある」で数える。既定 60）
 *   node scripts/list-listing-consent.mjs prod 除く 100001 100002   （試し用などの団体を数から外す）
 *
 * ■ 出すもの
 *   ・使っている団体の数（直近 N 日に記録がある団体）。DM やホームページで「〇団体で使われています」と書くときの数
 *   ・ホームページに載せてよい団体、他校へのご案内（DM）に載せてよい団体。団体名か地域（団体が選んだほう）
 *   ・載せないと答えた団体・まだ答えていない団体は数だけ（名前は出さない）
 *   許可が無い団体は、数に入れるだけで名前は出さない（本人の決めた形。src/listingConsent.js）
 *
 * ■ どこを読むか
 *   groups/{団体ID}/config/listing（アプリの札と設定が書く）と、groups/{団体ID}/sessions の date。
 *   date は数と日時型が混ざっている（日時型へ移している途中）ので、両方の形で 1 件ずつ聞く。
 *
 * 所有者のトークンは Firebase CLI のログイン（firebase login）を借りる（prune-inquiries.mjs と同じ）。
 * 書き込みはしない。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const 決まり = require('../src/listingConsent.js');

const 引数 = process.argv.slice(2);
const 対象 = ['stg', 'prod'].includes(引数[0]) ? 引数.shift() : 'stg';
let 日数 = 60;
const 除く = new Set();
for (let i = 0; i < 引数.length; i++) {
  if (引数[i] === '日数') 日数 = Number(引数[++i]);
  else if (引数[i] === '除く') while (引数[i + 1] && /^\d+$/.test(引数[i + 1])) 除く.add(引数[++i]);
  else {
    console.error('使い方: node scripts/list-listing-consent.mjs <stg|prod> [日数 N] [除く 団体ID…]');
    process.exit(1);
  }
}
if (!(日数 >= 1)) {
  console.error('日数は 1 以上で');
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
const 頭 = { Authorization: `Bearer ${access_token}` };
const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;

/** REST の値を JS の値に（この道具で読む形だけ） */
const 値 = (v) => {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('nullValue' in v) return null;
  return null;
};
const 中身 = (d) => Object.fromEntries(Object.entries(d.fields || {}).map(([k, v]) => [k, 値(v)]));

// 団体の一覧（根の文書が無く下位だけある団体も拾う）
const 団体たち = [];
let token = '';
for (;;) {
  const u = `${根}/groups?pageSize=300&showMissing=true&mask.fieldPaths=groupName${token ? `&pageToken=${token}` : ''}`;
  const j = await (await fetch(u, { headers: 頭 })).json();
  if (j.error) {
    console.error('団体を読めませんでした: ' + (j.error.message || ''));
    process.exit(1);
  }
  for (const d of j.documents || []) 団体たち.push({ id: d.name.split('/').pop(), 名: 中身(d).groupName || '' });
  if (!j.nextPageToken) break;
  token = j.nextPageToken;
}

/** 直近に記録があるか。date の形（数・日時型）ごとに 1 件だけ聞く */
const 境 = Date.now() - 日数 * 86400000;
async function 使っているか(団体ID) {
  for (const 比べる値 of [{ timestampValue: new Date(境).toISOString() }, { integerValue: String(境) }]) {
    const r = await fetch(`${根}/groups/${団体ID}:runQuery`, {
      method: 'POST',
      headers: { ...頭, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'sessions' }],
          where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'GREATER_THAN_OR_EQUAL', value: 比べる値 } },
          select: { fields: [{ fieldPath: 'date' }] },
          limit: 1,
        },
      }),
    });
    const j = await r.json();
    if (Array.isArray(j) && j.some((x) => x.document)) return true;
  }
  return false;
}

async function 許可を読む(団体ID) {
  const r = await fetch(`${根}/groups/${団体ID}/config/listing`, { headers: 頭 });
  if (r.status === 404) return null;
  const j = await r.json();
  return j.error ? null : 中身(j);
}

const 使っている = [];
const 載せる = { ホームページ: [], 他校への案内: [] };
let 載せない = 0;
let 聞いただけ = 0;
for (const 団体 of 団体たち) {
  if (除く.has(団体.id)) continue;
  if (!(await 使っているか(団体.id))) continue;
  使っている.push(団体);
  const 許可 = await 許可を読む(団体.id);
  const 表示 = 決まり.載せる表示(許可);
  if (表示) {
    const 札 = `${表示.表示}（${許可.載せ方 === '団体名' ? '団体名' : '地域'}・${new Date(許可.答えた日時).toLocaleDateString('ja-JP')} に答えた）`;
    if (表示.ホームページ) 載せる.ホームページ.push(札);
    if (表示.他校への案内) 載せる.他校への案内.push(札);
  } else if (決まり.答えたか(許可)) 載せない += 1;
  else if (許可 && 許可.聞いた回数) 聞いただけ += 1;
}

console.log(`接続先: ${企画}`);
console.log(`使っている団体（直近 ${日数} 日に記録がある）: ${使っている.length} 団体（団体は全部で ${団体たち.length}${除く.size ? `、除いた ${除く.size}` : ''}）`);
console.log('\nホームページに載せてよい:');
console.log(載せる.ホームページ.length ? 載せる.ホームページ.map((x) => '  - ' + x).join('\n') : '  （まだ無し）');
console.log('\n他校へのご案内（DM）に載せてよい:');
console.log(載せる.他校への案内.length ? 載せる.他校への案内.map((x) => '  - ' + x).join('\n') : '  （まだ無し）');
console.log(`\n載せないと答えた: ${載せない} 団体　札で聞いたがまだ答えていない: ${聞いただけ} 団体`);
console.log('\n許可の無い団体は、数に入れるだけで名前は出さない。試し用の団体は「除く 団体ID」で外す。');
