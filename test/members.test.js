/**
 * 名簿（メンバー・卒業生・弓具）の検査。
 *
 *   npm test
 *
 * 記録側で直した「通信できないときに手元の操作がクラウドへ届かない」問題が、
 * 名簿側にも同じ形で残っていないかを確かめる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 名簿の道 = `groups/${団体}/members`;
const 卒業生の道 = `groups/${団体}/alumni`;
const 逆引きの道 = `groups/${団体}/member_lookup`;

const 部員 = (o) =>
  Object.assign(
    {
      id: 'mem-1',
      name: '部員1',
      gender: '男性',
      grade: 1,
      personalId: '1011',
      equipments: [],
      lastModified: 1000,
      syncStatus: '同期済み',
    },
    o
  );

async function 用意(既存の雲) {
  const { store, 雲, 知らせ } = ストアを用意する(既存の雲);
  await 待つ(30); // 起動時の自動処理を先に済ませる
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
    lastSyncTime: null,
  });
  return { store, 雲, 知らせ };
}

const 名簿 = (store) => store.getState().members;
const 一人 = (store, id = 'mem-1') => 名簿(store).find((m) => m.id === id);

// ──────────────────────────────────────────────────────────────
test('追加：メンバーを足すとクラウドへ届く', async () => {
  const { store, 雲 } = await 用意();
  store.getState().addMember('新入部員', '女性', 1);
  await 待つ(50);

  const 手元 = 名簿(store);
  assert.equal(手元.length, 1);
  assert.equal(手元[0].name, '新入部員');
  assert.match(手元[0].personalId, /^\d{4}$/, '個人IDが4桁で振られる');
  assert.equal(雲.中身(名簿の道).length, 1, 'クラウドにも1件');
});

test('追加：団体ログインでなければ足せない', async () => {
  const { store, 知らせ, 雲 } = await 用意();
  store.setState({ activeRole: 'member' });
  store.getState().addMember('部員', '男性', 1);
  await 待つ(30);

  assert.equal(名簿(store).length, 0, '手元に増えていない');
  assert.equal(雲.中身(名簿の道).length, 0, 'クラウドにも増えていない');
  assert.ok(
    知らせ.some((x) => x.includes('団体ログイン')),
    '理由が案内される'
  );
});

test('追加：通信できなくても手元には残り、送り直しで届く', async () => {
  const { store, 雲 } = await 用意();
  雲.状態.オフライン = true;
  store.getState().addMember('圏外で追加', '男性', 2);
  await 待つ(50);

  assert.equal(名簿(store).length, 1, '手元には出る');
  assert.equal(一人(store, 名簿(store)[0].id).syncStatus, '未同期');

  雲.状態.オフライン = false;
  await store.getState().syncSessions();
  await 待つ(50);
  assert.equal(名簿(store)[0].syncStatus, '同期済み', '送り直しで届く');
});

// ──────────────────────────────────────────────────────────────
test('編集：名前を変えるとクラウドへ届く', async () => {
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  store.setState({ members: [部員()] });

  store.getState().updateMember('mem-1', { name: '改名後' });
  await 待つ(400); // 300ms の待ち合わせを通す

  assert.equal(一人(store).name, '改名後');
  assert.equal(雲.値(名簿の道, 'mem-1').name, '改名後');
});

test('編集：通信できないときは未同期のまま残り、送り直しで届く', async () => {
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  store.setState({ members: [部員()] });

  雲.状態.オフライン = true;
  store.getState().updateMember('mem-1', { name: '圏外で改名' });
  await 待つ(400);
  assert.equal(一人(store).name, '圏外で改名');
  assert.equal(一人(store).syncStatus, '未同期');

  雲.状態.オフライン = false;
  await store.getState().syncSessions();
  await 待つ(50);
  assert.equal(雲.値(名簿の道, 'mem-1').name, '圏外で改名', 'クラウドへ届く');
});

// ──────────────────────────────────────────────────────────────
test('削除：メンバーを消すとクラウドからも消える', async () => {
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  store.setState({ members: [部員()] });

  store.getState().deleteMember('mem-1');
  await 待つ(50);

  assert.equal(名簿(store).length, 0, '手元から消える');
  assert.equal(雲.値(名簿の道, 'mem-1'), undefined, 'クラウドからも消える');
});

test('削除：逆引き表からも消えて、その個人IDでは入れなくなる', async () => {
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  雲.置く(逆引きの道, '1011', { memberId: 'mem-1', updatedAt: 1 });
  store.setState({ members: [部員()] });

  store.getState().deleteMember('mem-1');
  await 待つ(80);

  assert.equal(雲.中身(逆引きの道).length, 0, '逆引き表からも消える');
});

test('削除：圏外で消しても、通信が戻れば削除が届く', async () => {
  // 圏外のときは Firestore が手元に貯めて後で送るので、これは通る
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  store.setState({ members: [部員()] });

  雲.状態.オフライン = true;
  store.getState().deleteMember('mem-1');
  await 待つ(50);
  assert.equal(名簿(store).length, 0, '手元からは消えている');

  雲.状態.オフライン = false;
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);
  assert.equal(名簿(store).length, 0, '戻ってこない');
});

test('削除：送信が失われても、次の受信で復活しない', async () => {
  // 送信が失われる場面（複数タブで貯め置きが効かない・タブを閉じた等）でも
  // 消したままにする。記録側の permanentlyDeleted と同じ考え方で、
  // 消したことを控えに残し、クラウドから消えるまで消し直す。
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  store.setState({ members: [部員()] });

  雲.状態.失敗させる = true; // 送信が届かないまま失われる
  store.getState().deleteMember('mem-1');
  await 待つ(50);
  assert.equal(名簿(store).length, 0, '手元からは消えている');
  assert.ok(雲.値(名簿の道, 'mem-1'), 'クラウドには残ったまま');
  assert.ok(store.getState().deletedMembers['mem-1'], '消したことを覚えている');

  雲.状態.失敗させる = false;
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(80);

  assert.equal(名簿(store).length, 0, '復活しない');
  assert.equal(雲.値(名簿の道, 'mem-1'), undefined, 'クラウドからも消し直される');
});

test('削除：クラウドから消えたら控えを手放す（際限なく増えない）', async () => {
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  store.setState({ members: [部員()] });

  store.getState().deleteMember('mem-1');
  await 待つ(50);
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(80);

  assert.deepEqual(store.getState().deletedMembers, {}, '控えが空になる');
});

test('削除：見張りが受け取っても、消したメンバーは戻さない', async () => {
  const { store, 雲 } = await 用意();
  雲.置く(名簿の道, 'mem-1', 部員());
  store.setState({ members: [部員()] });

  雲.状態.失敗させる = true;
  store.getState().deleteMember('mem-1');
  await 待つ(50);
  雲.状態.失敗させる = false;

  await store.getState().listenToMembers();
  await 待つ(80);

  assert.equal(名簿(store).length, 0, '見張り経由でも戻らない');
});

// ──────────────────────────────────────────────────────────────
test('弓具：消すとクラウドへ届く', async () => {
  const { store, 雲 } = await 用意();
  const 弓具 = [
    { id: 'eq-1', weight: 15, date: 1000 },
    { id: 'eq-2', weight: 17, date: 2000 },
  ];
  雲.置く(名簿の道, 'mem-1', 部員({ equipments: 弓具 }));
  store.setState({ members: [部員({ equipments: 弓具 })] });

  store.getState().deleteEquipment('mem-1', 'eq-1');
  await 待つ(80);

  assert.deepEqual(
    一人(store).equipments.map((e) => e.id),
    ['eq-2'],
    '手元から消える'
  );
  assert.deepEqual(
    雲.値(名簿の道, 'mem-1').equipments.map((e) => e.id),
    ['eq-2'],
    'クラウドからも消える'
  );
});

test('弓具：通信できないときは未同期のまま残り、送り直しで届く', async () => {
  const { store, 雲 } = await 用意();
  const 弓具 = [{ id: 'eq-1', weight: 15, date: 1000 }];
  雲.置く(名簿の道, 'mem-1', 部員({ equipments: 弓具 }));
  store.setState({ members: [部員({ equipments: 弓具 })] });

  雲.状態.オフライン = true;
  store.getState().deleteEquipment('mem-1', 'eq-1');
  await 待つ(80);
  assert.equal(一人(store).equipments.length, 0, '手元からは消える');
  assert.equal(一人(store).syncStatus, '未同期');

  雲.状態.オフライン = false;
  await store.getState().syncSessions();
  await 待つ(50);
  assert.equal(雲.値(名簿の道, 'mem-1').equipments.length, 0, 'クラウドへ届く');
});

// ──────────────────────────────────────────────────────────────
test('受信：クラウドで消えたメンバーは手元からも消える', async () => {
  const { store, 雲 } = await 用意();
  store.setState({ members: [部員()] });
  // クラウドには居ない状態で全件取得する
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);
  assert.equal(名簿(store).length, 0);
});

test('受信：送信前のメンバーは、クラウドに無くても消さない', async () => {
  const { store, 雲 } = await 用意();
  store.setState({ members: [部員({ id: 'mem-9', syncStatus: '未同期' })] });
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);
  assert.equal(名簿(store).length, 1, 'まだ送っていないので残る');
});
