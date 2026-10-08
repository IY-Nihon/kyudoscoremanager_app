/**
 * 畳み込みの網（CNN）でマスを見分ける（純粋。Node でもアプリでも動く。部品は足さない）。
 *
 * ■ なぜ
 * 全結合の小さな網（manabu.mjs の 網）は、画素を一列に並べて見るので、印のずれ・大きさの違い・
 * 丸からはみ出す線に弱かった。板ごとに外して測ると（2026-10-09、本物 1590 マス・10 枚の板）、
 * 全結合 98.2%、この形の畳み込み 99.6〜99.8%。外した板は一度も学習に使っていない数字。
 *
 * ■ 形（学習は PyTorch。重みだけここで読む）
 *   マスの切り抜き → 辺×辺（双線形）→ 明るさを 0〜1 に伸ばす（マスごとに最小・最大で）
 *   → [3×3 畳み込み・ReLU・2×2 の最大値で縮める] を層の数だけ → 全結合・ReLU → 全結合（種類の数）
 *   BatchNorm は書き出すときに畳み込みの重みへ畳んである。重みは層ごとに int8（omomi.mjs と同じ形）。
 * ずらし（少しずらして何度も読み、確からしさを平均する）は、重みの JSON の ずらし で決める。
 *
 * 学習と同じ手順で縮める・伸ばすこと（scratchpad の dump.mjs と同じ 縮める を使う）。
 */
import { ほどく } from './omomi.mjs';

/** 切り抜きを 辺×辺 に縮める（双線形・画素の中心で合わせる） */
export function 縮める(画, 幅, 高, 辺) {
  const 出 = new Float32Array(辺 * 辺);
  for (let y = 0; y < 辺; y++) {
    const sy = ((y + 0.5) * 高) / 辺 - 0.5;
    const y0 = Math.max(0, Math.min(高 - 1, Math.floor(sy)));
    const y1 = Math.min(高 - 1, y0 + 1);
    const ty = Math.min(1, Math.max(0, sy - y0));
    for (let x = 0; x < 辺; x++) {
      const sx = ((x + 0.5) * 幅) / 辺 - 0.5;
      const x0 = Math.max(0, Math.min(幅 - 1, Math.floor(sx)));
      const x1 = Math.min(幅 - 1, x0 + 1);
      const tx = Math.min(1, Math.max(0, sx - x0));
      const v = (画[y0 * 幅 + x0] * (1 - tx) + 画[y0 * 幅 + x1] * tx) * (1 - ty) + (画[y1 * 幅 + x0] * (1 - tx) + 画[y1 * 幅 + x1] * tx) * ty;
      // 学習の画は 0〜255 の整数に丸めてから 255 で割っている
      出[y * 辺 + x] = Math.round(v) / 255;
    }
  }
  return 出;
}

/** 重みの JSON から動かせる網たちを組む */
export function 畳みの網を組む(中身) {
  return {
    辺: 中身.辺,
    横の入: 中身.横の入 || 0,
    種類: 中身.種類,
    ずらし: 中身.ずらし || [[0, 0]],
    網たち: 中身.網たち.map((n) =>
      n.層.map((l) => ({ 種: l.種, 入: l.入, 出: l.出, W: ほどく(l.W), b: Float32Array.from(l.b) }))
    ),
  };
}

/** 3×3（周りは 0 を足す）の畳み込み → ReLU → 2×2 の最大値。入 は [入の数][辺][辺] */
function 畳んで縮める(入, 辺, 層) {
  const n = 辺 * 辺;
  const 半 = 辺 >> 1;
  const 出 = new Float32Array(層.出 * 半 * 半);
  const 面 = new Float32Array(n);
  for (let o = 0; o < 層.出; o++) {
    面.fill(層.b[o]);
    for (let i = 0; i < 層.入; i++) {
      const 基 = (o * 層.入 + i) * 9;
      const 入面 = i * n;
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const w = 層.W[基 + ky * 3 + kx];
          if (w === 0) continue;
          const dy = ky - 1;
          const dx = kx - 1;
          const y始 = dy < 0 ? 1 : 0;
          const y終 = dy > 0 ? 辺 - 1 : 辺;
          const x始 = dx < 0 ? 1 : 0;
          const x終 = dx > 0 ? 辺 - 1 : 辺;
          for (let y = y始; y < y終; y++) {
            const 行 = y * 辺;
            const 元行 = 入面 + (y + dy) * 辺 + dx;
            for (let x = x始; x < x終; x++) 面[行 + x] += w * 入[元行 + x];
          }
        }
      }
    }
    const 出面 = o * 半 * 半;
    for (let y = 0; y < 半; y++) {
      for (let x = 0; x < 半; x++) {
        const p = 2 * y * 辺 + 2 * x;
        let m = 面[p];
        if (面[p + 1] > m) m = 面[p + 1];
        if (面[p + 辺] > m) m = 面[p + 辺];
        if (面[p + 辺 + 1] > m) m = 面[p + 辺 + 1];
        出[出面 + y * 半 + x] = m > 0 ? m : 0;
      }
    }
  }
  return 出;
}

