/**
 * 初めの案内で、AI に届かなかったときに文から部員を読み取る控えの道の検査。
 *
 *   npm test
 *
 * 案内の例文どおりに打った人の名前に、助詞（「の山田」）が残ってはいけない。
 * 名前が読めないときに、架空の名前で確認のカードを出してもいけない。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { 入力から部員を読み取る: 読む } = require('../src/chatMemberParse');

test('案内の例文どおりなら、名前・学年・性別がそのまま読める', () => {
  assert.deepEqual(読む('1年の山田 太郎 男子 を追加して'), { name: '山田 太郎', grade: 1, gender: '男子' });
});

test('助詞・敬称・「ください」・全角の数字が名前に残らない', () => {
  assert.deepEqual(読む('1年生の田中 女子を追加してください'), { name: '田中', grade: 1, gender: '女子' });
  assert.deepEqual(読む('３年男子の高橋を部員に追加'), { name: '高橋', grade: 3, gender: '男子' });
  assert.deepEqual(読む('佐藤さんを登録して'), { name: '佐藤', grade: 1, gender: '未設定' });
  assert.deepEqual(読む('2年 佐藤花子 女子'), { name: '佐藤花子', grade: 2, gender: '女子' });
});

test('名前の中の「男」「女」の字で性別を決めない', () => {
  assert.equal(読む('山田一男を追加').gender, '未設定');
  assert.equal(読む('山田一男を追加').name, '山田一男');
});

test('名前が残らない・追加の言葉も学年も無いときは null（架空の名前は作らない）', () => {
  assert.equal(読む('追加して'), null);
  assert.equal(読む('1年男子を追加して'), null);
  assert.equal(読む('こんにちは'), null);
  assert.equal(読む(''), null);
  assert.equal(読む(null), null);
});
