/**
 * いつも付けるタグ（2026-11-13 本人：基本は付けるタグを固定したい。保存のとき最初から入っていて、外せる。端末ごと）。
 *
 *   npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する } = require('./helpers/storeHarness');

test('いつも付けるタグ：保存の窓を開くと 1 度だけ入り、外したら入れ直さない。片付けると次の記録でまた入る', () => {
  const { store } = ストアを用意する();
  const 状 = () => store.getState();
  状().いつも付けるタグを入れ替える('正規練習');
  assert.deepStrictEqual(状().いつも付けるタグ, ['#正規練習']);
  // 先に自分で付けたタグは残り、いつものタグは頭に入る
  状().setCurrentSessionTags(['雨天']);
  状().いつものタグを入れる();
  assert.deepStrictEqual(状().currentSessionTags, ['#正規練習', '#雨天']);
  // 外して、もう一度窓を開いても戻らない
  状().toggleCurrentSessionTag('正規練習');
  状().いつものタグを入れる();
  assert.deepStrictEqual(状().currentSessionTags, ['#雨天']);
  // 盤面を片付けたら、次の記録ではまた入る
  状().resetCurrentSession(false);
  assert.deepStrictEqual(状().currentSessionTags, []);
  状().いつものタグを入れる();
  assert.deepStrictEqual(状().currentSessionTags, ['#正規練習']);
  // もう一度押すと外れる。何も選んでいなければ、窓を開いても何も入らない
  状().いつも付けるタグを入れ替える('正規練習');
  assert.deepStrictEqual(状().いつも付けるタグ, []);
  状().resetCurrentSession(false);
  状().いつものタグを入れる();
  assert.deepStrictEqual(状().currentSessionTags, []);
});

test('いつも付けるタグ：定型から消したタグは、いつも付けるタグからも外れる', async () => {
  const { store } = ストアを用意する();
  await store.getState().addTagTemplate('合宿');
  store.getState().いつも付けるタグを入れ替える('合宿');
  await store.getState().removeTagTemplate('#合宿');
  assert.deepStrictEqual(store.getState().いつも付けるタグ, []);
});
