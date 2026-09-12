/**
 * 描いた見本で学習させ、本物のマスで確かめる。
 *
 *   node scripts/ocr-cells/manabu.mjs [一種類あたりの枚数] [巡回数]
 *
 * ■ 段取り
 *   学習は「描いたもの」だけで行う。本物80マスは一度も学習に使わず、
 *   確かめにだけ使う。こうしないと、効いたのか覚えただけなのか分からない。
 *
 * ■ 模型
 *   20×20 に揃えた白黒を、400→96→4 の小さな網に通すだけ。
 *   持ち出す重みは4万個ほど（数百KB）。端末の中で動く。
 */
// ここは sharp も fs も知らない（アプリの束に入れるため）。
// 見本を読む・描く道具は manabu-node.mjs にある

const 逆 = String.fromCharCode(92);
export const 種類 = ['×', '◎', '○' + 逆, '○/'];
export const 辺 = 20;
// 網に渡す数: 点 400 ＋ 斜めの帯 39×2 ＋ 輪 10 ＋ 山の鋭さ 4
export const 入 = 辺 * 辺 + (辺 * 2 - 1) * 2 + 10 + 4;

/**
 * 明るさの並びを、学習に使う形にそろえる。
 * 墨の在る範囲で切り直し、20×20 に伸ばし、墨を1にする。
 * 描いたものと本物で、まったく同じ手順を通すこと。
 */
