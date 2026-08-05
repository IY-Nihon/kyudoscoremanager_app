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
 * RTDB は認証が要るため匿名サインインを使う（パスワードは不要）。
 */
import fs from 'node:fs';
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

// ── 匿名トークン（RTDB 用。Firestore にも付けておく） ──────────────
let token = null;
try {
  // 検証環境はルールで団体ごとに絞られているため、団体アカウントで入る。
  // 本番は全開なので匿名で足りる。
  const [op, body] = TARGET === 'stg'
    ? ['signInWithPassword', { email: 'nihonu.kouka@gmail.com', password: 'StgTest!2026', returnSecureToken: true }]
    : ['signUp', { returnSecureToken: true }];
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${op}?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  token = (await r.json()).idToken;
} catch { /* 取れなくても Firestore は続行する */ }
const H = token ? { Authorization: `Bearer ${token}` } : {};

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
for (const gid of 団体一覧) {
  const r = await fetch(`${RTDB}/live_sessions/${gid}.json${token ? `?auth=${token}` : ''}`);
  if (!r.ok) { 失敗.push({ パス: `rtdb:/live_sessions/${gid}`, HTTP: r.status }); console.log(`  live_sessions/${gid} … HTTP ${r.status}`); continue; }
  const j = await r.json();
  rtdb.live_sessions[gid] = j;
  console.log(`  live_sessions/${gid} … ${j === null ? 'なし' : Object.keys(j).length + '件'}`);
}
{
  const r = await fetch(`${RTDB}/appData.json${token ? `?auth=${token}` : ''}`);
  if (r.ok) { rtdb.appData = await r.json(); console.log(`  appData … ${rtdb.appData === null ? 'なし' : 'あり'}`); }
  else { 失敗.push({ パス: 'rtdb:/appData', HTTP: r.status }); console.log(`  appData … HTTP ${r.status}`); }
}
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

// ── 目録 ─────────────────────────────────────────────────────────
const manifest = {
  取得日時: new Date().toISOString(),
  プロジェクト: PID,
  Firestore: 統計,
  RTDB: Object.fromEntries(Object.entries(rtdb.live_sessions || {})
    .map(([g, v]) => [`live_sessions/${g}`, v === null ? 0 : Object.keys(v).length])),
  失敗,
  注意: '本番のルールは全開のため未認証でも読める状態。書き戻しは同じ形を PATCH する。',
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));

console.log('\n■ まとめ');
console.table([{ ...統計, MB: (統計.バイト / 1048576).toFixed(2) }]);
if (失敗.length) { console.error('取得できなかったもの:'); console.table(失敗); }
else console.log(`すべて取得しました → ${OUT}`);
