/**
 * 紙の記録用紙の写真から、確かめ用のマスを切り出す。
 *
 *   node scripts/ocr-cells/kami-honmono.mjs
 *
 * 写真 1788683956272.jpg（女子リーグ、名前は塗ってある）の表の部分を切り、
 * 紙の格子でマスを切って docs/ocr-samples/cells-kami/{maru,batsu}/ に置く。
 * 札は kiroku.mjs の 紙の射手たち（本番の記録から生成）から貼る。
 * 紙では右の列が大前なので、左の列 c は記録の 人数-1-c 番。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 紙の格子, 紙の箱 } from './kami.mjs';
import { 紙の射手たち } from './kiroku.mjs';
import { 切り取る } from './manabu.mjs';

const 元 = 'docs/ocr-samples/1788683956272.jpg';
// 表の部分（見て決めた）。列の罫線からかたまりの罫線まで
export const 紙の区画 = { left: 380, top: 528, width: 260, height: 640 };
const 人数 = 4, 立数 = 5, 立のマス = 4;

const 出し先 = 'docs/ocr-samples/cells-kami';
fs.rmSync(出し先, { recursive: true, force: true });
for (const d of ['maru', 'batsu']) fs.mkdirSync(`${出し先}/${d}`, { recursive: true });

const { data, info } = await sharp(元).extract(紙の区画).greyscale().raw().toBuffer({ resolveWithObject: true });
const g = await 紙の格子({ 画素: data, 幅: info.width, 高: info.height }, { 人数, 立数, 立のマス });
console.log(`列: ${g.列.map((c) => c.中心.toFixed(0)).join(',')}  かたまり: ${g.かたまり.位置.map((v) => v.toFixed(0)).join(',')}`);

let 数 = 0;
for (let c = 0; c < 人数; c++) {
  const 射手 = 紙の射手たち[人数 - 1 - c];
  for (let s = 0; s < g.マス[c].length; s++) {
    const m = g.マス[c][s];
    const { 半幅, 半高 } = 紙の箱(m);
    const 左 = Math.max(0, Math.round(m.x) - 半幅);
    const 上 = Math.max(0, Math.round(m.y) - 半高);
    const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);
    const 札 = 射手.印[s] === '○' ? 'maru' : 'batsu';
    // 元の大きさのまま保存する。64×64 に伸ばすと線の太さが変わり、写真から直接
    // 切ったマスと同じ網でも読みが変わった（実測で 80/80 と 79/80）
    await sharp(Buffer.from(切.画), { raw: { width: 切.幅, height: 切.高, channels: 1 } })
      .png()
      .toFile(`${出し先}/${札}/c${c}s${String(s).padStart(2, '0')}.png`);
    数++;
  }
}
console.log(`${出し先}: ${数}枚`);
