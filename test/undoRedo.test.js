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

// ──────────────────────────────────────────────────────────────
test('共有履歴：2台が続けて操作しても、どちらの手も残る', async () => {
  // 場所取りを手元の目印だけで決めていたころは、2台が同じ番号を握り、
  // 後に書いたほうが先の手を上書きしていた。上書きされた手は控えから
  // 消えるだけでなく、誰かが取り消したときに「相手の入力を含まない盤面」が
  // 復元され、入れたはずの○×が消える
  const A = 端末();
  const B = 端末(A.ライブ); // 同じライブを見る2台目

  const 立てる = (端) =>
    端.store.setState({
      archers: [射手(), 射手({ id: 'a2', name: '二人目' })],
      isLiveActive: true,
      liveSessionName: ライブ名,
      historySharedLen: 0,
      historySharedMax: 0,
    });
  (立てる(A), 立てる(B));

  // どちらも目印0を握ったまま、続けて操作する
  A.store.getState().toggleMark('a1', 0);
  B.store.getState().toggleMark('a2', 0);
  await 待つ(0);

  const 控え = A.ライブ.値(`live_history/${団体}/${ライブ名}`) || {};
  assert.equal(Object.keys(控え).length, 2, '片方の手が上書きされている');
  assert.ok(控え[0], '0番が無い');
  assert.ok(控え[1], '1番が無い');

  const 目印 = A.ライブ.値(`live_sessions/${団体}/${ライブ名}/state`) || {};
  assert.equal(目印.history_len, 2, '目印が2まで進んでいない');
});

test('共有履歴：取り消しは、同時に入れた相手の○×を消さない', async () => {
  // 控えが「盤面まるごと」だったころは、後に積まれた手の前に相手の入力が
  // 入っていないため、取り消すと相手の○×まで消えた。
  // 変えたますだけを持たせ、そこだけ戻す
  const A = 端末();
  const B = 端末(A.ライブ);
  const 立てる = (端) =>
    端.store.setState({
      archers: [射手(), 射手({ id: 'a2', name: '二人目' })],
      isLiveActive: true,
      liveSessionName: ライブ名,
      historySharedLen: 0,
      historySharedMax: 0,
    });
  (立てる(A), 立てる(B));

  // 2台がそれぞれ別の射手へ入れる（相手の入力はまだ手元に見えていない）
  A.store.getState().toggleMark('a1', 0);
  B.store.getState().toggleMark('a2', 0);
  await 待つ(0);

  // 同期が行き渡り、A の画面に両方の○が出ている状態にする
  A.store.setState({
    archers: [
      射手({ marks: ['○', '', '', ''] }),
      射手({ id: 'a2', name: '二人目', marks: ['○', '', '', ''] }),
    ],
  });

  await A.store.getState().sharedUndo(-1);
  await 待つ(0);

  const 印 = (id) => A.store.getState().archers.find((a) => a.id === id).marks[0];
  assert.equal(印('a2'), '', '最後の手（B の入力）が戻っていない');
  assert.equal(印('a1'), '○', 'A の入力まで消えた');
});

test('共有履歴：やり直しも、変えたますだけを進める', async () => {
  // 取り消しだけを確かめて、やり直し側を見ていなかった。
  // 差分は向きを変えて当てるので、こちらも同じ性質が要る
  const A = 端末();
  const B = 端末(A.ライブ);
  const 立てる = (端) =>
    端.store.setState({
      archers: [射手(), 射手({ id: 'a2', name: '二人目' })],
      isLiveActive: true,
      liveSessionName: ライブ名,
      historySharedLen: 0,
      historySharedMax: 0,
    });
  (立てる(A), 立てる(B));

  A.store.getState().toggleMark('a1', 0);
  B.store.getState().toggleMark('a2', 0);
  await 待つ(0);
  A.store.setState({
    archers: [
      射手({ marks: ['○', '', '', ''] }),
      射手({ id: 'a2', name: '二人目', marks: ['○', '', '', ''] }),
    ],
  });

  const 印 = (id) => A.store.getState().archers.find((a) => a.id === id).marks[0];

  await A.store.getState().sharedUndo(-1);
  await 待つ(0);
  assert.equal(印('a2'), '', '前提：取り消しで戻っている');

  await A.store.getState().sharedUndo(1);
  await 待つ(0);
  assert.equal(印('a2'), '○', 'やり直しで戻らない');
  assert.equal(印('a1'), '○', 'やり直しで相手の手が消えた');
});

