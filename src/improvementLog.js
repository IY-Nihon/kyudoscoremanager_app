/**
 * アプリの改善のための保存。
 *
 * 使う人が AI に送ったものと、AI の答え・読み取りの結果を、中継の /hozon へ送る。中継が
 * Cloudflare の D1（文字）と KV（写真・PDF）に 1 年だけ置く（kyudo-chukei の src/hozon.mjs）。
 * 2026-09-26 に運用者が決めた（AI チャットの質問と答え・写真読み取りの結果と直しと写真・
 * 出欠の予定表の読み取り）。プライバシーポリシー第12条に書いてある。
 *
 * 送れなくても、使う人の操作は止めない（待たせない・知らせない・黙って捨てる）。
 * 呼ぶ側も待たずに投げっぱなしにしてよい（中の失敗はここで受け止める）。
 */
'use strict';

const 中継 = require('./geminiChukei');

/** 写真・PDF の 1 つあたりの上限（中継と同じ） */
const 添付の上限 = 5 * 1024 * 1024;
/** 1 件に付ける写真・PDF の数の上限 */
const 添付の数の上限 = 5;

/** 記録の id（UUID）。写真を同じ記録に付けるために、こちらで決める */
function 新しいid() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** いまの団体と役割（中身に添える。どの団体のどんな使い方かを見るため） */
function いまの様子() {
  try {
    const s = require('./useScoreStore').useScoreStore.getState();
    return { 団体: s.activeGroupId || '', 役割: s.activeRole || '' };
  } catch {
    return {};
  }
}

/** 中継が受ける 1 件の文字の上限（256KB。kyudo-chukei の hozon.mjs）より少し小さく */
const 文字の上限 = 240 * 1024;

/** JSON にしたときの大きさ（バイト）。日本語は 1 字 3 バイトになる */
function 大きさ(値) {
  try {
    const 字 = JSON.stringify(値) || '';
    return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(字).length : 字.length * 3;
  } catch {
    return Infinity;
  }
}

/**
 * ログに入れる値を、JSON にして 上限 字までに切る（道具の引数・返事・図など、大きくなりうるもの）。
 * 収まればそのまま返す。収まらなければ先頭だけの字にして、切ったことと元の字数を残す
 */
function 小さくする(値, 上限 = 8000) {
  let 字;
  try {
    字 = JSON.stringify(値);
  } catch {
    return '（JSON にできない値）';
  }
  if (字 === undefined) return null;
  if (字.length <= 上限) return 値;
  return { 切った: true, 字数: 字.length, 先頭: 字.slice(0, 上限) };
}

/** 大きくなりやすい順。上限を越えたら、この順に省く（答えと質問は最後まで残す） */
const 省く順 = ['道具の返事', '図', '道具の引数', '元の読み取り', '読み取り'];

/** 1 件を中継が受ける大きさに収める（越えたら大きいものから省き、それでも越えたら文を切る） */
function 収める(中身) {
  if (大きさ(中身) <= 文字の上限) return 中身;
  const 写し = Object.assign({}, 中身);
  for (const 鍵 of 省く順) {
    if (!(鍵 in 写し)) continue;
    写し[鍵] = '（大きすぎて省いた）';
    if (大きさ(写し) <= 文字の上限) return 写し;
  }
  for (const 鍵 of Object.keys(写し)) {
    if (typeof 写し[鍵] === 'string' && 写し[鍵].length > 4000) 写し[鍵] = 写し[鍵].slice(0, 4000) + '…（切った）';
  }
  return 大きさ(写し) <= 文字の上限 ? 写し : { 省いた: true, 種類の印: Object.keys(中身).slice(0, 20) };
}

/**
 * 1 件送る。
 * @param {'チャット'|'写真読み取り'|'予定表'} 種類
 * @param {object} 中身 文字の記録（JSON にできるもの）
 * @param {Array<Blob|null>} [添付たち] 写真・PDF（Blob）。5 つまで、1 つ 5MB まで
 * @param {string} [id] 記録の id。あとから送る記録（反映したときの直したあと）から指すときに、先に決めて渡す
 * @returns {Promise<string|null>} 置けたらその id、置けなければ null
 */
async function 改善のために取っておく(種類, 中身, 添付たち = [], id = 新しいid()) {
  try {
    if (!中継.中継がある()) return null;
    const 返り = await 中継.中継へfetch('/hozon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, 種類, 中身: 収める(Object.assign(いまの様子(), 中身)) }),
    });
    if (!返り.ok) return null;
    const 付ける = (添付たち || [])
      .filter((体) => 体 && 体.size > 0 && 体.size <= 添付の上限)
      .slice(0, 添付の数の上限);
    for (let 番 = 0; 番 < 付ける.length; 番++) {
      const 体 = 付ける[番];
      await 中継
        .中継へfetch(`/hozon/photo/${id}/${番}`, {
          method: 'PUT',
          headers: { 'Content-Type': 体.type || 'image/jpeg' },
          body: 体,
        })
        .catch(() => {});
    }
    return id;
  } catch (誤り) {
    console.warn('[改善の保存] 送れませんでした', 誤り && 誤り.message);
    return null;
  }
}

/** base64 を Blob に（PDF など、縮めずに送るもの）。できなければ null */
async function base64をBlobに(base64, 型) {
  try {
    return await (await fetch(`data:${型};base64,${base64}`)).blob();
  } catch {
    return null;
  }
}

/**
 * base64 の写真を、長い辺 1600px の JPEG（Blob）に縮める。web だけ（canvas を使う）。
 * 読み取りに使った写真はそのままだと数 MB あり、1 年ぶんの置き場（KV 1GB）をすぐ使い切るため。
 * 縮められなければ null（送らない）
 */
async function 写真を縮める(base64, 型 = 'image/jpeg', 長い辺 = 1600) {
  try {
    if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return null;
    const 元 = await base64をBlobに(base64, 型);
    if (!元) return null;
    const 画 = await createImageBitmap(元);
    const 倍率 = Math.min(1, 長い辺 / Math.max(画.width, 画.height));
    const 幅 = Math.max(1, Math.round(画.width * 倍率));
    const 高 = Math.max(1, Math.round(画.height * 倍率));
    const 紙 = document.createElement('canvas');
    紙.width = 幅;
    紙.height = 高;
    紙.getContext('2d').drawImage(画, 0, 0, 幅, 高);
    if (typeof 画.close === 'function') 画.close();
    return await new Promise((解く) => 紙.toBlob((体) => 解く(体 || null), 'image/jpeg', 0.8));
  } catch {
    return null;
  }
}

module.exports = {
  改善のために取っておく,
  写真を縮める,
  base64をBlobに,
  新しいid,
  添付の上限,
  小さくする,
  収める,
  文字の上限,
};
