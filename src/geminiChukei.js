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
 * ■ 証
 *   団体は email/password、部員は匿名の sign-in で、どちらも currentUser を持つ。
 *   ID トークンは1時間で切れるが getIdToken() が要るときだけ取り直す（毎回呼んで
 *   よい。手元に生きた証があればそれを返す）。
 */
'use strict';

const 中継のURL = String(process.env.EXPO_PUBLIC_GEMINI_CHUKEI_URL || '')
  .trim()
  .replace(/\/+$/, '');

/** 中継の宛先が設定されているか（無ければ AI 機能は使えない） */
const 中継がある = () => !!中継のURL;

/** いまログインしている人の証。ログインしていなければ null */
async function ログインの証() {
  let auth;
  try {
    auth = require('./db').auth;
  } catch (e) {
    return null;
  }
  const 人 = auth && auth.currentUser;
  if (!人 || typeof 人.getIdToken !== 'function') return null;
  try {
    return await 人.getIdToken();
  } catch (e) {
    return null;
  }
}

/** SDK の getGenerativeModel / sendMessage に渡す requestOptions */
async function SDKの設定() {
  if (!中継がある()) throw new Error('AI機能の設定（中継の宛先）が見つかりません。管理者にご確認ください。');
  const 証 = await ログインの証();
  if (!証) throw new Error('ログインしていないため、AI機能を使えません。');
  return { baseUrl: 中継のURL, customHeaders: { Authorization: 'Bearer ' + 証 } };
}

/**
 * 中継へ fetch する。道は Gemini の REST と同じ（/v1beta/models/… ）。
 * 中継が受けるのは一覧と generateContent（と流し読み）だけ
 */
async function 中継へfetch(道, init) {
  if (!中継がある()) throw new Error('AI機能の設定（中継の宛先）が見つかりません。管理者にご確認ください。');
  const 証 = await ログインの証();
  if (!証) throw new Error('ログインしていないため、AI機能を使えません。');
  const 頭 = new Headers((init && init.headers) || {});
  頭.set('Authorization', 'Bearer ' + 証);
  return fetch(中継のURL + (道.startsWith('/') ? 道 : '/' + 道), { ...(init || {}), headers: 頭 });
}

module.exports = { 中継のURL, 中継がある, ログインの証, SDKの設定, 中継へfetch };
