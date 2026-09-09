/**
 * 板の写真から、表の罫線を見つけて格子を組み立てられるかを調べる道具。
 *
 *   node scripts/ocr-cells/shirabe-koushi.mjs <画像>
 *
 * マスを1つずつ切り出せないと、分類器がどれだけ賢くても使えない。
 * まずここが立つかを確かめる。
 */
import sharp from 'sharp';

const みち = process.argv[2];
if (!みち) {
  console.error('使い方: node scripts/ocr-cells/shirabe-koushi.mjs <画像>');
  process.exit(1);
}

const 元 = sharp(みち);
const 情報 = await 元.metadata();
console.log(`画像: ${情報.width}×${情報.height}`);

// 白黒にして、暗いところを1とする
const { data, info } = await sharp(みち)
  .greyscale()
  .normalise()
  .raw()
  .toBuffer({ resolveWithObject: true });
const 幅 = info.width;
const 高 = info.height;

/** 明るさの中央値。しきい値をここから決める */
const 並び = Array.from(data).sort((a, b) => a - b);
const 中央 = 並び[Math.floor(並び.length / 2)];
const しきい = Math.max(40, 中央 - 55);
console.log(`明るさの中央: ${中央} / 暗いとみなす境: ${しきい}`);

const 暗い = (x, y) => data[y * 幅 + x] < しきい;

// 縦の線：その列で、縦に連なって暗い画素がどれだけあるか
const 縦の濃さ = new Array(幅).fill(0);
for (let x = 0; x < 幅; x++) {
  let 数 = 0;
  for (let y = 0; y < 高; y++) if (暗い(x, y)) 数++;
  縦の濃さ[x] = 数 / 高;
}
const 横の濃さ = new Array(高).fill(0);
for (let y = 0; y < 高; y++) {
  let 数 = 0;
  for (let x = 0; x < 幅; x++) if (暗い(x, y)) 数++;
  横の濃さ[y] = 数 / 幅;
}

/** 濃さの並びから、山（線の位置）を拾う */
function 山を拾う(濃さ, 最小の濃さ, 最小の間) {
  const 山 = [];
  let i = 0;
  while (i < 濃さ.length) {
    if (濃さ[i] < 最小の濃さ) {
      i++;
      continue;
    }
    let j = i;
    let 頂 = i;
    while (j < 濃さ.length && 濃さ[j] >= 最小の濃さ) {
      if (濃さ[j] > 濃さ[頂]) 頂 = j;
      j++;
    }
    if (!山.length || 頂 - 山[山.length - 1] >= 最小の間) 山.push(頂);
    else if (濃さ[頂] > 濃さ[山[山.length - 1]]) 山[山.length - 1] = 頂;
    i = j;
  }
  return 山;
}

for (const 割 of [0.5, 0.4, 0.3, 0.25, 0.2]) {
  const 縦線 = 山を拾う(縦の濃さ, 割, Math.floor(幅 / 40));
  const 横線 = 山を拾う(横の濃さ, 割, Math.floor(高 / 40));
  console.log(`しきい ${(割 * 100).toFixed(0)}%: 縦線 ${縦線.length}本 / 横線 ${横線.length}本`);
  if (縦線.length && 縦線.length <= 30) console.log('   縦: ' + 縦線.join(', '));
  if (横線.length && 横線.length <= 30) console.log('   横: ' + 横線.join(', '));
}
