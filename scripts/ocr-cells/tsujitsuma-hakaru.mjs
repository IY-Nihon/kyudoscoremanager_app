/**
 * 辻褄合わせがどれだけ効くかを、本物のマスで測る。
 *
 *   node scripts/ocr-cells/tsujitsuma-hakaru.mjs
 *
 * 板に書かれた的中数は、写真から人が読んで kiroku.mjs に入れてある。
 * 実際に使うときは、数字は文字として読み取ることになる（数字なら読める）。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { 種類, 形にする, 前へ } from './manabu.mjs';
import { 射手たち } from './kiroku.mjs';
import { 的中数に合わせる } from './tsujitsuma.mjs';

const 逆 = String.fromCharCode(92);
const 札の名 = { batsu: '\u00d7', maru2: '\u25ce', maru_gyaku: '\u25cb' + 逆, maru_seki: '\u25cb/' };

// 半板ごとに、板の左から右へ並ぶ射手の番号（honmono.mjs と同じ）
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

// マスを、半板・列ごとに集める
const 列ごと = new Map();
for (const 根 of ['docs/ocr-samples/cells', 'docs/ocr-samples/cells-migi']) {
  for (const 札 of fs.readdirSync(根)) {
    const k = 種類.indexOf(札の名[札]);
    if (k < 0) continue;
    for (const 名 of fs.readdirSync(path.join(根, 札))) {
      const m = /^(.+)-r(\d+)c(\d+)\.png$/.exec(名);
      if (!m) continue;
      const 鍵 = m[1] + '/' + m[3];
      if (!列ごと.has(鍵)) 列ごと.set(鍵, []);
      列ごと.get(鍵).push({ 行: Number(m[2]), 札: k, みち: path.join(根, 札, 名) });
    }
  }
}

let 前当 = 0;
let 後当 = 0;
let 全 = 0;
let 直した = 0;
let 直して悪化 = 0;
const 残り = [];
for (const [鍵, マスたち] of [...列ごと].sort()) {
  const [半, 列] = 鍵.split('/');
  const 射手番 = 半板[半][Number(列)];
  const 的中 = 射手たち[射手番].的中;
  マスたち.sort((a, b) => a.行 - b.行);
  const 見立て = [];
  for (const c of マスたち) {
    const { data, info } = await sharp(c.みち).greyscale().raw().toBuffer({ resolveWithObject: true });
    見立て.push(見立てる(await 形にする(data, info.width, info.height)));
  }
  const { 番 } = 的中数に合わせる(見立て, 種類, 的中);
  マスたち.forEach((c, i) => {
    let 最 = 0;
    for (let k = 1; k < 種類.length; k++) if (見立て[i][k] > 見立て[i][最]) 最 = k;
    全++;
    if (最 === c.札) 前当++;
    if (番[i] === c.札) 後当++;
    if (番[i] !== 最) {
      直した++;
      if (最 === c.札 && 番[i] !== c.札) 直して悪化++;
    }
    if (番[i] !== c.札) {
      残り.push(
        `${c.みち.split(/[\/]/).pop()} 正=${種類[c.札]} 読=${種類[最]}→${種類[番[i]]} 的中=${的中}`
      );
    }
  });
}
console.log(`辻褄合わせの前: ${前当}/${全} (${((100 * 前当) / 全).toFixed(1)}%)`);
console.log(`辻褄合わせの後: ${後当}/${全} (${((100 * 後当) / 全).toFixed(1)}%)`);
const 改 = String.fromCharCode(10);
if (残り.length) console.log('残った外れ:' + 改 + '  ' + 残り.join(改 + '  '));
console.log(`読み直したマス: ${直した}枚（うち、正しかったものを壊した: ${直して悪化}枚）`);
