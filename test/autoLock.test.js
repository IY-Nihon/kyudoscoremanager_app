/**
 * 誤タップ防止（自動ロック）のうち、ストアが受け持つ部分の検査。
 *
 *   npm test
 *
 * 画面側（薄い灰色にする・押しても変わらない・長押しで開く）は
 * e2e/lock.spec.mjs で実物を触って確かめている。
 * ここで見るのは「いつ数え直しになるか」だけ。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する } = require('./helpers/storeHarness');

const 団体 = '100001';

function 端末() {
  const { store } = ストアを用意する();
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
    archers: [{ id: 'a1', name: '山田', marks: ['', '', '', ''] }],
    shotsPerRound: 4,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    historyStack: [],
    redoStack: [],
    自動ロックする: true,
    自動ロックまでの秒: 3,
    入れた時刻: {},
  });
  return store;
}

test('○×を入れると、そのますの時刻が記録される', () => {
  const store = 端末();
  const 前 = Date.now();
  store.getState().toggleMark('a1', 2);
  const 時刻 = store.getState().入れた時刻['a1:2'];
  assert.ok(typeof 時刻 === 'number', '時刻が付いていない');
  assert.ok(時刻 >= 前, '時刻が過去になっている');
  assert.strictEqual(store.getState().archers[0].marks[2], '○');
});

test('入れ直すと時刻も更新され、数え直しになる', () => {
  const store = 端末();
  store.setState({ 入れた時刻: { 'a1:0': 1 } });
  store.getState().toggleMark('a1', 0);
  assert.ok(store.getState().入れた時刻['a1:0'] > 1, '古い時刻のままになっている');
});

test('触っていないますには時刻が付かない', () => {
  const store = 端末();
  store.getState().toggleMark('a1', 1);
  assert.strictEqual(store.getState().入れた時刻['a1:0'], undefined);
  assert.strictEqual(store.getState().入れた時刻['a1:3'], undefined);
});

test('長押しで開けると、時刻が今になる（開けたあと、また少し経てば閉じる）', () => {
  const store = 端末();
  store.setState({ 入れた時刻: { 'a1:0': Date.now() - 60000 } });
  const 前 = Date.now();
  store.getState().ますを開ける('a1', 0);
  assert.ok(store.getState().入れた時刻['a1:0'] >= 前, '時刻が入れ直されていない');
});

test('長押しで開けても、ほかのますは閉じたまま', () => {
  const store = 端末();
  const 古い = Date.now() - 60000;
  store.setState({ 入れた時刻: { 'a1:0': 古い, 'a1:1': 古い } });
  store.getState().ますを開ける('a1', 0);
  assert.strictEqual(store.getState().入れた時刻['a1:1'], 古い, '隣まで開いてしまった');
});

test('鍵の切り替えで、たまった時刻は捨てる', () => {
  const store = 端末();
  store.setState({ 入れた時刻: { 'a1:0': Date.now() } });
  store.getState().set自動ロックする(false);
  assert.strictEqual(store.getState().自動ロックする, false);
  assert.deepStrictEqual(store.getState().入れた時刻, {}, '古い時刻が残っている');
  store.getState().set自動ロックする(true);
  assert.deepStrictEqual(store.getState().入れた時刻, {});
});

test('時刻は保存の対象に入れない（端末をまたいで持ち回らない）', () => {
  const 中身 = require('fs').readFileSync(
    require('path').resolve(__dirname, '../src/JP_useScoreStore_174.js'),
    'utf8'
  );
  const 保存部 = 中身.slice(中身.indexOf('partialize:'), 中身.indexOf('onRehydrateStorage'));
  assert.ok(保存部.includes('自動ロックする'), '入り切りの設定は残したい');
  assert.ok(!保存部.includes('入れた時刻'), '時刻まで保存してしまっている');
});

test('画像から反映した○×は、初めから閉じていない', () => {
  // 画像読み取りは toggleMark を通らない。印が付かないと
  // 「読み込み直したもの」と見なされ、直すのが全部長押しになる
  const store = 端末();
  const 反映 = [
    { id: 'a1', name: '山田', marks: ['○', '', '×', ''] },
    { id: 'a2', name: '鈴木', marks: ['', '', '', ''] },
  ];
  const 前 = Date.now();
  store.setState({ archers: 反映 });
  store.getState().入れた印をまとめて付ける(反映);

  const 印 = store.getState().入れた時刻;
  assert.ok(印['a1:0'] >= 前, '○に印が付いていない');
  assert.ok(印['a1:2'] >= 前, '×に印が付いていない');
  assert.strictEqual(印['a1:1'], undefined, '空のますにまで印が付いている');
  assert.strictEqual(印['a2:0'], undefined, '空の射手にまで印が付いている');
});

// 保存時の出欠確認は、設定で切れる
test('設定：保存時の出欠確認は既定で出し、切ると保存される値も残る', () => {
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true });

  assert.equal(store.getState().保存時に出欠を確認する, true, '既定は「確認する」');

  store.getState().set保存時に出欠を確認する(false);
  assert.equal(store.getState().保存時に出欠を確認する, false, '切り替わらない');

  store.getState().set保存時に出欠を確認する(true);
  assert.equal(store.getState().保存時に出欠を確認する, true, '戻せない');
});

test('設定：出欠を空のまま保存しても、記録は残る', async () => {
  // 出欠確認を切ったときは attendance を渡さずに保存する。
  // 出欠画面は「記録に出ている人は出席」と数えるので、空でも困らない
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    isNetworkOnline: true,
    activeGroupId: '100001',
    activeRole: 'group',
    archers: [
      {
        id: 'a1',
        name: '山田',
        memberId: 'm1',
        marks: ['○', '×', '', ''],
        lockedBlocks: {},
        arrowLocations: [null, null, null, null],
        lastModified: 1,
      },
    ],
    sessions: [],
  });

  await store.getState().saveSession('朝練', '', true, [], null);
  const 記録 = store.getState().sessions[0];
  assert.ok(記録, '記録が保存されていない');
  assert.equal(記録.title, '朝練');
  assert.equal(記録.attendance, null, '出欠は空のまま');
  assert.equal(記録.archers.length, 1, '射手が残っていない');
});

test('長押しで開けると、知らせの合図が立つ', () => {
  // 灰色が戻るだけでは押さえが届いたか分かりにくいので、画面に短く知らせる。
  // 記録画面はこの時刻を見て出すので、押すたびに新しくなる必要がある
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true, 鍵を開けた時刻: 0 });

  store.getState().ますを開ける('a1', 0);
  const 一回目 = store.getState().鍵を開けた時刻;
  assert.ok(一回目 > 0, '合図が立たない');

  store.getState().ますを開ける('a1', 1);
  assert.ok(store.getState().鍵を開けた時刻 >= 一回目, '二度目の合図が立たない');
});
