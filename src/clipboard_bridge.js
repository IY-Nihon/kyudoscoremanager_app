/**
 * expo-clipboard への橋。
 *
 * 共有リンクを写すのに使う（src/LiveShareModal.js）。
 * 端末では expo-clipboard、web ではそれが navigator.clipboard を使う。
 *
 * 読み込みそのものが失敗する場面（古い端末・部品が入っていないビルド）でも
 * 画面が落ちないように、包んで持つ。写せなかったときは false を返し、
 * 呼ぶ側が「長押しで選んでください」と案内する。
 */
'use strict';

let 本体 = null;
try {
  本体 = require('expo-clipboard');
} catch {
  本体 = null;
}

/** 文字列を写す。写せたら true */
async function 写す(文字列) {
  const s = String(文字列 == null ? '' : 文字列);
  if (!s) return !1;
  try {
    if (本体 && typeof 本体.setStringAsync === 'function') {
      await 本体.setStringAsync(s);
      return !0;
    }
  } catch {
    /* 下の手立てを試す */
  }
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      await navigator.clipboard.writeText(s);
      return !0;
    }
  } catch {
    /* 写せなかった */
  }
  return !1;
}

module.exports = { 写す };
