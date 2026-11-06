/**
 * 出欠を記録から自動で判定するときの決まり。
 * 画面から切り離してあるので、そのまま検査できる（test/attendanceRules.test.js）。
 */
'use strict';

const 学 = require('./gakunen');

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

/**
 * 日付を YYYY-MM-DD（端末の時刻）にする。Firestore の Timestamp・{seconds}・数・文字列を受ける。
 * 読めなければ null
 * @param {any} 日付の元
 * @returns {string|null}
 */
function 日付の文字(日付の元) {
  if (!日付の元) return null;
  let 日付;
  if (typeof 日付の元.toDate === 'function') 日付 = 日付の元.toDate();
  else if (日付の元.seconds !== undefined) 日付 = new Date(日付の元.seconds * 1000);
  else 日付 = new Date(日付の元);
  if (isNaN(日付.getTime())) return null;
  const 月 = String(日付.getMonth() + 1).padStart(2, '0');
  const 日 = String(日付.getDate()).padStart(2, '0');
  return `${日付.getFullYear()}-${月}-${日}`;
}

/**
 * その日の、その部員の出欠。出欠画面（AttendanceScreen）の決まりそのもの。
 *
 *   ・その日の記録に射手（途中交代も）として出ていれば「出席」
 *   ・出ていなくても、記録の出欠に印（遅刻・早退・欠席・出席）が付いていればそれ
 *   ・記録が無い（または印が無い）正規練習日は、現役（src/gakunen.js の 現役か）なら「欠席」。未来の日は数えない
 *   ・正規練習日でもなく記録も無い日は「無し」
 *
 * @param {Array<object>} 記録たち sessions
 * @param {Object<string, any>} 練習日 正規練習日 { 'YYYY-MM-DD': … }
 * @param {object} 部員 { id, grade }
 * @param {string} 日付 YYYY-MM-DD
 * @param {string} 今日 YYYY-MM-DD
 * @returns {'present'|'late'|'early'|'absent'|'none'}
 */
/**
 * 現役か … 記録があるのに出欠の印が無い日を欠席にするかの見方。出席率の分母と同じ見方を渡す（A11。
 * 前は今の在籍で決めていて、前の年度を見ると卒業した人の欠席が少なく出た）。省くと今の在籍（src/gakunen.js の 現役か）。
 * (部員, 日付) で呼ぶ。日付ごとに見たいとき（年度をまたぐ期間。AI の出欠の道具）は 2 つ目を使う
 */
/** @param {(人: object, 日付?: string) => boolean} [現役か] */
function その日の出欠(記録たち, 練習日, 部員, 日付, 今日, 現役か = (人) => 学.現役か(人 || {})) {
  const その日の記録 = (Array.isArray(記録たち) ? 記録たち : []).filter(
    (記録) => 日付の文字(記録 && 記録.date) === 日付
  );
  const 未来 = 日付 > 今日;
  const 部員ID = 部員 && 部員.id;
  if (その日の記録.length === 0) {
    if (練習日 && 練習日[日付]) return 未来 ? 'none' : 'absent';
    return 'none';
  }
  /** @type {'present'|'late'|'early'|'absent'|'none'} */
  let 状態 = 'none';
  for (const 記録 of その日の記録) {
    if (Array.isArray(記録.archers) && 記録.archers.some((射手) => 射に出ているか(射手, 部員ID)))
      return 'present';
    const 印 = 記録.attendance && 記録.attendance[部員ID];
    if (印 && 印 !== 'none') {
      if (印 !== 'present' || 状態 === 'none') 状態 = 印;
    }
  }
  if (状態 === 'none' && 練習日 && 練習日[日付]) {
    // 現役生のみ、記録がない場合に「欠席」とする（現役かは出席率の分母と同じ見方）
    return 現役か(部員 || {}, 日付) ? 'absent' : 'none';
  }
  return 状態;
}

