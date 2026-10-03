/**
 * 記録の射手の名前を、メンバーのいまの名前に合わせる（src/memberNameSync.js）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 名前表を作る, 射手たちを合わせる, ずれのある記録たち, 射手の名前たち } = require('../src/memberNameSync');

const 表 = 名前表を作る([{ id: 'm1', name: '林 飛雄' }, { id: 'm2', name: '山田 花子' }, { id: 'm3', name: '  ' }, { id: 'm4' }], [{ id: 'a1', name: '卒業 太郎' }]);

test('名前表：同じ id が両方の一覧に居たら、後ろに渡した一覧が勝つ（卒業生の古い名前が、いまの部員の名前を上書きしない）', () => {
  const 表2 = 名前表を作る([{ id: 'x', name: '卒業生の古い名前' }], [{ id: 'x', name: 'いまの部員の名前' }]);
  assert.strictEqual(表2.get('x'), 'いまの部員の名前');
});

test('名前表：名前の無い人は入れない。卒業生の一覧も入る', () => {
  assert.deepStrictEqual([...表.keys()].sort(), ['a1', 'm1', 'm2']);
  assert.strictEqual(表.get('m1'), '林 飛雄');
});

test('結び付いた射手の名前を、いまの名前に直す。ほかは触らない', () => {
  const 射手たち = [
    { id: 'x1', memberId: 'm1', name: '叡智な林 飛雄', marks: ['○'] },
    { id: 'x2', memberId: 'm2', name: '山田 花子', marks: ['×'] },
    { id: 'x3', name: '叡智な林 飛雄', isGuest: true }, // ゲスト（結び付き無し）は同じ名前でも触らない
    { id: 'x4', memberId: 'm9', name: '消えた人' }, // 名簿に居ない人は触らない
    { isSeparator: true, name: '---' },
  ];
  const { 直した射手, 触った } = 射手たちを合わせる(射手たち, 表, 1234);
  assert.strictEqual(触った, true);
  assert.strictEqual(直した射手[0].name, '林 飛雄');
  assert.strictEqual(直した射手[0].lastModified, 1234);
  assert.deepStrictEqual(直した射手[0].marks, ['○'], '○× は残る');
  assert.strictEqual(直した射手[1], 射手たち[1], '合っている射手は同じ物のまま');
  assert.strictEqual(直した射手[2].name, '叡智な林 飛雄', 'ゲストは触らない');
  assert.strictEqual(直した射手[3].name, '消えた人');
  assert.strictEqual(直した射手[4], 射手たち[4]);
});

test('合っていれば、同じ並びをそのまま返す（無駄に書き換えない）', () => {
  const 射手たち = [{ id: 'x2', memberId: 'm2', name: '山田 花子' }];
  const 結果 = 射手たちを合わせる(射手たち, 表);
  assert.strictEqual(結果.触った, false);
  assert.strictEqual(結果.直した射手, 射手たち);
});

test('途中交代で入った人の名前（交代の欄）も合わせる', () => {
  const 射手たち = [{ id: 'x1', memberId: 'm2', name: '山田 花子', substitutionIds: { 1: 'm1' }, substitutions: { 1: '叡智な林 飛雄' } }];
  const { 直した射手, 触った } = 射手たちを合わせる(射手たち, 表);
  assert.strictEqual(触った, true);
  assert.strictEqual(直した射手[0].substitutions[1], '林 飛雄');
  assert.strictEqual(直した射手[0].name, '山田 花子', '本来の射手は変わらない');
});

test('性別と学年は直さない（記録ごとに直せる値で、食い違いは間違いと言えない）', () => {
  const 射手たち = [{ id: 'x1', memberId: 'm1', name: '叡智な林 飛雄', gender: '女性', grade: 4 }];
  const { 直した射手 } = 射手たちを合わせる(射手たち, 表);
  assert.strictEqual(直した射手[0].gender, '女性');
  assert.strictEqual(直した射手[0].grade, 4);
});

test('ずれのある記録たち：ずれた記録だけを、直した射手と名前の一覧つきで返す', () => {
  const 記録たち = [
    { id: 's1', archers: [{ memberId: 'm1', name: '叡智な林 飛雄' }, { memberId: 'm2', name: '山田 花子' }] },
    { id: 's2', archers: [{ memberId: 'm2', name: '山田 花子' }] },
    { id: 's3' },
    null,
  ];
  const 出 = ずれのある記録たち(記録たち, 表);
  assert.deepStrictEqual(出.map((x) => x.id), ['s1']);
  assert.deepStrictEqual(出[0].名前たち, ['林 飛雄', '山田 花子']);
});

test('射手の名前たち：空と重複を除く', () => {
  assert.deepStrictEqual(射手の名前たち([{ name: ' 甲 ' }, { name: '甲' }, { name: '' }, null, {}]), ['甲']);
});

test('名前表が空なら何もしない', () => {
  const 射手たち = [{ memberId: 'm1', name: '叡智な林 飛雄' }];
  assert.strictEqual(射手たちを合わせる(射手たち, new Map()).触った, false);
});