test('共有履歴：射数を減らしたあとの取り消しで、無いますに書かない', async () => {
  // 差分は射番で位置を指す。射数が減ったあとにそのまま当てると、
  // marks が伸びて存在しないますに○が入り、的中数まで狂う
  const A = 端末();
  A.store.setState({
    archers: [射手({ marks: ['○', '', '', ''] })],
    isLiveActive: true,
    liveSessionName: ライブ名,
    historySharedLen: 1,
    historySharedMax: 1,
  });
  A.ライブ.置く(`live_sessions/${団体}/${ライブ名}/state`, {
    status: 'active',
    timestamp: 1,
    history_len: 1,
    history_max: 1,
  });
  A.ライブ.置く(`live_history/${団体}/${ライブ名}/0`, {
    本数: 8,
    at: 1,
    差分: [{ 射手: 'a1', 射番: 7, 前: '○', 後: '×' }],
  });

  await A.store.getState().sharedUndo(-1);
  await 待つ(0);

  const marks = A.store.getState().archers[0].marks;
  assert.equal(marks.length, 4, 'ますの数が増えている');
  assert.deepEqual(marks, ['○', '', '', ''], '中身が変わっている');
});

test('共有履歴：差分にしてよいのは○×だけの違いのときに限る', () => {
  // 差分は「同じ形の盤面で、ますの中身だけが違う」ときにしか作れない。
  // 形が変わる操作を取りこぼすと、取り消しで盤面が壊れる
  const { 印だけの差分 } = require('../src/syncRules');
  const 元 = (o) =>
    Object.assign(
      {
        id: 'a1',
        name: '一人目',
        gender: '男性',
        grade: 1,
        marks: ['', '', '', ''],
        lockedBlocks: {},
        substitutions: {},
        substitutionIds: {},
        arrowLocations: [null, null, null, null],
        lastModified: 1,
      },
      o
    );

  // ○×だけの違い → 差分にする
  assert.deepEqual(印だけの差分([元()], [元({ marks: ['○', '', '', ''], lastModified: 2 })]), [
    { 射手: 'a1', 射番: 0, 前: '', 後: '○' },
  ]);

  // 形が変わる操作 → まるごとに任せる
  const 形が変わる = {
    鍵をかけた: [元()],
    名前を変えた: [元()],
    代役を入れた: [元()],
    矢所を置いた: [元()],
    射手を足した: [元()],
    射数を増やした: [元()],
  };
  const 後たち = {
    鍵をかけた: [元({ lockedBlocks: { 0: true }, lastModified: 2 })],
    名前を変えた: [元({ name: '二人目', lastModified: 2 })],
    代役を入れた: [元({ substitutions: { 0: '誰か' }, lastModified: 2 })],
    矢所を置いた: [元({ arrowLocations: [{ x: 1, y: 1 }, null, null, null], lastModified: 2 })],
    射手を足した: [元(), 元({ id: 'a2' })],
    射数を増やした: [元({ marks: ['', '', '', '', '', '', '', ''], lastModified: 2 })],
  };
  for (const 名 of Object.keys(形が変わる)) {
    assert.equal(印だけの差分(形が変わる[名], 後たち[名]), null, `${名}：差分にしてしまっている`);
  }

  // 並びが入れ替わったときも差分にしない（同じ位置に別の射手が来る）
  assert.equal(印だけの差分([元(), 元({ id: 'a2' })], [元({ id: 'a2' }), 元()]), null);
  // 日時だけの違いは、そもそも戻すものが無い
  assert.equal(印だけの差分([元()], [元({ lastModified: 999 })]), null);
});

// ──────────────────────────────────────────────────────────────
// まだ見ていなかった組み合わせ。
// 2台・○×だけ・つながっている、という一本道しか確かめていなかった。
// ──────────────────────────────────────────────────────────────

