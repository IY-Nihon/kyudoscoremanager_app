/**
 * 重みを小さくして、当たりがどれだけ落ちるかを測る。書き出しもする。
 *
 *   node scripts/ocr-cells/chiisaku.mjs          … 枚数と丸めの効きを並べて測る
 *   node scripts/ocr-cells/chiisaku.mjs 書き出す 3 … 網3枚を int8 で書き出す
 *
 * ■ なぜ要るか
 * mure.json は 7MB ある（網7枚 × 492×96 の重み、JSONの数字そのまま）。
 * アプリの束に入れるには大きい。減らし方は2つ。
 *
 *   ・網の枚数を減らす … そのぶん振れが戻る
 *   ・重みを int8 に丸める … 1つ4バイト→1バイト。base64 で持っても 1/3 になる
 *
 * どちらもどれだけ落ちるかは測らないと分からないので、ここで並べて測る。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { 種類, 形にする, 前へ, 入 } from './manabu.mjs';

const 逆 = String.fromCharCode(92);
const 札の名 = { batsu: '×', maru2: '◎', maru_gyaku: '○' + 逆, maru_seki: '○/' };

/** int8 に丸める。層ごとに、いちばん大きい値で割ってから127倍する */
export function 丸める(重み) {
  let 最大 = 0;
  for (const v of 重み) {
    const a = Math.abs(v);
    if (a > 最大) 最大 = a;
  }
  const 目盛 = 最大 / 127 || 1;
  const 粒 = new Int8Array(重み.length);
  for (let i = 0; i < 重み.length; i++) {
    const v = Math.round(重み[i] / 目盛);
    粒[i] = v > 127 ? 127 : v < -127 ? -127 : v;
  }
  return { 目盛, 粒: Buffer.from(粒.buffer).toString('base64') };
}

/** 丸めた重みを元に戻す */
export function ほどく(丸め) {
  // Buffer は使い回しの器の途中を指していることがある。byteOffset を渡さずに
  // .buffer だけ見ると、まったく別のところを読む（実測で当たりが3割に落ちた）
  const 箱 = Buffer.from(丸め.粒, 'base64');
  const 粒 = new Int8Array(箱.buffer, 箱.byteOffset, 箱.length);
  const 出 = new Float32Array(粒.length);
  for (let i = 0; i < 粒.length; i++) 出[i] = 粒[i] * 丸め.目盛;
  return 出;
}

/** 重みの入った物を読む。丸めた形でも、そのままの形でも受ける */
export function 重みを読む(みち) {
  const 中身 = JSON.parse(fs.readFileSync(みち, 'utf8'));
  return 中身.網たち.map((n) =>
    n.W1 && n.W1.粒
      ? 網をほどく(n)
      : {
          隠れ: n.隠れ,
          W1: Float32Array.from(n.W1),
          b1: Float32Array.from(n.b1),
          W2: Float32Array.from(n.W2),
          b2: Float32Array.from(n.b2),
        }
  );
}

/** 網ひとまとまりを、丸めた形に書き換える */
export function 網を丸める(網) {
  return {
    隠れ: 網.隠れ,
    W1: 丸める(網.W1),
    b1: Array.from(網.b1),
    W2: 丸める(網.W2),
    b2: Array.from(網.b2),
  };
}

/** 丸めた形から、動かせる網に戻す */
export function 網をほどく(丸め) {
  return {
    隠れ: 丸め.隠れ,
    W1: ほどく(丸め.W1),
    b1: Float32Array.from(丸め.b1),
    W2: ほどく(丸め.W2),
    b2: Float32Array.from(丸め.b2),
  };
}

// ── ここから下は、測るための道具 ──────────────────

async function 本物をよむ(根) {
  const 出 = [];
  for (const 札 of fs.readdirSync(根)) {
    const k = 種類.indexOf(札の名[札]);
    if (k < 0) continue;
    for (const 名 of fs.readdirSync(path.join(根, 札))) {
      const { data, info } = await sharp(path.join(根, 札, 名)).greyscale().raw().toBuffer({ resolveWithObject: true });
      出.push({ 形: await 形にする(data, info.width, info.height), 札: k });
    }
  }
  return 出;
}

function 測る(群れ, 見本) {
  let 当 = 0;
  for (const x of 見本) {
    const 合 = new Float32Array(種類.length);
    for (const 網 of 群れ) {
      const { o } = 前へ(網, x.形);
      for (let k = 0; k < 種類.length; k++) 合[k] += o[k];
    }
    let 最 = 0;
    for (let k = 1; k < 種類.length; k++) if (合[k] > 合[最]) 最 = k;
    if (最 === x.札) 当++;
  }
  return 当;
}

if ('書き出す' === process.argv[2]) {
  const 枚 = Number(process.argv[3]) || 3;
  const 元 = JSON.parse(fs.readFileSync('scripts/ocr-cells/mure.json', 'utf8'));
  const 出 = {
    辺: 元.辺,
    入,
    種類: 元.種類,
    網たち: 元.網たち.slice(0, 枚).map((n) =>
      網を丸める({
        隠れ: n.隠れ,
        W1: Float32Array.from(n.W1),
        b1: Float32Array.from(n.b1),
        W2: Float32Array.from(n.W2),
        b2: Float32Array.from(n.b2),
      })
    ),
  };
  const 先 = 'scripts/ocr-cells/omomi-chiisai.json';
  fs.writeFileSync(先, JSON.stringify(出));
  console.log(`${先} に ${枚}枚を書きました（${(fs.statSync(先).size / 1e6).toFixed(2)}MB）`);
  process.exit(0);
}

// 直に呼ばれたときだけ測る（Windows では file:// の綴りが揃わないので、名前で見る）
if (/chiisaku\.mjs$/.test(process.argv[1] || '')) {
  const 元 = JSON.parse(fs.readFileSync('scripts/ocr-cells/mure.json', 'utf8'));
  const 生の群れ = 元.網たち.map((n) => ({
    隠れ: n.隠れ,
    W1: Float32Array.from(n.W1),
    b1: Float32Array.from(n.b1),
    W2: Float32Array.from(n.W2),
    b2: Float32Array.from(n.b2),
  }));
  const 見本 = [...(await 本物をよむ('docs/ocr-samples/cells')), ...(await 本物をよむ('docs/ocr-samples/cells-migi'))];
  console.log(`本物 ${見本.length}枚で測ります（入=${入}）\n`);
  console.log('枚数  そのまま           int8に丸める');
  for (const 枚 of [1, 2, 3, 5, 7]) {
    if (枚 > 生の群れ.length) continue;
    const 一部 = 生の群れ.slice(0, 枚);
    const 丸めた = 一部.map((n) => 網をほどく(網を丸める(n)));
    const 生大きさ = JSON.stringify({ 網たち: 元.網たち.slice(0, 枚) }).length;
    const 丸大きさ = JSON.stringify({ 網たち: 一部.map(網を丸める) }).length;
    console.log(
      `${String(枚).padStart(2)}枚  ${String(測る(一部, 見本)).padStart(3)}/${見本.length}` +
        ` (${((100 * 測る(一部, 見本)) / 見本.length).toFixed(1)}%) ${(生大きさ / 1e6).toFixed(2)}MB` +
        `   ${String(測る(丸めた, 見本)).padStart(3)}/${見本.length}` +
        ` (${((100 * 測る(丸めた, 見本)) / 見本.length).toFixed(1)}%) ${(丸大きさ / 1e6).toFixed(2)}MB`
    );
  }
}
