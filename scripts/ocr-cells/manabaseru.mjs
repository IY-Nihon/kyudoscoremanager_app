/**
 * 描いた見本で小さな網を学習させ、本物のマスで測る。
 *
 *   node scripts/ocr-cells/manabaseru.mjs [一種類あたり] [巡回数] [隠れ]
 *
 * 本物80マスは一度も学習に使わない。効いたのか覚えただけなのかを
 * 分けるため、確かめにだけ使う。
 */
import fs from 'node:fs';
import { 種類, 描いた見本, 本物の見本, 網をつくる, 前へ, 測る, 入 } from './manabu.mjs';

const 一種類あたり = Number(process.argv[2]) || 2000;
const 巡回数 = Number(process.argv[3]) || 20;
const 隠れ = Number(process.argv[4]) || 96;

console.log(`描く枚数: ${一種類あたり}/種類  巡回: ${巡回数}  隠れ: ${隠れ}`);
const t0 = Date.now();
const 学び = await 描いた見本(一種類あたり);
const 確かめ = await 本物の見本('docs/ocr-samples/cells');
console.log(`見本を用意: 描いた ${学び.length}枚 / 本物 ${確かめ.length}枚  ${((Date.now() - t0) / 1000).toFixed(1)}秒`);

const 網 = 網をつくる(隠れ, 20260909);
const 学ぶ速さ = Number(process.env.OCR_LR) || 0.005;
const 慣性 = 0.9;
const vW1 = new Float32Array(網.W1.length);
const vb1 = new Float32Array(網.b1.length);
const vW2 = new Float32Array(網.W2.length);
const vb2 = new Float32Array(網.b2.length);
const 途中 = { h: new Float32Array(隠れ), o: new Float32Array(種類.length) };
const dh = new Float32Array(隠れ);
const do_ = new Float32Array(種類.length);

let 種 = 987654321;
const 乱 = () => {
  種 = (種 * 1664525 + 1013904223) >>> 0;
  return 種 / 4294967296;
};

let 最良 = { 当たり: -1 };
for (let 巡 = 1; 巡 <= 巡回数; 巡++) {
  // 順を混ぜる
  for (let i = 学び.length - 1; i > 0; i--) {
    const j = Math.floor(乱() * (i + 1));
    const t = 学び[i];
    学び[i] = 学び[j];
    学び[j] = t;
  }
  let 損 = 0;
  for (const s of 学び) {
    const { h, o } = 前へ(網, s.形, 途中);
    損 += -Math.log(Math.max(1e-9, o[s.札]));
    for (let k = 0; k < 種類.length; k++) do_[k] = o[k] - (k === s.札 ? 1 : 0);
    dh.fill(0);
    for (let k = 0; k < 種類.length; k++) {
      const 基 = k * 隠れ;
      const g = do_[k];
      if (0 === g) continue;
      for (let j = 0; j < 隠れ; j++) {
        dh[j] += 網.W2[基 + j] * g;
        vW2[基 + j] = 慣性 * vW2[基 + j] - 学ぶ速さ * g * h[j];
        網.W2[基 + j] += vW2[基 + j];
      }
      vb2[k] = 慣性 * vb2[k] - 学ぶ速さ * g;
      網.b2[k] += vb2[k];
    }
    for (let j = 0; j < 隠れ; j++) {
      if (h[j] <= 0) continue;
      const g = dh[j];
      if (0 === g) continue;
      const 基 = j * 入;
      for (let i = 0; i < 入; i++) {
        const x = s.形[i];
        if (0 === x) continue;
        vW1[基 + i] = 慣性 * vW1[基 + i] - 学ぶ速さ * g * x;
        網.W1[基 + i] += vW1[基 + i];
      }
      vb1[j] = 慣性 * vb1[j] - 学ぶ速さ * g;
      網.b1[j] += vb1[j];
    }
  }
  const 描 = 測る(網, 学び);
  const 本 = 測る(網, 確かめ);
  console.log(
    `巡 ${String(巡).padStart(2)}  損=${(損 / 学び.length).toFixed(4)}` +
      `  描いた=${((100 * 描.当たり) / 描.全).toFixed(1)}%` +
      `  本物=${本.当たり}/${本.全} (${((100 * 本.当たり) / 本.全).toFixed(1)}%)`
  );
  if (本.当たり > 最良.当たり) {
    最良 = {
      当たり: 本.当たり,
      巡,
      表: 本.表,
      重み: { 隠れ, W1: Array.from(網.W1), b1: Array.from(網.b1), W2: Array.from(網.W2), b2: Array.from(網.b2) },
    };
  }
}

console.log(`\nいちばん良かったのは巡 ${最良.巡}: 本物 ${最良.当たり}/${確かめ.length} (${((100 * 最良.当たり) / 確かめ.length).toFixed(1)}%)`);
console.log('取り違え（縦が正、横が答え）:');
console.log('        ' + 種類.map((s) => s.padEnd(4)).join(''));
for (let i = 0; i < 種類.length; i++) {
  console.log('  ' + 種類[i].padEnd(4) + '  ' + 最良.表[i].map((v) => String(v).padEnd(4)).join(''));
}
fs.writeFileSync('scripts/ocr-cells/omomi.json', JSON.stringify(最良.重み));
console.log('\n重みを書きました: scripts/ocr-cells/omomi.json');
