/**
 * 届いた不具合の便りを、同じものごとにまとめて読む。読むだけ。
 *
 *   node scripts/read-error-reports.mjs             （検証環境・直近7日）
 *   node scripts/read-error-reports.mjs prod        （本番・直近7日）
 *   node scripts/read-error-reports.mjs prod 30     （本番・直近30日）
 *   node scripts/read-error-reports.mjs prod 7 詳しく （直前の操作も出す）
 *
 * コンソールで1件ずつ眺めても、どれが多いのか分からない。
 * 「出どころ＋起きたこと」で束ね、実際に起きた回数の多い順に並べる。
 *
 * 便りには部員の氏名も的中も入っていない（src/errorReport.js の決まり）。
 * 出るのは、不具合の文言・団体ID・版・端末・直前の操作の名前だけ。
 *
 * 決まり（firestore.rules）では errorReports の読み出しを誰にも許していない。
 * この道具は Firebase CLI の権限で REST を叩くので、決まりを緩めずに読める。
 * 事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { 便りをまとめる } = require('../src/errorReport.js');

const 対象 = process.argv[2] || 'stg';
const 日数 = Number(process.argv[3] || 7);
const 詳しく = process.argv[4] === '詳しく';
if (!['stg', 'prod'].includes(対象) || !Number.isFinite(日数) || 日数 <= 0) {
  console.error('使い方: node scripts/read-error-reports.mjs <stg|prod> [日数] [詳しく]');
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

const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;

/** Firestore の値の入れ物をほどく */
function 素にする(v) {
  if (!v || typeof v !== 'object') return v;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return Date.parse(v.timestampValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(素にする);
  if ('mapValue' in v) {
    const 出 = {};
    for (const [k, x] of Object.entries(v.mapValue.fields || {})) 出[k] = 素にする(x);
    return 出;
  }
  return undefined;
}

async function 取る(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    const u = `${根}/${道}?pageSize=300${token ? `&pageToken=${token}` : ''}`;
    const j = await (await fetch(u, { headers: { Authorization: `Bearer ${access_token}` } })).json();
    if (j.error) {
      console.error('読めませんでした: ' + (j.error.message || ''));
      return 出;
    }
    for (const d of j.documents || []) {
      const 便 = {};
      for (const [k, v] of Object.entries(d.fields || {})) 便[k] = 素にする(v);
      出.push(便);
    }
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return 出;
}

const 境 = Date.now() - 日数 * 86400000;
const 全部 = await 取る('errorReports');
const 対象の便 = 全部.filter((b) => (b.createdAt || b.at || 0) >= 境);

console.log(`接続先: ${企画}（読むだけ）`);
console.log(`便り ${全部.length} 件のうち、直近 ${日数} 日は ${対象の便.length} 件\n`);
if (対象の便.length === 0) {
  console.log('この期間に届いた便りはありません。');
  process.exit(0);
}

const 日 = (t) => (t ? new Date(t).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '不明');
const 短く = (s, n) => {
  const t = String(s || '');
  return t.length > n ? t.slice(0, n) + '…' : t;
};

const 束 = 便りをまとめる(対象の便);
console.log(`同じ不具合ごとに ${束.length} 種類\n`);
束.forEach((x, i) => {
  console.log(`${String(i + 1).padStart(2)}. [${x.のべ回数}回 / 便り${x.件数}通] ${x.where}`);
  console.log(`    ${短く(x.message, 120)}`);
  console.log(
    `    団体 ${x.団体.length}件${x.団体.length <= 3 && x.団体.length ? '（' + x.団体.join(', ') + '）' : ''}` +
      ` / 版 ${x.版.join(', ') || '不明'} / 端末 ${x.端末.length}種`
  );
  console.log(`    ${日(x.古い)} 〜 ${日(x.新しい)}`);
  if (詳しく) {
    if (x.例.code) console.log(`    符号: ${x.例.code}`);
    const 跡 = String(x.例.stack || '').split('\n').slice(0, 3).join(' / ');
    if (跡) console.log(`    跡: ${短く(跡, 200)}`);
    const 行動 = (x.例.trail || []).map((a) => a.name + (a.detail ? `(${a.detail})` : '')).slice(-8);
    if (行動.length) console.log(`    直前の操作: ${行動.join(' → ')}`);
  }
  console.log('');
});

if (!詳しく) console.log('直前の操作や跡も見るには、末尾に 詳しく を付けてください。');