/**
 * 同じライブを見る端末を作る。
 *
 * 注意：startLiveSync は通さない。ライブ中の印を立てるだけなので、
 * サーバーには盤面が載らず、台どうしの盤面同期も起きない。
 * 共有履歴（live_history）に何が積まれるかを見る検査のための土台で、
 * 「相手の画面にどう映るか」を見たいときには使えない。
 * そちらは startLiveSync と joinLiveSync を通すこと。
 * この違いを見落として、検査の失敗をアプリの不具合と誤って報告した。
 */
function ライブの端末(共有, 射手たち) {
  const 端 = 端末(共有);
  端.store.setState({
    archers: 射手たち,
    isLiveActive: true,
    liveSessionName: ライブ名,
    historySharedLen: 0,
    historySharedMax: 0,
  });
  return 端;
}

const 三人 = () => [
  射手(),
  射手({ id: 'a2', name: '二人目' }),
  射手({ id: 'a3', name: '三人目' }),
];

test('共有履歴：3台が同時に入れても、どの手も控えに残る', async () => {
  const A = ライブの端末(undefined, 三人());
  const B = ライブの端末(A.ライブ, 三人());
  const C = ライブの端末(A.ライブ, 三人());

  A.store.getState().toggleMark('a1', 0);
  B.store.getState().toggleMark('a2', 0);
  C.store.getState().toggleMark('a3', 0);
  await 待つ(0);

  const 控え = A.ライブ.値(`live_history/${団体}/${ライブ名}`) || {};
  assert.equal(Object.keys(控え).length, 3, '3台ぶん残っていない');
  const 目印 = A.ライブ.値(`live_sessions/${団体}/${ライブ名}/state`) || {};
  assert.equal(目印.history_len, 3, '目印が3まで進んでいない');

  // どの控えも、自分が変えた1ますだけを指している
  [0, 1, 2].forEach((i) => {
    assert.equal(控え[i].差分.length, 1, `${i}番の控えが1ますになっていない`);
  });
  const 射手たち = [0, 1, 2].map((i) => 控え[i].差分[0].射手).sort();
  assert.deepEqual(射手たち, ['a1', 'a2', 'a3'], '同じ射手を指している控えがある');
});

test('共有履歴：3台のうち1台が取り消しても、他2台の手は残る', async () => {
  const A = ライブの端末(undefined, 三人());
  const B = ライブの端末(A.ライブ, 三人());
  const C = ライブの端末(A.ライブ, 三人());

  A.store.getState().toggleMark('a1', 0);
  B.store.getState().toggleMark('a2', 0);
  C.store.getState().toggleMark('a3', 0);
  await 待つ(0);

  // 同期が行き渡り、A に3つとも見えている状態にする
  A.store.setState({
    archers: 三人().map((a) => Object.assign({}, a, { marks: ['○', '', '', ''] })),
  });

  await A.store.getState().sharedUndo(-1);
  await 待つ(0);

  const 印 = (id) => A.store.getState().archers.find((a) => a.id === id).marks[0];
  assert.equal(印('a3'), '', '最後の手（C の入力）が戻っていない');
  assert.equal(印('a1'), '○', 'A の手まで消えた');
  assert.equal(印('a2'), '○', 'B の手まで消えた');
});

test('共有履歴：鍵と○×を同時にしても、取り消しで相手の手が消えない', async () => {
  // 鍵は○×だけの違いではないので、ますごとの差分にはできない。
  // かわりに「変わった項目」だけを控えに持たせ、鍵は lockedBlocks だけを
  // 戻すようにした。同じ盤面に相手が入れた○×には触れない
  const A = ライブの端末(undefined, [射手(), 射手({ id: 'a2', name: '二人目' })]);
  const B = ライブの端末(A.ライブ, [射手(), 射手({ id: 'a2', name: '二人目' })]);

  B.store.getState().toggleMark('a2', 0); // 差分になる
  A.store.getState().toggleLock('a1', 0); // 形が変わる＝まるごと
  await 待つ(0);

  const 控え = A.ライブ.値(`live_history/${団体}/${ライブ名}`) || {};
  assert.equal(Object.keys(控え).length, 2, '2件とも残っている');
  assert.ok(控え[0].差分, '○×の控えは差分になっている');
  assert.equal(控え[1].差分, undefined, '鍵はますごとの差分ではない');
  assert.ok(控え[1].項目, '鍵の控えが項目ごとになっていない');

  A.store.setState({
    archers: [
      射手({ lockedBlocks: { 0: true } }),
      射手({ id: 'a2', name: '二人目', marks: ['○', '', '', ''] }),
    ],
  });

  await A.store.getState().sharedUndo(-1);
  await 待つ(0);

  const a2 = A.store.getState().archers.find((a) => a.id === 'a2');
  const a1 = A.store.getState().archers.find((a) => a.id === 'a1');
  assert.equal(a2.marks[0], '○', '相手の○×が消えた');
  assert.deepEqual(a1.lockedBlocks, {}, '鍵が外れていない');
});

