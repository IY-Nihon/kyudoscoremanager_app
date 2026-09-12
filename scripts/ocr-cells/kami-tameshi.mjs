/**
 * 崩した紙の写真で、どこまで読めるかを測る。
 *
 *   node scripts/ocr-cells/kami-tameshi.mjs
 *
 * 板の tameshi.mjs と同じ。表の切り抜きを崩してから、紙の格子と網を通し、
 * 本番の記録と射ごとに比べる。数字での辻褄合わせは使わない。
 */
import sharp from 'sharp';
import { 紙の格子, 紙の箱, 紙の表を探す } from './kami.mjs';
import { 紙の射手たち } from './kiroku.mjs';
import { 形にする, 前へ, 切り取る } from './manabu.mjs';
import { 重みを読む } from './chiisaku.mjs';
import { 崩し方, ゆがませる } from './kuzusu.mjs';

const 元 = 'docs/ocr-samples/1788683956272.jpg';
const 人数 = 4, 立数 = 5, 立のマス = 4;
const 群れ = 重みを読む(process.env.OCR_KAMI_OMOMI || 'scripts/ocr-cells/kami-omomi.json');

// ページ全体を崩し、表の場所は写真から探す（アプリと同じ道）
const 生 = await sharp(元).greyscale().raw().toBuffer({ resolveWithObject: true });
const 全 = { 画: 生.data, 幅: 生.info.width, 高: 生.info.height, 面: 1 };

async function 読んでみる(崩し, 味) {
  const 歪み = ゆがませる(全, { 崩し, ...味 });
  let g;
  try {
    const 四角 = 紙の表を探す({ 画素: 歪み.画, 幅: 歪み.幅, 高: 歪み.高 }, { 人数 });
    if (!四角) return { 立った: false, 当: 0, 全: 人数 * 立数 * 立のマス };
    const 切 = 切り取る(歪み.画, 歪み.幅, 歪み.高, 四角.left, 四角.top, 四角.width, 四角.height);
    g = await 紙の格子({ 画素: 切.画, 幅: 切.幅, 高: 切.高 }, { 人数, 立数, 立のマス, 枠: 四角.枠 });
  } catch (e) {
    return { 立った: false, 当: 0, 全: 人数 * 立数 * 立のマス };
  }
  let 当 = 0;
  let 全数 = 0;
  for (let c = 0; c < 人数; c++) {
    const 射手 = 紙の射手たち[人数 - 1 - c];
    for (let s = 0; s < g.マス[c].length; s++) {
      const m = g.マス[c][s];
      const { 半幅, 半高 } = 紙の箱(m);
      const l = Math.max(0, Math.round(m.x) - 半幅);
      const t = Math.max(0, Math.round(m.y) - 半高);
      const 切2 = 切り取る(g.生.画素, g.生.幅, g.生.高, l, t, 半幅 * 2, 半高 * 2);
      const 形 = await 形にする(切2.画, 切2.幅, 切2.高, 'そのまま');
      let 丸 = 0;
      for (const 網 of 群れ) 丸 += 前へ(網, 形).o[1] / 群れ.length;
      全数++;
      if ((丸 > 0.5 ? '○' : '×') === 射手.印[s]) 当++;
    }
  }
  return { 立った: true, 当, 全: 全数, 角度: g.角度, 列: g.列.map((c) => c.中心.toFixed(0)).join(','), かたまり: g.かたまり.位置.map((v) => v.toFixed(0)).join(',') };
}

const 素 = { 明るさ: 1, 締まり: 1, ざらつき: 0 };
const 献立 = [
  { 名: 'そのまま' },
  { 名: '傾き2度', 回す: 2 },
  { 名: '傾き4度', 回す: 4 },
  { 名: '傾き6度', 回す: 6 },
  { 名: '傾き8度', 回す: 8 },
  { 名: '台形0.10', 台形: 0.1 },
  { 名: '台形0.20', 台形: 0.2 },
  { 名: '傾き4度＋台形0.1', 回す: 4, 台形: 0.1 },
  { 名: '暗い', 味: { 明るさ: 0.55 } },
  { 名: '薄い（締まり0.5）', 味: { 締まり: 0.5 } },
  { 名: 'ざらつき25', 味: { ざらつき: 25 } },
  { 名: 'ざらつき40', 味: { ざらつき: 40 } },
  { 名: 'ぼけ1px', 味: { ぼかし: 1 } },
  { 名: 'ぼけ2px', 味: { ぼかし: 2 } },
  { 名: '縮小0.7', 味: { 縮小: 0.7 } },
  { 名: '縮小0.5', 味: { 縮小: 0.5 } },
  { 名: '縮小0.7＋ぼけ1＋暗い', 味: { 縮小: 0.7, ぼかし: 1, 明るさ: 0.7 } },
  { 名: '傾き3度＋縮小0.7＋ざらつき25', 回す: 3, 味: { 縮小: 0.7, ざらつき: 25 } },
];
console.log('崩し方                  格子  射');
for (const 品 of 献立) {
  const 崩し = 品.回す || 品.台形 ? 崩し方({ 幅: 全.幅, 高: 全.高, 回す: 品.回す || 0, 台形: 品.台形 || 0, 種: 12345 }) : null;
  const r = await 読んでみる(崩し, { ...素, ...(品.味 || {}) });
  console.log(`${品.名.padEnd(20, ' ')} ${r.立った ? '立つ' : '×　'}  ${String(r.当).padStart(2)}/${r.全} (${((100 * r.当) / r.全).toFixed(1)}%)` + (process.env.OCR_KUWASHIKU && r.立った ? `  角度=${r.角度} 列=${r.列} かたまり=${r.かたまり}` : ''));
}
