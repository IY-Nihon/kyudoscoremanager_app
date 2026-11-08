/**
 * 手元のエミュレーターに入れる中身を、検証環境（kyudoscoremanager-stg）から写して控えにする（2026-11-08）。
 *
 *   npm run emu:seed        （= firebase emulators:exec … "node scripts/emu-seed.mjs" --export-on-exit e2e/.emu-data）
 *
 * 検証環境の Firestore を読み（読むだけ）、エミュレーターへ同じ形のまま書く（Bearer owner で決まりを通さない）。
 * 認証の口座は、メールのある口座だけを同じ uid・メール・確認済みの様子で作り、パスワードは検証の試しのパスワード
 *（STG_TEST_PASSWORD。E2E の口座は全部これ）にする。匿名の口座は写さない（部員は E2E のたびに入り直す）。
 * RTDB（ライブ）は写さない（E2E が自分で作って消す）。
 *
 * 写した控え（e2e/.emu-data）は倉庫に入れない（.gitignore。検証の 100001 には元の分からない人名がある）。
 * 検証環境の読みの枠を使う（団体 10 の全部で数千回）。1 日に何度も流さない。E2E を足して検証の団体の中身を
 * 変えたときだけ取り直す
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { 検証のパスワード } from './fb-rest.mjs';

const 企画 = 'kyudoscoremanager-stg';
const 雲 = `https://firestore.googleapis.com/v1/projects/${企画}/databases/(default)/documents`;
const 手元の港 = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const 手元 = `http://${手元の港}/v1/projects/${企画}/databases/(default)/documents`;
const 認証の手元 = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099'}/identitytoolkit.googleapis.com/v1/projects/${企画}`;

/** firebase-tools のログイン情報から access_token を取る（scripts/check-lookup-drift.mjs と同じ手口） */
async function 合鍵を取る() {
  const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const t = (JSON.parse(fs.readFileSync(設定, 'utf8')) || {}).tokens || {};
  if (t.access_token && t.expires_at && t.expires_at - Date.now() > 5 * 60 * 1000) return t.access_token;
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
  if (!j.access_token) throw new Error('Firebase CLI の合鍵を取れませんでした（firebase login）');
  return j.access_token;
}

const 鍵 = await 合鍵を取る();
const 雲の頭 = { Authorization: `Bearer ${鍵}`, 'Content-Type': 'application/json' };
const 手元の頭 = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

/** 文書の下の集まりの名前 */
async function 下の集まり(文書の道) {
  const r = await fetch(`${雲}${文書の道 ? '/' + 文書の道 : ''}:listCollectionIds`, {
    method: 'POST',
    headers: 雲の頭,
    body: JSON.stringify({ pageSize: 100 }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`集まりを読めません（${r.status}）: ${JSON.stringify(j).slice(0, 200)}`);
  return j.collectionIds || [];
}

/** 集まりの文書を全部（中身つき） */
async function 集まりを読む(集まりの道) {
  const 出 = [];
  let 次 = '';
  do {
    const r = await fetch(`${雲}/${集まりの道}?pageSize=300${次 ? '&pageToken=' + 次 : ''}`, {
      headers: 雲の頭,
    });
    const j = await r.json();
    if (!r.ok) throw new Error(`${集まりの道} を読めません（${r.status}）`);
    出.push(...(j.documents || []));
    次 = j.nextPageToken || '';
  } while (次);
  return 出;
}

let 書く束 = [];
let 写した = 0;
async function 書き出す() {
  if (!書く束.length) return;
  const r = await fetch(`${手元}:commit`, {
    method: 'POST',
    headers: 手元の頭,
    body: JSON.stringify({ writes: 書く束 }),
  });
  if (!r.ok) throw new Error(`エミュレーターに書けません（${r.status}）: ${(await r.text()).slice(0, 300)}`);
  写した += 書く束.length;
  書く束 = [];
}
async function 置く(文書) {
  const 道 = 文書.name.split('/documents/')[1];
  書く束.push({
    update: { name: `projects/${企画}/databases/(default)/documents/${道}`, fields: 文書.fields || {} },
  });
  if (書く束.length >= 400) await 書き出す();
}

/** 集まりを下までたどって写す（disposable_domains は大きいので写さない） */
async function たどる(集まりの道) {
  for (const 文書 of await 集まりを読む(集まりの道)) {
    await 置く(文書);
    const 道 = 文書.name.split('/documents/')[1];
    for (const 子 of await 下の集まり(道)) await たどる(`${道}/${子}`);
  }
}

// 記録（sessions）は数が多いので、団体の下の集まりは団体ごとに 1 回だけ名前を聞く（文書ごとには聞かない）
const 葉の集まり = new Set([
  'sessions',
  'trash',
  'members',
  'alumni',
  'officialPracticeDays',
  'member_lookup',
  'config',
]);
async function 団体をたどる(集まりの道) {
  for (const 文書 of await 集まりを読む(集まりの道)) {
    await 置く(文書);
    const 道 = 文書.name.split('/documents/')[1];
    for (const 子 of await 下の集まり(道)) {
      if (葉の集まり.has(子)) for (const 葉 of await 集まりを読む(`${道}/${子}`)) await 置く(葉);
      else await たどる(`${道}/${子}`);
    }
  }
}

const 根の集まり = await 下の集まり('');
console.log('検証環境の根の集まり:', 根の集まり.join(', '));
for (const 名 of 根の集まり) {
  if (名 === 'disposable_domains' || 名 === 'errorReports' || 名 === 'rate_limits') continue;
  if (名 === 'groups') await 団体をたどる(名);
  else if (名 === 'group_accounts')
    await たどる(名); // 下に private がある
  else for (const 文書 of await 集まりを読む(名)) await 置く(文書); // 所属の証などは下の集まりが無い
  await 書き出す();
  console.log(`  ${名}: ここまでに ${写した} 件`);
}

// 認証の口座（メールのあるものだけ）
let 次 = '';
let 口座 = 0;
const 合言葉 = 検証のパスワード();
do {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects/${企画}/accounts:batchGet?maxResults=500${次 ? '&nextPageToken=' + 次 : ''}`,
    { headers: 雲の頭 }
  );
  const j = await r.json();
  if (!r.ok) throw new Error(`口座を読めません（${r.status}）`);
  for (const 人 of j.users || []) {
    if (!人.email) continue;
    const 作る = await fetch(`${認証の手元}/accounts`, {
      method: 'POST',
      headers: 手元の頭,
      body: JSON.stringify({
        localId: 人.localId,
        email: 人.email,
        password: 合言葉,
        emailVerified: !!人.emailVerified,
      }),
    });
    if (!作る.ok) throw new Error(`口座を作れません（${作る.status}）: ${(await 作る.text()).slice(0, 200)}`);
    口座++;
  }
  次 = j.nextPageToken || '';
} while (次);
console.log(`写した：文書 ${写した} 件・メールの口座 ${口座} 人（パスワードは検証の試しのもの）`);
