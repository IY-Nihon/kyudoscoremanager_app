/**
 * 4人立ちの板（docs/ocr-samples/yonin-ita.png）を、いまの読み取りに掛ける。
 *
 *   node scripts/ocr-cells/yonin-tameshi.mjs
 *
 * 私の板と同じ「1マス2射」だが、印がマスいっぱいで ×の線が上下の丸に触れ、
 * 1マスが50pxしかない。答えは板の上の的中数（5, 11, 11, 14）だけ。
 * 2026-09-11 時点では格子は立つが網が読めない（13/5, 11/11, 12/11, 12/14中）。
 * 描き起こし側にこの書き方を足したら、ここで測る。
 */
import sharp from 'sharp';
import { 格子, 箱の大きさ } from './kiridasu.mjs';
import { 画を読む, 回す } from './gazou-node.mjs';
import { 種類, 形にする, 前へ, 切り取る } from './manabu.mjs';
import { 重みを読む } from './chiisaku.mjs';
import { 的中数に合わせる } from './tsujitsuma.mjs';
const 逆 = String.fromCharCode(92);
const 群れ = 重みを読む(process.env.OCR_OMOMI || 'scripts/ocr-cells/mure.json');
const 見立てる = (形) => { const 合 = new Float32Array(種類.length); for (const 網 of 群れ) { const { o } = 前へ(網, 形); for (let k = 0; k < 種類.length; k++) 合[k] += o[k] / 群れ.length; } return 合; };
const 名 = ['1', '2', '3', '4'];
const 板の数字 = [5, 11, 11, 14];
// 印の部分だけを切る（上の見出しと下の名前は除く）。位置は目で決めた
const みち = process.env.TEMP + '/yonin-kiri.png';
const 元 = 'docs/ocr-samples/yonin-ita.png';
const m = await sharp(元).metadata();
const 切 = { left: Math.round(m.width * 0.10), top: Math.round(m.height * 0.115), width: Math.round(m.width * 0.78), height: Math.round(m.height * 0.69) };
await sharp(元).extract(切).png().toFile(みち);
const g = await 格子(await 画を読む(みち), { 人数: 4, 行数: 10, 上を除く: 0, 回す });
console.log(`格子: 列${g.列.length} 行${g.行.位置.length} 印の幅${g.印の幅} 角度${g.角度.toFixed(1)}度`);
const { 半幅, 半高 } = 箱の大きさ(g);
for (let c = 0; c < g.列.length; c++) {
  const 見立て = [];
  for (let r = 0; r < g.行.位置.length; r++) {
    const l = Math.max(0, Math.round(g.列[c].中心) - 半幅);
    const t = Math.max(0, Math.round(g.行.位置[r] + (g.列[c].ずれ || 0)) - 半高);
    const 切2 = 切り取る(g.生.画素, g.生.幅, g.生.高, l, t, 半幅 * 2, 半高 * 2);
    見立て.push(見立てる(await 形にする(切2.画, 切2.幅, 切2.高)));
  }
  const 素 = 見立て.map((o) => { let 最 = 0; for (let k = 1; k < 種類.length; k++) if (o[k] > o[最]) 最 = k; return 種類[最]; });
  const 的中 = (並) => 並.reduce((a, s) => a + (s === '◎' ? 2 : s === '×' ? 0 : 1), 0);
  const { 番 } = 的中数に合わせる(見立て, 種類, 板の数字[c]);
  const 合わせた = 番.map((k) => 種類[k]);
  console.log(`${名[c]} 板の数字=${板の数字[c]}  そのまま: ${素.join(' ')} → ${的中(素)}中${的中(素) === 板の数字[c] ? ' 合う' : ''}`);
  console.log(`${''.padEnd(2, '　')}              合わせて: ${合わせた.join(' ')}`);
}
