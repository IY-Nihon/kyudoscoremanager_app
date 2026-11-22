/**
 * 読み込み直しの控え（src/yominaoshiHikae.js）。
 *
 *   npm test
 *
 * 見たいのは 3 つ。
 *   ・壊れた控え・置き場の無い端末で画面が落ちないこと
 *   ・スクロールの位置は、中身が届いてから 1 回だけ戻すこと（自分で流したら戻さない）
 *   ・控えるのは止まってから（流しているあいだに何度も書かない）
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');

// 画面の外で 1 回描いたことにする（node では描く道具を持たないので、使う 3 つだけ用意する）
const 偽React = {
  useRef: (/** @type {any} */ 値) => ({ current: 値 }),
  useCallback: (/** @type {any} */ 手) => 手,
  useEffect: () => {},
};
const Reactの道 = require.resolve('react');
const 元のReact = require.cache[Reactの道];
const 偽 = new Module(Reactの道, null);
((偽.filename = Reactの道), (偽.loaded = true), (偽.exports = 偽React));
require.cache[Reactの道] = 偽;
delete require.cache[require.resolve('../src/yominaoshiHikae')];
const 控 = require('../src/yominaoshiHikae');
if (元のReact) require.cache[Reactの道] = 元のReact;
else delete require.cache[Reactの道];

const 頭 = '読み込み直しの控え:';

function 偽の置き場() {
  const 中 = new Map();
  let 書いた回数 = 0;
  return {
    get length() {
      return 中.size;
    },
    key: (/** @type {number} */ 番) => [...中.keys()][番] ?? null,
    getItem: (/** @type {string} */ 鍵) => (中.has(鍵) ? 中.get(鍵) : null),
    setItem: (/** @type {string} */ 鍵, /** @type {string} */ 値) => {
      書いた回数++;
      中.set(鍵, String(値));
    },
    removeItem: (/** @type {string} */ 鍵) => void 中.delete(鍵),
    clear: () => 中.clear(),
    中,
    get 書いた回数() {
      return 書いた回数;
    },
  };
}

const 流した = (/** @type {number} */ y) => ({ nativeEvent: { contentOffset: { x: 0, y } } });
const 枠 = (/** @type {number} */ 高さ) => ({
  nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 高さ } },
});

test('書いて読む：同じ形で戻る・名前ごとに分かれる', () => {
  const 場 = 偽の置き場();
  控.控えを書く('分析', { 期間の種類: '月', 見ている年: 2026 }, /** @type {any} */ (場));
  控.控えを書く('履歴', { 見ている月: '2026-11' }, /** @type {any} */ (場));
  assert.deepStrictEqual(控.控えを読む('分析', /** @type {any} */ (場)), {
    期間の種類: '月',
    見ている年: 2026,
  });
  assert.deepStrictEqual(控.控えを読む('履歴', /** @type {any} */ (場)), { 見ている月: '2026-11' });
  assert.strictEqual(控.控えを読む('まだ無い', /** @type {any} */ (場)), null);
});

test('壊れた控え・形の違う控えは、無いことにする（画面を落とさない）', () => {
  const 場 = 偽の置き場();
  for (const 字 of ['{壊れ', '[1,2]', '3', '"字"', 'null', '']) {
    場.中.set(頭 + '分析', 字);
    assert.strictEqual(控.控えを読む('分析', /** @type {any} */ (場)), null, 字);
  }
});

