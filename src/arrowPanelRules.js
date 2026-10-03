/**
 * 矢所パネル（記録画面の的の一覧）が使う、画面に触れない決まり。
 *
 * 矢所の記録を ON にしていても、置いた矢所は窓を開き直さないと見えなかった（2026-10-04 の依頼）。
 * ますの隅に小さな的を出す案は、58×42px では読めず、取りやめた。記録表のそばに、射手ごとの大きな的を
 * 並べる（立ごと＝4 本ずつ）。ここは、どの立を出すか・的に載せる矢所を作る、の部分。
 */
'use strict';

const 立の本数 = 4;

/** 立の数（射数 ÷ 4 を切り上げ） */
function 立の数(射数) {
  return Math.max(1, Math.ceil((Number(射数) || 0) / 立の本数));
}

/** 的を出す射手（区切り・計は除く） */
function 的を出す射手(射手たち) {
  return (Array.isArray(射手たち) ? 射手たち : []).filter(
    (射手) => !!射手 && !射手.isSeparator && !射手.isTotalCalculator
  );
}

/**
 * 初めに出す立：○か×が入っている、いちばん後ろの立（いま記録している立）。何も無ければ 0。
 * 本人が立を選んだら、そちらを使う（呼ぶ側で）
 */
function 既定の立(射手たち, 射数) {
  let 最後 = -1;
  for (const 射手 of 的を出す射手(射手たち)) {
    const 印 = Array.isArray(射手.marks) ? 射手.marks : [];
    for (let 番 = 0; 番 < 印.length; 番++) if (印[番] === '○' || 印[番] === '\xd7') 最後 = Math.max(最後, 番);
  }
  return 最後 < 0 ? 0 : Math.min(立の数(射数) - 1, Math.floor(最後 / 立の本数));
}

/**
 * その立の矢所を、的に載せる形にする（ArrowLocationView に渡す配列。要素は射の位置のまま、立の外は null）。
 *  ・○×は、保存された矢所の印でなく、いまの印（あとから○を×に直したとき、色がずれないように）
 *  ・いまの印が空のますは載せない
 *  ・番号は立の中の 1〜4（shotIndex に入れる。的の上の丸数字になる）
 */
function 立の矢所(射手, 立, 射数) {
  const 矢所たち = Array.isArray(射手 && 射手.arrowLocations) ? 射手.arrowLocations : [];
  const 印たち = Array.isArray(射手 && 射手.marks) ? 射手.marks : [];
  const 出 = Array(Math.max(0, Number(射数) || 0)).fill(null);
  for (let 番 = 立 * 立の本数; 番 < Math.min(出.length, (立 + 1) * 立の本数); 番++) {
    const 矢所 = 矢所たち[番];
    const 印 = 印たち[番];
    if (!矢所 || (印 !== '○' && 印 !== '\xd7')) continue;
    出[番] = Object.assign({}, 矢所, { mark: 印, shotIndex: 番 - 立 * 立の本数 });
  }
  return 出;
}

/** その立の 4 つのますの様子。矢所を押して直せるように、印と矢所の有無を返す */
function 立のます(射手, 立, 射数) {
  const 印たち = Array.isArray(射手 && 射手.marks) ? 射手.marks : [];
  const 矢所たち = Array.isArray(射手 && 射手.arrowLocations) ? 射手.arrowLocations : [];
  const 出 = [];
  for (let 番 = 立 * 立の本数; 番 < Math.min(Number(射数) || 0, (立 + 1) * 立の本数); 番++) {
    出.push({ 射番: 番, 立の中: 番 - 立 * 立の本数, 印: 印たち[番] || '', 矢所あり: !!矢所たち[番] });
  }
  return 出;
}

module.exports = { 立の本数, 立の数, 的を出す射手, 既定の立, 立の矢所, 立のます };
