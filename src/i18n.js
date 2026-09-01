/**
 * Module ID: i18n
 *
 * 画面に出す言葉を、言語ごとに差し替えられるようにする。
 *
 * ■ いまどこまでやってあるか（正直なところ）
 * 仕組みと、読み上げ用の言葉（src/a11yLabels.js）までが英語になっている。
 * 画面の大半はまだ日本語が直に書かれたままで、その量は
 *   npm run ops:scan-japanese
 * で数えられる。**いま英語に切り替えても、大半は日本語のまま出る。**
 * だから既定は日本語のままにしてあり、切り替えは画面に出していない。
 * 中途半端に混ざった画面は、日本語のままより使いにくい。
 *
 * ■ なぜ道具を入れず、自前で書くのか
 * i18n-js や react-intl は、この用途には大きい。ここで要るのは
 * 「鍵を引く」「数を差し込む」「単数と複数を選ぶ」の3つだけで、
 * どれも十数行で書ける。依存を1つ増やすと、Expo の版を上げるたびに
 * 付き合うことになる。
 *
 * ■ 訳さない言葉がある
 * 「大前」「落」「立ち」は弓道の言葉で、英語に相当するものが無い。
 * 訳語をこしらえると、かえって通じなくなる。読みをローマ字で置き、
 * 説明を添える形にしてある（src/messages.js を参照）。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、そのまま検査できる
 * （test/i18n.test.js）。
 */
'use strict';

// 画面ごとに分けた辞書をまとめたもの（src/messages/index.js）
const 辞書 = require('./messages/index');

/** 訳が無いときに落ちる先。ここは必ず埋まっている */
const 既定の言葉 = 'ja';

/** いま選ばれている言葉 */
let いまの言葉 = 既定の言葉;

/**
 * 端末の言葉を見立てる。分からなければ日本語。
 *
 * 英語圏の端末でも既定は日本語のままにしている（上の説明を参照）。
 * ここは「見立てる」だけで、選ぶのは 言葉を選ぶ()。
 *
 * @param {{language?:string, languages?:string[]}} [端末]
 * @returns {string}
 */
function 端末の言葉を見立てる(端末) {
  const n =
    端末 || (typeof globalThis !== 'undefined' && globalThis.navigator ? globalThis.navigator : null);
  const 生 = (n && (n.language || (Array.isArray(n.languages) && n.languages[0]))) || '';
  const 符号 = String(生).toLowerCase().split('-')[0];
  return 辞書.言葉たち[符号] ? 符号 : 既定の言葉;
}

/** 言葉を選ぶ。知らない符号なら日本語のまま */
function 言葉を選ぶ(符号) {
  const s = String(符号 == null ? '' : 符号).toLowerCase().split('-')[0];
  いまの言葉 = 辞書.言葉たち[s] ? s : 既定の言葉;
  return いまの言葉;
}

/** いま選ばれている符号 */
function 選ばれている言葉() {
  return いまの言葉;
}

/**
 * 数に合わせて形を選ぶ。
 *
 * 日本語は数で形が変わらないので、文字列をそのまま置ける。
 * 英語のように変わるものは { 一: '…', 多: '…' } と書く。
 * 0 は「多」に入れる（英語の 0 records は複数形）
 */
function 形を選ぶ(訳, 数) {
  if ('string' == typeof 訳) return 訳;
  if (!訳 || 'object' != typeof 訳) return null;
  return 1 === 数 ? 訳.一 : 訳.多;
}

/**
 * 訳を引く。
 *
 * 見つからなければ日本語へ落ち、それも無ければ鍵そのものを返す。
 * 空文字を返さないこと。空になると、画面から言葉が消えたのか
 * 訳が抜けているのかが見分けられなくなる
 *
 * @param {string} 鍵
 * @param {object} [差し込み] 例 { n: 3 } は文中の {n} に入る
 * @returns {string}
 */
function 訳(鍵, 差し込み) {
  const 差 = 差し込み && 'object' == typeof 差し込み ? 差し込み : {};
  const 数 = 'number' == typeof 差.n ? 差.n : null;
  let 出 = 形を選ぶ((辞書.言葉たち[いまの言葉] || {})[鍵], 数);
  if (null == 出 && いまの言葉 !== 既定の言葉)
    出 = 形を選ぶ((辞書.言葉たち[既定の言葉] || {})[鍵], 数);
  if (null == 出) return String(鍵);
  // \w は半角英数しか拾わない。差し込みの名前は日本語なので、波かっこの中を丸ごと拾う
  return String(出).replace(/\{([^{}]+)\}/g, (丸ごと, 名) =>
    Object.prototype.hasOwnProperty.call(差, 名) ? String(差[名]) : 丸ごと
  );
}

module.exports = {
  訳,
  言葉を選ぶ,
  選ばれている言葉,
  端末の言葉を見立てる,
  既定の言葉,
};
