/**
 * 写真1枚まるごとをアプリと同じ道（src/ocr/yomu.js）で読み、外れた射だけを並べる。
 *
 *   node scripts/ocr-cells/hazure.mjs
 *   DEKI=出し先 node scripts/ocr-cells/hazure.mjs   … 外れたマスの箱と、網に届く 20×20 も PNG に書く
 *
 * marugoto-tameshi.mjs は数だけを出す。どのマスがなぜ外れたかを見るのはこちら。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { createRequire } from 'node:module';
import { 板の印を読む, 大前から並べる } from '../../src/ocr/yomu.js';
import { 板ごとの格子, 箱の大きさ } from './kiridasu.mjs';
import { 画を読む, 回す, 四角を書く } from './gazou-node.mjs';
import { 形にする, 切り取る, 辺 } from './manabu.mjs';
import { 射手たち } from './kiroku.mjs';

const { マスを開く, 一射目からの順にする } = createRequire(import.meta.url)('../../src/ocrCells');
const 重み = JSON.parse(fs.readFileSync(process.env.OCR_OMOMI || 'scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
const 出 = process.env.DEKI;

const 元 = await 画を読む('docs/ocr-samples/PXL_20260906_081921509.jpg');
const 板たち = await 板の印を読む(元, { 板の人数たち: [8, 8], 行数: 10, 回す, 重み });
const 格子たち = 出 ? await 板ごとの格子(元, { 板の人数たち: [8, 8], 行数: 10, 回す }) : null;

let 番 = 0;
let 合 = 0;
for (let i = 0; i < 板たち.length; i++) {
  const 板 = 板たち[i];
  // 写真の列の番号も要るので、並べ替えは番号で行う
  const 順 = 大前から並べる(板.列たち.map((_, c) => c), '左右から', i, 板たち.length);
  for (const c of 順) {
    const 列 = 板.列たち[c];
    const 印 = マスを開く(一射目からの順にする(列, '下から'), '2射');
    const 射手 = 射手たち[番++];
    const 真 = [...射手.印];
    for (let k = 0; k < 真.length; k++) {
      if (印[k] === 真[k]) {
        合++;
        continue;
      }
      const r = 9 - Math.floor(k / 2);
      console.log(`板${i + 1} 射手${射手.名} 射${k + 1}: 読${印[k]} 真${真[k]}  マス（上から${r + 1}段目、列${c + 1}）の見立て=${列[r]} 確からしさ=${板.確からしさ[c][r].toFixed(2)}`);
      if (格子たち) {
        const g = 格子たち[i].格子;
        const { 半幅, 半高 } = 箱の大きさ(g);
        const 左 = Math.round(g.列[c].中心) - 半幅;
        const 上 = Math.round(g.行.位置[r] + (g.列[c].ずれ || 0)) - 半高;
        const 名 = `ita${i + 1}-ite${射手.名}-sha${k + 1}`;
        await 四角を書く(g.生, 左, 上, 半幅 * 2, 半高 * 2, `${出}/${名}-box.png`, 120);
        const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);
        const 形 = await 形にする(切.画, 切.幅, 切.高);
        const px = Buffer.alloc(辺 * 辺);
        for (let j = 0; j < 辺 * 辺; j++) px[j] = Math.round(255 - Math.max(0, Math.min(1, 形[j])) * 255);
        await sharp(px, { raw: { width: 辺, height: 辺, channels: 1 } }).resize(120, 120, { kernel: 'nearest' }).png().toFile(`${出}/${名}-net.png`);
      }
    }
  }
}
console.log(`射で ${合}/320`);
