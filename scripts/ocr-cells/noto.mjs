/**
 * 手書きのノートの記録（1 人 1 列・1 マス 1 射）を読む。2026-10-11。
 *
 * ■ ノートの形（使う人に聞いた決まり。memory の ocr-board-notation-rules）
 *   ・罫線のノートに、1 人 1 列（刷られた縦の罫線の間）で ○ か × を書く。名前は列の下
 *   ・手で引いた太い横線で、4 射ずつのかたまり（立）に分ける。段もかたまりの中も「下から」
 *   ・1 ページに日付ごとの組がいくつも並ぶ。組の右端が大前
 *   ・斜線で塗った ○ は ○。○ の中に「当」などを書いたものは後の確認で直した訂正（迷ったマスにする）
 *   ・赤ペンの ○× は裏のページの写り。上の数字は各人の的中数、組の横の数字は立ごとの小計
 *
 * ■ 読み方
 *   1. 写真を幅 1600 にそろえる（線の太さ・間隔の決まりはこの大きさで決めた）
 *   2. 罫線：両脇より少し暗い細い線（尾根）を、印の墨を除いて角度つきで集める。罫線の傾きは位置に比例して
 *      変わる（遠近）ので t = t0 + k·位置 を当てはめ、その傾きで線ごとの支えを測って山を拾う。
 *      縦は等間隔の櫛（位置の二次式）に当てはめて、印で隠れた線を埋める
 *   3. かたまりの線：横の山のうち濃い（手で引いた）線で、間隔がなめらかに変わるいちばん長い並び
 *   4. かたまりの上半分・下半分ごとに縦線を少しずらす（紙のたわみ）。隣と近いずらし（動的計画法）
 *   5. マスを 3 種類（× ○ 他）の網で見分ける（noto-tatami.json。他 は字・数字・訂正）。
 *      マスより大きな ○（内側が空で、輪がマスの 4 辺の真ん中を横切る）は広めに切って見分ける
 *   6. 印のあるかたまりの続きを本体とし、かたまりごとの印のある列を、下から上へ人の筋につなぐ
 *   7. 筋の端の「他」（上の数字・下の名前）は外し、内側の「他」は迷ったマス（確からしさ 0.5）
 *
 * 試作と測り方は scratchpad（noto4・noto5・seido）。ページの絵に点を打って目で確かめ、上の的中数と比べた。
 */
import { 明暗を伸ばす } from './koushi.mjs';
import { 畳みで見分ける } from './tatami.mjs';
import { 息継ぎ } from './ikitsugi.mjs';

/** 読む大きさ（幅）。線の太さ・間隔・閾値はこの大きさで決めた */
export const ノートの幅 = 1600;

/**
 * 写真の明るさ（{画素, 幅, 高}）を、幅 1600 に平均で縮めて明暗を伸ばす。逆さ なら 180 度回す。
 * 縦長の写真は短い辺を 1201 にする（横長の 1600×1201 と同じ大きさの字になるように）
 */
export function 写真を整える(元, 逆さ = false) {
  const 縦長 = 元.高 > 元.幅;
  const 倍 = Math.min(1, 縦長 ? 1201 / 元.幅 : ノートの幅 / 元.幅);
  const W = Math.max(1, Math.round(元.幅 * 倍));
  const H = Math.max(1, Math.round(元.高 * 倍));
  let 画素;
  if (倍 >= 1) 画素 = Uint8Array.from(元.画素);
  else {
    // 面積の平均（箱）で縮める
    画素 = new Uint8Array(W * H);
    const sx = 元.幅 / W, sy = 元.高 / H;
    for (let y = 0; y < H; y++) {
      const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
      for (let x = 0; x < W; x++) {
        const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
        let 和 = 0;
        for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) 和 += 元.画素[yy * 元.幅 + xx];
        画素[y * W + x] = Math.round(和 / ((y1 - y0) * (x1 - x0)));
      }
    }
  }
  if (逆さ) 画素.reverse();
  return { 画素: 明暗を伸ばす(画素), 幅: W, 高: H };
}

function 平均の画(画素, W, H, 半) {
  const 積 = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let 行 = 0;
    for (let x = 0; x < W; x++) {
      行 += 画素[y * W + x];
      積[(y + 1) * (W + 1) + x + 1] = 積[y * (W + 1) + x + 1] + 行;
    }
  }
  const 出 = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - 半), y1 = Math.min(H, y + 半 + 1);
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - 半), x1 = Math.min(W, x + 半 + 1);
      出[y * W + x] = (積[y1 * (W + 1) + x1] - 積[y0 * (W + 1) + x1] - 積[y1 * (W + 1) + x0] + 積[y0 * (W + 1) + x0]) / ((y1 - y0) * (x1 - x0));
    }
  }
  return 出;
}

function 二次の当てはめ(xs, ys) {
  const n = xs.length;
  if (n < 3) {
    const b = n === 2 ? (ys[1] - ys[0]) / (xs[1] - xs[0] || 1) : 48;
    return [ys[0] - b * xs[0], b, 0];
  }
  const s = [0, 0, 0, 0, 0], t = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    let p = 1;
    for (let k = 0; k < 5; k++) {
      s[k] += p;
      if (k < 3) t[k] += p * ys[i];
      p *= xs[i];
    }
  }
  const M = [[s[0], s[1], s[2], t[0]], [s[1], s[2], s[3], t[1]], [s[2], s[3], s[4], t[2]]];
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    if (Math.abs(M[c][c]) < 1e-12) return [ys[0], 48, 0];
    for (let r = 0; r < 3; r++) if (r !== c) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k];
    }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
}

