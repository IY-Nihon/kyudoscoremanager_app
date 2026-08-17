/**
 * 名簿の個人IDと、逆引き表（member_lookup）の食い違いを数える。
 *
 *   node scripts/check-lookup-drift.mjs prod
 *   node scripts/check-lookup-drift.mjs stg
 *
 * 読むだけ。何も書かない。
 *
 * なぜ要るか：
 *   部員の端末が個人IDを振ると、名簿だけ更新されて逆引き表が置き去りに
 *   なっていた（c9e2174 で修正済み）。逆引き表はセキュリティルールが
 *   所属の確認に直接引くので、置き去りになった部員はログインできない。
 *   修正は発生を止めるだけで、既にある食い違いは直さない。
 *   復旧は団体アカウントで syncMemberLookup が走ったときに行われる。
 *   まず「いま本番にどれだけあるか」を知るための道具。
 *
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/check-lookup-drift.mjs <stg|prod>');
  process.exit(1);
}
const PID = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const BASE = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;

/** firebase-tools のログイン情報から access_token を取る（backup-prod.mjs と同じ手口） */
async function 合鍵を取る() {
  const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const 旧設定 = path.join(os.homedir(), '.config', 'configstore', 'update-notifier-firebase-tools.json');
  const 道 = fs.existsSync(設定) ? 設定 : 旧設定;
  if (!fs.existsSync(道)) throw new Error('Firebase CLI のログイン情報が見つかりません。firebase login を実行してください');
  const t = (JSON.parse(fs.readFileSync(道, 'utf8')) || {}).tokens || {};
  if (t.access_token && t.expires_at && t.expires_at - Date.now() > 5 * 60 * 1000) return t.access_token;
  if (!t.refresh_token) throw new Error('ログイン情報が古いようです。firebase login をやり直してください');
  const r = await fetch('https://www.googleapis.com/oauth2/v4/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: t.refresh_token,
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
      client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error('トークンを取り直せませんでした');
  return j.access_token;
}

const 鍵 = await 合鍵を取る();
const 頭 = { Authorization: `Bearer ${鍵}` };

/** 値の入れ物から素の値を出す */
const 素に = (v) =>
  v == null
    ? null
    : v.stringValue !== undefined
      ? v.stringValue
      : v.integerValue !== undefined
        ? Number(v.integerValue)
        : v.booleanValue !== undefined
          ? v.booleanValue
          : null;

async function 集める(道) {
  const 出 = [];
  let token = null;
  do {
    const u = new URL(`${BASE}/${道}`);
    u.searchParams.set('pageSize', '300');
    if (token) u.searchParams.set('pageToken', token);
    const r = await fetch(u, { headers: 頭 });
    if (!r.ok) return 出;
    const j = await r.json();
    (j.documents || []).forEach((d) => 出.push({ id: d.name.split('/').pop(), f: d.fields || {} }));
    token = j.nextPageToken;
  } while (token);
  return 出;
}

console.log(`接続先: ${PID}（読むだけ）\n`);

// 団体の一覧は group_accounts から取る。
// groups を一覧すると、下位のコレクションだけ持つ「本体の無い」団体が
// 出てこない。検証環境で 100003 が落ちて気づいた。
const 口座 = await 集める('group_accounts');
const 本体 = await 集める('groups');
const 番号 = [...new Set([...口座.map((d) => d.id), ...本体.map((d) => d.id)])].sort();
const 団体たち = 番号.map((id) => ({ id, f: (本体.find((b) => b.id === id) || {}).f || {} }));
console.log('団体の数: group_accounts', 口座.length, '/ groups', 本体.length, '/ 合わせて', 番号.length);
if (!団体たち.length) {
  console.log('団体が読めませんでした（権限か、団体が無い）');
  process.exit(0);
}

const 表 = [];
let 合計のずれ = 0;
for (const g of 団体たち) {
  const 名簿 = await 集める(`groups/${g.id}/members`);
  const 逆引き = await 集める(`groups/${g.id}/member_lookup`);
  const 逆引きの表 = new Map(逆引き.map((d) => [d.id, 素に(d.f.memberId)]));

  let 無し = 0; // 名簿にIDがあるのに逆引きに無い
  let 食い違い = 0; // 逆引きが別の人を指している
  const 例 = [];
  名簿.forEach((m) => {
    const pid = 素に(m.f.personalId);
    if (!pid || !/^\d{4}$/.test(String(pid))) return;
    const 指す先 = 逆引きの表.get(String(pid));
    if (指す先 === undefined) {
      無し++;
      if (例.length < 3) 例.push(`${pid}→無し`);
    } else if (指す先 !== m.id) {
      食い違い++;
      if (例.length < 3) 例.push(`${pid}→別人`);
    }
  });
  合計のずれ += 無し + 食い違い;
  表.push({
    団体: g.id,
    名: 素に(g.f.name) || '',
    部員: 名簿.length,
    逆引き: 逆引き.length,
    引けない: 無し,
    別人を指す: 食い違い,
    例: 例.join(' '),
  });
}

console.table(表);
console.log(
  合計のずれ === 0
    ? '\n食い違いはありません。ログインできない部員は居ません。'
    : `\n食い違い ${合計のずれ} 件。その部員は個人IDでログインできません。\n団体アカウントでアプリを開くと、逆引き表が名簿から作り直されて直ります。`
);
