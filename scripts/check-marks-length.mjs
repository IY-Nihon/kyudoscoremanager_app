/**
 * 保存済みの記録で、○×の数が射数と合っていないものを数える。読むだけ。
 *
 *   node scripts/check-marks-length.mjs        （検証環境）
 *   node scripts/check-marks-length.mjs prod   （本番）
 *
 * なぜ要るか：
 *   的中数は marks を丸ごと数える（記録画面・書き出し・AI の4か所とも）。
 *   一方、画面に描くのは shotCount のぶんだけ。marks が shotCount より
 *   長いと、画面に出ないマスの○が的中数に入る。
 *   2026-08-17 に、そうなる経路を3つ塞いだ（取り消し・共有履歴・ライブ受信）。
 *   塞ぐ前に作られた記録が残っていないかを、ここで数える。
 *
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/check-marks-length.mjs <stg|prod>');
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';

const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
if (!fs.existsSync(設定)) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}
const refresh = JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token;
if (!refresh) {
  console.error('firebase login が済んでいません');
  process.exit(1);
}

const 応答 = await fetch('https://www.googleapis.com/oauth2/v4/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
    client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
    refresh_token: refresh,
    grant_type: 'refresh_token',
  }),
});
const { access_token } = await 応答.json();
if (!access_token) {
  console.error('access token を取れませんでした');
  process.exit(1);
}

const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;
const 取る = async (道) => {
  const 出 = [];
  let token = '';
  for (;;) {
    const u = `${根}/${道}?pageSize=300${token ? `&pageToken=${token}` : ''}`;
    const j = await (await fetch(u, { headers: { Authorization: `Bearer ${access_token}` } })).json();
    (j.documents || []).forEach((d) => 出.push(d));
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return 出;
};

// 団体は group_accounts と groups の和で取る（親ドキュメントの無い団体があるため）
const 団体 = new Set();
(await 取る('group_accounts')).forEach((d) => {
  const id = d.fields?.groupId?.stringValue || d.name.split('/').pop();
  if (id) 団体.add(String(id));
});
(await 取る('groups')).forEach((d) => 団体.add(d.name.split('/').pop()));

console.log(`接続先: ${企画}（読むだけ）`);
console.log(`団体 ${団体.size} 件を見ます\n`);

let 記録の総数 = 0;
let 食い違い = 0;
const 明細 = [];

for (const g of [...団体].sort()) {
  const 記録たち = await 取る(`groups/${g}/sessions`);
  記録の総数 += 記録たち.length;
  for (const d of 記録たち) {
    const f = d.fields || {};
    const 射数 = Number(f.shotCount?.integerValue ?? f.shotCount?.doubleValue ?? 0);
    const 射手 = f.archers?.arrayValue?.values || [];
    for (const a of 射手) {
      const af = a.mapValue?.fields || {};
      if (af.isSeparator?.booleanValue) continue;
      const marks = af.marks?.arrayValue?.values || [];
      if (!射数 || marks.length === 射数) continue;
      // はみ出したぶんに○が入っていれば、的中数が増えている
      const はみ出し = marks.slice(射数);
      const 増えた = はみ出し.filter((m) => (m.stringValue || '') === '○').length;
      食い違い++;
      明細.push({
        団体: g,
        記録: (f.title?.stringValue || '(無題)').slice(0, 16),
        射手: (af.name?.stringValue || '(名前なし)').slice(0, 10),
        射数,
        '○×の数': marks.length,
        増えた的中: 増えた,
      });
    }
  }
}

console.log(`記録 ${記録の総数} 件を調べました`);
if (!食い違い) {
  console.log('○×の数が射数と合っていない射手はいません。');
} else {
  console.log(`★ ${食い違い} 人ぶんで食い違いがあります\n`);
  console.table(明細.slice(0, 40));
  const 合計 = 明細.reduce((n, x) => n + x.増えた的中, 0);
  console.log(`\n見えないマスの○の合計: ${合計}（そのぶん的中数が多く出ています）`);
}
