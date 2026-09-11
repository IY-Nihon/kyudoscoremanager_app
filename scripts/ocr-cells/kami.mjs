/**
 * 紙の記録用紙の格子。
 *
 * ■ 紙の形（関東学生の記録用紙。使う人に聞いた決まり）
 *   ・列は射手。右の列が大前（板の右側と同じ向き）
 *   ・縦に 立数 のかたまり。いちばん下が1立目
 *   ・1つのかたまりは 立のマス（4射なら4）に等分。下のマスが1射目
 *   ・1マス1射。○ か ×
 *   ・列の罫線と、かたまりの罫線は引かれている。かたまりの中の射の境には罫線が無い
 *
 * 罫線があるので、板と同じ「罫線を拾う」で列とかたまりを立て、かたまりの中を等分する。
 *
 * ■ 前提
 * 渡す画は、表の部分（列の罫線からかたまりの罫線まで）を切り抜いたもの。
 * 右に小計の列が写っていても、幅が違うので等間隔の当てはめから外れる。
 */
import { 明暗を伸ばす, 暗さの境 } from './koushi.mjs';
import { 墨の量, 罫線を拾う } from './kiridasu.mjs';
import { 写す式 } from './kuzusu.mjs';

/**
 * @param {{画素:Uint8Array, 幅:number, 高:number}} 元
 * @param {{人数:number, 立数:number, 立のマス:number, 角度?:number}} 注文
 * @returns {{列:{中心:number}[], かたまり:{上:number,下:number}[], マス:{x:number,y:number,幅:number,高:number}[][], 生:object}}
 *   マス[列][射番] … 射番は 0 が1射目（いちばん下のかたまりの、いちばん下）
 */
export async function 紙の格子(元, 注文) {
  let 生 = { 画素: 明暗を伸ばす(元.画素), 幅: 元.幅, 高: 元.高 };
  // 遠近を戻す。斜めから撮ると表が台形になり、等間隔の当てはめが端で外れる
  //（実測で台形0.2の紙が 60/80）。表の外枠の4本の線を角度つきで探し、
  // 四隅を長方形へ写してから格子を立てる。外枠が見つからなければそのまま
  let 正した = null;
  if (注文.正す !== false) {
    正した = 外枠で正す(生);
    if (正した) 生 = 正した;
  }
  // 傾きは画を回さずに扱う。罫線は縦横の墨の量の針で探すので、1.3度傾くだけで
  // 針が鈍り（高さ640pxで14pxばらける）、格子が立たなかった。かといって画を回すと
  // 1pxの罫線がぼけて、0.8度で回した紙が列を1本取り違えた（80/80 → 46/80）。
  // 代わりに、墨を数えるときに y に応じて x をずらす（斜めに足し込む）。
  // 縦線と横線で別々に、いちばん針が鋭くなる傾きを探す
  const 縦線の傾き = 注文.角度 != null ? 注文.角度 : 針が鋭い傾き(生, '縦線');
  const 横線の傾き = 注文.角度 != null ? 注文.角度 : 針が鋭い傾き(生, '横線');
  const 横 = 斜めに数える(生, '縦線', 縦線の傾き);
  const 縦 = 斜めに数える(生, '横線', 横線の傾き);
  // 右に小計の列が写るぶん、列の間隔は 画の幅÷人数 より狭い。狭いほうへ広く探す
  // 外枠で正したあとは、左端の線と上端の線が枠の位置（余白の3px）に在る。
  // 起点をそこに固定すると、「左端を捨てて小計の線を取る」置き方や、
  // 見出しの段を立と取り違える置き方が消える（実測で入れ替わりに落ちていた）
  const 端 = 正した ? [正した.余 - 2, 正した.余 + 2] : undefined;
  const 列 = 罫線を拾う(横, 注文.人数, 生.高, undefined, [0.35, 1.1], true, 端);
  const かたまり = 罫線を拾う(縦, 注文.立数, 生.幅, undefined, [0.5, 1.1], true, 端);
  if (!列) throw new Error('紙の列の罫線が見つかりません');
  if (!かたまり) throw new Error('紙の立の罫線が見つかりません');

  // 斜めに数えた座標は「y=0 での x」「x=0 での y」。マスの中心では傾きぶんを戻す
  const tc = Math.tan((縦線の傾き * Math.PI) / 180);
  const tr = Math.tan((横線の傾き * Math.PI) / 180);
  const マス = [];
  for (let c = 0; c < 注文.人数; c++) {
    const 左0 = 列.位置[c];
    const 右0 = 列.位置[c + 1];
    const この列 = [];
    // 立は下から。かたまりの中も下から
    for (let t = 0; t < 注文.立数; t++) {
      const 上0 = かたまり.位置[注文.立数 - 1 - t];
      const 下0 = かたまり.位置[注文.立数 - t];
      const 一つ = (下0 - 上0) / 注文.立のマス;
      // かたまりの中に罫線は無く、印は縦に積まれているだけなので、等分する。
      // 墨の薄い行へ境を寄せる手も試したが、丸は真ん中の行が薄いので谷が丸の
      // 中心に落ち、80/80 → 71/80 に崩れた。等分のまま、ずれは網に覚えさせる
      for (let r = 0; r < 注文.立のマス; r++) {
        const y0 = 下0 - 一つ * r - 一つ / 2;
        const x0 = (左0 + 右0) / 2;
        const x = x0 + y0 * tc;
        const y = y0 + x * tr;
        この列.push({ x, y, 幅: 右0 - 左0, 高: 一つ });
      }
    }
    マス.push(この列);
  }
  return {
    列: 列.位置.slice(0, -1).map((x, i) => ({ 中心: (x + 列.位置[i + 1]) / 2 })),
    かたまり,
    マス,
    生,
    列の間隔: 列.間隔,
    立の高さ: かたまり.間隔,
    角度: 縦線の傾き,
    横線の傾き,
  };
}

