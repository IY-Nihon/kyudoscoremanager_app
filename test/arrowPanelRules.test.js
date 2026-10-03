'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { 立の数, 的を出す射手, 既定の立, 立の矢所, 立のます } = require('../src/arrowPanelRules');

const 射手 = (印, 矢所) => ({ id: 'a', name: 'x', marks: 印, arrowLocations: 矢所 || [] });
const 点 = (x, y, mark = '○') => ({ x, y, mark, targetType: 'kasumi36' });

test('立の数：4 本ずつ、切り上げ', () => {
  assert.strictEqual(立の数(8), 2);
  assert.strictEqual(立の数(20), 5);
  assert.strictEqual(立の数(6), 2);
  assert.strictEqual(立の数(0), 1);
});

test('的を出す射手は、区切りと計を除く', () => {
  assert.strictEqual(的を出す射手([{ id: 1 }, { isSeparator: true }, { isTotalCalculator: true }, null]).length, 1);
});

test('既定の立：印が入っているいちばん後ろの立。何も無ければ 0', () => {
  assert.strictEqual(既定の立([射手(['', '', '', '', '', '', '', ''])], 8), 0);
  assert.strictEqual(既定の立([射手(['○', '', '', '', '', '', '', ''])], 8), 0);
  assert.strictEqual(既定の立([射手(['○', '', '', '', '×', '', '', ''])], 8), 1);
  assert.strictEqual(既定の立([射手(['○', '', '', '', '']), 射手(['', '', '', '', '', '', '', '○'])], 8), 1);
});

test('立の矢所：その立だけ・番号は立の中・印はいまの印・印が空は載せない', () => {
  const 人 = 射手(['○', '×', '', '○', '○', '', '', ''], [点(0, 0), 点(1, 1, '○'), 点(2, 2), 点(0.5, 0.5), 点(-1, 0)]);
  const 一立 = 立の矢所(人, 0, 8);
  assert.strictEqual(一立.length, 8);
  assert.strictEqual(一立[0].shotIndex, 0);
  assert.strictEqual(一立[1].mark, '\xd7', '保存時は○でも、いまは×なら×');
  assert.strictEqual(一立[2], null, '印が空のますは載せない');
  assert.strictEqual(一立[3].shotIndex, 3);
  assert.strictEqual(一立[4], null, '別の立は載せない');
  const 二立 = 立の矢所(人, 1, 8);
  assert.strictEqual(二立[4].shotIndex, 0);
  assert.strictEqual(二立[4].x, -1);
  assert.strictEqual(二立[0], null);
});

test('立の矢所・立のます：壊れた入力でも落ちない', () => {
  assert.deepStrictEqual(立の矢所(undefined, 0, 4), [null, null, null, null]);
  assert.deepStrictEqual(立のます(undefined, 0, 4).map((x) => x.印), ['', '', '', '']);
  const ます = 立のます(射手(['○', '×'], [点(0, 0)]), 0, 8);
  assert.deepStrictEqual(ます.map((x) => [x.射番, x.印, x.矢所あり]), [[0, '○', true], [1, '×', false], [2, '', false], [3, '', false]]);
});
