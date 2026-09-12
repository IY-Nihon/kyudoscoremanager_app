/**
 * 描いた板で、格子が正しく立つかを数える（列の選び方の見張り）。
 *
 *   node scripts/ocr-cells/koushi-tameshi.mjs
 *
 * 4人ごとに小計の列が挟まる板で、射手の列を取り違えないかを見る。
 * 列の選び方を「間隔の揃った連続する列」に変えたとき、ここが 30/30 → 17/30 に
 * 落ちた。4人ずつの切り抜きの試験だけでは気づけないので、これを残す。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 板をえがく } from './ban.mjs';
import { 格子 } from './kiridasu.mjs';
import { 画を読む, 回す } from './gazou-node.mjs';
const 置き = process.env.TEMP + '/hachinin';
fs.mkdirSync(置き, { recursive: true });
let 立 = 0, 合 = 0, 全 = 0, 見当 = 0;
for (let i = 0; i < 30; i++) {
  const 人数 = [4, 6, 8, 8, 10, 12][i % 6];
  const 行数 = [8, 10, 10, 12][i % 4];
  const 立の人数 = [3, 4, 4, 5][i % 4];
  const b = 板をえがく({ 種: 500 + i * 331, 人数, 行数, 立の人数, 幅: 2000 });
  const みち = `${置き}/b${i}.jpg`;
  await sharp(Buffer.from(b.色), { raw: { width: b.幅, height: b.高, channels: 3 } }).jpeg({ quality: 88 }).toFile(みち);
  全++;
  let g;
  try { g = await 格子(await 画を読む(みち), { 人数, 行数, 回す }); } catch (e) { continue; }
  立++;
  const ok = g.列.length === 人数 && g.列.every((c, k) => Math.abs(c.中心 - b.答え.列のx[k]) <= b.答え.マス * 0.35)
    && g.行.位置.length === 行数 && g.行.位置.every((y, r) => Math.abs(y - b.答え.行のy[r]) <= b.答え.マス * 0.35);
  if (ok) 合++;
  // 人数を当てにしない列の見当（Gemini の行の数が板と違うときに使う）
  if (g.列の見当 === 人数) 見当++;
  else console.log(`  板${i}: 列の見当 ${g.列の見当} ≠ 人数 ${人数}`);
}
console.log(`描いた板 ${全}枚: 格子が立った ${立}枚、列と行が答えと合った ${合}枚、列の見当が人数と合った ${見当}枚`);
