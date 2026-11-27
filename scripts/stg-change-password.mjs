/**
 * 検証環境（kyudoscoremanager-stg）の試しの口座のパスワードを替える（2026-11-22・別の AI の点検の S2）。
 *
 * 前のパスワードは公開の倉庫の履歴（と古いブランチ）に残っているので、替えて使えなくする。
 * 新しいパスワードはこの台本が作り、画面には出さない（手元の .env.development.local と GitHub の Secrets にだけ書く）。
 *
 *   node scripts/stg-change-password.mjs          … 見るだけ（前のパスワードで入れる口座を数える。何も替えない）
 *   node scripts/stg-change-password.mjs 替える   … 替える
 *
 * 替えるときの順（途中で止まったら、もう一度「替える」で流すと続きから進む）：
 *   1. 新しいパスワードを作り、.env.development.local の STG_TEST_PASSWORD を新しい値に、前の値を STG_TEST_PASSWORD_OLD に控える
 *   2. 検証環境のメールとパスワードの口座のうち、前のパスワードで入れる口座を、新しいパスワードに替える
 *      （Firebase CLI のログインを借りる。scripts/emu-seed.mjs と同じ手口）
 *   3. 替えた口座が、新しいパスワードで入れて、前のパスワードでは入れないことを確かめる
 *   4. GitHub の Secrets の STG_ENV を、.env.development.local の EXPO_PUBLIC_ の行と STG_TEST_PASSWORD の行にする
 *      （gh。.github/workflows/e2e.yml の決まり）
 *   5. 手元のエミュレーターの控え（e2e/.emu-data/auth_export/accounts.json。倉庫には入らない）の口座も新しいパスワードにする
 *   6. STG_TEST_PASSWORD_OLD の行を消す
 *
 * 本番には触れない（企画は kyudoscoremanager-stg に決め打ち。.env.development.local の企画が違えば止める）。
 * 純粋な部分は test/stgChangePassword.test.js で確かめる。
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const 企画 = 'kyudoscoremanager-stg';
const 倉庫 = 'IY-Nihon/kyudoscoremanager_app';
const 根 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envの道 = path.join(根, '.env.development.local');
const エミュの道 = path.join(根, 'e2e', '.emu-data', 'auth_export', 'accounts.json');
const パスワードの印 = ':password=';

/**
 * 新しいパスワード（24 字。英大・英小・数字・記号（- か _）を必ず含む）
 * @param {(n: number) => Buffer} [乱]
 */
export function 新しいパスワードを作る(乱 = (n) => crypto.randomBytes(n)) {
  for (;;) {
    const s = 乱(18).toString('base64url');
    if (s.length === 24 && /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s) && /[-_]/.test(s)) return s;
  }
}

/** .env の中身から 名 の値を読む（頭の BOM・行末の空白は外す）。無ければ '' */
export function envの値(中身, 名) {
  for (const 行 of String(中身)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)) {
    if (行.startsWith(名 + '=')) return 行.slice(名.length + 1).trim();
  }
  return '';
}

function 分ける(中身) {
  const s = String(中身);
  const BOM = s.startsWith('\uFEFF') ? '\uFEFF' : '';
  const 本文 = BOM ? s.slice(1) : s;
  return { BOM, 改行: 本文.includes('\r\n') ? '\r\n' : '\n', 行: 本文.split(/\r?\n/) };
}

/** 名=値 の行を置く（あれば書き換え、無ければ最後に足す）。BOM と改行の形（CRLF か LF）は元のまま */
export function envの行を置く(中身, 名, 値) {
  const { BOM, 改行, 行 } = 分ける(中身);
  const i = 行.findIndex((l) => l.startsWith(名 + '='));
  if (i >= 0) 行[i] = `${名}=${値}`;
  else {
    const 末 = 行.length > 0 && 行[行.length - 1] === '' ? 行.length - 1 : 行.length;
    行.splice(末, 0, `${名}=${値}`);
  }
  return BOM + 行.join(改行);
}

/** 名= の行を消す */
export function envの行を消す(中身, 名) {
  const { BOM, 改行, 行 } = 分ける(中身);
  return BOM + 行.filter((l) => !l.startsWith(名 + '=')).join(改行);
}

/** GitHub の Secrets の STG_ENV に入れる中身（.github/workflows/e2e.yml：EXPO_PUBLIC_ の行と STG_TEST_PASSWORD の行だけ） */
export function STG_ENVの中身(中身) {
  const 行 = String(中身)
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => /^(EXPO_PUBLIC_|STG_TEST_PASSWORD=)/.test(l));
  return 行.join('\n') + '\n';
}

