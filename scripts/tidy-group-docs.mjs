/**
 * 団体の文書の形をそろえる。既定は読むだけ。
 *
 *   node scripts/tidy-group-docs.mjs            （検証環境・読むだけ）
 *   node scripts/tidy-group-docs.mjs prod       （本番・読むだけ）
 *   node scripts/tidy-group-docs.mjs prod 直す  （本番・直す）
 *
 * ■ そろえる形
 *   group_accounts/{id}           id・email だけ（ログインに要る2つ。誰でも読める）
 *   group_accounts/{id}/private/consent
 *                                 name・createdAt・同意の版・同意した日時（・同意の取り方）
 *   groups/{id}                   groupName・liveSecret だけ
 *
 * ■ 直すもの
 *   1. groups/{id} に groupName が無い → private/consent の name を写す。
 *      アプリは団体名を groups/{id}.groupName からしか読まない（設定の「団体名」と部員の画面）。
 *      登録の画面は団体名を private にしか書いていなかったので、登録したまま名前を
 *      変えていない団体は、団体の持ち主にも部員にも「未設定」と出ていた（2026-09-24 に 4 団体）。
 *      groups/{id} の文書自体が無い団体は、groupName だけで作る（liveSecret はアプリが後で足す）
 *   2. groups/{id} の昔の項目（email・orgId・orgName・createdAt）を消す。
 *      アプリは読んでいない。createdAt は private に無ければ写してから消す
 *   3. private/consent に name が無い → groups/{id}.groupName を写す（管理画面で団体を見分けるため）
 *   4. group_accounts/{id} に id・email 以外がある → 消す。同意の記録は private に
 *      同意の版 が無いときだけ写す（private の方が新しい決まりで書かれた正本）
 *
 * 所有者の権限で動くので、決まりを通らずに読み書きできる。
 * 直す前に scripts/backup-prod.mjs で控えを取ること。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = ['stg', 'prod'].includes(process.argv[2]) ? process.argv[2] : 'stg';
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 直す = process.argv.includes('直す');

const 公開してよい = ['id', 'email'];
const 団体に置いてよい = ['groupName', 'liveSecret'];
const 同意の項目 = ['同意の版', '同意した日時', '同意の取り方'];

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
const 根 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;

async function 読む(道) {
  const r = await fetch(`${根}/${道}`, { headers: 頭 });
  if (r.status === 404) return null;
  const j = await r.json();
  if (j.error) throw new Error(`${道} を読めません: ${j.error.message}`);
  return j;
}
async function 一覧(道) {
  const 出 = [];
  for (let tok = ''; ;) {
    const j = await (
      await fetch(`${根}/${道}?pageSize=300${tok ? `&pageToken=${tok}` : ''}`, { headers: 頭 })
    ).json();
    if (j.error) throw new Error(`${道} を読めません: ${j.error.message}`);
    (j.documents || []).forEach((d) => 出.push(d));
    if (!j.nextPageToken) break;
    tok = j.nextPageToken;
  }
  return 出;
}
/** 項目の道。英数字以外（日本語）はバッククォートで囲む決まり */
const 道の字 = (名) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(名) ? 名 : '`' + 名.replace(/`/g, '\\`') + '`');
/**
 * 書き足す（中身）と消す（名前）を 1 回で送る。mask に載せて中身に無い項目は消える。
 * 無い文書に書くときは 作る を true にする（在ったら断られる）
 */
async function 書き換える(道, 中身, 消す名 = [], 作る = false) {
  const 名たち = [...Object.keys(中身), ...消す名];
  const q = 名たち.map((名) => `updateMask.fieldPaths=${encodeURIComponent(道の字(名))}`);
  if (作る) q.push('currentDocument.exists=false');
  const r = await fetch(`${根}/${道}?${q.join('&')}`, {
    method: 'PATCH',
    headers: 頭,
    body: JSON.stringify({ fields: 中身 }),
  });
  const j = await r.json();
  if (j.error) throw new Error(`${道} に書けません: ${j.error.message}`);
}

const 伏せる = (id) => id.slice(0, 2) + '****';
const 名の値 = (f) => f && f.stringValue;
const 手当て = [];

for (const 帳 of await 一覧('group_accounts')) {
  const id = 帳.name.split('/').pop();
  const 公開 = 帳.fields || {};
  const 私 = await 読む(`group_accounts/${id}/private/consent`);
  const 私の中身 = (私 && 私.fields) || {};
  const 団体 = await 読む(`groups/${id}`);
  const 団体の中身 = (団体 && 団体.fields) || {};
  const 団体名 = 名の値(団体の中身.groupName) || 名の値(団体の中身.orgName) || 名の値(私の中身.name);

  // 1. groups/{id}.groupName
  if (!名の値(団体の中身.groupName) && 団体名) {
    手当て.push({
      団体: id,
      訳: 団体 ? 'groups に団体名を入れる' : 'groups の文書を作って団体名を入れる',
      する: () => 書き換える(`groups/${id}`, { groupName: { stringValue: 団体名 } }, [], !団体),
    });
  }
  // 2. groups/{id} の昔の項目
  const 昔の項目 = Object.keys(団体の中身).filter((k) => !団体に置いてよい.includes(k));
  // 3. private の name・createdAt を補う
  const 私に足す = {};
  if (!名の値(私の中身.name) && 団体名) 私に足す.name = { stringValue: 団体名 };
  if (!私の中身.createdAt && 団体の中身.createdAt) 私に足す.createdAt = 団体の中身.createdAt;
  // 4. 公開の帳面の余分
  const 公開の余分 = Object.keys(公開).filter((k) => !公開してよい.includes(k));
  if (!私の中身.同意の版) for (const k of 同意の項目) if (公開[k] && !私の中身[k]) 私に足す[k] = 公開[k];

  if (Object.keys(私に足す).length) {
    手当て.push({
      団体: id,
      訳: `private/consent に ${Object.keys(私に足す).join('・')} を足す`,
      する: () => 書き換える(`group_accounts/${id}/private/consent`, 私に足す),
    });
  }
  if (昔の項目.length) {
    手当て.push({
      団体: id,
      訳: `groups の昔の項目 ${昔の項目.join('・')} を消す`,
      する: () => 書き換える(`groups/${id}`, {}, 昔の項目),
    });
  }
  if (公開の余分.length) {
    手当て.push({
      団体: id,
      訳: `誰でも読める帳面から ${公開の余分.join('・')} を消す`,
      する: () => 書き換える(`group_accounts/${id}`, {}, 公開の余分),
    });
  }
}

console.log(`接続先: ${企画}${直す ? '' : '（読むだけ）'}\n`);
if (!手当て.length) {
  console.log('そろっています。直すものはありません。');
  process.exit(0);
}
for (const 手 of 手当て) console.log(`  ${伏せる(手.団体)}  ${手.訳}`);
if (!直す) {
  console.log(`\n直すときは: node scripts/tidy-group-docs.mjs ${対象} 直す`);
  process.exit(0);
}
// 足す → 消す の順（写す前に消さない）。上の並びがその順になっている
for (const 手 of 手当て) {
  await 手.する();
  console.log(`  ✓ ${伏せる(手.団体)}  ${手.訳}`);
}
console.log(`\n${手当て.length} 件を直しました。`);
