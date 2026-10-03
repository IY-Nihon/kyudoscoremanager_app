'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { 次の見せ方, 見せ方を整える, いまの立, 的の点たち, 開く射番 } = require('../src/arrowRowRules');

const 点 = (x, y) => ({ x, y, targetType: 'kasumi36' });

test('見せ方：全部 → 立 → 隠す → 全部。壊れた値は全部に戻す', () => {
  assert.strictEqual(次の見せ方('全部'), '立');
  assert.strictEqual(次の見せ方('立'), '隠す');
  assert.strictEqual(次の見せ方('隠す'), '全部');
  assert.strictEqual(見せ方を整える('x'), '全部');
  assert.strictEqual(見せ方を整える(undefined), '全部');
  assert.strictEqual(見せ方を整える('立'), '立');
});

test('いまの立：全員のうち、印が入っている最後の射の立。何も無ければ 0', () => {
  assert.strictEqual(いまの立([{ marks: ['', ''] }], 8), 0);
  assert.strictEqual(いまの立([{ marks: ['○', '', '', '', '×'] }], 8), 1);
  assert.strictEqual(いまの立([{ marks: ['○'] }, { marks: ['○', '○', '○', '○', '○', '○', '○', '○'] }], 8), 1);
  assert.strictEqual(いまの立([{ isSeparator: true, marks: ['○', '○', '○', '○', '○'] }, { marks: ['○'] }], 8), 0);
  assert.strictEqual(いまの立(undefined, 8), 0);
  assert.strictEqual(いまの立([{ marks: ['', '', '', '', '', '', '', '○'] }], 4), 0, '射数より先の立は作らない');
});

test('的の点：いまの印で色が決まり、印が空のますは載せない。立のときはその立だけ', () => {
  const 人 = { marks: ['○', '×', '', '○', '○'], arrowLocations: [点(0, 0), 点(1, 1), 点(2, 2), 点(0.5, 0.5), 点(-1, 0)] };
  const 全部 = 的の点たち(人, '全部', 0);
  assert.deepStrictEqual(全部.map((p) => [p.射番, p.印]), [[0, '○'], [1, '\xd7'], [3, '○'], [4, '○']]);
  const 二立 = 的の点たち(人, '立', 1);
  assert.deepStrictEqual(二立.map((p) => p.射番), [4]);
  assert.deepStrictEqual(的の点たち(undefined, '全部', 0), []);
  assert.deepStrictEqual(的の点たち({ marks: ['○'], arrowLocations: [null] }, '全部', 0), []);
});

test('開く射：矢所が置かれた、いちばん後ろの射。無ければ null', () => {
  assert.strictEqual(開く射番({ marks: ['○', '×', '○'], arrowLocations: [点(0, 0), null, 点(1, 1)] }), 2);
  assert.strictEqual(開く射番({ marks: ['○', '×', ''], arrowLocations: [点(0, 0), null, 点(1, 1)] }), 0, '印が空の射は数えない');
  assert.strictEqual(開く射番({ marks: ['○'], arrowLocations: [] }), null);
  assert.strictEqual(開く射番(undefined), null);
});
