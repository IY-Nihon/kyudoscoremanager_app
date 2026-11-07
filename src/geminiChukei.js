/**
 * Gemini の中継への出入口。
 *
 * ■ なぜ
 *   Gemini の鍵をアプリに持たせると、配った束から鍵が抜ける（Expo は
 *   EXPO_PUBLIC_ の値を束に焼き込む）。鍵は中継（Cloudflare Workers、
 *   別フォルダー kyudo-chukei）の secret にだけ置き、アプリは Firebase の
 *   ログインの証（ID トークン）を付けて中継を呼ぶ。中継が証を確かめてから
 *   鍵を付けて Gemini へ流す。
 *
 * ■ 使い方
 *   ・SDK（@google/generative-ai）… getGenerativeModel(params, await SDKの設定())
 *     baseUrl を中継に向け、Authorization を足す。鍵の引数は飾り（中継が付け替える）
 *   ・fetch で直接 … 中継へfetch('/v1beta/models/gemini-3.6-flash:generateContent', { … })
 *
 * ■ 添えるもの（2026-11-04）
 *   ・X-Kyudo-Group … 入っている団体。中継はその人の証で groups/{団体} を 1 回読むだけで、通してよいかを決める
 *     （前は米国の Firestore を 2 回続けて読んでいた）
 *   ・X-Firebase-AppCheck … App Check の印。中継が数える（強制は中継の APPCHECK_MODE）。取れなければ付けない
 *
 * ■ 証
 *   団体は email/password、部員は匿名の sign-in で、どちらも currentUser を持つ。
 *   ID トークンは1時間で切れるが getIdToken() が要るときだけ取り直す（毎回呼んで
 *   よい。手元に生きた証があればそれを返す）。それでも中継が 401（証が正しくない・切れている）を
 *   返したら、中継へfetch は証を取り直して 1 回だけ送り直す（端末の時計のずれ・切れる間際に取った証）。
 *   ほかの断り（502・通信の誤りなど）は送り直さない。中継が模型を替えながら待つので、重ねると枠を使い切る
 */
'use strict';

const 中継のURL = String(process.env.EXPO_PUBLIC_GEMINI_CHUKEI_URL || '')
  .trim()
  .replace(/\/+$/, '');

/** 中継の宛先が設定されているか（無ければ AI 機能は使えない） */
const 中継がある = () => !!中継のURL;

/** いまログインしている人の証。ログインしていなければ null。取り直す … 手元の証を使わず取り直す */
async function ログインの証(取り直す = false) {
  let auth;
  try {
    auth = require('./db').auth;
  } catch {
    return null;
  }
  // 開いてすぐは、ログインの復元（端末の控えから読む）が終わっておらず currentUser が空のことがある。
  // そのまま断ると、ログインしているのに「ログインし直して」と出る（E2E で開いてすぐ送ると、ときどき落ちていた。
  // 2026-10-05）。復元が終わるのを待ってから（長くても 5 秒）、もう一度見る
  if (auth && !auth.currentUser && typeof auth.authStateReady === 'function') {
    try {
      await Promise.race([auth.authStateReady(), new Promise((r) => setTimeout(r, 5000))]);
    } catch {
      // 待てなければ、そのまま見る
    }
  }
  const 人 = auth && auth.currentUser;
  if (!人 || typeof 人.getIdToken !== 'function') return null;
  try {
    return await 人.getIdToken(取り直す);
  } catch {
    return null;
  }
}

/** 入っている団体（groups の鍵）。中継が通してよいかを 1 回で決めるのに使う */
function 入っている団体() {
  try {
    const 団体 = require('./useScoreStore').useScoreStore.getState().activeGroupId;
    return typeof 団体 === 'string' && /^[0-9A-Za-z_-]{1,64}$/.test(団体) ? 団体 : '';
  } catch {
    return '';
  }
}

/**
 * App Check の印。取れなければ空（中継は数えるだけ。強制していれば中継が断る）。
 * 印は SDK が控えていて、切れる前に取り直している（待つのは 3 秒まで）
 */
async function AppCheckの印() {
  try {
    const 器 = require('./db').appCheck;
    if (!器) return '';
    const { getToken } = require('firebase/app-check');
    const 返り = await Promise.race([getToken(器, false), new Promise((解く) => setTimeout(() => 解く(null), 3000))]);
    return (返り && 返り.token) || '';
  } catch {
    return '';
  }
}

/** 中継へ添える見出し（証のほか） */
async function 添える見出し() {
  const 団体 = 入っている団体();
  const 印 = await AppCheckの印();
  return { ...(団体 ? { 'X-Kyudo-Group': 団体 } : {}), ...(印 ? { 'X-Firebase-AppCheck': 印 } : {}) };
}

/** SDK の getGenerativeModel / sendMessage に渡す requestOptions */
async function SDKの設定() {
  if (!中継がある()) throw new Error('AI機能の設定（中継の宛先）が見つかりません。管理者にご確認ください。');
  const [証, 見出し] = await Promise.all([ログインの証(), 添える見出し()]);
  if (!証) throw new Error('ログインしていないため、AI機能を使えません。');
  return { baseUrl: 中継のURL, customHeaders: { Authorization: 'Bearer ' + 証, ...見出し } };
}

/**
 * 中継へ fetch する。道は Gemini の REST と同じ（/v1beta/models/… ）。
 * 中継が受けるのは一覧と generateContent（と流し読み）だけ
 */
async function 中継へfetch(道, init) {
  if (!中継がある()) throw new Error('AI機能の設定（中継の宛先）が見つかりません。管理者にご確認ください。');
  const [証, 見出し] = await Promise.all([ログインの証(), 添える見出し()]);
  if (!証) throw new Error('ログインしていないため、AI機能を使えません。');
  const 送る = (今の証) => {
    const 頭 = new Headers((init && init.headers) || {});
    for (const [鍵, 値] of Object.entries(見出し)) if (!頭.has(鍵)) 頭.set(鍵, 値);
    頭.set('Authorization', 'Bearer ' + 今の証);
    return fetch(中継のURL + (道.startsWith('/') ? 道 : '/' + 道), { ...(init || {}), headers: 頭 });
  };
  const 返り = await 送る(証);
  // 証が切れていた。取り直して 1 回だけ送り直す（同じ証しか取れなければ、送り直しても同じなので返す）
  if (返り && 返り.status === 401) {
    const 新しい証 = await ログインの証(true);
    if (新しい証 && 新しい証 !== 証) return 送る(新しい証);
  }
  return 返り;
}

module.exports = { 中継のURL, 中継がある, ログインの証, SDKの設定, 中継へfetch, 添える見出し };
