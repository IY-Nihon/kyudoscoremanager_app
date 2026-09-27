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
import { 板ごとの格子, 箱の大きさ, マスの中心y, マスの中心x } from '../../scripts/ocr-cells/kiridasu.mjs';
import { 息継ぎ } from '../../scripts/ocr-cells/ikitsugi.mjs';
import { 紙の表を探す, 紙の格子, 紙の箱 } from '../../scripts/ocr-cells/kami.mjs';
import { 種類, 形にする, 前へ, 切り取る, 輪の覆い } from '../../scripts/ocr-cells/manabu.mjs';
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
  元 = 黒板なら裏返す(元);
  const 板たち = await 板ごとの格子(元, { 板の人数たち: 注文.板の人数たち, 行数: 注文.行数, 回す: 注文.回す, 箱たち: 注文.箱たち, 帯の数: 注文.帯の数 });
  const 出 = [];
  let 読んだ数 = 0; // 息継ぎ のため（8 マスごと）
  let 板の番号 = 0; // 確かめ用の口（__OCR_MASU）に渡す板の番号
  for (const { 格子: g } of 板たち) {
    const 現在の板 = 板の番号++;
    const { 半幅, 半高 } = 箱の大きさ(g);
    const 列たち = [];
    const 確からしさ = [];
    // 二段 … 1マスの切り抜きに印が縦に2つ入っているマスの数。段の数を少なく頼まれると
    //（10段の板を 5 段と数えた Gemini）、1行が2段ぶんになり、こうなる。呼ぶ側が
    // 「段の数が少なすぎる」と見分けるのに使う（sashikae）
    let 二段 = 0;
    for (let c = 0; c < g.列.length; c++) {
      const 列 = [];
      const 確 = [];
      for (let r = 0; r < g.行.位置.length; r++) {
        const 左 = Math.max(0, Math.round(マスの中心x(g, c, r)) - 半幅);
        const 上 = Math.max(0, Math.round(マスの中心y(g, c, r)) - 半高);
        const 切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 上, 半幅 * 2, 半高 * 2);

        let 対象切 = 切;
        const 交代線 = 交代のマスか(切);
        if (交代線) {
          // 途中交代のマス：同じ列の途中で人が代わると、代わった段のマスの中に交代した人の名前と的中数が、
          // 印の下に書き込まれる。小さな印（×など）がマスの上端に押し上げられ、その下に横線、さらにその下に
          // 名前の字が書かれる。横線の位置が切り抜きの下端にくるまで上へずらして取り直し（ずらす量はマスの
          // 高さの6割まで）、横線より下の字を消して線より上の印だけを読む。
          // 上へずらした切り抜きは上の段の印の下端を含みうるが、「形にする」の「縁に触れるかたまりは捨てる」
          // で上端の縁に触れる上の段のかけらは自動的に除外される。
          const ずらし = Math.min(Math.round(切.高 * 0.6), 切.高 - 交代線.minY);
          const 新上 = Math.max(0, 上 - ずらし);
          const 新切 = 切り取る(g.生.画素, g.生.幅, g.生.高, 左, 新上, 半幅 * 2, 半高 * 2);
          const 新画 = new Uint8Array(新切.画);
          const 新線y = 交代線.minY + ずらし;
          for (let y = Math.max(0, Math.min(新切.高 - 1, 新線y)); y < 新切.高; y++) {
            for (let x = 0; x < 新切.幅; x++) 新画[y * 新切.幅 + x] = 255;
          }
          対象切 = Object.assign({}, 新切, { 画: 新画 });
        }

        // 空のマス（まだ書いていない段）は、網に掛けずに空にする。網には「空」の札が無く、
        // 隣の印のはみ出しや罫線のかけらを拾って × や ○ にしていた（途中の板の写真で、
        // 上の空の段が ×× になった）。真ん中6割に暗い画素がほぼ無ければ空
        if (空のマスか(対象切, !g.立て方)) {
          列.push('');
          確.push(1);
          continue;
        }
        if (二段か(対象切)) 二段++;
        // 箱や罫線で立てた格子（印がマスいっぱいの板）は、箱いっぱいの印を外さない
        const 形 = await 形にする(対象切.画, 対象切.幅, 対象切.高, g.立て方 ? 'ぎっしり' : undefined, { 印の幅: g.箱の幅 || g.印の幅 });
        if (++読んだ数 % 8 === 0) await 息継ぎ();
        const 合 = new Float32Array(種類.length);
        for (const 網 of 板の群れ) {
          const { o } = 前へ(網, 形);
          for (let k = 0; k < 種類.length; k++) 合[k] += o[k] / 板の群れ.length;
        }
        let 最 = 0;
        for (let k = 1; k < 種類.length; k++) if (合[k] > 合[最]) 最 = k;
        // 丸の仲間と読んだのに輪が半分も無ければ ×。細いペンの小さな × を
        // ○＼ と読む取り違えを、網の外で止める（本物の丸は輪が 0.67 以上、× は 9割が 0.58 以下）。
        // 倒したマスは確からしさを 0.5 にして、確認画面で「迷った」の色を付ける
        let 確からしさの値 = 合[最];
        if (typeof globalThis.__OCR_MASU === 'function') {
           const 残り = 直線を抜いた残り(対象切);
           globalThis.__OCR_MASU({ 板: 現在の板, 列: c, 行: r, 種類: 種類[最], 点: 合[最], 輪の覆い: 輪の覆い(形), 残り });
        }

        if (種類[最] !== '×' && 輪の覆い(形) < 0.5) {
          最 = 種類.indexOf('×');
          確からしさの値 = 0.5;
        } else if (種類[最] !== '×' && 輪の覆い(形) <= 0.67) {
          // 丸の仲間の残りは最小 0.18、Dのマスは 0.000。輪の覆いだけでは分けられなかったため
          const 残り = 直線を抜いた残り(対象切);
          if (残り.線の数 === 2 && 残り.残りの割合 < 0.05) {
            最 = 種類.indexOf('×');
            確からしさの値 = 0.5;
          }
        }
        // ◎ と読んだのに、輪の内側にあるのが丸でなく短い線なら、○＼ か ○／（線の向きで）。
        // 丸の中に短い線を書く書き手（9/27 の千葉商科大学の板）では、網が内側の線を小さな丸と
        // 取り違えて ◎ と読んだ（14 マス）。網が学んだ ○＼ は線が丸を横切るものばかり
        if (種類[最] === '◎') {
          const 線 = 内側の線の向き(対象切);
          if (線) {
            最 = 種類.indexOf(線);
            確からしさの値 = Math.min(確からしさの値, 0.6);
          }
        }
        列.push(種類[最]);
        確.push(確からしさの値);
      }
      列たち.push(列);
      確からしさ.push(確);
    }
    出.push({
      列たち,
      確からしさ,
      // 確かめ用。どこに格子を立てたか
      格子: { 角度: g.角度, 列: g.列.map((c) => Math.round(c.中心)), 列の見当: g.列の見当, 並びの人数: g.並びの人数, 外した強い列: g.外した強い列, 列の点: g.列の点, 行: g.行.位置.map((v) => Math.round(v)), 行の欠け: g.行の欠け, 上の字の行: g.上の字の行, 行ごとの列数: g.行ごとの列数, 印の幅: g.印の幅, 立て方: g.立て方 || null, 二段のマス: 二段 },
    });
  }
  return 出;
}

