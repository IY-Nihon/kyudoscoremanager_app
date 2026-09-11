/**
 * 板の写真から、○×の並びを見つけて格子を組み立てる。
 *
 * ■ なぜ罫線を使わないか
 * ホワイトボードの罫線は薄く、写真では拾えなかった（実測。しきい値を下げると
 * ネームプレートや数字を線と取り違える）。いっぽう○×そのものは濃く、
 * 規則正しい格子に並んでいる。印の位置から格子を復元するほうが確かだった。
 *
 * 使い方（部品として）:
 *   import { 格子を見つける } from './koushi.mjs';
 *   const 格子 = await 格子を見つける('板.jpg');
 */
import sharp from 'sharp';

/** 白黒の生画素と、その大きさを返す */
export async function 画素を読む(みち) {
  const { data, info } = await sharp(みち)
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { 画素: data, 幅: info.width, 高: info.height };
}

/**
 * 暗いとみなす境を決める。
 * 白板は明るく、印は濃い。明るさの分布から山の谷を取るのではなく、
 * 中央値から一定ぶん暗い側を印とみなす（照明のむらに強い）。
 */
export function 暗さの境(画素) {
  const 数え = new Array(256).fill(0);
  for (let i = 0; i < 画素.length; i++) 数え[画素[i]]++;
  let 合 = 0;
  let 中央 = 128;
  for (let v = 0; v < 256; v++) {
    合 += 数え[v];
    if (合 >= 画素.length / 2) {
      中央 = v;
      break;
    }
  }
  return Math.max(30, 中央 - 60);
}

/**
 * 濃いかたまり（印の候補）を拾う。
 * 4近傍で繋がっている暗い画素をまとめ、外接する箱を返す。
 */
export function かたまりを拾う({ 画素, 幅, 高 }, 境) {
  const 見た = new Uint8Array(幅 * 高);
  const 出 = [];
  const 積 = new Int32Array(幅 * 高);
  for (let y0 = 0; y0 < 高; y0++) {
    for (let x0 = 0; x0 < 幅; x0++) {
      const 始 = y0 * 幅 + x0;
      if (見た[始] || 画素[始] >= 境) continue;
      let 頭 = 0;
      let 尻 = 0;
      積[尻++] = 始;
      見た[始] = 1;
      let 左 = x0, 右 = x0, 上 = y0, 下 = y0, 数 = 0;
      while (頭 < 尻) {
        const p = 積[頭++];
        const x = p % 幅;
        const y = (p - x) / 幅;
        数++;
        if (x < 左) 左 = x;
        if (x > 右) 右 = x;
        if (y < 上) 上 = y;
        if (y > 下) 下 = y;
        if (x > 0 && !見た[p - 1] && 画素[p - 1] < 境) { 見た[p - 1] = 1; 積[尻++] = p - 1; }
        if (x + 1 < 幅 && !見た[p + 1] && 画素[p + 1] < 境) { 見た[p + 1] = 1; 積[尻++] = p + 1; }
        if (y > 0 && !見た[p - 幅] && 画素[p - 幅] < 境) { 見た[p - 幅] = 1; 積[尻++] = p - 幅; }
        if (y + 1 < 高 && !見た[p + 幅] && 画素[p + 幅] < 境) { 見た[p + 幅] = 1; 積[尻++] = p + 幅; }
      }
      出.push({ 左, 右, 上, 下, 数, 幅: 右 - 左 + 1, 高: 下 - 上 + 1, x: (左 + 右) / 2, y: (上 + 下) / 2 });
    }
  }
  return 出;
}

/**
 * 1次元の値を、間隔の空いたところで束ねる。
 * 印の中心を束ねると、列（または行）になる。
 */
export function 束ねる(値たち, 最小の間) {
  const 並び = 値たち.slice().sort((a, z) => a - z);
  const 束 = [];
  let いま = [];
  for (const v of 並び) {
    if (!いま.length || v - いま[いま.length - 1] <= 最小の間) いま.push(v);
    else {
      束.push(いま);
      いま = [v];
    }
  }
  if (いま.length) 束.push(いま);
  return 束.map((x) => ({ 中心: x.reduce((a, b) => a + b, 0) / x.length, 数: x.length, 端: [x[0], x[x.length - 1]] }));
}

/**
 * 束ねるときに、束の広がりにも上限を置く。
 * 印が詰まって並んでいると、隣の列まで1つの束につながることがある。
 * 隣どうしの近さだけでなく、束の端から端までの幅でも切る。
 */
export function 幅を限って束ねる(値たち, 許す間, 許す幅) {
  const 並び = 値たち.slice().sort((a, z) => a - z);
  const 束 = [];
  let いま = [];
  for (const v of 並び) {
    if (いま.length && (v - いま[いま.length - 1] > 許す間 || v - いま[0] > 許す幅)) {
      束.push(いま);
      いま = [];
    }
    いま.push(v);
  }
  if (いま.length) 束.push(いま);
  return 束.map((x) => ({
    中心: x.reduce((a, b) => a + b, 0) / x.length,
    数: x.length,
    端: [x[0], x[x.length - 1]],
    幅: x[x.length - 1] - x[0],
  }));
}

