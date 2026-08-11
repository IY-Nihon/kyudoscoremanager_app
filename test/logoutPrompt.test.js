/**
 * ログアウトの確認の文言の検査。
 *
 *   npm test
 *
 * ログアウトは手元の記録を全部捨てる操作なので、何が失われるかが
 * 文言とボタン名から分かることが要点。
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
  assert.equal(logoutButtonLabel(段階.確認, 0), 'ログアウト');
  assert.equal(shouldTrySendFirst(段階.確認, 0), false, '送信は試さない');
});

test('未送信があれば、件数と失われることを伝える', () => {
  const 文 = logoutMessage(段階.確認, 3);
  assert.match(文, /3件/, '件数が出る');
  assert.match(文, /失われます/, '失われることが分かる');
  assert.equal(logoutButtonLabel(段階.確認, 3), '送信してログアウト', '何をするボタンか分かる');
  assert.equal(shouldTrySendFirst(段階.確認, 3), true, 'まず送信を試す');
});

test('送信中は、押せないようにする', () => {
  assert.equal(logoutMessage(段階.送信中, 3), '送信しています...');
  assert.equal(logoutButtonLabel(段階.送信中, 3), '送信中...');
  assert.equal(logoutButtonsDisabled(段階.送信中), true);
});

test('送信できたら、その旨を出してから抜ける', () => {
  assert.equal(logoutMessage(段階.送信済み, 0), '送信できました。ログアウトします。');
  assert.equal(logoutButtonsDisabled(段階.送信済み), true, '二度押しできない');
});

test('送信できなかったら、捨てることをボタン名に明記する', () => {
  const 文 = logoutMessage(段階.失敗, 3);
  assert.match(文, /送信できませんでした/);
  assert.match(文, /3件は失われます/, '何件失うかが分かる');
  assert.equal(
    logoutButtonLabel(段階.失敗, 3),
    '未送信の記録を削除してログアウト',
    '押すと消えることがボタン名で分かる'
  );
  assert.equal(logoutButtonsDisabled(段階.失敗), false, 'キャンセルも押せる');
  assert.equal(shouldTrySendFirst(段階.失敗, 3), false, '送信は試し直さない');
});

test('失敗のあとは、そのまま抜ける道が残る（ログアウトを塞がない）', () => {
  // 送信できないときに抜けられないと、共用端末や別アカウントで入った
  // ときに困る。捨てると分かる形で必ず抜けられるようにしてある。
  assert.equal(shouldTrySendFirst(段階.失敗, 5), false);
  assert.equal(logoutButtonsDisabled(段階.失敗), false);
});
