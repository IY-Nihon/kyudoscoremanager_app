/**
 * 部員の表示名を作る。同じ姓の人が複数いるときだけ、名の頭文字を足す。
 *
 * （ソースマップからの復元時は module_687.js という名前だった）
 */
'use strict';

/**
 * @param {string} 氏名 「姓 名」の形。空白は半角でも全角でもよい
 * @param {Array<{name?: string}>} 名簿 同じ姓が居るかを見る相手
 * @returns {string} 姓だけ。同じ姓が2人以上いれば「姓(名の頭文字)」
 */
const formatMemberName = (氏名, 名簿) => {
  if (!氏名) return '';
  // 空白は半角（\s）でも全角（\u3000）でも区切る
  const 片 = 氏名.trim().split(/[\s\u3000]+/);
  const 姓 = 片[0];
  const 名 = 片.length > 1 ? 片.slice(1).join('') : '';
  const 同じ姓の人数 =
    名簿 && 名簿.length > 0
      ? 名簿.filter((人) => !!人.name && 人.name.trim().split(/[\s\u3000]+/)[0] === 姓).length
      : 0;
  if (同じ姓の人数 > 1 && 名) {
    const 頭文字 = 名.trim().charAt(0);
    return 頭文字 ? `${姓}(${頭文字})` : 姓;
  }
  return 姓;
};

Object.defineProperty(exports, '__esModule', { value: true });
exports.formatMemberName = formatMemberName;
