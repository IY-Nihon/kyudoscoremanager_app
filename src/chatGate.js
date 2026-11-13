/**
 * AI に渡す道具を、団体の中身に合わせて絞る（2026-11-13）。
 *
 * ■ なぜ要るか
 *   作ったばかりで部員も記録も無い団体から、AI を探る問い（道具の名前・指示文を聞き出す）が来た
 *   （11/2・11/12）。数えるものが無い団体に数える道具を渡しても、使い道は探りだけになる。
 *   渡していない道具は、名前も説明も模型の手元に無いので、聞き出されても出てこない。
 *
 * ■ 決まり（本人 11/13：「部員がいないなら数える道具を渡さない、記録がないなら記録や分析の道具を渡さない」）
 *   ・部員が 0 人 … 部員を数える・並べる道具を渡さない
 *   ・記録が 0 件 … 記録を探す・分析する・図を出す道具を渡さない
 *   ・いつも渡す … 部員の登録・画面を開く・案内・計算（作ったばかりの団体が最初に使う）
 *   出していない道具を模型が呼んできても動かさない（AIChatBot.js の入り口で止める）。
 *
 * 画面にも Firebase にも触れない（test/chatGate.test.js）。
 */
'use strict';

/** 部員が 1 人もいないと使い道の無い道具 */
const 部員が要る道具 = [
  'getAllMembersStats',
  'makeBalancedTeams',
  'getAttendanceStats',
  'listMembers',
  'compareMemberStats',
  'getDetailedMemberStats',
  'getEquipmentTrend',
  'countSessionParticipation',
];

/** 記録が 1 件も無いと使い道の無い道具 */
const 記録が要る道具 = [
  'getAllMembersStats',
  'searchSessions',
  'countSessionParticipation',
  'getPositionStats',
  'getSessionsByDate',
  'compareMemberStats',
  'compareShotRanges',
  'aggregateStats',
  'showFigure',
  'getEquipmentTrend',
  'getDetailedMemberStats',
  'getArrowLocationStats',
];

/**
 * その道具を渡してよいか。
 * @param {string} 名前 道具の名前
 * @param {{部員の数: number, 記録の数: number}} 中身
 */
function 渡してよい道具か(名前, 中身) {
  const 部員 = Number(中身 && 中身.部員の数) || 0;
  const 記録 = Number(中身 && 中身.記録の数) || 0;
  if (部員 <= 0 && 部員が要る道具.includes(名前)) return false;
  if (記録 <= 0 && 記録が要る道具.includes(名前)) return false;
  return true;
}

/** 道具の宣言を、渡してよいものだけにする（元は書き換えない） */
function 渡す道具(宣言たち, 中身) {
  return (Array.isArray(宣言たち) ? 宣言たち : []).filter(
    (宣言) => 宣言 && 渡してよい道具か(宣言.name, 中身)
  );
}

/**
 * 指示文に足す一言。道具が無いときに、数字を作らず「まだ無い」と答えさせる。
 * 何も絞っていなければ空の文字。
 * @param {{部員の数: number, 記録の数: number}} 中身
 * @param {boolean} 個人 個人ログインか（部員の登録を案内しない）
 */
function 足りないときの案内(中身, 個人) {
  const 部員 = Number(中身 && 中身.部員の数) || 0;
  const 記録 = Number(中身 && 中身.記録の数) || 0;
  const 行 = [];
  if (部員 <= 0 && !個人)
    行.push(
      '・メンバーがまだ 1 人も登録されていません。成績・出欠・チーム分け・名簿を聞かれたら、数字を作らず、まだメンバーがいないことを伝え、メンバーの登録（addMember・addMembers、またはメンバー画面）を案内してください。'
    );
  if (記録 <= 0)
    行.push(
      個人
        ? '・本人が写っている記録がまだ 1 件もありません。的中率・記録・矢所・推移を聞かれたら、数字を作らず、まだ記録が無いことを伝えてください。'
        : '・記録がまだ 1 件もありません。的中率・記録・矢所・推移・図を聞かれたら、数字を作らず、まだ記録が無いことを伝え、記録画面で記録を付けることを案内してください。'
    );
  if (!行.length) return '';
  return `\n\n【いまの団体の様子】\n${行.join('\n')}\n・このため、数える道具は渡していません。使える道具だけで答えてください。
・「あるはず」と言われたら、読み込みの途中かもしれないので、少し待ってからもう一度聞くよう伝えてください。`;
}

/** 出していない道具を呼ばれたときに模型へ返す言葉 */
const 渡していないときの返事 =
  'まだ数えるもの（メンバー・記録）が無いので、この操作は使えません。その旨を伝えてください。';

module.exports = {
  部員が要る道具,
  記録が要る道具,
  渡してよい道具か,
  渡す道具,
  足りないときの案内,
  渡していないときの返事,
};
