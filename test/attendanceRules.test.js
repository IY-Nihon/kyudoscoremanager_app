/**
 * 出欠の自動判定の決まり（src/attendanceRules.js）。
 *
 * 直した不具合：途中交代で入った人が欠席にされていた。
 * 交代で入った人は archer.memberId には出てこず、substitutionIds にだけ出てくる。
 */
const test = require('node:test');
const assert = require('node:assert');
const { 射に出ているか, 出ていた部員たち } = require('../src/attendanceRules');

test('射手そのものとして立っていれば、出ている', () => {
  const 射手 = { id: 'a1', memberId: 'm1', substitutionIds: {} };
  assert.strictEqual(射に出ているか(射手, 'm1'), true);
});

test('立っていない人は、出ていない', () => {
  const 射手 = { id: 'a1', memberId: 'm1', substitutionIds: {} };
  assert.strictEqual(射に出ているか(射手, 'm2'), false);
});

test('途中交代で入った人も、出ていると数える', () => {
  // 2立目から m9 に代わった
  const 射手 = { id: 'a1', memberId: 'm1', substitutions: { 1: '交代 太郎' }, substitutionIds: { 1: 'm9' } };
  assert.strictEqual(射に出ているか(射手, 'm9'), true, '交代で入った人が欠席にされている');
  assert.strictEqual(射に出ているか(射手, 'm1'), true, '交代で抜けた人も、前半は引いている');
});

test('交代が何回もあっても、それぞれ数える', () => {
  const 射手 = { id: 'a1', memberId: 'm1', substitutionIds: { 1: 'm9', 2: 'm7' } };
  for (const id of ['m1', 'm9', 'm7']) {
    assert.strictEqual(射に出ているか(射手, id), true, id + ' が数えられていない');
  }
  assert.strictEqual(射に出ているか(射手, 'm5'), false);
});

test('ゲストの交代（部員IDなし）は数えない', () => {
  // ゲストは substitutions に名前だけ入り、substitutionIds には入らない
  const 射手 = { id: 'a1', memberId: 'm1', substitutions: { 1: 'ゲスト 花子' }, substitutionIds: {} };
  assert.strictEqual(射に出ているか(射手, 'm9'), false);
});

test('id が数字と文字で食い違っていても、同じ人として数える', () => {
  const 射手 = { id: 'a1', memberId: 1, substitutionIds: { 1: 9 } };
  assert.strictEqual(射に出ているか(射手, '1'), true);
  assert.strictEqual(射に出ているか(射手, '9'), true);
});

test('中身が欠けていても落ちない', () => {
  assert.strictEqual(射に出ているか(null, 'm1'), false);
  assert.strictEqual(射に出ているか({ memberId: 'm1' }, null), false);
  assert.strictEqual(射に出ているか({ memberId: 'm1' }, ''), false);
  assert.strictEqual(射に出ているか({}, 'm1'), false);
  assert.strictEqual(射に出ているか({ memberId: 'm1', substitutionIds: null }, 'm1'), true);
});

test('出ていた部員たちは、交代も含めて重なりなく返す', () => {
  const 射手たち = [
    { memberId: 'm1', substitutionIds: { 1: 'm9' } },
    { memberId: 'm2', substitutionIds: {} },
    { memberId: 'm9', substitutionIds: {} }, // 別の的にも立っている
    null,
    { memberId: '', substitutionIds: { 0: '' } },
  ];
  assert.deepStrictEqual(出ていた部員たち(射手たち), ['m1', 'm9', 'm2']);
});

test('出ていた部員たちは、中身が無くても落ちない', () => {
  assert.deepStrictEqual(出ていた部員たち(null), []);
  assert.deepStrictEqual(出ていた部員たち([]), []);
});