test('通信が遅くても、取り消しは1手だけ戻す', async () => {
  const A = ライブの端末(undefined, [射手(), 射手({ id: 'a2', name: '二人目' })]);
  const B = ライブの端末(A.ライブ, [射手(), 射手({ id: 'a2', name: '二人目' })]);
  A.ライブ.状態.遅延 = 30;

  A.store.getState().toggleMark('a1', 0);
  B.store.getState().toggleMark('a2', 0);
  await 待つ(120);

  const 控え = A.ライブ.値(`live_history/${団体}/${ライブ名}`) || {};
  assert.equal(Object.keys(控え).length, 2, '遅いと控えが取りこぼされる');

  A.store.setState({
    archers: [
      射手({ marks: ['○', '', '', ''] }),
      射手({ id: 'a2', name: '二人目', marks: ['○', '', '', ''] }),
    ],
  });
  await A.store.getState().sharedUndo(-1);
  await 待つ(120);

  const 印 = (id) => A.store.getState().archers.find((a) => a.id === id).marks[0];
  assert.ok(印('a1') === '○' || 印('a2') === '○', '遅いと両方消える');
});

test('回線が切れているあいだの操作は、控えに積まれない（つながれば積まれる）', async () => {
  // 場所取りは runTransaction。決着しないあいだは控えも目印も動かない。
  // 盤面そのものは手元に入るので、記録は失われない
  const A = ライブの端末(undefined, [射手()]);
  A.ライブ.状態.オフライン = true;

  A.store.getState().toggleMark('a1', 0);
  await 待つ(20);

  assert.equal(印(A.store), '○', '手元には入っている');
  assert.equal(A.ライブ.値(`live_history/${団体}/${ライブ名}`), null, '切れているのに控えが載った');
  assert.equal(A.store.getState().historySharedLen, 0, '目印だけ進んでいる');
});

test('共有履歴：項目ごとの控えにしてよい操作と、まるごとに任せる操作', () => {
  // 項目ごとに戻せるのは「人数・並び・射数が同じ」ときだけ。
  // 位置がずれる操作や、盤面全体の値が動く操作は当てる先を誤るので、
  // 従来どおりまるごとに任せる
  const { 項目の差分 } = require('../src/syncRules');
  const 元 = (o) =>
    Object.assign(
      {
        id: 'a1',
        name: '一人目',
        gender: '男性',
        grade: 1,
        marks: ['', '', '', ''],
        lockedBlocks: {},
        substitutions: {},
        substitutionIds: {},
        arrowLocations: [null, null, null, null],
        lastModified: 1,
      },
      o
    );

  // 項目ごとに戻せるもの
  const 戻せる = {
    鍵をかけた: [元({ lockedBlocks: { 0: true }, lastModified: 2 })],
    名前を変えた: [元({ name: '二人目', lastModified: 2 })],
    代役を入れた: [元({ substitutions: { 0: '誰か' }, lastModified: 2 })],
    矢所を置いた: [元({ arrowLocations: [{ x: 1, y: 1 }, null, null, null], lastModified: 2 })],
  };
  for (const 名 of Object.keys(戻せる)) {
    const 出 = 項目の差分([元()], 戻せる[名]);
    assert.ok(出 && 出.length === 1, `${名}：項目ごとの控えになっていない`);
    assert.equal(出[0].射手, 'a1');
  }

  // まるごとに任せるもの
  assert.equal(項目の差分([元()], [元(), 元({ id: 'a2' })]), null, '射手を足した');
  assert.equal(項目の差分([元(), 元({ id: 'a2' })], [元()]), null, '射手を消した');
  assert.equal(項目の差分([元(), 元({ id: 'a2' })], [元({ id: 'a2' }), 元()]), null, '並び替え');
  assert.equal(
    項目の差分([元()], [元({ marks: ['', '', '', '', '', '', '', ''], lastModified: 2 })]),
    null,
    '射数を増やした（盤面全体の値も動く）'
  );
  assert.equal(項目の差分([元()], [元({ lastModified: 999 })]), null, '日時だけの違い');
});