/**
 * 黒板（暗い地に白いチョーク）なら、明るさを裏返して板と同じ「明るい地に暗い印」にする。
 * 格子も網も暗い印しか知らない。真ん中あたり（端の額縁や壁を避ける）の明るさの中央値が
 * 暗ければ黒板。色（名札の帯を探すのに使う）はそのまま
 * @param {{画素:Uint8Array, 幅:number, 高:number, 色?:object}} 元
 */
export function 黒板なら裏返す(元) {
  const { 画素, 幅, 高 } = 元;
  const 度数 = new Uint32Array(256);
  let n = 0;
  for (let y = Math.floor(高 * 0.2); y < 高 * 0.8; y += 2)
    for (let x = Math.floor(幅 * 0.2); x < 幅 * 0.8; x += 2) {
      度数[画素[y * 幅 + x]]++;
      n++;
    }
  let 累 = 0;
  let 中央 = 255;
  for (let v = 0; v < 256; v++) {
    累 += 度数[v];
    if (累 >= n / 2) {
      中央 = v;
      break;
    }
  }
  if (中央 >= 110) return 元;
  const 裏 = new Uint8Array(画素.length);
  for (let i = 0; i < 画素.length; i++) 裏[i] = 255 - 画素[i];
  return Object.assign({}, 元, { 画素: 裏, 黒板: true });
}

/**
 * 途中交代のマスか。
 *
 * 同じ列の途中で射手が交代すると、代わった段のマスの中に交代した人の名前と
 * 的中数が印の下に書き込まれる。このマスでは印（小さな × など）がマスの上端
 *（上の段との境）に押し上げられ、その下に横線が引かれ、さらにその下に交代した人の名前の字が並ぶ。
 *
 * 判定条件（課題6）：
 * 1. 切り抜きの中に横に長い線（幅がマスの 6 割以上、高さがマスの 1 割以下のかたまり）があり、
 *    その線が切り抜きの上から 25〜75% の所にある。
 * 2. 交代マスでは印が上端に押し上げられているため、線より上に通常の大きな印
 *   （幅・高さともマスの 45% 以上）がない。
 * 3. 線より下に小さなかたまり（交代した人の名前の字のかけら）が 3 つ以上ある。
 *
 * @param {{画: Uint8Array, 幅: number, 高: number}} 切
 * @returns {{minX: number, maxX: number, minY: number, maxY: number, w: number, h: number, 数: number}|null}
 */