/**
 * 罫線とかたまりの線。返す 縦線 は真ん中の高さでの x（左から）、横線 は真ん中の幅での y（上から）、
 * ずらし[かたまり] = { 上, 下 }（縦線ごとのずらし px）、交点(m, n)
 */
export async function ノートの格子(生) {
  const { 画素, 幅: W, 高: H } = 生;
  const 平 = 平均の画(画素, W, H, 10);
  const 縦尾根 = new Uint8Array(W * H), 横尾根 = new Uint8Array(W * H), 濃 = new Uint8Array(W * H);
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    const i = y * W + x, v = 画素[i];
    if (平[i] - v > 55) 濃[i] = 1;
    if (Math.min(画素[i - 3], 画素[i + 3]) - v >= 4) 縦尾根[i] = 1;
    if (Math.min(画素[i - 3 * W], 画素[i + 3 * W]) - v >= 4) 横尾根[i] = 1;
  }
  // 印の濃い墨とそのまわり 1px。縦の罫線は印の外で数える
  const 印の中 = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!濃[y * W + x]) continue;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= H) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        if (xx >= 0 && xx < W) 印の中[yy * W + xx] = 1;
      }
    }
  }
  await 息継ぎ();
  // 何 '縦'：x = m + (y − H/2)·t。'横'：y = m + (x − W/2)·t。全部 … 印の中も数える（かたまりの線は印の間を通る）
  const 長さ = (何) => (何 === '縦' ? W : H), 向こう = (何) => (何 === '縦' ? H : W);
  const 添字 = (何, u, v) => (何 === '縦' ? v * W + u : u * W + v);
  async function 候補(何, 度幅, 刻み, 閾, 全部) {
    const 長 = 長さ(何), 向 = 向こう(何), 尾根 = 何 === '縦' ? 縦尾根 : 横尾根, 真 = 向 / 2;
    const 出 = [];
    for (let d = -度幅; d <= 度幅 + 1e-9; d += 刻み) {
      const t = Math.tan((d * Math.PI) / 180);
      const 余白 = Math.ceil(向 * Math.abs(t)) + 2;
      const 線 = new Float32Array(長 + 余白 * 2), 紙 = new Float32Array(長 + 余白 * 2);
      for (let v = 0; v < 向; v += 2) for (let u = 0; u < 長; u++) {
        const i = 添字(何, u, v);
        if (!全部 && 印の中[i]) continue;
        const p = Math.round(u - (v - 真) * t) + 余白;
        if (p < 0 || p >= 線.length) continue;
        紙[p]++;
        if (尾根[i]) 線[p]++;
      }
      for (let p = 0; p < 線.length; p++) if (紙[p] > (向 / 2) * 0.15 && 線[p] / 紙[p] >= 閾) 出.push({ m: p - 余白, t, 支え: 線[p] / 紙[p] });
      await 息継ぎ();
    }
    // 同じ線が隣の角度・隣の位置でも候補になる。いちばん支えの強いものだけ残す
    const 残す = [];
    for (const l of 出.sort((a, b) => b.支え - a.支え)) {
      if (残す.some((o) => Math.abs(o.m - l.m) < 10)) continue;
      残す.push(l);
    }
    return 残す;
  }
  // 傾きは位置に比例して変わる（遠近）：t = t0 + k·m。重みつきの当てはめ（乱数は決まった種。Node とブラウザで同じ答え）
  function 傾きの式(候補たち) {
    let 最良 = null;
    const n = 候補たち.length;
    let 種 = 12345;
    const 乱 = () => (種 = (種 * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let r = 0; r < 3000 && n >= 2; r++) {
      const a = 候補たち[(乱() * n) | 0], b = 候補たち[(乱() * n) | 0];
      if (Math.abs(a.m - b.m) < 30) continue;
      const k = (a.t - b.t) / (a.m - b.m), t0 = a.t - k * a.m;
      let 点 = 0;
      for (const l of 候補たち) if (Math.abs(l.t - (t0 + k * l.m)) < 0.006) 点 += l.支え;
      if (!最良 || 点 > 最良.点) 最良 = { t0, k, 点 };
    }
    if (!最良) return n ? { t0: 候補たち[0].t, k: 0 } : { t0: 0, k: 0 };
    const 乗 = 候補たち.filter((l) => Math.abs(l.t - (最良.t0 + 最良.k * l.m)) < 0.006);
    let sw = 0, sm = 0, st = 0, smm = 0, smt = 0;
    for (const l of 乗) {
      const w = l.支え;
      sw += w; sm += w * l.m; st += w * l.t; smm += w * l.m * l.m; smt += w * l.m * l.t;
    }
    const k = sw * smm - sm * sm > 1e-9 ? (sw * smt - sm * st) / (sw * smm - sm * sm) : 0;
    const ms = 乗.map((l) => l.m);
    return { t0: (st - k * sm) / sw, k, 小: Math.min(...ms), 大: Math.max(...ms) };
  }
  // 当てはめた範囲の外では傾きを伸ばさない
  const 傾き = (式, m) => 式.t0 + 式.k * (式.小 == null ? m : Math.min(式.大, Math.max(式.小, m)));
  async function 支えの並び(何, 式, 全部) {
    const 長 = 長さ(何), 向 = 向こう(何), 尾根 = 何 === '縦' ? 縦尾根 : 横尾根, 真 = 向 / 2;
    const 支え = new Float32Array(長);
    for (let m = 0; m < 長; m++) {
      const t = 傾き(式, m);
      let 線 = 0, 紙 = 0;
      for (let v = 0; v < 向; v += 2) {
        const u = Math.round(m + (v - 真) * t);
        if (u < 0 || u >= 長) continue;
        const i = 添字(何, u, v);
        if (!全部 && 印の中[i]) continue;
        紙++;
        if (尾根[i]) 線++;
      }
      支え[m] = 紙 > (向 / 2) * 0.1 ? 線 / 紙 : 0;
      if ((m & 63) === 0) await 息継ぎ();
    }
    return 支え;
  }
  const 山 = (並び, 幅, 閾) => {
    const 出 = [];
    for (let i = 0; i < 並び.length; i++) {
      if (並び[i] < 閾) continue;
      let 最 = true;
      for (let j = Math.max(0, i - 幅); j <= Math.min(並び.length - 1, i + 幅); j++) {
        if (並び[j] > 並び[i] || (並び[j] === 並び[i] && j < i)) {
          最 = false;
          break;
        }
      }
      if (最) 出.push(i);
    }
    return 出;
  };

  // ── 縦の罫線（列の境）。等間隔の櫛（位置の二次式）に当てはめ、印で隠れた線を埋める ──
  const 縦の式 = 傾きの式(await 候補('縦', 14, 0.25, 0.35, false));
  const 縦の支え = await 支えの並び('縦', 縦の式, false);
  const 縦の山 = 山(縦の支え, 12, 0.3);
  const 差たち = 縦の山.slice(1).map((x, i) => x - 縦の山[i]).filter((d) => d > 25 && d < 90).sort((a, b) => a - b);
  const 間 = 差たち.length ? 差たち[差たち.length >> 1] : 48;
  let 番 = 0;
  const 番つき = 縦の山.map((m, i) => {
    if (i) 番 += Math.max(1, Math.round((m - 縦の山[i - 1]) / 間));
    return { m, 番 };
  });
  let 係 = [縦の山[0] || 0, 間, 0];
  let 使う = 番つき;
  for (let 回 = 0; 回 < 4 && 使う.length; 回++) {
    係 = 二次の当てはめ(使う.map((p) => p.番), 使う.map((p) => p.m));
    使う = 番つき.filter((p) => Math.abs(p.m - (係[0] + 係[1] * p.番 + 係[2] * p.番 * p.番)) < 間 * 0.2);
    if (使う.length < 3) break;
  }
  const 予 = (n) => 係[0] + 係[1] * n + 係[2] * n * n;
  const 縦線 = [];
  for (let n = -80; n <= 120; n++) {
    const m0 = 予(n);
    if (m0 < -間 || m0 > W + 間) continue;
    let 最 = m0, 最支 = -1;
    for (let m = Math.round(m0 - 間 * 0.25); m <= Math.round(m0 + 間 * 0.25); m++) {
      if (m >= 0 && m < W && 縦の支え[m] > 最支) {
        最支 = 縦の支え[m];
        最 = m;
      }
    }
    縦線.push(最支 >= 0.3 ? 最 : m0);
  }
  縦線.sort((a, b) => a - b);

  // ── かたまりの線：横の山のうち濃い（手で引いた）線で、間隔がなめらかに変わる（遠近で少しずつ広がる）いちばん長い並び。
  // かたまりの高さは 4 射ぶん（列の間隔のおよそ 2.4〜6 倍）。名前の下の線など、間隔が急に変わるものは並びから外れる
  const 横の式 = 傾きの式(await 候補('横', 5, 0.25, 0.25, true));
  const 横の支え = await 支えの並び('横', 横の式, true);
  const 横の山 = 山(横の支え, 20, 0.3);
  const 濃さ = 横の山.map((n) => {
    const t = 傾き(横の式, n);
    const 差 = [];
    for (let x = 0; x < W; x += 2) {
      let 最 = 0;
      for (let dy = -2; dy <= 2; dy++) {
        const y = Math.round(n + (x - W / 2) * t) + dy;
        if (y < 0 || y >= H) continue;
        const i = y * W + x;
        最 = Math.max(最, 平[i] - 画素[i]);
      }
      差.push(最);
    }
    差.sort((a, b) => a - b);
    return 差.length ? 差[差.length >> 1] : 0;
  });
  // 濃さ 11 以上。手で引いた線は 14〜（鉛筆の薄い線は 14〜29）、ノートの印刷の横罫は 0〜8。15 にしていたころは、
  // 縮め方の違い（回してから縮めるか、縮めてから回すか）だけで 17 → 14 になって線が抜け、帯が 1 つになった（115538301）
  const 候補線 = 横の山.map((n, i) => ({ n, 濃: 濃さ[i] })).filter((c) => c.濃 >= 11);
  const 最小 = 間 * 2.4, 最大 = 間 * 6;
  const k = 候補線.length;
  const 良 = Array.from({ length: k }, () => new Float64Array(k).fill(-1));
  const 前 = Array.from({ length: k }, () => new Int16Array(k).fill(-1));
  for (let j = 0; j < k; j++) for (let i = 0; i < j; i++) {
    const d = 候補線[j].n - 候補線[i].n;
    if (d < 最小 || d > 最大) continue;
    良[i][j] = 2 + (候補線[i].濃 + 候補線[j].濃) / 100;
    for (let h = 0; h < i; h++) {
      if (良[h][i] < 0) continue;
      const 比 = d / (候補線[i].n - 候補線[h].n);
      if (比 < 0.85 || 比 > 1.2) continue;
      const v = 良[h][i] + 1 + 候補線[j].濃 / 100;
      if (v > 良[i][j]) {
        良[i][j] = v;
        前[i][j] = h;
      }
    }
  }
  let 最i = -1, 最j = -1, 最v = -1;
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (良[i][j] > 最v) (最v = 良[i][j]), (最i = i), (最j = j);
  const 選んだ = [];
  if (最j >= 0) {
    let i = 最i, j = 最j;
    選んだ.push(j);
    while (i >= 0) {
      選んだ.push(i);
      const h = 前[i][j];
      j = i;
      i = h;
    }
  }
  const 横線 = 選んだ.reverse().map((x) => 候補線[x].n);
  await 息継ぎ();

  // ── かたまりの上半分・下半分ごとに、縦線を少しずらす（紙がたわむと、まっすぐの線は端で列からずれる）。
  // 線の支え（印の外の尾根の割合）が大きく、隣の線のずらしと近いもの（動的計画法）
  const 範 = Math.round(間 * 0.4);
  function 帯のずらし(j, fa, fb) {
    const 上n = 横線[j], 下n = 横線[j + 1];
    const 点 = 縦線.map((m) => {
      const t = 傾き(縦の式, m);
      const 列 = new Float32Array(範 * 2 + 1);
      for (let d = -範; d <= 範; d++) {
        let 線 = 0, 紙 = 0;
        const x0 = m + d;
        const ya = 上n + (x0 - W / 2) * 傾き(横の式, 上n), yb = 下n + (x0 - W / 2) * 傾き(横の式, 下n);
        const yA = ya + (yb - ya) * fa, yB = ya + (yb - ya) * fb;
        for (let y = Math.max(0, Math.round(yA) + 3); y < Math.min(H, Math.round(yB) - 2); y++) {
          const x = Math.round(x0 + (y - H / 2) * t);
          if (x < 0 || x >= W) continue;
          const i = y * W + x;
          if (印の中[i]) continue;
          紙++;
          if (縦尾根[i]) 線++;
        }
        列[d + 範] = 紙 >= 5 ? 線 / 紙 - 0.15 : 0;
      }
      return 列;
    });
    const λ = 0.02, n = 縦線.length, K = 範 * 2 + 1;
    const 最 = 点.map(() => new Float32Array(K)), 元 = 点.map(() => new Int16Array(K));
    for (let q = 0; q < K; q++) 最[0][q] = 点[0][q] - 0.002 * Math.abs(q - 範);
    for (let i = 1; i < n; i++) for (let q = 0; q < K; q++) {
      let 良v = -1e9, 良q = 0;
      for (let q2 = 0; q2 < K; q2++) {
        const v = 最[i - 1][q2] - λ * Math.abs(q - q2);
        if (v > 良v) (良v = v), (良q = q2);
      }
      最[i][q] = 良v + 点[i][q] - 0.002 * Math.abs(q - 範);
      元[i][q] = 良q;
    }
    let q = 0;
    for (let q2 = 1; q2 < K; q2++) if (最[n - 1][q2] > 最[n - 1][q]) q = q2;
    const δ = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      δ[i] = q - 範;
      q = 元[i][q];
    }
    return δ;
  }
  const ずらし = [];
  for (let j = 0; j + 1 < 横線.length; j++) {
    ずらし.push({ 上: 帯のずらし(j, 0, 0.5), 下: 帯のずらし(j, 0.5, 1) });
    await 息継ぎ();
  }
  const 縦の傾き = (m) => 傾き(縦の式, m);
  const 横の傾き = (m) => 傾き(横の式, m);
  const 交点 = (m, n) => {
    const tv = 縦の傾き(m), th = 横の傾き(n);
    const y = (n + (m - (H / 2) * tv - W / 2) * th) / (1 - tv * th);
    return [m + (y - H / 2) * tv, y];
  };
  return { 縦線, 横線, 縦の傾き, 横の傾き, 交点, 間, ずらし };
}

