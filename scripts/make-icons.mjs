/**
 * アプリのアイコンを、端まで紺色で塗った形に作り直す。
 *
 *   node scripts/make-icons.mjs
 *
 * ■ なぜ作り直すか
 *
 * 元の絵（assets/kyudo_icon.png）は、640px のうち図柄が 429px しかなく、
 * 周りに白い余白があり、角丸のカード枠や影が焼き込まれている。
 * これをそのまま使うと：
 * 1. Android（Pixel 8a 等）では丸型マスク（セーフゾーン80%）が適用され、
 *    「丸枠」の中に「角丸カード」が入り、さらにその中に「小さな的マーク」が入る
 *    二重縮小状態になり、アイコンが極小になってしまう。
 * 2. iOS（iPad等）では、iPad専用のサイズ指定やフォールバック指定がないと
 *    アイコンが出ず、Webページのサムネイルになってしまう。
 *
 * そこで、中央の金色の円と弓矢のシンボル（直径429px）を高精度に抽出し、
 * 均一な紺色（#1A3550, rgb(26,53,80)）の背景と合成して以下の2系統を出力する：
 * - 通常アイコン（any / iOS / ファビコン）:
 *   シンボルを画像全体の約84%まで拡大し、iOSの角丸マスクにピッタリ収まるようにする。
 * - マスカブルアイコン（maskable / Android Pixel）:
 *   Androidのセーフゾーン（中央の直径80%の円）に合わせてシンボルを全体の約76%で配置し、
 *   丸く切り抜かれたときに画面いっぱいに大きく表示されるようにする。
 *
 * すべて**不透明**（アルファなし）で書き出し、iOSでの黒塗りや非表示を防止する。
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import sharp from 'sharp';

const 根 = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const 元 = path.join(根, 'assets', 'kyudo_icon.png');

// 図柄の地の色（紺色 #1A3550）
const 紺 = { r: 26, g: 53, b: 80 };

// 出力するアイコン定義
const 通常出力 = [
  // web（配信しているのはこちら）
  { 先: 'pwa/apple-touch-icon.png', 大きさ: 180 },
  { 先: 'pwa/apple-touch-icon-152.png', 大きさ: 152 },
  { 先: 'pwa/apple-touch-icon-167.png', 大きさ: 167 },
  { 先: 'pwa/icon-192.png', 大きさ: 192 },
  { 先: 'pwa/icon-512.png', 大きさ: 512 },
  // expo が favicon.ico を作る元
  { 先: 'assets/favicon.png', 大きさ: 512 },
  // 端末に入れるときのアイコン
  { 先: 'assets/icon.png', 大きさ: 1024 },
];

const マスカブル出力 = [
  { 先: 'pwa/icon-maskable-192.png', 大きさ: 192 },
  { 先: 'pwa/icon-maskable-512.png', 大きさ: 512 },
];

if (!fs.existsSync(元)) {
  console.error(`停止：${元} がありません`);
  process.exit(1);
}

const { data, info } = await sharp(元).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const C = info.channels;

if (W !== H) {
  console.error(`停止：元の絵が正方形ではありません（${W}x${H}）`);
  process.exit(1);
}

// 金色の円の中心と半径（実測値: cx=319.5, cy=319.0, R=216）
const cx = 319.5;
const cy = 319.0;
const R = 216;

// シンボル部分を高精度にアルファ付きで切り出し
const symSize = Math.ceil(R * 2 + 4);
const symBuf = Buffer.alloc(symSize * symSize * 4);
const startX = Math.round(cx - symSize / 2);
const startY = Math.round(cy - symSize / 2);

for (let y = 0; y < symSize; y++) {
  for (let x = 0; x < symSize; x++) {
    const srcX = startX + x;
    const srcY = startY + y;
    const outIdx = (y * symSize + x) * 4;

    if (srcX < 0 || srcX >= W || srcY < 0 || srcY >= H) continue;

    const srcIdx = (srcY * W + srcX) * C;
    const dist = Math.sqrt((srcX - cx) ** 2 + (srcY - cy) ** 2);

    if (dist > R + 1.5) {
      symBuf[outIdx + 3] = 0; // 外側は透明
    } else if (dist > R - 1) {
      // 境界のアンチエイリアス処理
      const alpha = Math.min(1, Math.max(0, (R + 1.5 - dist) / 2.5));
      symBuf[outIdx] = data[srcIdx];
      symBuf[outIdx + 1] = data[srcIdx + 1];
      symBuf[outIdx + 2] = data[srcIdx + 2];
      symBuf[outIdx + 3] = Math.round(255 * alpha);
    } else {
      symBuf[outIdx] = data[srcIdx];
      symBuf[outIdx + 1] = data[srcIdx + 1];
      symBuf[outIdx + 2] = data[srcIdx + 2];
      symBuf[outIdx + 3] = 255;
    }
  }
}

const symbolImg = sharp(symBuf, { raw: { width: symSize, height: symSize, channels: 4 } });

// アイコン生成関数
async function writeIcon(先, 大きさ, 比率) {
  const 道 = path.join(根, 先);
  fs.mkdirSync(path.dirname(道), { recursive: true });

  const targetDiameter = Math.round(大きさ * 比率);
  const resizedSym = await symbolImg
    .clone()
    .resize(targetDiameter, targetDiameter)
    .png()
    .toBuffer();

  const offset = Math.round((大きさ - targetDiameter) / 2);

  await sharp({
    create: {
      width: 大きさ,
      height: 大きさ,
      channels: 3,
      background: 紺,
    },
  })
    .composite([
      {
        input: resizedSym,
        top: offset,
        left: offset,
      },
    ])
    .flatten({ background: 紺 })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(道);

  const stat = fs.statSync(道);
  const md = await sharp(道).metadata();
  if (md.hasAlpha) {
    console.error(`停止：${先} にアルファの層が残っています（iOS でアイコンが出なくなる）`);
    process.exit(1);
  }
  console.log(`  作りました: ${先.padEnd(32)} ${大きさ}x${大きさ}  (${(stat.size / 1024).toFixed(1)}KB)`);
}

console.log('--- 通常アイコン（any / iOS / ファビコン）の生成 ---');
for (const { 先, 大きさ } of 通常出力) {
  // 通常アイコンは全体の約84%（iOSの角丸に収まる最大比率）
  await writeIcon(先, 大きさ, 0.84);
}

console.log('\n--- マスカブルアイコン（maskable / Android Pixel）の生成 ---');
for (const { 先, 大きさ } of マスカブル出力) {
  // マスカブルは全体の約76%（Androidのセーフゾーン80%内に収まる比率）
  await writeIcon(先, 大きさ, 0.76);
}

console.log('\nアイコンの生成がすべて完了しました。');
