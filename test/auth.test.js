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

test('ログアウト：まだ送っていない記録も消える（既知の穴）', async () => {
  // ログアウトは sessions を丸ごと空にするので、送信できていない記録が
  // あっても確認や送信をせずに捨てる。圏外で保存してそのままログアウトすると
  // 記録が失われる。いまの実装をそのまま写した検査。直したらこれを裏返すこと。
  const { store, 雲 } = await 用意();
  store.getState().setAuth(団体, 'group', null, 'a@example.com');
  await 待つ(50);

  雲.状態.失敗させる = true;
  store.setState({ sessions: [記録({ syncStatus: '未同期' })] });
  assert.equal(store.getState().sessions.length, 1);

  store.getState().setAuth(null);
  await 待つ(30);

  assert.equal(store.getState().sessions.length, 0, '★確認も送信もせず捨てられる');
  assert.equal(雲.値(記録の道, 'ses-1'), undefined, 'クラウドにも無い＝失われた');
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
