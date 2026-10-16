/**
 * 学年の決まり（src/gakunen.js）。いまの大学 4 年制の動きを、集める前と同じに保つ。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const 学 = require('../src/gakunen.js');

const 人 = (grade, o) => Object.assign({ grade }, o);

test('卒業生か：学年 5 か、卒業生の印のある人', () => {
  assert.strictEqual(学.卒業生か(人(5)), true);
  assert.strictEqual(学.卒業生か(人('5')), true, '文字の 5 も');
  assert.strictEqual(学.卒業生か(人(4)), false);
  assert.strictEqual(学.卒業生か(人(0)), false, 'その他は現役');
  assert.strictEqual(学.卒業生か(人(undefined)), false, '値が無いのはその他');
  assert.strictEqual(学.卒業生か(人(2, { isAlumni: true })), true);
  assert.strictEqual(学.卒業生か(人(2, { graduationYear: 2025 })), true);
  assert.strictEqual(学.卒業生か(人(2, { graduationYear: null })), false, '本番の null は印ではない');
  assert.strictEqual(学.卒業生か(null), false);
});

test('現役か・その他か', () => {
  assert.strictEqual(学.現役か(人(1)), true);
  assert.strictEqual(学.現役か(人(0)), true);
  assert.strictEqual(学.現役か(人(5)), false);
  assert.strictEqual(学.その他か(人(0)), true);
  assert.strictEqual(学.その他か(人(null)), true);
  assert.strictEqual(学.その他か(人(3)), false);
  assert.strictEqual(学.その他か(人(5)), false, '卒業生はその他ではない');
});

test('学年の名前', () => {
  assert.strictEqual(学.学年の名前(人(3)), '3年');
  assert.strictEqual(学.学年の名前(人(3), null, { 生: true }), '3年生');
  assert.strictEqual(学.学年の名前(人(0)), 'その他');
  assert.strictEqual(学.学年の名前(人(0), null, { その他: 'その他/ゲスト' }), 'その他/ゲスト');
  assert.strictEqual(学.学年の名前(人(5)), '卒業生');
  assert.strictEqual(学.学年の値の名前('5'), '卒業生');
  assert.deepStrictEqual(学.学年の名前たち(), ['1年', '2年', '3年', '4年']);
});

test('学年の順：若い学年から、その他、卒業生の順', () => {
  const 並び = [人(5), 人(0), 人(3), 人(undefined), 人(1)].sort(
    (甲, 乙) => 学.学年の順(甲) - 学.学年の順(乙)
  );
  assert.deepStrictEqual(
    並び.map((x) => x.grade),
    [1, 3, 0, undefined, 5]
  );
});

test('次の学年：1〜3 年は 1 つ上がり、4 年は卒業。その他・卒業生・値の無い人はそのまま', () => {
  assert.strictEqual(学.次の学年(1), 2);
  assert.strictEqual(学.次の学年(3), 4);
  assert.strictEqual(学.次の学年(4), 5);
  assert.strictEqual(学.次の学年('2'), 3);
  assert.strictEqual(学.次の学年(5), 5);
  assert.strictEqual(学.次の学年(0), 0);
  assert.strictEqual(学.次の学年(undefined), undefined);
  assert.strictEqual(学.次の学年('あ'), 'あ');
});

test('期の計算と卒業の年度', () => {
  assert.strictEqual(学.学年の期(53, 1), 53);
  assert.strictEqual(学.学年の期(53, 4), 50);
  assert.strictEqual(学.期を付ける学年か(3), true);
  assert.strictEqual(学.期を付ける学年か(5), true);
  assert.strictEqual(学.期を付ける学年か(0), false);
  // 今の 1 年生が 53 期・今年度が 2026 なら、53 期は 2029 年度、50 期（4 年生）は 2026 年度に卒業
  assert.strictEqual(学.卒業の年度(53, 53, 2026), 2029);
  assert.strictEqual(学.卒業の年度(50, 53, 2026), 2026);
  // 進級して今の 1 年生が 54 期になった 2027 年度、50 期の卒業生は 2026 年度まで現役だった
  assert.strictEqual(学.卒業の年度(50, 54, 2027), 2026);
});
