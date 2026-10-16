/**
 * 区分（src/kubun.js）。足す・直す・消す・並べ替える・絞る・まとめる。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const 区 = require('../src/kubun.js');

const 一覧 = [
  { id: 'a', name: '一般' },
  { id: 'b', name: '学生' },
  { id: 'c', name: '少年' },
];

test('区分たち：形の崩れたもの・同じ id の重なりを落とす', () => {
  assert.deepStrictEqual(区.区分たち(null), []);
  assert.deepStrictEqual(
    区.区分たち([
      { id: 'a', name: ' 一般 ' },
      { id: 'a', name: '重なり' },
      { id: '', name: 'x' },
      { id: 'b', name: '  ' },
      null,
    ]),
    [{ id: 'a', name: '一般' }]
  );
});

test('足す：空・同じ名前は断る。名前は整えて足す', () => {
  assert.deepStrictEqual(区.区分を足す(一覧, '  ', 'd'), { 誤り: '区分の名前を入れてください' });
  assert.deepStrictEqual(区.区分を足す(一覧, '学生', 'd'), { 誤り: '「学生」はもうあります' });
  const { 一覧: 次 } = 区.区分を足す(一覧, ' Aチーム  ', 'd');
  assert.deepStrictEqual(次[3], { id: 'd', name: 'Aチーム' });
  assert.strictEqual(
    区.区分を足す([], 'あいうえおかきくけこさしすせそ', 'e').一覧[0].name.length,
    区.名前の上限
  );
  assert.match(区.区分を足す([], '一般').一覧[0].id, /^k/, 'id を省くと作る');
});

test('名前を直す：ほかの区分と同じ名前は断る。自分と同じ名前は通す', () => {
  assert.deepStrictEqual(区.区分の名前を直す(一覧, 'a', '学生'), { 誤り: '「学生」はもうあります' });
  assert.strictEqual(区.区分の名前を直す(一覧, 'a', '一般').一覧[0].name, '一般');
  assert.strictEqual(区.区分の名前を直す(一覧, 'a', '社会人').一覧[0].name, '社会人');
});

test('消す・動かす（端では動かない）', () => {
  assert.deepStrictEqual(
    区.区分を消す(一覧, 'b').map((x) => x.id),
    ['a', 'c']
  );
  assert.deepStrictEqual(
    区.区分を動かす(一覧, 'b', -1).map((x) => x.id),
    ['b', 'a', 'c']
  );
  assert.deepStrictEqual(
    区.区分を動かす(一覧, 'b', 1).map((x) => x.id),
    ['a', 'c', 'b']
  );
  assert.deepStrictEqual(
    区.区分を動かす(一覧, 'a', -1).map((x) => x.id),
    ['a', 'b', 'c']
  );
  assert.deepStrictEqual(
    区.区分を動かす(一覧, 'c', 1).map((x) => x.id),
    ['a', 'b', 'c']
  );
  assert.deepStrictEqual(
    区.区分を動かす(一覧, 'z', 1).map((x) => x.id),
    ['a', 'b', 'c']
  );
});

test('人の区分：今の一覧にあるものだけを一覧の順で。消した区分の id は無いものとして読む', () => {
  const 人 = { divisionIds: ['c', 'x', 'a'] };
  assert.deepStrictEqual(
    区.人の区分(人, 一覧).map((x) => x.id),
    ['a', 'c']
  );
  assert.strictEqual(区.人の区分の名前(人, 一覧), '一般・少年');
  assert.strictEqual(区.人の区分の名前({}, 一覧), '');
  assert.deepStrictEqual(区.付けられる区分(['c', 'x', 'c'], 一覧), ['c']);
});

test('絞る・まとめる：2 つ持つ人は両方に。区分なしは最後。人の居ない組は出さない', () => {
  const 人たち = [
    { id: 1, divisionIds: ['a', 'b'] },
    { id: 2, divisionIds: ['a'] },
    { id: 3 },
    { id: 4, divisionIds: ['x'] },
  ];
  assert.deepStrictEqual(
    区.区分で絞る(人たち, 'a').map((x) => x.id),
    [1, 2]
  );
  assert.strictEqual(区.区分で絞る(人たち, null).length, 4);
  const 組 = 区.区分でまとめる(人たち, 一覧);
  assert.deepStrictEqual(
    組.map((x) => [x.題, x.人たち.map((y) => y.id)]),
    [
      ['一般', [1, 2]],
      ['学生', [1]],
      ['区分なし', [3, 4]],
    ]
  );
});
