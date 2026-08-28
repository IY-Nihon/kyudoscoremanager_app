/**
 * 置いた期間が過ぎた不具合の便りを消す。
 *
 *   node scripts/prune-error-reports.mjs             （検証環境・数えるだけ）
 *   node scripts/prune-error-reports.mjs prod        （本番・数えるだけ）
 *   node scripts/prune-error-reports.mjs prod 消す   （本番・実際に消す）
 *
 * ■ なぜ道具で消すのか
 * Firestore には期限の過ぎた文書を自動で消す仕組み（TTL）があるが、
 * 従量課金プランでないと使えない。この企画は本番・検証環境とも無料枠なので、
 * いまは使えない（scripts/set-error-report-ttl.mjs を動かすと、その旨が出る）。
 *
 * 便りには消したい時刻が expireAt に入っている（送信の90日後）。
 * ここではそれを過ぎたものを消す。従量課金に切り替えたときは、
 * 同じ expireAt に自動削除を掛ければ、この道具は要らなくなる。
 *
 * 無料枠の Firestore は容量に上限があるため、放っておくと便りで埋まる。
 * 月に一度くらい動かすことを想定している。
 *
 * 引数に「消す」を付けない限り、数えるだけで何も消さない。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
const 消す = process.argv[3] === '消す';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/prune-error-reports.mjs <stg|prod> [消す]');
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

const 全部 = [];
let token = '';
for (;;) {
  const u = `${根}/errorReports?pageSize=300${token ? `&pageToken=${token}` : ''}`;
  const j = await (await fetch(u, { headers: 頭 })).json();
  if (j.error) {
    console.error('読めませんでした: ' + (j.error.message || ''));
    process.exit(1);
  }
  for (const d of j.documents || []) 全部.push(d);
  if (!j.nextPageToken) break;
  token = j.nextPageToken;
}

const いま = Date.now();
const 日 = (t) => (t ? new Date(t).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '不明');
const 時 = (d, 名) => {
  const v = d.fields?.[名];
  return v?.timestampValue ? Date.parse(v.timestampValue) : 0;
};

// expireAt が無い便り（この項目を入れる前に届いたもの）は、createdAt から90日で見る
const 期限切れ = 全部.filter((d) => {
  const e = 時(d, 'expireAt');
  if (e) return e <= いま;
  const c = 時(d, 'createdAt');
  return c ? c + 90 * 86400000 <= いま : false;
});

console.log(`接続先: ${企画}`);
console.log(`便り ${全部.length} 件のうち、期限が過ぎたもの ${期限切れ.length} 件\n`);
if (期限切れ.length === 0) {
  console.log('消すものはありません。');
  process.exit(0);
}
for (const d of 期限切れ.slice(0, 5))
  console.log(`  ${日(時(d, 'createdAt'))} ${(d.fields?.message?.stringValue || '').slice(0, 50)}`);
if (期限切れ.length > 5) console.log(`  … ほか ${期限切れ.length - 5} 件`);

if (!消す) {
  console.log('\n消すには、末尾に 消す を付けてください。');
  console.log('  node scripts/prune-error-reports.mjs ' + 対象 + ' 消す');
  process.exit(0);
}

let 済み = 0;
for (const d of 期限切れ) {
  const r = await fetch(`https://firestore.googleapis.com/v1/${d.name}`, { method: 'DELETE', headers: 頭 });
  if (r.ok) 済み++;
  else console.error('  消せませんでした: ' + d.name.split('/').pop());
}
console.log(`\n${済み} 件を消しました。`);
