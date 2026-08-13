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

test('リセットすると履歴が消える（前の記録に遡らない）', async () => {
  // 元はこの検査に「保存すると」という名前が付いていたが、試していたのは
  // リセットのほうで、保存の経路は一度も確かめられていなかった
  const { store } = 端末();
  store.setState({ archers: [射手()] });
  store.getState().updateMark('a1', 0, '○');
  assert.ok(store.getState().historyStack.length > 0);

  store.getState().resetCurrentSession();
  await 待つ(20);
  assert.equal(store.getState().historyStack.length, 0, '履歴が空になる');
  assert.equal(store.getState().redoStack.length, 0);
});

test('保存すると履歴が消える（保存済みの盤面が取り消しで戻らない）', async () => {
  // 残していると、保存したあとに取り消しを押すと保存済みの盤面が戻り、
  // そのままもう一度保存すると同じ記録が二重に入る
  const { store } = 端末();
  store.setState({ archers: [射手()] });
  store.getState().updateMark('a1', 0, '○');
  assert.ok(store.getState().historyStack.length > 0, '前提：遡れる手がある');

  await store.getState().saveSession({});
  await 待つ(20);

  assert.equal(store.getState().archers.length, 0, '盤面が片付く');
  assert.equal(store.getState().historyStack.length, 0, '遡れる手も消える');
  assert.equal(store.getState().redoStack.length, 0, 'やり直せる手も消える');

  store.getState().undo();
  assert.equal(store.getState().archers.length, 0, '取り消しても盤面は戻らない');
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

test('共有履歴の目印は、次のライブへ持ち越さない（主催者）', async () => {
  // 持ち越すと、始めたばかりのライブでいきなり取り消しが押せて、
  // 無い手を読みにいく
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  assert.equal(主.store.getState().historySharedLen, 1, '前提：1手ぶん積まれている');

  主.store.getState().stopLiveSync(true);
  await 主.store.getState().startLiveSync('夕練');

  assert.equal(主.store.getState().historySharedLen, 0, '目印が0に戻る');
  assert.equal(主.store.getState().historySharedMax, 0, '上限も0に戻る');
});

test('共有履歴の目印は、次のライブへ持ち越さない（参加者）', async () => {
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.setState({ historySharedLen: 5, historySharedMax: 9 });
  参.store.getState().joinLiveSync(ライブ名);

  assert.equal(参.store.getState().historySharedLen, 0, '参加時に目印を捨てる');
  assert.equal(参.store.getState().historySharedMax, 0, '上限も捨てる');
});

test('ライブ中にリセットすると、共有の取り消し履歴も消える', async () => {
  // ライブ中でないときは historyStack を空にしている。ライブ中だけ残すと、
  // リセットしたあとの取り消しで、消したはずの盤面が戻ってくる
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  assert.equal(主.store.getState().historySharedLen, 1, '前提：1手ぶん積まれている');

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  主.store.getState().resetCurrentSession();
  await 待つ(20);

  assert.equal(主.store.getState().historySharedLen, 0, '押した側の目印が消える');
  assert.equal(主.store.getState().historySharedMax, 0, '上限も消える');
  assert.equal(参.store.getState().historySharedLen, 0, '相手側の目印も消える');
  assert.equal(参.store.getState().historySharedMax, 0, '相手側の上限も消える');

  // 取り消しを押しても、消した盤面は戻らない
  主.store.getState().undo();
  await 待つ(20);
  assert.equal(主.store.getState().archers.length, 0, 'リセットした盤面のまま');
});

test('参加したとき、過去の取り消しの知らせが蒸し返されない', async () => {
  // 目印は引き継ぐが、知らせは出さない。出すと、取り消しのあったライブに
  // 入るたび「取り消しされました。」が出る
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  主.store.getState().undo();
  await 待つ(20);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  assert.equal(参.store.getState().historyNoticeAt, 0, '入った時点では知らせを出さない');
  assert.equal(参.store.getState().historySharedLen, 0, '目印は引き継ぐ');
  assert.equal(参.store.getState().historySharedMax, 1, '上限も引き継ぐ');

  // 入ったあとの取り消しは、ちゃんと知らせが出る
  主.store.getState().redo();
  await 待つ(20);
  assert.ok(参.store.getState().historyNoticeAt > 0, '入ったあとの操作は知らせる');
  assert.equal(参.store.getState().historyNoticeKind, 'やり直し');
});

test('鍵：間隔と計が隣り合うと、外側の鍵は自分の列しか掴まない（仕様）', () => {
  // toggleLock は押した列から右へ進み、間隔か計にぶつかったところで止める。
  // 隣り合うと一歩目で止まるため、射手は1人も固定されない。
  // 画面側はこの場合に鍵の印を出さないようにしてある（JP_ArcherColumnView_594.js）
  const { store } = 端末();
  const 列 = (id, o) =>
    Object.assign({ id, name: id, marks: ['', '', '', ''], lockedBlocks: {}, lastModified: 1000 }, o);
  store.setState({
    archers: [
      列('A'),
      列('B'),
      列('計', { isTotalCalculator: true }),
      列('間隔', { isSeparator: true }), // 計のすぐ左（＝隣り合う）
      列('C'),
    ],
  });
  const 鍵のついた列 = () =>
    store
      .getState()
      .archers.filter((a) => a.lockedBlocks && a.lockedBlocks[0])
      .map((a) => a.id);

  store.getState().toggleLock('計', 0);
  assert.deepEqual(鍵のついた列(), ['A', 'B', '計'], '計の鍵は右の射手までを掴む');

  store.getState().toggleLock('計', 0); // 戻す
  store.getState().toggleLock('間隔', 0);
  assert.deepEqual(鍵のついた列(), ['間隔'], '隣り合う側は自分の列しか掴まない');
});

test('鍵：間隔と計が離れていれば、どちらも射手を掴む', () => {
  const { store } = 端末();
  const 列 = (id, o) =>
    Object.assign({ id, name: id, marks: ['', '', '', ''], lockedBlocks: {}, lastModified: 1000 }, o);
  store.setState({
    archers: [
      列('A'),
      列('計', { isTotalCalculator: true }),
      列('B'),
      列('間隔', { isSeparator: true }),
      列('C'),
    ],
  });
  const 鍵のついた列 = () =>
    store
      .getState()
      .archers.filter((a) => a.lockedBlocks && a.lockedBlocks[0])
      .map((a) => a.id);

  store.getState().toggleLock('間隔', 0);
  assert.deepEqual(鍵のついた列(), ['B', '間隔'], '間の射手を掴む');
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
