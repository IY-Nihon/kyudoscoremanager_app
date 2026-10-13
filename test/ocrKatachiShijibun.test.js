'use strict';
// 記録の形の指示文（○× を書かせない版）の検査。ocrKatachi.test.js（ノートの形）とは別
const test = require('node:test');
const assert = require('node:assert');
const { 記録の形の指示文 } = require('../src/ocrPrompts');

test('形の指示文は ○× を書かせず、ncells・x0・x1 を求める', () => {
  const 文 = 記録の形の指示文({ 向き: '右から' });
  assert.ok(!/"cells":\[/.test(文), 'cells の例を出さない');
  assert.match(文, /"ncells":10/);
  assert.match(文, /"x0":120,"x1":480/);
  assert.match(文, /等間隔に割り振らないでください/);
});

test('端末が数えた人数を渡すと、板ごとの人数を必ず合わせるよう頼む', () => {
  const 文 = 記録の形の指示文({ 列の数たち: [8, 8] });
  assert.match(文, /1つ目は 8 人、2つ目は 8 人/);
});
