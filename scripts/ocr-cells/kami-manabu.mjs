/**
 * 描いた紙でマスの ○× を学ばせ、本物の紙（女子リーグ80マス）で測る。
 *
 *   node scripts/ocr-cells/kami-manabu.mjs [紙の枚数] [網の数] [巡回数]
 *
 * 本物80マスは一度も学習に使わない。板と同じ段取り（描いて学ぶ・本物で測る）。
 * 出は2つ（× と ○）。板の網とは別の重み（kami-omomi.json）。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 紙をえがく } from './kami-ban.mjs';
import { 紙の格子, 紙の箱 } from './kami.mjs';
import { 形にする, 網をつくる, 前へ, 入, 切り取る } from './manabu.mjs';
import { 明暗を伸ばす } from './koushi.mjs';
import { 網を丸める } from './chiisaku.mjs';
import { ゆがませる } from './kuzusu.mjs';

let 崩しの種 = 424242;
const 乱れ = () => {
  崩しの種 = (崩しの種 * 1664525 + 1013904223) >>> 0;
  return 崩しの種 / 4294967296;
};

export const 紙の種類 = ['×', '○'];
const 紙の枚数 = Number(process.argv[2]) || 60;
const 網の数 = Number(process.argv[3]) || 5;
const 巡回数 = Number(process.argv[4]) || 5;
const 隠れ = 64;

/** 描いた紙からマスを集める。格子が立つかも数える */
async function 見本をあつめる(枚数) {
  const 出 = [];
  let 格子が立った = 0;
  for (let i = 0; i < 枚数; i++) {
    const b = 紙をえがく({ 種: 7000 + i * 4111 });
    const 生 = { 画素: 明暗を伸ばす(b.白黒), 幅: b.幅, 高: b.高 };
    // 格子の見張り。表の部分（見出しの下から表の下まで、小計込み）を渡す
    try {
      const 上 = Math.round(b.答え.射のy[b.答え.射のy.length - 1] - b.答え.マス高 / 2) - 2;
      const 下 = Math.round(b.答え.射のy[0] + b.答え.マス高 / 2) + 2;
      const 左 = Math.round(b.答え.列のx[0] - b.答え.マス幅 / 2) - 2;
      const 切 = 切り取る(b.白黒, b.幅, b.高, 左, 上, b.幅 - 左, 下 - 上);
      const g = await 紙の格子({ 画素: 切.画, 幅: 切.幅, 高: 切.高 }, { 人数: b.答え.人数, 立数: b.答え.立数, 立のマス: b.答え.立のマス });
      const 合う =
        g.列.every((c, k) => Math.abs(c.中心 + 左 - b.答え.列のx[k]) <= b.答え.マス幅 * 0.3) &&
        g.マス[0].every((m, s) => Math.abs(m.y + 上 - b.答え.射のy[s]) <= b.答え.マス高 * 0.3);
      if (合う) 格子が立った++;
    } catch (e) {
      // 立たなかった紙は数えないだけ
    }
    // 学習のマスは答えの位置から切る。位置を少しずつゆらす（本物では格子が少しずれる）
    const 箱 = 紙の箱({ 幅: b.答え.マス幅, 高: b.答え.マス高 });
    // 上下のずれは ±0.15 まで。±0.28 まで混ぜたら逆に落ちた（隣の弧まで印と
    // 覚えてしまう。80/80 → 78/80）
    const ずらし = [[0, 0], [0, -0.15], [0, 0.15], [-0.12, 0.08], [0.12, -0.08]];
    for (let c = 0; c < b.答え.人数; c++) {
      for (let s = 0; s < b.答え.マス[c].length; s++) {
        const k = 紙の種類.indexOf(b.答え.マス[c][s]);
        for (const [dx, dy] of ずらし) {
          const 左 = Math.round(b.答え.列のx[c] + dx * b.答え.マス幅) - 箱.半幅;
          const 上 = Math.round(b.答え.射のy[s] + dy * b.答え.マス高) - 箱.半高;
          let 切 = 切り取る(生.画素, 生.幅, 生.高, 左, 上, 箱.半幅 * 2, 箱.半高 * 2);
          // 写真の崩れ（ざらつき・ぼけ・低解像度・暗さ）をマスに混ぜる手は既定で切ってある。
          // 紙では効きも害も無かった（崩し18通りの 80/80 の数が変わらず）。OCR_KUZUSHI=1 で入る
          if (process.env.OCR_KUZUSHI === '1' && 乱れ() < 0.5) {
            const 味 = ゆがませる(
              { 画: 切.画, 幅: 切.幅, 高: 切.高, 面: 1 },
              {
                明るさ: 0.6 + 乱れ() * 0.5,
                締まり: 0.5 + 乱れ() * 0.6,
                ざらつき: 乱れ() < 0.6 ? 乱れ() * 45 : 0,
                ぼかし: 乱れ() < 0.5 ? 乱れ() * 切.幅 * 0.08 : 0,
                縮小: 乱れ() < 0.4 ? 0.5 + 乱れ() * 0.45 : 1,
                種: Math.floor(乱れ() * 2147483647),
              }
            );
            切 = { 画: 味.画, 幅: 味.幅, 高: 味.高 };
          }
          出.push({ 形: await 形にする(切.画, 切.幅, 切.高, 'そのまま'), 札: k });
        }
      }
    }
  }
  return { 見本: 出, 格子が立った };
}

