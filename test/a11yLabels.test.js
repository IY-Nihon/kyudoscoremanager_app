/**
 * 読み上げの言葉（src/a11yLabels.js）。
 *
 *   npm test
 *
 * 画面の字のままだと「まる」「かける」と読まれ、押す前に何のますかも
 * 分からない。ここで組む言葉が、目の見えない人にとっての画面そのものになる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  射位の名前,
  印の読み,
  立ちと射の読み,
  ますの読み,
  射手の読み,
  合計の読み,
} = require('../src/a11yLabels');

test('射位の名前：先頭は大前、最後は落、あいだはN番', () => {
  assert.strictEqual(射位の名前(0, 5), '大前');
  assert.strictEqual(射位の名前(1, 5), '2番');
  assert.strictEqual(射位の名前(3, 5), '4番');
  assert.strictEqual(射位の名前(4, 5), '落');
});

test('射位の名前：1人だけのときは落と呼ばない', () => {
  // 1人で「落」と呼ぶことはない
  assert.strictEqual(射位の名前(0, 1), '大前');
});

test('射位の名前：chatStats と同じ呼び方になっている', () => {
  // AIの答えと読み上げで呼び方が食い違うと、同じ人の話だと分からなくなる
  const chat = (番, 人数) =>
    番 === 0 ? '大前' : 番 === 人数 - 1 && 人数 > 1 ? '落' : `${番 + 1}番`;
  for (let 人数 = 1; 人数 <= 8; 人数++)
    for (let 番 = 0; 番 < 人数; 番++)
      assert.strictEqual(射位の名前(番, 人数), chat(番, 人数), `${人数}人の${番}番目`);
});

test('印の読み：まる・かけると読ませない', () => {
  assert.strictEqual(印の読み('○'), '的中');
  assert.strictEqual(印の読み('×'), 'はずれ');
  assert.strictEqual(印の読み('☓'), 'はずれ');
  assert.strictEqual(印の読み(''), '未記入');
  assert.strictEqual(印の読み(null), '未記入');
  assert.strictEqual(印の読み(undefined), '未記入');
});

test('立ちと射：4本で1立ち', () => {
  assert.deepStrictEqual(立ちと射の読み(0), { 立ち: 1, 射: 1 });
  assert.deepStrictEqual(立ちと射の読み(3), { 立ち: 1, 射: 4 });
  assert.deepStrictEqual(立ちと射の読み(4), { 立ち: 2, 射: 1 });
  assert.deepStrictEqual(立ちと射の読み(7), { 立ち: 2, 射: 4 });
  assert.deepStrictEqual(立ちと射の読み(8), { 立ち: 3, 射: 1 });
});

test('ますの読み：頼まれた形になる', () => {
  assert.strictEqual(
    ますの読み({ 射手名: '山田太郎', 番: 0, 人数: 5, 射番: 0, 印: '○' }),
    '1立目 大前 山田太郎 1射目 的中'
  );
  assert.strictEqual(
    ますの読み({ 射手名: '佐藤花子', 番: 4, 人数: 5, 射番: 6, 印: '×' }),
    '2立目 落 佐藤花子 3射目 はずれ'
  );
});

test('ますの読み：名前が無くても、どの列か分かる', () => {
  // 黙って飛ばすと、どの列の話か分からなくなる
  assert.strictEqual(
    ますの読み({ 射手名: '', 番: 1, 人数: 3, 射番: 0, 印: '' }),
    '1立目 2番 名前未設定 1射目 未記入'
  );
  assert.strictEqual(
    ますの読み({ 射手名: '  ', 番: 0, 人数: 1, 射番: 0, 印: '○' }),
    '1立目 大前 名前未設定 1射目 的中'
  );
});

test('ますの読み：中身が欠けていても落ちない', () => {
  assert.doesNotThrow(() => ますの読み({}));
  assert.strictEqual(ますの読み({}), '1立目 大前 名前未設定 1射目 未記入');
});

test('射手の読み：射位と名前と成績', () => {
  assert.strictEqual(
    射手の読み({ 射手名: '山田太郎', 番: 0, 人数: 5, marks: ['○', '×', '○', ''] }),
    '大前 山田太郎 3射中2的中'
  );
});

test('射手の読み：まだ記録が無いときは、そう言う', () => {
  // 「0射中0的中」だと、記録し忘れなのか外したのか分からない
  assert.strictEqual(
    射手の読み({ 射手名: '山田太郎', 番: 0, 人数: 2, marks: ['', '', '', ''] }),
    '大前 山田太郎 まだ記録なし'
  );
  assert.strictEqual(射手の読み({ 射手名: '山田', 番: 1, 人数: 2 }), '落 山田 まだ記録なし');
});

test('合計の読み', () => {
  assert.strictEqual(合計の読み(20, 13), '20射中13的中');
  assert.strictEqual(合計の読み(0, 0), 'まだ記録なし');
  assert.strictEqual(合計の読み(null, null), 'まだ記録なし');
});