export async function 形にする(明るさ, 幅, 高, 選び方) {
  // 3×3 でならしてから見る手は、既定で切ってある。ざらついた写真のためだったが、
  // マス単体ではもともとざらつきの影響はほぼ無く（20×20 に縮めるときに平均される）、
  // ならして学び直すと綺麗な写真が 320 → 316 に落ちた。OCR_NARASU=1 で入る
  if (process.env.OCR_NARASU === '1') 明るさ = ならす(明るさ, 幅, 高);
  let 最小 = 255;
  let 最大 = 0;
  for (let i = 0; i < 明るさ.length; i++) {
    if (明るさ[i] < 最小) 最小 = 明るさ[i];
    if (明るさ[i] > 最大) 最大 = 明るさ[i];
  }
  if (最大 - 最小 < 25) return new Float32Array(入);
  // 薄い印は、境を高くしないと内側の丸が消える（実測で ◎ が ○ に化けた）。
  // 0.5 と 0.62 と 0.72 を比べ、0.62 がいちばん当たった（80% → 85%）
  const 墨の割 = Number(process.env.OCR_SUMI) || 0.62;
  const 境 = 最小 + (最大 - 最小) * 墨の割;

  // 箱の端から端まで走る筋は罫線なので、先に消す。
  // 印がマスいっぱいの板では罫線が印とつながって1つのかたまりになり、
  // 「細長いかたまりは外す」では消せない（4人立ちの実物で、左端に縦の罫線が
  // 残ったまま網に届いていた）。印の線は斜めか曲がっているので、
  // 1本の行や列を9割以上埋めることはない
  明るさ = Uint8Array.from(明るさ);
  // 板は9割、紙（そのまま）は8割。紙は左端の縦の罫線が85%で残っていた。
  // 板まで8割にすると、印がマスいっぱいの4人立ちの板で1列が丸ごと ◎ に化けた
  const 筋の割 = Number(process.env.OCR_SUJI) || (選び方 === 'そのまま' ? 0.8 : 0.9);
  for (let y = 0; y < 高; y++) {
    let 数 = 0;
    for (let x = 0; x < 幅; x++) if (明るさ[y * 幅 + x] < 境) 数++;
    if (数 > 幅 * 筋の割) for (let x = 0; x < 幅; x++) 明るさ[y * 幅 + x] = 最大;
  }
  for (let x = 0; x < 幅; x++) {
    let 数 = 0;
    for (let y = 0; y < 高; y++) if (明るさ[y * 幅 + x] < 境) 数++;
    if (数 > 高 * 筋の割) for (let y = 0; y < 高; y++) 明るさ[y * 幅 + x] = 最大;
  }
  // 紙の記録用紙のように箱がすでにマスに合っているなら、囲み直さず箱をそのまま使う。
  // ボールペンの線は細く途切れていて、破片を主に選んで引き伸ばしてしまう
  //（実測で × が太い帯1本に化けた）
  if (選び方 === 'そのまま') return 仕上げる(明るさ, 幅, 高, 0, 0, 幅, 高);

  // 墨ぜんぶの外接ではなく、「真ん中の印」だけを見る。
  //
  // 切り出したマスには、上下の隣の印の端や罫線が写り込む。ぜんぶを囲むと
  // 2つの印が1枚に入り、まるで別の形になる（実測でそうなっていた）。
  //
  // 真ん中にいちばん近いかたまりを主とし、その枠の中に収まるものだけを足す。
  // ◎ の内側の丸は外の丸の中に在るので拾えるが、隣のマスの印は外なので入らない。
  const 見た = new Uint8Array(幅 * 高);
  const 積 = new Int32Array(幅 * 高);
  const 中x = (幅 - 1) / 2;
  const 中y = (高 - 1) / 2;
  const かたまり = [];
  // 決まりで外したものも取っておく（ぜんぶ外れてしまったときに使う）
  const 控え = [];
  for (let y0 = 0; y0 < 高; y0++) {
    for (let x0 = 0; x0 < 幅; x0++) {
      const 始点 = y0 * 幅 + x0;
      if (見た[始点] || 明るさ[始点] >= 境) continue;
      let 頭 = 0;
      let 尻 = 0;
      積[尻++] = 始点;
      見た[始点] = 1;
      let a左 = x0, a右 = x0, a上 = y0, a下 = y0, 数 = 0;
      let sx = 0, sy = 0;
      while (頭 < 尻) {
        const p = 積[頭++];
        const x = p % 幅;
        const y = (p - x) / 幅;
        数++;
        sx += x;
        sy += y;
        if (x < a左) a左 = x;
        if (x > a右) a右 = x;
        if (y < a上) a上 = y;
        if (y > a下) a下 = y;
        if (x > 0 && !見た[p - 1] && 明るさ[p - 1] < 境) { 見た[p - 1] = 1; 積[尻++] = p - 1; }
        if (x + 1 < 幅 && !見た[p + 1] && 明るさ[p + 1] < 境) { 見た[p + 1] = 1; 積[尻++] = p + 1; }
        if (y > 0 && !見た[p - 幅] && 明るさ[p - 幅] < 境) { 見た[p - 幅] = 1; 積[尻++] = p - 幅; }
        if (y + 1 < 高 && !見た[p + 幅] && 明るさ[p + 幅] < 境) { 見た[p + 幅] = 1; 積[尻++] = p + 幅; }
      }
      const w2 = a右 - a左 + 1;
      const h2 = a下 - a上 + 1;
      // ごく小さな点（にじみ）は、どちらにしても印ではない
      if (数 < 幅 * 高 * 0.0015) continue;
      const 一つ = { 左: a左, 右: a右, 上: a上, 下: a下, 数, x: sx / 数, y: sy / 数 };
      控え.push(一つ);
      // 罫線は細長い。印ではないので外す
      if ((w2 > 幅 * 0.8 && h2 < 高 * 0.12) || (h2 > 高 * 0.8 && w2 < 幅 * 0.12)) continue;
      // べったり塗られたものは印ではない。名札の色枠、影、合計欄の長い斜線が
      // これに当たる。印は線なので、枠の中がびっしり埋まることはない
      //（丸の輪郭なら 2割ほど、×でも 3割ほど）。実測で、これを入れないと
      // 名札の縁を印と取り違えて、そのマスが丸ごと別物になっていた
      if (数 > w2 * h2 * 0.45) continue;
      // マスより大きいものも印ではない。切り出しの箱は印の1.7倍ほどなので、
      // 印は箱の6割ほどに収まる。縦横とも箱いっぱいに広がるものは、
      // 合計欄の長い斜線が写り込んだもの（実測で×を1枚取り違えていた）
      if (w2 > 幅 * 0.88 && h2 > 高 * 0.88) continue;
      かたまり.push(一つ);
    }
  }
  // ぜんぶ外してしまったら、外す前のものから選び直す。
  // 大きく書かれた印は箱いっぱいに広がるので、上の決まりで消える。
  // 実測で、12番の1マスがこれで真っ白になり、網は当てずっぽうになっていた
  if (!かたまり.length) かたまり.push(...控え);
  if (!かたまり.length) return new Float32Array(入);

  // 主は「真ん中に近く、大きい」もの
  かたまり.sort(
    (a, z) =>
      Math.hypot(a.x - 中x, a.y - 中y) / Math.sqrt(a.数) - Math.hypot(z.x - 中x, z.y - 中y) / Math.sqrt(z.数)
  );
  const 主 = かたまり[0];
  let 左 = 主.左, 右 = 主.右, 上 = 主.上, 下 = 主.下;
  // 1つの印が、擦れて幾つかに割れていることがある（×の2本が別々になるなど）。
  // 主の近くに在るものはまとめる。隣のマスの印は行の間隔ぶん離れているので、
  // 近さで切れば入ってこない。◎ の内側の丸も、これでまとまる。
  const 近さ = Math.min(幅, 高) * 0.3;
  for (const k of かたまり) {
    if (k === 主) continue;
    const 内側 = k.左 >= 主.左 - 2 && k.右 <= 主.右 + 2 && k.上 >= 主.上 - 2 && k.下 <= 主.下 + 2;
    const 近い = Math.hypot(k.x - 主.x, k.y - 主.y) <= 近さ;
    if (!内側 && !近い) continue;
    if (k.左 < 左) 左 = k.左;
    if (k.右 > 右) 右 = k.右;
    if (k.上 < 上) 上 = k.上;
    if (k.下 > 下) 下 = k.下;
  }
  if (右 < 0) return new Float32Array(入);
  // 印が箱いっぱいの板（4人立ちの実物）では、印が隣の印や罫線とつながって
  // 1つのかたまりになり、囲み直すと半マスずれた絵になった（真ん中に罫線が
  // 横切り、×が上下に割れて見えた）。囲みが箱の8割を超えるなら、囲み直さず
  // 箱をそのまま使う（箱はマスの間隔で縛ってあるので、隣は少ししか入らない）
  if (右 - 左 + 1 > 幅 * 0.8 && 下 - 上 + 1 > 高 * 0.8) {
    左 = 0;
    右 = 幅 - 1;
    上 = 0;
    下 = 高 - 1;
  }
  return 仕上げる(明るさ, 幅, 高, 左, 上, 右 - 左 + 1, 下 - 上 + 1);
}

