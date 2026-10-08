// マスの見分けを比べるためのデータを書き出す（Node・アプリと同じ切り抜き）。
//   node dump.mjs [合成の板の枚数=120]
// 出力（この置き場の data/）
//   real.u8 / real.f32 / real.json … 正解つきの本物のマス（写真ごと・板ごとの組つき）
//   syn.u8  / syn.f32  / syn.json  … 描いた板のマス（学習用）
//   .u8 は 1 マス 40×40 の明るさ（切り抜きを 40×40 に伸ばしたもの）、.f32 は網の入力（形にする の 492）
// 名前は書き出さない
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const 本体 = 'C:/Users/yutoi/Documents/kyudo/app/';
process.chdir(本体);
const require = createRequire(本体 + 'package.json');
const sharp = require('sharp');
const ここ = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
// 正解（seikai-0927.mjs・seikai-1004.mjs）は名前入りなので倉庫の外（既定は kyudo-ocr-ag/.hakari）
const 正解の置き場 = process.env.SEIKAI || 'C:/Users/yutoi/Documents/kyudo/kyudo-ocr-ag/.hakari';
const 出の置き場 = process.env.CNN_DATA || path.join(ここ, 'data');
fs.mkdirSync(出の置き場, { recursive: true });
const imp = (p) => import('file:///' + 本体 + p);
const { 板の印を読む, 黒板なら裏返す, 交代のマスか, 空のマスか, 大前から並べる } = await imp('src/ocr/yomu.js');
const { 板ごとの格子, 箱の大きさ, マスの中心y, マスの中心x, 格子 } = await imp('scripts/ocr-cells/kiridasu.mjs');
const { 種類, 形にする, 切り取る } = await imp('scripts/ocr-cells/manabu.mjs');
const { 画を読む, 回す } = await imp('scripts/ocr-cells/gazou-node.mjs');
const { 射手たち } = await imp('scripts/ocr-cells/kiroku.mjs');
const { 板をえがく } = await imp('scripts/ocr-cells/ban.mjs');
const { 明暗を伸ばす } = await imp('scripts/ocr-cells/koushi.mjs');
const { 写真たち: 写真0927 } = await import('file:///' + 正解の置き場 + '/seikai-0927.mjs');
const { 写真たち1004 } = await import('file:///' + 正解の置き場 + '/seikai-1004.mjs');
const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
const 辺 = Number(process.env.DUMP_HEN) || 40;
const 名の後 = process.env.DUMP_HEN ? String(process.env.DUMP_HEN) : '';

const 二射 = { '○○': '◎', '○×': '○\\', '×○': '○/', '××': '×' };
const 記号 = { '◎': '◎', '＼': '○\\', '／': '○/', '×': '×', '・': '' };
const 札の名 = { batsu: '×', maru2: '◎', maru_gyaku: '○\\', maru_seki: '○/' };
function 札を読む(置き場) {
  const 出 = {};
  for (const 種 of Object.keys(札の名)) {
    const d = path.join(置き場, 種);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      const m = f.match(/b(\d+)-r(\d+)c(\d+)/) || f.match(/()r(\d+)c(\d+)/);
      if (m) 出[`${m[1] || 0}-${m[2]}-${m[3]}`] = 札の名[種];
    }
  }
  return 出;
}

/** 切り抜きを 辺×辺 に伸ばす（双線形） */
function 伸ばす(画, 幅, 高) {
  const 出 = new Uint8Array(辺 * 辺);
  for (let y = 0; y < 辺; y++) {
    for (let x = 0; x < 辺; x++) {
      const sx = ((x + 0.5) * 幅) / 辺 - 0.5;
      const sy = ((y + 0.5) * 高) / 辺 - 0.5;
      const x0 = Math.max(0, Math.min(幅 - 1, Math.floor(sx)));
      const y0 = Math.max(0, Math.min(高 - 1, Math.floor(sy)));
      const x1 = Math.min(幅 - 1, x0 + 1);
      const y1 = Math.min(高 - 1, y0 + 1);
      const tx = Math.min(1, Math.max(0, sx - x0));
      const ty = Math.min(1, Math.max(0, sy - y0));
      const v = (画[y0 * 幅 + x0] * (1 - tx) + 画[y0 * 幅 + x1] * tx) * (1 - ty) + (画[y1 * 幅 + x0] * (1 - tx) + 画[y1 * 幅 + x1] * tx) * ty;
      出[y * 辺 + x] = Math.round(v);
    }
  }
  return 出;
}