/**
 * 明暗を伸ばす。暗い写真、薄い印、照り返しのむらがあっても、
 * 印と板の差が同じくらいになるようにそろえる。
 *
 * いちばん暗い1点といちばん明るい1点で伸ばすと、ごみ1つで幅が決まる。
 * 暗い側は下から0.5%、明るい側は上から10%のところで伸ばす。
 * 明るい側を多めに切るのは、板の白がほとんどを占めるため
 *（上から10%でも、まだ白の中に在る）。
 */
export function 明暗を伸ばす(画素) {
  const 数え = new Uint32Array(256);
  for (let i = 0; i < 画素.length; i++) 数え[画素[i]]++;
  const 総数 = 画素.length;
  let 暗い端 = 0;
  let 明るい端 = 255;
  let 累 = 0;
  for (let v = 0; v < 256; v++) {
    累 += 数え[v];
    if (累 >= 総数 * 0.005) {
      暗い端 = v;
      break;
    }
  }
  累 = 0;
  for (let v = 255; v >= 0; v--) {
    累 += 数え[v];
    if (累 >= 総数 * 0.1) {
      明るい端 = v;
      break;
    }
  }
  const 幅 = Math.max(20, 明るい端 - 暗い端);
  const 出 = new Uint8Array(画素.length);
  for (let i = 0; i < 画素.length; i++) {
    const v = Math.round(((画素[i] - 暗い端) * 230) / 幅 + 20);
    出[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return 出;
}

/**
 * 写真の傾きを、印の並びから測る（度）。
 *
 * 印は縦横に並んでいる。正しい角度で見れば、印の x をまとめたときも
 * y をまとめたときも、少ない箱に集中する（列と行に落ちる）。傾いていると
 * ばらける。箱ごとの数の二乗和は、集中しているほど大きくなるので、
 * それがいちばん大きくなる角度を ±16度の範囲で探す。
 *
 * 行のほうを1.5倍に重く見ているのは、列は小計の数字などで乱れやすく、
 * 行のほうが素直に揃うため。
 */
export function 傾きを測る(印, 最小幅) {
  let 最良 = 0;
  let 最大 = -1;
  const 箱 = 最小幅 * 0.35;
  for (let 度 = -16; 度 <= 16; 度 += 0.15) {
    const r = (度 * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    const u = 印.map((b) => b.x * c + b.y * s);
    const v = 印.map((b) => -b.x * s + b.y * c);
    const 集中 = (値たち) => {
      const 下 = Math.min(...値たち);
      const 上 = Math.max(...値たち);
      const 数え = new Float32Array(Math.ceil((上 - 下) / 箱) + 1);
      for (const x of 値たち) 数え[Math.floor((x - 下) / 箱)]++;
      let 和 = 0;
      for (const n of 数え) 和 += n * n;
      return 和;
    };
    const 点 = 集中(u) + 集中(v) * 1.5;
    if (点 > 最大) {
      最大 = 点;
      最良 = 度;
    }
  }
  return 最良;
}

/**
 * 印の並びから格子を組み立てる。
 *
 * @param {string} みち 画像のみち
 * @param {{最小の大きさ?:number, 最大の大きさ?:number}} [注文]
 */
export async function 格子を見つける(みち, 注文) {
  const o = 注文 || {};
  const 生 = await 画素を読む(みち);
  const 境 = 暗さの境(生.画素);
  const かたまり = かたまりを拾う(生, 境);

  // 印の大きさの見当をつける。画像の幅に対する割合で絞る
  const 最小 = o.最小の大きさ || Math.round(生.幅 * 0.012);
  const 最大 = o.最大の大きさ || Math.round(生.幅 * 0.09);
  const 印 = かたまり.filter(
    (b) =>
      b.幅 >= 最小 && b.幅 <= 最大 && b.高 >= 最小 && b.高 <= 最大 &&
      // 縦横の比が極端なもの（罫線の切れ端）は落とす
      b.幅 / b.高 > 0.45 && b.幅 / b.高 < 2.2 &&
      // 塗りつぶしが薄すぎるものも落とす
      b.数 > 最小 * 最小 * 0.12
  );

  const 印の幅 = 印.length ? 印.map((b) => b.幅).sort((a, z) => a - z)[Math.floor(印.length / 2)] : 最小;
  const 列 = 束ねる(印.map((b) => b.x), 印の幅 * 0.7);
  const 行 = 束ねる(印.map((b) => b.y), 印の幅 * 0.7);

  return { 幅: 生.幅, 高: 生.高, 境, かたまりの数: かたまり.length, 印: 印.length, 印の幅, 列, 行 };
}
