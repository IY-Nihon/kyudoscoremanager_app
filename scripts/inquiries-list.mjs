/**
 * 届いているお問い合わせを新しい順に並べて見る。
 *
 *   node scripts/inquiries-list.mjs            # 本番（.env）
 *   node scripts/inquiries-list.mjs stg        # 検証（.env.development.local）
 *   node scripts/inquiries-list.mjs prod 20    # 件数（既定 10）
 *
 * ■ なぜ要るか
 * お問い合わせはアプリから Firestore の inquiries に書かれるだけで、メールなどの
 * 知らせは飛ばない。届いているかは Firebase の画面を開くか、この道具で見る。
 * 中身は最初の数十字だけ出す（画面に長く残さない）。写真は枚数だけ。
 *
 * 所有者のトークンは Firebase CLI のログイン（firebase login）を借りる。
 */
'use strict';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = ['stg', 'prod'].includes(process.argv[2]) ? process.argv[2] : 'prod';
const 件数 = Number(process.argv[3]) > 0 ? Number(process.argv[3]) : 10;
const env = Object.fromEntries(
  fs
    .readFileSync(TARGET === 'stg' ? '.env.development.local' : '.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);
const PID = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;

// ── 所有者のトークン（scripts/backup-prod.mjs と同じ） ──
const CLI設定 = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
const CLI_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
async function 所有者トークン() {
  if (!fs.existsSync(CLI設定))
    throw new Error(`Firebase CLI のログイン情報が見つかりません。firebase login を実行してください。`);
  const t = JSON.parse(fs.readFileSync(CLI設定, 'utf8')).tokens || {};
  if (t.access_token && t.expires_at && t.expires_at - Date.now() > 5 * 60 * 1000) return t.access_token;
  if (!t.refresh_token) throw new Error('ログイン情報が古いようです。firebase login をやり直してください。');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLI_ID,
      client_secret: CLI_SECRET,
      refresh_token: t.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.access_token)
    throw new Error(`トークンを取り直せませんでした: ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}

const H = { Authorization: `Bearer ${await 所有者トークン()}`, 'Content-Type': 'application/json' };

// 新しい順に 件数 だけ。createdAt は Date で書いているので timestampValue
const r = await fetch(`${BASE}:runQuery`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify({
    structuredQuery: {
      from: [{ collectionId: 'inquiries' }],
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
      limit: 件数,
    },
  }),
});
if (!r.ok) {
  console.error(`読めませんでした: ${r.status} ${(await r.text()).slice(0, 300)}`);
  process.exit(1);
}
let 行たち = (await r.json()).filter((x) => x.document).map((x) => x.document);
// createdAt の無い古い形の文書は並べ替えから漏れる。0件ならそのまま並べて見る
if (行たち.length === 0) {
  const r2 = await fetch(`${BASE}/inquiries?pageSize=${件数}`, { headers: H });
  if (r2.ok) 行たち = (await r2.json()).documents || [];
}
const 値 = (f) =>
  f == null
    ? ''
    : (f.stringValue ??
      f.timestampValue ??
      f.integerValue ??
      (f.arrayValue ? `${(f.arrayValue.values || []).length}枚` : JSON.stringify(f)));

console.log(`${PID} の inquiries：新しい順に ${行たち.length} 件`);
for (const d of 行たち) {
  const f = d.fields || {};
  const 時 = 値(f.createdAt);
  const 日時 = 時 ? new Date(時).toLocaleString('ja-JP') : '(日時なし)';
  const 中身 = String(値(f.content)).replace(/\s+/g, ' ');
  console.log(
    `- ${日時}  団体 ${値(f.groupId) || '-'}（${値(f.groupName) || '-'}） ${値(f.role) || '-'}` +
      `  メール ${値(f.email) ? 'あり' : 'なし'}  写真 ${値(f.imagesBase64) || '0枚'}` +
      `\n    ${中身.slice(0, 40)}${中身.length > 40 ? '…' : ''}`
  );
}