/** アプリと同じ切り抜き（交代のマスは線の上だけ）。空なら null */
function マスを切る(g, c, r) {
  const { 半幅, 半高 } = 箱の大きさ(g);
  const 左 = Math.max(0, Math.round(マスの中心x(g, c, r)) - 半幅);
  const 上 = Math.max(0, Math.round(マスの中心y(g, c, r)) - 半高);
  const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);
  let 対象切 = 切;
  const 交代線 = 交代のマスか(切);
  if (交代線) {
    const ずらし = Math.min(Math.round(切.高 * 0.6), 切.高 - 交代線.minY);
    const 新上 = Math.max(0, 上 - ずらし);
    const 新切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 新上, 半幅 * 2, 半高 * 2);
    const 新画 = new Uint8Array(新切.画);
    const 新線y = 交代線.minY + ずらし;
    for (let y = Math.max(0, Math.min(新切.高 - 1, 新線y)); y < 新切.高; y++) for (let x = 0; x < 新切.幅; x++) 新画[y * 新切.幅 + x] = 255;
    対象切 = Object.assign({}, 新切, { 画: 新画 });
  }
  if (空のマスか(対象切, !g.立て方)) return null;
  return 対象切;
}

const 本物 = { 画: [], 形: [], 札: [] };

/** 写真 1 枚を読み、板ごと・列ごと・行ごとの正解（札を返す関数）で集める */
async function 写真を集める(みち, 注文, 組, 札を引く) {
  const 元 = 黒板なら裏返す(await 画を読む(みち));
  let 読み;
  let 板たち;
  try {
    読み = await 板の印を読む(元, { ...注文, 回す, 重み });
    板たち = await 板ごとの格子(元, { ...注文, 回す });
  } catch (e) {
    console.log('  読めない', 組, e.message);
    return;
  }
  let 数 = 0;
  for (let b = 0; b < 板たち.length; b++) {
    const g = 板たち[b].格子;
    for (let c = 0; c < g.列.length; c++) {
      for (let r = 0; r < g.行.位置.length; r++) {
        const 札 = 札を引く(b, c, r);
        if (!札) continue;
        const k = 種類.indexOf(札);
        if (k < 0) continue;
        const 切 = マスを切る(g, c, r);
        if (!切) continue;
        const 形 = await 形にする(切.画, 切.幅, 切.高, g.立て方 ? 'ぎっしり' : undefined, { 印の幅: g.箱の幅 || g.印の幅 });
        本物.画.push(伸ばす(切.画, 切.幅, 切.高));
        本物.形.push(Float32Array.from(形));
        本物.札.push({ 組, 写真: path.basename(みち), 板: b, 列: c, 行: r, 札: k, アプリ: 種類.indexOf((読み[b] && 読み[b].列たち[c] && 読み[b].列たち[c][r]) || '') });
        数++;
      }
    }
  }
  console.log(`  ${組} ${path.basename(みち)}: ${数} マス`);
}

