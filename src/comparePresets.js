/**
 * Module ID: comparePresets
 *
 * 比較のひな型。分析の個人の詳細で、よく見る組み合わせを名前を付けて残す。
 *
 * 「一年生の4人」「大前に置く候補」のような組み合わせを毎回選び直すのが
 * 手間だったため。持つのは部員IDだけで、氏名は持たない。氏名で持つと、
 * 改名や同姓同名で別人を呼び出してしまう（statsRules と同じ考え方）。
 *
 * ひな型は団体ごとに分ける。部員IDは団体の中でしか意味を持たないので、
 * 別の団体で開いたときに出すと、当てはめても誰も見つからない。
 *
 * 端末に持つだけで、クラウドへは送らない。見る人ごとの手元の都合であって、
 * 団体で揃えるものではない。
 *
 * 画面にも Firebase にも触れない純粋な関数なので、そのまま検査できる
 * （test/comparePresets.test.js）。
 */
'use strict';

/** ひとつの団体で持てるひな型の数。増えすぎると選ぶのに困る */
const ひな型の上限 = 12;
const 名前の長さ = 20;

/** その団体のぶんだけ取り出す */
function この団体のひな型(一覧, 団体id) {
  const id = null == 団体id ? '' : String(団体id);
  return (Array.isArray(一覧) ? 一覧 : []).filter((x) => x && String(x.団体id || '') === id);
}

/**
 * ひな型を足す。同じ名前があれば入れ替える（同じ名前が並ぶと選べない）。
 * 上限を超えたら、その団体のいちばん古いものから捨てる。
 *
 * @param {Array} 一覧 いま持っているひな型（全団体ぶん）
 * @param {{名前:string, 部員idたち:Array, 団体id:string}} 新しいの
 * @returns {Array} 新しい一覧（元は書き換えない）
 */
function ひな型を足す(一覧, 新しいの, いま) {
  const 元 = (Array.isArray(一覧) ? 一覧 : []).slice();
  const n = 新しいの || {};
  const 名前 = String(n.名前 || '').trim().slice(0, 名前の長さ);
  const 団体id = null == n.団体id ? '' : String(n.団体id);
  const 部員idたち = [...new Set((Array.isArray(n.部員idたち) ? n.部員idたち : []).map(String))];
  if (!名前 || 0 === 部員idたち.length) return 元;

  const 時 = いま || Date.now();
  const 残り = 元.filter((x) => !(x && String(x.団体id || '') === 団体id && x.名前 === 名前));
  残り.push({ id: 時 + '-' + Math.random().toString(36).slice(2, 8), 名前, 部員idたち, 団体id, 作成: 時 });

  // 上限はその団体の中で数える。他の団体のぶんを巻き添えにしない
  const この団体 = 残り.filter((x) => String(x.団体id || '') === 団体id);
  if (この団体.length <= ひな型の上限) return 残り;
  const 捨てる = new Set(この団体.slice(0, この団体.length - ひな型の上限).map((x) => x.id));
  return 残り.filter((x) => !捨てる.has(x.id));
}

/** ひな型を1つ消す */
function ひな型を消す(一覧, id) {
  return (Array.isArray(一覧) ? 一覧 : []).filter((x) => x && x.id !== id);
}

/**
 * ひな型を、いま選べる人に当てはめる。
 *
 * 抜けた部員や卒業して名簿から消えた人は当てはまらない。黙って落とすと
 * 「保存したときと人数が違う」と見えるので、見つからなかった数も返す。
 *
 * @param {object} ひな型
 * @param {Array} 選べる人たち [{id, name}]（現役＋卒業生）
 * @param {string|number} 本人id 本人は比較相手にしない
 * @returns {{人たち:Array, 見つからない:number}}
 */
function ひな型を当てはめる(ひな型, 選べる人たち, 本人id) {
  const 欲しい = (ひな型 && Array.isArray(ひな型.部員idたち) ? ひな型.部員idたち : []).map(String);
  const 表 = new Map();
  for (const x of Array.isArray(選べる人たち) ? 選べる人たち : [])
    if (x && null != x.id) 表.set(String(x.id), x);
  const 人たち = [];
  let 見つからない = 0;
  for (const id of 欲しい) {
    if (null != 本人id && String(本人id) === id) continue;
    const 人 = 表.get(id);
    if (人) 人たち.push(人);
    else 見つからない++;
  }
  return { 人たち, 見つからない };
}

module.exports = {
  この団体のひな型,
  ひな型を足す,
  ひな型を消す,
  ひな型を当てはめる,
  ひな型の上限,
};