/** エミュレーターの控えの口座のうち、パスワードが 前 のものを 新 にする（控えを書き換える）。替えた数を返す */
export function エミュの口座を替える(控え, 前, 新) {
  let 数 = 0;
  for (const u of (控え && 控え.users) || []) {
    const h = String(u.passwordHash || '');
    const i = h.indexOf(パスワードの印);
    if (h.startsWith('fakeHash') && i >= 0 && h.slice(i + パスワードの印.length) === 前) {
      u.passwordHash = h.slice(0, i + パスワードの印.length) + 新;
      数++;
    }
  }
  return 数;
}

const 待つ = (ms) => new Promise((r) => setTimeout(r, ms));

/** firebase-tools のログイン情報から access_token を取る（scripts/emu-seed.mjs と同じ手口） */
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
  if (!j.access_token)
    throw new Error('Firebase CLI のログインが切れています。`firebase login` で入り直してから流してください');
  return j.access_token;
}

/** 検証環境のメールとパスワードの口座（匿名は除く） */
async function メールの口座(札) {
  const 全部 = [];
  let 次 = '';
  do {
    const u = new URL(`https://identitytoolkit.googleapis.com/v1/projects/${企画}/accounts:batchGet`);
    u.searchParams.set('maxResults', '500');
    if (次) u.searchParams.set('nextPageToken', 次);
    const r = await fetch(u, { headers: { Authorization: `Bearer ${札}`, 'X-Goog-User-Project': 企画 } });
    const j = await r.json();
    if (!r.ok) throw new Error(`口座の一覧を読めない ${r.status} ${(j.error && j.error.message) || ''}`);
    全部.push(...(j.users || []));
    次 = j.nextPageToken || '';
  } while (次);
  return 全部.filter(
    (u) => u.email && (u.passwordHash || (u.providerUserInfo || []).some((p) => p.providerId === 'password'))
  );
}

/** そのパスワードで入れるか（アプリと同じ道。トークンは使わない） */
async function 入れるか(鍵, email, password) {
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(鍵)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    }
  );
  if (r.ok) return { ok: true };
  const j = await r.json().catch(() => ({}));
  const 訳 = String((j.error && j.error.message) || r.status);
  if (/TOO_MANY_ATTEMPTS/.test(訳))
    throw new Error('検証環境に「試しすぎ」で止められた。しばらく（1 時間ほど）待ってから流し直してください');
  return { ok: false, 訳 };
}

/** 渡した口座のうち、そのパスワードで入れるもの */
async function 入れる口座(鍵, 口座, password) {
  const 出 = [];
  for (const u of 口座) {
    if ((await 入れるか(鍵, u.email, password)).ok) 出.push(u);
    await 待つ(150);
  }
  return 出;
}

function ghで秘密を置く(中身) {
  for (const 名 of process.platform === 'win32' ? ['gh', 'gh.exe'] : ['gh']) {
    const r = spawnSync(名, ['secret', 'set', 'STG_ENV', '-R', 倉庫], { input: 中身, encoding: 'utf8' });
    if (r.error && r.error.code === 'ENOENT') continue;
    return {
      ok: r.status === 0,
      訳: String(r.stderr || (r.error && r.error.message) || '')
        .trim()
        .slice(0, 200),
    };
  }
  return { ok: false, 訳: 'gh が見つからない' };
}