// ── 本物 ──
const D = 'C:/Users/yutoi/Downloads/Photos-1-001/';
// 9/6 の板（910280 の 9/6 男子リーグ、板 2 枚）。板 0 は左から、板 1 は右から射手 1〜16
await 写真を集める('docs/ocr-samples/PXL_20260906_081921509.jpg', { 板の人数たち: [8, 8], 行数: 10 }, 'g0906', (b, c, r) => {
  const 番 = b === 0 ? c : 8 + (7 - c);
  const 印 = 射手たち[番] && 射手たち[番].印;
  if (!印) return null;
  const p = 10 - 1 - r;
  return 二射[印[2 * p] + 印[2 * p + 1]] || null;
});
const 札の写真 = [
  { 名: '9/13 A', 組: 'g0913AB', ファイル: D + 'PXL_20260913_065725959.jpg', 人数: [4, 4], 札: 'cells-0913/a' },
  { 名: '9/13 B', 組: 'g0913AB', ファイル: D + 'original_b54b3e10-19d0-42ad-8a23-dc15c46dc81e_PXL_20260913_065722692.jpg', 人数: [4, 4], 札: 'cells-0913/b' },
  { 名: '9/13 A途中', 組: 'g0913AB', ファイル: D + 'PXL_20260913_050816082.jpg', 人数: [4, 4], 行数: 6, 札: 'cells-0913/a', 行ずれ: 4 },
  { 名: '9/13 B途中', 組: 'g0913AB', ファイル: D + 'PXL_20260913_053112541.jpg', 人数: [4, 4], 行数: 6, 札: 'cells-0913/b', 行ずれ: 4 },
  { 名: '9/13 C', 組: 'g0913CD', ファイル: D + 'PXL_20260913_094208883.jpg', 人数: [4, 4], 札: 'cells-0913/c', 箱たち: [[143, 154, 571, 361], [143, 507, 571, 691]], 帯の数: 5 },
  { 名: '9/13 D', 組: 'g0913CD', ファイル: D + 'PXL_20260913_094214393.jpg', 人数: [4, 4], 札: 'cells-0913/d', 箱たち: [[143, 307, 580, 511], [143, 664, 578, 864]], 帯の数: 5 },
  { 名: '9/20 a', 組: 'g0920a', ファイル: D + '55fcb165d951e2a6b8d11a322f21bcee.webp', 人数: [10], 札: 'cells-0920/a' },
  { 名: '9/20 b', 組: 'g0920b', ファイル: D + '3565a034b798740fa3f964f224cecc2b.webp', 人数: [11], 札: 'cells-0920/b' },
  { 名: '9/20 d', 組: 'g0920d', ファイル: D + 'd2420d473fdaa743e913b04dcc646dbf.webp', 人数: [10], 札: 'cells-0920/d' },
];
for (const 写 of 札の写真) {
  const 札 = 札を読む('docs/ocr-samples/' + 写.札);
  const ずれ = 写.行ずれ || 0;
  await 写真を集める(写.ファイル, { 板の人数たち: 写.人数, 行数: 写.行数 || 10, 箱たち: 写.箱たち, 帯の数: 写.帯の数 }, 写.組, (b, c, r) => 札[`${b}-${r + ずれ}-${c}`] || null);
}
// 9/27 と 10/4（写真の左からの列、上からの印）
const 列の写真 = [
  ...写真0927.filter((x) => !x.名.includes('縮めた')).map((x) => ({ ...x, 組: x.名.includes('城西') ? 'g0927JD' : 'g0927SD' })),
  ...写真たち1004.filter((x) => !x.名.includes('途中')).map((x) => ({ ...x, 組: x.名.includes('両方') ? null : x.名.includes('日大') ? 'g1004N' : 'g1004C' })),
];
for (const 写 of 列の写真) {
  // 板 4 つの写真は、Gemini が答える形（板 8 人を 2 枚）で読む
  const 人数たち = 写.列たち.length === 16 && 写.板の人数たち.length === 4 ? [8, 8] : 写.板の人数たち;
  const 組を決める = (b) => 写.組 || (写.名.startsWith('10/4') ? (b === 0 ? 'g1004C' : 'g1004N') : 'g0927SD');
  const 先頭 = 人数たち.map((_, i) => 人数たち.slice(0, i).reduce((a, z) => a + z, 0));
  // 組は板ごとに違うことがある（10/4 の両方の板）。写真を集める の組は板 0 のもので書き、あとで直す
  const 始め = 本物.札.length;
  await 写真を集める(写.道, { 板の人数たち: 人数たち, 行数: 10 }, 組を決める(0), (b, c, r) => {
    const 列 = 写.列たち[先頭[b] + c];
    if (!列) return null;
    return 記号[列[r]] || null;
  });
  for (let i = 始め; i < 本物.札.length; i++) 本物.札[i].組 = 組を決める(本物.札[i].板);
}

