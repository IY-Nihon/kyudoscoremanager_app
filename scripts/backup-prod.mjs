/**
 * 全データを丸ごと控える。読み取りのみ。
 *
 *   node scripts/backup-prod.mjs [prod|stg] [保存先]
 *
 * 既定は本番。保存先の既定は backup-output/<日時>/ （.gitignore 済み）。
 * 氏名・メールアドレス・記録が入るので、リポジトリには入れない。
 *
 * Firestore は REST の生の形（fields 付き）でそのまま保存する。型が保たれ、
 * 書き戻すときは同じ形を PATCH するだけで済む。
 *
 * 読む権限は Firebase CLI のログイン（所有者）を借りる。事前に
 * `firebase login` を済ませておくこと。
 *
 * 元は匿名サインインで読んでいた。これは本番のルールが全開だった頃の作りで、
 * ルールを絞ったあとは全部 403 になる。それでも日付フォルダは作られるため、
 * 中身の無い控えが「取れたように見える」状態になっていた。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const TARGET = ['stg', 'prod'].includes(process.argv[2]) ? process.argv[2] : 'prod';
const env = Object.fromEntries(
  fs.readFileSync(TARGET === 'stg' ? '.env.development.local' : '.env', 'utf8')
    .split(/\r?\n/).filter((l) => l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const PID = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = env.EXPO_PUBLIC_FIREBASE_API_KEY;
const RTDB = env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
const BASE = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = process.argv[3] || path.join('backup-output', `${TARGET === 'stg' ? 'stg-' : ''}${stamp}`);
fs.mkdirSync(OUT, { recursive: true });

// ── 所有者のトークン（Firebase CLI のログインを借りる） ──────────────
// firebase-tools は access_token と refresh_token を手元の設定ファイルに置く。
// access_token は1時間で切れるので、切れていれば refresh_token で取り直す。
const CLI設定 = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
// firebase-tools が使っている公開のクライアントID（秘密ではない）
const CLI_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLI_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function 所有者トークン() {
  if (!fs.existsSync(CLI設定)) {
    throw new Error(`Firebase CLI のログイン情報が見つかりません（${CLI設定}）。firebase login を実行してください。`);
  }
  const 設定 = JSON.parse(fs.readFileSync(CLI設定, 'utf8'));
  const t = 設定.tokens || {};
  // 余裕をみて5分前には取り直す
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
  if (!r.ok || !j.access_token) throw new Error(`トークンを取り直せませんでした: ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}

const OWNER = await 所有者トークン();
const H = { Authorization: `Bearer ${OWNER}` };

// RTDB は Firebase の ID トークンでなく、所有者の access_token でも読める
// （?access_token= を付ける）。匿名利用者を作らずに済む。
const RTDB認証 = `access_token=${OWNER}`;

// 読める状態かを先に確かめる。ここで落ちれば、空の控えを作らずに済む
{
  const r = await fetch(`${BASE}/groups?pageSize=1`, { headers: H });
  if (!r.ok) {
    console.error(`★ ${PID} の Firestore を読めません（HTTP ${r.status}）。`);
    console.error('  firebase login のアカウントに、このプロジェクトの権限があるか確認してください。');
    process.exit(1);
  }
}

const 統計 = { コレクション: 0, ドキュメント: 0, バイト: 0 };
const 失敗 = [];

/** そのパス直下のコレクション名を問い合わせる */
async function listCollectionIds(docPath) {
  const url = `${BASE}${docPath}:listCollectionIds`;
  const r = await fetch(url, {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageSize: 300 }),
  });
  if (!r.ok) return null;
  return (await r.json()).collectionIds || [];
}

/** コレクションの全ドキュメントを取る（ページ送りあり） */
async function listDocs(colPath) {
  const out = []; let tok = '';
  for (;;) {
    const r = await fetch(`${BASE}${colPath}?pageSize=300${tok ? `&pageToken=${tok}` : ''}`, { headers: H });
    if (!r.ok) { 失敗.push({ パス: colPath, HTTP: r.status }); return out; }
    const j = await r.json();
    (j.documents || []).forEach((d) => out.push(d));
    if (!j.nextPageToken) break;
    tok = j.nextPageToken;
  }
  return out;
}

