/**
 * Module ID: attendanceRules
 *
 * 出欠を記録から自動で判定するときの決まり。
 * 画面から切り離してあるので、そのまま検査できる（test/attendanceRules.test.js）。
 */
'use strict';

/**
 * その立ちに、その部員が出ていたか。
 *
 * 射手そのものとして立っている場合だけでなく、途中交代で入った場合も
 * 「出ていた」と数える。交代で入った人は archer.memberId には現れず、
 * archer.substitutionIds（立目や射目ごとの部員ID）にだけ現れるため、
 * memberId だけを見ると、実際に引いた人を欠席にしてしまう。
 *
 * ゲストとして入った人は部員IDを持たないので、ここでは数えない。
 *
 * @param {object} 射手 その立ちの1人ぶん（archers の要素）
 * @param {string|number} 部員ID 調べたい部員の id
 * @returns {boolean}
 */
function 射に出ているか(射手, 部員ID) {
  if (!射手 || 部員ID == null || 部員ID === '') return false;
  const 求める = String(部員ID);
  if (射手.memberId != null && String(射手.memberId) === 求める) return true;

  const 交代 = 射手.substitutionIds;
  if (!交代 || typeof 交代 !== 'object') return false;
  for (const 鍵 of Object.keys(交代)) {
    const id = 交代[鍵];
    if (id != null && id !== '' && String(id) === 求める) return true;
  }
  return false;
}

/**
 * その立ちに出ていた部員の id をすべて返す。
 * 交代で入った人も含む。同じ人が複数回出てきても1つにまとめる。
 *
 * @param {Array<object>} 射手たち archers
 * @returns {Array<string>}
 */
function 出ていた部員たち(射手たち) {
  const 出来 = [];
  const 済み = Object.create(null);
  for (const 射手 of Array.isArray(射手たち) ? 射手たち : []) {
    if (!射手) continue;
    const 候補 = [射手.memberId];
    const 交代 = 射手.substitutionIds;
    if (交代 && typeof 交代 === 'object') {
      for (const 鍵 of Object.keys(交代)) 候補.push(交代[鍵]);
    }
    for (const id of 候補) {
      if (id == null || id === '') continue;
      const 文 = String(id);
      if (済み[文]) continue;
      済み[文] = true;
      出来.push(文);
    }
  }
  return 出来;
}

module.exports = { 射に出ているか, 出ていた部員たち };
