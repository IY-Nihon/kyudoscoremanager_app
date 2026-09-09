/**
 * 切り出した1マスから、○×の見た目を決める。
 *
 * ■ 見るところ
 *
 *   外の輪 … 枠のふちに沿って墨が回っているか（丸が在るか）
 *   中ほどの帯（半径 0.22〜0.66）で、2つの対角に墨がどれだけ寄っているか
 *
 *   ×      … 外の輪が回っていない
 *   ◎      … 2つの対角の差が小さい（内側の丸は、どの向きにも墨が在る）
 *   丸に＼  … ＼ の側に寄っている（中り→外れ）
 *   丸に／  … ／ の側に寄っている（外れ→中り）
 *
 * ■ 実測（実物の板80マス、2026-09-09）
 *
 *   札ごとの平均：
 *     ×      外の輪 0.35  ＼0.199  ／0.272
 *     ◎      外の輪 0.90  ＼0.134  ／0.126   ← 差がほぼ無い
 *     丸に＼  外の輪 0.81  ＼0.265  ／0.090   ← ＼ に寄る
 *     丸に／  外の輪 0.80  ＼0.095  ／0.239   ← ／ に寄る
 *
 *   当たり 64/80（80.0%）／中り数だけなら 67/80（83.8%）
 *   1人あたりの的中数は、8人ぶんで合計11射のずれ（多くは±1）
 *
 * ■ 断っておくこと
 *
 * 境目は、その同じ80マスで探した値。手元のものに合わせた数なので、
 * 別の板ではこれより下がる。写真が増えたら測り直すこと。
 * 見分けきれないものが残る前提で、直せる形で使うのが前提。
 */

/** 境目。実物80マスで探した値 */
export const 既定の設定 = {
  墨の境: 0.5,
  帯の内: 0.22,
  帯の外: 0.66,
  輪の境: 0.46,
  差の境: 0.085,
};

/**
 * @param {Uint8Array|number[]} 明るさ 白黒（0-255、左上から右へ）
 * @param {number} 幅
 * @param {number} 高
 * @param {object} [設定]
 * @returns {{記号:string, 外の輪:number, 下がり:number, 上がり:number}}
 */
export function 見分ける(明るさ, 幅, 高, 設定) {
  const c = Object.assign({}, 既定の設定, 設定 || {});
  let 最小 = 255;
  let 最大 = 0;
  for (let i = 0; i < 明るさ.length; i++) {
    if (明るさ[i] < 最小) 最小 = 明るさ[i];
    if (明るさ[i] > 最大) 最大 = 明るさ[i];
  }
  // 濃淡の幅が小さい＝何も書かれていない
  if (最大 - 最小 < 25) return { 記号: '', 外の輪: 0, 下がり: 0, 上がり: 0 };

  const 境 = 最小 + (最大 - 最小) * c.墨の境;
  const 墨 = new Uint8Array(幅 * 高);
  let 左 = 幅, 右 = -1, 上 = 高, 下 = -1;
  for (let y = 0; y < 高; y++) {
    for (let x = 0; x < 幅; x++) {
      const i = y * 幅 + x;
      if (明るさ[i] >= 境) continue;
      墨[i] = 1;
      if (x < 左) 左 = x;
      if (x > 右) 右 = x;
      if (y < 上) 上 = y;
      if (y > 下) 下 = y;
    }
  }
  if (右 < 0) return { 記号: '', 外の輪: 0, 下がり: 0, 上がり: 0 };

  const 中x = (左 + 右) / 2;
  const 中y = (上 + 下) / 2;
  const 半 = Math.max(3, Math.max(右 - 左, 下 - 上) / 2);

  const 分割 = 24;
  const 輪 = new Array(分割).fill(0);
  const 角 = 48;
  const 帯 = new Array(角).fill(0);
  const 帯の数 = new Array(角).fill(0);
  for (let y = 上; y <= 下; y++) {
    for (let x = 左; x <= 右; x++) {
      const dx = (x - 中x) / 半;
      const dy = (y - 中y) / 半;
      const r = Math.sqrt(dx * dx + dy * dy);
      let a = Math.atan2(dy, dx);
      if (a < 0) a += Math.PI * 2;
      const 墨か = 墨[y * 幅 + x];
      if (r >= 0.62 && 墨か) 輪[Math.min(分割 - 1, Math.floor((a / (Math.PI * 2)) * 分割))] = 1;
      if (r >= c.帯の内 && r <= c.帯の外) {
        const i = Math.min(角 - 1, Math.floor((a / (Math.PI * 2)) * 角));
        帯の数[i]++;
        if (墨か) 帯[i]++;
      }
    }
  }
  const 割 = 帯.map((v, i) => (帯の数[i] ? v / 帯の数[i] : 0));
  const 向き = (度) => {
    const i = Math.round((度 / 360) * 角) % 角;
    let 合 = 0;
    let n = 0;
    for (let d = -2; d <= 2; d++) {
      合 += 割[(i + d + 角) % 角];
      n++;
    }
    return 合 / n;
  };
  const 外の輪 = 輪.reduce((a, b) => a + b, 0) / 分割;
  const 下がり = (向き(45) + 向き(225)) / 2;
  const 上がり = (向き(135) + 向き(315)) / 2;

  let 記号;
  if (外の輪 < c.輪の境) 記号 = '×';
  else {
    const 差 = 下がり - 上がり;
    記号 = Math.abs(差) < c.差の境 ? '◎' : 差 > 0 ? '○' + String.fromCharCode(92) : '○/';
  }
  return { 記号, 外の輪, 下がり, 上がり };
}
