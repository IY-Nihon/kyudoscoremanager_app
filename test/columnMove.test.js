/**
 * 立ち順の並び替えの検査。
 *
 *   npm test
 *
 * 記録表は右から左へ並ぶ（row-reverse）。画面の「右」は並びの手前、
 * 「左」は並びの奥。取り違えるとボタンと逆に動くので、向きをここで押さえる。
 *
 * ○×・矢所・鍵は列そのものが持っている。列ごと入れ替えれば付いていくはずで、
 * ここではその「付いていくこと」も見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する } = require('./helpers/storeHarness');

function 端末() {
  const { store } = ストアを用意する();
  store.setState({
    activeGroupId: '100001',
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    members: [],
    alumni: [],
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    shotsPerRound: 4,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    historyStack: [],
    redoStack: [],
  });
  return store;
}

const 射手 = (id, 名, 印) => ({
  id,
  name: 名,
  marks: 印 || ['', '', '', ''],
  arrowLocations: [null, null, null, null],
  isSeparator: !1,
  isTotalCalculator: !1,
  lockedBlocks: {},
});

const 並びの名 = (store) => store.getState().archers.map((x) => x.name).join(',');

test('立ち順：画面の左へ動かすと、並びでは後ろへ行く', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を動かす('b', '左');
  assert.equal(並びの名(store), '大前,落,中');
});

test('立ち順：画面の右へ動かすと、並びでは手前へ戻る', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を動かす('c', '右');
  assert.equal(並びの名(store), '大前,落,中');
  store.getState().列を動かす('c', '左');
  assert.equal(並びの名(store), '大前,中,落', '戻せる');
});

test('立ち順：端では動かない', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '落')] });
  store.getState().列を動かす('a', '右'); // すでに右端
  assert.equal(並びの名(store), '大前,落');
  store.getState().列を動かす('b', '左'); // すでに左端
  assert.equal(並びの名(store), '大前,落');
});

test('立ち順：○×と矢所は列に付いていく', () => {
  const store = 端末();
  const 中 = 射手('b', '中', ['○', '×', '○', '']);
  中.arrowLocations = [{ x: 0.1, y: 0.2 }, null, null, null];
  store.setState({ archers: [射手('a', '大前'), 中, 射手('c', '落')] });
  store.getState().列を動かす('b', '左');
  const 動いた = store.getState().archers.find((x) => x.id === 'b');
  assert.deepEqual(動いた.marks, ['○', '×', '○', '']);
  assert.deepEqual(動いた.arrowLocations[0], { x: 0.1, y: 0.2 });
  assert.equal(store.getState().archers[2].id, 'b', '並びの後ろへ移っている');
});

test('立ち順：区切りや合計とも入れ替わる', () => {
  const store = 端末();
  const 区切り = Object.assign(射手('s', '---'), { isSeparator: !0 });
  store.setState({ archers: [射手('a', '大前'), 区切り, 射手('c', '落')] });
  store.getState().列を動かす('c', '右');
  assert.equal(並びの名(store), '大前,落,---', '区切りをまたいで入れ替わる');
});

test('立ち順：取り消しで元に戻せる', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を動かす('b', '左');
  assert.equal(並びの名(store), '大前,落,中');
  assert.equal(store.getState().historyStack.length, 1, '取り消しの控えが積まれる');
  store.getState().undo();
  assert.equal(並びの名(store), '大前,中,落');
});

test('立ち順：閲覧用では動かせない', () => {
  const store = 端末();
  store.setState({
    archers: [射手('a', '大前'), 射手('b', '落')],
    isLiveActive: !0,
    isHost: !1,
    ライブは見るだけ: !0,
  });
  store.getState().列を動かす('a', '左');
  assert.equal(並びの名(store), '大前,落', '閲覧用は書き換えない');
});
