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
test('ライブ中の取り消しが、相手の画面にも伝わる', async () => {
  // 取り消しは「前の状態」をそのまま戻すので、放っておくと射手の更新日時も
  // 古い値に戻る。突き合わせは日時で勝ち負けを決めるため、そのままだと
  // 相手には届かず、主催者の画面だけ戻る食い違いになる。
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

  assert.equal(印(主.store), '', '主催者の画面で戻っている');
  assert.equal(印(参.store), '', '参加者の画面でも戻る');
});

test('ライブ中のやり直しも相手に伝わる', async () => {
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  主.store.getState().undo();
  await 待つ(20);
  主.store.getState().redo();
  await 待つ(20);

  assert.equal(印(参.store), '○', 'やり直しが届く');
});

test('取り消し：中身が変わっていない射手の日時は触らない', () => {
  // 変わっていないものまで打ち直すと、相手が加えた新しい入力を
  // 古い内容で上書きしてしまう
  const { store } = 端末();
  store.setState({
    archers: [射手(), 射手({ id: 'a2', name: '二人目', lastModified: 2000 })],
  });

  store.getState().updateMark('a1', 0, '○');
  store.getState().undo();

  const 後 = store.getState().archers;
  assert.equal(後.find((a) => a.id === 'a2').lastModified, 2000, '触っていない射手はそのまま');
  assert.ok(後.find((a) => a.id === 'a1').lastModified > 1000, '戻した射手は打ち直す');
});
