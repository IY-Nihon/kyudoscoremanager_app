/**
 * 崩した写真で、どこまで読めるかを測る。
 *
 *   node scripts/ocr-cells/tameshi.mjs
 *
 * 本物の写真を、傾け・歪ませ・ぼかし・暗くし・ざらつかせてから、いつもの
 * 読み取りを通す。印そのものは本物のままなので、答えは変わらない。
 *
 * ■ 見るところ
 *   格子 … そもそも格子が立つか（立たなければ何も読めない）
 *   マス … 1マスずつの当たり
 *   射  … 辻褄合わせまで通したあとの、○×の当たり
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 格子, 箱の大きさ } from './kiridasu.mjs';
import { 種類, 形にする, 前へ, 切り取る } from './manabu.mjs';
import { 射手たち } from './kiroku.mjs';
import { 縦横で合わせる } from './tsujitsuma2.mjs';
import { 崩し方, ゆがませる } from './kuzusu.mjs';
import { 重みを読む } from './chiisaku.mjs';

const 逆 = String.fromCharCode(92);
const 立のマス = 2;
const 元みち = 'docs/ocr-samples/PXL_20260906_081921509.jpg';
const 置き = (process.env.TEMP || '.') + '/tameshi';
fs.mkdirSync(置き, { recursive: true });

const ほどく = { '×': '××', '◎': '○○' };
ほどく['○' + 逆] = '○×';
ほどく['○/'] = '×○';

const 区画 = [
  { 名: 'hidari-a', left: 314, top: 1168, width: 659, height: 971, 順: [0, 1, 2, 3] },
  { 名: 'hidari-b', left: 1138, top: 1168, width: 649, height: 971, 順: [4, 5, 6, 7] },
  { 名: 'migi-a', left: 2994, top: 1121, width: 643, height: 1052, 順: [15, 14, 13, 12] },
  { 名: 'migi-b', left: 3808, top: 1121, width: 638, height: 1052, 順: [11, 10, 9, 8] },
];

const 群れ = 重みを読む(process.env.OCR_OMOMI || 'scripts/ocr-cells/mure.json');
const 見立てる = (形) => {
  const 合 = new Float32Array(種類.length);
  for (const 網 of 群れ) {
    const { o } = 前へ(網, 形);
    for (let k = 0; k < 種類.length; k++) 合[k] += o[k] / 群れ.length;
  }
  return 合;
};

/** 正しいマスの中身（上から下）を、記録から作る */
function 答えのマス(番号) {
  const 印 = [...射手たち[番号].印];
  const マス = [];
  for (let i = 0; i < 印.length; i += 2) {
    const a = 印[i];
    const b = 印[i + 1];
    マス.push(a === '○' && b === '○' ? '◎' : a === '○' ? '○' + 逆 : b === '○' ? '○/' : '×');
  }
  return マス.reverse();
}

const 生 = await sharp(元みち).greyscale().raw().toBuffer({ resolveWithObject: true });
const 全 = { 画: 生.data, 幅: 生.info.width, 高: 生.info.height, 面: 1 };

