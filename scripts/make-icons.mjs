/**
 * アプリのアイコンを、端まで紺色で塗った形に作り直す。
 *
 *   node scripts/make-icons.mjs
 *
 * ■ なぜ作り直すか
 *
 * 元の絵（assets/kyudo_icon.png）は、640px のうち図柄が 459px しかなく、
 * 周りに白い余白があって、角丸も絵に焼き込まれている。
 * iOS も Android も、ホーム画面のアイコンは自分の形（丸・角丸）で切り抜く。
 * そこへ白い余白のある絵を渡すと、切り抜いた内側に白い四角が残る。
 * これが「白い座布団」「二重枠」の正体。
 *
 * そこで、外側の白を紺色（図柄の地の色）に塗り替えて端まで届かせる。
 * 中の白（的の輪・矢羽根）は図柄なので残す。外側から届く白だけを塗る。
 *
 * ■ 元の絵について
 *
 * assets/ の icon.png・favicon.png・kyudo_icon.png は、名前は .png だが
 * 中身は JPEG だった（先頭が ffd8ff）。3つとも同じ中身。
 * JPEG は透過を持てないので、余白は白い塗りとして入っている。
 * ここで作る出力は本物の PNG にする。
 *
 * ■ 出力先と、不透明にする理由
 *
 * web の PWA アイコン（apple-touch-icon・icon-192・icon-512）は pwa/ へ置く。
 * 配信は deploy-web.ps1 が pwa/ を dist の直下へ配る。ここが本番で使われる
 * 唯一の系。加えて端末アプリ用の assets/icon.png・favicon.png も作り直す。
 *
 * すべて**不透明**（アルファの層を持たない）で書き出す。iOS の
 * apple-touch-icon は透過を嫌い、透明な角を黒で合成した上に端末が自前の
 * 角丸を重ねるため、透過があると iPad でアイコンが出ない（2026-09 に本番の
 * 配信物で、角のアルファが 103〜174 と半透明になっているのを確認した）。
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import sharp from 'sharp';

const 根 = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const 元 = path.join(根, 'assets', 'kyudo_icon.png');

// 図柄の地の色。元の絵から拾った値
const 紺 = { r: 26, g: 53, b: 80 };

// 外側の白と見なす明るさ。紺（26,53,80）より十分上で、
// 図柄の縁のぼかしも拾える値
const 白のしきい = 150;
// 縁のぼかしが細い輪になって残らないよう、塗る範囲を少し広げる
const 広げる = 3;

// web の PWA アイコンは pwa/ へ置く。配信は deploy-web.ps1 が pwa/ を
// dist の直下へ配る（この置き場が本番で実際に使われる唯一の系）。
// iOS の apple-touch-icon は透過を嫌う——透明な角を黒で合成した上に端末が
// 自前の角丸を重ねるため、iPad でアイコンが出なかった（2026-09 に本番で確認）。
// だから**不透明**（アルファ無し）で書き出す。角丸も付けない。端末が丸くする。
const 出力 = [
  // web（配信しているのはこちら）
  { 先: 'pwa/apple-touch-icon.png', 大きさ: 180 },
  { 先: 'pwa/icon-192.png', 大きさ: 192 },
  { 先: 'pwa/icon-512.png', 大きさ: 512 },
  // expo が favicon.ico を作る元
  { 先: 'assets/favicon.png', 大きさ: 512 },
  // 端末に入れるときのアイコン（今は配信していないが、形式を揃えておく）
  { 先: 'assets/icon.png', 大きさ: 1024 },
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

// 縁から届く「外側の白」を塗り分ける。
// 中の白（的の輪・矢羽根）は紺に囲まれていて縁から届かないので残る
const 外 = new Uint8Array(W * H);
const 積 = [];
const 明るい = (i) => {
  const o = i * C;
  return data[o] > 白のしきい && data[o + 1] > 白のしきい && data[o + 2] > 白のしきい;
};
for (let x = 0; x < W; x++) {
  for (const y of [0, H - 1]) {
    const i = y * W + x;
    if (!外[i] && 明るい(i)) ((外[i] = 1), 積.push(i));
  }
}
for (let y = 0; y < H; y++) {
  for (const x of [0, W - 1]) {
    const i = y * W + x;
    if (!外[i] && 明るい(i)) ((外[i] = 1), 積.push(i));
  }
}
while (積.length) {
  const i = 積.pop();
  const x = i % W;
  const y = (i - x) / W;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const j = ny * W + nx;
    if (!外[j] && 明るい(j)) ((外[j] = 1), 積.push(j));
  }
}

// 縁のぼかしが細い輪で残らないよう、塗る範囲を数ピクセル広げる
for (let 回 = 0; 回 < 広げる; 回++) {
  const 前 = 外.slice();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (前[i]) continue;
      if (
        (x > 0 && 前[i - 1]) ||
        (x < W - 1 && 前[i + 1]) ||
        (y > 0 && 前[i - W]) ||
        (y < H - 1 && 前[i + W])
      )
        外[i] = 1;
    }
  }
}

let 塗った = 0;
const 出 = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const o = i * C;
  const q = i * 4;
  if (外[i]) {
    ((出[q] = 紺.r), (出[q + 1] = 紺.g), (出[q + 2] = 紺.b), (出[q + 3] = 255));
    塗った++;
  } else {
    ((出[q] = data[o]), (出[q + 1] = data[o + 1]), (出[q + 2] = data[o + 2]), (出[q + 3] = 255));
  }
}

const 割合 = Math.round((塗った / (W * H)) * 100);
console.log(`元: ${W}x${H}`);
console.log(`外側の白を紺に塗りました: ${塗った.toLocaleString()} 点（全体の ${割合}%）`);
if (割合 < 5 || 割合 > 60) {
  console.error(`停止：塗った割合が想定の範囲（5〜60%）から外れています。元の絵が変わった可能性があります`);
  process.exit(1);
}

// flatten でアルファの層を落とす（不透明にする）。地の紺で塗りつぶすので、
// 万一この先で透明が混ざっても紺で埋まる。iOS が嫌う透過を残さない
const 土台 = sharp(出, { raw: { width: W, height: H, channels: 4 } })
  .flatten({ background: { r: 紺.r, g: 紺.g, b: 紺.b } })
  .png();

for (const { 先, 大きさ } of 出力) {
  const 道 = path.join(根, 先);
  fs.mkdirSync(path.dirname(道), { recursive: true });
  await 土台
    .clone()
    .resize(大きさ, 大きさ, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(道);
  const 大 = fs.statSync(道).size;
  // 書き出したものが本当に不透明か（アルファの層を持っていないか）確かめる
  const md = await sharp(道).metadata();
  if (md.hasAlpha) {
    console.error(`停止：${先} にアルファの層が残っています（iOS でアイコンが出なくなる）`);
    process.exit(1);
  }
  console.log(`  作りました: ${先.padEnd(30)} ${大きさ}x${大きさ}  ${(大 / 1024).toFixed(1)}KB`);
}

console.log('\n完了。');