/** 囲んだところを 20×20 に縮め、明暗をそろえ、特徴を付ける */
function 仕上げる(明るさ, 幅, 高, 左, 上, w, h) {
  // 20×20 に縮める。ここも sharp を通さない。マス1枚ごとに sharp を呼ぶと、
  // 板120枚（9600マス）で数十分かかっていた。縦横の比は無視して引き伸ばす
  const 小 = 縮める(明るさ, 幅, 高, 左, 上, w, h, 辺, 辺);
  const 画 = new Float32Array(辺 * 辺);
  // 明暗の伸ばし方。いちばん暗い1点といちばん明るい1点で伸ばすと、
  // ごみ1つで幅が決まってしまい、薄い印がほとんど見えなくなる。
  // 上下の何割かを切ったところで伸ばすと、薄い印も出てくる
  const 並べ = Array.from(小).sort((a, b) => a - b);
  const 切り = Number(process.env.OCR_BUNI) || 0.06;
  const 暗い端 = 並べ[Math.floor(並べ.length * 切り)];
  const 明るい端 = 並べ[Math.min(並べ.length - 1, Math.floor(並べ.length * (1 - 切り)))];
  const 幅ぶん = Math.max(8, 明るい端 - 暗い端);
  for (let i = 0; i < 画.length; i++) {
    const v = 1 - (小[i] - 暗い端) / 幅ぶん;
    画[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return 特徴にする(画);
}

/**
 * 画のほかに、斜めの向きと輪の形を測って足す。
 *
 * ○＼ と ○／ の違いは、線の向きだけしかない。20×20 の点を並べただけでは、
 * 網はその向きを自分で見つけ出さなければならず、実測で ◎ と取り違えていた。
 *
 *   ・斜めの帯（x+y ごと、x-y ごとの墨の量）… ／ は片方に、＼ は他方に鋭い山が立つ。
 *     丸や ◎ は、どちらも平らになる。
 *   ・真ん中からの距離ごとの墨の量 … ◎ は内側にも輪があるので、中ほどで盛り上がる。
 */
export function 特徴にする(画) {
  const 帯 = 辺 * 2 - 1;
  const 輪 = 10;
  const 出 = new Float32Array(辺 * 辺 + 帯 * 2 + 輪 + 4);
  出.set(画, 0);
  const 順 = new Float32Array(帯);
  const 逆向 = new Float32Array(帯);
  const 環 = new Float32Array(輪);
  const 数 = new Float32Array(輪);
  const 中 = (辺 - 1) / 2;
  const 最遠 = Math.hypot(中, 中);
  for (let y = 0; y < 辺; y++) {
    for (let x = 0; x < 辺; x++) {
      const v = 画[y * 辺 + x];
      順[x + y] += v;
      逆向[x - y + 辺 - 1] += v;
      const r = Math.min(輪 - 1, Math.floor((Math.hypot(x - 中, y - 中) / 最遠) * 輪));
      環[r] += v;
      数[r]++;
    }
  }
  // 帯ごとのマスの数で割ってそろえる（端の帯は数が少ない）
  for (let i = 0; i < 帯; i++) {
    const 幅 = 辺 - Math.abs(i - (辺 - 1));
    出[辺 * 辺 + i] = 順[i] / 幅;
    出[辺 * 辺 + 帯 + i] = 逆向[i] / 幅;
  }
  for (let r = 0; r < 輪; r++) 出[辺 * 辺 + 帯 * 2 + r] = 数[r] ? 環[r] / 数[r] : 0;

  // 帯の「山の鋭さ」。網は足し算しかできないので、いちばん高いところは
  // 自分では作れない。／ は片方の帯に鋭い山が立ち、＼ はもう片方に立つ。
  // 実測で、残った外れが全部「／を＼と読む」になっていたので足した
  const 頭 = 辺 * 辺 + 帯 * 2 + 輪;
  for (let 側 = 0; 側 < 2; 側++) {
    const 元 = 側 === 0 ? 順 : 逆向;
    let 最大 = 0;
    let 合 = 0;
    for (let i = 0; i < 帯; i++) {
      const 幅 = 辺 - Math.abs(i - (辺 - 1));
      const v = 元[i] / 幅;
      if (v > 最大) 最大 = v;
      合 += v;
    }
    const 平 = 合 / 帯;
    出[頭 + 側 * 2] = 最大;
    出[頭 + 側 * 2 + 1] = 平 > 1e-6 ? Math.min(4, 最大 / 平) / 4 : 0;
  }
  return 出;
}

/**
 * 輪の覆い … 網に届く形（20×20 の墨）の外側の輪を12の扇に分け、墨のある扇の割合。
 *
 * 丸の仲間（◎・○＼・○／）は輪がぐるりと在るので 0.67 以上（本物160マスの最小）。
 * × は斜めの2本だけなので中央 0.42、9割が 0.58 以下。
 * 細いペンの小さな × を網が ○＼ と読んだ（本物、0.7〜0.9 の確からしさで）ので、
 * 輪が半分も無ければ × に倒す守りに使う（src/ocr/yomu.js）
 */
export function 輪の覆い(形, 扇 = 12) {
  const 中 = (辺 - 1) / 2;
  const 最 = new Float32Array(扇);
  for (let y = 0; y < 辺; y++) {
    for (let x = 0; x < 辺; x++) {
      const r = Math.hypot(x - 中, y - 中);
      if (r < 中 * 0.55 || r > 中 * 1.05) continue;
      const 角 = Math.atan2(y - 中, x - 中);
      const s = Math.floor(((角 + Math.PI) / (2 * Math.PI)) * 扇) % 扇;
      const v = 形[y * 辺 + x];
      if (v > 最[s]) 最[s] = v;
    }
  }
  let n = 0;
  for (const v of 最) if (v >= 0.45) n++;
  return n / 扇;
}

/** 3×3 の平均でならす */
function ならす(画, 幅, 高) {
  const 出 = new Uint8Array(幅 * 高);
  for (let y = 0; y < 高; y++) {
    for (let x = 0; x < 幅; x++) {
      let 和 = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= 高) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= 幅) continue;
          和 += 画[yy * 幅 + xx];
          n++;
        }
      }
      出[y * 幅 + x] = Math.round(和 / n);
    }
  }
  return 出;
}