/** コレクションを控え、各ドキュメントの下も再帰的にたどる */
async function backupCollection(colPath, depth = 0) {
  const docs = await listDocs(colPath);
  const file = path.join(OUT, 'firestore', colPath.replace(/^\//, '').replace(/\//g, '__') + '.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = JSON.stringify({ path: colPath, count: docs.length, documents: docs }, null, 1);
  fs.writeFileSync(file, body);
  統計.コレクション++; 統計.ドキュメント += docs.length; 統計.バイト += Buffer.byteLength(body);
  console.log(`${'  '.repeat(depth)}${colPath} … ${docs.length}件`);

  if (depth >= 4) return;                       // 念のための歯止め
  for (const d of docs) {
    const docPath = '/' + d.name.split('/documents/')[1];
    const subs = await listCollectionIds(docPath);
    for (const s of subs || []) await backupCollection(`${docPath}/${s}`, depth + 1);
  }
}

console.log(`本番 ${PID} を控えます → ${OUT}\n`);

// ── Firestore ────────────────────────────────────────────────────
console.log('■ Firestore');
let roots = await listCollectionIds('');
if (!roots) {
  console.warn('  コレクション名の一覧を取得できませんでした。既知の一覧で控えます。');
  roots = ['group_accounts', 'groups', 'inquiries', 'member_claims'];
}
console.log(`  対象: ${roots.join(', ')}\n`);
for (const c of roots) await backupCollection(`/${c}`);

// groups の親ドキュメントが無い団体はサブコレクションを辿れないので、
// group_accounts から団体IDを拾って個別に確認する
const ga = JSON.parse(fs.readFileSync(path.join(OUT, 'firestore', 'group_accounts.json'), 'utf8'));
const 既知のサブ = ['sessions', 'members', 'alumni', 'trash', 'config', 'officialPracticeDays', 'member_lookup'];
for (const d of ga.documents || []) {
  const gid = d.name.split('/').pop();
  for (const sub of 既知のサブ) {
    const f = path.join(OUT, 'firestore', `groups__${gid}__${sub}.json`);
    if (fs.existsSync(f)) continue;                       // 上の再帰で控え済み
    await backupCollection(`/groups/${gid}/${sub}`, 1);
  }
}

// ── RTDB ─────────────────────────────────────────────────────────
// live_sessions は団体ノード配下しか読めない（親をまとめて読むと401）。
// 団体IDごとに取りに行く。
console.log('\n■ RTDB');
const 団体一覧 = (ga.documents || []).map((d) => d.name.split('/').pop());
const rtdb = { live_sessions: {} };
rtdb.live_history = {};
for (const gid of 団体一覧) {
  const r = await fetch(`${RTDB}/live_sessions/${gid}.json?${RTDB認証}`);
  if (!r.ok) { 失敗.push({ パス: `rtdb:/live_sessions/${gid}`, HTTP: r.status }); console.log(`  live_sessions/${gid} … HTTP ${r.status}`); continue; }
  const j = await r.json();
  rtdb.live_sessions[gid] = j;
  console.log(`  live_sessions/${gid} … ${j === null ? 'なし' : Object.keys(j).length + '件'}`);
  // 共有履歴はライブの枝の外（live_history）にある。控えから漏らさない
  const r2 = await fetch(`${RTDB}/live_history/${gid}.json?${RTDB認証}`);
  if (!r2.ok) { 失敗.push({ パス: `rtdb:/live_history/${gid}`, HTTP: r2.status }); console.log(`  live_history/${gid} … HTTP ${r2.status}`); continue; }
  const j2 = await r2.json();
  rtdb.live_history[gid] = j2;
  console.log(`  live_history/${gid}  … ${j2 === null ? 'なし' : Object.keys(j2).length + '件'}`);
}
// appData はアプリが使っておらず、ルールからも外した（常に空だった）。
// 控えを取ろうとすると拒否されて「失敗1件」と記録され、本物の失敗が
// 埋もれるため、読み取りごと外した。RTDB で使っているのは live_sessions だけ。
fs.writeFileSync(path.join(OUT, 'rtdb.json'), JSON.stringify(rtdb, null, 1));

// ── ルールと設定 ─────────────────────────────────────────────────
console.log('\n■ ルールと設定');
fs.mkdirSync(path.join(OUT, 'rules'), { recursive: true });
for (const f of ['firestore.rules', 'database.rules.json', 'storage.rules', 'firestore.indexes.json',
                 'firebase.json', '_archive/restore-open.rules']) {
  if (!fs.existsSync(f)) { console.log(`  ${f} … なし`); continue; }
  fs.copyFileSync(f, path.join(OUT, 'rules', path.basename(f)));
  console.log(`  ${f} … 控えました`);
}

// ── 利用者アカウントと、実際に効いているインデックス ─────────────
// ここだけは Firebase CLI が要る（REST では取れない）。
// users.json にはパスワードのハッシュと salt が入る。取り扱いに注意。
console.log('\n■ 利用者アカウントとインデックス');
const { execSync } = await import('node:child_process');
const projectFlag = TARGET === 'stg' ? 'kyudoscoremanager-stg' : PID;
let 利用者数 = null;
fs.mkdirSync(path.join(OUT, 'auth'), { recursive: true });
try {
  execSync(`npx firebase auth:export "${path.join(OUT, 'auth', 'users.json')}" --format=json --project ${projectFlag}`,
    { stdio: 'pipe' });
  利用者数 = (JSON.parse(fs.readFileSync(path.join(OUT, 'auth', 'users.json'), 'utf8')).users || []).length;
  console.log(`  利用者 … ${利用者数}件（パスワードのハッシュを含むため取り扱い注意）`);
} catch (e) {
  失敗.push({ パス: 'auth:export', 理由: 'Firebase CLI にログインしていない可能性' });
  console.log('  利用者 … 取得できませんでした（npx firebase login を確認してください）');
}
try {
  const out = execSync(`npx firebase firestore:indexes --project ${projectFlag}`, { stdio: 'pipe' }).toString();
  fs.writeFileSync(path.join(OUT, 'rules', 'firestore.indexes.ACTUAL.json'), out);
  const n = (JSON.parse(out).indexes || []).length;
  console.log(`  インデックス … ${n}件（リポジトリの firestore.indexes.json は雛形のままなので、こちらが実体）`);
} catch {
  失敗.push({ パス: 'firestore:indexes', 理由: '取得できませんでした' });
  console.log('  インデックス … 取得できませんでした');
}

// ── 目録 ─────────────────────────────────────────────────────────
const manifest = {
  取得日時: new Date().toISOString(),
  プロジェクト: PID,
  Firestore: 統計,
  RTDB: Object.fromEntries(Object.entries(rtdb.live_sessions || {})
    .map(([g, v]) => [`live_sessions/${g}`, v === null ? 0 : Object.keys(v).length])),
  利用者: 利用者数,
  失敗,
  読んだ権限: `Firebase CLI のログイン（所有者）`,
  注意: 'ルールは団体ごとに絞ってある。所有者権限で読む。書き戻しは同じ形を PATCH する。',
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));

console.log('\n■ まとめ');
console.table([{ ...統計, MB: (統計.バイト / 1048576).toFixed(2) }]);
if (失敗.length) { console.error('取得できなかったもの:'); console.table(失敗); }

// 中身の無い控えを「取れた」と思わせないための最後の関門。
// 権限まわりが変わったときに、日付フォルダだけができて気づかない事故を防ぐ
const 空っぽ = 統計.ドキュメント === 0 || 統計.コレクション === 0;
if (空っぽ || 失敗.length) {
  console.error('\n★ この控えは不完全です。使い物になりません。');
  if (空っぽ) console.error('  Firestore から1件も取れていません。権限を確認してください。');
  console.error(`  場所: ${OUT}`);
  process.exit(1);
}
console.log(`すべて取得しました → ${OUT}`);