test('共有履歴：項目ごとに戻しても、同じ射手の相手の○×は残る', () => {
  const { 項目差分を当てる } = require('../src/syncRules');
  // 鍵をかけたのと同じ射手に、相手が○を入れている盤面
  const いま = [{ id: 'a1', name: '一人目', marks: ['○', '', '', ''], lockedBlocks: { 0: true } }];
  const 出 = 項目差分を当てる(
    いま,
    [{ 射手: 'a1', 項目: { lockedBlocks: { 前: {}, 後: { 0: true } } } }],
    -1
  );
  assert.deepEqual(出.archers[0].lockedBlocks, {}, '鍵が外れていない');
  assert.deepEqual(出.archers[0].marks, ['○', '', '', ''], '相手の○×まで戻した');
});

test('取り消し：画像から取り込んだ直後に戻しても、盤面が消えない', () => {
  // 履歴には射手の一覧をそのまま積む決まり（店の中の14か所はすべてそう）。
  // 画像の取り込みだけが { archers, activeSessionID } という形で積んでいた。
  // 取り消しは配列として扱うので、配列でないものが来ると空の盤面で戻る
  const { store } = ストアを用意する();
  const 元 = [
    {
      id: 'a1',
      name: '山田',
      marks: ['○', '×', '', ''],
      lockedBlocks: {},
      arrowLocations: [null, null, null, null],
      lastModified: 1,
    },
  ];
  store.setState({
    isHydrated: true,
    shotsPerRound: 4,
    archers: 元,
    // 画像の取り込みが積んでいたのと同じ形
    historyStack: [{ archers: [...元], activeSessionID: null }],
    redoStack: [],
  });
  // 取り込んだ結果に入れ替わった状態
  store.setState({
    archers: [
      {
        id: 'b1',
        name: '読み取った人',
        marks: ['○', '○', '', ''],
        lockedBlocks: {},
        arrowLocations: [null, null, null, null],
        lastModified: 2,
      },
    ],
  });

  store.getState().undo();
  const 後 = store.getState().archers;
  assert.equal(後.length, 1, `取り消しで盤面が ${後.length} 人になった`);
  assert.equal(後[0].name, '山田', '取り込む前の射手に戻っていない');
  assert.deepEqual(後[0].marks, ['○', '×', '', ''], '取り込む前の○×に戻っていない');
});

test('取り消し：射数を減らしたあとに戻しても、○×が射数からはみ出さない', () => {
  // 射数の変更は履歴に積まれない。そのため「8射で入れる → 4射に減らす →
  // 取り消す」で、○×の配列だけが8のまま戻る。はみ出したますは画面に
  // 出ないのに、的中数は配列を丸ごと数えるので数には入る。
  // ライブは要らない。ひとりで使っていても起きる
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    shotsPerRound: 8,
    archers: [
      {
        id: 'a1',
        name: '一人目',
        // 後ろ半分に○。4射に減らすと画面から消える位置
        marks: ['', '', '', '', '○', '○', '○', '○'],
        lockedBlocks: {},
        arrowLocations: [null, null, null, null, null, null, null, null],
        lastModified: 1,
      },
    ],
    historyStack: [],
    redoStack: [],
  });
  store.getState().toggleMark('a1', 0);
  store.getState().setShotsPerRound(4);
  assert.equal(store.getState().archers[0].marks.length, 4, '前提：減らした時点では4');

  store.getState().undo();
  const 後 = store.getState().archers[0];
  // 射数の変更も取り消しの一手になったので、射数ごと8に戻る。
  // ○×も8個そろい、はみ出しは無い（＝的中数と見えている数が一致する）
  assert.equal(store.getState().shotsPerRound, 8, '射数が戻っていない');
  assert.equal(後.marks.length, store.getState().shotsPerRound, '○×が射数からはみ出した');
  // 戻るのは「射数を減らす直前」の盤面。直前の一手（0本目に入れた○）は
  // まだ効いているので、○は5つ
  assert.equal(後.marks.filter((m) => m === '○').length, 5, '減らす直前の○×が戻っていない');

  // もう一手戻すと、その前の○×の操作が戻る
  store.getState().undo();
  assert.equal(store.getState().archers[0].marks[0], '', '前の一手まで戻っていない');

  // やり直すと4射へ進み直す
  store.getState().redo();
  store.getState().redo();
  assert.equal(store.getState().shotsPerRound, 4, 'やり直しで射数が進んでいない');
  assert.equal(store.getState().archers[0].marks.length, 4, 'やり直しで○×が射数に揃っていない');
});