export function 交代のマスか(切) {
  const { 幅, 高, 画 } = 切;
  if (幅 < 20 || 高 < 20) return null;
  const 境 = 九割点(画) - 35;

  // 横に長い線を探す（各行で幅の3割以上連続する黒画素）
  const 横線マスク = new Uint8Array(幅 * 高);
  for (let y = 0; y < 高; y++) {
    let 始 = -1;
    for (let x = 0; x <= 幅; x++) {
      const 黒 = x < 幅 && 画[y * 幅 + x] < 境;
      if (黒) {
        if (始 < 0) 始 = x;
      } else {
        if (始 >= 0) {
          if (x - 始 >= 幅 * 0.3) {
            for (let xx = 始; xx < x; xx++) 横線マスク[y * 幅 + xx] = 1;
          }
          始 = -1;
        }
      }
    }
  }

  // 横線のかたまりを探す
  const 見た = new Uint8Array(幅 * 高);
  const 積 = new Int32Array(幅 * 高);
  let 見つかった線 = null;

  for (let y0 = 0; y0 < 高; y0++) {
    for (let x0 = 0; x0 < 幅; x0++) {
      const 始 = y0 * 幅 + x0;
      if (見た[始] || !横線マスク[始]) continue;
      let 頭 = 0, 尻 = 0;
      積[尻++] = 始;
      見た[始] = 1;
      let minX = x0, maxX = x0, minY = y0, maxY = y0, 数 = 0;
      while (頭 < 尻) {
        const p = 積[頭++];
        const x = p % 幅;
        const y = (p - x) / 幅;
        数++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x > 0 && !見た[p - 1] && 横線マスク[p - 1]) { 見た[p - 1] = 1; 積[尻++] = p - 1; }
        if (x + 1 < 幅 && !見た[p + 1] && 横線マスク[p + 1]) { 見た[p + 1] = 1; 積[尻++] = p + 1; }
        if (y > 0 && !見た[p - 幅] && 横線マスク[p - 幅]) { 見た[p - 幅] = 1; 積[尻++] = p - 幅; }
        if (y + 1 < 高 && !見た[p + 幅] && 横線マスク[p + 幅]) { 見た[p + 幅] = 1; 積[尻++] = p + 幅; }
      }
      const w = maxX - minX + 1, h = maxY - minY + 1;
      // 幅がマスの 6 割以上、高さがマスの 1 割以下、上から 25〜75% の所
      // かつ、交代マスは上端に押し上げられた印のすぐ下に線があるため、上寄り（minY <= 高 * 0.55）
      if (w >= 幅 * 0.6 && h <= 高 * 0.1 && minY >= 高 * 0.25 && maxY <= 高 * 0.75 && minY <= 高 * 0.55) {
        見つかった線 = { minX, maxX, minY, maxY, w, h, 数 };
        break;
      }
    }
    if (見つかった線) break;
  }

  if (!見つかった線) return null;

  // 線より上がベタ黒（壁や額縁の影）なら除外（交代マスは白地に小さな印）
  let 上黒 = 0;
  for (let y = 0; y < 見つかった線.minY; y++) {
    for (let x = 0; x < 幅; x++) if (画[y * 幅 + x] < 境) 上黒++;
  }
  if (上黒 / (見つかった線.minY * 幅) > 0.3) return null;

  // 線より上に通常のような大きな印（高さ・幅がマスの 45% 以上）がないこと
  // 交代マスでは印が上端に押し上げられて小さくなっている
  const 上見た = new Uint8Array(幅 * 高);
  for (let y0 = 0; y0 < 見つかった線.minY; y0++) {
    for (let x0 = 0; x0 < 幅; x0++) {
      const 始 = y0 * 幅 + x0;
      if (上見た[始] || 画[始] >= 境) continue;
      let 頭 = 0, 尻 = 0;
      積[尻++] = 始;
      上見た[始] = 1;
      let minX = x0, maxX = x0, minY = y0, maxY = y0;
      while (頭 < 尻) {
        const p = 積[頭++];
        const x = p % 幅;
        const y = (p - x) / 幅;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x > 0 && !上見た[p - 1] && 画[p - 1] < 境) { 上見た[p - 1] = 1; 積[尻++] = p - 1; }
        if (x + 1 < 幅 && !上見た[p + 1] && 画[p + 1] < 境) { 上見た[p + 1] = 1; 積[尻++] = p + 1; }
        if (y > 0 && !上見た[p - 幅] && 画[p - 幅] < 境) { 上見た[p - 幅] = 1; 積[尻++] = p - 幅; }
        if (y + 1 < 見つかった線.minY && !上見た[p + 幅] && 画[p + 幅] < 境) { 上見た[p + 幅] = 1; 積[尻++] = p + 幅; }
      }
      if (maxX - minX + 1 >= 幅 * 0.45 && maxY - minY + 1 >= 高 * 0.45) return null;
    }
  }

  // 線より下に小さなかたまり（字のかけら）が 3 つ以上あるか
  const 下開始y = 見つかった線.maxY + 1;
  const 下見た = new Uint8Array(幅 * 高);
  let 字のかけら数 = 0;

  for (let y0 = 下開始y; y0 < 高; y0++) {
    for (let x0 = 0; x0 < 幅; x0++) {
      const 始 = y0 * 幅 + x0;
      if (下見た[始] || 画[始] >= 境) continue;
      let 頭 = 0, 尻 = 0;
      積[尻++] = 始;
      下見た[始] = 1;
      let minX = x0, maxX = x0, minY = y0, maxY = y0, 数 = 0;
      while (頭 < 尻) {
        const p = 積[頭++];
        const x = p % 幅;
        const y = (p - x) / 幅;
        数++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x > 0 && !下見た[p - 1] && 画[p - 1] < 境) { 下見た[p - 1] = 1; 積[尻++] = p - 1; }
        if (x + 1 < 幅 && !下見た[p + 1] && 画[p + 1] < 境) { 下見た[p + 1] = 1; 積[尻++] = p + 1; }
        if (y > 下開始y && !下見た[p - 幅] && 画[p - 幅] < 境) { 下見た[p - 幅] = 1; 積[尻++] = p - 幅; }
        if (y + 1 < 高 && !下見た[p + 幅] && 画[p + 幅] < 境) { 下見た[p + 幅] = 1; 積[尻++] = p + 幅; }
      }
      // 字のかけら：小さめのかたまり（ノイズ除外かつ巨大な印の弧を除外）
      if (数 >= 8 && (maxX - minX + 1 <= 幅 * 0.4 || maxY - minY + 1 <= 高 * 0.4)) 字のかけら数++;
    }
  }

  return 字のかけら数 >= 3 ? 見つかった線 : null;
}

