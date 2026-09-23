/**
 * 板の写真から、○×の並びを見つけて格子を組み立てる。
 *
 * ■ なぜ罫線を使わないか
 * ホワイトボードの罫線は薄く、写真では拾えなかった（実測。しきい値を下げると
 * ネームプレートや数字を線と取り違える）。いっぽう○×そのものは濃く、
 * 規則正しい格子に並んでいる。印の位置から格子を復元するほうが確かだった。
 *
 * 使い方（部品として）:
 *   import { 暗さの境, かたまりを拾う } from './koushi.mjs';
 */
// 画は外から渡される（Node は gazou-node.mjs、アプリは src/ocr/gazou-web.js で読む）。
// ここは sharp を知らない。アプリの束に入れるため

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
 * 1次元の値を、密度の山で束ねる（列を見つける）。
 *
 * 束ねる は「隣との間が近ければ同じ束」なので、列と列の間に字の断片や数字が
 * ぽつぽつ在ると、鎖のようにつながって2列が1つの束になった（9/13 の板で、
 * 安田と冨澤の列が1つになり、格子が3列になった）。
 * ここでは値の密度（幅 の半分を裾にした三角の山を重ねたもの）の山を取り、
 * 山どうしは 幅 の 0.9 倍以上離す。各値はいちばん近い山（幅 の 0.65 倍まで）に入れる。
 * どの山にも入らない値（列の間の字）は捨てる
 */