/** マスたち：かたまり（帯）× 列 × 4 段。段は上から 0〜3 */
export function ノートのマスたち(格) {
  const 出 = [];
  for (let j = 0; j + 1 < 格.横線.length; j++) {
    const z = 格.ずらし[j];
    for (let i = 0; i + 1 < 格.縦線.length; i++) {
      for (let r = 0; r < 4; r++) {
        const f = (r + 0.5) / 4;
        // 上半分のずらしは高さ 1/4、下半分は 3/4 のもの。その間をつなぐ
        const w = Math.min(1, Math.max(0, (f - 0.25) / 0.5));
        const L = 格.縦線[i] + z.上[i] * (1 - w) + z.下[i] * w;
        const R = 格.縦線[i + 1] + z.上[i + 1] * (1 - w) + z.下[i + 1] * w;
        const a = 格.交点(L, 格.横線[j]), b = 格.交点(R, 格.横線[j]), c = 格.交点(L, 格.横線[j + 1]), d = 格.交点(R, 格.横線[j + 1]);
        const 左x = a[0] + (c[0] - a[0]) * f, 右x = b[0] + (d[0] - b[0]) * f;
        const 左y = a[1] + (c[1] - a[1]) * f, 右y = b[1] + (d[1] - b[1]) * f;
        出.push({ 帯: j, 列: i, 段: r, x: (左x + 右x) / 2, y: (左y + 右y) / 2, 幅: 右x - 左x, 高: (c[1] - a[1] + (d[1] - b[1])) / 8 });
      }
    }
  }
  return 出;
}

