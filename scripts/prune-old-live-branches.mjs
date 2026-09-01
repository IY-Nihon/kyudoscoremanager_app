/**
 * 古い形のライブの枝を消す。
 *
 *   node scripts/prune-old-live-branches.mjs             （検証環境・数えるだけ）
 *   node scripts/prune-old-live-branches.mjs prod        （本番・数えるだけ）
 *   node scripts/prune-old-live-branches.mjs prod 消す   （本番・実際に消す）
 *
 * ■ なぜ要るのか
 * ライブは以前 live_sessions/{団体ID} に置いていた。団体IDは6桁の数字なので、
 * 順に試すだけで他団体の練習中の的中を覗けた。そこで枝の名前を、団体ごとの
 * 推測できない合言葉に変えた（src/liveSecret.js）。
 *
 * 決まり（database.rules.json）は短い枝を拒むようにしたので、配信のあとは
 * 古い形の枝をアプリから読むことも消すこともできない。放っておくと
 * そのときライブ中だった団体の的中・氏名・立順が、消えないまま残り続ける。
 *
 * 所有者の権限で読み書きすると決まりを通らないので、ここから消せる。
 * 配信の直後に一度だけ動かせばよい。
 *
 * 引数に「消す」を付けない限り、数えるだけで何も消さない。
 * 消したものは控えとして JSON に書き出す（gitignore 済み）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { 枝として使えるか, 枝の最短 } from '../src/liveSecret.js';

const 対象 = process.argv[2] || 'stg';
const 消す = process.argv[3] === '消す';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/prune-old-live-branches.mjs <stg|prod> [消す]');
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const RTDB = `https://${企画}-default-rtdb.firebaseio.com`;

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
const 認証 = `access_token=${access_token}`;

console.log(`${企画} のライブの枝を見ます（${消す ? '実際に消します' : '数えるだけ'}）\n`);

const 消した = [];
const 残す = [];
const 失敗 = [];

for (const 種 of ['live_sessions', 'live_history', 'live_presence', 'live_view']) {
  // 枝の名前だけを取る。中身まで引くと、まだ使っている団体の的中を
  // この端末へ落としてしまう
  const r = await fetch(`${RTDB}/${種}.json?${認証}&shallow=true`);
  if (!r.ok) {
    失敗.push({ パス: 種, HTTP: r.status });
    console.log(`■ ${種} … 読めません（HTTP ${r.status}）`);
    continue;
  }
  const 節点 = (await r.json()) || {};
  const 枝たち = Object.keys(節点);
  console.log(`■ ${種} … ${枝たち.length}本`);

  for (const 枝 of 枝たち) {
    if (枝として使えるか(枝)) {
      残す.push({ 種, 枝: 枝.slice(0, 6) + '…', 長さ: 枝.length });
      continue;
    }
    // ここへ来るのは古い形（団体IDそのまま）。中身の数だけ控えておく
    const c = await fetch(`${RTDB}/${種}/${枝}.json?${認証}&shallow=true`);
    const 中 = c.ok ? Object.keys((await c.json()) || {}) : [];
    console.log(`   ${枝}（${枝.length}文字・ライブ${中.length}件）… 古い形`);
    if (!消す) {
      消した.push({ 種, 枝, 長さ: 枝.length, ライブ: 中.length, 消した: false });
      continue;
    }
    const d = await fetch(`${RTDB}/${種}/${枝}.json?${認証}`, { method: 'DELETE' });
    if (d.ok) {
      消した.push({ 種, 枝, 長さ: 枝.length, ライブ: 中.length, 消した: true });
      console.log('      消しました');
    } else {
      失敗.push({ パス: `${種}/${枝}`, HTTP: d.status });
      console.log(`      消せません（HTTP ${d.status}）`);
    }
  }
}

console.log('');
console.log(`古い形の枝：${消した.length}本（${枝の最短}文字未満）`);
console.log(`今の形の枝：${残す.length}本`);
if (失敗.length) {
  console.error('\n読めなかった／消せなかったもの:');
  console.table(失敗);
}

if (消した.length) {
  const 控え = path.join(
    process.cwd(),
    `old-live-branches-${対象}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`
  );
  fs.writeFileSync(
    控え,
    JSON.stringify({ 企画, 日時: new Date().toISOString(), 実際に消した: 消す, 対象: 消した, 失敗 }, null, 1)
  );
  console.log(`\n控え: ${控え}`);
}

if (!消す && 消した.length) {
  console.log(
    対象 === 'prod'
      ? '\n実際に消すには npm run ops:prune-live:run（または末尾に 消す）。'
      : '\n実際に消すには、末尾に 消す を付けてもう一度動かしてください。'
  );
}
if (失敗.length) process.exit(1);
