// 予定表の AI の答えを読む・練習日の保存の誤り（src/yoteihyou.js）
const test = require('node:test');
const assert = require('node:assert');
const { 予定表の答えを読む, 日付をそろえる, 練習日の保存の誤り } = require('../src/yoteihyou');

const 日だけ = (並び) => 並び.map((x) => x.date);

test('頼んだ形の答えをそのまま読む', () => {
  assert.deepStrictEqual(予定表の答えを読む('[{"date":"2026-11-03","reason":"練習"}]'), [
    { date: '2026-11-03', reason: '練習' },
  ]);
});

test('形が少し違う答えも読む（囲み・包み・日付だけ・前後の説明・書き方の違い）', () => {
  assert.deepStrictEqual(日だけ(予定表の答えを読む('```json\n[{"date":"2026-11-3"}]\n```')), ['2026-11-03']);
  assert.deepStrictEqual(日だけ(予定表の答えを読む('{"days":[{"date":"2026/11/05","reason":"練習"}]}')), [
    '2026-11-05',
  ]);
  assert.deepStrictEqual(日だけ(予定表の答えを読む('{"date":"2026-11-07"}')), ['2026-11-07']);
  assert.deepStrictEqual(日だけ(予定表の答えを読む('["2026-11-08","2026.11.9"]')), ['2026-11-08', '2026-11-09']);
  assert.deepStrictEqual(
    日だけ(予定表の答えを読む('次のとおりです。\n[{"日付":"2026-11-10","理由":"練習"}]\n以上です。')),
    ['2026-11-10']
  );
  assert.deepStrictEqual(予定表の答えを読む('{"practiceDays":[{"date":"2026-11-11"}]}')[0].reason, '');
});

test('ありえない日付・日付でないものは落とし、同じ日は 1 つにする', () => {
  assert.deepStrictEqual(
    日だけ(予定表の答えを読む('[{"date":"2026-02-30"},{"date":"練習"},{"date":"2026-11-12"},{"date":"2026-11-12"},null]')),
    ['2026-11-12']
  );
  assert.deepStrictEqual(予定表の答えを読む('[]'), []);
});

test('読めない答えは日本語の誤り（英文の JSON の誤りは見せない）', () => {
  assert.throws(() => 予定表の答えを読む(''), /空/);
  assert.throws(() => 予定表の答えを読む('予定表が読めませんでした'), /AIの答えを読み取れませんでした/);
  assert.throws(() => 予定表の答えを読む('[{"date": 2026-11-03'), /AIの答えを読み取れませんでした/);
});

test('日付をそろえる', () => {
  assert.strictEqual(日付をそろえる('2026-1-5'), '2026-01-05');
  assert.strictEqual(日付をそろえる('2026-13-01'), null);
  assert.strictEqual(日付をそろえる('11/3'), null);
  assert.strictEqual(日付をそろえる(20261103), null);
});

test('保存の誤り：付け外しと予定表で同じ文。権限で断られたら入り直しを促す', () => {
  const 権限 = 練習日の保存の誤り({ code: 'permission-denied' });
  assert.strictEqual(権限.見出し, '保存できませんでした');
  assert.strictEqual(権限.権限, true);
  assert.match(権限.文, /ログインし直して/);
  const 通信 = 練習日の保存の誤り(new Error('Failed to fetch'));
  assert.strictEqual(通信.権限, false);
  assert.match(通信.文, /電波の良い場所/);
  assert.strictEqual(練習日の保存の誤り(null).権限, false);
});
