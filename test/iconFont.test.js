// アイコンの字体の先読み（src/iconFont.js）。失敗しても受け止め、間をあけて読み直す
const test = require('node:test');
const assert = require('node:assert');
const { アイコンの字体を読んでおく, 読み直す間 } = require('../src/iconFont');

test('一度で読めたら true。待たない', async () => {
  const 待った = [];
  const 出 = await アイコンの字体を読んでおく({
    読む: async () => {},
    待つ: async (ms) => 待った.push(ms),
    読めているか: () => false,
  });
  assert.strictEqual(出, true);
  assert.deepStrictEqual(待った, []);
});

test('もう読めているなら読みに行かない', async () => {
  let 読んだ = 0;
  const 出 = await アイコンの字体を読んでおく({
    読む: async () => 読んだ++,
    待つ: async () => {},
    読めているか: () => true,
  });
  assert.strictEqual(出, true);
  assert.strictEqual(読んだ, 0);
});

test('失敗したら 5 秒・15 秒・45 秒あけて読み直し、3 度目で読めたら true', async () => {
  const 待った = [];
  let 回 = 0;
  const 出 = await アイコンの字体を読んでおく({
    読む: async () => {
      if (++回 < 3) throw new Error('12000ms timeout exceeded');
    },
    待つ: async (ms) => 待った.push(ms),
    読めているか: () => false,
  });
  assert.strictEqual(出, true);
  assert.deepStrictEqual(待った, 読み直す間.slice(0, 2));
});

test('全部だめなら false。例外は外に出さない', async () => {
  const 待った = [];
  const 出 = await アイコンの字体を読んでおく({
    読む: async () => {
      throw new Error('A network error occurred.');
    },
    待つ: async (ms) => 待った.push(ms),
    読めているか: () => false,
  });
  assert.strictEqual(出, false);
  assert.deepStrictEqual(待った, 読み直す間);
});
