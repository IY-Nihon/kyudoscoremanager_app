/**
 * 板の写真から、マスを1つずつ切り出す。学習用の札も一緒に貼る。
 *
 *   node scripts/ocr-cells/kiridasu.mjs <画像> <射手の人数> <1人あたりのマス数> [出し先]
 *   node scripts/ocr-cells/kiridasu.mjs 板.jpg 8 10 out --正解 910280:男子リーグ --起点 下から --列 0-7
 *
 * ■ どうやって格子を見つけるか
 * 罫線は薄くて写真では拾えない（実測）。○×そのものが規則正しく並んでいるので、
 * 濃いかたまりを拾い、その並びから格子を復元する。行の本数は分かっている
 *（射数と1マスの射数で決まる）ので、その本数の等間隔をいちばんよく合う位置に置く。
 *
 * ■ 名札の帯を外す
 * 名札は色の枠に入っている。彩度の高い帯を見つけて、そこから下は見ない。
 * 板の上端の数字（各人の的中数）も印ではないので、いちばん上の帯も外す。
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { 画素を読む, 暗さの境, かたまりを拾う, 束ねる } from './koushi.mjs';
import { 等間隔を当てはめる } from './atehameru.mjs';

/** 色の濃い（彩度の高い）帯を探す。名札はここに在る */
export async function 色の帯を探す(みち) {
  const { data, info } = await sharp(みち).raw().toBuffer({ resolveWithObject: true });
  const 幅 = info.width;
  const 高 = info.height;
  const ch = info.channels;
  const 彩度 = new Array(高).fill(0);
  for (let y = 0; y < 高; y++) {
    let 合 = 0;
    for (let x = 0; x < 幅; x++) {
      const i = (y * 幅 + x) * ch;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const 最大 = Math.max(r, g, b);
      const 最小 = Math.min(r, g, b);
      合 += 0 === 最大 ? 0 : (最大 - 最小) / 最大;
    }
    彩度[y] = 合 / 幅;
  }
  const 平均 = 彩度.reduce((a, b) => a + b, 0) / 高;
  // 下から見ていき、色の濃い帯が続く間は札とみなす
  let 札の上 = 高;
  for (let y = 高 - 1; y > 高 * 0.5; y--) {
    if (彩度[y] > 平均 * 1.6) 札の上 = y;
  }
  return { 札の上, 彩度の平均: 平均 };
}

/**
 * 格子を組み立てる。
 *
 * @param {string} みち
 * @param {{人数:number, 行数:number, 上を除く?:number}} 注文
 */
export async function 格子(みち, 注文) {
  const 生 = await 画素を読む(みち);
  const { 札の上 } = await 色の帯を探す(みち);
  const 境 = 暗さの境(生.画素);
  const 全かたまり = かたまりを拾う(生, 境);

  const 最小 = Math.round(生.幅 * 0.012);
  const 最大 = Math.round(生.幅 * 0.09);
  const 上限 = 注文.上を除く == null ? 生.高 * 0.13 : 注文.上を除く;
  const 印 = 全かたまり.filter(
    (b) =>
      b.幅 >= 最小 && b.幅 <= 最大 && b.高 >= 最小 && b.高 <= 最大 &&
      b.幅 / b.高 > 0.45 && b.幅 / b.高 < 2.2 &&
      b.数 > 最小 * 最小 * 0.12 &&
      b.y < 札の上 - 最小 && b.y > 上限
  );
  if (印.length < 注文.人数 * 3) {
    throw new Error('印が少なすぎます（' + 印.length + '個）。写真を撮り直してください');
  }

  const 印の幅 = 印.map((b) => b.幅).sort((a, z) => a - z)[Math.floor(印.length / 2)];
  const 全列 = 束ねる(印.map((b) => b.x), 印の幅 * 0.7);
  // 印の多い列から、頼まれた人数ぶんを取る（小計・合計の数字の列は印が少ない）
  const 射手の列 = 全列
    .slice()
    .sort((a, z) => z.数 - a.数)
    .slice(0, 注文.人数)
    .sort((a, z) => a.中心 - z.中心);

  const 射手の印 = 印.filter((b) => 射手の列.some((c) => Math.abs(b.x - c.中心) <= 印の幅 * 0.8));
  const 行 = 等間隔を当てはめる(射手の印.map((b) => b.y), 注文.行数, 印の幅 * 0.45);

  return { 幅: 生.幅, 高: 生.高, 札の上, 印の幅, 列: 射手の列, 行, 印: 射手の印 };
}

/** マスを切り出して書き出す */
export async function マスを書き出す(みち, 格子の中身, 出し先, 札を付ける) {
  fs.mkdirSync(出し先, { recursive: true });
  const 半幅 = Math.round(格子の中身.印の幅 * 0.85);
  const 半高 = Math.round(Math.min(格子の中身.行.間隔 * 0.48, 格子の中身.印の幅 * 0.9));
  const 出 = [];
  for (let 列番 = 0; 列番 < 格子の中身.列.length; 列番++) {
    for (let 行番 = 0; 行番 < 格子の中身.行.位置.length; 行番++) {
      const cx = Math.round(格子の中身.列[列番].中心);
      const cy = Math.round(格子の中身.行.位置[行番]);
      const 左 = Math.max(0, cx - 半幅);
      const 上 = Math.max(0, cy - 半高);
      const w = Math.min(半幅 * 2, 格子の中身.幅 - 左);
      const h = Math.min(半高 * 2, 格子の中身.高 - 上);
      const 札 = 札を付ける ? 札を付ける(列番, 行番) : null;
      const 名 = (札 == null ? '' : 札 + '/') + `r${行番}c${列番}.png`;
      const 先 = path.join(出し先, 名);
      fs.mkdirSync(path.dirname(先), { recursive: true });
      await sharp(みち).extract({ left: 左, top: 上, width: w, height: h }).resize(64, 64, { fit: 'fill' }).png().toFile(先);
      出.push({ 列番, 行番, 札, 先 });
    }
  }
  return 出;
}
