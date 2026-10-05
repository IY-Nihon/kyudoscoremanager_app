/**
 * 矢所の画面の決まり（src/yadokoroRules.js）の検査。2026-10-05 に作り直した入れ方。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const 決まり = require('../src/yadokoroRules');

const 人 = (id, 印 = [], 矢所 = [], 他 = {}) =>
  Object.assign({ id, name: id, marks: 印, arrowLocations: 矢所 }, 他);
const 区切り = (id, teamName = '---') => ({ id, isSeparator: true, teamName });
const 計 = (id) => ({ id, isTotalCalculator: true });
const 点 = { x: 0, y: 0 };
const 射 = (射手ID, 射番) => ({ 射手ID, 射番 });

test('的の割合：霞的・星的 36cm は 0.75、星的 24cm は 0.5（前の窓・分析の的と同じ）', () => {
  assert.equal(決まり.的の割合('kasumi36'), 0.75);
  assert.equal(決まり.的の割合('hoshi36'), 0.75);
  assert.equal(決まり.的の割合('hoshi24'), 0.5);
  assert.equal(決まり.的の割合(undefined), 0.75);
});

test('組に分ける：区切りと計の列で分かれ、空の組は作らない', () => {
  const 組たち = 決まり.組に分ける([人('a'), 人('b'), 区切り('s1'), 区切り('s2'), 人('c'), 計('t'), 人('d')]);
  assert.deepEqual(
    組たち.map((組) => 組.map((x) => x.id)),
    [['a', 'b'], ['c'], ['d']]
  );
  assert.deepEqual(決まり.組に分ける([]), []);
});

test('立の射番：射数を超えない（10 射なら 3 立目は 2 本）', () => {
  assert.deepEqual(決まり.立の射番(0, 8), [0, 1, 2, 3]);
  assert.deepEqual(決まり.立の射番(2, 10), [8, 9]);
  assert.equal(決まり.立の数(10), 3);
  assert.equal(決まり.立の数(0), 1);
});

test('射の順（人を回る）：立ごと → 組ごと → 射ごと → 組のメンバーの並び順', () => {
  const 順 = 決まり.射の順([人('a'), 人('b'), 区切り('s'), 人('c')], 8, '人を回る');
  const 字 = 順.map((x) => x.射手ID + x.射番);
  assert.deepEqual(字.slice(0, 12), ['a0', 'b0', 'a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'c0', 'c1', 'c2', 'c3']);
  assert.deepEqual(字.slice(12, 14), ['a4', 'b4']);
  assert.equal(順.length, 24);
});

test('射の順（同じ人）：メンバーごとに 1 射目から最後まで', () => {
  const 字 = 決まり.射の順([人('a'), 区切り('s'), 人('b')], 4, '同じ人').map((x) => x.射手ID + x.射番);
  assert.deepEqual(字, ['a0', 'a1', 'a2', 'a3', 'b0', 'b1', 'b2', 'b3']);
});

test('置いてあるか：○×が空の射に残った位置は、置いていないと見る', () => {
  assert.equal(決まり.置いてあるか(人('a', ['○'], [点]), 0), true);
  assert.equal(決まり.置いてあるか(人('a', [''], [点]), 0), false);
  assert.equal(決まり.置いてあるか(人('a', ['×'], [null]), 0), false);
  assert.equal(決まり.置いてあるか(null, 0), false);
});

test('次の射：後ろの置いていない射。後ろに無ければ頭から（飛ばした射に戻る）。全部あれば null', () => {
  const 盤 = [
    人('a', ['○', '', '', ''], [点, null, null, null]),
    人('b', ['○', '', '', ''], [点, null, null, null]),
  ];
  assert.deepEqual(決まり.次の射(盤, 4, '人を回る', 射('a', 0)), 射('a', 1));
  // b1 から：a2 b2 … と進む。置いていない射は飛ばさない
  assert.deepEqual(決まり.次の射(盤, 4, '人を回る', 射('b', 1)), 射('a', 2));
  // 最後（b3）からは頭へ戻って、置いていない最初の射（a1）
  assert.deepEqual(決まり.次の射(盤, 4, '人を回る', 射('b', 3)), 射('a', 1));
  // 同じ人なら、その人の次の射
  assert.deepEqual(決まり.次の射(盤, 4, '同じ人', 射('a', 0)), 射('a', 1));
  // 全部置いてあれば null
  const 全部 = [人('a', ['○', '×'], [点, { x: 2, y: 0 }])];
  assert.equal(決まり.次の射(全部, 2, '人を回る', 射('a', 0)), null);
  // いまの射が盤に無いときは頭から
  assert.deepEqual(決まり.次の射(盤, 4, '人を回る', 射('消えた人', 0)), 射('a', 1));
});

test('開く射：置いてあれば続きから。無ければ○×の入った最初の射。それも無ければ最初の射', () => {
  // 続き：いちばん後ろに置いた射（b0）の次の置いていない射
  const 盤 = [人('a', ['○', '○'], [点, null]), 人('b', ['○', ''], [点, null])];
  assert.deepEqual(決まり.開く射(盤, 4, '人を回る'), 射('a', 1));
  // 印だけ先に入れたとき：○×の入った最初の射
  const 印だけ = [人('a', ['', '○'], []), 人('b', ['×', ''], [])];
  assert.deepEqual(決まり.開く射(印だけ, 4, '人を回る'), 射('b', 0));
  // 空の盤
  assert.deepEqual(決まり.開く射([人('a')], 4, '人を回る'), 射('a', 0));
  assert.equal(決まり.開く射([], 4, '人を回る'), null);
  assert.equal(決まり.開く射([区切り('s')], 4, '人を回る'), null);
});

test('射があるか：消えた人・射数の外は無い', () => {
  const 盤 = [人('a')];
  assert.equal(決まり.射があるか(盤, 8, 射('a', 7)), true);
  assert.equal(決まり.射があるか(盤, 4, 射('a', 7)), false);
  assert.equal(決まり.射があるか(盤, 8, 射('b', 0)), false);
  assert.equal(決まり.射があるか(盤, 8, null), false);
});

test('押した所：的の中心が 0・縁が 1。四角の外で離したら null', () => {
  const 枠 = { left: 100, top: 50, width: 400, height: 400 };
  // 霞的：的の半径は 400 × 0.75 / 2 = 150
  assert.deepEqual(決まり.押した所(300, 250, 枠, 'kasumi36'), { x: 0, y: 0, 内側: true });
  const 縁 = 決まり.押した所(450, 250, 枠, 'kasumi36');
  assert.equal(縁.x, 1);
  assert.equal(縁.内側, true);
  const 外 = 決まり.押した所(480, 250, 枠, 'kasumi36');
  assert.ok(外.x > 1 && !外.内側);
  // 星的 24cm：半径は 100。同じ所でも縁の外
  const 星 = 決まり.押した所(450, 250, 枠, 'hoshi24');
  assert.equal(星.x, 1.5);
  assert.equal(星.内側, false);
  // 四角の外
  assert.equal(決まり.押した所(99, 250, 枠, 'kasumi36'), null);
  assert.equal(決まり.押した所(300, 451, 枠, 'kasumi36'), null);
  assert.equal(決まり.押した所(NaN, 250, 枠, 'kasumi36'), null);
});

test('置き方：空なら一緒に入れる。合えば矢所だけ。合わなければ聞く。見るだけ・鍵は変えない', () => {
  assert.deepEqual(決まり.置き方('', true), { する: '一緒に入れる', 印: '○' });
  assert.deepEqual(決まり.置き方(undefined, false), { する: '一緒に入れる', 印: '×' });
  assert.deepEqual(決まり.置き方('○', true), { する: '矢所だけ', 印: '○' });
  assert.deepEqual(決まり.置き方('×', false), { する: '矢所だけ', 印: '×' });
  assert.deepEqual(決まり.置き方('○', false), { する: '食い違い', 印: '×' });
  assert.deepEqual(決まり.置き方('×', true), { する: '食い違い', 印: '○' });
  assert.equal(決まり.置き方('', true, { 見るだけ: true }).する, '置けない');
  // 鍵：合う側なら矢所だけ。空や食い違いは置けない（○×を変えない）
  assert.deepEqual(決まり.置き方('○', true, { 鍵: true }), { する: '矢所だけ', 印: '○' });
  assert.equal(決まり.置き方('○', false, { 鍵: true }).する, '鍵');
  assert.equal(決まり.置き方('', true, { 鍵: true }).する, '鍵');
});

test('食い違っているか：位置と○×の側が合わないとき（あとから表で○×を直したとき）', () => {
  assert.equal(決まり.食い違っているか({ x: 0.2, y: 0 }, '○'), false);
  assert.equal(決まり.食い違っているか({ x: 0.2, y: 0 }, '×'), true);
  assert.equal(決まり.食い違っているか({ x: 1.2, y: 0 }, '○'), true);
  assert.equal(決まり.食い違っているか({ x: 1.2, y: 0 }, ''), false);
  assert.equal(決まり.食い違っているか(null, '○'), false);
});

test('的の点たち・数える：○×が空の射は載せない。立を渡せばその立ちだけ', () => {
  const 射手 = 人('a', ['○', '×', '', '○', '○'], [点, { x: 1.5, y: 0 }, 点, null, { x: 0.1, y: 0.1 }]);
  assert.deepEqual(
    決まり.的の点たち(射手).map((p) => p.射番 + p.印),
    ['0○', '1×', '4○']
  );
  assert.deepEqual(
    決まり.的の点たち(射手, 1).map((p) => p.射番),
    [4]
  );
  assert.deepEqual(決まり.数える(射手, 8, 0), { 射った: 3, 中り: 2, 置いた: 2 });
  assert.deepEqual(決まり.数える(射手, 8, null), { 射った: 4, 中り: 3, 置いた: 3 });
});

test('画面の分け方：スマホの縦は的を幅いっぱい、横長は左に的。狭い高さでも的は 140 より小さくしない', () => {
  const スマホ = 決まり.画面の分け方(393, 633);
  assert.equal(スマホ.横長, false);
  assert.ok(スマホ.的の大きさ >= 360, '的が小さい: ' + スマホ.的の大きさ);
  assert.equal(スマホ.全員を並べる, false);
  const タブレット縦 = 決まり.画面の分け方(768, 900);
  assert.equal(タブレット縦.全員を並べる, false);
  const タブレット横 = 決まり.画面の分け方(1024, 650);
  assert.equal(タブレット横.横長, true);
  assert.ok(タブレット横.的の大きさ >= 500);
  const 低い = 決まり.画面の分け方(812, 200);
  assert.equal(低い.横長, true);
  assert.equal(低い.的の大きさ, 176);
  assert.equal(決まり.画面の分け方(300, 300).的の大きさ, 140);
});

test('進み方を整える：知らない値は人を回る', () => {
  assert.equal(決まり.進み方を整える('同じ人'), '同じ人');
  assert.equal(決まり.進み方を整える('x'), '人を回る');
  assert.equal(決まり.進み方を整える(undefined), '人を回る');
});
