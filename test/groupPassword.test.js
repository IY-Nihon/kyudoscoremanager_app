/**
 * 団体のパスワードを変える（src/groupPassword.js。2026-11-26 U1）の欄の確かめと誤りの訳
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 入れ替えを確かめる, 誤りの訳 } = require('../src/groupPassword');

test('空の欄は欄ごとに知らせる', () => {
  assert.deepEqual(入れ替えを確かめる({}), {
    今: '今のパスワードを入力してください',
    新しい: '新しいパスワードを入力してください',
  });
});

test('新しいパスワードは 6 文字以上・今と違う・2 回同じ', () => {
  assert.deepEqual(入れ替えを確かめる({ 今: 'abcdef', 新しい: 'abc', もう一度: 'abc' }), {
    新しい: '6文字以上にしてください',
  });
  assert.deepEqual(入れ替えを確かめる({ 今: 'abcdef', 新しい: 'abcdef', もう一度: 'abcdef' }), {
    新しい: '今と同じパスワードです',
  });
  assert.deepEqual(入れ替えを確かめる({ 今: 'abcdef', 新しい: 'ghijkl', もう一度: 'ghijkm' }), {
    もう一度: '同じパスワードを2回入力してください',
  });
  assert.deepEqual(入れ替えを確かめる({ 今: 'abcdef', 新しい: 'ghijkl', もう一度: 'ghijkl' }), {});
});

test('Firebase の誤りを欄に振り分ける', () => {
  assert.deepEqual(誤りの訳({ code: 'auth/invalid-credential' }), { 欄: '今', 文: 'パスワードが違います' });
  assert.deepEqual(誤りの訳({ code: 'auth/wrong-password' }).欄, '今');
  assert.deepEqual(誤りの訳({ code: 'auth/weak-password' }).欄, '新しい');
  assert.equal(誤りの訳({ code: 'auth/network-request-failed' }).欄, null);
  assert.equal(誤りの訳({ code: 'auth/too-many-requests' }).欄, '今');
  assert.equal(誤りの訳(new Error('x')).欄, null);
});
