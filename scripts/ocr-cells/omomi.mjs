/**
 * 重みを小さく持つ・戻す（純粋。Node でもアプリでも動く）。
 * int8 に丸めた重みを base64 で持つ。7MB → 0.3MB。当たりは落ちない（実測）。
 */

/** Int8Array → base64。Node は Buffer、ブラウザは btoa */
function 符号にする(粒) {
  const 箱 = new Uint8Array(粒.buffer, 粒.byteOffset, 粒.length);
  if (typeof Buffer !== 'undefined') return Buffer.from(箱).toString('base64');
  let s = '';
  for (let i = 0; i < 箱.length; i += 0x8000) s += String.fromCharCode.apply(null, 箱.subarray(i, i + 0x8000));
  return btoa(s);
}

/** base64 → Int8Array。Node は Buffer、ブラウザは atob */
function 符号をほどく(文字) {
  if (typeof Buffer !== 'undefined') {
    // Buffer は使い回しの器の途中を指していることがある。byteOffset を渡さずに
    // .buffer だけ見ると、まったく別のところを読む（実測で当たりが3割に落ちた）
    const 箱 = Buffer.from(文字, 'base64');
    return new Int8Array(箱.buffer, 箱.byteOffset, 箱.length);
  }
  const s = atob(文字);
  const 出 = new Int8Array(s.length);
  for (let i = 0; i < s.length; i++) 出[i] = (s.charCodeAt(i) << 24) >> 24;
  return 出;
}

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
  return { 目盛, 粒: 符号にする(粒) };
}

/** 丸めた重みを元に戻す */
export function ほどく(丸め) {
  const 粒 = 符号をほどく(丸め.粒);
  const 出 = new Float32Array(粒.length);
  for (let i = 0; i < 粒.length; i++) 出[i] = 粒[i] * 丸め.目盛;
  return 出;
}

/** 読み込んだ JSON（丸めた形でも、そのままの形でも）から、動かせる網たちを組む */
export function 重みを組む(中身) {
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

