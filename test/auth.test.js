/**
 * ログイン・ログアウトまわりの検査。
 *
 *   npm test
 *
 * ログアウトは手元の記録を全部消すので、送信できていないものが
 * 残っていないかが要点になる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;

const 記録 = (o) =>
  Object.assign({ id: 'ses-1', title: '練習', date: 1000, archers: [], lastModified: 1000 }, o);

async function 用意() {
  const { store, 雲, 知らせ } = ストアを用意する();
  await 待つ(30);
  store.setState({
    activeGroupId: null,
    activeRole: null,
    isHydrated: true,
    isNetworkOnline: true,
    members: [],
    alumni: [],
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    archers: [],
    lastSyncTime: null,
  });
  return { store, 雲, 知らせ };
}

// ──────────────────────────────────────────────────────────────
test('ログイン：団体として入ると、団体IDと役割が入る', async () => {
  const { store } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'admin@example.com', null, 'テスト団体');
  await 待つ(30);

  const s = store.getState();
  assert.equal(s.activeGroupId, 団体);
  assert.equal(s.activeRole, 'group');
  assert.equal(s.activeUserEmail, 'admin@example.com');
  assert.equal(s.activeGroupName, 'テスト団体');
  assert.equal(s.publicGroupId, 団体, '団体ログインでは公開IDも団体IDになる');
  assert.equal(s.isAdminMode, false, '管理者モードは入り直すたびに切れる');
});

test('ログイン：部員として入ると、自分のメンバーIDが入る', async () => {
  const { store } = await 用意();
  store.getState().setAuth(団体, 'member', 'mem-1', null, 団体, 'テスト団体', '部員1');
  await 待つ(30);

  const s = store.getState();
  assert.equal(s.activeRole, 'member');
  assert.equal(s.myMemberId, 'mem-1');
  assert.equal(s.myMemberName, '部員1');
});

test('ログアウト：団体の情報と記録が消える', async () => {
  const { store } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'admin@example.com');
  await 待つ(30);
  store.setState({ sessions: [記録({ syncStatus: '同期済み' })], members: [{ id: 'm1' }] });

  store.getState().setAuth(null);
  await 待つ(30);

  const s = store.getState();
  assert.equal(s.activeGroupId, null);
  assert.equal(s.activeRole, null);
  assert.equal(s.sessions.length, 0);
  assert.equal(s.members.length, 0);
  assert.equal(s.trash.length, 0);
  assert.equal(s.archers.length, 0);
});

test('ログアウト：管理者モードが必ず切れる', async () => {
  const { store } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'a@example.com');
  await 待つ(30);
  store.setState({ isAdminMode: true });

  store.getState().setAuth(null);
  await 待つ(30);
  assert.equal(store.getState().isAdminMode, false);

  // 入り直しても切れたまま
  store.getState().setAuth(団体, 'group', null, 'a@example.com');
  await 待つ(30);
  assert.equal(store.getState().isAdminMode, false);
});

test('ログアウト：見張りを止める（別団体の更新を拾わない）', async () => {
  const { store, 雲 } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'a@example.com');
  await 待つ(50);

  store.getState().setAuth(null);
  await 待つ(30);

  // ログアウト後にクラウドが変わっても、手元には入ってこない
  雲.置く(記録の道, 'ses-9', 記録({ id: 'ses-9' }));
  await 待つ(50);
  assert.equal(store.getState().sessions.length, 0, '拾っていない');
});

// ──────────────────────────────────────────────────────────────
// ログアウトは手元の記録を全部捨てるので、抜ける前に送り切れるかを見る。
// ──────────────────────────────────────────────────────────────
test('未送信の数：記録・名簿・卒業生・ゴミ箱をまとめて数える', async () => {
  const { store } = await 用意();
  store.setState({
    sessions: [記録({ syncStatus: '未同期' }), 記録({ id: 'ses-2', syncStatus: '同期済み' })],
    members: [{ id: 'm1', syncStatus: '未同期' }],
    alumni: [{ id: 'a1', syncStatus: '同期済み' }],
    trash: [記録({ id: 'tr-1', syncStatus: '未同期' })],
  });
  assert.equal(store.getState().countUnsynced(), 3);
});

test('ログアウト前：送り切れれば残りは0になる', async () => {
  const { store, 雲 } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'a@example.com');
  await 待つ(50);
  store.setState({ sessions: [記録({ syncStatus: '未同期' })] });

  const 残り = await store.getState().flushUnsyncedForLogout();

  assert.equal(残り, 0, '送り切れた');
  assert.ok(雲.値(記録の道, 'ses-1'), 'クラウドへ届いている');
});

test('ログアウト前：送れなければ残った数を返す（利用者に知らせるため）', async () => {
  const { store, 雲 } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'a@example.com');
  await 待つ(50);
  雲.状態.失敗させる = true;
  store.setState({ sessions: [記録({ syncStatus: '未同期' })] });

  const 残り = await store.getState().flushUnsyncedForLogout();

  assert.equal(残り, 1, '残っていることが分かる');
  assert.equal(store.getState().sessions.length, 1, 'まだ捨てていない');
});

test('ログアウト前：圏外なら送信を試さずに数だけ返す', async () => {
  const { store } = await 用意();
  store.setState({
    isNetworkOnline: false,
    sessions: [記録({ syncStatus: '未同期' }), 記録({ id: 'ses-2', syncStatus: '未同期' })],
  });

  const 始め = Date.now();
  const 残り = await store.getState().flushUnsyncedForLogout();

  assert.equal(残り, 2);
  assert.ok(Date.now() - 始め < 500, '待たされない');
});

test('ログアウト前：送るものが無ければ何もしない', async () => {
  const { store, 雲 } = await 用意();
  store.setState({ sessions: [記録({ syncStatus: '同期済み' })] });
  const 前 = 雲.記録.length;

  assert.equal(await store.getState().flushUnsyncedForLogout(), 0);
  assert.equal(雲.記録.length, 前, '余計な通信をしない');
});

test('ログアウト：それでも捨てるのは変わらない（画面側で確認を出す）', async () => {
  // ストアの setAuth(null) は今までどおり全部捨てる。送るかどうか・
  // 捨ててよいかの判断は画面側（設定画面のログアウト確認）で行う。
  const { store, 雲 } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'a@example.com');
  await 待つ(50);
  雲.状態.失敗させる = true;
  store.setState({ sessions: [記録({ syncStatus: '未同期' })] });

  store.getState().setAuth(null);
  await 待つ(30);
  assert.equal(store.getState().sessions.length, 0);
});

// ──────────────────────────────────────────────────────────────
test('パスワード再設定：通信できないときは断る', async () => {
  const { store } = await 用意();
  store.setState({ isNetworkOnline: false });

  const r = await store.getState().recoverPassword('a@example.com');
  assert.equal(r.success, false);
  assert.match(r.error, /オフライン/);
});

test('パスワード再設定：通信できれば送れる', async () => {
  const { store } = await 用意();
  store.setState({ isNetworkOnline: true });

  const r = await store.getState().recoverPassword('a@example.com');
  assert.equal(r.success, true);
});