test('置き場が無い・触れない端末では何もしない（private モードなど）', () => {
  assert.strictEqual(控.控えを読む('分析', null), null);
  assert.doesNotThrow(() => 控.控えを書く('分析', { a: 1 }, null));
  assert.strictEqual(控.控えを全部消す(null), 0);
  const 投げる = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    get length() {
      throw new Error('SecurityError');
    },
  };
  assert.strictEqual(控.控えを読む('分析', /** @type {any} */ (投げる)), null);
  assert.doesNotThrow(() => 控.控えを書く('分析', { a: 1 }, /** @type {any} */ (投げる)));
  assert.strictEqual(控.控えを全部消す(/** @type {any} */ (投げる)), 0);
  // 置き場を渡さないとき：node には window が無いので、何もしない
  assert.strictEqual(typeof globalThis.window, 'undefined');
  assert.strictEqual(控.控えを読む('分析'), null);
  assert.doesNotThrow(() => 控.控えを書く('分析', { a: 1 }));
  // sessionStorage に触れるだけで投げる端末
  globalThis.window = /** @type {any} */ ({
    get sessionStorage() {
      throw new Error('SecurityError');
    },
  });
  try {
    assert.strictEqual(控.控えを読む('分析'), null);
    assert.strictEqual(控.控えを全部消す(), 0);
  } finally {
    delete globalThis.window;
  }
});

test('控えの値：無い・型が違うときは既定。持ち物でない鍵（toString など）も既定', () => {
  const 字か = (/** @type {any} */ 値) => typeof 値 === 'string';
  const 控え = { 期間の種類: '月', 見ている年: '2026' };
  assert.strictEqual(控.控えの値(控え, '期間の種類', 'すべて', 字か), '月');
  assert.strictEqual(
    控.控えの値(控え, '見ている年', 2025, (値) => typeof 値 === 'number'),
    2025,
    '字の年は使わない'
  );
  assert.strictEqual(控.控えの値(控え, '無い鍵', 'すべて', 字か), 'すべて');
  assert.strictEqual(控.控えの値(null, '期間の種類', 'すべて', 字か), 'すべて');
  assert.strictEqual(
    控.控えの値({}, 'toString', 'すべて', () => true),
    'すべて'
  );
});

test('全部消す：読み込み直しの控えだけ消し、ほかの物は残す', () => {
  const 場 = 偽の置き場();
  控.控えを書く('分析', { a: 1 }, /** @type {any} */ (場));
  控.控えを書く('履歴', { b: 2 }, /** @type {any} */ (場));
  控.控えを書く('分析の位置', { y: 10 }, /** @type {any} */ (場));
  場.中.set('ほかの控え', 'x');
  assert.strictEqual(控.控えを全部消す(/** @type {any} */ (場)), 3);
  assert.deepStrictEqual([...場.中.keys()], ['ほかの控え']);
});

test('位置：控えが無ければ戻さない', () => {
  const 場 = 偽の置き場();
  const 呼んだ = [];
  const ref = { current: { scrollToOffset: (/** @type {any} */ o) => 呼んだ.push(o) } };
  const 渡す = 控.use位置の控え('履歴の位置', ref, /** @type {any} */ (場));
  assert.strictEqual(渡す.scrollEventThrottle, 100);
  渡す.onLayout(枠(600));
  渡す.onContentSizeChange(390, 5000);
  assert.deepStrictEqual(呼んだ, []);
});

test('位置：中身が控えた位置まで流せる高さになってから 1 回だけ戻す（FlatList は scrollToOffset）', () => {
  const 場 = 偽の置き場();
  控.控えを書く('履歴の位置', { y: 500 }, /** @type {any} */ (場));
  const 呼んだ = [];
  const ref = { current: { scrollToOffset: (/** @type {any} */ o) => 呼んだ.push(o) } };
  const 渡す = 控.use位置の控え('履歴の位置', ref, /** @type {any} */ (場));
  渡す.onLayout(枠(600));
  渡す.onContentSizeChange(390, 900);
  assert.deepStrictEqual(呼んだ, [], '900 − 600 = 300 までしか流せない。ここで戻すと 300 で止まる');
  渡す.onContentSizeChange(390, 1100);
  assert.deepStrictEqual(
    呼んだ,
    [{ offset: 500, animated: false }],
    '一番下まで流していた位置（1100 − 600）にも戻る'
  );
  渡す.onContentSizeChange(390, 3000);
  渡す.onLayout(枠(700));
  assert.strictEqual(呼んだ.length, 1, '戻すのは 1 回だけ');
});

