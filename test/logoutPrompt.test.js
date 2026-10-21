/**
 * ログアウトの確認の文言の検査。
 *
 *   npm test
 *
 * 送れていない記録は、ログアウトしても消さずに端末へ残す（src/unsentStash.js）。
 * 何件が残り、いつ送られるかが文言から分かることが要点。
 * 2026-10-17 までは「未送信の記録を削除してログアウト」しか選べず、記録が消えた。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  logoutMessage,
  logoutButtonLabel,
  logoutButtonsDisabled,
  shouldTrySendFirst,
  段階,
} = require('../src/logoutPrompt');

test('未送信が無ければ、今までどおり尋ねるだけ', () => {
  assert.equal(logoutMessage(段階.確認, 0), 'ログアウトしますか？');
  assert.equal(logoutButtonLabel(段階.確認), 'ログアウト');
  assert.equal(shouldTrySendFirst(段階.確認, 0), false, '送信は試さない');
});

test('未送信があれば、件数と「端末に残す・次に送る」を伝える。消えるとは言わない', () => {
  const 文 = logoutMessage(段階.確認, 3);
  assert.match(文, /3件/, '件数が出る');
  assert.match(文, /この端末に残/, '残すことが分かる');
  assert.match(文, /同じ団体でログインすると送られます/, 'いつ送られるかが分かる');
  assert.doesNotMatch(文, /失われ|削除/, '消える言い方をしない');
  assert.equal(logoutButtonLabel(段階.確認), 'ログアウト');
  assert.equal(shouldTrySendFirst(段階.確認, 3), true, 'まず送信を試す');
});

test('送信中は、押せないようにする', () => {
  assert.equal(logoutMessage(段階.送信中, 3), '送信しています...');
  assert.equal(logoutButtonLabel(段階.送信中), '送信中...');
  assert.equal(logoutButtonsDisabled(段階.送信中), true);
});

test('送信できたら、その旨を出してから抜ける', () => {
  assert.equal(logoutMessage(段階.送信済み, 0), '送信できました。ログアウトします。');
  assert.equal(logoutButtonsDisabled(段階.送信済み), true, '二度押しできない');
});

test('送れなかったら、端末に残したことを出してから抜ける（削除のボタンは無い）', () => {
  const 文 = logoutMessage(段階.失敗, 3);
  assert.match(文, /送れなかった3件は、この端末に残しました/);
  assert.doesNotMatch(文, /失われ|削除/);
  assert.equal(logoutButtonsDisabled(段階.失敗), true, '抜ける途中は押せない');
  assert.equal(shouldTrySendFirst(段階.失敗, 3), false, '送信は試し直さない');
  for (const 段 of Object.values(段階)) assert.doesNotMatch(logoutButtonLabel(段), /削除/);
});
