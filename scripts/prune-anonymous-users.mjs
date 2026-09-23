/**
 * 誰のものでもない匿名の利用者を数える・消す。既定は読むだけ。
 *
 *   node scripts/prune-anonymous-users.mjs            （検証環境・読むだけ）
 *   node scripts/prune-anonymous-users.mjs prod       （本番・読むだけ）
 *   node scripts/prune-anonymous-users.mjs prod 消す  （本番・消す）
 *
 * ■ 誰のものでもない匿名とは
 * 部員は匿名でログインし、個人IDを示して member_claims/{uid}（所属の証）を書く。
 * 決まり（firestore.rules の isClaimedMember）は証が無い匿名に何も読ませない。
 * だから証の無い匿名は、どの団体のデータにも触れない「空の口座」になる。
 *
 * 2026-09-24 に本番を調べたところ、匿名 183 人のうち 164 人がこれだった。出どころは 3 つ。
 *   1. 所属の証ができる前（2026-08-06 より前）の部員のログイン。その日から証が
 *      要るようになり、入り直した端末は新しい匿名になったので、古いほうが残った
 *   2. 部員のログアウト。証を消してから signOut するので、口座だけが残る
 *   3. 本番で流した検証の台本（12 秒で 5 人のような塊。8/6・8/7・8/29・9/9）
 *
 * ■ 消す条件（全部を満たすもの）
 *   ・メールも外部の提供元も持たない（匿名）
 *   ・member_claims に自分の uid の証が無い
 *   ・最後にトークンを更新してから 7 日より前（いま開いている端末を巻き込まない）
 *
 * 消しても、その口座の端末は次にトークンを更新するときにログアウトされ、ログイン画面に
 * 戻るだけ（証が無いので、もともと何も読めていない）。団体アカウント（メールあり）と
 * 証のある部員には触らない。
 *
 * 消す前に、消した uid と日時の控えを anonymous-deleted-*.json に書く（リポジトリには入れない）。
 * 認証は Firebase CLI の権限を使う（事前に `firebase login` が済んでいること）。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const 対象 = ['stg', 'prod'].includes(process.argv[2]) ? process.argv[2] : 'stg';
const 企画 = 対象 === 'stg' ? 'kyudoscoremanager-stg' : 'kyudoscoremanager';
const 消す = process.argv.includes('消す');
const 待つ日数 = 7;

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
const 頭 = {
  Authorization: `Bearer ${access_token}`,
  'Content-Type': 'application/json',
  'x-goog-user-project': 企画,
};

// 認証の利用者
const 利用者 = [];
for (;;) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${企画}/accounts:query`, {
    method: 'POST',
    headers: 頭,
    body: JSON.stringify({ returnUserInfo: true, limit: '500', offset: String(利用者.length) }),
  });
  const j = await r.json();
  if (j.error) {
    console.error('認証の利用者を読めませんでした: ' + (j.error.message || ''));
    process.exit(1);
  }
  for (const u of j.userInfo || []) 利用者.push(u);
  if (!j.userInfo || j.userInfo.length < 500) break;
}

// 所属の証。読めなかったら全員を「証あり」とみなして何も消さない
const 証 = new Set();
for (let token = ''; ;) {
  const u =
    `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents/member_claims` +
    `?pageSize=300&mask.fieldPaths=groupId${token ? `&pageToken=${token}` : ''}`;
  const j = await (await fetch(u, { headers: 頭 })).json();
  if (j.error) {
    console.error('所属の証を読めませんでした。念のため何も消しません: ' + (j.error.message || ''));
    process.exit(1);
  }
  for (const d of j.documents || []) 証.add(d.name.split('/').pop());
  if (!j.nextPageToken) break;
  token = j.nextPageToken;
}

const 日 = (ms) => (ms ? new Date(ms).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '不明');
const 最後に使った = (u) =>
  u.lastRefreshAt ? Date.parse(u.lastRefreshAt) : Number(u.lastLoginAt || u.createdAt || 0);
const 匿名 = 利用者.filter((u) => !u.email && !(u.providerUserInfo || []).length);
const 証なし = 匿名.filter((u) => !証.has(u.localId));
const 消す対象 = 証なし.filter((u) => Date.now() - 最後に使った(u) > 待つ日数 * 864e5);

console.log(`接続先: ${企画}${消す ? '' : '（読むだけ）'}\n`);
console.log(
  `認証の利用者 ${利用者.length} 人（メールあり ${利用者.length - 匿名.length}・匿名 ${匿名.length}）`
);
console.log(`所属の証 ${証.size} 件。証の無い匿名 ${証なし.length} 人`);
console.log(`そのうち ${待つ日数} 日より前から使われていないもの ${消す対象.length} 人\n`);
if (!消す対象.length) process.exit(0);
const 月ごと = new Map();
for (const u of [...消す対象].sort((a, b) => Number(a.createdAt) - Number(b.createdAt))) {
  const d = new Date(Number(u.createdAt) + 9 * 3600e3); // 日本の時刻の月
  const k = `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}`;
  月ごと.set(k, (月ごと.get(k) || 0) + 1);
}
console.log('作られた月:', [...月ごと].map(([k, n]) => `${k} ${n} 人`).join('・'));
console.log(`いちばん最近に使われたもの: ${日(Math.max(...消す対象.map(最後に使った)))}`);
if (!消す) {
  console.log(`\n消すときは: node scripts/prune-anonymous-users.mjs ${対象} 消す`);
  process.exit(0);
}

const 控え = `anonymous-deleted-${対象}-${Date.now()}.json`;
fs.writeFileSync(
  控え,
  JSON.stringify(
    消す対象.map((u) => ({
      localId: u.localId,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      lastRefreshAt: u.lastRefreshAt,
    })),
    null,
    2
  )
);
console.log(`\n控えを書きました: ${控え}（${消す対象.length} 人）`);

// まとめて消す（1 回に 1000 人まで）。force は「無効にしていない利用者も消す」の意味
let 消えた = 0;
for (let i = 0; i < 消す対象.length; i += 1000) {
  const 組 = 消す対象.slice(i, i + 1000).map((u) => u.localId);
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${企画}/accounts:batchDelete`, {
    method: 'POST',
    headers: 頭,
    body: JSON.stringify({ localIds: 組, force: true }),
  });
  const j = await r.json();
  if (!r.ok) {
    console.error('⚠ 消せませんでした: ' + JSON.stringify(j.error || j));
    process.exit(1);
  }
  const 失敗 = j.errors || [];
  消えた += 組.length - 失敗.length;
  失敗.forEach((e) => console.error(`  ⚠ ${e.localId}: ${e.message}`));
}
console.log(`${消えた} 人を消しました。`);