/**
 * 切り抜いたマスが空か。
 *
 * 白（明るいほうから1割のところ）より 35 以上暗い画素をつないで、かたまりにする。
 * 縦横ともマスの2割以上あるかたまりが1つも無ければ空。
 * 印（○・◎・×・丸に線）は縦横に広がる。消し残った罫線（傾いた縦線）は細長く、
 * 点線のかけらや隣のマスの印のはみ出しは小さいので、どれも数えない。
 * 真ん中だけを見ると、マスいっぱいの大きな ◎ は輪が真ん中に掛からず空と間違えた
 *（9/6 の板で 6 マス）ので、マスぜんぶで見る
 */
/**
 * @param {object} 切 切り抜いたマス
 * @param {boolean} [厳しく] 印から立てた格子なら true。箱や罫線で立てた格子（等分なので印が箱の
 *   端に寄る）では、縦か横が大きければ印とみなす緩い決まりのまま
 */
export function 空のマスか(切, 厳しく = false) {
  // 印（○・◎・×）はマスの真ん中に掛かる。端にだけあるかたまり（上の罫線に手で足した
  // 横線、「打っていない」印の縦棒の頭）は印ではない（9/20 の SNS の板で、打たなかった段の
  // 縦棒と横線の交わりを ◎ と読んだ）。二段か のほうはこの縛りを使わない（上下に分かれる）
  // ただし箱から立てた格子（等分なので印が箱の端に寄る）の印は真ん中に掛からないことがある。
  // 大きなかたまり（縦か横がマスの半分以上で、もう片方も 3 割以上あり、端の 35% に
  // 収まっていない）は場所を問わず印とみなす。上の縁に沿う横線（幅は大きいが上 3 割に収まる）
  // は印ではない（9/20 の SNS の板の「打っていない」段）
  const { 幅, 高 } = 切;
  const 印らしい大きさ = (k) => {
    const w = k.右 - k.左 + 1, h = k.下 - k.上 + 1;
    if (!厳しく) return w >= 幅 * 0.5 || h >= 高 * 0.5;
    const 横に大きい = w >= 幅 * 0.5 && h >= 高 * 0.3 && !(k.下 <= 高 * 0.35 || k.上 >= 高 * 0.65);
    const 縦に大きい = h >= 高 * 0.5 && w >= 幅 * 0.3 && !(k.右 <= 幅 * 0.35 || k.左 >= 幅 * 0.65);
    return 横に大きい || 縦に大きい;
  };
  return !印のかたまりたち(切).some(
    (k) => 印らしい大きさ(k) || (k.上 <= 高 * 0.6 && k.下 >= 高 * 0.4 && k.左 <= 幅 * 0.6 && k.右 >= 幅 * 0.4)
  );
}

