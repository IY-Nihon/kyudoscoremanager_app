/**
 * 記録表の「矢所の行」（各列の下に並べる小さな的）の決まり。画面にも店にも触れない。
 *
 * 矢所の記録を ON にしていても、置いた矢所は窓を開き直さないと見えなかった（2026-10-04 の依頼）。
 * ますの隅の小さな的（25px）は読めず、右や下に出すパネルは「どれが誰か」を見比べる手間があり、
 * 全員を 1 つの的に重ねる案は 20 人で読めない。そこで、表の各列の下に、その列の人の的を同じ幅・同じ位置で
 * 並べる（表と一緒に横へ流れる。20 人でも同じ作りで並ぶ）。
 */
'use strict';

/** 見せ方。既定は全部の射。「立」は全員そろって、いま記録している立（印が入っている最後の立）だけ */
const 見せ方たち = ['全部', '立', '隠す'];

/** 見せ方を順に切り替える（全部 → 立 → 隠す → 全部） */
function 次の見せ方(いま) {
  const 番 = 見せ方たち.indexOf(いま);
  return 見せ方たち[(番 + 1) % 見せ方たち.length];
}

/** 値が壊れていたら全部に戻す */
function 見せ方を整える(値) {
  return 見せ方たち.includes(値) ? 値 : '全部';
}

/**
 * いま記録している立：○か×が入っている、いちばん後ろの射の立。何も無ければ 0。
 * 列ごとに数えると人ごとに立がずれるので、親が全員ぶんから 1 つだけ決めて渡す。
 */
function いまの立(射手たち, 射数) {
  let 最後 = -1;
  for (const 射手 of Array.isArray(射手たち) ? 射手たち : []) {
    if (!射手 || 射手.isSeparator || 射手.isTotalCalculator) continue;
    const 印たち = Array.isArray(射手.marks) ? 射手.marks : [];
    for (let 番 = 0; 番 < 印たち.length; 番++) if (印たち[番] === '○' || 印たち[番] === '\xd7') 最後 = Math.max(最後, 番);
  }
  const 立の数 = Math.max(1, Math.ceil((Number(射数) || 0) / 4));
  return 最後 < 0 ? 0 : Math.min(立の数 - 1, Math.floor(最後 / 4));
}

/**
 * 的に載せる点を作る。
 *  ・印は、保存された矢所の印でなく、いまの印（あとから○を×に直したとき色がずれないように）
 *  ・いまの印が空のますは載せない
 *  ・見せ方が「立」なら、その立の射だけ
 * @returns {{x:number, y:number, 印:string, 射番:number}[]}
 */
function 的の点たち(射手, 見せ方, 立) {
  const 矢所たち = Array.isArray(射手 && 射手.arrowLocations) ? 射手.arrowLocations : [];
  const 印たち = Array.isArray(射手 && 射手.marks) ? 射手.marks : [];
  const 出 = [];
  for (let 番 = 0; 番 < 矢所たち.length; 番++) {
    const 矢所 = 矢所たち[番];
    const 印 = 印たち[番];
    if (!矢所 || (印 !== '○' && 印 !== '\xd7')) continue;
    if ('立' === 見せ方 && Math.floor(番 / 4) !== 立) continue;
    出.push({ x: Number(矢所.x) || 0, y: Number(矢所.y) || 0, 印, 射番: 番 });
  }
  return 出;
}

/** 的を押したとき窓で開く射：矢所が置かれた射のうち、いちばん後ろ。無ければ null */
function 開く射番(射手) {
  const 矢所たち = Array.isArray(射手 && 射手.arrowLocations) ? 射手.arrowLocations : [];
  const 印たち = Array.isArray(射手 && 射手.marks) ? 射手.marks : [];
  for (let 番 = Math.min(矢所たち.length, 印たち.length) - 1; 番 >= 0; 番--) {
    if (矢所たち[番] && (印たち[番] === '○' || 印たち[番] === '\xd7')) return 番;
  }
  return null;
}

module.exports = { 見せ方たち, 次の見せ方, 見せ方を整える, いまの立, 的の点たち, 開く射番 };
