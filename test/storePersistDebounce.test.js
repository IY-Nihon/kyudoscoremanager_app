/**
 * 端末への控えを、少しまとめてから書くことの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 * persist は状態が変わるたびに控え全体（大きい団体で 1.4MB）を JSON にして書く。
 * 古い端末では ○× 1 つで 60ms を超え、押した手応えが遅れた。少し待って
 * 1 回にまとめる作りにしたので、「続けて押すと 1 回にまとまる」「最後の状態が
 * 書かれる」「今すぐ書く と言えば待たない」ことを押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 店の場所 = path.join(__dirname, '..', 'src', 'useScoreStore.js');

test('続けて変えても、端末への書き込みは待ってから 1 回にまとまる', async () => {
  const { store, 保存領域 } = ストアを用意する();
  const { 控えの待ちを変える } = require(店の場所);
  控えの待ちを変える(40);
  let 書いた回数 = 0;
  const 元 = 保存領域.set.bind(保存領域);
  保存領域.set = (k, v) => {
    if (k === 'archery-score-storage') 書いた回数++;
    return 元(k, v);
  };
  store.setState({ isHydrated: true, shotsPerRound: 4 });
  store.setState({ shotsPerRound: 8 });
  store.setState({ shotsPerRound: 12 });
  await 待つ(5);
  assert.strictEqual(書いた回数, 0, '待たずに書いている');
  await 待つ(80);
  assert.strictEqual(書いた回数, 1, '3 回の変更が 1 回にまとまっていない');
  const 控え = JSON.parse(保存領域.get('archery-score-storage'));
  assert.strictEqual(控え.state.shotsPerRound, 12, '最後の状態が書かれていない');
});

test('今すぐ書く と言えば、待たずに最新の状態を書く', async () => {
  const { store, 保存領域 } = ストアを用意する();
  const { 控えの待ちを変える, 控えを今すぐ書く } = require(店の場所);
  控えの待ちを変える(10000);
  store.setState({ isHydrated: true, shotsPerRound: 16 });
  await 待つ(5);
  assert.ok(!保存領域.has('archery-score-storage'), '待つはずが書いている');
  await 控えを今すぐ書く();
  const 控え = JSON.parse(保存領域.get('archery-score-storage'));
  assert.strictEqual(控え.state.shotsPerRound, 16);
  // そのあと変えなければ、時間が来ても二度書かない
  let 書いた回数 = 0;
  const 元 = 保存領域.set.bind(保存領域);
  保存領域.set = (k, v) => {
    if (k === 'archery-score-storage') 書いた回数++;
    return 元(k, v);
  };
  await 控えを今すぐ書く();
  assert.strictEqual(書いた回数, 0, '書くものが無いのに書いている');
});

test('e2e の読み口：まだ書いていない写しが読め、書かせると端末に入る', async () => {
  const { store, 保存領域 } = ストアを用意する();
  const { 控えの待ちを変える } = require(店の場所);
  控えの待ちを変える(10000);
  assert.strictEqual(globalThis.__弓道の控え(), null, '書くものが無いのに写しがある');
  store.setState({ isHydrated: true, shotsPerRound: 20 });
  const 写し = JSON.parse(globalThis.__弓道の控え());
  assert.strictEqual(写し.state.shotsPerRound, 20, '写しが最新でない');
  assert.ok(!保存領域.has('archery-score-storage'), '待つはずが書いている');
  // auth.setup は storageState を取る前にこれを呼ぶ（本物の localStorage を写すため）
  await globalThis.__弓道の控えを書く();
  assert.strictEqual(JSON.parse(保存領域.get('archery-score-storage')).state.shotsPerRound, 20);
  assert.strictEqual(globalThis.__弓道の控え(), null, '書いたあとも写しが残っている');
});
