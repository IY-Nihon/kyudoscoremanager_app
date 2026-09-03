/**
 * 団体の無い認証利用者（取り残されたアカウント）を数える。読むだけ。
 *
 *   node scripts/find-orphan-accounts.mjs        （検証環境）
 *   node scripts/find-orphan-accounts.mjs prod   （本番）
 *
 * ■ なぜ要るか
 * 新規登録は、Firebase Auth の利用者を先に作ってから Firestore の
 * group_accounts へ書く。2026-08-27 の配信から、決まりの項目が足りずに
 * 後半が弾かれていたため、認証の利用者だけが残った人がいるはず。
 * その人は同じメールアドレスで作り直せない（auth/email-already-in-use）。
 *
 * ここでは、メールアドレスを持つ認証利用者のうち、group_accounts に
 * 対応する団体が無いものを並べる。部員は匿名で入るのでメールを持たず、
 * ここには出てこない。
 *
 * 消すことはしない。消すかどうかは人が決める（本人が使っている可能性も
 * あるため）。消す必要があるときは、この一覧をもとに判断する。
 *
 * 認証は Firebase CLI の権限を使う（事前に `firebase login` が済んでいること）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';

const 対象 = process.argv[2] || 'stg';
if (!['stg', 'prod'].includes(対象)) {
  console.error('使い方: node scripts/find-orphan-accounts.mjs <stg|prod>');
  process.exit(1);
}
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';

// 消すのは、末尾に 消す を付けたときだけ。アドレスを並べればその人だけ。
// 何も書かずに 消す だけだと、一覧の全員が対象になる
const 消す = process.argv[3] === '消す';
const 名指し = 消す ? process.argv.slice(4).map((x) => x.toLowerCase()) : [];

// 団体を持たなくても不思議でない利用者（運営者の管理用）。
//
// 一覧を手で持つと、firestore.rules を直したときに片方だけ古くなる。
// 実際 2026-09-03 に isAdmin() を5件から1件へ減らしたとき、ここだけ5件の
// まま残り、外したはずの口座が「消してはいけないもの」として保護され続けて
// いた。二度と食い違わないよう、決まりのファイルから読む。
const 管理者 = (() => {
  const 決まりの道 = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'firestore.rules');
  const 決まり = fs.readFileSync(決まりの道, 'utf8');
  const i = 決まり.indexOf('function isAdmin()');
  if (i < 0) {
    console.error('firestore.rules に isAdmin() が見つかりません。中止します。');
    process.exit(1);
  }
  const 節 = 決まり.slice(i, 決まり.indexOf(']', i));
  const 一覧 = [...節.matchAll(/'([^']+@[^']+)'/g)].map((m) => m[1].toLowerCase());
  if (!一覧.length) {
    console.error('isAdmin() からアドレスを読み取れませんでした。中止します。');
    process.exit(1);
  }
  return new Set(一覧);
})();
console.log(`管理者として扱う（firestore.rules から読んだ）: ${[...管理者].join(', ')}\n`);

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

// 団体の一覧（メールアドレスで引けるようにする）
const 団体のメール = new Set();
let token = '';
for (;;) {
  const u =
    `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents/group_accounts` +
    `?pageSize=300&showMissing=true${token ? `&pageToken=${token}` : ''}`;
  const j = await (await fetch(u, { headers: 頭 })).json();
  if (j.error) {
    console.error('団体を読めませんでした: ' + (j.error.message || ''));
    process.exit(1);
  }
  for (const d of j.documents || []) {
    const m = d.fields?.email?.stringValue;
    if (m) 団体のメール.add(m.toLowerCase());
  }
  if (!j.nextPageToken) break;
  token = j.nextPageToken;
}

// 認証の利用者の一覧
const 利用者 = [];
let 次 = '';
for (;;) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${企画}/accounts:query`, {
    method: 'POST',
    headers: 頭,
    body: JSON.stringify(Object.assign({ limit: '500' }, 次 ? { offset: 次 } : {})),
  });
  const j = await r.json();
  if (j.error) {
    console.error('認証の利用者を読めませんでした: ' + (j.error.message || ''));
    process.exit(1);
  }
  for (const u of j.userInfo || []) 利用者.push(u);
  const 総 = Number(j.recordsCount || 0);
  if (!j.userInfo || 利用者.length >= 総 || j.userInfo.length === 0) break;
  次 = String(利用者.length);
}

const 日 = (t) => (t ? new Date(Number(t)).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '不明');
const メール持ち = 利用者.filter((u) => u.email);
const 取り残され = メール持ち.filter(
  (u) => !団体のメール.has(String(u.email).toLowerCase()) && !管理者.has(String(u.email).toLowerCase())
);

console.log(`接続先: ${企画}（読むだけ）\n`);
console.log(`認証の利用者 ${利用者.length} 人（うちメールを持つ人 ${メール持ち.length} 人）`);
console.log(`団体 ${団体のメール.size} 件\n`);
if (取り残され.length === 0) {
  console.log('団体の無い利用者はいません。');
  process.exit(0);
}
console.log(`■ 団体の無い利用者 ${取り残され.length} 人`);
console.log('  この人たちは、同じメールアドレスでは団体を作り直せません。');
console.log('  本人が使っている可能性もあるので、消すかどうかは中身を見て決めてください。\n');
取り残され
  .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
  .forEach((u) => {
    console.log(`  ${u.email}`);
    console.log(`    作られた日時: ${日(u.createdAt)} / 最後に入った日時: ${日(u.lastLoginAt)}`);
  });
if (!消す) {
  console.log('\n消すときは、末尾に 消す と、消したいアドレスを並べてください。');
  console.log('  node scripts/find-orphan-accounts.mjs ' + 対象 + ' 消す a@example.com b@example.com');
  console.log('アドレスを書かずに 消す だけを付けると、上の全員が対象になります。');
  process.exit(0);
}

// 名指しされたものが一覧に無いときは、団体を持っている人かもしれない。
// 取り違えて消すと戻せないので、その場合は何もしない
const 消す対象 = 名指し.length
  ? 取り残され.filter((u) => 名指し.includes(String(u.email).toLowerCase()))
  : 取り残され;
if (名指し.length) {
  const 無い = 名指し.filter((m) => !取り残され.some((u) => String(u.email).toLowerCase() === m));
  if (無い.length) {
    console.error('\n一覧に無いアドレスが指定されています: ' + 無い.join(', '));
    console.error('団体を持っている人かもしれません。念のため何も消しません。');
    process.exit(1);
  }
}

// 消す前に控えを残す。あとから「誰を消したか」を説明できないと、
// 問い合わせが来たときに答えようがない
const 控え = 'orphan-deleted-' + 対象 + '-' + Date.now() + '.json';
fs.writeFileSync(
  控え,
  JSON.stringify(
    消す対象.map((u) => ({
      email: u.email,
      localId: u.localId,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    })),
    null,
    2
  )
);
console.log('\n控えを書きました: ' + 控え + '（' + 消す対象.length + ' 人）');

let 消えた = 0;
for (const u of 消す対象) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/projects/' + 企画 + '/accounts:delete', {
    method: 'POST',
    headers: 頭,
    body: JSON.stringify({ localId: u.localId }),
  });
  console.log('  ' + u.email + ': ' + (r.ok ? '消した' : '⚠ 消せない'));
  if (r.ok) 消えた++;
}
console.log('\n' + 消えた + ' 人を消しました。そのアドレスで団体を作り直せます。');
