'use strict';
// タグの札の並べ方（履歴・分析・書き出しで同じ。src/tagNarabi.js・2026-11-28）
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { 範囲のタグを集める, タグを並べる, 無いタグの見た目 } = require('../src/tagNarabi');

test('範囲のタグ：記録たちに付いたタグを集める（空・タグの無い記録も転ばない）', () => {
  const 集めた = 範囲のタグを集める([{ tags: ['#a', '#b'] }, { tags: ['#b'] }, {}, null]);
  assert.deepStrictEqual([...集めた].sort(), ['#a', '#b']);
  assert.strictEqual(範囲のタグを集める(undefined).size, 0);
});

test('並べ方：選んだ → 範囲に有る → 無い、同じ組の中は名前順', () => {
  const 一覧 = ['#ん', '#い', '#あ', '#う', '#え'];
  const 範囲 = new Set(['#い', '#う']);
  assert.deepStrictEqual(タグを並べる(一覧, ['#え'], 範囲), ['#え', '#い', '#う', '#あ', '#ん']);
  // 選んだタグが範囲に無くても先頭（範囲を変えても外さない）
  assert.deepStrictEqual(タグを並べる(一覧, ['#ん'], 範囲)[0], '#ん');
  // 元の一覧は並べ替えない
  assert.deepStrictEqual(一覧, ['#ん', '#い', '#あ', '#う', '#え']);
});

test('見た目：無いタグは灰色の点線、選んでいて無いタグは薄く、有るタグは足さない', () => {
  const 色 = { 灰: '#8E8E93', 灰_明るい: '#D1D1D6' };
  assert.deepStrictEqual(無いタグの見た目(false, false, 色), { 箱: null, 字: null });
  assert.deepStrictEqual(無いタグの見た目(true, true, 色), { 箱: { opacity: 0.6 }, 字: null });
  const 無い = 無いタグの見た目(true, false, 色);
  assert.strictEqual(無い.箱.borderStyle, 'dashed');
  assert.strictEqual(無い.字.color, '#8E8E93');
});

test('履歴・分析・書き出しの 3 つが同じ並べ方を使う', () => {
  for (const 名 of ['HistoryScreen.js', 'AnalysisScreen.js', 'SettingsExport.js']) {
    const 本体 = fs.readFileSync(path.join(__dirname, '..', 'src', 名), 'utf8');
    assert.ok(本体.includes("require('./tagNarabi')"), 名 + ' が tagNarabi を使っていない');
    assert.ok(本体.includes('タグの並べ方.タグを並べる('), 名 + ' が並べていない');
    assert.ok(本体.includes('タグの並べ方.無いタグの見た目('), 名 + ' が無いタグを灰色にしていない');
  }
});