function 全結合(入, 層, ReLU) {
  const 出 = new Float32Array(層.出);
  for (let o = 0; o < 層.出; o++) {
    let s = 層.b[o];
    const 基 = o * 層.入;
    for (let i = 0; i < 層.入; i++) s += 層.W[基 + i] * 入[i];
    出[o] = ReLU && s < 0 ? 0 : s;
  }
  return 出;
}

/** 網 1 枚・画 1 枚（正規化済み）の確からしさ */
function 前へ1(層たち, 画, 辺, 横) {
  let x = 画;
  let 今の辺 = 辺;
  let k = 0;
  for (; k < 層たち.length && 層たち[k].種 === '畳み'; k++) {
    x = 畳んで縮める(x, 今の辺, 層たち[k]);
    今の辺 >>= 1;
  }
  if (横 && 横.length) {
    const 合 = new Float32Array(x.length + 横.length);
    合.set(x);
    合.set(横, x.length);
    x = 合;
  }
  for (let j = k; j < 層たち.length; j++) x = 全結合(x, 層たち[j], j < 層たち.length - 1);
  let 最大 = -Infinity;
  for (const v of x) if (v > 最大) 最大 = v;
  let 和 = 0;
  for (let i = 0; i < x.length; i++) {
    x[i] = Math.exp(x[i] - 最大);
    和 += x[i];
  }
  for (let i = 0; i < x.length; i++) x[i] /= 和;
  return x;
}

/** マスごとに明るさを 0〜1 に伸ばす（学習の 正規化 と同じ） */
function 正規化(画) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of 画) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const 出 = new Float32Array(画.length);
  const d = hi - lo + 1e-3;
  for (let i = 0; i < 画.length; i++) 出[i] = (画[i] - lo) / d;
  return 出;
}

/** 輪のように回してずらす（PyTorch の roll と同じ。はみ出した分は反対側へ） */
function 回してずらす(画, 辺, dx, dy) {
  const 出 = new Float32Array(画.length);
  for (let y = 0; y < 辺; y++) {
    const sy = (((y - dy) % 辺) + 辺) % 辺;
    for (let x = 0; x < 辺; x++) {
      const sx = (((x - dx) % 辺) + 辺) % 辺;
      出[y * 辺 + x] = 画[sy * 辺 + sx];
    }
  }
  return 出;
}

/**
 * 切り抜き 1 マスの確からしさ（種類の順）。網たちとずらしの平均。
 * @param {object} 網 畳みの網を組む の返り
 * @param {Uint8Array} 画 切り抜き（明るさ）
 * @param {Float32Array} [形] 形にする の返り（横の入があるときだけ使う。400 番目から）
 */
export function 畳みで見分ける(網, 画, 幅, 高, 形) {
  const 辺 = 網.辺;
  const 小 = 縮める(画, 幅, 高, 辺);
  const 横 = 網.横の入 && 形 ? 形.subarray(400, 400 + 網.横の入) : null;
  const 合 = new Float32Array(網.種類.length);
  let 回 = 0;
  for (const [dx, dy] of 網.ずらし) {
    const x = 正規化(dx || dy ? 回してずらす(小, 辺, dx, dy) : 小);
    for (const 層たち of 網.網たち) {
      const p = 前へ1(層たち, x, 辺, 横);
      for (let k = 0; k < 合.length; k++) 合[k] += p[k];
      回++;
    }
  }
  for (let k = 0; k < 合.length; k++) 合[k] /= 回;
  return 合;
}
