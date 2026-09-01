/**
 * SHA-256（src/sha256.js）。
 *
 *   npm test
 *
 * 共有リンクの枝の名前は、この値から作る（src/liveShare.js）。1ビットでも
 * 違うと、web と iOS で別の枝を見て「入ったのに何も出ない」になる。
 * 既知の答えと、node 自身の crypto の両方に突き合わせる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const { 要約, バイト列にする } = require('../src/sha256');

// FIPS 180-4 と RFC の公表値
const 既知 = [
  ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  [
    'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  ],
];

test('既知の答えと一致する', () => {
  for (const [入, 出] of 既知) assert.strictEqual(要約(入), 出, JSON.stringify(入));
});

test('長い入力でも合う（詰め物の境目をまたぐ）', () => {
  // 55/56/63/64/65 バイトは、末尾の詰め方を間違えるとここで崩れる
  for (const n of [54, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128, 129, 1000]) {
    const s = 'a'.repeat(n);
    assert.strictEqual(要約(s), crypto.createHash('sha256').update(s).digest('hex'), 'n=' + n);
  }
});

test('日本語でも合う（UTF-8 の作り方が正しい）', () => {
  for (const s of ['朝練', '立ち順', '弓道記録', '☓○△', '𩸽', 'あ'.repeat(300)])
    assert.strictEqual(要約(s), crypto.createHash('sha256').update(s, 'utf8').digest('hex'), s.slice(0, 6));
});

test('絵文字（サロゲート対）でも合う', () => {
  for (const s of ['🎯', '🏹弓道🎯', '👨‍👩‍👧'])
    assert.strictEqual(要約(s), crypto.createHash('sha256').update(s, 'utf8').digest('hex'), s);
});

test('でたらめな入力を node の crypto と突き合わせる', () => {
  for (let i = 0; i < 200; i++) {
    const s = crypto.randomBytes(1 + (i % 70)).toString('base64');
    assert.strictEqual(要約(s), crypto.createHash('sha256').update(s).digest('hex'), s);
  }
});

test('バイト列にする：UTF-8 の並びが node と同じ', () => {
  for (const s of ['abc', '朝練', '🏹', 'a𩸽b']) {
    assert.deepStrictEqual(バイト列にする(s), [...Buffer.from(s, 'utf8')], s);
  }
});