async function 本体() {
  const 替える = process.argv.includes('替える');
  if (!fs.existsSync(envの道))
    throw new Error('.env.development.local がありません（app の直下に置いてから流してください）');
  let 中身 = fs.readFileSync(envの道, 'utf8');
  const env企画 = envの値(中身, 'EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  if (env企画 !== 企画)
    throw new Error(
      `.env.development.local の企画が ${企画} ではありません。本番の設定を書き換えないよう止めました`
    );
  const 鍵 = envの値(中身, 'EXPO_PUBLIC_FIREBASE_API_KEY');
  const 控えた前 = envの値(中身, 'STG_TEST_PASSWORD_OLD');
  const 今 = envの値(中身, 'STG_TEST_PASSWORD');
  const 前 = 控えた前 || 今;
  if (!鍵 || !前)
    throw new Error(
      '.env.development.local に EXPO_PUBLIC_FIREBASE_API_KEY と STG_TEST_PASSWORD の行が要ります'
    );
  const 続き = !!控えた前;

  const 札 = await 合鍵を取る();
  const 口座 = await メールの口座(札);
  const 前で入れる = await 入れる口座(鍵, 口座, 前);
  console.log(
    `検証環境のメールとパスワードの口座 ${口座.length} 件のうち、前のパスワードで入れるのは ${前で入れる.length} 件`
  );
  if (続き) console.log('（前に「替える」が途中で止まっている。続きから流す）');
  if (!替える) {
    console.log('見るだけで、何も替えていません。替えるときは: node scripts/stg-change-password.mjs 替える');
    return;
  }

  // 1. 新しいパスワードを決めて .env.development.local に書く（前の値は STG_TEST_PASSWORD_OLD に控える）
  const 新 = 続き ? 今 : 新しいパスワードを作る();
  if (!続き) {
    中身 = envの行を置く(中身, 'STG_TEST_PASSWORD_OLD', 前);
    中身 = envの行を置く(中身, 'STG_TEST_PASSWORD', 新);
    fs.writeFileSync(envの道, 中身, 'utf8');
  }
  console.log('1. .env.development.local に新しいパスワードを書いた（画面には出さない）');

  // 2. 前のパスワードで入れる口座を、新しいパスワードに替える
  const 失敗 = [];
  for (const u of 前で入れる) {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${企画}/accounts:update`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${札}`,
        'X-Goog-User-Project': 企画,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ localId: u.localId, password: 新 }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      失敗.push(`${u.email}（${r.status} ${(j.error && j.error.message) || ''}）`);
    }
  }
  console.log(`2. ${前で入れる.length - 失敗.length}/${前で入れる.length} 件を替えた`);

  // 3. 新しいパスワードで入れて、前のパスワードでは入れないことを確かめる
  const 新で入れる = await 入れる口座(鍵, 前で入れる, 新);
  const まだ前で入れる = await 入れる口座(鍵, 前で入れる, 前);
  console.log(
    `3. 新しいパスワードで入れる ${新で入れる.length}/${前で入れる.length} 件・前のパスワードで入れる ${まだ前で入れる.length} 件`
  );
  if (失敗.length || 新で入れる.length !== 前で入れる.length || まだ前で入れる.length) {
    for (const f of 失敗) console.log('   替えられなかった:', f);
    console.log(
      '替えきれていません。もう一度 `node scripts/stg-change-password.mjs 替える` で流すと続きから進みます（STG_TEST_PASSWORD_OLD は残してあります）'
    );
    process.exitCode = 1;
    return;
  }

  // 4. GitHub の Secrets の STG_ENV（E2E が使う）
  const 秘密 = ghで秘密を置く(STG_ENVの中身(中身));
  if (秘密.ok) console.log('4. GitHub の Secrets の STG_ENV を新しい中身にした');
  else {
    console.log(`4. GitHub の Secrets を置けなかった（${秘密.訳}）。PowerShell で次を流してください:`);
    console.log(
      "   Get-Content -Encoding UTF8 .env.development.local | Where-Object { $_ -match '^(EXPO_PUBLIC_|STG_TEST_PASSWORD=)' } | gh secret set STG_ENV"
    );
  }

  // 5. 手元のエミュレーターの控え
  if (fs.existsSync(エミュの道)) {
    const 控え = JSON.parse(fs.readFileSync(エミュの道, 'utf8'));
    const 数 = エミュの口座を替える(控え, 前, 新);
    fs.writeFileSync(エミュの道, JSON.stringify(控え), 'utf8');
    console.log(`5. エミュレーターの控えの口座 ${数} 件を新しいパスワードにした`);
  } else console.log('5. エミュレーターの控えは無い（npm run emu:seed で作るときに新しいパスワードが入る）');

  // 6. 前の値の控えを消す
  fs.writeFileSync(envの道, envの行を消す(fs.readFileSync(envの道, 'utf8'), 'STG_TEST_PASSWORD_OLD'), 'utf8');
  console.log('6. 前の値の控え（STG_TEST_PASSWORD_OLD）を消した');
  console.log(
    '済み。ほかの PC で E2E や検証の台本を流すなら、その PC の .env.development.local の STG_TEST_PASSWORD も新しい値にしてください'
  );
  console.log('（値はこの PC の .env.development.local にあります。画面には出していません）');
}

const 直に呼ばれた =
  !!process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href.toLowerCase() === import.meta.url.toLowerCase();
if (直に呼ばれた) {
  本体().catch((e) => {
    console.error('止めた:', e && e.message ? e.message : e);
    process.exitCode = 1;
  });
}
