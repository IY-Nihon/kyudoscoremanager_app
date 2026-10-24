/**
 * AI の返した JSON を読む。少しだけ壊れていたら直してから読む。
 *
 * ■ なぜ
 * 手書きのノートの写真（2026-10-11）で、Gemini が最後の閉じ括弧を 2 つ落とした JSON を返し
 * （finishReason は STOP）、JSON.parse が投げて読み取りが丸ごと止まった。中身は全部そろっていた。
 *
 * ■ 直すもの（それ以外は直さずに投げる）
 *   ・前後の ``` の囲み
 *   ・最後の要素のあとの余計なカンマ
 *   ・足りない閉じ括弧（文字列の外の { [ を数え、閉じていないものを逆の順で足す）
 */
'use strict';

function 閉じ括弧を足す(文) {
  const 積 = [];
  let 文字列の中 = false;
  let 逃がし = false;
  for (const c of 文) {
    if (文字列の中) {
      if (逃がし) 逃がし = false;
      else if (c === '\\') 逃がし = true;
      else if (c === '"') 文字列の中 = false;
      continue;
    }
    if (c === '"') 文字列の中 = true;
    else if (c === '{' || c === '[') 積.push(c);
    else if (c === '}' || c === ']') 積.pop();
  }
  // 文字列の途中で切れていたら閉じる
  let 出 = 文字列の中 ? 文 + '"' : 文;
  出 = 出.replace(/,\s*$/, '');
  while (積.length) 出 += 積.pop() === '{' ? '}' : ']';
  return 出;
}

/** @param {string} 文 @returns {any} 読めなければ元の誤りを投げる */
function AIのJSONを読む(文) {
  try {
    return JSON.parse(文);
  } catch (元の誤り) {
    let 直し = String(文 == null ? '' : 文).trim();
    直し = 直し.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    直し = 直し.replace(/,\s*([\]}])/g, '$1');
    // 丸に線の逆斜線をそのまま書いた "○\"（10/12 の白板 2 枚の写真。逆斜線が次の " を逃がして壊れた）
    // 逆斜線のあとに " を 2 つ書いた "○\""（10/12 の同じ写真。行の最後のマス）
    直し = 直し.replace(/([○◯〇])\\""/g, '$1\\\\"');
    直し = 直し.replace(/([○◯〇])\\(?=")/g, '$1\\\\');
    try {
      return JSON.parse(直し);
    } catch {
      // 次へ
    }
    try {
      return JSON.parse(閉じ括弧を足す(直し));
    } catch {
      throw 元の誤り;
    }
  }
}

module.exports = { AIのJSONを読む };