/** (x, y) を真ん中に 幅×高 で切る。画の外は白 */
export function 真ん中で切る(生, x, y, 幅, 高) {
  const 左 = Math.round(x - 幅 / 2), 上 = Math.round(y - 高 / 2), w = Math.max(1, Math.round(幅)), h = Math.max(1, Math.round(高));
  const 画 = new Uint8Array(w * h).fill(255);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const sx = 左 + xx, sy = 上 + yy;
    if (sx >= 0 && sy >= 0 && sx < 生.幅 && sy < 生.高) 画[yy * w + xx] = 生.画素[sy * 生.幅 + sx];
  }
  return { 画, 幅: w, 高: h };
}

/**
 * マスの見立て。p … ○ と × のうちの ○ の割合（印が無ければ null）。他 … 字・数字・訂正。
 * 墨は紙（切り抜きの明るいほうから 1 割）より 45 暗い画素
 */
export function ノートのマスを見る(生, m, 網) {
  const 切 = 真ん中で切る(生, m.x, m.y, m.幅 * 0.92, m.高);
  const v = Array.from(切.画).sort((a, b) => a - b);
  const 紙 = v[Math.floor(v.length * 0.9)];
  let 墨 = 0, n = 0, 上 = 1e9, 下 = -1, 左 = 1e9, 右 = -1;
  for (let y = 0; y < 切.高; y++) for (let x = 0; x < 切.幅; x++) {
    const d = 紙 - 切.画[y * 切.幅 + x];
    const 内 = y >= 切.高 * 0.1 && y < 切.高 * 0.9 && x >= 切.幅 * 0.1 && x < 切.幅 * 0.9;
    if (内) n++;
    if (d > 45) {
      if (内) 墨++;
      上 = Math.min(上, y); 下 = Math.max(下, y); 左 = Math.min(左, x); 右 = Math.max(右, x);
    }
  }
  const 割合 = n ? 墨 / n : 0;
  const 見 = { ...m, p: null, 他: false };
  const 箱高 = 下 >= 上 ? (下 - 上 + 1) / 切.高 : 0, 箱幅 = 右 >= 左 ? (右 - 左 + 1) / 切.幅 : 0;
  // マスより大きな ○：内側は空なのに、輪がマスの上下左右の辺の真ん中を横切る（× の腕は角にしか来ない）。広めに切って見分ける
  if (割合 < 0.04 && 紙 >= 140) {
    const 広 = 真ん中で切る(生, m.x, m.y, m.幅 * 1.5, m.高 * 1.5);
    const W = 広.幅, H = 広.高;
    const 辺の墨 = (x0, y0, x1, y1) => {
      let c = 0, k = 0;
      for (let y = Math.round(y0); y < y1; y++) for (let x = Math.round(x0); x < x1; x++) {
        c++;
        if (紙 - 広.画[y * W + x] > 45) k++;
      }
      return c ? k / c : 0;
    };
    const a = W / 6, b = H / 6, dw = W * 0.12, dh = H * 0.12;
    const 辺 = [
      辺の墨(W * 0.3, b - dh, W * 0.7, b + dh),
      辺の墨(W * 0.3, H - b - dh, W * 0.7, H - b + dh),
      辺の墨(a - dw, H * 0.3, a + dw, H * 0.7),
      辺の墨(W - a - dw, H * 0.3, W - a + dw, H * 0.7),
    ];
    if (Math.min(...辺) > 0.03) {
      const 切2 = 真ん中で切る(生, m.x, m.y, m.幅 * 1.35, m.高 * 1.35);
      const q = 畳みで見分ける(網, 切2.画, 切2.幅, 切2.高);
      if (q[1] > Math.max(q[0], q[2] || 0)) 見.p = q[1] / Math.max(1e-6, q[0] + q[1]);
    }
    return 見;
  }
  if (割合 >= 0.04 && 紙 >= 140 && 割合 <= 0.6 && 箱幅 >= 0.4 && 箱高 >= 0.4) {
    const q = 畳みで見分ける(網, 切.画, 切.幅, 切.高);
    if (q.length >= 3 && q[2] > Math.max(q[0], q[1])) 見.他 = true;
    見.p = q[1] / Math.max(1e-6, q[0] + q[1]);
  }
  return 見;
}

