/**
 * 板から切り出したマスで、網を何枚も学習させて多数決を取る。
 *
 *   node scripts/ocr-cells/muregaku.mjs [板の枚数] [網の数] [巡回数]
 *
 * ■ なぜ群れにするか
 * 網を1枚だけ学習させると、巡や種によって本物での当たりが 86〜96% と
 * 大きく振れた。どの巡を選ぶかで数字が変わり、選ぶときに本物を見てしまうと
 * その時点で「確かめ」ではなくなる。
 *
 * 種を変えた網を何枚も学習させ、答えを足し合わせて決めれば、振れが消えて
 * 巡を選ぶ必要もなくなる。重みは増えるが、1枚 790KB なので数枚でも収まる。
 *
 * 本物80マスは一度も学習に使わない。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 板をえがく } from './ban.mjs';
import { 格子, 箱の大きさ } from './kiridasu.mjs';
import { 種類, 形にする, 本物の見本, 網をつくる, 前へ, 入, 切り取る } from './manabu.mjs';

const 板の枚数 = Number(process.argv[2]) || 120;
const 網の数 = Number(process.argv[3]) || 7;
const 巡回数 = Number(process.argv[4]) || 6;
const 隠れ = Number(process.argv[5]) || 96;
const 置き場 = (process.env.TEMP || '.') + '/ocr-ban2';
fs.mkdirSync(置き場, { recursive: true });

/** 板を描いて、本物と同じ切り出しでマスを取る */
async function 見本をあつめる(枚数) {
  const 出 = [];
  let 外れ = 0;
  for (let i = 0; i < 枚数; i++) {
    const 人数 = [4, 6, 8, 8, 8, 10, 12][i % 7];
    const 行数 = [8, 10, 10, 10, 12, 6][i % 6];
    const 立の人数 = [3, 4, 4, 4, 5][i % 5];
    const b = 板をえがく({ 種: 3000 + i * 6961, 人数, 行数, 立の人数, 幅: 2000 });
    const みち = `${置き場}/b${i}.jpg`;
    await sharp(Buffer.from(b.色), { raw: { width: b.幅, height: b.高, channels: 3 } })
      .jpeg({ quality: 88 })
      .toFile(みち);
    let g;
    try {
      g = await 格子(みち, { 人数, 行数 });
    } catch (e) {
      外れ++;
      fs.rmSync(みち, { force: true });
      continue;
    }
    const 合う =
      g.列.length === 人数 &&
      g.列.every((c, k) => Math.abs(c.中心 - b.答え.列のx[k]) <= b.答え.マス * 0.35) &&
      g.行.位置.length === 行数 &&
      g.行.位置.every((y, r) => Math.abs(y - b.答え.行のy[r]) <= b.答え.マス * 0.35);
    if (!合う) {
      外れ++;
      fs.rmSync(みち, { force: true });
      continue;
    }
    const { 半幅, 半高 } = 箱の大きさ(g);
    // 板は1回だけ開く。マスごとに開き直すと、1枚の板で80回もJPEGを解くことになり、
    // 板120枚で数十分かかっていた
    const { data: 板の画, info: 板の形 } = await sharp(みち).greyscale().raw().toBuffer({ resolveWithObject: true });
    // 切り出しの位置を、少しずつずらした写しも作る。
    //
    // 描いた板は格子がぴたりと合うので、そのまま学習させると「真ん中に
    // きちんと収まった印」しか知らない網になる。本物の写真では、行の位置が
    // どうしても少しずれる。実測で、格子の当てはめを良くしたら生成側だけが
    // きれいになり、本物での当たりが 93.8% から 83.1% に落ちた。
    const 幅 = Number(process.env.OCR_YURAGI) || 0.13;
    const ずらし = [
      [0, 0],
      [0, -幅],
      [0, 幅],
      [-幅 * 0.8, 幅 * 0.45],
      [幅 * 0.8, -幅 * 0.45],
      [幅 * 0.5, 幅 * 0.8],
      [-幅 * 0.5, -幅 * 0.8],
    ];
    for (let c = 0; c < g.列.length; c++) {
      for (let r = 0; r < g.行.位置.length; r++) {
        const k = 種類.indexOf(b.答え.マスの中身[c][r]);
        if (k < 0) continue;
        for (const [dx, dy] of ずらし) {
          const 左 = Math.max(0, Math.round(g.列[c].中心 + dx * g.印の幅) - 半幅);
          const 上 = Math.max(0, Math.round(g.行.位置[r] + (g.列[c].ずれ || 0) + dy * g.行.間隔) - 半高);
          const 切 = 切り取る(板の画, 板の形.width, 板の形.height, 左, 上, 半幅 * 2, 半高 * 2);
          出.push({ 形: await 形にする(切.画, 切.幅, 切.高), 札: k });
        }
      }
    }
    fs.rmSync(みち, { force: true });
  }
  return { 見本: 出, 外れ };
}

