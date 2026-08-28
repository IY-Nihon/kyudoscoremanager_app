/**
 * 比較のひな型（src/comparePresets.js）。
 *
 *   npm test
 *
 * ひな型は部員IDだけを持つ。改名や同姓同名で別人を呼び出さないことと、
 * 団体をまたいで出てこないことを重点的に見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  この団体のひな型,
  ひな型を足す,
  ひな型を消す,
  ひな型を当てはめる,
  ひな型の上限,
} = require('../src/comparePresets');

const 足す = (一覧, 名前, ids, 団体id, いま) =>
  ひな型を足す(一覧, { 名前, 部員idたち: ids, 団体id: 団体id || 'g1' }, いま || 1000);

test('足す：名前と部員IDを持つ。氏名は持たない', () => {
  const r = 足す([], '一年生', ['m1', 'm2']);
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].名前, '一年生');
  assert.deepStrictEqual(r[0].部員idたち, ['m1', 'm2']);
  assert.ok(r[0].id, 'idが無いと消せない');
  assert.strictEqual(JSON.stringify(r[0]).includes('name'), false, '氏名を持つと改名で別人になる');
});

test('足す：同じ名前は入れ替える（同じ名前が並ぶと選べない）', () => {
  let r = 足す([], '主力', ['m1']);
  r = 足す(r, '主力', ['m2', 'm3']);
  assert.strictEqual(r.length, 1);
  assert.deepStrictEqual(r[0].部員idたち, ['m2', 'm3']);
});

test('足す：同じ名前でも団体が違えば別のひな型', () => {
  let r = 足す([], '主力', ['m1'], 'g1');
  r = 足す(r, '主力', ['m9'], 'g2');
  assert.strictEqual(r.length, 2);
});

test('足す：名前が空、または一人も選んでいなければ足さない', () => {
  assert.strictEqual(足す([], '', ['m1']).length, 0);
  assert.strictEqual(足す([], '   ', ['m1']).length, 0);
  assert.strictEqual(足す([], '主力', []).length, 0);
});

test('足す：前後の空白は落とし、長すぎる名前は切り詰める', () => {
  const r = 足す([], '  主力  ', ['m1']);
  assert.strictEqual(r[0].名前, '主力');
  assert.strictEqual(足す([], 'あ'.repeat(50), ['m1'])[0].名前.length, 20);
});

test('足す：同じ人を2回選んでも1回に数える', () => {
  assert.deepStrictEqual(足す([], '主力', ['m1', 'm1', 'm2'])[0].部員idたち, ['m1', 'm2']);
});

test('足す：数字と文字のIDが混ざっても、文字として揃える', () => {
  assert.deepStrictEqual(足す([], '主力', [1, '2'])[0].部員idたち, ['1', '2']);
});

test('足す：上限を超えたら、その団体の古いものから捨てる', () => {
  let r = [];
  for (let i = 0; i < ひな型の上限 + 3; i++) r = 足す(r, 'ひな型' + i, ['m' + i], 'g1', 1000 + i);
  assert.strictEqual(r.length, ひな型の上限);
  assert.strictEqual(r[0].名前, 'ひな型3', '古いほうから捨てる');
});

test('足す：上限で捨てるとき、他の団体のぶんを巻き添えにしない', () => {
  let r = 足す([], '別の団体', ['m9'], 'g2', 500);
  for (let i = 0; i < ひな型の上限 + 3; i++) r = 足す(r, 'ひな型' + i, ['m' + i], 'g1', 1000 + i);
  assert.strictEqual(この団体のひな型(r, 'g2').length, 1, '別の団体のひな型が消えている');
  assert.strictEqual(この団体のひな型(r, 'g1').length, ひな型の上限);
});

test('足す：元の一覧は書き換えない', () => {
  const 元 = [];
  足す(元, '主力', ['m1']);
  assert.strictEqual(元.length, 0);
});

test('この団体のひな型：他の団体のものは出さない', () => {
  let r = 足す([], 'A', ['m1'], 'g1');
  r = 足す(r, 'B', ['m2'], 'g2');
  assert.deepStrictEqual(
    この団体のひな型(r, 'g1').map((x) => x.名前),
    ['A']
  );
  assert.strictEqual(この団体のひな型(null, 'g1').length, 0);
});

test('消す：idで1つだけ消える', () => {
  let r = 足す([], 'A', ['m1']);
  r = 足す(r, 'B', ['m2']);
  const 残り = ひな型を消す(r, r[0].id);
  assert.deepStrictEqual(
    残り.map((x) => x.名前),
    ['B']
  );
  assert.strictEqual(ひな型を消す(null, 'x').length, 0);
});

// ── 当てはめる ────────────────────────────────────

const 名簿 = [
  { id: 'm1', name: '山田' },
  { id: 'm2', name: '田中' },
  { id: 'm3', name: '佐藤' },
];

test('当てはめる：保存した順に、いまの名簿から取り出す', () => {
  const r = ひな型を当てはめる({ 部員idたち: ['m3', 'm1'] }, 名簿);
  assert.deepStrictEqual(
    r.人たち.map((x) => x.name),
    ['佐藤', '山田']
  );
  assert.strictEqual(r.見つからない, 0);
});

test('当てはめる：抜けた部員は数えて知らせる（黙って減らさない）', () => {
  const r = ひな型を当てはめる({ 部員idたち: ['m1', '消えた人', 'm2'] }, 名簿);
  assert.strictEqual(r.人たち.length, 2);
  assert.strictEqual(r.見つからない, 1, '減ったことが分からないと、人数が違って見える');
});

test('当てはめる：本人はひな型に入っていても比較相手にしない', () => {
  const r = ひな型を当てはめる({ 部員idたち: ['m1', 'm2'] }, 名簿, 'm1');
  assert.deepStrictEqual(
    r.人たち.map((x) => x.id),
    ['m2']
  );
  assert.strictEqual(r.見つからない, 0, '本人を「見つからない」に数えている');
});

test('当てはめる：数字と文字のIDが食い違っていても当てはまる', () => {
  const r = ひな型を当てはめる({ 部員idたち: [1] }, [{ id: '1', name: '山田' }]);
  assert.strictEqual(r.人たち.length, 1);
});

test('当てはめる：中身が欠けていても落ちない', () => {
  assert.deepStrictEqual(ひな型を当てはめる(null, null), { 人たち: [], 見つからない: 0 });
  assert.deepStrictEqual(ひな型を当てはめる({}, 名簿), { 人たち: [], 見つからない: 0 });
});
