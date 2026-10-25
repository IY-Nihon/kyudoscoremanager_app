/**
 * AI チャットの計算の道具（calculate）。
 *
 * 模型には「数字は道具の値をそのまま使い、自分で足し算・割り算をしない」と決めている（暗算を間違えるため）。
 * そのせいで「何中対何中？」「足して」「仕組みを変えて」と 7 回頼まれても「計算は固く禁止されています」と
 * 断り続けた（2026-10-04 の AI のログ）。計算が要るときは、この道具に式を渡させる。
 * eval は使わない。数と + - * / と括弧だけを読む（それ以外の字があれば断る）。
 * 画面にも Firebase にも触れないので、node --test で確かめられる（test/chatCalc.test.js）。
 */
'use strict';

/** 式の長さの上限（模型が長い式を作っても、読むのに時間がかからないように） */
const 式の上限 = 300;

/**
 * 式を計算する。全角の数字・記号（＋－×÷（））と、数の中の , も読む
 * @param {string} 式
 * @param {number} [桁] 小数の桁（既定 2。0〜6）
 * @returns {{式: string, 答え: number} | {式: string, error: string}}
 */
function 計算する(式, 桁) {
  const 元 = String(式 == null ? '' : 式);
  const 文 = 元
    .replace(/[０-９]/g, (字) => String.fromCharCode(字.charCodeAt(0) - 0xfee0))
    .replace(/[＋]/g, '+')
    .replace(/[－−ー]/g, '-')
    .replace(/[×＊]/g, '*')
    .replace(/[÷／]/g, '/')
    .replace(/[（]/g, '(')
    .replace(/[）]/g, ')')
    .replace(/[．]/g, '.')
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/\s+/g, '');
  if (!文) return { 式: 元, error: '式が空です' };
  if (文.length > 式の上限) return { 式: 元, error: `式が長すぎます（${式の上限} 字まで）` };
  if (!/^[0-9+\-*/().]+$/.test(文)) {
    return {
      式: 元,
      error: '使えるのは数と + - * / と括弧だけです（% や関数は使えません。割合は 「中 / 射 * 100」）',
    };
  }

  let 位置 = 0;
  const 見る = () => 文[位置];
  const 数を読む = () => {
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(文.slice(位置));
    if (!m) throw new Error(`${位置 + 1} 字目に数がありません`);
    位置 += m[0].length;
    return Number(m[0]);
  };
  // 因子：数・括弧・符号
  const 因子 = () => {
    if (見る() === '-') {
      位置++;
      return -因子();
    }
    if (見る() === '+') {
      位置++;
      return 因子();
    }
    if (見る() === '(') {
      位置++;
      const 値 = 足し引き();
      if (見る() !== ')') throw new Error('括弧が閉じていません');
      位置++;
      return 値;
    }
    return 数を読む();
  };
  const 掛け割り = () => {
    let 値 = 因子();
    while (見る() === '*' || 見る() === '/') {
      const 記号 = 文[位置++];
      const 右 = 因子();
      if (記号 === '/' && 右 === 0) throw new Error('0 で割っています');
      値 = 記号 === '*' ? 値 * 右 : 値 / 右;
    }
    return 値;
  };
  function 足し引き() {
    let 値 = 掛け割り();
    while (見る() === '+' || 見る() === '-') {
      const 記号 = 文[位置++];
      const 右 = 掛け割り();
      値 = 記号 === '+' ? 値 + 右 : 値 - 右;
    }
    return 値;
  }

  try {
    const 値 = 足し引き();
    if (位置 !== 文.length) throw new Error(`${位置 + 1} 字目が読めません`);
    if (!Number.isFinite(値)) throw new Error('答えが数になりません');
    const 小数 = Number.isFinite(桁) ? Math.min(6, Math.max(0, Math.floor(桁))) : 2;
    return { 式: 元, 答え: Number(値.toFixed(小数)) };
  } catch (誤り) {
    return { 式: 元, error: String((誤り && 誤り.message) || 誤り) };
  }
}

module.exports = { 計算する };
