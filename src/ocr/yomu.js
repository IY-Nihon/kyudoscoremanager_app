/**
 * 写真の板（と紙）の○×を、端末の中で読む。
 *
 * ■ 分担
 *   名前と並び順と板の枚数 … Gemini（文字は読める）
 *   マスの中身（◎・丸に線・×）… ここ（Gemini は線の向きを読めない。実測で25%）
 *
 * 読み取りの中身は scripts/ocr-cells/ にあるものをそのまま使う（学習と同じ道）。
 * 画像の道具（読む・回す）は外から渡す。アプリは canvas、Node の試験は sharp。
 *
 * ■ 返すもの
 *   板ごとに、列（写真の左から右）ごとに、マスの見た目（写真の上から下）。
 *   '◎' | '○\\' | '○/' | '×'。射に開くのは ocrCells の マスを開く に任せる。
 */
import { 板ごとの格子, 箱の大きさ } from '../../scripts/ocr-cells/kiridasu.mjs';
import { 紙の表を探す, 紙の格子, 紙の箱 } from '../../scripts/ocr-cells/kami.mjs';
import { 種類, 形にする, 前へ, 切り取る } from '../../scripts/ocr-cells/manabu.mjs';
import { 重みを組む } from '../../scripts/ocr-cells/omomi.mjs';

// 重みの JSON は呼ぶ側が渡す（アプリは require、Node の試験は fs）。
// ここで import すると、Node は import 属性が要り、Metro は要らない、で食い違う。
// 組んだ網は JSON ごとに覚える（板と紙で別の JSON）
const 組んだもの = new WeakMap();
function 網の群れ(重み) {
  let 群れ = 組んだもの.get(重み);
  if (!群れ) {
    群れ = 重みを組む(重み);
    組んだもの.set(重み, 群れ);
  }
  return 群れ;
}

/**
 * @param {object} 元 画像の道具の 画を読む が返したもの
 * @param {{板の人数たち:number[], 行数:number, 回す:Function, 重み:object}} 注文
 *   重み … scripts/ocr-cells/omomi-chiisai.json を読んだもの
 * @returns {Promise<{列たち:string[][], 確からしさ:number[][]}[]>} 板ごと
 */
export async function 板の印を読む(元, 注文) {
  const 板の群れ = 網の群れ(注文.重み);
  const 板たち = await 板ごとの格子(元, { 板の人数たち: 注文.板の人数たち, 行数: 注文.行数, 回す: 注文.回す });
  const 出 = [];
  for (const { 格子: g } of 板たち) {
    const { 半幅, 半高 } = 箱の大きさ(g);
    const 列たち = [];
    const 確からしさ = [];
    for (let c = 0; c < g.列.length; c++) {
      const 列 = [];
      const 確 = [];
      for (let r = 0; r < g.行.位置.length; r++) {
        const 左 = Math.max(0, Math.round(g.列[c].中心) - 半幅);
        const 上 = Math.max(0, Math.round(g.行.位置[r] + (g.列[c].ずれ || 0)) - 半高);
        const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);
        const 形 = await 形にする(切.画, 切.幅, 切.高);
        const 合 = new Float32Array(種類.length);
        for (const 網 of 板の群れ) {
          const { o } = 前へ(網, 形);
          for (let k = 0; k < 種類.length; k++) 合[k] += o[k] / 板の群れ.length;
        }
        let 最 = 0;
        for (let k = 1; k < 種類.length; k++) if (合[k] > 合[最]) 最 = k;
        列.push(種類[最]);
        確.push(合[最]);
      }
      列たち.push(列);
      確からしさ.push(確);
    }
    出.push({
      列たち,
      確からしさ,
      // 確かめ用。どこに格子を立てたか
      格子: { 角度: g.角度, 列: g.列.map((c) => Math.round(c.中心)), 列の見当: g.列の見当, 外した強い列: g.外した強い列, 列の点: g.列の点, 行: g.行.位置.map((v) => Math.round(v)), 行の欠け: g.行の欠け, 行ごとの列数: g.行ごとの列数, 印の幅: g.印の幅 },
    });
  }
  return 出;
}

