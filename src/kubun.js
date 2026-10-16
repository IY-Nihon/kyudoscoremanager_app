'use strict';

/**
 * 区分（団体が自由に作る分け方。「一般・学生・少年」「A チーム・B チーム」「経験者・初心者」など）。
 *
 * 団体の設定 app_settings の divisions に [{ id, name }] の並びで持つ。部員は divisionIds に区分の id を持つ（いくつでも）。
 * 並び順がそのまま、メンバーの編集の札・一覧の見出し・分析と出欠の絞り込み・人を選ぶ窓の組の順になる。
 * 区分を消しても部員の divisionIds は書き換えない（今の一覧に無い id は無いものとして読む）。名簿をまとめて
 * 書き直さずに済み、同じ名前で作り直しても id が違うので消した区分が戻ることもない。
 * docs/plans/group-types-and-grades.md の「区分」。
 *
 * 画面にも Firebase にも触れない純粋な関数（test/kubun.test.js）。
 */

/** 区分の名前の長さの上限（札に収まる長さ） */
const 名前の上限 = 12;

/** 名前を整える（前後の空白を落とし、続く空白を 1 つに、長すぎる分を切る） */
function 名前を整える(名前) {
  return String(名前 == null ? '' : 名前)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 名前の上限);
}

/** 設定から読んだ値を区分の一覧にする（形の崩れたものは落とす） */
function 区分たち(値) {
  if (!Array.isArray(値)) return [];
  const 見た = new Set();
  return 値
    .filter((区分) => 区分 && 'string' == typeof 区分.id && 区分.id && 名前を整える(区分.name))
    .filter((区分) => (見た.has(区分.id) ? false : (見た.add(区分.id), true)))
    .map((区分) => ({ id: 区分.id, name: 名前を整える(区分.name) }));
}

const 新しいid = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/**
 * 区分を足す。返すのは { 一覧 } か { 誤り: 画面に出す文 }
 * @param {Array} 一覧 今の区分
 * @param {string} 名前
 * @param {string} [id] 新しい区分の id（省くと作る）
 */
function 区分を足す(一覧, 名前, id) {
  const 名 = 名前を整える(名前);
  const 今 = 区分たち(一覧);
  if (!名) return { 誤り: '区分の名前を入れてください' };
  if (今.some((区分) => 区分.name === 名)) return { 誤り: `「${名}」はもうあります` };
  return { 一覧: [...今, { id: id || 新しいid(), name: 名 }] };
}

/** 区分の名前を直す。返すのは { 一覧 } か { 誤り } */
function 区分の名前を直す(一覧, id, 名前) {
  const 名 = 名前を整える(名前);
  const 今 = 区分たち(一覧);
  if (!名) return { 誤り: '区分の名前を入れてください' };
  if (今.some((区分) => 区分.id !== id && 区分.name === 名)) return { 誤り: `「${名}」はもうあります` };
  return { 一覧: 今.map((区分) => (区分.id === id ? { id, name: 名 } : 区分)) };
}

/** 区分を消す */
function 区分を消す(一覧, id) {
  return 区分たち(一覧).filter((区分) => 区分.id !== id);
}

/** 区分を 1 つ上（向き -1）か下（向き 1）へ動かす。端なら動かさない */
function 区分を動かす(一覧, id, 向き) {
  const 今 = 区分たち(一覧);
  const 番 = 今.findIndex((区分) => 区分.id === id);
  const 先 = 番 + (向き < 0 ? -1 : 1);
  if (番 < 0 || 先 < 0 || 先 >= 今.length) return 今;
  const 次 = [...今];
  [次[番], 次[先]] = [次[先], 次[番]];
  return 次;
}

/** その人に付いている区分（今の一覧にあるものだけ、一覧の順） */
function 人の区分(人, 一覧) {
  const ids = new Set(Array.isArray(人 && 人.divisionIds) ? 人.divisionIds : []);
  return 区分たち(一覧).filter((区分) => ids.has(区分.id));
}

/** その人の区分の名前（「一般・学生」）。無ければ空 */
function 人の区分の名前(人, 一覧) {
  return 人の区分(人, 一覧)
    .map((区分) => 区分.name)
    .join('・');
}

/** 保存する前に、今の一覧に無い id を落とす（消した区分を付け直さない） */
function 付けられる区分(ids, 一覧) {
  const ある = new Set(区分たち(一覧).map((区分) => 区分.id));
  return Array.from(new Set((Array.isArray(ids) ? ids : []).filter((id) => ある.has(id))));
}

/** その区分の人だけにする。区分ID が空なら全員 */
function 区分で絞る(人たち, 区分ID) {
  const 全員 = Array.isArray(人たち) ? 人たち : [];
  if (!区分ID) return 全員;
  return 全員.filter((人) => 人 && Array.isArray(人.divisionIds) && 人.divisionIds.includes(区分ID));
}

/**
 * 区分ごとの組にする（一覧の順。区分の無い人は最後の「区分なし」）。人の居ない組は出さない。
 * 区分を 2 つ持つ人は両方の組に出る。返すのは [{ id, 題, 人たち }]（区分なしの id は null）
 */
function 区分でまとめる(人たち, 一覧) {
  const 全員 = (Array.isArray(人たち) ? 人たち : []).filter(Boolean);
  const 今 = 区分たち(一覧);
  const 組たち = 今
    .map((区分) => ({ id: 区分.id, 題: 区分.name, 人たち: 区分で絞る(全員, 区分.id) }))
    .filter((組) => 組.人たち.length);
  const 区分なし = 全員.filter((人) => !人の区分(人, 今).length);
  if (区分なし.length) 組たち.push({ id: null, 題: '区分なし', 人たち: 区分なし });
  return 組たち;
}

module.exports = {
  名前の上限,
  名前を整える,
  区分たち,
  区分を足す,
  区分の名前を直す,
  区分を消す,
  区分を動かす,
  人の区分,
  人の区分の名前,
  付けられる区分,
  区分で絞る,
  区分でまとめる,
};
