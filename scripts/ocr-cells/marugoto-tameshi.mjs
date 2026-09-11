/**
 * 写真1枚まるごと（板2枚、16人、小計と合計の列つき）を、板ごとに分けて読む。
 *
 *   node scripts/ocr-cells/marugoto-tameshi.mjs
 *
 * アプリで使う道筋そのもの（切り抜きは人がしない）。数字での辻褄合わせは無し。
 */
import { 板ごとの格子, 箱の大きさ } from './kiridasu.mjs';
import { 画を読む, 回す } from './gazou-node.mjs';
import { 種類, 形にする, 前へ, 切り取る } from './manabu.mjs';
import { 射手たち } from './kiroku.mjs';
import { 重みを読む } from './chiisaku.mjs';
const 逆 = String.fromCharCode(92);
const 群れ = 重みを読む('scripts/ocr-cells/omomi-chiisai.json');
const ほどく = { '×': '××', '◎': '○○' }; ほどく['○' + 逆] = '○×'; ほどく['○/'] = '×○';
const 元 = await 画を読む('docs/ocr-samples/PXL_20260906_081921509.jpg');
const t0 = Date.now();
const 板たち = await 板ごとの格子(元, { 板の人数たち: [8, 8], 行数: 10, 回す });
console.log(`板 ${板たち.length}枚 ${((Date.now() - t0) / 1000).toFixed(1)}秒`);
const 順たち = [[0, 1, 2, 3, 4, 5, 6, 7], [15, 14, 13, 12, 11, 10, 9, 8]];
let 全合 = 0, 全人 = 0;
板たち.forEach(({ 格子: g, 左 }, i) => {
  console.log(`${i + 1}枚目: 左=${左} 列=${g.列.map((c) => c.中心.toFixed(0)).join(',')} 角度=${g.角度.toFixed(1)} 行=${g.行.位置.map((v) => v.toFixed(0)).join(',')} 印の幅=${g.印の幅} 印${g.印.length}個`);
});
for (let i = 0; i < 板たち.length; i++) {
  const g = 板たち[i].格子; const { 半幅, 半高 } = 箱の大きさ(g);
  for (let c = 0; c < g.列.length; c++) {
    const 読み = [];
    for (let r = 0; r < g.行.位置.length; r++) {
      const l = Math.max(0, Math.round(g.列[c].中心) - 半幅), t = Math.max(0, Math.round(g.行.位置[r] + (g.列[c].ずれ || 0)) - 半高);
      const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, l, t, 半幅 * 2, 半高 * 2);
      const 形 = await 形にする(切.画, 切.幅, 切.高);
      const 合 = new Float32Array(4); for (const 網 of 群れ) { const { o } = 前へ(網, 形); for (let k = 0; k < 4; k++) 合[k] += o[k]; }
      let 最 = 0; for (let k = 1; k < 4; k++) if (合[k] > 合[最]) 最 = k;
      読み.push(種類[最]);
    }
    const 並び = 読み.slice().reverse().map((s) => ほどく[s]).join('');
    const 真 = 射手たち[順たち[i][c]].印;
    let 合 = 0; for (let k = 0; k < 真.length; k++) if (並び[k] === 真[k]) 合++;
    全合 += 合; if (合 === 20) 全人++;
  }
}
console.log(`写真1枚まるごと → 射 ${全合}/320、人 ${全人}/16（辻褄合わせ無し）`);