/**
 * 角度つきで線を集める。ink の画素ごとに、角度 θ で y=0（横線なら x=0）へ
 * 延ばした切片に票を入れる。線は (θ, 切片) の山として出る。
 */
export function 線を集める(生, 何, 度の幅, 刻み) {
  const 境 = 暗さの境(生.画素);
  const 長さ = 何 === '縦線' ? 生.幅 : 生.高;
  const 向こう = 何 === '縦線' ? 生.高 : 生.幅;
  // 切片は画の外にも出る（傾いた線）。向こう側の長さ×tan ぶん余白を取る
  const 余白 = Math.ceil(向こう * Math.tan((度の幅 * Math.PI) / 180)) + 2;
  const 角度たち = [];
  for (let 度 = -度の幅; 度 <= 度の幅 + 1e-9; 度 += 刻み) 角度たち.push(度);
  const 票 = 角度たち.map(() => new Float64Array(長さ + 余白 * 2));
  const 傾き = 角度たち.map((d) => Math.tan((d * Math.PI) / 180));
  for (let y = 0; y < 生.高; y++) {
    for (let x = 0; x < 生.幅; x++) {
      if (生.画素[y * 生.幅 + x] >= 境) continue;
      for (let a = 0; a < 角度たち.length; a++) {
        const p = Math.round((何 === '縦線' ? x - y * 傾き[a] : y - x * 傾き[a]) + 余白);
        if (p >= 0 && p < 票[a].length) 票[a][p]++;
      }
    }
  }
  // 山を拾う。まわりの中央値からの飛び出しで測る（板の罫線探しと同じ）
  const 山 = [];
  const 幅 = Math.max(3, Math.round(長さ * 0.03));
  for (let a = 0; a < 角度たち.length; a++) {
    const 並び = 票[a];
    for (let i = 余白; i < 並び.length - 余白; i++) {
      if (並び[i] < 向こう * 0.35) continue;
      let 最 = true;
      for (let j = Math.max(0, i - 幅); j <= Math.min(並び.length - 1, i + 幅); j++) {
        if (並び[j] > 並び[i] || (並び[j] === 並び[i] && j < i)) {
          最 = false;
          break;
        }
      }
      if (最) 山.push({ 度: 角度たち[a], 切片: i - 余白, 高さ: 並び[i] });
    }
  }
  return 山;
}

/**
 * 表の外枠の4本（左右の縦線、上下の横線）から四隅を求め、長方形へ写す。
 * 見つからなければ null。
 */
