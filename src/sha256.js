/**
 * Module ID: sha256
 *
 * SHA-256。共有リンクの合言葉から枝の名前を作るために使う（src/liveShare.js）。
 *
 * ■ なぜ自前で持つのか
 * ブラウザには crypto.subtle があるが、iOS の React Native（Hermes）には無い。
 * expo-crypto を足せば揃うが、ネイティブの部品が増えて EAS Build に響く。
 * 出したい値は「どの端末でも同じ32バイト」だけなので、素の JavaScript で
 * 書けば足りる。web と iOS で結果が1ビットも違ってはいけない処理なので、
 * 環境ごとに別の実装を使い分けないほうが安全でもある。
 *
 * 実装は FIPS 180-4 のまま。速さより読みやすさを採っている。
 * 既知の答え合わせ（test/sha256.test.js）で正しさを確かめている。
 */
'use strict';

// 最初の64個の素数の立方根の小数部（FIPS 180-4）
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

// 最初の8個の素数の平方根の小数部（FIPS 180-4）
const 初期値 = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

const 右回し = (x, n) => (x >>> n) | (x << (32 - n));

/** 文字列を UTF-8 のバイト列にする。TextEncoder が無い環境でも動くように自前で持つ */
function バイト列にする(文字列) {
  const s = String(文字列);
  const 出 = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    // 上位・下位のサロゲート対を1つの符号位置へ戻す
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const 次 = s.charCodeAt(i + 1);
      if (次 >= 0xdc00 && 次 <= 0xdfff) ((c = 0x10000 + ((c - 0xd800) << 10) + (次 - 0xdc00)), i++);
    }
    if (c < 0x80) 出.push(c);
    else if (c < 0x800) 出.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) 出.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else
      出.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 63),
        0x80 | ((c >> 6) & 63),
        0x80 | (c & 63)
      );
  }
  return 出;
}

/** バイト列を SHA-256 にかけ、32バイトの配列を返す */
function バイト列を要約する(バイト) {
  const 長さ = バイト.length;
  // 末尾に 0x80 を足し、長さ（ビット数・64bit）が入るまで 0 で埋める
  const 全体 = バイト.slice();
  全体.push(0x80);
  while (全体.length % 64 !== 56) 全体.push(0);
  const ビット数 = 長さ * 8;
  // 上位32ビット。この用途では 2^32 ビット（512MB）を超える入力は来ない
  全体.push(0, 0, 0, 0);
  全体.push((ビット数 >>> 24) & 255, (ビット数 >>> 16) & 255, (ビット数 >>> 8) & 255, ビット数 & 255);

  const h = 初期値.slice();
  const w = new Int32Array(64);
  for (let 位置 = 0; 位置 < 全体.length; 位置 += 64) {
    for (let t = 0; t < 16; t++)
      w[t] =
        (全体[位置 + t * 4] << 24) |
        (全体[位置 + t * 4 + 1] << 16) |
        (全体[位置 + t * 4 + 2] << 8) |
        全体[位置 + t * 4 + 3];
    for (let t = 16; t < 64; t++) {
      const s0 = 右回し(w[t - 15], 7) ^ 右回し(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = 右回し(w[t - 2], 17) ^ 右回し(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1 = 右回し(e, 6) ^ 右回し(e, 11) ^ 右回し(e, 25);
      const ch = (e & f) ^ (~e & g);
      const 温度1 = (hh + S1 + ch + K[t] + w[t]) | 0;
      const S0 = 右回し(a, 2) ^ 右回し(a, 13) ^ 右回し(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const 温度2 = (S0 + maj) | 0;
      ((hh = g), (g = f), (f = e), (e = (d + 温度1) | 0));
      ((d = c), (c = b), (b = a), (a = (温度1 + 温度2) | 0));
    }
    const 次 = [a, b, c, d, e, f, g, hh];
    for (let i = 0; i < 8; i++) h[i] = (h[i] + 次[i]) | 0;
  }

  const 出 = [];
  for (const x of h) 出.push((x >>> 24) & 255, (x >>> 16) & 255, (x >>> 8) & 255, x & 255);
  return 出;
}

const 十六進 = (バイト) => バイト.map((b) => b.toString(16).padStart(2, '0')).join('');

/** 文字列の SHA-256 を十六進64文字で返す */
function 要約(文字列) {
  return 十六進(バイト列を要約する(バイト列にする(文字列)));
}

/** 文字列の SHA-256 をバイト列で返す。繰り返し掛けるときに使う */
function 要約のバイト列(文字列) {
  return バイト列を要約する(バイト列にする(文字列));
}

/** バイト列の SHA-256 をバイト列で返す */
function バイト列から(バイト) {
  return バイト列を要約する(バイト);
}

module.exports = { 要約, 要約のバイト列, バイト列から, バイト列にする, 十六進 };
