'use strict';
const test = require('node:test');
const assert = require('node:assert');

test('名前の指示文：○×は読ませず、名前・人数・マスの数だけを JSON で答えさせる', () => {
  const { 名前の指示文 } = require('../src/ocrPrompts');
  const 文 = 名前の指示文({ 枚数: 1, 向き: '左右から' });
  assert.ok(文.includes('○×の印は読まなくて構いません'));
  assert.ok(文.includes('"cell_count"'));
  assert.ok(!文.includes('"cells"'), 'cells を出させていない');
  assert.ok(!文.includes('右上から左下へ線を引く'), '2 射の書き方の決まりは要らない');
  // 端末が数えた人数を添えると、人数どおりに rows を出させる
  const 人数つき = 名前の指示文({ 列の数たち: [8, 7] });
  assert.ok(人数つき.includes('1つ目の板は 8 人、2つ目の板は 7 人'));
});