/**
 * 紙（1マス1射）の写真の○×を読む。
 *
 * ページ全体から射手の列の表を探し（紙の表を探す）、外枠で遠近を戻して格子を
 * 立て（紙の格子）、マスごとに ○/× を見立てる。網は2種類（kami-omomi.json）。
 *
 * 紙の表は「列が射手、立ごとのかたまりが縦に積まれ、かたまりの中も縦に4射」。
 * 1射目は下から（いちばん下のかたまりの、いちばん下のマス）。
 * ここでは板と同じく「写真で上から下」の見た目の順で返し、時間の順に直すのは
 * 呼ぶ側（ocrCells の 一射目からの順にする）に任せる。
 *
 * @param {object} 元 画像の道具の 画を読む が返したもの（ページ全体）
 * @param {{人数:number, 立数:number, 立のマス:number, 重み:object}} 注文
 *   重み … scripts/ocr-cells/kami-omomi.json を読んだもの
 * @returns {Promise<{列たち:string[][], 確からしさ:number[][], 四角:object}>}
 *   列たち … 写真の左から右の列ごとに、上から下のマス（'○' | '×'）
 */
export async function 紙の印を読む(元, 注文) {
  const 群れ = 網の群れ(注文.重み);
  const 四角 = 紙の表を探す(元, { 人数: 注文.人数 });
  if (!四角) throw new Error('紙の表が見つかりません');
  const 切 = 切り取る(元.画素, 元.幅, 元.高, 四角.left, 四角.top, 四角.width, 四角.height);
  const g = await 紙の格子(
    { 画素: 切.画, 幅: 切.幅, 高: 切.高 },
    { 人数: 注文.人数, 立数: 注文.立数, 立のマス: 注文.立のマス, 枠: 四角.枠 }
  );
  const 列たち = [];
  const 確からしさ = [];
  for (let c = 0; c < 注文.人数; c++) {
    const 列 = [];
    const 確 = [];
    // g.マス は1射目から（下のかたまりから、かたまりの中も下から）。見た目の順に戻す
    for (const m of g.マス[c].slice().reverse()) {
      const { 半幅, 半高 } = 紙の箱(m);
      const 左 = Math.max(0, Math.round(m.x) - 半幅);
      const 上 = Math.max(0, Math.round(m.y) - 半高);
      const 切2 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);
      const 形 = await 形にする(切2.画, 切2.幅, 切2.高, 'そのまま');
      let 丸 = 0;
      for (const 網 of 群れ) 丸 += 前へ(網, 形).o[1] / 群れ.length;
      列.push(丸 > 0.5 ? '○' : '×');
      確.push(丸 > 0.5 ? 丸 : 1 - 丸);
    }
    列たち.push(列);
    確からしさ.push(確);
  }
  return {
    列たち,
    確からしさ,
    四角: { left: 四角.left, top: 四角.top, width: 四角.width, height: 四角.height, 角度: g.角度 },
  };
}

/**
 * 写真の列（左から右）を、記録の並び（大前→落）に並べ替える。
 *
 * @param {string[][]} 列たち 写真の左から右
 * @param {'右から'|'左から'|'左右から'} 向き 大前がどちらの端か
 * @param {number} 板の番号 0 始まり。左右から のときは、左の板が左から・右の板が右から
 * @param {number} 板の数
 */
export function 大前から並べる(列たち, 向き, 板の番号, 板の数) {
  let 右が大前 = 向き === '右から';
  if (向き === '左右から') 右が大前 = 板の数 >= 2 ? 板の番号 === 板の数 - 1 : false;
  return 右が大前 ? 列たち.slice().reverse() : 列たち.slice();
}
