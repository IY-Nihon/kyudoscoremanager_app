/**
 * ブラウザ（canvas）で画を読む・回す。
 * scripts/ocr-cells/gazou-node.mjs と同じ形を返す。読み取りの中身はどちらも知らない。
 *
 *   生 … { 画素: Uint8Array（明るさ）, 幅, 高, 色: { data: Uint8ClampedArray(RGBA), ch: 4 } }
 */

import { 息継ぎ } from '../../scripts/ocr-cells/ikitsugi.mjs';

/** base64（JPEG/PNG）を HTMLImageElement に */
function 画像にする(base64, mime) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像を開けませんでした'));
    img.src = `data:${mime || 'image/jpeg'};base64,${base64}`;
  });
}

/**
 * 大きすぎる写真は縮める。長辺 4800 まで（ふつうのスマホの写真はそのまま）。
 * 2600 に縮めていたころは、本物の板で Node（元の大きさ）より 2〜3射 落ちた
 *（Chromium 315・WebKit 314 → 縮めないと 317〜318、読む時間は 1〜1.5秒）。
 * 印は 30px あれば読めるが、格子を立てるときのかたまりの拾い方が縮小で変わる
 */
const 長辺の上限 = 4800;

/**
 * 写真（base64）を読む。明るさと色を持つ。
 *
 * 縮小は canvas に任せず自前で平均する。canvas の drawImage の縮め方は
 * ブラウザで違い、同じ写真が Chromium で 317/320、WebKit で 308/320 になった。
 * 元の大きさで描いて画素を取り、こちらで平均して縮める。
 * iOS の canvas は 1600万画素あたりが上限なので、それを超える写真だけ
 * canvas に縮めてもらう（そこは仕方がない）
 */
export async function 画を読む(base64, mime) {
  const img = await 画像にする(base64, mime);
  const 元幅 = img.width;
  const 元高 = img.height;
  const canvasの上限 = 16_000_000;
  const 描く倍 = Math.min(1, Math.sqrt(canvasの上限 / (元幅 * 元高)));
  const 描幅 = Math.max(1, Math.floor(元幅 * 描く倍));
  const 描高 = Math.max(1, Math.floor(元高 * 描く倍));
  const canvas = document.createElement('canvas');
  canvas.width = 描幅;
  canvas.height = 描高;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 描幅, 描高);
  const { data } = ctx.getImageData(0, 0, 描幅, 描高);
  // 画素を取ったら canvas の裏の板（1600 万画素で 64MB）はすぐ手放す。放っておくと
  // 掃除（GC）まで残り、2 枚目・3 枚目の写真で掃除の止まりが長くなる
  canvas.width = 0;
  canvas.height = 0;

  // 明るさ（人の目の重み）。sharp の greyscale と同じ式
  const 明るさ = (j) => 0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2];

  const 倍 = Math.min(1, 長辺の上限 / Math.max(描幅, 描高));
  if (倍 >= 1) {
    // そのまま 1 バイトの明るさに。以前は Float32 の板（1600 万画素で 64MB）を間に挟んでいて、
    // 2 枚目の写真を読むときの掃除（GC）で 3 秒止まった。
    // 1600 万画素を一息にやると古い端末で 1 秒以上塞ぐので、200 万画素ごとに息をつく
    const 数 = 描幅 * 描高;
    const 画素 = new Uint8Array(数);
    const 一息の画素 = 2_000_000;
    for (let 頭 = 0; 頭 < 数; 頭 += 一息の画素) {
      const 尻 = Math.min(数, 頭 + 一息の画素);
      for (let i = 頭, j = 頭 * 4; i < 尻; i++, j += 4) 画素[i] = Math.round(明るさ(j));
      if (尻 < 数) await 息継ぎ();
    }
    return { 画素, 幅: 描幅, 高: 描高, 色: { data, ch: 4 } };
  }
  // 平均で縮める（明るさも色も）
  const 幅 = Math.max(1, Math.round(描幅 * 倍));
  const 高 = Math.max(1, Math.round(描高 * 倍));
  const 画素 = new Uint8Array(幅 * 高);
  const 色 = new Uint8ClampedArray(幅 * 高 * 4);
  for (let y = 0; y < 高; y++) {
    if (y > 0 && y % 200 === 0) await 息継ぎ();
    const y0 = Math.floor((y * 描高) / 高);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * 描高) / 高));
    for (let x = 0; x < 幅; x++) {
      const x0 = Math.floor((x * 描幅) / 幅);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * 描幅) / 幅));
      let 明和 = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = yy * 描幅 + xx;
          明和 += 明るさ(i * 4);
          r += data[i * 4];
          g += data[i * 4 + 1];
          b += data[i * 4 + 2];
          n++;
        }
      }
      const o = y * 幅 + x;
      画素[o] = Math.round(明和 / n);
      色[o * 4] = r / n;
      色[o * 4 + 1] = g / n;
      色[o * 4 + 2] = b / n;
      色[o * 4 + 3] = 255;
    }
  }
  return { 画素, 幅, 高, 色: { data: 色, ch: 4 } };
}

/** 明るさの画を回す（度）。白で埋める。回した分だけ画は大きくなる */
export async function 回す(生, 度) {
  const rad = (-度 * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const 幅 = Math.ceil(生.幅 * c + 生.高 * s);
  const 高 = Math.ceil(生.幅 * s + 生.高 * c);
  // 明るさを RGBA に戻して描く
  const 元 = document.createElement('canvas');
  元.width = 生.幅;
  元.height = 生.高;
  const 元ctx = 元.getContext('2d');
  const 画 = 元ctx.createImageData(生.幅, 生.高);
  for (let i = 0, j = 0; i < 生.画素.length; i++, j += 4) {
    画.data[j] = 画.data[j + 1] = 画.data[j + 2] = 生.画素[i];
    画.data[j + 3] = 255;
  }
  元ctx.putImageData(画, 0, 0);
  const canvas = document.createElement('canvas');
  canvas.width = 幅;
  canvas.height = 高;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 幅, 高);
  ctx.translate(幅 / 2, 高 / 2);
  ctx.rotate(rad);
  ctx.drawImage(元, -生.幅 / 2, -生.高 / 2);
  const { data } = ctx.getImageData(0, 0, 幅, 高);
  元.width = 元.height = 0;
  canvas.width = canvas.height = 0;
  const 画素 = new Uint8Array(幅 * 高);
  for (let i = 0, j = 0; i < 画素.length; i++, j += 4) 画素[i] = data[j];
  return { 画素, 幅, 高 };
}

export const 道具 = { 画を読む, 回す };
