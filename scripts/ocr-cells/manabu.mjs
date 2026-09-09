/**
 * 描いた見本で学習させ、本物のマスで確かめる。
 *
 *   node scripts/ocr-cells/manabu.mjs [一種類あたりの枚数] [巡回数]
 *
 * ■ 段取り
 *   学習は「描いたもの」だけで行う。本物80マスは一度も学習に使わず、
 *   確かめにだけ使う。こうしないと、効いたのか覚えただけなのか分からない。
 *
 * ■ 模型
 *   20×20 に揃えた白黒を、400→96→4 の小さな網に通すだけ。
 *   持ち出す重みは4万個ほど（数百KB）。端末の中で動く。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { 印をえがく, 画にする } from './egaku.mjs';

const 逆 = String.fromCharCode(92);
export const 種類 = ['×', '◎', '○' + 逆, '○/'];
const 辺 = 20;

/**
 * 明るさの並びを、学習に使う形にそろえる。
 * 墨の在る範囲で切り直し、20×20 に伸ばし、墨を1にする。
 * 描いたものと本物で、まったく同じ手順を通すこと。
 */
export async function 形にする(明るさ, 幅, 高) {
  let 最小 = 255;
  let 最大 = 0;
  for (let i = 0; i < 明るさ.length; i++) {
    if (明るさ[i] < 最小) 最小 = 明るさ[i];
    if (明るさ[i] > 最大) 最大 = 明るさ[i];
  }
  if (最大 - 最小 < 25) return new Float32Array(辺 * 辺);
  const 境 = 最小 + (最大 - 最小) * 0.5;
  let 左 = 幅, 右 = -1, 上 = 高, 下 = -1;
  for (let y = 0; y < 高; y++) {
    for (let x = 0; x < 幅; x++) {
      if (明るさ[y * 幅 + x] >= 境) continue;
      if (x < 左) 左 = x;
      if (x > 右) 右 = x;
      if (y < 上) 上 = y;
      if (y > 下) 下 = y;
    }
  }
  if (右 < 0) return new Float32Array(辺 * 辺);
  const w = 右 - 左 + 1;
  const h = 下 - 上 + 1;
  const 小 = await sharp(Buffer.from(明るさ), { raw: { width: 幅, height: 高, channels: 1 } })
    .extract({ left: 左, top: 上, width: w, height: h })
    .resize(辺, 辺, { fit: 'fill' })
    .raw()
    .toBuffer();
  const 出 = new Float32Array(辺 * 辺);
  let 小最小 = 255;
  let 小最大 = 0;
  for (const v of 小) {
    if (v < 小最小) 小最小 = v;
    if (v > 小最大) 小最大 = v;
  }
  const 幅ぶん = Math.max(1, 小最大 - 小最小);
  for (let i = 0; i < 出.length; i++) 出[i] = 1 - (小[i] - 小最小) / 幅ぶん;
  return 出;
}

/** 描いた見本をつくる */
export async function 描いた見本(一種類あたり) {
  const 出 = [];
  for (let k = 0; k < 種類.length; k++) {
    for (let i = 0; i < 一種類あたり; i++) {
      const 板 = 画にする(印をえがく(種類[k], k * 1000003 + i * 7919 + 13, 64));
      出.push({ 形: await 形にする(板.画, 板.幅, 板.高), 札: k });
    }
  }
  return 出;
}

/** 本物のマス（確かめ用） */
export async function 本物の見本(根) {
  const 記号 = { batsu: '×', maru2: '◎', maru_gyaku: '○' + 逆, maru_seki: '○/' };
  const 出 = [];
  for (const 札 of fs.readdirSync(根)) {
    const k = 種類.indexOf(記号[札]);
    if (k < 0) continue;
    for (const f of fs.readdirSync(path.join(根, 札))) {
      const { data, info } = await sharp(path.join(根, 札, f)).greyscale().raw().toBuffer({ resolveWithObject: true });
      出.push({ 形: await 形にする(data, info.width, info.height), 札: k, 名: 札 + '/' + f });
    }
  }
  return 出;
}

// ── 小さな網 ────────────────────────────────
const 入 = 辺 * 辺;

export function 網をつくる(隠れ, 種) {
  let s = (種 || 12345) >>> 0;
  const 乱 = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296 - 0.5;
  };
  const 幅1 = Math.sqrt(2 / 入);
  const 幅2 = Math.sqrt(2 / 隠れ);
  return {
    隠れ,
    W1: Float32Array.from({ length: 入 * 隠れ }, () => 乱() * 2 * 幅1),
    b1: new Float32Array(隠れ),
    W2: Float32Array.from({ length: 隠れ * 種類.length }, () => 乱() * 2 * 幅2),
    b2: new Float32Array(種類.length),
  };
}

export function 前へ(網, x, 途中) {
  const h = 途中 ? 途中.h : new Float32Array(網.隠れ);
  const o = 途中 ? 途中.o : new Float32Array(種類.length);
  for (let j = 0; j < 網.隠れ; j++) {
    let s = 網.b1[j];
    const 基 = j * 入;
    for (let i = 0; i < 入; i++) s += 網.W1[基 + i] * x[i];
    h[j] = s > 0 ? s : 0;
  }
  let 最大 = -Infinity;
  for (let k = 0; k < 種類.length; k++) {
    let s = 網.b2[k];
    const 基 = k * 網.隠れ;
    for (let j = 0; j < 網.隠れ; j++) s += 網.W2[基 + j] * h[j];
    o[k] = s;
    if (s > 最大) 最大 = s;
  }
  let 和 = 0;
  for (let k = 0; k < 種類.length; k++) {
    o[k] = Math.exp(o[k] - 最大);
    和 += o[k];
  }
  for (let k = 0; k < 種類.length; k++) o[k] /= 和;
  return { h, o };
}

/** 当たりを数える */
export function 測る(網, 見本) {
  let 合 = 0;
  const 表 = 種類.map(() => 種類.map(() => 0));
  for (const s of 見本) {
    const { o } = 前へ(網, s.形);
    let 最 = 0;
    for (let k = 1; k < 種類.length; k++) if (o[k] > o[最]) 最 = k;
    表[s.札][最]++;
    if (最 === s.札) 合++;
  }
  return { 当たり: 合, 全: 見本.length, 表 };
}
