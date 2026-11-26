/**
 * ライブのリンクの期限を延ばす（src/liveEnchou.js。2026-11-26 B3）
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const 延 = require('../src/liveEnchou');

const 今 = Date.UTC(2026, 10, 26, 3, 0, 0);
const 分 = 60000;
const 時間 = 60 * 分;
const ライブ中 = (足す = {}) => ({
  activeRole: 'group',
  activeGroupId: '100001',
  共有の来客: false,
  isLiveActive: true,
  liveSessionName: '練習',
  いまのライブの期限: 今 + 20 * 分,
  ...足す,
});

test('選べる長さは 12時間・24時間・7日間（期限なしは無い）', () => {
  assert.deepEqual(
    延.延ばせる選択肢.map((選) => 選.名),
    ['12時間', '24時間', '7日間']
  );
});

test('今の期限より後になる長さだけ選べる', () => {
  assert.equal(延.延ばせる長さか(12 * 時間, 今 + 20 * 分, 今), true);
  assert.equal(延.延ばせる長さか(12 * 時間, 今 + 13 * 時間, 今), false);
  assert.equal(延.延ばせる長さか(24 * 時間, 今 + 13 * 時間, 今), true);
});

test('延ばせるのは団体アカウントと個人ログイン（リンクで来た部外の人は除く）', () => {
  assert.equal(延.延ばせる人か(ライブ中()), true);
  assert.equal(延.延ばせる人か(ライブ中({ activeRole: 'member' })), true);
  assert.equal(延.延ばせる人か(ライブ中({ 共有の来客: true })), false);
  assert.equal(延.延ばせる人か(ライブ中({ activeRole: null })), false);
  assert.equal(延.延ばせる人か(ライブ中({ activeGroupId: null })), false);
});

test('下の帯は残り 30 分から。期限なし・切れた・閉じた期限には出さない', () => {
  assert.equal(延.帯を出すか(ライブ中(), null, 今), true);
  assert.equal(延.帯を出すか(ライブ中({ いまのライブの期限: 今 + 31 * 分 }), null, 今), false);
  assert.equal(延.帯を出すか(ライブ中({ いまのライブの期限: null }), null, 今), false);
  assert.equal(延.帯を出すか(ライブ中({ いまのライブの期限: 今 - 1 }), null, 今), false);
  assert.equal(延.帯を出すか(ライブ中(), 今 + 20 * 分, 今), false, '閉じたのに出た');
  // 延ばしてまた近づいたら（期限が替わったら）また出す
  assert.equal(延.帯を出すか(ライブ中({ いまのライブの期限: 今 + 10 * 分 }), 今 + 20 * 分, 今), true);
  assert.equal(延.帯を出すか(ライブ中({ 共有の来客: true }), null, 今), false);
  assert.equal(
    延.帯の文(今 + 20 * 分 - 1, 今),
    'ライブのリンクはあと20分で切れます。続けるときは期限を延ばしてください'
  );
});

test('中継の答えを分ける', async () => {
  const 中継 = (状態, 中身) => ({
    中継がある: () => true,
    中継へfetch: async () => ({ ok: 状態 === 200, status: 状態, json: async () => 中身 }),
  });
  assert.deepEqual(
    await 延.延ばす('1', '練習', 12 * 時間, { 中継: 中継(200, { 結果: '延ばした', 期限: 5 }) }),
    {
      結果: '延ばした',
      期限: 5,
    }
  );
  assert.equal((await 延.延ばす('1', '練習', 1, { 中継: 中継(403, { error: 'x' }) })).結果, '延ばせない');
  assert.equal((await 延.延ばす('1', '練習', 1, { 中継: 中継(409, {}) })).結果, '短い');
  assert.equal((await 延.延ばす('1', '練習', 1, { 中継: 中継(410, {}) })).結果, '切れた');
  assert.equal((await 延.延ばす('1', '練習', 1, { 中継: 中継(404, {}) })).結果, '古い中継');
  assert.equal(
    (await 延.延ばす('1', '練習', 1, { 中継: 中継(404, { error: 'このライブは配られていません' }) })).結果,
    '配っていない'
  );
  assert.equal((await 延.延ばす('1', '練習', 1, { 中継: { 中継がある: () => false } })).結果, '古い中継');
  const 落ちる = { 中継がある: () => true, 中継へfetch: async () => Promise.reject(new Error('x')) };
  assert.equal((await 延.延ばす('1', '練習', 1, { 中継: 落ちる })).結果, '届かない');
});
