/**
 * 記録表の列ごとの見立て。
 *
 * 列（ArcherColumnView）が描くのに、立ち全体を見ないと決まらないものがある：
 * チームの色、鍵が効くか、射位（大前・N番・落）、計の列の数。以前は列が
 * 一覧（archers）をまるごと受け取って自分で数えていたが、それだと ○× を
 * 1 つ入れて一覧が新しくなるたびに、全部の列が「渡されたものが変わった」と
 * 見て描き直していた（React.memo が効かない）。
 *
 * ここで一覧から列ごとの見立てを数字と文字だけで作り、列にはそれを渡す。
 * 自分の列に関わる値が変わらなければ、列は描き直さない。
 *
 * 数え方そのものは teamGrouping に 1 つだけ置いてあるものを使う。
 */
'use strict';

const 組 = require('./teamGrouping');

/**
 * @param {Array} 一覧 記録表の並び（射手・区切り・計）
 * @param {number} 射数
 * @returns {Array<{チームの色: string|null, 鍵が効く: boolean, 射位の番: number, 人数: number, 合計の的中: number, 立の的中: string, 埋まった立: string}>}
 *   一覧と同じ並びの見立て。立の的中 は計の列だけ「3,2,4」のように立ごとの数。
 *   埋まった立 は間隔・計の列だけ、受け持つ射手の全員が入れ終えた立の番号「0,2」
 */
function 列の見立てを作る(一覧, 射数) {
  const 並び = Array.isArray(一覧) ? 一覧 : [];
  const 本数 = Number(射数) > 0 ? Number(射数) : 0;
  const 割り当て = 組.チームを割り当てる(並び);
  const 色の表 = new Map();
  for (const 一人 of 割り当て) if (一人 && 一人.id != null) 色の表.set(一人.id, 一人.色 || null);
  // 射位は、区切りと計を除いた並びで数える（chatStats や読み上げと同じ数え方）
  const 実の並び = 並び.filter((一人) => 一人 && !一人.isSeparator && !一人.isTotalCalculator);
  const 射位の表 = new Map();
  実の並び.forEach((一人, 番) => 射位の表.set(一人.id, 番));

  return 並び.map((列, 位置) => {
    if (!列)
      return {
        チームの色: null,
        鍵が効く: false,
        射位の番: -1,
        人数: 実の並び.length,
        合計の的中: 0,
        立の的中: '',
        埋まった立: '',
      };
    const 間隔か合計 = !!(列.isSeparator || 列.isTotalCalculator);
    // 鍵が効くのは、右どなり（並びで 1 つ手前）が射手のときだけ。
    // 右どなりが間隔・計だと一歩目で止まり、誰も固定されない鍵になる
    const 右どなり = 並び[位置 - 1];
    const 鍵が効く = !!(位置 > 0 && 右どなり && !右どなり.isSeparator && !右どなり.isTotalCalculator);
    let 合計の的中 = 0;
    let 立の的中 = '';
    let 埋まった立 = '';
    if (間隔か合計) {
      const 仲間 = 組.合計が受け持つ射手(並び, 位置);
      if (列.isTotalCalculator) {
        合計の的中 = 組.合計を数える(並び, 位置);
        const 立ごと = [];
        for (let 立 = 0; 4 * 立 < 本数; 立++) {
          const 頭 = 4 * 立;
          const 尻 = Math.min(頭 + 4, 本数);
          let 計 = 0;
          for (const 射手 of 仲間) {
            const 印たち = 射手.marks || [];
            for (let 射番 = 頭; 射番 < 尻; 射番++) if ('○' === 印たち[射番]) 計++;
          }
          立ごと.push(計);
        }
        立の的中 = 立ごと.join(',');
      }
      if (鍵が効く && 仲間.length) {
        const 出 = [];
        for (let 立 = 0; 4 * 立 < 本数; 立++) {
          const 尻 = Math.min(4 * 立 + 4, 本数);
          let 全部 = true;
          for (let 番 = 0; 番 < 仲間.length && 全部; 番++) {
            const 印 = 仲間[番].marks || [];
            for (let 射番 = 4 * 立; 射番 < 尻; 射番++)
              if (!(印[射番] ?? '')) {
                全部 = false;
                break;
              }
          }
          if (全部) 出.push(立);
        }
        埋まった立 = 出.join(',');
      }
    }
    return {
      チームの色: 色の表.has(列.id) ? 色の表.get(列.id) : null,
      鍵が効く,
      射位の番: 射位の表.has(列.id) ? 射位の表.get(列.id) : -1,
      人数: 実の並び.length,
      合計の的中,
      立の的中,
      埋まった立,
    };
  });
}

module.exports = { 列の見立てを作る };
