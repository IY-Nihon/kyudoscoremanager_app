// 正規練習日の読み出し（src/practiceDays.js）。同じ団体なら 5 分は控えを使う
const test = require('node:test');
const assert = require('node:assert');
const { 練習日を読む, 練習日を置く, 覚える形, 控えを捨てる } = require('../src/practiceDays');

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

test('出欠の画面が置いた練習日は、AI に聞かれても読み直さない（別の団体は読む）', async () => {
  控えを捨てる();
  let 読んだ = 0;
  const 読む = async () => (読んだ++, {});
  練習日を置く('g1', { '2026-11-03': { date: '2026-11-03' } }, 1000);
  assert.deepStrictEqual(await 練習日を読む('g1', { 読む, 今: 2000 }), { '2026-11-03': { date: '2026-11-03' } });
  assert.strictEqual(読んだ, 0);
  await 練習日を読む('g2', { 読む, 今: 2000 });
  assert.strictEqual(読んだ, 1);
  練習日を置く(null, { x: {} });
  練習日を置く('g3', null);
  assert.strictEqual(読んだ, 1, '団体か練習日が無ければ置かない');
});

test('端末に覚える形は日付だけ（作った日時などは落とす）', () => {
  assert.deepStrictEqual(覚える形({ '2026-11-03': { date: '2026-11-03', created: { seconds: 1 } } }), {
    '2026-11-03': { date: '2026-11-03' },
  });
  assert.deepStrictEqual(覚える形(null), {});
});

test('練習日の控えは端末に覚え、別の団体へ入るときとログアウトで捨てる', () => {
  const { ストアを用意する } = require('./helpers/storeHarness');
  const { store } = ストアを用意する();
  const 控え = { 団体: '100001', 練習日: { '2026-11-03': { date: '2026-11-03' } } };
  store.setState({ 練習日の控え: 控え });
  assert.deepStrictEqual(store.persist.getOptions().partialize(store.getState()).練習日の控え, 控え);
  store.getState().setAuth('100002', 'group', null, 'b@example.com', '100002');
  assert.strictEqual(store.getState().練習日の控え, null, '別の団体へ入ると捨てる');
  store.setState({ 練習日の控え: 控え });
  store.getState().setAuth(null, null, null, null);
  assert.strictEqual(store.getState().練習日の控え, null, 'ログアウトで捨てる');
});