test('位置：ScrollView は scrollTo で戻す・枠の高さが分かる前は戻さない', () => {
  const 場 = 偽の置き場();
  控.控えを書く('分析の位置', { y: 500 }, /** @type {any} */ (場));
  const 呼んだ = [];
  const ref = { current: { scrollTo: (/** @type {any} */ o) => 呼んだ.push(o) } };
  const 渡す = 控.use位置の控え('分析の位置', ref, /** @type {any} */ (場));
  渡す.onContentSizeChange(390, 2000);
  assert.deepStrictEqual(呼んだ, [], '枠の高さが分からないうちは、届くか決められない');
  渡す.onLayout(枠(600));
  assert.deepStrictEqual(呼んだ, [{ y: 500, animated: false }]);
});

test('位置：正しくない控え（0・負・字・無限）は戻さない', () => {
  for (const y of [0, -20, '300', Infinity, null]) {
    const 場 = 偽の置き場();
    場.中.set(頭 + '分析の位置', JSON.stringify({ y }));
    const 呼んだ = [];
    const ref = { current: { scrollTo: (/** @type {any} */ o) => 呼んだ.push(o) } };
    const 渡す = 控.use位置の控え('分析の位置', ref, /** @type {any} */ (場));
    渡す.onLayout(枠(600));
    渡す.onContentSizeChange(390, 5000);
    assert.deepStrictEqual(呼んだ, [], String(y));
  }
});

test('位置：戻す前に自分で流したら戻さない・先頭のままの知らせでは控えを上書きしない', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const 場 = 偽の置き場();
  控.控えを書く('分析の位置', { y: 500 }, /** @type {any} */ (場));
  const 呼んだ = [];
  const ref = { current: { scrollTo: (/** @type {any} */ o) => 呼んだ.push(o) } };
  const 渡す = 控.use位置の控え('分析の位置', ref, /** @type {any} */ (場));
  渡す.onScroll(流した(0));
  t.mock.timers.tick(控.位置を書く間);
  assert.deepStrictEqual(
    控.控えを読む('分析の位置', /** @type {any} */ (場)),
    { y: 500 },
    '描いた直後の 0 で消さない'
  );
  渡す.onScroll(流した(40));
  渡す.onLayout(枠(600));
  渡す.onContentSizeChange(390, 5000);
  assert.deepStrictEqual(呼んだ, [], '自分で流したあとに引き戻さない');
  t.mock.timers.tick(控.位置を書く間);
  assert.deepStrictEqual(控.控えを読む('分析の位置', /** @type {any} */ (場)), { y: 40 });
});

test('位置：止まってから控える（続けて流すあいだは 1 回にまとめ、最後の位置を書く）', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const 場 = 偽の置き場();
  const ref = { current: { scrollToOffset: () => {} } };
  const 渡す = 控.use位置の控え('履歴の位置', ref, /** @type {any} */ (場));
  渡す.onScroll(流した(100));
  t.mock.timers.tick(100);
  渡す.onScroll(流した(200));
  t.mock.timers.tick(100);
  渡す.onScroll(流した(350));
  assert.strictEqual(場.書いた回数, 0, 'まだ書かない');
  t.mock.timers.tick(控.位置を書く間);
  assert.strictEqual(場.書いた回数, 1);
  assert.deepStrictEqual(控.控えを読む('履歴の位置', /** @type {any} */ (場)), { y: 350 });
  渡す.onScroll(流した(0));
  t.mock.timers.tick(控.位置を書く間);
  assert.deepStrictEqual(
    控.控えを読む('履歴の位置', /** @type {any} */ (場)),
    { y: 0 },
    '戻ったあと（控えが無いとき）は先頭も控える'
  );
});