/**
 * 期間の正規練習日について、部員ごとに出欠を数える。出欠画面の「出席率」と同じ数え方。
 *
 * 数えるのは正規練習日だけ（練習日でない日の記録は数えない）。
 * 出席率の分母は、現役なら「期間の練習日のうち今日までの日数」、そうでなければ「来た＋欠席」。
 *
 * @param {Array<object>} 部員たち
 * @param {Array<object>} 記録たち
 * @param {Object<string, any>} 練習日
 * @param {{始め?: string, 終わり?: string, 今日?: string, 現役か?: (部員: object, 日付?: string) => boolean}} [注文]
 *   始め・終わり … YYYY-MM-DD（含む）。省くと全部。今日 … 省くと端末の今日。
 *   現役か … 分母の決め方。省くと src/gakunen.js の 現役か。分母を決めるときは日付なしで、欠席かを見るときは
 *   その日の日付を添えて呼ぶ
 * @returns {Array<{部員: object, 出席: number, 遅刻: number, 早退: number, 欠席: number, 来た回数: number, 練習日数: number, 出席率: number}>}
 */
function 練習日で数える(部員たち, 記録たち, 練習日, 注文) {
  const 設定 = 注文 || {};
  const 今日 = 設定.今日 || 日付の文字(new Date());
  const 現役か = 設定.現役か || ((部員) => 学.現役か(部員 || {}));
  const 日たち = Object.keys(練習日 || {})
    .filter((日) => (!設定.始め || 日 >= 設定.始め) && (!設定.終わり || 日 <= 設定.終わり))
    .sort();
  const 今日までの日数 = 日たち.filter((日) => 日 <= 今日).length;
  return (Array.isArray(部員たち) ? 部員たち : []).map((部員) => {
    const 数 = { 出席: 0, 遅刻: 0, 早退: 0, 欠席: 0 };
    for (const 日 of 日たち) {
      const 状態 = その日の出欠(記録たち, 練習日, 部員, 日, 今日, 現役か);
      if (状態 === 'present') 数.出席++;
      else if (状態 === 'late') 数.遅刻++;
      else if (状態 === 'early') 数.早退++;
      else if (状態 === 'absent') 数.欠席++;
    }
    const 来た回数 = 数.出席 + 数.遅刻 + 数.早退;
    const 練習日数 = 現役か(部員) ? 今日までの日数 : 来た回数 + 数.欠席;
    return {
      部員,
      出席: 数.出席,
      遅刻: 数.遅刻,
      早退: 数.早退,
      欠席: 数.欠席,
      来た回数,
      練習日数,
      出席率: 練習日数 > 0 ? (来た回数 / 練習日数) * 100 : 0,
    };
  });
}

/**
 * その年度に現役だったか（出欠の画面と AI の出欠の道具で同じ見方。A11）。
 * 今も現役なら真。卒業・退部した人は、最後に現役だった年度（leftYear・前の形の graduationYear）までなら真。
 * 年度の記録が無い卒業生は、期から卒業した年度を推し量る（今日の年度と今の 1 年生の期から。src/gakunen.js）
 * @param {object} 部員
 * @param {number} 年度の年 見ている年度（2026 年度なら 2026）
 * @param {number|string} [今の一年生の期] 店の currentFreshmanTerm
 * @param {Date} [今日]
 */
function その年度に現役だったか(部員, 年度の年, 今の一年生の期, 今日 = new Date()) {
  if (!部員) return false;
  if (学.現役か(部員)) return true;
  const 最後の年度 = 部員.leftYear || 部員.graduationYear;
  if (最後の年度) return 年度の年 <= 最後の年度;
  if (学.卒業生か(部員) && 部員.termKi) {
    return 年度の年 <= 学.卒業の年度(部員.termKi, 今の一年生の期, 学.年度(今日));
  }
  return false;
}

module.exports = {
  射に出ているか,
  出ていた部員たち,
  日付の文字,
  その日の出欠,
  練習日で数える,
  その年度に現役だったか,
};
