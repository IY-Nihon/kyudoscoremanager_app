/**
 * 板の写真をそのまま読み取り、記録と突き合わせる。
 *
 *   node scripts/ocr-cells/yomitoru.mjs
 *
 * ■ 何をするか
 *   写真 → 格子 → マスの見立て → 板の数字で辻褄合わせ → ○× の並び
 * を通し、団体910280 の 9/6「男子リーグ戦第一節」の記録と一字ずつ比べる。
 *
 * ■ 板の数字について
 * 的中数と立ごとの小計は板に書いてある。ここでは記録から出しているので、
 * 実際に使うときは写真から読み取る必要がある（数字なので大きな模型で読める）。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 格子, 箱の大きさ } from './kiridasu.mjs';
import { 画を読む, 回す } from './gazou-node.mjs';
import { 種類, 形にする, 前へ, 切り取る } from './manabu.mjs';
import { 射手たち } from './kiroku.mjs';
import { 的中数 } from './tsujitsuma.mjs';
import { 縦横で合わせる } from './tsujitsuma2.mjs';
import { 重みを読む } from './chiisaku.mjs';

const 逆 = String.fromCharCode(92);
const 立のマス = 2;
const 元 = 'docs/ocr-samples/PXL_20260906_081921509.jpg';
const 置き = (process.env.TEMP || '.') + '/yomitoru';
fs.mkdirSync(置き, { recursive: true });

/** マスの記号を、2射ぶんの○×にほどく */
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

let 合った射 = 0;
let 全射 = 0;
let 合った人 = 0;
for (const k of 区画) {
  const みち = `${置き}/${k.名}.jpg`;
  await sharp(元).extract({ left: k.left, top: k.top, width: k.width, height: k.height }).jpeg({ quality: 95 }).toFile(みち);
  const g = await 格子(await 画を読む(みち), { 人数: k.順.length, 行数: 10, 上を除く: 0, 回す });
  // 格子が起こしたあとの画から切る（角度が付くと元の写真とは座標が合わない）
  const 画 = g.生.画素;
  const info = { width: g.生.幅, height: g.生.高 };
  const { 半幅, 半高 } = 箱の大きさ(g);

  const 見立て = [];
  for (let c = 0; c < g.列.length; c++) {
    const 列 = [];
    for (let r = 0; r < g.行.位置.length; r++) {
      const 左 = Math.max(0, Math.round(g.列[c].中心) - 半幅);
      const 上 = Math.max(0, Math.round(g.行.位置[r] + (g.列[c].ずれ || 0)) - 半高);
      const 切 = 切り取る(画, info.width, info.height, 左, 上, 半幅 * 2, 半高 * 2);
      列.push(見立てる(await 形にする(切.画, 切.幅, 切.高)));
    }
    見立て.push(列);
  }

  // 板に書かれている数字（ここでは記録から出す）
  const 的中たち = k.順.map((i) => 射手たち[i].的中);
  const 立数 = g.行.位置.length / 立のマス;
  const 小計 = new Array(立数).fill(0);
  for (let a = 0; a < k.順.length; a++) {
    const 印 = [...射手たち[k.順[a]].印];
    for (let i = 0; i < 印.length; i++) {
      if (印[i] !== '○') continue;
      // 記録の i 射目は、板では下から数えた位置に在る
      const マス番 = Math.floor(i / 2);
      const 行 = g.行.位置.length - 1 - マス番;
      小計[Math.floor(行 / 立のマス)]++;
    }
  }

  const { 番, 訳 } = 縦横で合わせる(見立て, 種類, 的中たち, 小計, 立のマス);
  if (!番) console.log(`${k.名}: 辻褄合わせができません（${訳}）`);

  for (let a = 0; a < k.順.length; a++) {
    const 読み = [];
    for (let r = 0; r < g.行.位置.length; r++) {
      let 最 = 0;
      if (番) 最 = 番[a][r];
      else for (let x = 1; x < 種類.length; x++) if (見立て[a][r][x] > 見立て[a][r][最]) 最 = x;
      読み.push(種類[最]);
    }
    // 板は下から書くので、下の行から順に射数を並べる
    const 並び = 読み
      .slice()
      .reverse()
      .map((s) => ほどく[s])
      .join('');
    const 真 = 射手たち[k.順[a]].印;
    let 合 = 0;
    for (let i = 0; i < 真.length; i++) if (並び[i] === 真[i]) 合++;
    合った射 += 合;
    全射 += 真.length;
    if (合 === 真.length) 合った人++;
    console.log(
      `${射手たち[k.順[a]].名.padEnd(4, '　')} ${合 === 真.length ? '合う  ' : '★' + (真.length - 合) + '射違う'} ` +
        `読み=${並び}` +
        (合 === 真.length ? '' : `\n${''.padEnd(5, '　')}                 記録=${真}`)
    );
  }
}
console.log(
  `\n射で ${合った射}/${全射} (${((100 * 合った射) / 全射).toFixed(1)}%)` +
    `  ／ 人で ${合った人}/16 が完全一致`
);
