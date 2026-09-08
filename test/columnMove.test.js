/**
 * 立ち順の並び替えの検査。
 *
 *   npm test
 *
 * store が受け取るのは「並びの向き」（前＝大前寄り／後＝落寄り）で、
 * 画面の言葉（左・右・上・下）ではない。縦の表は右から左へ並び、横の表は
 * 上から下へ積むので、同じ「後ろへ」が縦では左、横では下になる。
 * 画面の言葉で受け取ると、並べ方を変えたとたんに字と動く向きが食い違う。
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

test('立ち順：後ろへ動かすと、並びで1つ落寄りへ行く', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を動かす('b', '後');
  assert.equal(並びの名(store), '大前,落,中');
});

test('立ち順：前へ動かすと、並びで1つ大前寄りへ戻る', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を動かす('c', '前');
  assert.equal(並びの名(store), '大前,落,中');
  store.getState().列を動かす('c', '後');
  assert.equal(並びの名(store), '大前,中,落', '戻せる');
});

test('立ち順：端では動かない', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '落')] });
  store.getState().列を動かす('a', '前'); // すでに先頭
  assert.equal(並びの名(store), '大前,落');
  store.getState().列を動かす('b', '後'); // すでに末尾
  assert.equal(並びの名(store), '大前,落');
});

test('立ち順：○×と矢所は列に付いていく', () => {
  const store = 端末();
  const 中 = 射手('b', '中', ['○', '×', '○', '']);
  中.arrowLocations = [{ x: 0.1, y: 0.2 }, null, null, null];
  store.setState({ archers: [射手('a', '大前'), 中, 射手('c', '落')] });
  store.getState().列を動かす('b', '後');
  const 動いた = store.getState().archers.find((x) => x.id === 'b');
  assert.deepEqual(動いた.marks, ['○', '×', '○', '']);
  assert.deepEqual(動いた.arrowLocations[0], { x: 0.1, y: 0.2 });
  assert.equal(store.getState().archers[2].id, 'b', '並びの後ろへ移っている');
});

test('立ち順：区切りや合計とも入れ替わる', () => {
  const store = 端末();
  const 区切り = Object.assign(射手('s', '---'), { isSeparator: !0 });
  store.setState({ archers: [射手('a', '大前'), 区切り, 射手('c', '落')] });
  store.getState().列を動かす('c', '前');
  assert.equal(並びの名(store), '大前,落,---', '区切りをまたいで入れ替わる');
});

test('立ち順：取り消しで元に戻せる', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を動かす('b', '後');
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
  store.getState().列を動かす('a', '後');
  assert.equal(並びの名(store), '大前,落', '閲覧用は書き換えない');
});

// ── 指で滑らせて動かす（ドラッグ）ぶん ──────────────
test('並べ替え：離した先に居た列の場所へ入る（右端の列を左端へ）', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を並べ替える('a', 2);
  assert.equal(並びの名(store), '中,落,大前');
});

test('並べ替え：左端の列を右端へ', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を並べ替える('c', 0);
  assert.equal(並びの名(store), '落,大前,中');
});

test('並べ替え：1回のドラッグは、取り消し1回で戻る', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を並べ替える('a', 2);
  assert.equal(store.getState().historyStack.length, 1, '控えは1つだけ積む');
  store.getState().undo();
  assert.equal(並びの名(store), '大前,中,落');
});

test('並べ替え：同じ場所・並びの外・おかしな値では何もしない', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中')] });
  store.getState().列を並べ替える('a', 0);
  store.getState().列を並べ替える('a', NaN);
  store.getState().列を並べ替える('無い列', 1);
  assert.equal(並びの名(store), '大前,中');
  assert.equal(store.getState().historyStack.length, 0, '何もしないときは控えも積まない');
});

test('並べ替え：並びの外を指しても、端に収まる', () => {
  const store = 端末();
  store.setState({ archers: [射手('a', '大前'), 射手('b', '中'), 射手('c', '落')] });
  store.getState().列を並べ替える('a', 99);
  assert.equal(並びの名(store), '中,落,大前');
});

test('並べ替え：閲覧用では動かせない', () => {
  const store = 端末();
  store.setState({
    archers: [射手('a', '大前'), 射手('b', '落')],
    isLiveActive: !0,
    ライブは見るだけ: !0,
  });
  store.getState().列を並べ替える('a', 1);
  assert.equal(並びの名(store), '大前,落');
});
