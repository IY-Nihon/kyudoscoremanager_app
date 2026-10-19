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

const 数字 = { 一: 1, 壱: 1, 二: 2, 弐: 2, 貳: 2, 三: 3, 参: 3, 四: 4, 肆: 4, 五: 5, 伍: 5, 六: 6, 陸: 6, 七: 7, 漆: 7, 八: 8, 捌: 8, 九: 9, 玖: 9, 十: 10 };

/** 札の字から番号を取る。読めなければ null */
function 札の番号(札) {
  const 字 = String(札 == null ? '' : 札).replace(/[\s　]/g, '');
  if (!字) return null;
  const 算 = 字.match(/\d+/);
  if (算) return Number(算[0]);
  for (const c of 字) if (数字[c]) return 数字[c];
  return null;
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
