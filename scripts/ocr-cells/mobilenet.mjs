/**
 * 写真で学習済みの MobileNetV3-small を、マスの見分けに作り替えた網を動かす（純粋。Node でもアプリでも動く。部品は足さない）。
 *
 * ■ なぜ
 * 畳み込みの網（tatami.mjs）は学ばせる回ごとの揺れが大きく、板ごとに外して測ると 1590 マス中 1581〜1589。
 * 写真で学習済みの網は 1588〜1590 で揺れが小さい。ただ素の JS では 1 マス 6ms（2 枚で 12ms）と重いので、
 * 畳み込みの網が迷ったマス（確からしさ 0.9 未満・7% ほど）だけ、この網 2 枚の答えと混ぜる（yomu.js）。
 * 混ぜると 1589〜1590（2026-10-09。scripts/ocr-cells/cnn/README.md）。onnxruntime-web は WASM だけで 3.7MB
 * あるので使わず、ここで動かす。重み（omomi-mobilenet.bin）は 0.79MB で、写真の読み取りを使うときだけ取りに行く。
 *
 * ■ 形（学習は PyTorch。重みだけここで読む）
 *   マスの切り抜き → 32×32（tatami.mjs の 縮める）→ 明るさを 0〜1 に伸ばす → 中の辺（96）に広げる（双線形）
 *   → 層を順に：畳み込み（普通・1 枚ずつ・1×1）／ SE（全体の平均から各面の強さを決める）／ 塊（足し戻し）／ 平均／ 全結合
 *   BatchNorm は書き出すときに畳み込みへ畳んである。写真の網は 3 色で学んでいるので、最初の畳み込みは
 *   色の平均・幅を重みに畳み、はみ出し（周りの 0）の分は 端 で直す。重みは float16。
 *   網を何枚か持ち、確からしさを平均する。
 */
import { 縮める } from './tatami.mjs';

/** float16（LE）の並び → Float32Array */
function 半精度をほどく(箱, 位置, 数) {
  const 出 = new Float32Array(数);
  const dv = new DataView(箱.buffer, 箱.byteOffset + 位置, 数 * 2);
  for (let i = 0; i < 数; i++) {
    const h = dv.getUint16(i * 2, true);
    const 符 = h & 0x8000 ? -1 : 1;
    const 指 = (h >> 10) & 0x1f;
    const 仮 = h & 0x3ff;
    出[i] = 指 === 0 ? 符 * 仮 * 2 ** -24 : 指 === 31 ? (仮 ? NaN : 符 * Infinity) : 符 * (1 + 仮 / 1024) * 2 ** (指 - 15);
  }
  return 出;
}

function 層を組む(l, 取る) {
  if (l.種 === '塊') return { 種: '塊', 足す: l.足す, 層: l.層.map((m) => 層を組む(m, 取る)) };
  if (l.種 === 'SE') return { ...l, W1: 取る(l.W1), b1: 取る(l.b1), W2: 取る(l.W2), b2: 取る(l.b2) };
  if (l.種 === '畳み' || l.種 === '全') return { ...l, W: 取る(l.W), b: 取る(l.b), 端: l.端 ? 取る(l.端) : null };
  return l;
}

/**
 * 重みの .bin（[頭の長さ uint32][頭 JSON][float16 の並び]）から、動かせる網たちを組む
 * @param {ArrayBuffer|Uint8Array} 中身
 */
export function 薄い網を組む(中身) {
  const 箱 = 中身 instanceof Uint8Array ? 中身 : new Uint8Array(中身);
  const 長さ = new DataView(箱.buffer, 箱.byteOffset, 4).getUint32(0, true);
  const 頭 = JSON.parse(new TextDecoder('utf-8').decode(箱.subarray(4, 4 + 長さ)));
  const 始 = 4 + 長さ;
  const 取る = (r) => 半精度をほどく(箱, 始 + r.at * 2, r.n);
  return {
    辺: 頭.辺,
    中の辺: 頭.中の辺,
    種類: 頭.種類,
    迷いの境: 頭.迷いの境,
    網たち: 頭.網たち.map((層) => 層.map((l) => 層を組む(l, 取る))),
  };
}

const 活かす = (v, 活) => (活 === 'relu' ? (v > 0 ? v : 0) : 活 === 'hs' ? (v <= -3 ? 0 : v >= 3 ? v : (v * (v + 3)) / 6) : v);

