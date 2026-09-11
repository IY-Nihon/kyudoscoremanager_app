/**
 * 生成した板からマスを切り出して学習させ、本物のマスで測る。
 *
 *   node scripts/ocr-cells/ban-kara-manabu.mjs [板の枚数] [巡回数]
 *
 * ■ なぜ板から切り出すのか
 * 印だけを描いて学習させると、本物で76%止まりだった。本物のマスには、
 * 罫線の端、隣の印のはみ出し、マスに対する印の大きさの比といったものが
 * 写り込む。印だけを描いていては、それが再現できない。
 *
 * 板ごと描いて、**本物とまったく同じ切り出しの仕組み**を通してマスを取れば、
 * その写り込みごと学習できる。
 *
 * 本物80マスは一度も学習に使わない（確かめにだけ使う）。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 板をえがく } from './ban.mjs';
import { 格子 } from './kiridasu.mjs';
import { 種類, 形にする, 網をつくる, 前へ, 測る, 入 } from './manabu.mjs';
import { 本物の見本 } from './manabu-node.mjs';

const 板の枚数 = Number(process.argv[2]) || 40;
const 巡回数 = Number(process.argv[3]) || 8;
const 隠れ = Number(process.argv[4]) || 96;
const 仮の置き場 = (process.env.TEMP || '.') + '/ocr-ban';

fs.mkdirSync(仮の置き場, { recursive: true });

console.log(`板を ${板の枚数}枚 描いて、そこからマスを切り出します`);
const t0 = Date.now();
const 学び = [];
let 立たなかった = 0;
for (let i = 0; i < 板の枚数; i++) {
  const 人数 = [4, 6, 8, 8, 8, 10, 12][i % 7];
  const 行数 = [8, 10, 10, 10, 12, 6][i % 6];
  const 立の人数 = [3, 4, 4, 4, 5][i % 5];
  const b = 板をえがく({ 種: 1000 + i * 7919, 人数, 行数, 立の人数, 幅: 2000 });
  const みち = `${仮の置き場}/b${i}.jpg`;
  await sharp(Buffer.from(b.色), { raw: { width: b.幅, height: b.高, channels: 3 } })
    .jpeg({ quality: 88 })
    .toFile(みち);
  let g;
  try {
    g = await 格子(みち, { 人数, 行数 });
  } catch (e) {
    立たなかった++;
    continue;
  }
  // 列の並びが答えと合っているときだけ使う（合っていなければ札がずれる）
  const 合っている =
    g.列.length === 人数 &&
    g.列.every((c, k) => Math.abs(c.中心 - b.答え.列のx[k]) <= b.答え.マス * 0.35) &&
    g.行.位置.length === 行数 &&
    g.行.位置.every((y, r) => Math.abs(y - b.答え.行のy[r]) <= b.答え.マス * 0.35);
  if (!合っている) {
    立たなかった++;
    continue;
  }
  const 半幅 = Math.round(g.印の幅 * (Number(process.env.OCR_HABA) || 0.85));
  const 半高 = Math.round(Math.min(g.行.間隔 * 0.37, g.印の幅 * (Number(process.env.OCR_HABA) || 0.85)));
  for (let 列番 = 0; 列番 < g.列.length; 列番++) {
    for (let 行番 = 0; 行番 < g.行.位置.length; 行番++) {
      const 記号 = b.答え.マスの中身[列番][行番];
      const k = 種類.indexOf(記号);
      if (k < 0) continue;
      const 左 = Math.max(0, Math.round(g.列[列番].中心) - 半幅);
      const 上 = Math.max(0, Math.round(g.行.位置[行番]) - 半高);
      const w = Math.min(半幅 * 2, g.幅 - 左);
      const h = Math.min(半高 * 2, g.高 - 上);
      const { data, info } = await sharp(みち)
        .greyscale()
        .extract({ left: 左, top: 上, width: w, height: h })
        .raw()
        .toBuffer({ resolveWithObject: true });
      学び.push({ 形: await 形にする(data, info.width, info.height), 札: k });
    }
  }
  fs.rmSync(みち, { force: true });
}
const 確かめ = await 本物の見本('docs/ocr-samples/cells');
const 数え = 種類.map((s, k) => s + ':' + 学び.filter((x) => x.札 === k).length).join(' ');
console.log(
  `切り出したマス: ${学び.length}枚（${数え}）／格子が立たなかった板: ${立たなかった}枚` +
    `  ${((Date.now() - t0) / 1000).toFixed(1)}秒`
);
console.log(`確かめ（本物）: ${確かめ.length}枚`);

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
const 記録 = [];
for (let 巡 = 1; 巡 <= 巡回数; 巡++) {
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
      const g2 = do_[k];
      for (let j = 0; j < 隠れ; j++) {
        dh[j] += 網.W2[基 + j] * g2;
        vW2[基 + j] = 慣性 * vW2[基 + j] - 学ぶ速さ * g2 * h[j];
        網.W2[基 + j] += vW2[基 + j];
      }
      vb2[k] = 慣性 * vb2[k] - 学ぶ速さ * g2;
      網.b2[k] += vb2[k];
    }
    for (let j = 0; j < 隠れ; j++) {
      if (h[j] <= 0) continue;
      const g2 = dh[j];
      if (0 === g2) continue;
      const 基 = j * 入;
      for (let i = 0; i < 入; i++) {
        const x = s.形[i];
        if (0 === x) continue;
        vW1[基 + i] = 慣性 * vW1[基 + i] - 学ぶ速さ * g2 * x;
        網.W1[基 + i] += vW1[基 + i];
      }
      vb1[j] = 慣性 * vb1[j] - 学ぶ速さ * g2;
      網.b1[j] += vb1[j];
    }
  }
  const 描 = 測る(網, 学び);
  const 本 = 測る(網, 確かめ);
  記録.push(本.当たり);
  console.log(
    `巡 ${String(巡).padStart(2)}  損=${(損 / 学び.length).toFixed(4)}` +
      `  板から=${((100 * 描.当たり) / 描.全).toFixed(1)}%` +
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

const 後半 = 記録.slice(Math.max(0, 記録.length - 4));
console.log(
  `\nいちばん良い巡 ${最良.巡}: ${最良.当たり}/${確かめ.length} (${((100 * 最良.当たり) / 確かめ.length).toFixed(1)}%)` +
    `  ／ 終わりの4巡の平均: ${(後半.reduce((a, b) => a + b, 0) / 後半.length).toFixed(1)}/${確かめ.length}`
);
console.log('取り違え（縦が正、横が答え）:');
console.log('        ' + 種類.map((s) => s.padEnd(4)).join(''));
for (let i = 0; i < 種類.length; i++) {
  console.log('  ' + 種類[i].padEnd(4) + '  ' + 最良.表[i].map((v) => String(v).padEnd(4)).join(''));
}
fs.writeFileSync('scripts/ocr-cells/omomi.json', JSON.stringify(最良.重み));
console.log('\n重みを書きました: scripts/ocr-cells/omomi.json');