export function 外枠で正す(生) {
  const 縦 = 線を集める(生, '縦線', 12, 0.5);
  const 横 = 線を集める(生, '横線', 12, 0.5);
  if (縦.length < 2 || 横.length < 2) return null;
  // 同じ線が隣の角度でも山になるので、画の真ん中での位置でまとめ、いちばん高いものを残す
  const まとめる = (山たち, 向こう) => {
    const 出 = [];
    for (const 山 of 山たち.sort((a, z) => z.高さ - a.高さ)) {
      const 真ん中 = 山.切片 + (向こう / 2) * Math.tan((山.度 * Math.PI) / 180);
      if (出.some((o) => Math.abs(o.真ん中 - 真ん中) < 6)) continue;
      出.push({ ...山, 真ん中 });
    }
    return 出;
  };
  const 縦の線 = まとめる(縦, 生.高);
  const 横の線 = まとめる(横, 生.幅);
  if (縦の線.length < 2 || 横の線.length < 2) return null;
  // 外枠は、強い線のうち両端のもの
  const 強い縦 = 縦の線.filter((l) => l.高さ >= 縦の線[0].高さ * 0.4);
  const 強い横 = 横の線.filter((l) => l.高さ >= 横の線[0].高さ * 0.4);
  const 左 = 強い縦.reduce((a, b) => (b.真ん中 < a.真ん中 ? b : a));
  const 右 = 強い縦.reduce((a, b) => (b.真ん中 > a.真ん中 ? b : a));
  const 上 = 強い横.reduce((a, b) => (b.真ん中 < a.真ん中 ? b : a));
  const 下 = 強い横.reduce((a, b) => (b.真ん中 > a.真ん中 ? b : a));
  if (右.真ん中 - 左.真ん中 < 生.幅 * 0.3 || 下.真ん中 - 上.真ん中 < 生.高 * 0.3) return null;

  // 縦線: x = 切片 + y·tanθ、横線: y = 切片 + x·tanφ。交点を解く
  const 交点 = (v, h) => {
    const tv = Math.tan((v.度 * Math.PI) / 180);
    const th = Math.tan((h.度 * Math.PI) / 180);
    const y = (h.切片 + v.切片 * th) / (1 - tv * th);
    const x = v.切片 + y * tv;
    return [x, y];
  };
  const 隅 = [交点(左, 上), 交点(右, 上), 交点(右, 下), 交点(左, 下)];
  const 幅 = Math.round((Math.hypot(隅[1][0] - 隅[0][0], 隅[1][1] - 隅[0][1]) + Math.hypot(隅[2][0] - 隅[3][0], 隅[2][1] - 隅[3][1])) / 2);
  const 高 = Math.round((Math.hypot(隅[3][0] - 隅[0][0], 隅[3][1] - 隅[0][1]) + Math.hypot(隅[2][0] - 隅[1][0], 隅[2][1] - 隅[1][1])) / 2);
  if (幅 < 20 || 高 < 20) return null;
  // 外枠の外にも少し余白を残す（罫線そのものが切れないように）
  const 余 = 3;
  const 戻す = 写す式(
    [[余, 余], [幅 + 余, 余], [幅 + 余, 高 + 余], [余, 高 + 余]],
    隅
  );
  const 出幅 = 幅 + 余 * 2;
  const 出高 = 高 + 余 * 2;
  const 出 = new Uint8Array(出幅 * 出高);
  for (let y = 0; y < 出高; y++) {
    for (let x = 0; x < 出幅; x++) {
      const [sx, sy] = 戻す(x, y);
      if (sx < 0 || sy < 0 || sx > 生.幅 - 1 || sy > 生.高 - 1) {
        出[y * 出幅 + x] = 235;
        continue;
      }
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = Math.min(生.幅 - 1, x0 + 1);
      const y1 = Math.min(生.高 - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const a = 生.画素[y0 * 生.幅 + x0];
      const b = 生.画素[y0 * 生.幅 + x1];
      const c = 生.画素[y1 * 生.幅 + x0];
      const d = 生.画素[y1 * 生.幅 + x1];
      出[y * 出幅 + x] = Math.round(a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy);
    }
  }
  return { 画素: 出, 幅: 出幅, 高: 出高, 隅, 余 };
}

/**
 * 墨の量を斜めに数える。
 * 縦線 … x' = x − y·tanθ ごとに数える（θ だけ傾いた縦線が1本の針になる）
 * 横線 … y' = y − x·tanθ ごとに数える
 */
export function 斜めに数える(生, 何, 度) {
  const t = Math.tan((度 * Math.PI) / 180);
  const 境 = 暗さの境(生.画素);
  const 長さ = 何 === '縦線' ? 生.幅 : 生.高;
  const 出 = new Float64Array(長さ);
  for (let y = 0; y < 生.高; y++) {
    for (let x = 0; x < 生.幅; x++) {
      if (生.画素[y * 生.幅 + x] >= 境) continue;
      const p = Math.round(何 === '縦線' ? x - y * t : y - x * t);
      if (p >= 0 && p < 長さ) 出[p]++;
    }
  }
  return 出;
}

/**
 * 針がいちばん鋭くなる傾き（度）。二乗和がいちばん大きい角度を ±10度で探す。
 * 速さのため、画を半分に間引いて測る（傾きは変わらない）
 */
export function 針が鋭い傾き(生, 何) {
  const 間引き = 生.幅 > 300 ? 2 : 1;
  let 小 = 生;
  if (間引き > 1) {
    const 幅 = Math.floor(生.幅 / 間引き);
    const 高 = Math.floor(生.高 / 間引き);
    const 画素 = new Uint8Array(幅 * 高);
    for (let y = 0; y < 高; y++) for (let x = 0; x < 幅; x++) 画素[y * 幅 + x] = 生.画素[y * 間引き * 生.幅 + x * 間引き];
    小 = { 画素, 幅, 高 };
  }
  let 最良 = 0;
  let 最大 = -1;
  for (let 度 = -10; 度 <= 10; 度 += 0.25) {
    const 並び = 斜めに数える(小, 何, 度);
    let 点 = 0;
    for (const v of 並び) 点 += v * v;
    if (点 > 最大) {
      最大 = 点;
      最良 = 度;
    }
  }
  return 最良;
}

/** 1マスを切る箱。マスより少しだけ小さく（罫線と隣の印を入れない） */
export function 紙の箱(マス) {
  return { 半幅: Math.round(マス.幅 * 0.46), 半高: Math.round(マス.高 * 0.5) };
}