test('共有履歴：項目で戻すときも、いまの射数からはみ出さない', () => {
  const { 項目差分を当てる } = require('../src/syncRules');
  // 8射のときに積んだ控えを、4射に減らしたあとで戻す場面。
  // 射数の変更は控えに積まれないので（すぐ上の検査）、控えの中身だけが
  // 8射のまま残る。そのまま当てると ○× の配列が伸びる。
  // 的中数は配列を丸ごと数えるので、画面に出ないますの○が数に入ってしまう
  const いま = [{ id: 'a1', name: '一人目', marks: ['○', '', '', ''] }];
  const 出 = 項目差分を当てる(
    いま,
    [
      {
        射手: 'a1',
        項目: {
          name: { 前: 'むかしの名', 後: '一人目' },
          marks: { 前: ['○', '×', '○', '×', '○', '○', '○', '○'], 後: ['○', '', '', ''] },
        },
      },
    ],
    -1
  );
  const 戻した = 出.archers[0].marks;
  assert.equal(戻した.length, 4, `○×が ${戻した.length} 個に伸びた（いまは4射）`);
  assert.equal(
    戻した.filter((m) => m === '○').length,
    2,
    '画面に出ないますの○まで数に入る'
  );
  assert.equal(出.archers[0].name, 'むかしの名', '名前が戻っていない');
});

test('共有履歴：射数の変更も控えに積まれ、取り消すと射数ごと戻る', async () => {
  // 射数の変更を取り消しの一手にした。ライブでは○×の数が変わるので
  // ますごとの差分にも項目ごとの差分にもできず、盤面まるごとの控えになる。
  // まるごとの控えは射数（本数）も持っているので、取り消すと射数ごと戻る
  const A = ライブの端末(undefined, [射手(), 射手({ id: 'a2', name: '二人目' })]);

  A.store.getState().setShotsPerRound(8);
  await 待つ(0);
  assert.equal(A.store.getState().shotsPerRound, 8, '前提：8射になっている');

  const 控え = A.ライブ.値(`live_history/${団体}/${ライブ名}`) || {};
  assert.equal(Object.keys(控え).length, 1, '射数の変更が控えに積まれていない');
  assert.equal(控え[0].本数, 4, '控えが持つ射数が、変える前の値になっていない');

  A.store.getState().undo();
  await 待つ(10);
  assert.equal(A.store.getState().shotsPerRound, 4, '取り消しで射数が戻っていない');
  assert.equal(A.store.getState().archers[0].marks.length, 4, '○×が射数に揃っていない');

  // やり直しでも射数が進む。まるごとで戻す経路は控えの本数（変える前の値）を
  // 使うため、やり直すと射数だけ古いまま残っていた
  A.store.getState().redo();
  await 待つ(10);
  assert.equal(A.store.getState().shotsPerRound, 8, 'やり直しで射数が進んでいない');
  assert.equal(A.store.getState().archers[0].marks.length, 8, 'やり直しで○×が射数に揃っていない');
});

