/**
 * 縦（射手ごとの的中数）と横（立ごとの小計）の両方で辻褄を合わせ、
 * どれだけ当たるようになるかを本物のマスで測る。
 *
 *   node scripts/ocr-cells/tsujitsuma2-hakaru.mjs
 *
 * 数字（的中数・小計）は板に書かれているものを使う前提。ここでは記録から
 * 出しているが、実際は写真から読み取ることになる（数字なら読める）。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { 種類, 形にする, 前へ } from './manabu.mjs';
import { 射手たち } from './kiroku.mjs';
import { 的中数, 的中数に合わせる } from './tsujitsuma.mjs';
import { 縦横で合わせる } from './tsujitsuma2.mjs';

const 逆 = String.fromCharCode(92);
const 札の名 = { batsu: '×', maru2: '◎', maru_gyaku: '○' + 逆, maru_seki: '○/' };
const 立のマス = 2; // 4射で1立、1マスに2射

const 半板 = {
  'hidari-a': [0, 1, 2, 3],
  'hidari-b': [4, 5, 6, 7],
  'migi-a': [15, 14, 13, 12],
  'migi-b': [11, 10, 9, 8],
};

const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/mure.json', 'utf8'));
const 群れ = 重み.網たち.map((n) => ({
  隠れ: n.隠れ,
  W1: Float32Array.from(n.W1),
  b1: Float32Array.from(n.b1),
  W2: Float32Array.from(n.W2),
  b2: Float32Array.from(n.b2),
}));
const 見立てる = (形) => {
  const 合 = new Float32Array(種類.length);
  for (const 網 of 群れ) {
    const { o } = 前へ(網, 形);
    for (let k = 0; k < 種類.length; k++) 合[k] += o[k];
  }
  for (let k = 0; k < 種類.length; k++) 合[k] /= 群れ.length;
  return 合;
};

// マスを、半板・列・行で並べ直す
const 集め = new Map();
for (const 根 of ['docs/ocr-samples/cells', 'docs/ocr-samples/cells-migi']) {
  for (const 札 of fs.readdirSync(根)) {
    const k = 種類.indexOf(札の名[札]);
    if (k < 0) continue;
    for (const 名 of fs.readdirSync(path.join(根, 札))) {
      const m = /^(.+)-r(\d+)c(\d+)\.png$/.exec(名);
      if (!m) continue;
      if (!集め.has(m[1])) 集め.set(m[1], []);
      集め.get(m[1]).push({ 列: Number(m[3]), 行: Number(m[2]), 札: k, みち: path.join(根, 札, 名) });
    }
  }
}

let 素当 = 0;
let 縦当 = 0;
let 縦横当 = 0;
let 全 = 0;
const 残り = [];
for (const [半, マスたち] of [...集め].sort()) {
  const 番号 = 半板[半];
  const 人数 = 番号.length;
  const 行数 = 1 + Math.max(...マスたち.map((c) => c.行));
  const 並び = [];
  const 正 = [];
  for (let a = 0; a < 人数; a++) {
    並び.push(new Array(行数));
    正.push(new Array(行数));
  }
  for (const c of マスたち) 正[c.列][c.行] = c;
  for (let a = 0; a < 人数; a++) {
    for (let r = 0; r < 行数; r++) {
      const c = 正[a][r];
      const { data, info } = await sharp(c.みち).greyscale().raw().toBuffer({ resolveWithObject: true });
      並び[a][r] = 見立てる(await 形にする(data, info.width, info.height));
    }
  }

  const 的中たち = 番号.map((i) => 射手たち[i].的中);
  // 立ごとの小計。板に書かれている数字（ここでは答えから出す）
  const 立数 = 行数 / 立のマス;
  const 小計 = new Array(立数).fill(0);
  for (let a = 0; a < 人数; a++) {
    for (let r = 0; r < 行数; r++) 小計[Math.floor(r / 立のマス)] += 的中数[種類[正[a][r].札]];
  }

  const 縦だけ = [];
  for (let a = 0; a < 人数; a++) 縦だけ.push(的中数に合わせる(並び[a], 種類, 的中たち[a]).番);
  const { 番: 縦横, 訳 } = 縦横で合わせる(並び, 種類, 的中たち, 小計, 立のマス);
  if (!縦横) console.log(`${半}: 縦横で合わせられません（${訳}）`);

  for (let a = 0; a < 人数; a++) {
    for (let r = 0; r < 行数; r++) {
      let 素 = 0;
      for (let k = 1; k < 種類.length; k++) if (並び[a][r][k] > 並び[a][r][素]) 素 = k;
      const 真 = 正[a][r].札;
      全++;
      if (素 === 真) 素当++;
      if (縦だけ[a][r] === 真) 縦当++;
      const 後 = 縦横 ? 縦横[a][r] : 縦だけ[a][r];
      if (後 === 真) 縦横当++;
      else 残り.push(`${半} r${r}c${a} 正=${種類[真]} 読=${種類[素]}→${種類[後]}`);
    }
  }
}
const 割 = (n) => `${n}/${全} (${((100 * n) / 全).toFixed(1)}%)`;
console.log(`そのまま      : ${割(素当)}`);
console.log(`縦だけ合わせる: ${割(縦当)}`);
console.log(`縦と横で合わす: ${割(縦横当)}`);
const 改 = String.fromCharCode(10);
if (残り.length) console.log('残った外れ:' + 改 + '  ' + 残り.join(改 + '  '));
