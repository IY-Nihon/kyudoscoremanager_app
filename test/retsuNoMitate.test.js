/**
 * 記録表の列ごとの見立て（src/retsuNoMitate.js）の検査。
 *
 *   npm test
 *
 * 列（ArcherColumnView）は以前、一覧をまるごと受け取って自分で数えていた。
 * 親で数字と文字に直して渡す作りにしたので、数え方が前と同じであることを押さえる。
 * 数え方の元（teamGrouping）はあちらの検査で見ているので、ここは組み立てを見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 列の見立てを作る } = require('../src/retsuNoMitate');

const 射手 = (id, marks, 余り) => Object.assign({ id, name: id, marks }, 余り);
const 区切り = (id, 余り) => Object.assign({ id, name: '---', isSeparator: true, marks: [] }, 余り);
const 計 = (id, 余り) => Object.assign({ id, name: '計', isTotalCalculator: true, marks: [] }, 余り);

test('射位と人数は、区切りと計を除いた並びで数える', () => {
  const 見立て = 列の見立てを作る([区切り('s1'), 射手('a', []), 射手('b', []), 計('t'), 射手('c', [])], 8);
  assert.deepStrictEqual(
    見立て.map((x) => x.射位の番),
    [-1, 0, 1, -1, 2]
  );
  assert.ok(見立て.every((x) => x.人数 === 3));
});

test('鍵が効くのは、右どなり（並びで手前）が射手の列だけ', () => {
  const 見立て = 列の見立てを作る([射手('a', []), 計('t1'), 区切り('s'), 射手('b', []), 計('t2')], 8);
  assert.deepStrictEqual(
    見立て.map((x) => x.鍵が効く),
    [false, true, false, false, true]
  );
});

test('計の列は、受け持つ射手の○を立ごとに数える', () => {
  const 一覧 = [
    射手('a', ['○', '○', '×', '○', '○', '×', '×', '×']),
    射手('b', ['×', '○', '○', '○', '○', '○', '○', '○']),
    計('t'),
  ];
  const 見立て = 列の見立てを作る(一覧, 8);
  assert.strictEqual(見立て[2].合計の的中, 11);
  assert.strictEqual(見立て[2].立の的中, '6,5');
  // 射手の列は数を持たない（自分の○×から数える）
  assert.strictEqual(見立て[0].立の的中, '');
});

test('埋まった立は、受け持つ射手の全員が入れ終えた立だけ', () => {
  const 一覧 = [
    射手('a', ['○', '○', '×', '○', '○', '', '', '']),
    射手('b', ['×', '○', '○', '○', '', '', '', '']),
    区切り('s'),
  ];
  const 見立て = 列の見立てを作る(一覧, 8);
  assert.strictEqual(見立て[2].埋まった立, '0');
  // 鍵が効かない列（先頭）は空
  assert.strictEqual(列の見立てを作る([区切り('s'), 射手('a', ['○', '○', '○', '○'])], 4)[0].埋まった立, '');
});

test('区切りにチーム名を付けると、そこから右の射手にチームの色が付く', () => {
  const 一覧 = [
    区切り('s', { teamName: 'A大' }),
    射手('a', []),
    射手('b', []),
    区切り('s2', { teamName: 'B大' }),
    射手('c', []),
  ];
  const 見立て = 列の見立てを作る(一覧, 4);
  assert.ok(見立て[1].チームの色 && 見立て[1].チームの色 === 見立て[2].チームの色, '同じチームは同じ色');
  assert.ok(見立て[4].チームの色 && 見立て[4].チームの色 !== 見立て[1].チームの色, '別のチームは別の色');
});

test('空の並びや欠けた要素でも落ちない', () => {
  assert.deepStrictEqual(列の見立てを作る(undefined, 8), []);
  const 見立て = 列の見立てを作る([null, 射手('a', [])], 8);
  assert.strictEqual(見立て.length, 2);
  assert.strictEqual(見立て[1].射位の番, 0);
});
