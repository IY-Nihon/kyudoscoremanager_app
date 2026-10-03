'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { 失われるもの, 確認の文 } = require('../src/resetWarning');

test('未送信の記録とごみ箱の未送信を数える。送信済みは数えない', () => {
  const 失う = 失われるもの({
    sessions: [{ syncStatus: '未同期' }, { syncStatus: '同期済み' }, { syncStatus: '未同期' }],
    trash: [{ syncStatus: '未同期' }, null],
  });
  assert.strictEqual(失う.未送信の記録, 3);
  assert.strictEqual(失う.記録中の盤面, false);
});

test('記録中の盤面は、区切りと計の列を除いた射手が居るときだけ', () => {
  assert.strictEqual(失われるもの({ archers: [{ isSeparator: true }, { isTotalCalculator: true }] }).記録中の盤面, false);
  assert.strictEqual(失われるもの({ archers: [{ name: 'a' }] }).記録中の盤面, true);
});

test('状態が空・壊れていても落ちない', () => {
  assert.deepStrictEqual(失われるもの(undefined), { 未送信の記録: 0, 記録中の盤面: false });
  assert.deepStrictEqual(失われるもの({ sessions: 'x', archers: null }), { 未送信の記録: 0, 記録中の盤面: false });
});

test('確認の文：失うものがあれば件数と「読み込み直す」を促し、無ければ軽い文', () => {
  const 重い = 確認の文({ 未送信の記録: 2, 記録中の盤面: true });
  assert.ok(重い.includes('2 件') && 重い.includes('保存前') && 重い.includes('読み込み直す'));
  const 軽い = 確認の文({ 未送信の記録: 0, 記録中の盤面: false });
  assert.ok(!軽い.includes('読み込み直す') && 軽い.includes('取り直します'));
});
