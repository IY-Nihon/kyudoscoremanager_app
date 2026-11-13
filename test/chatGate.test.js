'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const 門 = require('../src/chatGate');
const { 道具の宣言 } = require('../src/chatTools');

const 全部 = 道具の宣言(4)[0].functionDeclarations;
const 名前たち = (宣言たち) => 宣言たち.map((宣言) => 宣言.name).sort();
const いつも = ['addMember', 'addMembers', 'calculate', 'navigateToScreen', 'startTutorial'];

test('部員も記録も無い団体には、登録・画面・案内・計算だけを渡す', () => {
  assert.deepEqual(名前たち(門.渡す道具(全部, { 部員の数: 0, 記録の数: 0 })), いつも);
});

test('部員がいて記録が無いときは、名簿・出欠・チーム分けを足す', () => {
  assert.deepEqual(
    名前たち(門.渡す道具(全部, { 部員の数: 5, 記録の数: 0 })),
    [...いつも, 'getAttendanceStats', 'listMembers', 'makeBalancedTeams'].sort()
  );
});

test('記録があって部員がいないときは、記録を読む・まとめる道具だけを足す', () => {
  const 出た = 名前たち(門.渡す道具(全部, { 部員の数: 0, 記録の数: 3 }));
  assert.ok(
    出た.includes('getSessionsByDate') && 出た.includes('searchSessions') && 出た.includes('aggregateStats')
  );
  for (const 名前 of 門.部員が要る道具) assert.ok(!出た.includes(名前), 名前);
});

test('部員も記録もあれば、全部渡す（元の宣言は書き換えない）', () => {
  const 出た = 門.渡す道具(全部, { 部員の数: 1, 記録の数: 1 });
  assert.equal(出た.length, 全部.length);
  assert.notEqual(出た, 全部);
});

test('一覧にある名前は、どれも本当にある道具（名前を変えたら気づく）', () => {
  const ある = 全部.map((宣言) => 宣言.name);
  for (const 名前 of [...門.部員が要る道具, ...門.記録が要る道具]) assert.ok(ある.includes(名前), 名前);
});

test('新しく足した道具は、いつも渡すか・絞るかを決めてある', () => {
  const 決めた = new Set([...いつも, ...門.部員が要る道具, ...門.記録が要る道具]);
  for (const 宣言 of 全部)
    assert.ok(決めた.has(宣言.name), `${宣言.name} をどちらに入れるか決めてください（src/chatGate.js）`);
});

test('数が変な値でも落ちず、無いものとして絞る', () => {
  assert.equal(門.渡してよい道具か('listMembers', null), false);
  assert.equal(門.渡してよい道具か('listMembers', { 部員の数: NaN, 記録の数: 'x' }), false);
  assert.equal(門.渡してよい道具か('calculate', undefined), true);
  assert.deepEqual(門.渡す道具(null, {}), []);
});

test('指示文の一言：絞っていなければ空。個人には部員の登録を案内しない', () => {
  assert.equal(門.足りないときの案内({ 部員の数: 3, 記録の数: 2 }, false), '');
  const 団体 = 門.足りないときの案内({ 部員の数: 0, 記録の数: 0 }, false);
  assert.match(団体, /メンバーがまだ/);
  assert.match(団体, /記録がまだ/);
  const 個人 = 門.足りないときの案内({ 部員の数: 1, 記録の数: 0 }, true);
  assert.match(個人, /本人が写っている記録/);
  assert.doesNotMatch(個人, /addMember/);
});