/**
 * 四角を、辺×辺 に縮める。行き先の1マスに入る元の画素を平均する
 *（間引くと細い線が消えてしまう）。
 */
function 縮める(画, 幅, 高, 左, 上, w, h, 出幅, 出高) {
  const 出 = new Float32Array(出幅 * 出高);
  for (let y = 0; y < 出高; y++) {
    const y0 = 上 + (y * h) / 出高;
    const y1 = 上 + ((y + 1) * h) / 出高;
    const ya = Math.max(0, Math.floor(y0));
    const yb = Math.min(高, Math.max(ya + 1, Math.ceil(y1)));
    for (let x = 0; x < 出幅; x++) {
      const x0 = 左 + (x * w) / 出幅;
      const x1 = 左 + ((x + 1) * w) / 出幅;
      const xa = Math.max(0, Math.floor(x0));
      const xb = Math.min(幅, Math.max(xa + 1, Math.ceil(x1)));
      let 合 = 0;
      let 数 = 0;
      for (let yy = ya; yy < yb; yy++) {
        const 基 = yy * 幅;
        for (let xx = xa; xx < xb; xx++) {
          合 += 画[基 + xx];
          数++;
        }
      }
      出[y * 出幅 + x] = 数 ? 合 / 数 : 255;
    }
  }
  return 出;
}

