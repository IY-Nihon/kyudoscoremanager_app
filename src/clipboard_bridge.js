/**
 * expo-clipboard への橋。
 *
 * 共有リンクをコピーするのに使う（src/LiveShareModal.js）。
 * 端末では expo-clipboard、web では navigator.clipboard を使い、断られたら昔の写し方（execCommand）も試す。
 *
 * 読み込みそのものが失敗する場面（古い端末・部品が入っていないビルド）でも
 * 画面が落ちないように、包んで持つ。コピーできなかったときは false を返し、
 * 呼ぶ側が「長押しで選んでください」と案内する。
 */
'use strict';

let 本体 = null;
try {
  本体 = require('expo-clipboard');
} catch {
  本体 = null;
}

/** web か（端末の版には document が無い） */
function ブラウザか() {
  return typeof document !== 'undefined' && !!document.body && typeof document.createElement === 'function';
}

/**
 * 昔の写し方。見えない欄に入れて選び、execCommand('copy') で写す。
 * 新しい写し方（navigator.clipboard）が断られた・無いときだけ使う
 *（http の頁、許可を断った・古い Safari など）。写せたかは execCommand の返りで見る
 */
function 昔の写し方(s) {
  let 欄 = null;
  const 前の焦点 = document.activeElement;
  try {
    欄 = document.createElement('textarea');
    欄.value = s;
    // readonly で iPhone のキーボードを出さない。16px 未満だと iPhone が拡大する
    欄.setAttribute('readonly', '');
    Object.assign(欄.style, { position: 'fixed', top: '-9999px', left: '0', opacity: '0', fontSize: '16px' });
    document.body.appendChild(欄);
    欄.select();
    欄.setSelectionRange(0, s.length);
    return typeof document.execCommand === 'function' && document.execCommand('copy') === true;
  } catch {
    return false;
  } finally {
    if (欄 && 欄.parentNode) 欄.parentNode.removeChild(欄);
    // 打っていた欄の焦点を戻す
    if (前の焦点 && typeof 前の焦点.focus === 'function' && 前の焦点 !== document.body) {
      try {
        前の焦点.focus();
      } catch {
        /* 戻せなくてもよい */
      }
    }
  }
}

/** 文字列を写す。写せたら true */
async function 写す(文字列) {
  const s = String(文字列 == null ? '' : 文字列);
  if (!s) return false;
  // web では navigator.clipboard を自分で呼ぶ。expo-clipboard の web 版は、断られると
  // 見える欄で写し直し、そこで写せなかったときも true を返す（「コピーしました」と出てしまう）
  if (ブラウザか()) {
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(s);
        return true;
      }
    } catch {
      /* 断られた。昔の写し方を試す */
    }
    return 昔の写し方(s);
  }
  try {
    if (本体 && typeof 本体.setStringAsync === 'function') {
      await 本体.setStringAsync(s);
      return true;
    }
  } catch {
    /* 写せなかった */
  }
  return false;
}

module.exports = { 写す };
