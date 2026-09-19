/**
 * 横に流す並び（タグの定型文・月の並び）を、パソコンの車で動かせるかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 * 「終了・保存のタグの並びが横に動かない」と言われた。指なら横に滑らせられるが、
 * マウスの車は上下にしか回らない。車の動きを横に読み替える聞き手を付けたので、
 * その読み替えと、端では上下のスクロールに任せる決まりを機械で押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

// react と IS_WEB は偽物で足りる（フックは1回しか呼ばない）
function 用意する(IS_WEB) {
  const react = require.resolve('react');
  const isWeb = path.join(__dirname, '..', 'src', 'IS_WEB.js');
  const 本体 = path.join(__dirname, '..', 'src', 'yokoNagashi.js');
  delete require.cache[本体];
  require.cache[react] = { id: react, filename: react, loaded: true, exports: { useRef: (v) => ({ current: v }), useCallback: (f) => f } };
  require.cache[isWeb] = { id: isWeb, filename: isWeb, loaded: true, exports: { IS_WEB } };
  const { use横流し } = require(本体);
  delete require.cache[react];
  delete require.cache[isWeb];
  return use横流し;
}

/** 偽の DOM の節点。聞き手を覚え、車の出来事を投げられる */
function 偽の節点({ scrollWidth, clientWidth }) {
  const 聞き手 = {};
  return {
    scrollWidth,
    clientWidth,
    scrollLeft: 0,
    addEventListener: (種, f) => (聞き手[種] = f),
    removeEventListener: (種, f) => {
      if (聞き手[種] === f) delete 聞き手[種];
    },
    回す: (deltaY, deltaX = 0) => {
      let 止めた = false;
      if (聞き手.wheel) 聞き手.wheel({ deltaY, deltaX, preventDefault: () => (止めた = true) });
      return 止めた;
    },
    付いている: () => !!聞き手.wheel,
  };
}

test('はみ出している並びの上で車を回すと、横に動いて上下のスクロールは止める', () => {
  const use横流し = 用意する(true);
  const ref = use横流し();
  const 節点 = 偽の節点({ scrollWidth: 700, clientWidth: 300 });
  ref({ getScrollableNode: () => 節点 });
  assert.ok(節点.付いている(), '聞き手が付いていない');
  assert.strictEqual(節点.回す(100), true, '横に動かしたのに上下のスクロールを止めていない');
  assert.strictEqual(節点.scrollLeft, 100);
  assert.strictEqual(節点.回す(-30), true);
  assert.strictEqual(節点.scrollLeft, 70);
});

test('端まで来て動かないときは、上下のスクロールに任せる', () => {
  const use横流し = 用意する(true);
  const ref = use横流し();
  const 節点 = 偽の節点({ scrollWidth: 700, clientWidth: 300 });
  ref(節点); // getScrollableNode が無い形でも受ける
  // 左端で上に回す → 動かないので任せる
  assert.strictEqual(節点.回す(-50), false, '左端で止めてしまうと、画面が上へ戻れない');
  節点.scrollLeft = 400; // 右端
  assert.strictEqual(節点.回す(50), false, '右端で止めてしまうと、画面が下へ進めない');
  // 端を越える量は端で止める
  節点.scrollLeft = 390;
  assert.strictEqual(節点.回す(50), true);
  assert.strictEqual(節点.scrollLeft, 400);
});

test('はみ出していない並びでは何もしない', () => {
  const use横流し = 用意する(true);
  const ref = use横流し();
  const 節点 = 偽の節点({ scrollWidth: 200, clientWidth: 300 });
  ref(節点);
  assert.strictEqual(節点.回す(100), false);
  assert.strictEqual(節点.scrollLeft, 0);
});

test('横の動き（トラックパッドの横スワイプ）はそのまま通す', () => {
  const use横流し = 用意する(true);
  const ref = use横流し();
  const 節点 = 偽の節点({ scrollWidth: 700, clientWidth: 300 });
  ref(節点);
  assert.strictEqual(節点.回す(10, 80), false);
  assert.strictEqual(節点.scrollLeft, 0);
});

test('ref が付け替わったら前の聞き手を外す。端末では何も付けない', () => {
  const use横流し = 用意する(true);
  const ref = use横流し();
  const 前 = 偽の節点({ scrollWidth: 700, clientWidth: 300 });
  const 後 = 偽の節点({ scrollWidth: 700, clientWidth: 300 });
  ref(前);
  ref(後);
  assert.ok(!前.付いている(), '前の節点に聞き手が残っている');
  assert.ok(後.付いている());
  ref(null);
  assert.ok(!後.付いている(), '外れたのに聞き手が残っている');

  const 端末の = 用意する(false)();
  const 節点 = 偽の節点({ scrollWidth: 700, clientWidth: 300 });
  端末の(節点);
  assert.ok(!節点.付いている(), '端末では指で動くので、聞き手は付けない');
});
