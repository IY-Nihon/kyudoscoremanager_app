/**
 * ライブにつないでいる台数（src/livePresence.js）。
 *
 *   npm test
 *
 * 見たいのは「居るのに居ないと出ない」こと。台数は安心のために出すので、
 * 少なく出るのがいちばん困る（相手に届いていないと誤解する）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  端末の名前を作る,
  在席を数える,
  台数の文言,
  打ち直す間隔,
  古いとみなす,
} = require('../src/livePresence');

test('端末の名前：毎回ちがう', () => {
  const 集 = new Set();
  for (let i = 0; i < 200; i++) 集.add(端末の名前を作る());
  assert.strictEqual(集.size, 200, '同じ名前が出ている');
});

test('端末の名前：crypto が無い環境でも作れる', () => {
  const s = 端末の名前を作る({});
  assert.ok(s.length > 0);
  // 道の名前に使うので、RTDB が受け付けない字が混じらないこと
  assert.ok(!/[.#$/[\]]/.test(s), '道に使えない字が入っている: ' + s);
});

test('数える：新しい在席は全部数える', () => {
  const 今 = 1000000;
  assert.strictEqual(
    在席を数える({ a: { at: 今 }, b: { at: 今 - 1000 }, c: { at: 今 - 打ち直す間隔 } }, 今),
    3
  );
});

test('数える：古すぎるものは数えない', () => {
  const 今 = 1000000;
  assert.strictEqual(在席を数える({ a: { at: 今 }, b: { at: 今 - 古いとみなす - 1 } }, 今), 1);
});

test('数える：1回や2回の打ち漏らしでは消えない', () => {
  // 電波が一瞬切れた・画面が裏に回った、で人が消えると
  // 「相手が落ちた」と誤解する。3回ぶんの猶予を持たせてある
  const 今 = 1000000;
  assert.strictEqual(在席を数える({ a: { at: 今 - 打ち直す間隔 * 2 } }, 今), 1, '2回の漏らしで消えている');
});

test('数える：日時が入る前のものも数える', () => {
  // サーバーが日時を打つまでの一瞬。落とすと、置いた直後に自分の台が消えて見える
  const 今 = 1000000;
  assert.strictEqual(在席を数える({ a: {}, b: { at: 今 } }, 今), 2);
  assert.strictEqual(在席を数える({ a: { at: { '.sv': 'timestamp' } } }, 今), 1);
});

test('数える：中身が欠けていても落ちない', () => {
  const 今 = 1000000;
  assert.strictEqual(在席を数える(null, 今), 0);
  assert.strictEqual(在席を数える(undefined, 今), 0);
  assert.strictEqual(在席を数える({}, 今), 0);
  assert.strictEqual(在席を数える({ a: null }, 今), 0);
  assert.strictEqual(在席を数える('文字列', 今), 0);
});

test('文言：1台のときは出さない', () => {
  // 1台は自分だけ。出すと、相手が居るのか自分だけなのか読み取れない
  assert.strictEqual(台数の文言(0), null);
  assert.strictEqual(台数の文言(1), null);
  assert.strictEqual(台数の文言(2), '2台接続中');
  assert.strictEqual(台数の文言(3), '3台接続中');
});

test('文言：数でないものが来ても落ちない', () => {
  assert.strictEqual(台数の文言(null), null);
  assert.strictEqual(台数の文言(undefined), null);
  assert.strictEqual(台数の文言('3'), null);
});

test('数える：サーバーの時計に合わせられないときは、古さで落とさない', () => {
  // 端末の時計が進んでいると、サーバーが打った日時が全部「古い」に見える。
  // そこで落とすと、居るのに0台と出て「届いていない」と誤解させる。
  // 合わせられていないときは null を渡す約束にしてある
  const 節点 = { a: { at: 1000 }, b: { at: 2000 } };
  assert.strictEqual(在席を数える(節点, 9999999999), 0, '前提：時刻を渡すと古くて落ちる');
  assert.strictEqual(在席を数える(節点, null), 2, '合わせられないときに落としている');
  assert.strictEqual(在席を数える(節点, undefined), 2);
});