/** 活性化をまとめてかける（ReLU・hard-swish） */
function 面に活かす(a, 始, 終, 活) {
  if (活 === 'relu') {
    for (let i = 始; i < 終; i++) if (a[i] < 0) a[i] = 0;
  } else if (活 === 'hs') {
    for (let i = 始; i < 終; i++) {
      const v = a[i];
      a[i] = v <= -3 ? 0 : v >= 3 ? v : (v * (v + 3)) / 6;
    }
  }
}

/**
 * k×k の畳み込み。群 が 1 なら全部の入を足す（最初の層）、入と同じなら面ごとに別の核（1 枚ずつ）。
 * はみ出し（周りの 0）は飛ばす。端 があれば、内側に入った枠ごとに足す（最初の層の色の直し）
 */
function 畳む(x, 辺, l) {
  const k = l.核;
  const p = (k - 1) >> 1;
  const st = l.歩;
  const 出辺 = Math.floor((辺 + 2 * p - k) / st) + 1;
  const n = 辺 * 辺;
  const m = 出辺 * 出辺;
  const 一枚ずつ = l.群 > 1;
  const 入の数 = 一枚ずつ ? 1 : l.入;
  const 出 = new Float32Array(l.出 * m);
  for (let o = 0; o < l.出; o++) {
    const 出基 = o * m;
    出.fill(l.b[o], 出基, 出基 + m);
    for (let ky = 0; ky < k; ky++) {
      // 入の内側に入る出の範囲
      const y始 = Math.max(0, Math.ceil((p - ky) / st));
      const y終 = Math.min(出辺, Math.floor((辺 - 1 - ky + p) / st) + 1);
      for (let kx = 0; kx < k; kx++) {
        const x始 = Math.max(0, Math.ceil((p - kx) / st));
        const x終 = Math.min(出辺, Math.floor((辺 - 1 - kx + p) / st) + 1);
        if (l.端) {
          const e = l.端[(o * k + ky) * k + kx];
          for (let y = y始; y < y終; y++) for (let xx = x始; xx < x終; xx++) 出[出基 + y * 出辺 + xx] += e;
        }
        for (let i = 0; i < 入の数; i++) {
          const w = l.W[((o * 入の数 + i) * k + ky) * k + kx];
          const 入基 = (一枚ずつ ? o : i) * n + kx - p;
          for (let y = y始; y < y終; y++) {
            const 行 = 入基 + (y * st + ky - p) * 辺;
            const 出行 = 出基 + y * 出辺;
            if (st === 1) for (let xx = x始; xx < x終; xx++) 出[出行 + xx] += w * x[行 + xx];
            else for (let xx = x始; xx < x終; xx++) 出[出行 + xx] += w * x[行 + xx * st];
          }
        }
      }
    }
    面に活かす(出, 出基, 出基 + m, l.活);
  }
  return [出, 出辺];
}

/** 1×1 の畳み込み（面をまたいで混ぜる）。出を 4 つずつまとめて、入を読む回数を減らす */
function 混ぜる(x, 辺, l) {
  const n = 辺 * 辺;
  const 入 = l.入;
  const 出 = new Float32Array(l.出 * n);
  const W = l.W;
  let o = 0;
  for (; o + 4 <= l.出; o += 4) {
    const a0 = o * n, a1 = a0 + n, a2 = a1 + n, a3 = a2 + n;
    出.fill(l.b[o], a0, a1);
    出.fill(l.b[o + 1], a1, a2);
    出.fill(l.b[o + 2], a2, a3);
    出.fill(l.b[o + 3], a3, a3 + n);
    for (let i = 0; i < 入; i++) {
      const w0 = W[o * 入 + i], w1 = W[(o + 1) * 入 + i], w2 = W[(o + 2) * 入 + i], w3 = W[(o + 3) * 入 + i];
      const 入基 = i * n;
      for (let j = 0; j < n; j++) {
        const v = x[入基 + j];
        出[a0 + j] += w0 * v;
        出[a1 + j] += w1 * v;
        出[a2 + j] += w2 * v;
        出[a3 + j] += w3 * v;
      }
    }
  }
  for (; o < l.出; o++) {
    const a0 = o * n;
    出.fill(l.b[o], a0, a0 + n);
    for (let i = 0; i < 入; i++) {
      const w = W[o * 入 + i];
      const 入基 = i * n;
      for (let j = 0; j < n; j++) 出[a0 + j] += w * x[入基 + j];
    }
  }
  面に活かす(出, 0, 出.length, l.活);
  return [出, 辺];
}

