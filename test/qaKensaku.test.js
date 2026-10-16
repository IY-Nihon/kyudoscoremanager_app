/**
 * AI の相談役の Q&A 探し（chatKnowledge.js の selectQAs）が、使う人の言い回しで正しい Q&A を渡せるか。
 * 質問は使う人が打ちそうな言い回しで書いた（test/helpers/qaKensakuMondai*.cjs）。
 * Q&A の文やキーワードを直して外れたら、キーワードに言い換えを足す（scripts/qa-kensaku-hakaru.cjs で外れを見る）
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { selectQAs } = require('../src/chatKnowledge.js');

const 外れ = (問題) =>
  問題.filter(({ 問, 正 }) => {
    const 渡した = selectQAs(問, false);
    return !正.some((q) => 渡した.includes(q + ':'));
  });

test('Q&A 探し：1 組目の質問は、正しい Q&A を全部渡す', () => {
  const 出 = 外れ(require('./helpers/qaKensakuMondai.cjs'));
  assert.deepStrictEqual(出.map((x) => x.問), []);
});

test('Q&A 探し：2 組目の質問も、正しい Q&A を全部渡す', () => {
  const 出 = 外れ(require('./helpers/qaKensakuMondai2.cjs'));
  assert.deepStrictEqual(出.map((x) => x.問), []);
});
