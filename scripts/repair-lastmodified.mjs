/**
 * lastModified が {seconds, nanoseconds} の入れ物になっている記録を、数値に直す。
 *
 *   node scripts/repair-lastmodified.mjs <stg|prod> [--commit]
 *
 * --commit を付けるまでは書き込まず、対象の確認だけ行う。
 *
 * この形は、廃止したレガシー移行経路が端末の保存内容をそのまま書き戻して
 * いたために生まれた。日時として比較できないため、同期の勝ち負けの判定が
 * 働かず、他の端末で編集しても反映されない状態になる。
 *
 * lastModified だけを updateMask で更新する。他の項目には触れない。
 */
import fs from 'node:fs';
import { configFor, signIn } from './fb-rest.mjs';

const [target, ...flags] = process.argv.slice(2);
const COMMIT = flags.includes('--commit');
if (!['stg', 'prod'].includes(target)) {
  console.error('使い方: node scripts/repair-lastmodified.mjs <stg|prod> [--commit]');
  process.exit(1);
}
const { apiKey, projectId } = configFor(target);
const B = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// 団体ごとに、その団体の部員として入る（第2段階では所属の証明が要る）
const dirs = fs.readdirSync('backup-output', { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('stg-')).map((d) => d.name).sort();
const BK = `backup-output/${dirs[dirs.length - 1]}`;
const 団体 = (JSON.parse(fs.readFileSync(`${BK}/firestore/group_accounts.json`, 'utf8')).documents || [])
  .map((d) => d.name.split('/').pop());

console.log(`対象: ${projectId}（${COMMIT ? '書き込みあり' : '確認のみ'}）`);
console.log(`控え: ${BK}\n`);

const 集計 = [];
let 直した = 0, 失敗 = 0;

for (const g of 団体) {
  // 所属を名乗って読み書きできるようにする
  const s = await (await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
  })).json();
  const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${s.idToken}` };
  const ms = JSON.parse(fs.readFileSync(`${BK}/firestore/groups__${g}__members.json`, 'utf8')).documents || [];
  const m = ms.find((d) => /^\d{4}$/.test(d.fields?.personalId?.stringValue || ''));
  if (!m) { 集計.push({ 団体: g, 対象: 0, 備考: '名簿が空' }); continue; }
  await fetch(`${B}/member_claims/${s.localId}`, { method: 'PATCH', headers: H,
    body: JSON.stringify({ fields: { groupId: { stringValue: g }, memberId: { stringValue: m.name.split('/').pop() },
      personalId: { stringValue: m.fields.personalId.stringValue }, claimedAt: { integerValue: String(Date.now()) } } }) });

  for (const col of ['sessions', 'trash', 'members', 'alumni']) {
    let tok = '', 対象 = [];
    for (;;) {
      const r = await fetch(`${B}/groups/${g}/${col}?pageSize=300${tok ? `&pageToken=${tok}` : ''}`, { headers: H });
      if (!r.ok) break;
      const j = await r.json();
      (j.documents || []).forEach((d) => { if (d.fields?.lastModified?.mapValue) 対象.push(d); });
      if (!j.nextPageToken) break; tok = j.nextPageToken;
    }
    if (!対象.length) continue;
    集計.push({ 団体: g, コレクション: col, 対象: 対象.length });

    for (const d of 対象) {
      const f = d.fields.lastModified.mapValue.fields;
      const ms2 = Number(f.seconds.integerValue) * 1000 + Math.round(Number(f.nanoseconds?.integerValue || 0) / 1e6);
      const id = d.name.split('/').pop();
      if (!COMMIT) { 直した++; continue; }
      const r = await fetch(`${B}/groups/${g}/${col}/${id}?updateMask.fieldPaths=lastModified`, {
        method: 'PATCH', headers: H, body: JSON.stringify({ fields: { lastModified: { integerValue: String(ms2) } } }),
      });
      if (r.ok) 直した++; else { 失敗++; console.error(`  ✗ ${g}/${col}/${id} HTTP ${r.status}`); }
    }
  }
  await fetch(`${B}/member_claims/${s.localId}`, { method: 'DELETE', headers: H });
}

console.log('■ 入れ物になっている lastModified');
console.table(集計.length ? 集計 : [{ 結果: '対象なし' }]);
console.log(COMMIT ? `\n${直した} 件を数値に直しました（失敗 ${失敗} 件）`
  : `\n対象は ${直した} 件です。実行するには --commit を付けてください。`);
if (失敗) process.exit(1);