/**
 * 切り抜いたマスに、印が縦に2つ入っているか。
 *
 * 段の数を少なく頼まれると（印が 10 段並ぶ板を Gemini が 5 段と数えた）、1行が2段ぶんの
 * 高さになり、切り抜きに上下2つの印が入る。印が離れていれば印らしいかたまりが上下に2つ、
 * 触れ合っていれば1つの縦長のかたまり（高さが幅の 1.5 倍以上で、切り抜きの 7 割以上）になる
 */
function 二段か(切) {
  const { 幅, 高 } = 切;
  const たち = 印のかたまりたち(切);
  if (たち.length >= 2) {
    const 並べ = たち.slice().sort((a, b) => a.上 - b.上);
    for (let i = 1; i < 並べ.length; i++) if (並べ[i].上 > 並べ[i - 1].下) return true;
  }
  return たち.some((k) => {
    const h = k.下 - k.上 + 1;
    const w = k.右 - k.左 + 1;
    return h >= w * 1.5 && h >= 高 * 0.7 && w >= 幅 * 0.3;
  });
}

/**
 * 切り抜きの中の、印らしい大きさのかたまり（縦横ともマスの2割以上）。
 * 空のマスか と 二段か が使う。同じ切り抜きで 2 回呼ばれるので、答えを控えておく
 *（1 マスあたりの計算で最も重い。以前は画素を並べ替えて 9 割点を取っていて、
 * 320 射の写真で古い端末の見当 5 秒がここだった。度数で数えれば同じ値が一巡で出る）
 */
const かたまりの控え = new WeakMap();
function 印のかたまりたち(切) {
  const 控え = かたまりの控え.get(切);
  if (控え) return 控え;
  const 出 = 印のかたまりを探す(切);
  かたまりの控え.set(切, 出);
  return 出;
}

/** 明るさ（0〜255）の 9 割点。並べ替えずに度数で数える（並べ替えたときと同じ値） */
function 九割点(画) {
  const 度数 = new Uint32Array(256);
  for (let i = 0; i < 画.length; i++) 度数[画[i]]++;
  const 位置 = Math.floor(画.length * 0.9);
  let 累 = 0;
  for (let v = 0; v < 256; v++) {
    累 += 度数[v];
    if (累 > 位置) return v;
  }
  return 255;
}

/**
 * ◎ と読んだマスについて、輪の内側にあるかたまりが丸ではなく短い線なら、その向きの印
 *（'○\\' か '○/'）を返す。丸・点・見分けられないときは null（◎ のまま）。
 *
 * 輪（いちばん大きく広がったかたまり）の内側（囲みを 2 割ずつ狭めた中）に中心があるかたまりが
 * 1 つだけのときに見る。かたまりの画素の広がり（分散）の長い軸と短い軸の比が 3 以上なら線。
 * ◎ の内側の丸は、縦長に書かれても比は 2 ほど。線が輪に触れていると 1 つのかたまりになり、
 * 内側には何も無いので触らない（その形は網がもともと ○＼ と読める）
 */
