'use strict';
/**
 * 記録・名簿が消える・戻る・混ざる不具合の直し（2026-11-04。A2〜A6）。
 */
const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;
const ゴミ箱の道 = `groups/${団体}/trash`;
const 名簿の道 = `groups/${団体}/members`;

function 用意(役 = 'group') {
  const { store, 雲 } = ストアを用意する();
  store.setState({
    activeGroupId: 団体,
    activeRole: 役,
    isHydrated: true,
    isNetworkOnline: true,
    sessions: [],
    members: [],
    alumni: [],
    trash: [],
    permanentlyDeleted: {},
    deletedMembers: {},
    lastSyncTime: null,
  });
  return { store, 雲 };
}

const 記録 = (id, o = {}) =>
  Object.assign(
    { id, title: '練習', date: Date.now() - 86400000, lastModified: Date.now() - 86400000, archers: [] },
    o
  );

test('A2 部員の端末の送り直しの一括に、ゴミ箱の削除（団体しか書けない）を入れない', async () => {
  const { store, 雲 } = 用意('member');
  store.setState({ sessions: [記録('s1', { syncStatus: '未同期', lastModified: Date.now() })] });
  await store.getState().syncSessions();
  await 待つ(50);
  const 一括 = 雲.記録.filter((x) => x.種別 === 'batch');
  assert.ok(一括.length >= 1, '送り直していない');
  for (const x of 一括)
    assert.ok(!x.操作.some((o) => o.道 === ゴミ箱の道), '部員の一括にゴミ箱の削除が入っている（決まりに一括ごと断られる）');
  assert.ok(雲.値(記録の道, 's1'), '記録が届いていない');
});

test('A2 団体の端末の送り直しは、今までどおりゴミ箱からも取り下げる（戻した記録）', async () => {
  const { store, 雲 } = 用意('group');
  store.setState({ sessions: [記録('s1', { syncStatus: '未同期', lastModified: Date.now() })] });
  await store.getState().syncSessions();
  await 待つ(50);
  assert.ok(
    雲.記録.some((x) => x.種別 === 'batch' && x.操作.some((o) => o.種類 === 'delete' && o.道 === ゴミ箱の道)),
    '団体の端末でゴミ箱から取り下げていない'
  );
});

test('A3 ゴミ箱へ移した時刻を手元にも置く。雲に届かないまま同期が走っても、履歴に戻らない', async () => {
  const { store, 雲 } = 用意('group');
  const 元 = 記録('s1', { syncStatus: '同期済み' });
  雲.置く(記録の道, 's1', Object.assign({}, 元, { lastModified: Date.now() - 5000 }));
  store.setState({ sessions: [Object.assign({}, 元)] });
  雲.状態.オフライン = true;
  store.getState().deleteSession('s1');
  await 待つ(20);
  const 捨てた = store.getState().trash.find((x) => x.id === 's1');
  assert.ok(捨てた && typeof 捨てた.deletedAt === 'number', '手元のゴミ箱に捨てた時刻が無い');
  // 送信が失われた：雲には記録がまだ（サーバーの時刻で少し新しく）残っている
  雲.状態.オフライン = false;
  雲.消す(ゴミ箱の道, 's1');
  雲.置く(記録の道, 's1', Object.assign({}, 元, { lastModified: Date.now() - 1000 }));
  await store.getState().syncSessions();
  await 待つ(50);
  assert.ok(!store.getState().sessions.some((x) => x.id === 's1'), '捨てた記録が履歴に戻った');
  assert.ok(store.getState().trash.some((x) => x.id === 's1'), 'ゴミ箱から消えた');
});

