/**
 * 読んだ印を、板に書かれた的中数と辻褄が合うように直す。
 *
 * ■ なぜできるか
 * 板の上端には、その人の的中数が書いてある。マスの中身は
 *   ◎ = 2中 ／ ○＼ = 1中 ／ ○／ = 1中 ／ × = 0中
 * なので、1列ぶんのマスの中身が決まれば的中数も決まる。逆に、的中数が
 * 分かっていれば、それに合わない読み方は捨てられる。
 *
 * 網は「どれくらい確からしいか」を出すので、的中数の合う読み方のうち
 * いちばん確からしいものを選ぶ。10マス×的中数21通りの表を端から埋めるだけで
 * 求まる（総当たりは 4^10 = 100万通りあるが、表なら 10×21×4 回で済む）。
 *
 * ■ 直せないもの
 * ○＼ と ○／ はどちらも1中なので、この方法では見分けられない。
 * 数字を取り違えることは無い。合う読み方が1つも無ければ、読んだままを返す。
 */

/** 記号ごとの的中数。種類の並びは manabu.mjs の 種類 と同じ */
const 逆 = String.fromCharCode(92);
export const 的中数 = { '×': 0, '◎': 2, ['○' + 逆]: 1, '○/': 1 };

/**
 * @param {Float32Array[]} 見立て 1マスにつき、種類ごとの確からしさ
 * @param {string[]} 種類
 * @param {number} 合計 板に書かれた的中数
 * @returns {{番: number[], 直した: number}} 選んだ種類の番号と、読み直した数
 */
export function 的中数に合わせる(見立て, 種類, 合計) {
  const マス数 = 見立て.length;
  const 点 = 種類.map((s) => 的中数[s]);
  const 上限 = マス数 * 2;
  if (!(合計 >= 0 && 合計 <= 上限)) return { 番: そのまま(見立て), 直した: 0 };

  // 表[i][t] = 先頭i マスで的中t を作るときの、いちばん高い確からしさの積（対数で足す）
  const 無 = -Infinity;
  const 表 = [];
  const 道 = [];
  表.push(new Float64Array(上限 + 1).fill(無));
  表[0][0] = 0;
  for (let i = 0; i < マス数; i++) {
    const 次 = new Float64Array(上限 + 1).fill(無);
    const 選 = new Int8Array(上限 + 1).fill(-1);
    for (let t = 0; t <= 上限; t++) {
      if (表[i][t] === 無) continue;
      for (let k = 0; k < 種類.length; k++) {
        const t2 = t + 点[k];
        if (t2 > 上限) continue;
        const 値 = 表[i][t] + Math.log(Math.max(1e-9, 見立て[i][k]));
        if (値 > 次[t2]) {
          次[t2] = 値;
          選[t2] = k;
        }
      }
    }
    表.push(次);
    道.push(選);
  }
  if (表[マス数][合計] === 無) return { 番: そのまま(見立て), 直した: 0 };

  const 番 = new Array(マス数);
  let t = 合計;
  for (let i = マス数 - 1; i >= 0; i--) {
    const k = 道[i][t];
    番[i] = k;
    t -= 点[k];
  }
  const 元 = そのまま(見立て);
  let 直した = 0;
  for (let i = 0; i < マス数; i++) if (元[i] !== 番[i]) 直した++;
  return { 番, 直した };
}

function そのまま(見立て) {
  return 見立て.map((o) => {
    let 最 = 0;
    for (let k = 1; k < o.length; k++) if (o[k] > o[最]) 最 = k;
    return 最;
  });
}