export function 内側の線の向き(切) {
  const { 幅, 高, 画 } = 切;
  if (幅 < 12 || 高 < 12) return null;
  const 境 = 九割点(画) - 35;
  const 見た = new Uint8Array(幅 * 高);
  const 積 = new Int32Array(幅 * 高);
  const たち = [];
  for (let 始 = 0; 始 < 幅 * 高; 始++) {
    if (見た[始] || 画[始] >= 境) continue;
    let 頭 = 0;
    let 尻 = 0;
    積[尻++] = 始;
    見た[始] = 1;
    const k = { n: 0, sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0, 左: 幅, 右: 0, 上: 高, 下: 0 };
    while (頭 < 尻) {
      const p = 積[頭++];
      const x = p % 幅;
      const y = (p - x) / 幅;
      k.n++;
      k.sx += x;
      k.sy += y;
      k.sxx += x * x;
      k.syy += y * y;
      k.sxy += x * y;
      if (x < k.左) k.左 = x;
      if (x > k.右) k.右 = x;
      if (y < k.上) k.上 = y;
      if (y > k.下) k.下 = y;
      if (x > 0 && !見た[p - 1] && 画[p - 1] < 境) { 見た[p - 1] = 1; 積[尻++] = p - 1; }
      if (x + 1 < 幅 && !見た[p + 1] && 画[p + 1] < 境) { 見た[p + 1] = 1; 積[尻++] = p + 1; }
      if (y > 0 && !見た[p - 幅] && 画[p - 幅] < 境) { 見た[p - 幅] = 1; 積[尻++] = p - 幅; }
      if (y + 1 < 高 && !見た[p + 幅] && 画[p + 幅] < 境) { 見た[p + 幅] = 1; 積[尻++] = p + 幅; }
    }
    if (k.n >= 15) たち.push(k);
  }
  if (たち.length < 2) return null;
  // 輪は箱の 4 割以上の大きさがあるもの（罫線のかけらや隣のはみ出しを輪と取らない）
  // ただし箱の 9 割以上を占める外枠・罫線のかたまりは輪ではないので除外する
  const 輪の候補 = たち.filter((k) => {
    const w = k.右 - k.左 + 1;
    const h = k.下 - k.上 + 1;
    return w >= 幅 * 0.4 && h >= 高 * 0.4 && !(w >= 幅 * 0.9 && h >= 高 * 0.9);
  });
  if (!輪の候補.length) return null;
  const 広さ = (k) => (k.右 - k.左 + 1) * (k.下 - k.上 + 1);
  const 輪 = 輪の候補.reduce((a, b) => (広さ(b) > 広さ(a) ? b : a));
  const 輪の幅 = 輪.右 - 輪.左 + 1;
  const 輪の高 = 輪.下 - 輪.上 + 1;
  const 内 = たち.filter((k) => {
    if (k === 輪) return false;
    // 輪を外から包むかたまり（四方の枠線など）は内側ではない
    if (k.左 <= 輪.左 && k.右 >= 輪.右 && k.上 <= 輪.上 && k.下 >= 輪.下) return false;
    const cx = k.sx / k.n;
    const cy = k.sy / k.n;
    return cx > 輪.左 + 輪の幅 * 0.2 && cx < 輪.右 - 輪の幅 * 0.2 && cy > 輪.上 + 輪の高 * 0.2 && cy < 輪.下 - 輪の高 * 0.2;
  });
  if (内.length !== 1) return null;
  const k = 内[0];
  const mx = k.sx / k.n;
  const my = k.sy / k.n;
  const cxx = k.sxx / k.n - mx * mx;
  const cyy = k.syy / k.n - my * my;
  const cxy = k.sxy / k.n - mx * my;
  const 半 = (cxx + cyy) / 2;
  const 差 = Math.sqrt(Math.max(0, 半 * 半 - (cxx * cyy - cxy * cxy)));
  const 長 = 半 + 差;
  const 短 = Math.max(0.25, 半 - 差);
  // 線の長さの見当（一様な線なら 分散 = 長さ² / 12）。輪の短い辺の 2 割より短いものは点
  if (Math.sqrt(12 * 長) < Math.min(輪の幅, 輪の高) * 0.2) return null;
  if (Math.sqrt(長 / 短) < 3) return null;
  // ほぼ水平・ほぼ垂直の線は向きが決まらない（10 度以内）
  const 角 = (Math.abs(0.5 * Math.atan2(2 * cxy, cxx - cyy)) * 180) / Math.PI;
  if (角 < 10 || 角 > 80) return null;
  // 画の y は下向き。x と y が一緒に増える（右下がり）なら ＼
  return cxy > 0 ? '○\\' : '○/';
}

