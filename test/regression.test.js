/**
 * 今回の修正が新しい不具合を生んでいないかを見る検査。
 *
 *   npm test
 *
 * 直した内容そのものではなく、「直したことで別のところが壊れていないか」を
 * 狙って書いてある。疑わしいと当たりを付けた場所を1つずつ潰す。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;
const 名簿の道 = `groups/${団体}/members`;
const ライブ名 = '朝練';

const 記録 = (o) =>
  Object.assign({ id: 'ses-1', title: '練習', date: 1000, archers: [], lastModified: 1000 }, o);
const 射手 = (o) =>
  Object.assign({ id: 'a1', name: '一人目', marks: ['', '', '', ''], lastModified: 1000 }, o);

async function 用意(役割 = 'group') {
  const { store, 雲, ライブ } = ストアを用意する();
  await 待つ(30);
  store.setState({
    activeGroupId: 団体,
    activeRole: 役割,
    isHydrated: true,
    isNetworkOnline: true,
    members: [],
    alumni: [],
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    deletedMembers: {},
    archers: [],
    shotsPerRound: 4,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    lastPushedTimestamp: 0,
    lastResetHandled: 0,
    historyStack: [],
    redoStack: [],
    lastSyncTime: null,
  });
  return { store, 雲, ライブ };
}

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
    deletedMembers: {},
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

// ──────────────────────────────────────────────────────────────
// ログアウト前の送り切りは、部員ログインでも効くか
// ──────────────────────────────────────────────────────────────
test('部員ログインでも、ログアウト前に記録を送り切れる', async () => {
  // 名簿の送り直しは団体限定だが、記録は役割に関わらず送る作りになっている。
  // ここが効かないと、部員が圏外で保存してログアウトしたときに失われる。
  const { store, 雲 } = await 用意('member');
  store.setState({ myMemberId: 'mem-1', sessions: [記録({ syncStatus: '未同期' })] });

  const 残り = await store.getState().flushUnsyncedForLogout();

  assert.equal(残り, 0, '送り切れた');
  assert.ok(雲.値(記録の道, 'ses-1'), 'クラウドへ届いている');
});

test('部員ログインで名簿に未送信が混じっても、3秒で見切りをつける', async () => {
  // 名簿の送り直しは団体限定なので、部員のときは送られない。
  // 待ち続けずに残った数を返し、画面が固まらないこと。
  const { store } = await 用意('member');
  store.setState({ members: [{ id: 'mem-9', name: '誰か', syncStatus: '未同期', lastModified: 1 }] });

  const 始め = Date.now();
  const 残り = await store.getState().flushUnsyncedForLogout();
  const かかった = Date.now() - 始め;

  assert.equal(残り, 1, '残っていることが分かる');
  assert.ok(かかった < 5000, `待ちすぎない（${かかった}ms）`);
});

// ──────────────────────────────────────────────────────────────
// 矢所の送信を全体送信にしたことで、相手の入力を潰していないか
// ──────────────────────────────────────────────────────────────
test('矢所を置いても、相手が直前に入れた○を消さない', async () => {
  // updateArrowLocation は全体送信を使う。全体送信は archers と marks_by_id を
  // まるごと置き換えるので、手元が古いまま送ると相手の入力を巻き戻しうる。
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  // 参加者が○を入れ、主催者に届く
  参.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  assert.equal(主.store.getState().archers[0].marks[0], '○', '前提：主催者に届いている');

  // 主催者が矢所を置く（全体送信が走る）
  主.store.getState().updateArrowLocation('a1', 2, { x: 1, y: 1 });
  await 待つ(20);

  assert.equal(参.store.getState().archers[0].marks[0], '○', '参加者の○が残っている');
  assert.equal(主.store.getState().archers[0].marks[0], '○', '主催者側でも残っている');
});

// ──────────────────────────────────────────────────────────────
// 取り消しの日時の打ち直しが、他の射手を巻き込んでいないか
// ──────────────────────────────────────────────────────────────
test('取り消しは「最後の1手」を戻す。誰の操作でも同じ', async () => {
  // ライブ中は全員で1本の履歴を使う。主催者が押しても、戻るのは
  // 直前の1手（この例では参加者の×）で、それより前の○は残る。
  const 主 = 端末();
  主.store.setState({ archers: [射手(), 射手({ id: 'a2', name: '二人目' })] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  主.store.getState().updateMark('a1', 0, '○'); // 1手目：主催者
  await 待つ(40);
  参.store.getState().updateMark('a2', 0, '×'); // 2手目：参加者
  await 待つ(40);

  主.store.getState().undo(); // 主催者が押す
  await 待つ(60);

  const 主の射手 = (id) => 主.store.getState().archers.find((a) => a.id === id);
  const 参の射手 = (id) => 参.store.getState().archers.find((a) => a.id === id);
  assert.equal(主の射手('a2').marks[0], '', '最後の1手（参加者の×）が戻る');
  assert.equal(主の射手('a1').marks[0], '○', 'それより前の入力は残る');
  assert.equal(参の射手('a2').marks[0], '', '参加者の画面も同じ');
  assert.equal(参の射手('a1').marks[0], '○', '参加者の画面も同じ');
});

test('取り消しは、押した人が誰でも同じ結果になる', async () => {
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(40);

  参.store.getState().undo(); // 参加者が押す
  await 待つ(60);

  assert.equal(主.store.getState().archers[0].marks[0], '', '主催者の画面でも戻る');
  assert.equal(参.store.getState().archers[0].marks[0], '', '参加者の画面でも戻る');
});

test('取り消したことが、押した本人にも他の人にも知らされる', async () => {
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(40);
  主.store.getState().undo();
  await 待つ(60);

  assert.ok(参.store.getState().historyNoticeAt > 0, '参加者に知らせが届く');
  assert.equal(参.store.getState().historyNoticeKind, '取り消し');
  assert.ok(主.store.getState().historyNoticeAt > 0, '押した本人にも出る');
  assert.equal(主.store.getState().historyNoticeKind, '取り消し');
});

test('やり直しの知らせは「やり直し」と出る', async () => {
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(40);
  主.store.getState().undo();
  await 待つ(60);
  主.store.getState().redo();
  await 待つ(60);

  assert.equal(主.store.getState().historyNoticeKind, 'やり直し', '押した本人');
  assert.equal(参.store.getState().historyNoticeKind, 'やり直し', '他の人');
});

test('知らせは一度だけ出る（返りが届いても二重にならない）', async () => {
  const 主 = 端末();
  主.store.setState({ archers: [射手()] });
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(20);

  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(40);
  主.store.getState().undo();
  await 待つ(30);
  const 一度目 = 主.store.getState().historyNoticeAt;
  await 待つ(80); // 返りが届く時間

  assert.equal(主.store.getState().historyNoticeAt, 一度目, '値が動かない＝二重に出ない');
});

// ──────────────────────────────────────────────────────────────
// メンバー削除の控えが、別のメンバーを巻き込んでいないか
// ──────────────────────────────────────────────────────────────
test('メンバーの控えは、消していないメンバーに影響しない', async () => {
  const { store, 雲 } = await 用意();
  const 部員 = (id, 名) => ({ id, name: 名, personalId: '10' + id.slice(-2), lastModified: 1000, syncStatus: '同期済み' });
  雲.置く(名簿の道, 'mem-1', 部員('mem-1', '部員1'));
  雲.置く(名簿の道, 'mem-2', 部員('mem-2', '部員2'));
  store.setState({ members: [部員('mem-1', '部員1'), 部員('mem-2', '部員2')] });

  雲.状態.失敗させる = true;
  store.getState().deleteMember('mem-1');
  await 待つ(50);
  雲.状態.失敗させる = false;

  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(80);

  const 残り = store.getState().members.map((m) => m.id);
  assert.deepEqual(残り, ['mem-2'], '消していないほうは残る');
});

test('メンバーの控えがあっても、新しく足したメンバーは消えない', async () => {
  const { store, 雲 } = await 用意();
  store.setState({ deletedMembers: { 'mem-old': Date.now() } });

  store.getState().addMember('新入部員', '男性', 1);
  await 待つ(50);
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(80);

  assert.equal(store.getState().members.length, 1, '新しいメンバーは残る');
  assert.equal(store.getState().members[0].name, '新入部員');
});

// ──────────────────────────────────────────────────────────────
// 未同期を守る規則が、通常の受信を止めていないか
// ──────────────────────────────────────────────────────────────
test('送信が済んだあとは、他の端末の編集を普通に受け取れる', async () => {
  // 「未同期は上書きしない」を入れたことで、受信そのものが止まっていないか
  const { store, 雲 } = await 用意();
  雲.置く(記録の道, 'ses-1', 記録({ title: '最初' }));
  store.setState({ sessions: [記録({ title: '最初', syncStatus: '同期済み' })] });

  雲.置く(記録の道, 'ses-1', 記録({ title: '他の端末が直した', lastModified: Date.now() + 5000 }));
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);

  assert.equal(store.getState().sessions[0].title, '他の端末が直した');
});

test('送信が済めば「未同期」の守りが外れて、次から普通に受け取れる', async () => {
  const { store, 雲 } = await 用意();
  雲.置く(記録の道, 'ses-1', 記録({ title: '最初' }));
  store.setState({ sessions: [記録({ title: '最初', syncStatus: '同期済み' })] });

  store.getState().updateSession('ses-1', { title: '手元で直した' });
  await 待つ(900); // 送信が届く
  assert.equal(store.getState().sessions[0].syncStatus, '同期済み', '送信が済んだ');

  雲.置く(記録の道, 'ses-1', 記録({ title: '他の端末が直した', lastModified: Date.now() + 5000 }));
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);

  assert.equal(store.getState().sessions[0].title, '他の端末が直した', '守りが残り続けない');
});
