/**
 * 本物の写真から、確かめ用のマスを切り出す。
 *
 *   node scripts/ocr-cells/honmono.mjs
 *
 * ■ なにを切るか
 * 写真 PXL_20260906_081921509.jpg には板が2枚写っている。
 *   左の板＝自校（名札が色枠。1番→8番を左から）
 *   右の板＝相手校（板に直書き。9番→16番を右から）
 * どちらも 4人ごとに小計の列が挟まる。番号の列を射手の列と取り違えないよう、
 * 4人ずつの区画に切ってから格子を立てる。
 *
 * ■ 札はどこから来るか
 * 団体910280 の 9/6「男子リーグ戦第一節」の記録そのもの。人が読み直したのではなく、
 * アプリに入っている答えを使う。板は下から書き足されているので、記録を逆に並べる。
 *
 * ■ 向き
 * 合計の欄が下から 19→35→55→70→90 と積み上がっていることで裏づけた。
 */
import fs from 'node:fs';
import sharp from 'sharp';
import { 格子 } from './kiridasu.mjs';
import { 画を読む, 回す, マスを書き出す } from './gazou-node.mjs';
import { 射手たち } from './kiroku.mjs';

const 元 = 'docs/ocr-samples/PXL_20260906_081921509.jpg';
const 置き = (process.env.TEMP || '.') + '/honmono-han';

const 記号 = (a, b) =>
  a === '\u25cb' && b === '\u25cb' ? 'maru2'
  : a === '\u25cb' && b === '\u00d7' ? 'maru_gyaku'
  : a === '\u00d7' && b === '\u25cb' ? 'maru_seki'
  : 'batsu';

/** 記録の○×の並びを、板のマス（上から下）に畳む */
function 板の並びにする(並び) {
  const 印 = [...並び].slice(0, 20);
  const マス = [];
  for (let i = 0; i < 印.length; i += 2) マス.push(記号(印[i], 印[i + 1]));
  return マス.reverse();
}

// 答えは kiroku.mjs に置いてある
// 写真は 4624×3472。見て決めた、4人ずつの区画。
// 順 は kiroku.mjs の並び（記録の大前→落）での番号を、板の左から右に並べたもの。
// 左の板は左から大前、右の板は右から大前なので、右の板は番号が下る
const 区画 = [
  { 板: 'cells', 名: 'hidari-a', left: 314, top: 1168, width: 659, height: 971, 順: [0, 1, 2, 3] },
  { 板: 'cells', 名: 'hidari-b', left: 1138, top: 1168, width: 649, height: 971, 順: [4, 5, 6, 7] },
  { 板: 'cells-migi', 名: 'migi-a', left: 2994, top: 1121, width: 643, height: 1052, 順: [15, 14, 13, 12] },
  { 板: 'cells-migi', 名: 'migi-b', left: 3808, top: 1121, width: 638, height: 1052, 順: [11, 10, 9, 8] },
];

fs.mkdirSync(置き, { recursive: true });
for (const 板 of ['cells', 'cells-migi']) fs.rmSync('docs/ocr-samples/' + 板, { recursive: true, force: true });

const 数え = {};
for (const k of 区画) {
  const みち = `${置き}/${k.名}.jpg`;
  await sharp(元).extract({ left: k.left, top: k.top, width: k.width, height: k.height }).jpeg({ quality: 95 }).toFile(みち);
  const g = await 格子(await 画を読む(みち), { 人数: 4, 行数: 10, 上を除く: 0, 回す });
  const 出 = await マスを書き出す(
    g, 'docs/ocr-samples/' + k.板,
    (c, r) => (射手たち[k.順[c]] ? 板の並びにする(射手たち[k.順[c]].印)[r] : null),
    k.名 + '-'
  );
  数え[k.板] = (数え[k.板] || 0) + 出.length;
  console.log(`${k.名}: 列=${g.列.length} 行=${g.行.位置.length} 印の幅=${g.印の幅.toFixed(0)} → ${出.length}枚`);
}
for (const [板, n] of Object.entries(数え)) console.log(`docs/ocr-samples/${板}: ${n}枚`);
