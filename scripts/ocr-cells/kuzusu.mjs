/**
 * 写真をわざと崩す。斜めから撮った、ぼけた、暗い、ざらついた——を作る。
 *
 * ■ なぜ要るか
 * 手元の本物は、正面から撮った、明るくて綺麗な1枚だけ。実際に使われるのは
 * 斜めから撮った写真や、印の汚い板になる。**崩した写真で測らないと、
 * どこで駄目になるのかが分からない**。
 *
 * 崩すのは本物の写真なので、印そのものは本物のまま。答えも変わらない。
 */

/** 4組の点から、写す式（射影変換）を求める。u=(ax+by+c)/(gx+hy+1) の形 */
export function 写す式(元, 先) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = 元[i];
    const [u, v] = 先[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  // 掃き出し法で解く
  const n = 8;
  for (let i = 0; i < n; i++) {
    let 主 = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[主][i])) 主 = r;
    [A[i], A[主]] = [A[主], A[i]];
    [b[i], b[主]] = [b[主], b[i]];
    const p = A[i][i];
    if (Math.abs(p) < 1e-12) continue;
    for (let c = i; c < n; c++) A[i][c] /= p;
    b[i] /= p;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const k = A[r][i];
      if (!k) continue;
      for (let c = i; c < n; c++) A[r][c] -= k * A[i][c];
      b[r] -= k * b[i];
    }
  }
  const [a1, b1, c1, d1, e1, f1, g1, h1] = b;
  return (x, y) => {
    const w = g1 * x + h1 * y + 1;
    return [(a1 * x + b1 * y + c1) / w, (d1 * x + e1 * y + f1) / w];
  };
}

/**
 * 崩し方を決める。四隅をどこへ動かすかで、傾きと遠近を一度に作る。
 *
 * @param {{幅:number, 高:number, 回す?:number, 台形?:number, 種?:number}} 注文
 *   回す … 度。写真ごと傾ける
 *   台形 … 0〜0.3ほど。斜めから撮ると、遠い側が縮む
 */
export function 崩し方(注文) {
  const { 幅, 高 } = 注文;
  const 回す = ((注文.回す || 0) * Math.PI) / 180;
  const 台形 = 注文.台形 || 0;
  let s = (注文.種 || 1) >>> 0;
  const 乱 = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  // どちら側が遠いかは、種で決める
  const 横向き = 乱() < 0.5;
  const 向き = 乱() < 0.5 ? 1 : -1;

  const 隅 = [
    [0, 0],
    [幅, 0],
    [幅, 高],
    [0, 高],
  ];
  const 動いた = 隅.map(([x, y]) => {
    let X = x;
    let Y = y;
    if (横向き) {
      // 左右のどちらかが遠い。遠い側は縦に縮む
      const 端 = x < 幅 / 2 ? (向き > 0 ? 1 : 0) : 向き > 0 ? 0 : 1;
      const 縮み = 台形 * 端;
      Y = 高 / 2 + (y - 高 / 2) * (1 - 縮み);
    } else {
      const 端 = y < 高 / 2 ? (向き > 0 ? 1 : 0) : 向き > 0 ? 0 : 1;
      const 縮み = 台形 * 端;
      X = 幅 / 2 + (x - 幅 / 2) * (1 - 縮み);
    }
    // 真ん中を軸に回す
    const dx = X - 幅 / 2;
    const dy = Y - 高 / 2;
    const c = Math.cos(回す);
    const t = Math.sin(回す);
    return [幅 / 2 + dx * c - dy * t, 高 / 2 + dx * t + dy * c];
  });

  // 動いた四隅が画に収まるよう、寄せて縮める
  const xs = 動いた.map((p) => p[0]);
  const ys = 動いた.map((p) => p[1]);
  const 左 = Math.min(...xs);
  const 右 = Math.max(...xs);
  const 上 = Math.min(...ys);
  const 下 = Math.max(...ys);
  const 倍 = Math.min(幅 / (右 - 左), 高 / (下 - 上));
  const 収めた = 動いた.map(([x, y]) => [(x - 左) * 倍, (y - 上) * 倍]);
  return { 隅, 収めた, 写す: 写す式(隅, 収めた), 戻す: 写す式(収めた, 隅) };
}

/**
 * 画を崩す。明るさ（1面）でも色（3面）でも受ける。
 *
 * @param {{画:Uint8Array|Buffer, 幅:number, 高:number, 面?:number}} 元
 * @param {{崩し?:object, ぼかし?:number, 明るさ?:number, 締まり?:number, ざらつき?:number, 種?:number}} 注文
 */
export function ゆがませる(元, 注文) {
  const 面 = 元.面 || 1;
  const 幅 = 元.幅;
  const 高 = 元.高;
  const 出 = new Uint8Array(幅 * 高 * 面);
  const 戻す = 注文.崩し ? 注文.崩し.戻す : (x, y) => [x, y];
  let s = (注文.種 || 7) >>> 0;
  const 乱 = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const 明るさ = 注文.明るさ == null ? 1 : 注文.明るさ;
  const 締まり = 注文.締まり == null ? 1 : 注文.締まり;
  const ざらつき = 注文.ざらつき || 0;

  for (let y = 0; y < 高; y++) {
    for (let x = 0; x < 幅; x++) {
      const [sx, sy] = 戻す(x, y);
      const 出先 = (y * 幅 + x) * 面;
      if (sx < 0 || sy < 0 || sx > 幅 - 1 || sy > 高 - 1) {
        for (let c = 0; c < 面; c++) 出[出先 + c] = 235;
        continue;
      }
      // 前後左右の4点で混ぜる（間引くと線が飛ぶ）
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(幅 - 1, x0 + 1);
      const y1 = Math.min(高 - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      for (let c = 0; c < 面; c++) {
        const a = 元.画[(y0 * 幅 + x0) * 面 + c];
        const b = 元.画[(y0 * 幅 + x1) * 面 + c];
        const d = 元.画[(y1 * 幅 + x0) * 面 + c];
        const e = 元.画[(y1 * 幅 + x1) * 面 + c];
        let v = a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + d * (1 - fx) * fy + e * fx * fy;
        v = 128 + (v - 128) * 締まり;
        v *= 明るさ;
        if (ざらつき) v += (乱() - 0.5) * ざらつき;
        出[出先 + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
      }
    }
  }
  return { 画: 出, 幅, 高, 面 };
}