/**
 * 薄い印（鉛筆）の ○ の割合。墨の境を 45 から 25 に下げ、内側に 3% 以上あれば網に見せる。字（他）か墨が無ければ null
 */
function 薄い印を見る(生, m, 網) {
  const 切 = 真ん中で切る(生, m.x, m.y, m.幅 * 0.92, m.高);
  const v = Array.from(切.画).sort((a, b) => a - b);
  const 紙 = v[Math.floor(v.length * 0.9)];
  let 墨 = 0, n = 0;
  for (let y = Math.floor(切.高 * 0.1); y < 切.高 * 0.9; y++) for (let x = Math.floor(切.幅 * 0.1); x < 切.幅 * 0.9; x++) {
    n++;
    if (紙 - 切.画[y * 切.幅 + x] > 25) 墨++;
  }
  if (!n || 墨 / n < 0.03) return null;
  const q = 畳みで見分ける(網, 切.画, 切.幅, 切.高);
  if (q.length >= 3 && q[2] > Math.max(q[0], q[1])) return null;
  return q[1] / Math.max(1e-6, q[0] + q[1]);
}

/**
 * ノートを読む。返す 列たち は射手の筋（写真の左から）。射 は 1 射目（いちばん下）から上へ '○' | '×' | ''、
 * 確 はその確からしさ（他は 0.5）
 * @param {{画素:Uint8Array, 幅:number, 高:number}} 生 写真を整える の返り
 * @param {object} 網 畳みの網を組む の返り（noto-tatami.json）
 */
