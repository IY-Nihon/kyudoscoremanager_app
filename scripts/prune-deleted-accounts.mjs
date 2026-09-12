/**
 * 保管期間（30日）の過ぎた「削除した団体アカウントの写し」を消す。
 *
 *   node scripts/prune-deleted-accounts.mjs             （検証環境・数えるだけ）
 *   node scripts/prune-deleted-accounts.mjs prod        （本番・数えるだけ）
 *   node scripts/prune-deleted-accounts.mjs prod 消す   （本番・実際に消す）
 *
 * ■ 何を消すか
 * 設定の「アカウントを削除する」は、団体の中身を deleted_accounts/{団体ID} の下へ
 * 写してから元を消す（src/accountDeletion.js）。写しには expireAt（削除の30日後）が
 * 入っている。ここではそれを過ぎた写しを、下位（sessions・members・alumni・trash・
 * config・officialPracticeDays・member_lookup）ごと消す。
 *
 * プライバシーポリシー第18条第3項の「削除後30日間は復旧のために保管し、経過後に消去」
 * の「消去」がこれ。Firestore の自動削除（TTL）は無料枠では使えないので、道具で消す
 * （prune-error-reports.mjs と同じ理由）。月に一度くらい動かす。
 *
 * 引数に「消す」を付けない限り、数えるだけで何も消さない。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = process.argv[2] || 'stg';
const 消す = process.argv[3] === '消す';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/prune-deleted-accounts.mjs <stg|prod> [消す]');
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

/** 集まりを全部読む（ページ送り込み） */
async function 全部読む(道) {
  const 出 = [];
  let token = '';
  for (;;) {
    const j = await (await fetch(`${根}/${道}?pageSize=300${token ? `&pageToken=${token}` : ''}`, { headers: 頭 })).json();
    if (j.error) throw new Error(`${道} を読めませんでした: ${j.error.message || ''}`);
    for (const d of j.documents || []) 出.push(d);
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
  }
  return 出;
}
const 数 = (d, 名) => {
  const v = d.fields?.[名];
  if (!v) return 0;
  if (v.integerValue != null) return Number(v.integerValue);
  if (v.doubleValue != null) return Number(v.doubleValue);
  if (v.timestampValue) return Date.parse(v.timestampValue);
  return 0;
};
const 日 = (t) => (t ? new Date(t).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '不明');
const 下位 = ['sessions', 'members', 'alumni', 'trash', 'config', 'officialPracticeDays', 'member_lookup'];

const 全部 = await 全部読む('deleted_accounts');
const いま = Date.now();
const 期限切れ = 全部.filter((d) => {
  const e = 数(d, 'expireAt');
  return e > 0 && e <= いま;
});

console.log(`接続先: ${企画}`);
console.log(`削除した団体の写し ${全部.length} 件のうち、保管期間の過ぎたもの ${期限切れ.length} 件\n`);
for (const d of 全部) {
  const id = d.name.split('/').pop();
  const 期限 = 数(d, 'expireAt');
  console.log(`  ${id}  削除 ${日(数(d, 'deletedAt'))}  期限 ${日(期限)}  ${期限 <= いま ? '← 消す' : ''}`);
}
if (期限切れ.length === 0) {
  console.log('\n消すものはありません。');
  process.exit(0);
}
if (!消す) {
  console.log('\n消すには、末尾に 消す を付けてください。');
  console.log('  node scripts/prune-deleted-accounts.mjs ' + 対象 + ' 消す');
  process.exit(0);
}

let 済み = 0;
for (const d of 期限切れ) {
  const id = d.name.split('/').pop();
  let 下位の数 = 0;
  // 下位を先に消す。文書を消しても下位は残る（Firestore は親子が独立）
  for (const 名 of 下位) {
    const 一覧 = await 全部読む(`deleted_accounts/${id}/${名}`);
    for (const x of 一覧) {
      const r = await fetch(`https://firestore.googleapis.com/v1/${x.name}`, { method: 'DELETE', headers: 頭 });
      if (r.ok) 下位の数++;
      else console.error(`  消せませんでした: ${x.name.split('/documents/').pop()}`);
    }
  }
  const r = await fetch(`https://firestore.googleapis.com/v1/${d.name}`, { method: 'DELETE', headers: 頭 });
  if (r.ok) {
    済み++;
    console.log(`  ${id} を消しました（下位 ${下位の数} 件）`);
  } else console.error(`  消せませんでした: ${id}`);
}
console.log(`\n${済み} 件を消しました。`);
