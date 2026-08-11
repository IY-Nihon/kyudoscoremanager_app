/**
 * 取り消し・やり直しの検査。
 *
 *   npm test
 *
 * ライブ記録と組み合わせたときの振る舞いも見る。取り消しは「前の状態」を
 * そのまま戻すため、射手の更新日時も古い値に戻る。突き合わせは日時で
 * 勝ち負けを決めるので、相手に届くかどうかはここに懸かっている。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const ライブ名 = '朝練';
const 道 = `live_sessions/${団体}/${ライブ名}/state`;

function 端末(既存のライブ) {
  const { store, ライブ } = ストアを用意する(undefined, 既存のライブ);
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    members: [],
    alumni: [],
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    archers: [],
    shotsPerRound: 4,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    lastPushedTimestamp: 0,
    lastResetHandled: 0,
    historyStack: [],
    redoStack: [],
  });
  return { store, ライブ };
}

const 射手 = (o) =>
  Object.assign({ id: 'a1', name: '一人目', marks: ['', '', '', ''], lastModified: 1000 }, o);
const 印 = (store, i = 0) => store.getState().archers[0].marks[i];

// ──────────────────────────────────────────────────────────────
test('取り消し：直前の○×が元に戻る', () => {
  const { store } = 端末();
  store.setState({ archers: [射手()] });

  store.getState().updateMark('a1', 0, '○');
  assert.equal(印(store), '○');

  store.getState().undo();
  assert.equal(印(store), '', '入れる前に戻る');
});

test('やり直し：取り消したものが戻る', () => {
  const { store } = 端末();
  store.setState({ archers: [射手()] });

  store.getState().updateMark('a1', 0, '○');
  store.getState().undo();
  store.getState().redo();
  assert.equal(印(store), '○');
});

test('取り消し：履歴が無ければ何も起きない', () => {
  const { store } = 端末();
  store.setState({ archers: [射手({ marks: ['×', '', '', ''] })] });
  store.getState().undo();
  assert.equal(印(store), '×', '変わらない');
});

test('取り消し：何度でも遡れる', () => {
  const { store } = 端末();
  store.setState({ archers: [射手()] });

  store.getState().updateMark('a1', 0, '○');
  store.getState().updateMark('a1', 1, '×');
  store.getState().updateMark('a1', 2, '○');

  store.getState().undo();
  store.getState().undo();
  assert.equal(印(store, 0), '○', '1本目は残る');
  assert.equal(印(store, 1), '', '2本目が戻る');
  assert.equal(印(store, 2), '', '3本目も戻る');
});

test('やり直し：新しく入力すると、やり直せなくなる', () => {
  const { store } = 端末();
  store.setState({ archers: [射手()] });

  store.getState().updateMark('a1', 0, '○');
  store.getState().undo();
  store.getState().updateMark('a1', 1, '×');
  store.getState().redo();

  assert.equal(印(store, 0), '', 'やり直しは効かない');
  assert.equal(印(store, 1), '×', '新しい入力は残る');
});

test('取り消し：射手の追加も戻せる', () => {
  const { store } = 端末();
  store.setState({ archers: [射手()] });

  store.getState().addArcher();
  assert.equal(store.getState().archers.length, 2);

  store.getState().undo();
  assert.equal(store.getState().archers.length, 1, '追加が戻る');
});

test('取り消し：射手の削除も戻せる', () => {
  const { store } = 端末();
  store.setState({ archers: [射手(), 射手({ id: 'a2', name: '二人目' })] });

  store.getState().deleteArcher('a2');
  assert.equal(store.getState().archers.length, 1);

  store.getState().undo();
  assert.deepEqual(
    store.getState().archers.map((a) => a.id),
    ['a1', 'a2'],
    '削除が戻る'
  );
});

test('保存すると履歴が消える（前の記録に遡らない）', async () => {
  const { store } = 端末();
  store.setState({ archers: [射手()] });
  store.getState().updateMark('a1', 0, '○');
  assert.ok(store.getState().historyStack.length > 0);

  store.getState().resetCurrentSession();
  await 待つ(20);
  assert.equal(store.getState().historyStack.length, 0, '履歴が空になる');
  assert.equal(store.getState().redoStack.length, 0);
});

// ──────────────────────────────────────────────────────────────
test('ライブ中の取り消しは相手に伝わらない（既知の穴）', async () => {
  // 取り消しは「前の状態」をそのまま戻すため、射手の更新日時も古い値に戻る。
  // 突き合わせは日時で勝ち負けを決めるので、相手の側では自分の値が新しく見え、
  // 取り消しが無視される。直す前の実装でも同じで（そちらは受信側の日時が
  // 古い値へ巻き戻るぶん、さらに具合が悪い）、元からある穴。
  // 直すなら、取り消しで内容が変わった射手の日時を打ち直すこと。
  // そのときはこの検査を裏返す。
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  assert.equal(印(参.store), '○', '前提：入力が届いている');

  主.store.getState().undo();
  await 待つ(20);

  assert.equal(印(主.store), '', '主催者の画面では戻っている');
  assert.equal(印(参.store), '○', '★参加者には伝わらない');
  assert.ok(
    参.store.getState().archers[0].lastModified > 1000,
    '受信側の日時は巻き戻らない（ここは直してある）'
  );
});