export async function ノートを読む(生, 網) {
  const 格 = await ノートの格子(生);
  const 帯数 = 格.横線.length - 1;
  if (帯数 < 1) return { 列たち: [], 帯数: 0, 幅: 生.幅, 間: 格.間 };
  const マス = ノートのマスたち(格);
  const 見たち = [];
  for (let i = 0; i < マス.length; i++) {
    見たち.push(ノートのマスを見る(生, マス[i], 網));
    if ((i & 15) === 0) await 息継ぎ();
  }
  const 引く = new Map(見たち.map((q) => [q.帯 + ',' + q.列 + ',' + q.段, q]));
  // かたまりごとの印らしさ。印が 3 つ以上で、確か（0.9）が 6 割以上なら良い
  const 帯の点 = [];
  for (let j = 0; j < 帯数; j++) {
    const 印 = 見たち.filter((q) => q.帯 === j && q.p != null);
    const 確 = 印.filter((q) => Math.max(q.p, 1 - q.p) > 0.9).length;
    帯の点.push({ 確, 良: 印.length >= 3 && 確 / 印.length >= 0.6 });
  }
  // 良いかたまりの続きのうち、確かな印がいちばん多いものを本体にする
  let 本体 = [0, 0], 最点 = -1;
  for (let a = 0; a < 帯数; a++) {
    if (!帯の点[a].良) continue;
    let b = a, 点 = 0;
    while (b < 帯数 && 帯の点[b].良) 点 += 帯の点[b++].確;
    if (点 > 最点) (最点 = 点), (本体 = [a, b]);
  }
  const [a, b] = 本体;
  const 列数 = 格.縦線.length - 1;
  const 間 = 格.間;
  // かたまりごとに、印のある罫の列（4 マスのうち印が 2 つ以上・確か 0.8 が 1 つ以上）
  const 帯の列 = [];
  for (let j = a; j < b; j++) {
    const 出 = [];
    for (let i = 0; i < 列数; i++) {
      const 四 = [0, 1, 2, 3].map((r) => 引く.get(j + ',' + i + ',' + r));
      const 印 = 四.filter((q) => q && q.p != null);
      const 確 = 印.filter((q) => Math.max(q.p, 1 - q.p) > 0.8).length;
      if (印.length >= 2 && 確 >= 1) 出.push({ x: 四.reduce((s, q) => s + (q ? q.x : 0), 0) / 4, 列: i, 四 });
    }
    帯の列.push(出);
  }
  // 下のかたまりから上へ、列を人の筋につなぐ。ずれは 1 列まで・左右の順は崩さない（並びの合わせ）
  const 筋たち = [];
  let 前 = [];
  for (let jj = b - 1; jj >= a; jj--) {
    const 今 = 帯の列[jj - a];
    const n = 前.length, m = 今.length;
    const 費 = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
    const 元 = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
    const 外す = 間 * 0.9;
    for (let x = 1; x <= n; x++) (費[x][0] = x * 外す), (元[x][0] = 1);
    for (let y = 1; y <= m; y++) (費[0][y] = y * 外す), (元[0][y] = 2);
    for (let x = 1; x <= n; x++) for (let y = 1; y <= m; y++) {
      // 罫の列の番号で比べる。x で比べると、斜めに撮った写真では同じ罫の列がかたまりごとに 0.7 列ほど横へずれ、
      // 隣の列のほうが近くなる（10/11 の 115021007 で右の組の上のかたまりが 1 人ずつずれた）
      const d = Math.abs(前[x - 1].列 - 今[y - 1].列) * 間;
      const 合 = d <= 間 * 1.3 ? 費[x - 1][y - 1] + d : 1e9;
      const 上 = 費[x - 1][y] + 外す, 左 = 費[x][y - 1] + 外す;
      if (合 <= 上 && 合 <= 左) (費[x][y] = 合), (元[x][y] = 0);
      else if (上 <= 左) (費[x][y] = 上), (元[x][y] = 1);
      else (費[x][y] = 左), (元[x][y] = 2);
    }
    const 組 = [];
    let x = n, y = m;
    while (x > 0 || y > 0) {
      if (x > 0 && y > 0 && 元[x][y] === 0) 組.push([--x, --y]);
      else if (x > 0 && (y === 0 || 元[x][y] === 1)) x--;
      else 組.push([-1, --y]);
    }
    const 次 = [];
    for (const [pi, ci] of 組.reverse()) {
      const c = 今[ci];
      let 筋;
      if (pi >= 0) 筋 = 前[pi].筋;
      else {
        筋 = new Map();
        筋たち.push(筋);
      }
      筋.set(jj, c);
      次.push({ x: c.x, 列: c.列, 筋 });
    }
    // 今のかたまりに無かった筋も、上のかたまりで続くことがある。x はそのまま持ち越す
    for (const p0 of 前) if (!次.some((q) => q.筋 === p0.筋)) 次.push(p0);
    次.sort((u, v) => u.列 - v.列);
    前 = 次;
  }
  const 列たち = [];
  const 使った = new Set();
  for (const 筋 of 筋たち) for (const [j, c] of 筋) 使った.add(j + ',' + c.列);
  for (const 筋 of 筋たち) {
    const 射 = [];
    // 筋の途中で抜けたかたまり（上下のかたまりには筋がある）：薄い鉛筆で書いたかたまりは列として拾えない。
    // 下のかたまりと同じ罫の列の 4 マスを薄い墨でも見て、印が 2 つ以上なら入れる（迷ったマス）
    const 補った = new Set();
    const 筋のj = [...筋.keys()];
    for (let j = b - 1; j >= a; j--) {
      let c = 筋.get(j);
      if (!c && j > Math.min(...筋のj) && j < Math.max(...筋のj)) {
        let 下j = j + 1;
        while (!筋.has(下j)) 下j++;
        const 列 = 筋.get(下j).列;
        if (!使った.has(j + ',' + 列)) {
          const 四 = [0, 1, 2, 3].map((r) => {
            const q = 引く.get(j + ',' + 列 + ',' + r);
            return q && { ...q, p: q.p != null && !q.他 ? q.p : 薄い印を見る(生, q, 網), 他: false };
          });
          if (四.filter((q) => q && q.p != null).length >= 2) {
            c = { 四 };
            for (let r = 0; r < 4; r++) 補った.add(射.length + r);
          }
        }
      }
      for (let r = 3; r >= 0; r--) 射.push(c ? c.四[r] : null);
    }
    // 本体より上のかたまり：一部の組だけが引き続けたかたまりは、ほかの列のところに計の分数（4/8 など）が並び、
    // 確かな印の割合が 6 割を切って本体に入らない（114943071）。本体のいちばん上と同じ罫の列の 4 マスに、
    // 字でない印が 3 つ以上（確か 0.8 が 2 つ以上・字は 1 つまで）あれば、筋を上へ延ばす
    if (筋.has(a)) {
      const 列 = 筋.get(a).列;
      for (let j = a - 1; j >= 0; j--) {
        const 四 = [0, 1, 2, 3].map((r) => 引く.get(j + ',' + 列 + ',' + r));
        const 印4 = 四.filter((q) => q && q.p != null && !q.他);
        if (印4.length < 3 || 印4.filter((q) => Math.max(q.p, 1 - q.p) > 0.8).length < 2) break;
        if (四.filter((q) => q && q.他).length > 1) break;
        for (let r = 3; r >= 0; r--) 射.push(四[r]);
      }
    }
    const 印 = 射.filter((q) => q && q.p != null);
    if (印.filter((q) => Math.max(q.p, 1 - q.p) > 0.9).length < 3) continue;
    // 字の列（縦書きの日付「4月9日(火)」や小計の数字が、罫の列に入っている）：他 が 2 つ以上・印の 4 分の 1 以上
    const 他の数 = 印.filter((q) => q.他).length;
    if (他の数 >= 2 && 他の数 >= 印.length * 0.25) continue;
    // 上の数字：いちばん上の印が、かたまりのいちばん下のマスにだけあり（上の 3 つが空）、その下が埋まっていれば外す
    let 最上 = -1;
    for (let k2 = 射.length - 1; k2 >= 0; k2--) if (射[k2] && 射[k2].p != null) {
      最上 = k2;
      break;
    }
    if (最上 >= 4 && 最上 % 4 === 0) {
      const 上の3 = [1, 2, 3].every((d) => !射[最上 + d] || 射[最上 + d].p == null);
      const 下の4 = [1, 2, 3, 4].every((d) => 射[最上 - d] && 射[最上 - d].p != null);
      if (上の3 && 下の4) 射[最上] = { ...射[最上], p: null };
    }
    // 他（字・数字・訂正）：筋の上の端（計の数字）なら外し、ほかは迷ったマス（確認画面で黄色）。
    // 下の端の他は 103 枚で 17 マス、ほとんどが ○ に「当」と書き足した訂正だった（10/11）。上の端は 102 マスの大半が計の数字
    const 印の番 = 射.map((q, k2) => (q && q.p != null ? k2 : -1)).filter((k2) => k2 >= 0);
    for (const k2 of 印の番.slice().reverse()) {
      if (!射[k2] || 射[k2].p == null) continue;
      if (射[k2].他) 射[k2] = { ...射[k2], p: null };
      else break;
    }
    // 筋の中の空き（同じかたまりに印があるのに空のマス）。1 射も飛ばさないので、薄い鉛筆の印を見落としたことが多い
    // （115353708 の右の組）。薄い墨でも網に見せて ○× を推し、空でも当てても迷ったマス（確認画面で黄色）にする
    const 番 = 射.map((q, k2) => (q && q.p != null ? k2 : -1)).filter((k2) => k2 >= 0);
    const 空き = new Set();
    for (let k2 = 番.length ? 番[0] + 1 : 0; 番.length && k2 < 番[番.length - 1]; k2++) {
      const q = 射[k2];
      if (!q || q.p != null) continue;
      const 頭 = k2 - (k2 % 4);
      if (![0, 1, 2, 3].some((d) => 射[頭 + d] && 射[頭 + d].p != null)) continue;
      射[k2] = { ...q, p: 薄い印を見る(生, q, 網), 他: false };
      空き.add(k2);
    }
    const 底 = 射.find(Boolean);
    列たち.push({
      x: 底 ? 底.x : 0,
      射: 射.map((q) => (q && q.p != null ? (q.p > 0.5 ? '○' : '×') : '')),
      // 8 割に満たない印も迷ったマスにする（115538301 で 0.63・0.71 の読み違い。103 枚で 1 枚 2 マスほど増える）
      確: 射.map((q, k2) => (空き.has(k2) || 補った.has(k2) ? 0.5 : q && q.p != null ? (q.他 || Math.max(q.p, 1 - q.p) < 0.8 ? 0.5 : Math.max(q.p, 1 - q.p)) : 1)),
    });
  }
  列たち.sort((u, v) => u.x - v.x);
  return { 列たち, 帯数: b - a, 幅: 生.幅, 間 };
}