test('A4 差分の同期でも、消したのにまだ雲へ届いていないメンバーは名簿に戻さない', async () => {
  const { store, 雲 } = 用意('group');
  雲.置く(名簿の道, 'm1', { id: 'm1', name: '消した人', lastModified: Date.now() });
  雲.置く(名簿の道, 'm2', { id: 'm2', name: 'いる人', lastModified: Date.now() });
  store.setState({
    members: [{ id: 'm2', name: 'いる人', lastModified: Date.now(), syncStatus: '同期済み' }],
    deletedMembers: { m1: Date.now() },
    lastSyncTime: Date.now() - 60000,
    全部そろえた時刻: Date.now() - 60000,
    雲の境目: { 団体, 記録: 1, 部員: 1, ごみ箱: 1, 卒業生: 1 },
  });
  await store.getState().syncSessions();
  await 待つ(50);
  assert.deepStrictEqual(
    store.getState().members.map((m) => m.id),
    ['m2'],
    '消したメンバーが名簿に戻った'
  );
});

test('A5 名前を直したときに書き直す記録は、同期済みの形で送る（端末の中だけの印を持ち込まない）', async () => {
  const { store, 雲 } = 用意('group');
  const 人 = { id: 'm1', name: '旧姓 太郎', lastModified: 1, syncStatus: '同期済み' };
  雲.置く(名簿の道, 'm1', Object.assign({}, 人));
  store.setState({
    members: [Object.assign({}, 人)],
    sessions: [記録('s1', { syncStatus: '未同期', archers: [{ id: 'x', memberId: 'm1', name: '旧姓 太郎', marks: [] }] })],
    trash: [
      記録('t1', {
        syncStatus: '未同期',
        pendingDelete: true,
        archers: [{ id: 'y', memberId: 'm1', name: '旧姓 太郎', marks: [] }],
      }),
    ],
  });
  store.getState().updateMember('m1', { name: '新姓 太郎' });
  await 待つ(400);
  const 記録の送り = 雲.値(記録の道, 's1');
  const ゴミ箱の送り = 雲.値(ゴミ箱の道, 't1');
  assert.ok(記録の送り && ゴミ箱の送り, '書き直した記録が届いていない');
  assert.strictEqual(記録の送り.syncStatus, '同期済み', '雲の記録に「未同期」を書いた');
  assert.strictEqual(ゴミ箱の送り.syncStatus, 'trashed');
  assert.ok(!('pendingDelete' in ゴミ箱の送り), '雲のゴミ箱に「消して送る途中」を書いた');
});

test('名簿を雲へ書くときは個人ID を持ち込まない（手元の古い写しに残っていても）', async () => {
  const { store, 雲 } = 用意('group');
  const 人 = { id: 'm1', name: '部員', personalId: '1234', lastModified: 1, syncStatus: '同期済み' };
  雲.置く(名簿の道, 'm1', { id: 'm1', name: '部員', lastModified: 1 });
  store.setState({ members: [Object.assign({}, 人)] });
  store.getState().updateMember('m1', { grade: 2 });
  await 待つ(400);
  assert.ok(!('personalId' in 雲.値(名簿の道, 'm1')), '名簿の文書に個人ID を書いた（決まりに断られる）');
});

test('A6 同期の途中で別の団体へ入り直したら、その同期は捨てる（前の団体の記録を混ぜない・書かない）', async () => {
  const { store, 雲 } = 用意('group');
  store.setState({ sessions: [記録('s1', { syncStatus: '未同期', lastModified: Date.now() })] });
  const 元 = 雲.api.getDocs;
  雲.api.getDocs = async (集まり) => {
    const 返り = await 元(集まり);
    // 読んでいるあいだに別の団体へ移った
    store.setState({ activeGroupId: '200002', sessions: [] });
    return 返り;
  };
  await store.getState().syncSessions();
  await 待つ(50);
  雲.api.getDocs = 元;
  assert.deepStrictEqual(store.getState().sessions, [], '前の団体の記録が新しい団体の履歴に混ざった');
  assert.ok(!雲.値(`groups/200002/sessions`, 's1'), '前の団体の記録を新しい団体の置き場へ書いた');
});