/** ひととおり読んで、当たりを返す */
async function 読んでみる(崩し, 味付け, 名) {
  const 歪み = 崩し || 味付け.ぼかし || 味付け.縮小 || 味付け.明るさ !== 1 || 味付け.締まり !== 1 || 味付け.ざらつき
    ? ゆがませる(全, { 崩し, ...味付け })
    : 全;
  let 立った = 0;
  let マス当 = 0;
  let マス全 = 0;
  let 射当 = 0;
  let 射全 = 0;
  for (const k of 区画) {
    // 崩したあとの四隅から、切り出す四角を決める。四隅の位置を知っているのは
    // 試験だからで、格子の立て方と印の読み方だけを測っている
    const 隅 = [
      [k.left, k.top],
      [k.left + k.width, k.top],
      [k.left + k.width, k.top + k.height],
      [k.left, k.top + k.height],
    ].map(([x, y]) => (崩し ? 崩し.写す(x, y) : [x, y]));
    const xs = 隅.map((p) => p[0]);
    const ys = 隅.map((p) => p[1]);
    const 左 = Math.max(0, Math.floor(Math.min(...xs)));
    const 上 = Math.max(0, Math.floor(Math.min(...ys)));
    const w = Math.min(歪み.幅 - 左, Math.ceil(Math.max(...xs)) - 左);
    const h = Math.min(歪み.高 - 上, Math.ceil(Math.max(...ys)) - 上);
    const 切 = 切り取る(歪み.画, 歪み.幅, 歪み.高, 左, 上, w, h);
    if (process.env.OCR_NOKOSU) {
      await sharp(Buffer.from(切.画), { raw: { width: 切.幅, height: 切.高, channels: 1 } })
        .jpeg({ quality: 90 })
        .toFile(`${置き}/${名}-${k.名}.jpg`);
    }

    // 角度は格子が自分で測る。区画ごとの手当ては入れない（本番では無いので）
    let g;
    try {
      g = await 格子({ 画素: 切.画, 幅: 切.幅, 高: 切.高 }, { 人数: k.順.length, 行数: 10, 上を除く: 0 });
    } catch (e) {
      マス全 += 40;
      射全 += 80;
      continue;
    }
    if (g.列.length !== k.順.length || g.行.位置.length !== 10) {
      マス全 += 40;
      射全 += 80;
      continue;
    }
    立った++;
    const 区画の前 = マス当;
    // 起こしたあとの画から切る（角度が付くと元の画とは座標が合わない）
    const 画 = g.生;
    const { 半幅, 半高 } = 箱の大きさ(g);
    const 見立て = [];
    for (let c = 0; c < g.列.length; c++) {
      const 列 = [];
      for (let r = 0; r < g.行.位置.length; r++) {
        const l = Math.max(0, Math.round(g.列[c].中心) - 半幅);
        const t = Math.max(0, Math.round(g.行.位置[r] + (g.列[c].ずれ || 0)) - 半高);
        const 切2 = 切り取る(画.画素, 画.幅, 画.高, l, t, 半幅 * 2, 半高 * 2);
        列.push(見立てる(await 形にする(切2.画, 切2.幅, 切2.高)));
      }
      見立て.push(列);
    }
    const 正 = k.順.map(答えのマス);
    const 的中たち = k.順.map((i) => 射手たち[i].的中);
    const 小計 = new Array(10 / 立のマス).fill(0);
    for (let a = 0; a < k.順.length; a++) {
      for (let r = 0; r < 10; r++) {
        const s = 正[a][r];
        小計[Math.floor(r / 立のマス)] += s === '◎' ? 2 : s === '×' ? 0 : 1;
      }
    }
    const { 番 } = 縦横で合わせる(見立て, 種類, 的中たち, 小計, 立のマス);
    for (let a = 0; a < k.順.length; a++) {
      const 読み = [];
      for (let r = 0; r < 10; r++) {
        let 最 = 0;
        for (let x = 1; x < 種類.length; x++) if (見立て[a][r][x] > 見立て[a][r][最]) 最 = x;
        マス全++;
        if (種類[最] === 正[a][r]) マス当++;
        読み.push(種類[番 ? 番[a][r] : 最]);
      }
      const 並び = 読み.slice().reverse().map((s) => ほどく[s]).join('');
      const 真 = 射手たち[k.順[a]].印;
      for (let i = 0; i < 真.length; i++) {
        射全++;
        if (並び[i] === 真[i]) 射当++;
      }
    }
    if (process.env.OCR_KUWASHIKU) {
      console.log(`    ${k.名}: 角度=${g.角度.toFixed(2)}度 マス ${マス当 - 区画の前}/40`);
    }
  }
  return { 立った, マス当, マス全, 射当, 射全 };
}

const 素 = { ぼかし: 0, 明るさ: 1, 締まり: 1, ざらつき: 0 };
const 献立 = [
  { 名: 'そのまま', 崩し: null, 味: 素 },
  { 名: '傾き3度', 回す: 3 },
  { 名: '傾き6度', 回す: 6 },
  { 名: '傾き10度', 回す: 10 },
  { 名: '台形0.10', 台形: 0.1 },
  { 名: '台形0.20', 台形: 0.2 },
  { 名: '傾き5度+台形0.15', 回す: 5, 台形: 0.15 },
  { 名: '暗い', 崩し: null, 味: { ...素, 明るさ: 0.55 } },
  { 名: '薄い（締まり0.5）', 崩し: null, 味: { ...素, 締まり: 0.5 } },
  { 名: 'ざらつき40', 崩し: null, 味: { ...素, ざらつき: 40 } },
  { 名: 'ぼけ3px', 崩し: null, 味: { ...素, ぼかし: 3 } },
  { 名: 'ぼけ6px', 崩し: null, 味: { ...素, ぼかし: 6 } },
  { 名: '縮小0.5（半分の画素）', 崩し: null, 味: { ...素, 縮小: 0.5 } },
  { 名: '縮小0.33', 崩し: null, 味: { ...素, 縮小: 0.33 } },
  { 名: '縮小0.5＋ぼけ2＋暗い', 崩し: null, 味: { ...素, 縮小: 0.5, ぼかし: 2, 明るさ: 0.7 } },
  { 名: '斜め＋暗い＋ざらつき', 回す: 6, 台形: 0.12, 味: { ...素, 明るさ: 0.6, ざらつき: 25 } },
];

console.log('崩し方                    格子  マス            射');
for (const 品 of 献立) {
  const 崩し =
    品.回す || 品.台形
      ? 崩し方({ 幅: 全.幅, 高: 全.高, 回す: 品.回す || 0, 台形: 品.台形 || 0, 種: 12345 })
      : null;
  const r = await 読んでみる(崩し, 品.味 || 素, 品.名.replace(/[^\w]/g, '_'));
  console.log(
    `${品.名.padEnd(22, '　'.slice(0, 1) === ' ' ? ' ' : ' ')} ${r.立った}/4  ` +
      `${String(r.マス当).padStart(3)}/${r.マス全} (${((100 * r.マス当) / Math.max(1, r.マス全)).toFixed(1)}%)  ` +
      `${String(r.射当).padStart(3)}/${r.射全} (${((100 * r.射当) / Math.max(1, r.射全)).toFixed(1)}%)`
  );
}
