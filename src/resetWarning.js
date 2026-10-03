/**
 * 落ちた画面の「データをリセットして復旧」を押す前に、何が失われるかを数える（純粋な関数）。
 *
 * リセットは端末の控え（記録・名簿・いま記録中の盤面）を空にする。雲に送れている分は
 * 次に開いたとき取り直せるが、まだ雲に送れていない記録（syncStatus が未同期）と、
 * 保存前の盤面は戻らない。診断（2026-10-02 の別 AI のレビュー）が「確認なしで全消し」と指摘した。
 */
'use strict';

/**
 * @param {{sessions?: Array<any>, trash?: Array<any>, archers?: Array<any>, activeSessionID?: any}} 状態
 * @returns {{未送信の記録: number, 記録中の盤面: boolean}}
 */
function 失われるもの(状態) {
  const 一覧 = (x) => (Array.isArray(x) ? x : []);
  const 未送信 = (記録) => !!記録 && 記録.syncStatus === '未同期';
  const 未送信の記録 = 一覧(状態 && 状態.sessions).filter(未送信).length + 一覧(状態 && 状態.trash).filter(未送信).length;
  const 射手がいる = 一覧(状態 && 状態.archers).some((射手) => !!射手 && !射手.isSeparator && !射手.isTotalCalculator);
  return { 未送信の記録, 記録中の盤面: 射手がいる };
}

/** 確認の窓に出す文。失われるものが無ければ、軽い言い方にする */
function 確認の文(失う) {
  const 行 = [];
  if (失う.未送信の記録 > 0) 行.push(`まだ雲に送れていない記録が ${失う.未送信の記録} 件あります。リセットすると、この端末からも消えて戻せません。`);
  if (失う.記録中の盤面) 行.push('いま記録中の盤面（保存前）も消えます。');
  if (!行.length) 行.push('この端末の控えを消して、雲から取り直します。');
  else 行.push('先に「読み込み直す」を試すと、これらを残したまま直ることがあります。');
  return 行.join('\n');
}

module.exports = { 失われるもの, 確認の文 };