/**
 * 向きの手がかり：いちばん下のかたまりの下（名前が並ぶ）と、いちばん上のかたまりの上（数字だけ）の墨を比べる。
 * 下のほうが多ければ正しい向き。ページの絵（10/10 の 103 枚）で 87 枚当たった。当てにしすぎない（AI の読みとも比べる）
 */
export async function 下に名前があるか(生, 格) {
  格 = 格 || (await ノートの格子(生));
  if (格.横線.length < 2) return null;
  const { 画素, 幅: W, 高: H } = 生;
  const 上n = 格.横線[0], 下n = 格.横線[格.横線.length - 1];
  const 帯高 = (下n - 上n) / (格.横線.length - 1);
  const 数える = (線, 向き) => {
    const t = 格.横の傾き(線);
    let n = 0, 墨 = 0;
    for (let x = 0; x < W; x += 2) {
      const y線 = 線 + (x - W / 2) * t;
      for (let k = 6; k < 帯高 * 0.6; k += 2) {
        const y = Math.round(y線 + 向き * k);
        if (y < 1 || y >= H - 1 || x < 8 || x >= W - 8) continue;
        n++;
        const i = y * W + x;
        if ((画素[i - 8] + 画素[i + 8]) / 2 - 画素[i] > 30 || 画素[i] < 90) 墨++;
      }
    }
    return n ? 墨 / n : 0;
  };
  return 数える(下n, +1) >= 数える(上n, -1);
}