function 全結合(x, l) {
  const 出 = new Float32Array(l.出);
  for (let o = 0; o < l.出; o++) {
    let s = l.b[o];
    const 基 = o * l.入;
    for (let i = 0; i < l.入; i++) s += l.W[基 + i] * x[i];
    出[o] = 活かす(s, l.活);
  }
  return 出;
}

function SE(x, 辺, l) {
  const n = 辺 * 辺;
  const 平 = new Float32Array(l.入);
  for (let c = 0; c < l.入; c++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += x[c * n + j];
    平[c] = s / n;
  }
  const 中 = new Float32Array(l.中);
  for (let o = 0; o < l.中; o++) {
    let s = l.b1[o];
    for (let i = 0; i < l.入; i++) s += l.W1[o * l.入 + i] * 平[i];
    中[o] = s > 0 ? s : 0;
  }
  const 出 = new Float32Array(x.length);
  for (let c = 0; c < l.入; c++) {
    let s = l.b2[c];
    for (let i = 0; i < l.中; i++) s += l.W2[c * l.中 + i] * 中[i];
    const g = s <= -3 ? 0 : s >= 3 ? 1 : (s + 3) / 6;
    for (let j = 0; j < n; j++) 出[c * n + j] = x[c * n + j] * g;
  }
  return 出;
}

function 層を通す(層たち, x, 辺) {
  for (const l of 層たち) {
    if (l.種 === '塊') {
      const [y, 辺2] = 層を通す(l.層, x, 辺);
      if (l.足す) for (let i = 0; i < y.length; i++) y[i] += x[i];
      x = y;
      辺 = 辺2;
    } else if (l.種 === '畳み') {
      [x, 辺] = l.核 === 1 && l.歩 === 1 && l.群 === 1 ? 混ぜる(x, 辺, l) : 畳む(x, 辺, l);
    } else if (l.種 === 'SE') {
      x = SE(x, 辺, l);
    } else if (l.種 === '平均') {
      const c = x.length / (辺 * 辺);
      const 平 = new Float32Array(c);
      const n = 辺 * 辺;
      for (let i = 0; i < c; i++) {
        let s = 0;
        for (let j = 0; j < n; j++) s += x[i * n + j];
        平[i] = s / n;
      }
      x = 平;
      辺 = 1;
    } else if (l.種 === '全') {
      x = 全結合(x, l);
    }
  }
  return [x, 辺];
}

/** 双線形で広げる（PyTorch の interpolate、align_corners=False と同じ） */
function 広げる(画, 辺, 出辺) {
  const 出 = new Float32Array(出辺 * 出辺);
  const r = 辺 / 出辺;
  const 位 = (d) => {
    const s = Math.max(0, (d + 0.5) * r - 0.5);
    const i0 = Math.min(辺 - 1, Math.floor(s));
    return [i0, Math.min(辺 - 1, i0 + 1), s - i0];
  };
  for (let y = 0; y < 出辺; y++) {
    const [y0, y1, ty] = 位(y);
    for (let x = 0; x < 出辺; x++) {
      const [x0, x1, tx] = 位(x);
      出[y * 出辺 + x] = (画[y0 * 辺 + x0] * (1 - tx) + 画[y0 * 辺 + x1] * tx) * (1 - ty) + (画[y1 * 辺 + x0] * (1 - tx) + 画[y1 * 辺 + x1] * tx) * ty;
    }
  }
  return 出;
}

function 伸ばす(画) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of 画) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const d = hi - lo + 1e-3;
  return 画.map((v) => (v - lo) / d);
}

/** 切り抜き 1 マスの確からしさ（種類の順） */
export function 薄い網で見分ける(網, 画, 幅, 高) {
  const x0 = 伸ばす(縮める(画, 幅, 高, 網.辺));
  return 正規化済みで見分ける(網, x0);
}

/** 32×32・伸ばし済みの画から（網たちの平均） */
export function 正規化済みで見分ける(網, x0) {
  const x = 網.中の辺 === 網.辺 ? x0 : 広げる(x0, 網.辺, 網.中の辺);
  const 合 = new Float32Array(網.種類.length);
  for (const 層たち of 網.網たち) {
    const [z] = 層を通す(層たち, x, 網.中の辺);
    let 最大 = -Infinity;
    for (const v of z) if (v > 最大) 最大 = v;
    let 和 = 0;
    const p = new Float32Array(z.length);
    for (let i = 0; i < z.length; i++) {
      p[i] = Math.exp(z[i] - 最大);
      和 += p[i];
    }
    for (let i = 0; i < z.length; i++) 合[i] += p[i] / 和 / 網.網たち.length;
  }
  return 合;
}