/** 網を1枚学習させる */
function 学習(見本, 種, 巡回) {
  const 網 = 網をつくる(隠れ, 種);
  const 学ぶ速さ = Number(process.env.OCR_LR) || 0.003;
  const 慣性 = 0.9;
  const vW1 = new Float32Array(網.W1.length);
  const vb1 = new Float32Array(網.b1.length);
  const vW2 = new Float32Array(網.W2.length);
  const vb2 = new Float32Array(網.b2.length);
  const 途中 = { h: new Float32Array(隠れ), o: new Float32Array(種類.length) };
  const dh = new Float32Array(隠れ);
  const do_ = new Float32Array(種類.length);
  let s = (種 * 2654435761) >>> 0;
  const 乱 = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const 並び = 見本.slice();
  for (let 巡 = 0; 巡 < 巡回; 巡++) {
    for (let i = 並び.length - 1; i > 0; i--) {
      const j = Math.floor(乱() * (i + 1));
      const t = 並び[i];
      並び[i] = 並び[j];
      並び[j] = t;
    }
    for (const x of 並び) {
      const { h, o } = 前へ(網, x.形, 途中);
      for (let k = 0; k < 種類.length; k++) do_[k] = o[k] - (k === x.札 ? 1 : 0);
      dh.fill(0);
      for (let k = 0; k < 種類.length; k++) {
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

/** 群れで決める */
export function 群れで決める(群れ, 形) {
  const 合 = new Float32Array(種類.length);
  for (const 網 of 群れ) {
    const { o } = 前へ(網, 形);
    for (let k = 0; k < 種類.length; k++) 合[k] += o[k];
  }
  let 最 = 0;
  for (let k = 1; k < 種類.length; k++) if (合[k] > 合[最]) 最 = k;
  return { 番: 最, 記号: 種類[最], 確からしさ: 合[最] / 群れ.length };
}

// 本物のマスは scripts/ocr-cells/honmono.mjs で切り出しておく。
// 切り方の設定（OCR_HABA など）を変えたら、そちらも走らせ直すこと。
const t0 = Date.now();
const { 見本, 外れ } = await 見本をあつめる(板の枚数);
// 本物は2枚ある。左＝自校（名札が色枠）、右＝相手校（板に直書き）。
// 別の板・別の人の字なので、片方で学んで他方で測れば正直な数字になる
const 板たち = [
  { 名: '左の板', 見本: await 本物の見本('docs/ocr-samples/cells') },
  { 名: '右の板', 見本: await 本物の見本('docs/ocr-samples/cells-migi') },
];
// 板を指名されていれば、それを学習側に足す（残りの板で測る）。
// 本物は80枚しかなく、描いた板は4万枚を超えるので、そのまま足しても埋もれる。
// 何度も繰り返して重みを持たせる
const 混ぜる = process.env.OCR_MAZERU || '';
const 繰り返し = Number(process.env.OCR_MAZERU_KAI) || 200;
for (const b of 板たち) {
  if (混ぜる && b.名.includes(混ぜる)) {
    for (let n = 0; n < 繰り返し; n++) for (const x of b.見本) 見本.push({ 形: x.形, 札: x.札 });
    b.学習に使った = true;
  }
}
const 確かめ = 板たち.flatMap((b) => (b.学習に使った ? [] : b.見本));
console.log('本物: ' + 板たち.map((b) => `${b.名} ${b.見本.length}枚${b.学習に使った ? '（学習に混ぜた）' : ''}`).join(' / '));
console.log(
  `板 ${板の枚数}枚 → マス ${見本.length}枚（外れた板 ${外れ}枚）  ${((Date.now() - t0) / 1000).toFixed(1)}秒`
);

const 群れ = [];
for (let i = 0; i < 網の数; i++) {
  const 網 = 学習(見本, 1000 + i * 7717, 巡回数);
  群れ.push(網);
  let 単 = 0;
  for (const x of 確かめ) {
    const { o } = 前へ(網, x.形);
    let 最 = 0;
    for (let k = 1; k < 種類.length; k++) if (o[k] > o[最]) 最 = k;
    if (最 === x.札) 単++;
  }
  let 群 = 0;
  for (const x of 確かめ) if (群れで決める(群れ, x.形).番 === x.札) 群++;
  console.log(`  ${i + 1}枚目  この網ひとつ=${単}/${確かめ.length}  群れ(${群れ.length}枚)=${群}/${確かめ.length}` +
      ` (${((100 * 群) / Math.max(1, 確かめ.length)).toFixed(1)}%)`);
}

const 表 = 種類.map(() => 種類.map(() => 0));
const 外れた = [];
let 当 = 0;
for (const b of 板たち) {
  let 板当 = 0;
  for (const x of b.見本) {
    const r = 群れで決める(群れ, x.形);
    if (r.番 === x.札) 板当++;
    if (b.学習に使った) continue;
    表[x.札][r.番]++;
    if (r.番 === x.札) 当++;
    else 外れた.push(`${b.名} ${x.名} 正=${種類[x.札]} 読=${r.記号} 確=${r.確からしさ.toFixed(2)}`);
  }
  console.log(
    `  ${b.名}: ${板当}/${b.見本.length} (${((100 * 板当) / b.見本.length).toFixed(1)}%)` +
      (b.学習に使った ? '  ※学習に混ぜた板なので参考' : '')
  );
}
console.log(
  `
測った分の当たり: ${当}/${確かめ.length} (${((100 * 当) / Math.max(1, 確かめ.length)).toFixed(1)}%)`
);
console.log('取り違え（縦が正、横が答え）:');
console.log('        ' + 種類.map((s) => s.padEnd(4)).join(''));
for (let i = 0; i < 種類.length; i++) {
  console.log('  ' + 種類[i].padEnd(4) + '  ' + 表[i].map((v) => String(v).padEnd(4)).join(''));
}
if (外れた.length) console.log('\n外れたマス:\n  ' + 外れた.join('\n  '));

fs.writeFileSync(
  'scripts/ocr-cells/mure.json',
  JSON.stringify({
    辺: 20,
    種類,
    網たち: 群れ.map((n) => ({
      隠れ: n.隠れ,
      W1: Array.from(n.W1),
      b1: Array.from(n.b1),
      W2: Array.from(n.W2),
      b2: Array.from(n.b2),
    })),
  })
);
console.log('\n重みを書きました: scripts/ocr-cells/mure.json');
