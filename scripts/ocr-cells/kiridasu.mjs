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

  // 印の大きさの見当は、画像の幅ではなく「1マスがどれくらいか」から取る。
  // 人数が少ない板ほどマスは大きい。幅だけで決めると、4人の板で印が
  // 大きすぎて網に掛からず、数字の列を射手の列と取り違えた（実測）。
  // 列は 射手＋立ごとの小計＋合計＋余白 でおよそ 人数×1.35+2 本
  const 期待するマス = 生.幅 / (注文.人数 * 1.35 + 2);
  const 最小 = Math.max(6, Math.round(期待するマス * 0.22));
  const 最大 = Math.round(期待するマス * 1.15);
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

  // 射手の列を選ぶ。数だけで選ぶと、小計や合計の数字の列を拾ってしまう
  //（数字も、大きさだけ見れば印と変わらない）。
  // 射手の列は「行が上から下まで埋まっている」ことで見分ける。
  // 数字はところどころにしか書かれない。
  const 埋まり具合 = (列) => {
    const この列 = 印.filter((b) => Math.abs(b.x - 列.中心) <= 印の幅 * 0.8);
    if (この列.length < 2) return 0;
    const 行 = 等間隔を当てはめる(この列.map((b) => b.y), 注文.行数, 印の幅 * 0.45);
    let 埋 = 0;
    for (const y of 行.位置) {
      if (この列.some((b) => Math.abs(b.y - y) <= Math.max(印の幅 * 0.5, 行.間隔 * 0.45))) 埋++;
    }
    return 埋 / 注文.行数;
  };
  const 点数つき = 全列.map((c) => ({ 列: c, 埋: 埋まり具合(c) }));
  const 射手の列 = 点数つき
    .slice()
    .sort((a, z) => z.埋 - a.埋 || z.列.数 - a.列.数)
    .slice(0, 注文.人数)
    .map((x) => x.列)
    .sort((a, z) => a.中心 - z.中心);

  const 射手の印 = 印.filter((b) => 射手の列.some((c) => Math.abs(b.x - c.中心) <= 印の幅 * 0.8));
  const 行 = 等間隔を当てはめる(射手の印.map((b) => b.y), 注文.行数, 印の幅 * 0.45);

  // 写真は少し傾いている。板ぜんぶに1つの格子を当てると、端の列ほど
  // 上下にずれ、印が切れて写る（実測で、右端の列の印が下で切れていた）。
  // 列ごとに「どれだけ下にずれているか」を測って持たせる。
  // 10行ぶんの印から決めるので、1行ずつ寄せるのと違ってぶれない
  for (const 列 of 射手の列) {
    const 残り = [];
    for (const b of 射手の印) {
      if (Math.abs(b.x - 列.中心) > 印の幅 * 0.8) continue;
      let 近さ = Infinity;
      for (const y of 行.位置) {
        const d = b.y - y;
        if (Math.abs(d) < Math.abs(近さ)) 近さ = d;
      }
      if (Math.abs(近さ) <= 行.間隔 * 0.42) 残り.push(近さ);
    }
    if (残り.length < 4) {
      列.ずれ = 0;
      continue;
    }
    残り.sort((a, z) => a - z);
    const 真ん中 = 残り[Math.floor(残り.length / 2)];
    列.ずれ = Math.max(-行.間隔 * 0.3, Math.min(行.間隔 * 0.3, 真ん中));
  }

  return { 幅: 生.幅, 高: 生.高, 札の上, 印の幅, 列: 射手の列, 行, 印: 射手の印 };
}

/**
 * 1マスを切り出す箱の大きさ。
 *
 * 学習側と本物側で別々に書いていたら、片方が 行の間隔×0.37、もう片方が
 * ×0.48 になっていた。同じ写真から違う大きさで切っていたので、網が見ている
 * ものが食い違っていた。ここ一箇所で決める。
 */
export function 箱の大きさ(格子の中身) {
  const 半幅 = Math.round(格子の中身.印の幅 * (Number(process.env.OCR_HABA) || 0.85));
  const 半高 = Math.round(
    Math.min(格子の中身.行.間隔 * (Number(process.env.OCR_TAKA) || 0.48), 格子の中身.印の幅 * 0.9)
  );
  return { 半幅, 半高 };
}

/** マスを切り出して書き出す */
export async function マスを書き出す(みち, 格子の中身, 出し先, 札を付ける, 頭 = '') {
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
      await sharp(みち).extract({ left: 左, top: 上, width: w, height: h }).resize(64, 64, { fit: 'fill' }).png().toFile(先);
      出.push({ 列番, 行番, 札, 先 });
    }
  }
  return 出;
}
