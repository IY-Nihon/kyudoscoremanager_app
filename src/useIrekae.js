'use strict';

/**
 * 開け閉めする組（学年・期・区分など）の鍵の集まりを持つ（2026-10-24）。
 * 人を選ぶ窓が、閉じた組（または開いた期）を覚えるのに使う。前は窓ごとに同じ入れ替えを書いていた。
 */
const React = require('react');

/**
 * @param {() => Set} [初め] 初めの集まり（省くと空）
 * @returns {[Set, (鍵: any) => void, Function]} 集まり・鍵を入れたり出したりする関数・集まりを置き直す関数
 */
function use入れ替える組(初め = () => new Set()) {
  const [組, 組を置く] = React.useState(初め);
  const 入れ替える = React.useCallback(
    (鍵) =>
      組を置く((前) => {
        const 次 = new Set(前);
        if (次.has(鍵)) 次.delete(鍵);
        else 次.add(鍵);
        return 次;
      }),
    []
  );
  return [組, 入れ替える, 組を置く];
}

module.exports = { use入れ替える組 };
