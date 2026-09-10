/**
 * マスを1枚、20×20 に整えたあとの姿で見せる。
 *
 *   node scripts/ocr-cells/misemasu.mjs docs/ocr-samples/cells-migi/maru2/migi-b-r8c0.png ...
 */
import sharp from 'sharp';
import { 種類, 形にする, 辺, 前へ } from './manabu.mjs';
import fs from 'node:fs';

const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/mure.json', 'utf8'));
const 群れ = 重み.網たち.map((n) => ({
  隠れ: n.隠れ,
  W1: Float32Array.from(n.W1),
  b1: Float32Array.from(n.b1),
  W2: Float32Array.from(n.W2),
  b2: Float32Array.from(n.b2),
}));

for (const みち of process.argv.slice(2)) {
  const { data, info } = await sharp(みち).greyscale().raw().toBuffer({ resolveWithObject: true });
  const 形 = await 形にする(data, info.width, info.height);
  const 合 = new Float32Array(種類.length);
  for (const 網 of 群れ) {
    const { o } = 前へ(網, 形);
    for (let k = 0; k < 種類.length; k++) 合[k] += o[k] / 群れ.length;
  }
  console.log('── ' + みち);
  console.log('   ' + 種類.map((s, k) => `${s}=${合[k].toFixed(2)}`).join('  '));
  const 改 = String.fromCharCode(10);
  let 絵 = '';
  for (let y = 0; y < 辺; y++) {
    let 行 = '';
    for (let x = 0; x < 辺; x++) {
      const v = 形[y * 辺 + x];
      行 += v > 0.6 ? '#' : v > 0.35 ? '+' : v > 0.15 ? '.' : ' ';
    }
    絵 += 行 + 改;
  }
  console.log(絵);
}
