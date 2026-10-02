/**
 * 記録の射手の名前を、メンバーのいまの名前に合わせる（純粋な関数。画面にも Firebase にも触れない）。
 *
 * ■ なぜ要るか
 * メンバーの名前を直すと、updateMember が過去の記録の射手にも書き換える。ところが、
 * 実際の団体（910280）では、名前を変えた日（9/11）に書き換わったのは、その人の記録 94 件のうち 32 件で、
 * 残りの 52 件は前の名前のまま残っていた（団体全体で 67 人分）。記録が端末に入っていなかった・
 * 別の端末が古い値を書き戻した、などが考えられるが、データからは決められなかった。
 * 名前が食い違うと、記録の表に前の名前が出るだけでなく、射位ごとの成績（記録に書かれた名前で束ねる）が
 * 同じ人を 2 人に分けてしまう。
 * そこで、書き換えの取りこぼしに頼らず、ずれを見つけたら直す（2026-10-03）。
 *
 * ■ 直す相手
 * メンバーに結び付いた射手（memberId）だけ。名前を手で打った射手は、setArcherGuestName が
 * memberId を外してゲストにする作りなので、結び付いた射手の名前は「そのメンバーの名前」と決まっている。
 * 途中交代で入った人（substitutionIds）は、交代の欄の名前も合わせる。
 * 性別と学年は直さない：記録の画面で、射手ごとに性別を直せる（setArcherGender）ことと、
 * 学年は記録した時点のまま残す記録があるため、食い違いがあっても間違いとは言えない。
 */
'use strict';

/**
 * メンバーの名前表（id → いまの名前）。名前の無い人は入れない。
 * 卒業生の一覧（alumni）も同じように渡せる。
 * @param {...Array} 一覧たち members・alumni など
 * @returns {Map<string, string>}
 */
function 名前表を作る(...一覧たち) {
  const 表 = new Map();
  for (const 一覧 of 一覧たち) {
    for (const 人 of Array.isArray(一覧) ? 一覧 : []) {
      if (人 && 人.id != null && typeof 人.name === 'string' && 人.name.trim()) 表.set(String(人.id), 人.name);
    }
  }
  return 表;
}

/** 記録の archerNames（射手の名前の重複なしの一覧） */
function 射手の名前たち(射手たち) {
  return Array.from(
    new Set(
      (Array.isArray(射手たち) ? 射手たち : [])
        .map((射手) => (射手 && typeof 射手.name === 'string' ? 射手.name.trim() : ''))
        .filter(Boolean)
    )
  );
}

/**
 * 射手の並びを、名前表に合わせる。直したところが無ければ、同じ並びをそのまま返す。
 * @param {Array} 射手たち
 * @param {Map<string, string>} 名前表
 * @param {number} [今] 直した射手の lastModified に入れる時刻
 * @returns {{直した射手: Array, 触った: boolean}}
 */
function 射手たちを合わせる(射手たち, 名前表, 今 = Date.now()) {
  if (!Array.isArray(射手たち) || !(名前表 instanceof Map) || 名前表.size === 0) {
    return { 直した射手: 射手たち, 触った: false };
  }
  let 触った = false;
  const 直した射手 = 射手たち.map((射手) => {
    if (!射手 || 射手.isSeparator || 射手.isTotalCalculator) return 射手;
    let 次 = 射手;
    const いまの名前 = 射手.memberId != null ? 名前表.get(String(射手.memberId)) : undefined;
    if (いまの名前 !== undefined && 射手.name !== いまの名前) {
      次 = Object.assign({}, 次, { name: いまの名前, lastModified: 今 });
      触った = true;
    }
    if (射手.substitutionIds && typeof 射手.substitutionIds === 'object') {
      let 交代 = null;
      for (const [番, id] of Object.entries(射手.substitutionIds)) {
        const 交代の名前 = id != null ? 名前表.get(String(id)) : undefined;
        if (交代の名前 === undefined) continue;
        if ((射手.substitutions || {})[番] !== 交代の名前) {
          交代 = 交代 || Object.assign({}, 射手.substitutions || {});
          交代[番] = 交代の名前;
        }
      }
      if (交代) {
        次 = Object.assign({}, 次, { substitutions: 交代, lastModified: 今 });
        触った = true;
      }
    }
    return 次;
  });
  return 触った ? { 直した射手, 触った } : { 直した射手: 射手たち, 触った: false };
}

/**
 * 名前がずれている記録を探す。
 * @param {Array} 記録たち
 * @param {Map<string, string>} 名前表
 * @returns {Array<{id: string, 直した射手: Array, 名前たち: string[]}>}
 */
function ずれのある記録たち(記録たち, 名前表) {
  const 出 = [];
  for (const 記録 of Array.isArray(記録たち) ? 記録たち : []) {
    if (!記録 || !Array.isArray(記録.archers)) continue;
    const { 直した射手, 触った } = 射手たちを合わせる(記録.archers, 名前表);
    if (触った) 出.push({ id: 記録.id, 直した射手, 名前たち: 射手の名前たち(直した射手) });
  }
  return 出;
}

module.exports = { 名前表を作る, 射手の名前たち, 射手たちを合わせる, ずれのある記録たち };