test('共有履歴：射数の変更を取り消しても、あとから入った相手の○×は残る', async () => {
  // 射数の変更は○×の数が変わるので、ますごとにも項目ごとにも差分にできない。
  // 盤面まるごとで戻すと、控えを作ったあとに相手が入れた○×まで消える。
  // 「長さの伸び縮みだけ」の控えにしてあるので、頭のますには触らない
  const A = ライブの端末(undefined, [射手(), 射手({ id: 'a2', name: '二人目' })]);

  A.store.getState().setShotsPerRound(8);
  await 待つ(0);

  // 射数を変えたあとに、相手が a2 へ○を入れて届いた状態にする
  // （この検査ファイルの他の3台ものと同じで、届いた結果を手で置く）
  A.store.setState({
    archers: [
      射手({ marks: ['', '', '', '', '', '', '', ''] }),
      射手({ id: 'a2', name: '二人目', marks: ['○', '', '', '', '', '', '', ''] }),
    ],
  });

  await A.store.getState().sharedUndo(-1);
  await 待つ(0);

  assert.equal(A.store.getState().shotsPerRound, 4, '射数が戻っていない');
  const a2 = A.store.getState().archers.find((a) => a.id === 'a2');
  assert.equal(a2.marks[0], '○', '相手の○×を巻き込んで消した');
});

// ──────────────────────────────────────────────────────────────
// まだ見ていなかった3つの角度
// ──────────────────────────────────────────────────────────────

// 片付けたあと、サーバーの marks_by_id には居なくなった射手の分が残る
// （射手ごとの道に書くようにしたため）。ただし表示は state.archers を
// 土台にするので、残骸は見えない。ここでは利用者に見える性質を確かめる。
// 未解決。主催者が片付けても、参加者の画面に盤面が残る（見える性質でも落ちる）。
// ただし既存の検査『ライブ中にリセットすると、共有の取り消し履歴も消える』は
// 通っているので、片付けの知らせ自体は相手に届いている。届いたあとに盤面を
// 片付ける処理まで至っていないか、この検査の待ち時間が短いかのどちらか。
// 私の変更が持ち込んだものかも未確認。切り分けできていない。
// 未解決（既存不具合）。主催者が片付けても、参加者の画面に盤面が残る。
// ここまでで分かったこと：
// ・今日のライブ修正を入れる前（2c1ade9）でも同じように落ちる＝既存
// ・待ち時間の問題ではない（30ms→300ms でも同じ）
// ・主催者は知らせを書いている（reset_at・archers:[]・marks_by_id:{} を
//   まとめて update。ただし resetCurrentSession(真) のときだけ）
// ・参加者側にも受け取る処理がある（reset_at を見て resetCurrentSession(!1)）
// ・「片付けの直後に同じ通知の archers で戻る」と考えて、その通知の
//   突き合わせを飛ばしてみたが直らなかった（変更は戻した）
// つまり参加者の盤面がそもそも片付いていない。次はそこを見る。
test('ライブ中に盤面を片付けると、相手の画面からも消える', async () => {
  // 主催者は startLiveSync を通す。setState でライブ中の印を立てるだけでは
  // サーバーに盤面が一度も載らず、参加者は空の節点を掴む
  const 主 = 端末();
  主.store.setState({ archers: [射手({ marks: ['○', '×', '', ''] })] });
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(10);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(参.store.getState().archers[0].marks[0], '○', '前提：届いている');

  // 引数が真のときだけ相手に知らせを書く（実際の「終了・保存」もこちら）
  主.store.getState().resetCurrentSession(!0);
  await 待つ(50);

  assert.equal(参.store.getState().archers.length, 0, '相手の画面に盤面が残っている');
});
// 画面は「lastResetHandled が変わったら知らせる。ただし
// lastResetHandled === lastPushedTimestamp なら自分の操作なので出さない」
// という作り。ここでは店の値だけを見る
const 片付けを知らせるか = (store) => {
  const s = store.getState();
  return s.lastResetHandled > 0 && s.lastResetHandled !== s.lastPushedTimestamp;
};

