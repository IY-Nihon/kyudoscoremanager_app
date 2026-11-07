// 個人ID の形（src/kojinId.js）。6 字（I・L・O・0・1 を除く大文字と数字）。4 桁は使える終わりまで
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const 個 = require('../src/kojinId');

test('使う字に見間違えやすい字（I・L・O・0・1）が無い', () => {
  for (const 字 of 'ILO01') assert.ok(!個.使う字.includes(字), 字);
  assert.equal(個.使う字.length, 31);
});

test('作った ID は 6 字で、使っている ID と重ならない', () => {
  const 使用中 = [];
  for (let 回 = 0; 回 < 200; 回++) {
    const id = 個.個人IDを作る(使用中);
    assert.match(id, 個.新しい形);
    assert.ok(!使用中.includes(id));
    使用中.push(id);
  }
  assert.throws(() => 個.個人IDを作る([], {}), /乱数/);
});

test('4 桁は使える終わりまでだけ使える。逆引き表には載せておく', () => {
  const 終わり = Date.parse(個.古い形を使える終わり + 'T00:00:00Z');
  assert.equal(個.使える個人IDか('1234', 終わり - 1), true);
  assert.equal(個.使える個人IDか('1234', 終わり), false);
  assert.equal(個.使える個人IDか('K7MP3X', 終わり + 1), true);
  assert.equal(個.使える個人IDか('k7mp3x'), false, '小文字はそろえてから');
  assert.equal(個.使える個人IDか('IL0O1A'), false);
  assert.equal(個.個人IDの形か('1234'), true);
  assert.equal(個.個人IDの形か('あ'), false);
});

test('4 桁を使える終わりは、決まり（legacyIdUsable）とアプリで同じ日', () => {
  const 決まり = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const 合う = 決まり.match(/function legacyIdUsable\(\) {\s*return request\.time < timestamp\.date\((\d{4}), (\d{1,2}), (\d{1,2})\)/);
  assert.ok(合う, 'firestore.rules に legacyIdUsable の日付が無い');
  assert.equal(`${合う[1]}-${合う[2].padStart(2, '0')}-${合う[3].padStart(2, '0')}`, 個.古い形を使える終わり);
  // 4 桁で入った証は、使える終わりで止める（isClaimedMember）。6 字の形は、証を書く中継が確かめる
  //（kyudo-chukei の /kojin。決まりは端末に証を書かせない）
  assert.match(
    決まり,
    /!string\(claim\(\)\.data\.get\('personalId', ''\)\)\.matches\('\^\[0-9\]\{4\}\$'\) \|\| legacyIdUsable\(\)/,
    '4 桁の証を使える終わりで止めていない'
  );
  assert.match(決まり, /match \/member_claims\/\{uid\} \{[^}]*allow create, update: if false;/, '端末が証を書ける');
});
