/**
 * 本番（または検証環境）のデータを、配布前に厳格に見る。読むだけ。
 *
 *   node scripts/audit-prod-data.mjs        （検証環境）
 *   node scripts/audit-prod-data.mjs prod   （本番）
 *
 * 見るもの
 *   1. 団体の数え上げ（group_accounts と groups の食い違い）
 *   2. 日時の型（Timestamp / 数値 / 入れ物）。入れ物だと突き合わせが NaN になり、
 *      その記録だけ他の端末の編集が永久に反映されない（2026-08-06 に本番25件を修正済み）
 *   3. 個人IDの重複（同じ団体の中で重なると、別人でログインできてしまう）
 *   4. 逆引き表（member_lookup）が、居ないメンバーを指していないか
 *   5. 記録の形（射手が配列か、shotCount が数値か、日付が読めるか、タグが配列か）
 *   6. ○×の中身（○×空 以外の値が混ざっていないか）
 *   7. ゴミ箱の形（送信待ちの印）
 *
 * 認証は Firebase CLI の権限を使う。事前に `firebase login` が済んでいること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/audit-prod-data.mjs <stg|prod>');
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
async function 取る(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    const u = `${根}/${道}?pageSize=300${token ? `&pageToken=${token}` : ''}`;
    const j = await (await fetch(u, { headers: { Authorization: `Bearer ${access_token}` } })).json();
    if (j.error) return 出;
    (j.documents || []).forEach((d) => 出.push(d));
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return 出;
}

const 見つけた = [];
const 記す = (団体, 種類, 中身) => 見つけた.push({ 団体, 種類, 中身: String(中身).slice(0, 70) });

/** 日時の型を見分ける。'入れ物' が出たら要注意 */
function 日時の型(f) {
  if (!f) return '無し';
  if (f.timestampValue) return 'Timestamp';
  if (f.integerValue || f.doubleValue) return '数値';
  if (f.stringValue) return '文字列';
  if (f.mapValue) return '入れ物';
  return 'その他';
}

// 1. 団体の数え上げ
const 団体 = new Set();
const 口座 = await 取る('group_accounts');
口座.forEach((d) => {
  const id = d.fields?.groupId?.stringValue || d.name.split('/').pop();
  if (id) 団体.add(String(id));
});
const 本体 = await 取る('groups');
const 本体id = new Set(本体.map((d) => d.name.split('/').pop()));
本体id.forEach((id) => 団体.add(id));

console.log(`接続先: ${企画}（読むだけ）`);
console.log(`団体 ${団体.size} 件（group_accounts ${口座.length} / groups ${本体id.size}）\n`);

const 集計 = [];
for (const g of [...団体].sort()) {
  const [部員, 卒業, 記録, ごみ, 逆引き] = await Promise.all([
    取る(`groups/${g}/members`),
    取る(`groups/${g}/alumni`),
    取る(`groups/${g}/sessions`),
    取る(`groups/${g}/trash`),
    取る(`groups/${g}/member_lookup`),
  ]);

  // 個人IDの重複
  const 個人ID = new Map();
  [...部員, ...卒業].forEach((d) => {
    const pid = d.fields?.personalId?.stringValue;
    const 名 = d.fields?.name?.stringValue || '(名前なし)';
    if (!pid) return 記す(g, '個人IDが無い', 名);
    if (個人ID.has(pid)) 記す(g, '個人IDの重複', `${pid}: ${個人ID.get(pid)} と ${名}`);
    else 個人ID.set(pid, 名);
  });

  // 日時の型
  [...部員, ...卒業, ...記録, ...ごみ].forEach((d) => {
    const t = 日時の型(d.fields?.lastModified);
    if (t === '入れ物' || t === 'その他') 記す(g, `日時が${t}`, d.name.split('/').pop());
  });

  // 逆引き表が居ない人を指していないか
  const 部員id = new Set(部員.map((d) => d.name.split('/').pop()));
  逆引き.forEach((d) => {
    const 指す = d.fields?.memberId?.stringValue;
    if (指す && !部員id.has(指す)) 記す(g, '逆引きが居ない人を指す', `${d.name.split('/').pop()} → ${指す}`);
  });

  // 記録の形
  記録.forEach((d) => {
    const f = d.fields || {};
    const 名 = (f.title?.stringValue || '(無題)').slice(0, 14);
    if (!f.archers?.arrayValue) 記す(g, '記録に射手の配列が無い', 名);
    if (!f.shotCount?.integerValue && !f.shotCount?.doubleValue) 記す(g, '射数が数値でない', 名);
    const 日 = Number(f.date?.integerValue ?? f.date?.doubleValue ?? 0);
    if (!日 || 日 < 946684800000 || 日 > Date.now() + 86400000 * 365) 記す(g, '日付が読めない', `${名} (${日})`);
    if (f.tags && !f.tags.arrayValue) 記す(g, 'タグが配列でない', 名);
    (f.archers?.arrayValue?.values || []).forEach((a) => {
      const af = a.mapValue?.fields || {};
      if (af.isSeparator?.booleanValue) return;
      (af.marks?.arrayValue?.values || []).forEach((m) => {
        const v = m.stringValue ?? '';
        if (v !== '' && v !== '○' && v !== '×') 記す(g, '○×以外の値', `${名}: ${JSON.stringify(v)}`);
      });
    });
  });

  // ゴミ箱の形
  ごみ.forEach((d) => {
    const f = d.fields || {};
    if (f.pendingDelete?.booleanValue) 記す(g, 'ゴミ箱に送信待ちが残る', d.name.split('/').pop());
  });

  集計.push({
    団体: g,
    部員: 部員.length,
    卒業生: 卒業.length,
    記録: 記録.length,
    ごみ箱: ごみ.length,
    逆引き: 逆引き.length,
  });
}

console.table(集計);
const 合計 = 集計.reduce((a, x) => ({
  部員: a.部員 + x.部員,
  卒業生: a.卒業生 + x.卒業生,
  記録: a.記録 + x.記録,
  ごみ箱: a.ごみ箱 + x.ごみ箱,
}), { 部員: 0, 卒業生: 0, 記録: 0, ごみ箱: 0 });
console.log(`合計: 部員 ${合計.部員} / 卒業生 ${合計.卒業生} / 記録 ${合計.記録} / ごみ箱 ${合計.ごみ箱}\n`);

if (!見つけた.length) {
  console.log('見つかった問題: なし');
} else {
  console.log(`★ ${見つけた.length} 件`);
  console.table(見つけた.slice(0, 50));
}