/**
 * 字の切り抜きたち：いちばん下のかたまりの下（名前）と、いちばん上のかたまりの上（的中数の数字）を、罫の列ごとに切る。
 * 墨の少ないもの（何も書いていない）は除く。向きの網（字が正しい向きか）に渡す
 */
export async function 字の切り抜きたち(生, 格) {
  格 = 格 || (await ノートの格子(生));
  if (格.横線.length < 2) return [];
  const 帯高 = (格.横線[格.横線.length - 1] - 格.横線[0]) / (格.横線.length - 1);
  const 出 = [];
  const 場たち = [
    { 場: '下', 線: 格.横線[格.横線.length - 1], 向き: +1, 長さ: 0.9 },
    { 場: '上', 線: 格.横線[0], 向き: -1, 長さ: 0.6 },
  ];
  for (const { 場, 線, 向き, 長さ } of 場たち) {
    for (let i = 0; i + 1 < 格.縦線.length; i++) {
      const a = 格.交点(格.縦線[i], 線), b = 格.交点(格.縦線[i + 1], 線);
      const 幅 = b[0] - a[0];
      if (!(幅 > 10)) continue;
      const 高 = 帯高 * 長さ;
      const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2 + 向き * (帯高 * 0.06 + 高 / 2);
      const 切 = 真ん中で切る(生, x, y, 幅, 高);
      const v = Array.from(切.画).sort((p, q) => p - q);
      const 紙 = v[Math.floor(v.length * 0.9)];
      let 墨 = 0;
      for (const p of 切.画) if (紙 - p > 45) 墨++;
      if (墨 / 切.画.length >= 0.03 && 紙 >= 120) 出.push({ ...切, 場 });
    }
  }
  return 出;
}

/**
 * 写真が正しい向きか。字の切り抜き（下の名前・上の数字）を向きの網（noto-muki.json。字が正しい向きなら「正」）に
 * そのままと 180 度回したものとで読ませ、正しい向きらしさを比べる（10/10 の写真を写真ごとに外して 97/100）。
 * 切り抜きが少ないか差が小さいときは、下に名前が並ぶか（墨の量）で決める。決められなければ null
 * @param {{画素:Uint8Array, 幅:number, 高:number}} 生 写真を整える の返り（回していないもの）
 * @param {object} [向きの網] 畳みの網を組む の返り
 */
export async function ノートは正しい向きか(生, 向きの網) {
  const 格 = await ノートの格子(生);
  if (向きの網) {
    const 切たち = await 字の切り抜きたち(生, 格);
    if (切たち.length >= 4) {
      let そのまま = 0;
      let 回した = 0;
      for (const c of 切たち) {
        そのまま += 畳みで見分ける(向きの網, c.画, c.幅, c.高)[1];
        回した += 畳みで見分ける(向きの網, Uint8Array.from(c.画).reverse(), c.幅, c.高)[1];
        await 息継ぎ();
      }
      const 差 = (そのまま - 回した) / 切たち.length;
      if (Math.abs(差) >= 0.05) return 差 > 0;
    }
  }
  return 下に名前があるか(生, 格);
}