function 印のかたまりを探す(切) {
  const { 幅, 高 } = 切;
  const 出 = [];
  if (幅 < 4 || 高 < 4) return [{ 左: 0, 右: 幅 - 1, 上: 0, 下: 高 - 1 }];
  const 境 = 九割点(切.画) - 35;
  const 見た = new Uint8Array(幅 * 高);
  const 積 = new Int32Array(幅 * 高);
  const 最小の辺 = Math.min(幅, 高) * 0.2;
  for (let y0 = 0; y0 < 高; y0++) {
    for (let x0 = 0; x0 < 幅; x0++) {
      const 始 = y0 * 幅 + x0;
      if (見た[始] || 切.画[始] >= 境) continue;
      let 頭 = 0;
      let 尻 = 0;
      積[尻++] = 始;
      見た[始] = 1;
      let 左 = x0;
      let 右 = x0;
      let 上 = y0;
      let 下 = y0;
      let 数 = 0;
      const 列の数 = new Uint16Array(幅);
      const 行の数 = new Uint16Array(高);
      while (頭 < 尻) {
        const p = 積[頭++];
        const x = p % 幅;
        const y = (p - x) / 幅;
        数++;
        列の数[x]++;
        行の数[y]++;
        if (x < 左) 左 = x;
        if (x > 右) 右 = x;
        if (y < 上) 上 = y;
        if (y > 下) 下 = y;
        if (x > 0 && !見た[p - 1] && 切.画[p - 1] < 境) { 見た[p - 1] = 1; 積[尻++] = p - 1; }
        if (x + 1 < 幅 && !見た[p + 1] && 切.画[p + 1] < 境) { 見た[p + 1] = 1; 積[尻++] = p + 1; }
        if (y > 0 && !見た[p - 幅] && 切.画[p - 幅] < 境) { 見た[p - 幅] = 1; 積[尻++] = p - 幅; }
        if (y + 1 < 高 && !見た[p + 幅] && 切.画[p + 幅] < 境) { 見た[p + 幅] = 1; 積[尻++] = p + 幅; }
      }
      if (数 < 40 || 右 - 左 + 1 < 最小の辺 || 下 - 上 + 1 < 最小の辺) continue;
      // 罫線（消し残った縦線や、マスの角で交わった L の形）は、墨がどこか1本の縦の帯と
      // 1本の横の帯（幅 9px）にほぼ集まる。13px・8割にすると 9/6 の板で本物の印を2つ空にした。印は輪や斜めの線なので、どの帯にも集まらない
      // 帯の幅は、マスが小さい写真では縮める（マスの短い辺の 8%、9px まで）。マスが 54px しかない
      // 写真（9/27 の城西大学の板。LINE で送られて 1108px に縮んでいた）では、太い ◎ の輪も内側の丸も
      // 9px の帯に 85% 以上入り、罫線とみなして外して、はっきりした ◎ を「空」にしていた
      const 帯幅 = Math.min(9, Math.max(3, Math.round(Math.min(幅, 高) * 0.08)));
      const 帯の最大 = (並び) => {
        let 最 = 0;
        for (let i = 0; i + 帯幅 <= 並び.length; i++) {
          let 和 = 0;
          for (let k = 0; k < 帯幅; k++) 和 += 並び[i + k];
          if (和 > 最) 最 = 和;
        }
        return 最;
      };
      if ((帯の最大(列の数) + 帯の最大(行の数)) / 数 >= 0.85) continue;
      // 消し残った縦の罫線（細い1本）に、隣の印のはみ出し（丸の弧）がつながると、背の高い
      // かたまりになって大きさでは外せない（9/13 の途中の板で、空の段が下の ◎ の弧を拾って
      // ◎ になった）。墨の半分以上が細い1本の縦の帯にあるなら、帯の外の墨（弧）の
      // 高さで見る。横の帯でも同じ。印そのものは墨が散らばるので、帯に半分も集まらない
      const 列帯 = 帯の最大(列の数);
      const 行帯 = 帯の最大(行の数);
      // 細長い（幅が箱の 1/4 以下で高さが 6 割以上、またはその逆）かたまりは罫線。
      // 波打った線や、線に小さなかけらが付いたものは帯に 85% 集まらない（実測 42%）
      if ((右 - 左 + 1 <= 幅 * 0.25 && 下 - 上 + 1 >= 高 * 0.6) || (下 - 上 + 1 <= 高 * 0.25 && 右 - 左 + 1 >= 幅 * 0.6)) continue;
      if (列帯 / 数 >= 0.5) {
        let 上2 = -1;
        let 下2 = -1;
        for (let y = 上; y <= 下; y++) {
          if (行の数[y] < 12) continue;
          if (上2 < 0) 上2 = y;
          下2 = y;
        }
        if (上2 < 0 || 下2 - 上2 + 1 < 最小の辺) continue;
      }
      if (行帯 / 数 >= 0.5) {
        let 左2 = -1;
        let 右2 = -1;
        for (let x = 左; x <= 右; x++) {
          if (列の数[x] < 12) continue;
          if (左2 < 0) 左2 = x;
          右2 = x;
        }
        if (左2 < 0 || 右2 - 左2 + 1 < 最小の辺) continue;
      }
      出.push({ 左, 右, 上, 下, 数 });
    }
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
  let 読んだ数 = 0; // 息継ぎ のため（8 マスごと）
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
      if (++読んだ数 % 8 === 0) await 息継ぎ();
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

function 直線を抜いた残り(切) {
  const { 幅, 高, 画 } = 切;
  if (幅 < 12 || 高 < 12) return { 線の数: 0, 線たち: [], 残りの割合: 1, 残りの弧: 0 };
  const 境 = 九割点(画) - 35;
  const 見た = new Uint8Array(幅 * 高);
  const 積 = new Int32Array(幅 * 高);
  const たち = [];
  
  for (let 始 = 0; 始 < 幅 * 高; 始++) {
    if (見た[始] || 画[始] >= 境) continue;
    let 頭 = 0;
    let 尻 = 0;
    積[尻++] = 始;
    見た[始] = 1;
    const k = { n: 0, 画素たち: [], 縁に触れた: false };
    while (頭 < 尻) {
      const p = 積[頭++];
      const x = p % 幅;
      const y = (p - x) / 幅;
      k.n++;
      k.画素たち.push({x, y, p});
      if (x === 0 || x === 幅 - 1 || y === 0 || y === 高 - 1) k.縁に触れた = true;
      if (x > 0 && !見た[p - 1] && 画[p - 1] < 境) { 見た[p - 1] = 1; 積[尻++] = p - 1; }
      if (x + 1 < 幅 && !見た[p + 1] && 画[p + 1] < 境) { 見た[p + 1] = 1; 積[尻++] = p + 1; }
      if (y > 0 && !見た[p - 幅] && 画[p - 幅] < 境) { 見た[p - 幅] = 1; 積[尻++] = p - 幅; }
      if (y + 1 < 高 && !見た[p + 幅] && 画[p + 幅] < 境) { 見た[p + 幅] = 1; 積[尻++] = p + 幅; }
    }
    if (k.n >= 15) たち.push(k);
  }
  
  if (たち.length === 0) return { 線の数: 0, 線たち: [], 残りの割合: 0, 残りの弧: 0 };
  
  たち.sort((a, b) => b.n - a.n);
  const 残す画素 = new Set();
  const 墨のリスト = [];
  
  for (let i = 0; i < たち.length; i++) {
    if (i === 0 || !たち[i].縁に触れた) {
      for (const p of たち[i].画素たち) {
        残す画素.add(p.p);
        墨のリスト.push(p);
      }
    }
  }
  
  const もとの墨 = 墨のリスト.length;
  if (もとの墨 === 0) return { 線の数: 0, 線たち: [], 残りの割合: 0, 残りの弧: 0 };
  
  const 走り = [];
  for(let y=0; y<高; y++) {
    let len = 0;
    for(let x=0; x<幅; x++) {
      if (残す画素.has(y * 幅 + x)) len++;
      else { if(len>0) 走り.push(len); len=0; }
    }
    if(len>0) 走り.push(len);
  }
  for(let x=0; x<幅; x++) {
    let len = 0;
    for(let y=0; y<高; y++) {
      if (残す画素.has(y * 幅 + x)) len++;
      else { if(len>0) 走り.push(len); len=0; }
    }
    if(len>0) 走り.push(len);
  }
  走り.sort((a,b)=>a-b);
  const 太さ = 走り.length > 0 ? 走り[Math.floor(走り.length/2)] : 1;
  const 線とみなす長さ = Math.min(幅, 高) * 0.6;
  
  const 角度リスト = [];
  for (let d = 20; d <= 70; d++) 角度リスト.push(d);
  for (let d = 110; d <= 160; d++) 角度リスト.push(d);
  
  const 線たち = [];
  let 残りリスト = [...墨のリスト];
  
  for (let step = 0; step < 2; step++) {
    if (残りリスト.length === 0) break;
    const 投票 = new Map();
    const 精度 = 2;
    const rad = (d) => d * Math.PI / 180;
    const coss = 角度リスト.map(d => Math.cos(rad(d)));
    const sins = 角度リスト.map(d => Math.sin(rad(d)));
    
    const cx = 幅/2, cy = 高/2;
    for (const p of 残りリスト) {
      const dx = p.x - cx, dy = p.y - cy;
      for (let i = 0; i < 角度リスト.length; i++) {
        const d = 角度リスト[i];
        const ρ = Math.round((dx * coss[i] + dy * sins[i]) / 精度) * 精度;
        const key = `${d}_${ρ}`;
        const val = 投票.get(key) || [];
        val.push(p);
        投票.set(key, val);
      }
    }
    
    let 最大の票数 = 0;
    let ベスト線 = null;
    
    for (const [key, pts] of 投票.entries()) {
      if (pts.length > 最大の票数) {
        const [d, ρ] = key.split('_').map(Number);
        const theta = rad(d);
        const dirX = Math.sin(theta);
        const dirY = -Math.cos(theta);
        
        let minT = Infinity, maxT = -Infinity;
        for (const p of pts) {
          const t = (p.x - cx) * dirX + (p.y - cy) * dirY;
          if (t < minT) minT = t;
          if (t > maxT) maxT = t;
        }
        const len = maxT - minT;
        if (len >= 線とみなす長さ && pts.length >= len * 1.0) {
          最大の票数 = pts.length;
          ベスト線 = { 角度: d, ρ, dirX, dirY, cx, cy, 長さ: len };
        }
      }
    }
    
    if (ベスト線) {
      線たち.push({ 角度: ベスト線.角度, 長さ: ベスト線.長さ });
      const 閾値 = 太さ * 1.5;
      const cos = Math.cos(rad(ベスト線.角度));
      const sin = Math.sin(rad(ベスト線.角度));
      const 新残り = [];
      for (const p of 残りリスト) {
        const dx = p.x - cx, dy = p.y - cy;
        const 距離 = Math.abs(dx * cos + dy * sin - ベスト線.ρ);
        if (距離 > 閾値) {
          新残り.push(p);
        }
      }
      残りリスト = 新残り;
    } else {
      break;
    }
  }
  
  const 抜いた後の墨 = 残りリスト.length;
  const 残りの割合 = 抜いた後の墨 / もとの墨;
  
  const 弧 = new Uint8Array(36);
  const cx = 幅/2, cy = 高/2;
  for (const p of 残りリスト) {
    const dx = p.x - cx, dy = p.y - cy;
    let deg = Math.atan2(dy, dx) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    const index = Math.floor(deg / 10) % 36;
    弧[index] = 1;
  }
  let うまった = 0;
  for(let i=0; i<36; i++) if(弧[i]) うまった++;
  const 残りの弧 = うまった / 36;
  
  return { 線の数: 線たち.length, 線たち, 残りの割合, 残りの弧 };
}
export { 直線を抜いた残り };
