/**
 * 手元のエミュレーターで E2E を流すときの、中継（kyudo-chukei）の代わり（2026-11-08）。
 *
 *   node scripts/emu-chukei.mjs        （npm run e2e:emu が立てる。港 8788）
 *
 * 部員のログイン（POST /kojin）は、中継の本物の手（../chukei/src/kojin.mjs の 部員を確かめる）をそのまま使う。
 * 違うのは宛先だけ：Firestore はエミュレーター（Bearer owner で決まりを通らずに読み書きする）、
 * サービスアカウントの証は取りに行かない（その場で作った鍵で署名し、取りに行く先を横取りして owner を返す）。
 * ログインの証（ID トークン）は、エミュレーターのものは署名が無いので中身だけ読む。
 *
 * AI（Gemini）は流さない（503 を返す。AI の E2E は検証環境で流す）。回数の上限も掛けない。
 * 中継の倉庫は ../chukei に置く（CHUKEI_DIR で替えられる）。
 */
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const 港 = Number(process.env.EMU_CHUKEI_PORT || 8788);
const Firestoreの宛先 = `http://127.0.0.1:${process.env.EMU_FIRESTORE_PORT || 8080}`;
const 中継の場所 = path.resolve(process.env.CHUKEI_DIR || '../chukei');
const { 部員を確かめる } = await import(pathToFileURL(path.join(中継の場所, 'src', 'kojin.mjs')).href);
const { 管理者を確かめる } = await import(pathToFileURL(path.join(中継の場所, 'src', 'kanri.mjs')).href);
/** 管理者の合言葉の置き場（本物は D1。ここは中継の代わりが生きている間だけ） */
const 合言葉の表 = new Map();
const 合言葉の置き場 = {
  読む: (鍵) => Promise.resolve(合言葉の表.has(鍵) ? structuredClone(合言葉の表.get(鍵)) : null),
  書く: (鍵, 値) => Promise.resolve(void 合言葉の表.set(鍵, 値)),
};

// サービスアカウントの代わり（署名ができればよい。鍵は毎回作り捨てる）
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const 偽の鍵 = {
  type: 'service_account',
  client_email: 'emu@emulator.invalid',
  private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
};

/** 本物の宛先をエミュレーターへ向け直す fetch */
const 送る = (宛先, 頼み = {}) => {
  const 道 = String(宛先);
  if (道.startsWith('https://oauth2.googleapis.com/') || 道.startsWith('https://www.googleapis.com/oauth2/'))
    return Promise.resolve(
      new Response(JSON.stringify({ access_token: 'owner', expires_in: 3600 }), { status: 200 })
    );
  const 向け直し = 道.replace('https://firestore.googleapis.com', Firestoreの宛先);
  // 管理者の合言葉（/kanri）が持ち主かを確かめる読み（団体の private）は、呼んだ人の証のまま送る（決まりで確かめる）
  const 本人の証のまま = 道.includes('/private/');
  const 頭 = 本人の証のまま
    ? Object.assign({}, 頼み.headers || {})
    : Object.assign({}, 頼み.headers || {}, { Authorization: 'Bearer owner' });
  return fetch(向け直し, Object.assign({}, 頼み, { headers: 頭 }));
};

/** エミュレーターの ID トークン（署名なし）の中身を読む */
function 証を読む(見出し) {
  const 証 = String(見出し || '').replace(/^Bearer\s+/i, '');
  const 部 = 証.split('.');
  if (部.length < 2) return null;
  try {
    const 中身 = JSON.parse(
      Buffer.from(部[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );
    return 中身 && 中身.aud && (中身.sub || 中身.user_id) ? Object.assign({ sub: 中身.user_id }, 中身) : null;
  } catch {
    return null;
  }
}

const 頭 = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, x-goog-api-key, x-goog-api-client, X-Kyudo-No-Chain, X-Kyudo-Group, X-Firebase-AppCheck',
  'Content-Type': 'application/json; charset=utf-8',
};

http
  .createServer(async (受, 返) => {
    const 答える = (状態, 中身) => {
      返.writeHead(状態, 頭);
      返.end(JSON.stringify(中身));
    };
    if (受.method === 'OPTIONS') return 答える(204, {});
    const 道 = (受.url || '').split('?')[0];
    if (道 !== '/kojin' && 道 !== '/kanri')
      return 答える(503, { error: 'エミュレーターでは AI を使えません（検証環境で試してください）' });
    const 本人 = 証を読む(受.headers.authorization);
    if (!本人) return 答える(401, { error: 'ログインの証がありません' });
    let 体 = '';
    for await (const かけら of 受) 体 += かけら;
    const 頼み = new Request('http://emu' + 道, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 体,
    });
    try {
      if (道 === '/kanri') {
        const 証 = String(受.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const { 状態, 中身 } = await 管理者を確かめる(
          頼み,
          { FIREBASE_SA_KEYS: JSON.stringify({ [本人.aud]: 偽の鍵 }) },
          本人,
          証,
          { 送る, 置き場: 合言葉の置き場 }
        );
        return 答える(状態, 中身);
      }
      const { 状態, 中身 } = await 部員を確かめる(
        頼み,
        { FIREBASE_SA_KEYS: JSON.stringify({ [本人.aud]: 偽の鍵 }) },
        本人,
        { 送る, 回数に収まるか: () => Promise.resolve(true) }
      );
      答える(状態, 中身);
    } catch (誤り) {
      console.error('[emu-chukei]', 誤り);
      答える(503, { error: 'いまは確かめられません。少し待ってからお試しください' });
    }
  })
  .listen(港, '127.0.0.1', () =>
    console.log(`[emu-chukei] http://127.0.0.1:${港} で待っています（/kojin・/kanri）`)
  );