async function 本物をよむ(根) {
  const 出 = [];
  for (const [札, k] of [['batsu', 0], ['maru', 1]]) {
    for (const 名 of fs.readdirSync(`${根}/${札}`)) {
      const { data, info } = await sharp(`${根}/${札}/${名}`).greyscale().raw().toBuffer({ resolveWithObject: true });
      出.push({ 形: await 形にする(data, info.width, info.height, 'そのまま'), 札: k, 名: `${札}/${名}` });
    }
  }
  return 出;
}

function 学習(見本, 種, 巡回) {
  const 網 = 網をつくる(隠れ, 種, 紙の種類.length);
  const 出 = 紙の種類.length;
  const 学ぶ速さ = 0.003;
  const 慣性 = 0.9;
  const vW1 = new Float32Array(網.W1.length);
  const vb1 = new Float32Array(網.b1.length);
  const vW2 = new Float32Array(網.W2.length);
  const vb2 = new Float32Array(網.b2.length);
  const 途中 = { h: new Float32Array(隠れ), o: new Float32Array(出) };
  const dh = new Float32Array(隠れ);
  const do_ = new Float32Array(出);
  let s = (種 * 2654435761) >>> 0;
  const 乱 = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const 並び = 見本.slice();
  for (let 巡 = 0; 巡 < 巡回; 巡++) {
    for (let i = 並び.length - 1; i > 0; i--) {
      const j = Math.floor(乱() * (i + 1));
      [並び[i], 並び[j]] = [並び[j], 並び[i]];
    }
    for (const x of 並び) {
      const { h, o } = 前へ(網, x.形, 途中);
      for (let k = 0; k < 出; k++) do_[k] = o[k] - (k === x.札 ? 1 : 0);
      dh.fill(0);
      for (let k = 0; k < 出; k++) {
        const 基 = k * 隠れ;
        const g = do_[k];
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
          const v = x.形[i];
          if (0 === v) continue;
          vW1[基 + i] = 慣性 * vW1[基 + i] - 学ぶ速さ * g * v;
          網.W1[基 + i] += vW1[基 + i];
        }
        vb1[j] = 慣性 * vb1[j] - 学ぶ速さ * g;
        網.b1[j] += vb1[j];
      }
    }
  }
  return 網;
}

const 決める = (群れ, 形) => {
  const 合 = new Float32Array(紙の種類.length);
  for (const 網 of 群れ) {
    const { o } = 前へ(網, 形);
    for (let k = 0; k < 合.length; k++) 合[k] += o[k] / 群れ.length;
  }
  return 合[1] > 合[0] ? 1 : 0;
};

const t0 = Date.now();
const { 見本, 格子が立った } = await 見本をあつめる(紙の枚数);
const 本物 = await 本物をよむ('docs/ocr-samples/cells-kami');
console.log(
  `紙 ${紙の枚数}枚 → マス ${見本.length}枚（格子が答えと合った紙 ${格子が立った}/${紙の枚数}）` +
    `  本物 ${本物.length}枚  ${((Date.now() - t0) / 1000).toFixed(1)}秒`
);
const 群れ = [];
for (let i = 0; i < 網の数; i++) {
  群れ.push(学習(見本, 1000 + i * 7717, 巡回数));
  let 当 = 0;
  for (const x of 本物) if (決める(群れ, x.形) === x.札) 当++;
  console.log(`  ${i + 1}枚目  群れ(${群れ.length}枚)=${当}/${本物.length} (${((100 * 当) / 本物.length).toFixed(1)}%)`);
}
const 外れた = [];
let 当 = 0;
for (const x of 本物) {
  const r = 決める(群れ, x.形);
  if (r === x.札) 当++;
  else 外れた.push(`${x.名} 正=${紙の種類[x.札]} 読=${紙の種類[r]}`);
}
console.log(`\n本物 ${当}/${本物.length} (${((100 * 当) / 本物.length).toFixed(1)}%)`);
if (外れた.length) console.log('外れ:\n  ' + 外れた.join('\n  '));
fs.writeFileSync(
  'scripts/ocr-cells/kami-omomi.json',
  JSON.stringify({ 辺: 20, 入, 種類: 紙の種類, 網たち: 群れ.map(網を丸める) })
);
console.log('重みを書きました: scripts/ocr-cells/kami-omomi.json');