function 書く(名, 束) {
  // 辺を変えたときは名に辺を付ける（real32 など）
  const n = 束.札.length;
  const 画 = new Uint8Array(n * 辺 * 辺);
  束.画.forEach((x, i) => 画.set(x, i * 辺 * 辺));
  const 形 = new Float32Array(n * 束.形[0].length);
  束.形.forEach((x, i) => 形.set(x, i * x.length));
  名 = 名 + 名の後;
  fs.writeFileSync(path.join(出の置き場, 名 + '.u8'), Buffer.from(画.buffer));
  fs.writeFileSync(path.join(出の置き場, 名 + '.f32'), Buffer.from(形.buffer));
  fs.writeFileSync(path.join(出の置き場, 名 + '.json'), JSON.stringify({ 辺, 入: 束.形[0].length, 種類, 札: 束.札 }));
  const 数え = {};
  for (const s of 束.札) 数え[s.組] = (数え[s.組] || 0) + 1;
  console.log(`${名}: ${n} マス`, JSON.stringify(数え));
}
書く('real', 本物);

// ── 描いた板（muregaku と同じ作り方。ずらしは 3 通り）──
const 枚数 = Number(process.argv[2]) || 120;
const 合成 = { 画: [], 形: [], 札: [] };
const 置き場 = (process.env.TEMP || '.') + '/ocr-ml-syn';
fs.mkdirSync(置き場, { recursive: true });
for (let i = 0; i < 枚数; i++) {
  const 人数 = [4, 6, 8, 8, 8, 10, 12][i % 7];
  const 行数 = [8, 10, 10, 10, 12, 6][i % 6];
  const 立の人数 = [3, 4, 4, 4, 5][i % 5];
  const ぎっしり = i % 5 === 1 || i % 5 === 3;
  const 別のペン = 0.5;
  const b = ぎっしり
    ? 板をえがく({ 種: 3000 + i * 6961, 人数, 行数, 立の人数, マス: 40 + (i % 4) * 10, 書き方: 'ぎっしり', 別のペン })
    : 板をえがく({ 種: 3000 + i * 6961, 人数, 行数, 立の人数, 幅: 2000, 別のペン });
  const みち = `${置き場}/b${i}.jpg`;
  await sharp(Buffer.from(b.色), { raw: { width: b.幅, height: b.高, channels: 3 } }).jpeg({ quality: 88 }).toFile(みち);
  let g;
  try {
    g = await 格子(await 画を読む(みち), { 人数, 行数, 回す });
  } catch (e) {
    g = null;
  }
  const 合う = g && g.列.length === 人数 && g.行.位置.length === 行数 && g.列.every((c, k) => Math.abs(c.中心 - b.答え.列のx[k]) <= b.答え.マス * 0.35) && g.行.位置.every((y, r) => Math.abs(y - b.答え.行のy[r]) <= b.答え.マス * 0.35);
  if (!合う) {
    if (!ぎっしり) continue;
    const { data, info } = await sharp(みち).greyscale().raw().toBuffer({ resolveWithObject: true });
    g = { 幅: info.width, 高: info.height, 印の幅: b.答え.印の幅, 列: b.答え.列のx.map((x) => ({ 中心: x, ずれ: 0 })), 行: { 位置: b.答え.行のy.slice(), 間隔: b.答え.マス }, 生: { 画素: 明暗を伸ばす(data), 幅: info.width, 高: info.height }, 角度: 0 };
  }
  const { 半幅, 半高 } = 箱の大きさ(g);
  const 幅 = 0.13;
  const ずらし = [[0, 0], [0, -幅], [幅 * 0.8, 幅 * 0.45]];
  for (let c = 0; c < g.列.length; c++) {
    for (let r = 0; r < g.行.位置.length; r++) {
      const k = 種類.indexOf(b.答え.マスの中身[c][r]);
      if (k < 0) continue;
      for (const [dx, dy] of ずらし) {
        const 左 = Math.max(0, Math.round(g.列[c].中心 + dx * g.印の幅) - 半幅);
        const 上 = Math.max(0, Math.round(g.行.位置[r] + (g.列[c].ずれ || 0) + dy * g.行.間隔) - 半高);
        const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);
        合成.画.push(伸ばす(切.画, 切.幅, 切.高));
        合成.形.push(Float32Array.from(await 形にする(切.画, 切.幅, 切.高)));
        合成.札.push({ 組: 'syn', 板: i, 列: c, 行: r, 札: k });
      }
    }
  }
  fs.rmSync(みち, { force: true });
  if (i % 20 === 19) console.log(`  描いた板 ${i + 1}/${枚数}: ${合成.札.length} マス`);
}
書く('syn', 合成);