export function 山で束ねる(値たち, 幅) {
  if (!値たち.length) return [];
  const 下 = Math.min(...値たち);
  const 上 = Math.max(...値たち);
  const 刻み = Math.max(1, 幅 / 8);
  const n = Math.floor((上 - 下) / 刻み) + 1;
  const 密度 = new Float32Array(n);
  const 裾 = Math.max(1, Math.round((幅 * 0.5) / 刻み));
  for (const v of 値たち) {
    const i = Math.floor((v - 下) / 刻み);
    for (let k = -裾; k <= 裾; k++) {
      const j = i + k;
      if (j >= 0 && j < n) 密度[j] += 1 - Math.abs(k) / (裾 + 1);
    }
  }
  const 山 = [];
  for (let i = 0; i < n; i++) {
    if (密度[i] <= 0) continue;
    if ((i > 0 && 密度[i - 1] > 密度[i]) || (i + 1 < n && 密度[i + 1] > 密度[i])) continue;
    山.push({ 位置: 下 + (i + 0.5) * 刻み, 高さ: 密度[i] });
  }
  山.sort((a, z) => z.高さ - a.高さ);
  const 残す = [];
  for (const m of 山) if (残す.every((r) => Math.abs(r.位置 - m.位置) >= 幅 * 0.9)) 残す.push(m);
  残す.sort((a, z) => a.位置 - z.位置);
  const 束 = 残す.map(() => []);
  for (const v of 値たち) {
    let 近い = -1;
    let 差 = 幅 * 0.65;
    for (let i = 0; i < 残す.length; i++) {
      const d = Math.abs(v - 残す[i].位置);
      if (d < 差) {
        差 = d;
        近い = i;
      }
    }
    if (近い >= 0) 束[近い].push(v);
  }
  return 束
    .filter((x) => x.length)
    .map((x) => {
      x.sort((a, z) => a - z);
      return { 中心: x.reduce((a, b) => a + b, 0) / x.length, 数: x.length, 端: [x[0], x[x.length - 1]] };
    });
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
  // Node で測るときだけ使う。アプリからも読むファイルなので、読み込みはここで取る
  const { 画素を読む } = await import('./gazou-node.mjs');
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

/**
 * 罫線を消す。
 *
 * 罫線が濃い板では、印が罫線につながって1つのかたまりになり、印として拾えない
 *（9/13 の LION の板）。罫線は「細くて長い」ので、暗い画素の走りが 長さ 以上
 * 続くところを罫線とみなして白く塗る。印の線は長くても印の幅ほど。
 *
 * 少し傾いた罫線は、1行ずつ見ると走りが途切れる（1度で 5px の線は 230px しか続かない）。
 * そこで 帯（8px）ごとに「その帯に暗い画素があるか」で走りを追い、走りの中では
 * 列ごとに帯の中の暗いつながりを見て、細いもの（罫線）だけを消す。
 * 帯を縦に貫く太いつながり（印の線が罫線を横切っているところ）は残す。
 * 3px までの切れ目はつないで数える（JPEG のむら）。
 * ※ 帯を 16px にしたり、途切れたら隣の帯へ乗り換えて追ったりすると、縦に触れ合った
 *   印まで1つの走りになって細い部分が消え、格子が立たなくなった（9/6 の板で 320 から落ちた）。
 *   2度近く傾いた罫線は少し消し残るが、そのままにしている
 *
 * @param {{画素:Uint8Array,幅:number,高:number}} 生 塗る画（返すのはこれの写し）
 * @param {number} 長さ これ以上続く走りを罫線とみなす（画素）
 * @param {number} 境 暗いとみなす明るさ（判定 の画での）
 * @param {{画素:Uint8Array}} [判定] 暗さを見る画（平らにしたもの）。無ければ 生 で見る
 * @returns {{画素:Uint8Array,幅:number,高:number, 消した:Uint8Array}} 消した は同じ位置を塗った判定の画
 */
export function 罫線を消す(生, 長さ, 境, 判定) {
  const { 幅, 高 } = 生;
  const 見る = 判定 ? 判定.画素 : 生.画素;
  const 出 = new Uint8Array(生.画素);
  const 消した = new Uint8Array(見る);
  const 帯 = 8;
  const 太さ = 帯 - 1;
  const 許す切れ目 = 3;
  const 塗る = (i) => {
    出[i] = 255;
    消した[i] = 255;
  };
  // 横の罫線
  const 帯の数 = Math.ceil(高 / 帯);
  for (let b = 0; b < 帯の数; b++) {
    const y0 = b * 帯;
    const y1 = Math.min(高, y0 + 帯);
    let 始 = -1;
    let 最後 = -1;
    for (let x = 0; x <= 幅; x++) {
      let 暗 = false;
      if (x < 幅) for (let y = y0; y < y1; y++) if (見る[y * 幅 + x] < 境) { 暗 = true; break; }
      if (暗) {
        if (始 < 0) 始 = x;
        最後 = x;
      } else if (始 >= 0 && (x - 最後 > 許す切れ目 || x === 幅)) {
        if (最後 - 始 + 1 >= 長さ) {
          for (let xx = 始; xx <= 最後; xx++) {
            // 列ごとに、帯の中の暗いつながり。細ければ罫線
            let 上 = -1;
            for (let y = y0; y <= y1; y++) {
              const 暗い = y < y1 && 見る[y * 幅 + xx] < 境;
              if (暗い && 上 < 0) 上 = y;
              if (!暗い && 上 >= 0) {
                if (y - 上 <= 太さ) for (let k = 上; k < y; k++) 塗る(k * 幅 + xx);
                上 = -1;
              }
            }
          }
        }
        始 = -1;
      }
    }
  }
  // 縦の罫線
  const 帯の数x = Math.ceil(幅 / 帯);
  for (let b = 0; b < 帯の数x; b++) {
    const x0 = b * 帯;
    const x1 = Math.min(幅, x0 + 帯);
    let 始 = -1;
    let 最後 = -1;
    for (let y = 0; y <= 高; y++) {
      let 暗 = false;
      if (y < 高) for (let x = x0; x < x1; x++) if (消した[y * 幅 + x] < 境) { 暗 = true; break; }
      if (暗) {
        if (始 < 0) 始 = y;
        最後 = y;
      } else if (始 >= 0 && (y - 最後 > 許す切れ目 || y === 高)) {
        if (最後 - 始 + 1 >= 長さ) {
          for (let yy = 始; yy <= 最後; yy++) {
            let 左 = -1;
            for (let x = x0; x <= x1; x++) {
              const 暗い = x < x1 && 消した[yy * 幅 + x] < 境;
              if (暗い && 左 < 0) 左 = x;
              if (!暗い && 左 >= 0) {
                if (x - 左 <= 太さ) for (let k = 左; k < x; k++) 塗る(yy * 幅 + k);
                左 = -1;
              }
            }
          }
        }
        始 = -1;
      }
    }
  }
  return { ...生, 画素: 出, 消した };
}

/**
 * 明るさを平らにする（まわりの明るさとの差にする）。
 *
 * 板の白は照り返しや影で場所ごとに明るさが違い、板の外には木や壁の暗い模様が写る。
 * 1つの暗さの境で「暗い画素」を決めると、暗い写真では印を取りこぼし、木の格子は
 * ぜんぶ暗い画素になって罫線の傾きを狂わせた（9/13 の縦の写真）。
 * まわり（半径 の箱）の平均から どれだけ暗いか を画素にする。板の白は 200 に落ち着き、
 * 印と罫線はそこから 60〜120 暗い。木の木目のような弱い模様は 30 ほどしか暗くならない。
 * 平均は 8px の箱ごとに取り、箱の並びの上で箱の平均を取る（画ぜんぶで積算表を持たない）
 */
export function 平らにする(生, 半径) {
  const { 画素, 幅, 高 } = 生;
  const 縮 = 8;
  const w = Math.ceil(幅 / 縮);
  const h = Math.ceil(高 / 縮);
  const 箱 = new Float32Array(w * h);
  const 数 = new Uint16Array(w * h);
  for (let y = 0; y < 高; y++) {
    const by = (y / 縮) | 0;
    const 行 = y * 幅;
    for (let x = 0; x < 幅; x++) {
      const i = by * w + ((x / 縮) | 0);
      箱[i] += 画素[行 + x];
      数[i]++;
    }
  }
  for (let i = 0; i < 箱.length; i++) 箱[i] /= 数[i] || 1;
  // 箱の並びの積算表で、半径ぶんの箱の平均
  const 積 = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let 行の和 = 0;
    for (let x = 0; x < w; x++) {
      行の和 += 箱[y * w + x];
      積[(y + 1) * (w + 1) + (x + 1)] = 積[y * (w + 1) + (x + 1)] + 行の和;
    }
  }
  const R = Math.max(1, Math.round(半径 / 縮));
  const 局所 = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - R);
    const y1 = Math.min(h, y + R + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R);
      const x1 = Math.min(w, x + R + 1);
      const 和 = 積[y1 * (w + 1) + x1] - 積[y0 * (w + 1) + x1] - 積[y1 * (w + 1) + x0] + 積[y0 * (w + 1) + x0];
      局所[y * w + x] = 和 / ((y1 - y0) * (x1 - x0));
    }
  }
  const 出 = new Uint8Array(画素.length);
  for (let y = 0; y < 高; y++) {
    const by = (y / 縮) | 0;
    const 行 = y * 幅;
    for (let x = 0; x < 幅; x++) {
      const v = 画素[行 + x] - 局所[by * w + ((x / 縮) | 0)] + 200;
      出[行 + x] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return { 画素: 出, 幅, 高 };
}

/** 平らにした画での「暗い」の境。板の白（200）から 45 以上暗いもの */
export const 平らの境 = 155;
