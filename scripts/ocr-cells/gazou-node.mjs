/**
 * Node（sharp）で画を読む・回す。読み取りの中身（kiridasu / kami / manabu）は
 * sharp を知らない。ここが Node 側の画像の道具で、アプリ側は canvas の道具を持つ
 *（src/ocr/gazou-web.js）。両方とも同じ形を返す。
 *
 *   生 … { 画素: Uint8Array（明るさ）, 幅, 高, 色?: { data: Uint8Array, ch: number } }
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { 箱の大きさ } from './kiridasu.mjs';

/** 写真を読む。明るさ（明暗を伸ばしたもの）と色を持つ */
export async function 画を読む(みち) {
  const 色 = await sharp(みち).raw().toBuffer({ resolveWithObject: true });
  const 灰 = await sharp(みち).greyscale().normalise().raw().toBuffer({ resolveWithObject: true });
  return {
    画素: new Uint8Array(灰.data.buffer, 灰.data.byteOffset, 灰.data.length),
    幅: 灰.info.width,
    高: 灰.info.height,
    色: { data: new Uint8Array(色.data.buffer, 色.data.byteOffset, 色.data.length), ch: 色.info.channels },
  };
}

/** 明るさの画を回す（度）。白で埋める。回した分だけ画は大きくなる */
export async function 回す(生, 度) {
  const r = await sharp(Buffer.from(生.画素), { raw: { width: 生.幅, height: 生.高, channels: 1 } })
    .rotate(-度, { background: '#ffffff' })
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { 画素: new Uint8Array(r.data.buffer, r.data.byteOffset, r.data.length), 幅: r.info.width, 高: r.info.height };
}

/** 明るさの画を四角に切って PNG に書く（確かめ用のマスを保存するとき） */
export async function 四角を書く(生, 左, 上, 幅, 高, 先, 大きさ) {
  let s = sharp(Buffer.from(生.画素), { raw: { width: 生.幅, height: 生.高, channels: 1 } }).extract({ left: 左, top: 上, width: 幅, height: 高 });
  if (大きさ) s = s.resize(大きさ, 大きさ, { fit: 'fill' });
  await s.png().toFile(先);
}

export const 道具 = { 画を読む, 回す };

/** 明るさだけ読む（昔の 画素を読む と同じ） */
export async function 画素を読む(みち) {
  const 生 = await 画を読む(みち);
  return { 画素: 生.画素, 幅: 生.幅, 高: 生.高 };
}

/** マスを切り出して書き出す */
export async function マスを書き出す(格子の中身, 出し先, 札を付ける, 頭 = '') {
  fs.mkdirSync(出し先, { recursive: true });
  const { 半幅, 半高 } = 箱の大きさ(格子の中身);
  const 出 = [];
  for (let 列番 = 0; 列番 < 格子の中身.列.length; 列番++) {
    for (let 行番 = 0; 行番 < 格子の中身.行.位置.length; 行番++) {
      const cx = Math.round(格子の中身.列[列番].中心);
      const cy = Math.round(格子の中身.行.位置[行番] + (格子の中身.列[列番].ずれ || 0));
      const 左 = Math.max(0, cx - 半幅);
      const 上 = Math.max(0, cy - 半高);
      const w = Math.min(半幅 * 2, 格子の中身.幅 - 左);
      const h = Math.min(半高 * 2, 格子の中身.高 - 上);
      const 札 = 札を付ける ? 札を付ける(列番, 行番) : null;
      const 名 = (札 == null ? '' : 札 + '/') + 頭 + `r${行番}c${列番}.png`;
      const 先 = path.join(出し先, 名);
      fs.mkdirSync(path.dirname(先), { recursive: true });
      // 格子が起こしたあとの画から切る。元の写真から切ると、角度が付いたときに
      // 座標が合わない。学習側（muregaku）も同じ画から切っている
      await 四角を書く(格子の中身.生, 左, 上, w, h, 先, 64);
      出.push({ 列番, 行番, 札, 先 });
    }
  }
  return 出;
}
