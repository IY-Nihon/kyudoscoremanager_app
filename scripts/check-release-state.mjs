/**
 * 配信のまわりが今どうなっているかを、Firebase コンソールを開かずに確かめる。読むだけ。
 *
 *   node scripts/check-release-state.mjs        （検証環境）
 *   node scripts/check-release-state.mjs prod   （本番）
 *
 * 見るもの
 *   1. 出ている決まり（firestore.rules）— いつのものか、手元と同じか
 *   2. 手元の決まりの文法 — 誤りがあれば行番号つきで出す
 *   3. 不具合の便りの自動削除（TTL）が入っているか
 *   4. 届いている便りの数
 *   5. 出ているアプリのお知らせの版 — 手元と、最後に配信した版と揃っているか
 *
 * 文法の確認は Firebase のルールAPIに任せる。Firestore のエミュレータは
 * Java が要るが、こちらは要らない。保存も公開もしない。
 *
 * 認証は Firebase CLI の権限を使う（事前に `firebase login` が済んでいること）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';

const ここ = path.dirname(url.fileURLToPath(import.meta.url));
const 根本 = path.join(ここ, '..');

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/check-release-state.mjs <stg|prod>');
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 住所 = `https://${企画}.web.app`;

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
const 印 = (よい) => (よい ? '  ok  ' : '  ⚠   ');
const 日 = (t) => (t ? new Date(t).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '不明');

console.log(`接続先: ${企画}（読むだけ）\n`);

// ── 1・2 決まり ──────────────────────────────────
const 手元の決まり = fs.readFileSync(path.join(根本, 'firestore.rules'), 'utf8');
const 束ね = await (
  await fetch(`https://firebaserules.googleapis.com/v1/projects/${企画}/releases/cloud.firestore`, { headers: 頭 })
).json();
if (束ね.rulesetName) {
  const s = await (await fetch(`https://firebaserules.googleapis.com/v1/${束ね.rulesetName}`, { headers: 頭 })).json();
  const 出ている = s.source?.files?.[0]?.content || '';
  const 同じ = 出ている.replace(/\r\n/g, '\n').trim() === 手元の決まり.replace(/\r\n/g, '\n').trim();
  console.log('■ 出ている決まり（firestore.rules）');
  console.log(`   作られた日時: ${日(s.createTime)}`);
  console.log(印(同じ) + (同じ ? '手元と同じ' : '手元と違う（配信すると変わる）'));
  if (!同じ) {
    const 足りない = ['errorReports', 'expireAt'].filter((語) => 手元の決まり.includes(語) && !出ている.includes(語));
    if (足りない.length) console.log(`        まだ出ていない語: ${足りない.join(', ')}`);
  }
} else {
  console.log('■ 出ている決まり: 読めませんでした（' + (束ね.error?.message || '') + '）');
}

const 検 = await (
  await fetch(`https://firebaserules.googleapis.com/v1/projects/${企画}:test`, {
    method: 'POST',
    headers: 頭,
    body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: 手元の決まり }] } }),
  })
).json();
console.log('\n■ 手元の決まりの文法');
if (検.error) {
  console.log('  ⚠   確かめられませんでした: ' + 検.error.message);
} else {
  const 誤 = (検.issues || []).filter((x) => x.severity === 'ERROR');
  console.log(印(誤.length === 0) + (誤.length === 0 ? '誤り無し' : `誤り ${誤.length} 件`));
  for (const x of (検.issues || []).slice(0, 8))
    console.log(`        [${x.severity}] ${x.sourcePosition?.line || '?'}行: ${x.description}`);
}

// ── 3 自動削除 ───────────────────────────────────
const ttl = await (
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/collectionGroups/errorReports/fields/expireAt`,
    { headers: 頭 }
  )
).json();
console.log('\n■ 不具合の便りの自動削除（errorReports.expireAt）');
if (ttl.error) console.log('  ⚠   読めませんでした: ' + ttl.error.message);
else {
  const 入 = !!ttl.ttlConfig;
  console.log(印(入) + (入 ? `入っている（${ttl.ttlConfig.state || '状態不明'}）` : '入っていない'));
  if (!入) console.log('        node scripts/set-error-report-ttl.mjs ' + 対象 + ' 変える');
}

// ── 4 届いた便り ─────────────────────────────────
const 便 = await (
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents/errorReports?pageSize=300`,
    { headers: 頭 }
  )
).json();
console.log('\n■ 届いている不具合の便り');
if (便.error) console.log('  ⚠   読めませんでした: ' + 便.error.message);
else {
  const 数 = (便.documents || []).length;
  console.log(`  ok  ${数} 件${便.nextPageToken ? '以上' : ''}`);
  if (数) console.log('        node scripts/read-error-reports.mjs ' + 対象 + ' 30 詳しく');
}

// ── 5 出ているアプリのお知らせの版 ───────────────
const 窓 = fs.readFileSync(path.join(根本, 'src', 'JP_WhatsNewModal.js'), 'utf8');
const 手元の版 = (窓.match(/NOTICE_VERSION = '([^']+)'/) || [])[1];
const 配信済み = (窓.match(/最後に配信した版 = '([^']+)'/) || [])[1];
console.log('\n■ お知らせの版');
console.log(`   手元: ${手元の版} / 最後に配信した版: ${配信済み}`);
try {
  const 頁 = await (await fetch(住所 + '/')).text();
  const 束 = (頁.match(/_expo\/static\/js\/web\/[^"']+\.js/) || [])[0];
  const 中身 = 束 ? await (await fetch(住所 + '/' + 束)).text() : '';
  const 版たち = [...new Set(中身.match(/2026-\d{2}-\d{2}-\d{2}/g) || [])].sort();
  const 出ている版 = 版たち[版たち.length - 1] || '不明';
  console.log(`   出ている: ${出ている版}`);
  console.log(印(出ている版 === 配信済み) + (出ている版 === 配信済み ? '最後に配信した版と揃っている' : '最後に配信した版と食い違う（配信後の更新を忘れていないか）'));
  console.log(
    印(手元の版 >= 出ている版) + (手元の版 > 出ている版 ? '手元のほうが新しい（未配信のお知らせがある）' : 手元の版 === 出ている版 ? '手元と同じ' : '手元のほうが古い')
  );
} catch (e) {
  console.log('  ⚠   出ているアプリを読めませんでした: ' + String(e).slice(0, 80));
}
