/**
 * 立ち順の板で、「壱」「弐」などの立の番号の札をもとに、空きで分かれた組を立にまとめる。
 *
 * ■ なぜ
 * 札 1 枚に、空きをはさんだ名札の組が 2 つ付いている板がある（10/17・10/19 の本番の写真）。
 * 「札から次の札の手前までが 1 つの立」と Gemini に頼むと、札がどちらの組に付くかを
 * 取り違えて区切りがずれた（10/19 の写真で 5 回中 1 回しか合わない）。
 * Gemini には空きごとの組と、組の大前の端に付いた札（fuda）と段（row）だけを出させ、
 * まとめ方は端末で決める。
 *
 * ■ まとめ方
 *   ・同じ段の中で、札の無い組は、すぐ前（大前の側）の組と同じ立に入れる
 *   ・段の頭で札の無い組は、それだけで立を始める（写っていない札の立）
 *   ・立は札の番号の順。札の無い立は、札のある立より前に、読んだ順で置く
 *   ・札が 1 枚も無いときは、組をそのまま立として返す（これまでどおり空きで分ける）
 */

const { 半角にする } = require('./totonoeru');

// 漢数字（大字も）→ 1〜9
const 一桁の数字 = Object.fromEntries(
  ['一壱', '二弐貳', '三参', '四肆', '五伍', '六陸', '七漆', '八捌', '九玖'].flatMap((字たち, 番) =>
    [...字たち].map((字) => [字, 番 + 1])
  )
);
const 十の字 = new Set(['十', '拾']);
// 丸数字（①〜㊿・黒丸・二重丸など）の字の番号の範囲と、その範囲の最初の字の数
const 丸数字の範囲 = [
  [0x2460, 0x2473, 1], // ①〜⑳
  [0x3251, 0x325f, 21], // ㉑〜㉟
  [0x32b1, 0x32bf, 36], // ㊱〜㊿
  [0x2776, 0x277f, 1], // 黒丸の 1〜10
  [0x2780, 0x2789, 1], // 丸の 1〜10（飾りの字）
  [0x278a, 0x2793, 1], // 黒丸の 1〜10（飾りの字）
  [0x24eb, 0x24f4, 11], // 黒丸の 11〜20
  [0x24f5, 0x24fe, 1], // 二重丸の 1〜10
];
const 丸数字の数 = (字) => {
  const 番 = 字.codePointAt(0);
  const 範囲 = 丸数字の範囲.find(([頭, 尾]) => 番 >= 頭 && 番 <= 尾);
  return 範囲 ? 番 - 範囲[0] + 範囲[2] : null;
};

/**
 * 札の字から番号を取る。読めなければ null。
 * 数字（全角も）・丸数字・漢数字（十一〜九十九も。「十二」は 12、「二十」は 20）。
 * 漢数字は最初に出てきた連なりだけを読む（「第十一立」は 11）
 */
function 札の番号(札) {
  // \s は全角空白（U+3000）も含む。全角の数字は半角に
  const 字 = 半角にする(String(札 == null ? '' : 札).replace(/\s/g, ''));
  if (!字) return null;
  for (const c of 字) {
    const 丸 = 丸数字の数(c);
    if (丸 != null) return 丸;
  }
  const 算 = 字.match(/\d+/);
  if (算) return Number(算[0]);
  let 値 = 0;
  let 今の桁 = 0;
  let 始まった = false;
  for (const c of 字) {
    if (一桁の数字[c]) {
      今の桁 = 一桁の数字[c];
      始まった = true;
    } else if (十の字.has(c)) {
      値 += (今の桁 || 1) * 10;
      今の桁 = 0;
      始まった = true;
    } else if (始まった) {
      break;
    }
  }
  return 始まった ? 値 + 今の桁 : null;
}

/**
 * @param {Array<{seats:string[], fuda?:string, row?:number}>} 組たち Gemini が返した tachi
 * @returns {Array<{seats:string[]}>}
 */
function 札で立にまとめる(組たち) {
  const 組 = (Array.isArray(組たち) ? 組たち : []).filter((x) => x && Array.isArray(x.seats));
  if (!組.some((x) => 札の番号(x.fuda) != null)) return 組.map((x) => ({ seats: x.seats }));
  const 立たち = [];
  let 前 = null;
  組.forEach((x, 順) => {
    const 番号 = 札の番号(x.fuda);
    const 段 = x.row == null ? 0 : x.row;
    if (番号 == null && 前 && 前.段 === 段) {
      前.seats.push(...x.seats);
      return;
    }
    前 = { 番号, 段, 順, seats: [...x.seats] };
    立たち.push(前);
  });
  return 立たち
    .sort((a, b) => (a.番号 == null ? 0 : a.番号) - (b.番号 == null ? 0 : b.番号) || a.順 - b.順)
    .map((x) => ({ seats: x.seats }));
}

module.exports = { 札で立にまとめる, 札の番号 };
