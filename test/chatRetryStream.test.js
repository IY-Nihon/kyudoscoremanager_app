/**
 * AI チャットで流し読みが切れたとき、流さない道（generateContent）で送り直さないことの検査。
 *
 * 流さない道は答え全部ができるまで 1 字も届かず、中継でも写真用の並び（1 つ 45 秒まで待つ）を通る。
 * 2026-10-20・21 に本番で 70〜100 秒無言のまま iPhone の Safari に切られ（Load failed）、
 * 送り直した 3 回とも答えが出なかった（AI のログ）。送り直しも流し読みにする。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('チャットは流さない道（generateContent）を使わない', () => {
  const 文 = fs.readFileSync(path.join(__dirname, '..', 'src', 'AIChatBot.js'), 'utf8');
  assert.doesNotMatch(文, /\.generateContent\(/, 'チャットの送信・送り直しは generateContentStream で');
  assert.match(文, /流し読みが切れたので、もう一度流し読みで送り直します/);
});
