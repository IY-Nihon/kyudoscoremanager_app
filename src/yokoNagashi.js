/**
 * 横に流す ScrollView を、パソコンのマウスの車でも動かせるようにする。
 *
 * ■ なぜ要るか
 * タグの定型文や月の並びは、横に並べて横スクロールにしてある。指なら横に
 * 滑らせれば動くが、マウスの車は上下にしか回らず、横のスクロールは
 * Shift を押しながら回すしかない（しかも棒を隠しているので、動くことも
 * 分からない）。実際に「終了・保存のタグの並びが横に動かない」と言われた。
 *
 * ここでは、その並びの上で車を回したら、上下の動きを横の動きに読み替える。
 * 端まで来て動かないときは読み替えず、ふつうの上下スクロールに任せる。
 *
 * 端末（iOS / Android）では指で動くので何もしない。
 *
 * ■ 使い方
 *   const 横流しのref = use横流し();
 *   <ScrollView ref={横流しのref} horizontal …>
 */
'use strict';

const React = require('react');
const { IS_WEB } = require('./IS_WEB');

/** ScrollView の ref から、実際にスクロールする DOM の節点を取り出す */
function 中身の節点(scrollView) {
  if (!scrollView) return null;
  return scrollView.getScrollableNode ? scrollView.getScrollableNode() : scrollView;
}

/**
 * ScrollView に渡す ref。web では車の動きを横に読み替える聞き手を付け、
 * 外れるときに外す。端末ではただの ref。
 */
function use横流し() {
  const 付けた先 = React.useRef(null);
  return React.useCallback((scrollView) => {
    if (!IS_WEB) return;
    // 前に付けた聞き手は外す（ref は付け替わることがある）
    if (付けた先.current) {
      付けた先.current.節点.removeEventListener('wheel', 付けた先.current.聞き手);
      付けた先.current = null;
    }
    const 節点 = 中身の節点(scrollView);
    if (!節点 || typeof 節点.addEventListener !== 'function') return;
    const 聞き手 = (出来事) => {
      // 横の動きがあるときは、そのまま（トラックパッドの横スワイプ）
      if (Math.abs(出来事.deltaX) > Math.abs(出来事.deltaY)) return;
      const 余り = 節点.scrollWidth - 節点.clientWidth;
      if (余り <= 0) return; // はみ出していなければ、上下のスクロールに任せる
      const 次 = Math.max(0, Math.min(余り, 節点.scrollLeft + 出来事.deltaY));
      if (次 === 節点.scrollLeft) return; // 端で止まっているときも、上下に任せる
      節点.scrollLeft = 次;
      出来事.preventDefault();
    };
    節点.addEventListener('wheel', 聞き手, { passive: false });
    付けた先.current = { 節点, 聞き手 };
  }, []);
}

module.exports = { use横流し };
