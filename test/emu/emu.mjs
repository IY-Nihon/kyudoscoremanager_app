// 決まり（firestore.rules・database.rules.json）を模擬環境（Firebase の emulator）で確かめるための道具。
//
// npm run test:rules（firebase emulators:exec が Firestore と Realtime Database の模擬環境を立てて、test/emu を流す）。
// 手元で模擬環境をもう立てているときは、FIRESTORE_EMULATOR_HOST・FIREBASE_DATABASE_EMULATOR_HOST を置いて
// node --test test/emu/ でも流せる。
//
// 雲の SDK は使わず、REST で送る（速く、余計な接続を持たない）。ログインの証は模擬環境が受ける署名なしの JWT。
// 決まりを通さずに用意したいもの（団体の帳面など）は Authorization: Bearer owner で書く（模擬環境だけの抜け道）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const 企画 = process.env.GCLOUD_PROJECT || 'demo-kyudo';
const 宛先 = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const 根 = `http://${宛先}/v1/projects/${企画}/databases/(default)/documents`;
const 倉庫 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const b64 = (値) => Buffer.from(JSON.stringify(値)).toString('base64url');

/**
 * ログインの証。人: { uid, email?, verified? }（email が無ければ匿名）
 */
export function 証(人) {
  if (!人) return null;
  if (人 === 'owner') return 'owner';
  const 今 = Math.floor(Date.now() / 1000);
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
    iss: `https://securetoken.google.com/${企画}`,
    aud: 企画,
    iat: 今,
    exp: 今 + 3600,
    auth_time: 今,
    sub: 人.uid,
    user_id: 人.uid,
    ...(人.email ? { email: 人.email, email_verified: !!人.verified } : {}),
    firebase: { sign_in_provider: 人.email ? 'password' : 'anonymous', identities: {} },
  })}.`;
}

function 値に(値) {
  if (値 === null || 値 === undefined) return { nullValue: null };
  if (typeof 値 === 'boolean') return { booleanValue: 値 };
  if (typeof 値 === 'number') return Number.isInteger(値) ? { integerValue: String(値) } : { doubleValue: 値 };
  if (typeof 値 === 'string') return { stringValue: 値 };
  if (値 instanceof Date) return { timestampValue: 値.toISOString() };
  if (Array.isArray(値)) return { arrayValue: { values: 値.map(値に) } };
  return { mapValue: { fields: 欄に(値) } };
}
const 欄に = (中身) => Object.fromEntries(Object.entries(中身).map(([鍵, 値]) => [鍵, 値に(値)]));

async function 送る(人, 道, 頼み = {}) {
  const 札 = 証(人);
  const 返り = await fetch(道, {
    ...頼み,
    headers: { 'Content-Type': 'application/json', ...(札 ? { Authorization: `Bearer ${札}` } : {}) },
  });
  const 字 = await 返り.text();
  return { 通った: 返り.ok, 状態: 返り.status, 中身: 字 ? JSON.parse(字) : null };
}

/** 文書を置く（setDoc）。merge なら、渡した欄だけ書き換える（setDoc の merge と同じ） */
export function 書く(人, 道, 中身, { merge = false } = {}) {
  const 印 = merge ? '?' + Object.keys(中身).map((鍵) => `updateMask.fieldPaths=${encodeURIComponent('`' + 鍵 + '`')}`).join('&') : '';
  return 送る(人, `${根}/${道}${印}`, { method: 'PATCH', body: JSON.stringify({ fields: 欄に(中身) }) });
}

/** 文書を作る（もうあれば断られる。addDoc・作るだけの書き込み） */
export function 作る(人, 道, 中身) {
  return 送る(人, `${根}/${道}?currentDocument.exists=false`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: 欄に(中身) }),
  });
}

/** 文書を直す（あるときだけ。updateDoc と同じ） */
export function 直す(人, 道, 中身) {
  const 印 = Object.keys(中身).map((鍵) => `updateMask.fieldPaths=${encodeURIComponent('`' + 鍵 + '`')}`).join('&');
  return 送る(人, `${根}/${道}?currentDocument.exists=true&${印}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: 欄に(中身) }),
  });
}

/** 欄を消す（updateDoc の deleteField） */
export function 欄を消す(人, 道, 鍵たち) {
  const 印 = 鍵たち.map((鍵) => `updateMask.fieldPaths=${encodeURIComponent('`' + 鍵 + '`')}`).join('&');
  return 送る(人, `${根}/${道}?currentDocument.exists=true&${印}`, { method: 'PATCH', body: JSON.stringify({ fields: {} }) });
}

export const 読む = (人, 道) => 送る(人, `${根}/${道}`);
export const 消す = (人, 道) => 送る(人, `${根}/${道}`, { method: 'DELETE' });

/** 集まりを、欄が値と同じもので絞って引く（where(欄, '==', 値)） */
export function 絞って引く(人, 親の道, 集まり, 欄, 値) {
  const 親 = 親の道 ? `${根}/${親の道}` : 根;
  return 送る(人, `${親}:runQuery`, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 集まり }],
        where: { fieldFilter: { field: { fieldPath: 欄 }, op: 'EQUAL', value: 値に(値) } },
      },
    }),
  }).then((返り) => ({ ...返り, 通った: 返り.通った && !(Array.isArray(返り.中身) && 返り.中身.some((一つ) => 一つ.error)) }));
}

/** 中身を全部消す（検査のたびに初めから） */
export async function 片付ける() {
  const 返り = await fetch(`http://${宛先}/emulator/v1/projects/${企画}/databases/(default)/documents`, { method: 'DELETE' });
  if (!返り.ok) throw new Error(`模擬環境を片付けられません（${返り.status}）。模擬環境は立っていますか: ${宛先}`);
}

/** 倉庫の決まりを読む。直し（[前, 後] の並び）を当てて、日付の違う形も試せる */
export function 決まりの字(直し = []) {
  let 字 = readFileSync(path.join(倉庫, 'firestore.rules'), 'utf8');
  for (const [前, 後] of 直し) {
    if (!字.includes(前)) throw new Error(`決まりに「${前}」がありません`);
    字 = 字.split(前).join(後);
  }
  return 字;
}

/** 決まりを模擬環境へ置く */
export async function 決まりを置く(字 = 決まりの字()) {
  const 返り = await fetch(`http://${宛先}/emulator/v1/projects/${企画}:securityRules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: 字 }] } }),
  });
  if (!返り.ok) throw new Error(`決まりを置けません（${返り.status}）: ${await 返り.text()}`);
}

/** 猶予（11/10）と 4 桁の終わり（12/3）を過ぎたあとの決まり */
export const 猶予のあとの決まり = () =>
  決まりの字([
    ['timestamp.date(2026, 11, 10)', 'timestamp.date(2000, 1, 1)'],
    ['timestamp.date(2026, 12, 3)', 'timestamp.date(2000, 1, 1)'],
  ]);
