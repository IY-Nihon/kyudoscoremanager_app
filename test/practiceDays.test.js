// 正規練習日の読み出し（src/practiceDays.js）。同じ団体なら 5 分は控えを使う
const test = require('node:test');
const assert = require('node:assert');
const { 練習日を読む, 控えを捨てる } = require('../src/practiceDays');

test('団体が無ければ読まずに空', async () => {
  控えを捨てる();
  let 読んだ = 0;
  const 出 = await 練習日を読む(null, { 読む: async () => (読んだ++, { '2026-09-06': {} }) });
  assert.deepStrictEqual(出, {});
  assert.strictEqual(読んだ, 0);
});

test('同じ団体は 5 分は控えを返し、別の団体や 5 分過ぎたら読み直す', async () => {
  控えを捨てる();
  let 読んだ = 0;
  const 読む = async (団体) => (読んだ++, { [団体]: {} });
  assert.deepStrictEqual(await 練習日を読む('g1', { 読む, 今: 1000 }), { g1: {} });
  assert.deepStrictEqual(await 練習日を読む('g1', { 読む, 今: 1000 + 4 * 60 * 1000 }), { g1: {} });
  assert.strictEqual(読んだ, 1, '4 分後は控え');
  await 練習日を読む('g2', { 読む, 今: 1000 + 4 * 60 * 1000 });
  assert.strictEqual(読んだ, 2, '別の団体は読む');
  await 練習日を読む('g2', { 読む, 今: 1000 + 10 * 60 * 1000 });
  assert.strictEqual(読んだ, 3, '5 分過ぎたら読み直す');
});
