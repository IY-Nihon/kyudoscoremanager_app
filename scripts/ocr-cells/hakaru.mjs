/**
 * 書き出した重み（mure.json）を、本物のマスで測る。
 *
 *   node scripts/ocr-cells/hakaru.mjs docs/ocr-samples/cells docs/ocr-samples/cells-migi
 */

import fs from 'node:fs';
import { 種類, 前へ } from './manabu.mjs';
import { 本物の見本 } from './manabu-node.mjs';
const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/mure.json', 'utf8'));
const 群れ = 重み.網たち.map((n) => ({
  隠れ: n.隠れ, W1: Float32Array.from(n.W1), b1: Float32Array.from(n.b1),
  W2: Float32Array.from(n.W2), b2: Float32Array.from(n.b2),
}));
for (const 根 of process.argv.slice(2)) {
  const 見本 = await 本物の見本(根);
  const 表 = 種類.map(() => 種類.map(() => 0));
  let 当 = 0;
  for (const x of 見本) {
    const 合 = new Float32Array(種類.length);
    for (const 網 of 群れ) { const { o } = 前へ(網, x.形); for (let k = 0; k < 種類.length; k++) 合[k] += o[k]; }
    let 最 = 0;
    for (let k = 1; k < 種類.length; k++) if (合[k] > 合[最]) 最 = k;
    表[x.札][最]++;
    if (最 === x.札) 当++;
  }
  console.log(`${根}: ${当}/${見本.length} (${((100 * 当) / 見本.length).toFixed(1)}%)`);
  console.log('        ' + 種類.map((s) => s.padEnd(4)).join(''));
  for (let i = 0; i < 種類.length; i++) console.log('  ' + 種類[i].padEnd(4) + '  ' + 表[i].map((v) => String(v).padEnd(4)).join(''));
}