test('参加して何もしていない人にも、片付けの知らせが出る', async () => {
  // 参加者が一度も送信していないと lastResetHandled が 0 のままで、
  // 「初めて受け取るリセット＝入る前のもの」と誤って扱われ、
  // lastPushedTimestamp に reset_at と同じ値が入って知らせが消えていた
  const 主 = 端末();
  主.store.setState({ archers: [射手({ marks: ['○', '×', '', ''] })] });
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(10);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(参.store.getState().archers[0].marks[0], '○', '前提：届いている');

  // 参加者は何も操作しないまま、主催者が片付ける
  主.store.getState().resetCurrentSession(!0);
  await 待つ(50);

  assert.equal(片付けを知らせるか(参.store), true, '何もしていない人に知らせが出ない');
  assert.equal(片付けを知らせるか(主.store), false, '押した本人にまで知らせが出る');
});

test('入る前に片付けられていた場合は、入った人に知らせを出さない', async () => {
  // 入る前の出来事なので、参加した瞬間に「リセットしました」と出るのは誤り
  const 主 = 端末();
  主.store.setState({ archers: [射手({ marks: ['○', '×', '', ''] })] });
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(10);
  主.store.getState().resetCurrentSession(!0);
  await 待つ(20);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(30);

  assert.equal(片付けを知らせるか(参.store), false, '入る前の片付けまで知らせている');
});

test('参加者が抜けて入り直しても、○×が見える', async () => {
  // 主催者は startLiveSync を通す。setState でライブ中の印を立てるだけでは
  // サーバーに盤面が一度も載らず、参加者は空の節点を掴む
  const 主 = 端末();
  主.store.setState({ archers: [射手({ marks: ['○', '×', '', ''] })] });
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(10);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(参.store.getState().archers[0].marks[0], '○', '前提：参加できている');

  参.store.getState().stopLiveSync();
  await 待つ(20);

  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(参.store.getState().archers[0].marks[0], '○', '入り直したら○が消えた');
  assert.equal(参.store.getState().archers[0].marks[1], '×', '入り直したら×が消えた');
});

test('3台で形が変わる操作をしても、取り消しは相手の○×を巻き込まない', async () => {
  const A = ライブの端末(undefined, 三人());
  const B = ライブの端末(A.ライブ, 三人());
  const C = ライブの端末(A.ライブ, 三人());

  B.store.getState().toggleMark('a2', 0);
  C.store.getState().toggleMark('a3', 0);
  A.store.getState().toggleLock('a1', 0); // 形が変わる＝項目ごとの控え
  await 待つ(0);

  const 控え = A.ライブ.値(`live_history/${団体}/${ライブ名}`) || {};
  assert.equal(Object.keys(控え).length, 3, '3件とも積まれていない');
  assert.ok(控え[2].項目, '鍵の控えが項目ごとになっていない');

  A.store.setState({
    archers: [
      射手({ lockedBlocks: { 0: true } }),
      射手({ id: 'a2', name: '二人目', marks: ['○', '', '', ''] }),
      射手({ id: 'a3', name: '三人目', marks: ['○', '', '', ''] }),
    ],
  });

  await A.store.getState().sharedUndo(-1);
  await 待つ(0);

  const 見る = (id) => A.store.getState().archers.find((a) => a.id === id);
  assert.deepEqual(見る('a1').lockedBlocks, {}, '鍵が外れていない');
  assert.equal(見る('a2').marks[0], '○', 'B の○が消えた');
  assert.equal(見る('a3').marks[0], '○', 'C の○が消えた');
});

test('取り消し：控えの射数は「計」の列から読まない', () => {
  // 本番の記録には、射数12なのに「計」の列だけ○×が20個あるものが実在する。
  // 控えの射数を先頭の非区切りから読むと、盤面の先頭が「計」のときに
  // その長さを射数だと思い込み、取り消しで射数が化ける
  const { store } = ストアを用意する();
  const マス = (n) => Array(n).fill('');
  store.setState({
    isHydrated: true,
    shotsPerRound: 4,
    archers: [
      { id: 't1', name: '計', isTotalCalculator: true, marks: マス(20), lockedBlocks: {}, lastModified: 1 },
      { id: 'a1', name: '山田', marks: ['○', '', '', ''], lockedBlocks: {}, lastModified: 1 },
    ],
    historyStack: [],
    redoStack: [],
  });
  // 何か一手を積む
  store.getState().toggleMark('a1', 1);
  store.getState().undo();

  assert.equal(store.getState().shotsPerRound, 4, '「計」の○×の数を射数と取り違えた');
});
