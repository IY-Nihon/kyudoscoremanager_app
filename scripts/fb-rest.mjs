/**
 * Firebase の REST クライアント（検証・移行スクリプト共通）。
 *
 * ブラウザや Admin SDK を使わず、公開APIキーと Identity Toolkit だけで
 * 実際のクライアントと同じ経路を再現する。ルールはクライアント経由でしか
 * 効かないため、検証は必ずこの経路で行う必要がある。
 */
import fs from 'node:fs';

/** .env 形式のファイルを読む */
export function readEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

export function configFor(target) {
  const env = target === 'stg' ? readEnv('.env.development.local') : readEnv('.env');
  return {
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
    projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  };
}

const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts';

/** メール/パスワードでサインイン。無ければ作る */
export async function signIn(apiKey, email, password, { create = false } = {}) {
  const call = async (op, body) => {
    const r = await fetch(`${IDT}:${op}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    });
    return { ok: r.ok, status: r.status, json: await r.json() };
  };
  let res = await call('signInWithPassword', { email, password });
  if (!res.ok && create) {
    const made = await call('signUp', { email, password });
    if (!made.ok) throw new Error(`${email} の作成に失敗: ${JSON.stringify(made.json)}`);
    return made.json.idToken;
  }
  if (!res.ok) throw new Error(`${email} のサインインに失敗: ${JSON.stringify(res.json)}`);
  return res.json.idToken;
}

/** 匿名サインイン。部員セッションの再現に使う */
export async function signInAnonymously(apiKey) {
  const r = await fetch(`${IDT}:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`匿名サインインに失敗: ${JSON.stringify(j)}`);
  return { idToken: j.idToken, uid: j.localId };
}

const base = (projectId) =>
  `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

/** JS の値を Firestore REST の型付き値へ */
export function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v)
    ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') return { mapValue: { fields: toFields(v) } };
  return { stringValue: String(v) };
}
export const toFields = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]));

/** Firestore REST の型付き値を JS の値へ */
export function fromValue(v) {
  if (!v) return undefined;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return fromFields(v.mapValue.fields || {});
  return undefined;
}
export const fromFields = (f) =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, fromValue(v)]));

/** 生のリクエスト。ステータスだけ見たい検証用に body も返す */
export async function req(projectId, path, { token, method = 'GET', body, query = '' } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${base(projectId)}${path}${query}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await r.json(); } catch { /* 本文なしは無視 */ }
  return { status: r.status, json };
}

/** ドキュメントを作る/上書きする */
export const setDoc = (projectId, path, data, token) =>
  req(projectId, path, { token, method: 'PATCH', body: { fields: toFields(data) } });

/** コレクションを全件取得（ページング対応） */
export async function listAll(projectId, path, token, mask) {
  const docs = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ pageSize: '300' });
    if (pageToken) q.set('pageToken', pageToken);
    if (mask) for (const f of mask) q.append('mask.fieldPaths', f);
    const { status, json } = await req(projectId, path, { token, query: '?' + q });
    if (status !== 200) throw new Error(`${path} の取得に失敗 (HTTP ${status}): ${JSON.stringify(json)}`);
    (json.documents || []).forEach((d) =>
      docs.push({ id: d.name.split('/').pop(), data: fromFields(d.fields || {}) }));
    pageToken = json.nextPageToken || '';
  } while (pageToken);
  return docs;
}
