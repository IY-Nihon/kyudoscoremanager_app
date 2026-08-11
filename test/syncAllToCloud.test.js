/**
 * 「手元の全部をクラウドへ送り直す」道具の検査。
 *
 *   npm test
 *
 * 取りこぼした記録を手で押し込むための道具なので、押し込めること自体と、
 * 押し込んでいる最中の編集を取りこぼさないことの両方を見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;
const 名簿の道 = `groups/${団体}/members`;
const ゴミ箱の道 = `groups/${団体}/trash`;
const 設定の道 = `groups/${団体}/config`;

const 記録 = (o) =>
  Object.assign({ id: 'ses-1', title: '練習', date: 1000, archers: [], lastModified: 1000 }, o);

async function 用意() {
  const { store, 雲 } = ストアを用意する();
  await 待つ(30);
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
    currentFreshmanTerm: 53,
    tagTemplates: ['立'],
  });
  return { store, 雲 };
}

const 記録を見る = (store, id = 'ses-1') => store.getState().sessions.find((s) => s.id === id);

// ──────────────────────────────────────────────────────────────
test('送り直し：手元の記録・名簿・ゴミ箱・設定をまとめて押し込む', async () => {
  const { store, 雲 } = await 用意();
  store.setState({
    sessions: [記録({ syncStatus: '未同期' })],
    members: [{ id: 'mem-1', name: '部員1', lastModified: 1000 }],
    alumni: [{ id: 'alu-1', name: '卒業生1', lastModified: 1000 }],
    trash: [記録({ id: 'tr-1', deletedAt: 500 })],
  });

  await store.getState().syncAllToCloud();
  await 待つ(50);

  assert.ok(雲.値(記録の道, 'ses-1'), '記録が届く');
  assert.ok(雲.値(名簿の道, 'mem-1'), '名簿が届く');
  assert.ok(雲.値(`groups/${団体}/alumni`, 'alu-1'), '卒業生が届く');
  assert.ok(雲.値(ゴミ箱の道, 'tr-1'), 'ゴミ箱が届く');
  assert.ok(雲.値(設定の道, 'app_settings'), '設定が届く');
});

test('送り直し：送ったものに「同期済み」の印が付く', async () => {
  const { store } = await 用意();
  store.setState({
    sessions: [記録({ syncStatus: '未同期' })],
    members: [{ id: 'mem-1', name: '部員1', syncStatus: '未同期', lastModified: 1000 }],
  });

  await store.getState().syncAllToCloud();
  await 待つ(50);

  assert.equal(記録を見る(store).syncStatus, '同期済み');
  assert.equal(store.getState().members[0].syncStatus, '同期済み');
  assert.equal(store.getState().syncStatus, '同期済み');
});

test('送り直し：部員は実行できない', async () => {
  const { store, 雲 } = await 用意();
  store.setState({ activeRole: 'member', sessions: [記録({ syncStatus: '未同期' })] });

  await store.getState().syncAllToCloud();
  await 待つ(50);

  assert.equal(雲.値(記録の道, 'ses-1'), undefined, 'クラウドへ送っていない');
  assert.equal(記録を見る(store).syncStatus, '未同期', '印も変えていない');
});

test('送り直し：通信できないときは動かない', async () => {
  const { store, 雲 } = await 用意();
  store.setState({ isNetworkOnline: false, sessions: [記録({ syncStatus: '未同期' })] });

  await store.getState().syncAllToCloud();
  await 待つ(50);

  assert.equal(雲.値(記録の道, 'ses-1'), undefined);
  assert.equal(記録を見る(store).syncStatus, '未同期');
});

test('送り直し：失敗したら「同期エラー」になる', async () => {
  const { store, 雲 } = await 用意();
  store.setState({ sessions: [記録({ syncStatus: '未同期' })] });
  雲.状態.失敗させる = true;

  await store.getState().syncAllToCloud();
  await 待つ(50);

  assert.equal(store.getState().syncStatus, '同期エラー');
  assert.equal(記録を見る(store).syncStatus, '未同期', '印は変わらない');
});

// ──────────────────────────────────────────────────────────────
test('送り直し：送っている最中の編集には「同期済み」を付けない', async () => {
  // 送信後に「そのときの手元」をそのまま印付けすると、送信中に編集した
  // 新しい内容まで送信済み扱いになり、送り直しの対象から外れて
  // クラウドへ届かないままになる。送った版だけに印を付ける。
  const { store, 雲 } = await 用意();
  store.setState({ sessions: [記録({ syncStatus: '未同期' })] });
  雲.状態.遅延 = 60; // 送信に時間がかかる状態

  const 送信 = store.getState().syncAllToCloud();
  await 待つ(20);
  store.getState().updateSession('ses-1', { title: '送信中に直した' }); // 送っている最中の編集
  await 送信;
  await 待つ(30);
  雲.状態.遅延 = 0;

  assert.equal(記録を見る(store).title, '送信中に直した', '手元は直っている');
  assert.equal(記録を見る(store).syncStatus, '未同期', '送信済みにしない');
});

test('送り直し：送っている最中に触っていないものには印が付く', async () => {
  const { store, 雲 } = await 用意();
  store.setState({
    sessions: [記録({ syncStatus: '未同期' }), 記録({ id: 'ses-2', syncStatus: '未同期' })],
  });
  雲.状態.遅延 = 60;

  const 送信 = store.getState().syncAllToCloud();
  await 待つ(20);
  store.getState().updateSession('ses-1', { title: '送信中に直した' });
  await 送信;
  await 待つ(30);
  雲.状態.遅延 = 0;

  assert.equal(記録を見る(store, 'ses-1').syncStatus, '未同期', '触ったほうは残る');
  assert.equal(記録を見る(store, 'ses-2').syncStatus, '同期済み', '触っていないほうは済む');
});

test('送り直し：ゴミ箱の内部用の印をクラウドへ持ち出さない', async () => {
  // pendingDelete は「消す指示がまだ届いていない」ことを表す手元だけの印。
  // クラウドへ書くと、他の端末のゴミ箱の見え方が狂う。
  const { store, 雲 } = await 用意();
  store.setState({ trash: [記録({ id: 'tr-1', deletedAt: 500, pendingDelete: true, syncStatus: '未同期' })] });

  await store.getState().syncAllToCloud();
  await 待つ(50);

  const 雲の中身 = 雲.値(ゴミ箱の道, 'tr-1');
  assert.ok(雲の中身, '前提：ゴミ箱が届いている');
  assert.equal(雲の中身.pendingDelete, undefined, '内部用の印は持ち出さない');
});
