/**
 * 紙の記録用紙の写真をそのまま読み、本番の記録と一字ずつ比べる。
 *
 *   node scripts/ocr-cells/kami-yomitoru.mjs
 *
 * 写真 → 表の切り抜き → 紙の格子 → マスの見立て（○×） → 射手ごとの並び。
 * 数字での辻褄合わせは使わない（本番で数字を当てにしないと決めたので）。
 */
import sharp from 'sharp';
import { 紙の格子, 紙の箱, 紙の表を探す } from './kami.mjs';
import { 画を読む } from './gazou-node.mjs';
import { 紙の射手たち } from './kiroku.mjs';
import { 形にする, 前へ, 切り取る } from './manabu.mjs';
import { 重みを読む } from './chiisaku.mjs';

const 元 = 'docs/ocr-samples/1788683956272.jpg';
const 人数 = 4, 立数 = 5, 立のマス = 4;
// 表の場所は写真から探す（アプリと同じ道）。OCR_TEDE=1 なら手で決めた四角
const 手で = { left: 380, top: 528, width: 260, height: 640 };
const 群れ = 重みを読む(process.env.OCR_KAMI_OMOMI || 'scripts/ocr-cells/kami-omomi.json');

const 全体 = await 画を読む(元);
const 紙の区画 = process.env.OCR_TEDE ? 手で : 紙の表を探す(全体, { 人数 });
if (!紙の区画) throw new Error('表が見つかりません');
console.log('表の四角:', JSON.stringify(紙の区画));
const { data, info } = await sharp(元).extract({ left: 紙の区画.left, top: 紙の区画.top, width: 紙の区画.width, height: 紙の区画.height }).greyscale().raw().toBuffer({ resolveWithObject: true });
const g = await 紙の格子({ 画素: data, 幅: info.width, 高: info.height }, { 人数, 立数, 立のマス, 枠: 紙の区画 && 紙の区画.枠 });

let 合った射 = 0;
let 全射 = 0;
let 合った人 = 0;
for (let c = 0; c < 人数; c++) {
  const 射手 = 紙の射手たち[人数 - 1 - c];
  let 並び = '';
  for (const m of g.マス[c]) {
    const { 半幅, 半高 } = 紙の箱(m);
    const 左 = Math.max(0, Math.round(m.x) - 半幅);
    const 上 = Math.max(0, Math.round(m.y) - 半高);
    const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);
    const 形 = await 形にする(切.画, 切.幅, 切.高, 'そのまま');
    let 丸 = 0;
    for (const 網 of 群れ) 丸 += 前へ(網, 形).o[1] / 群れ.length;
    並び += 丸 > 0.5 ? '○' : '×';
  }
  let 合 = 0;
  for (let i = 0; i < 射手.印.length; i++) if (並び[i] === 射手.印[i]) 合++;
  合った射 += 合;
  全射 += 射手.印.length;
  if (合 === 射手.印.length) 合った人++;
  console.log(
    `${射手.名.padEnd(2)} ${合 === 射手.印.length ? '合う  ' : '★' + (射手.印.length - 合) + '射違う'} 読み=${並び}` +
      (合 === 射手.印.length ? '' : `\n                 記録=${射手.印}`)
  );
}
console.log(`\n射で ${合った射}/${全射} (${((100 * 合った射) / 全射).toFixed(1)}%)  ／ 人で ${合った人}/${人数} が完全一致`);