/**
 * 明るさの板から、四角を1つ切り取る。
 * sharp を通さずに配列から取る（マスごとに画像を開き直すと桁違いに遅い）。
 */
export function 切り取る(画, 幅, 高, 左, 上, w, h) {
  const l = Math.max(0, Math.min(左, 幅 - 1));
  const t = Math.max(0, Math.min(上, 高 - 1));
  const ww = Math.max(1, Math.min(w, 幅 - l));
  const hh = Math.max(1, Math.min(h, 高 - t));
  const 出 = new Uint8Array(ww * hh);
  for (let y = 0; y < hh; y++) {
    const 元 = (t + y) * 幅 + l;
    for (let x = 0; x < ww; x++) 出[y * ww + x] = 画[元 + x];
  }
  return { 画: 出, 幅: ww, 高: hh };
}

// ── 小さな網 ────────────────────────────────

export function 網をつくる(隠れ, 種, 出の数) {
  // 出の数は既定で板の4種類。紙の記録用紙は ○× の2種類なので、そちらは2を渡す
  const 出 = 出の数 || 種類.length;
  let s = (種 || 12345) >>> 0;
  const 乱 = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296 - 0.5;
  };
  const 幅1 = Math.sqrt(2 / 入);
  const 幅2 = Math.sqrt(2 / 隠れ);
  return {
    隠れ,
    W1: Float32Array.from({ length: 入 * 隠れ }, () => 乱() * 2 * 幅1),
    b1: new Float32Array(隠れ),
    W2: Float32Array.from({ length: 隠れ * 出 }, () => 乱() * 2 * 幅2),
    b2: new Float32Array(出),
  };
}

export function 前へ(網, x, 途中) {
  // 出の数は重みの形から取る（板は4、紙は2）
  const 出 = 網.b2.length;
  const h = 途中 ? 途中.h : new Float32Array(網.隠れ);
  const o = 途中 ? 途中.o : new Float32Array(出);
  for (let j = 0; j < 網.隠れ; j++) {
    let s = 網.b1[j];
    const 基 = j * 入;
    for (let i = 0; i < 入; i++) s += 網.W1[基 + i] * x[i];
    h[j] = s > 0 ? s : 0;
  }
  let 最大 = -Infinity;
  for (let k = 0; k < 出; k++) {
    let s = 網.b2[k];
    const 基 = k * 網.隠れ;
    for (let j = 0; j < 網.隠れ; j++) s += 網.W2[基 + j] * h[j];
    o[k] = s;
    if (s > 最大) 最大 = s;
  }
  let 和 = 0;
  for (let k = 0; k < 出; k++) {
    o[k] = Math.exp(o[k] - 最大);
    和 += o[k];
  }
  for (let k = 0; k < 出; k++) o[k] /= 和;
  return { h, o };
}

/** 当たりを数える */
export function 測る(網, 見本) {
  let 合 = 0;
  const 表 = 種類.map(() => 種類.map(() => 0));
  for (const s of 見本) {
    const { o } = 前へ(網, s.形);
    let 最 = 0;
    for (let k = 1; k < 種類.length; k++) if (o[k] > o[最]) 最 = k;
    表[s.札][最]++;
    if (最 === s.札) 合++;
  }
  return { 当たり: 合, 全: 見本.length, 表 };
}
