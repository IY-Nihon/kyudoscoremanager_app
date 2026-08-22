/**
 * チャットボットの質問例の検査。
 *
 *   npm test
 *
 * 例に出したことは、道具で答えられなければならない。答えられない例を
 * 出すと、一度外れただけで使われなくなる。ここでは「その団体の中身に
 * 合った例だけを出すこと」を押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 質問例, 打ちかけの候補, 分類ごと } = require('../src/chatSuggestions');

const 記録 = (o) => Object.assign({ date: Date.now(), archers: [] }, o);
const 文たち = (例) => 例.map((x) => x.文);

test('記録がまだ無い団体には、成績の例を出さない', () => {
  // 出しても必ず空振りする。使い方の案内に寄せる
  const 例 = 質問例({ 人たち: [{ name: '山田' }], 記録たち: [] });
  assert.ok(!文たち(例).some((x) => x.includes('的中率')), '記録が無いのに的中率を勧めている');
  assert.ok(文たち(例).some((x) => x.includes('記録の付け方')), '使い方の案内が無い');
});

test('出欠を付けた記録が無ければ、出欠の例を出さない', () => {
  const 例 = 質問例({ 人たち: [{ name: '山田' }], 記録たち: [記録({ archers: [{ name: '山田', marks: ['○'] }] })] });
  assert.ok(!文たち(例).some((x) => x.includes('練習に来ている')), '出欠が無いのに勧めている');
});

test('出欠を付けた記録があれば、出欠の例を出す', () => {
  const 例 = 質問例({
    人たち: [{ name: '山田' }],
    記録たち: [記録({ archers: [{ name: '山田', marks: ['○'] }], attendance: { m1: 'present' } })],
  });
  assert.ok(文たち(例).some((x) => x.includes('練習に来ている')));
});

test('名前の例は、いちばん新しい記録に出ている人から採る', () => {
  // 部員一覧の先頭だと、辞めた人や名簿の並び順が出てしまう
  const 例 = 質問例({
    人たち: [{ name: '名簿の先頭' }],
    記録たち: [
      記録({ date: 1000, archers: [{ name: '古い人', marks: ['○'] }] }),
      記録({ date: 9000, archers: [{ name: '最近の人', marks: ['○'] }] }),
    ],
  });
  assert.ok(文たち(例).some((x) => x.includes('最近の人')), '最近の人が使われていない');
  assert.ok(!文たち(例).some((x) => x.includes('名簿の先頭')), '名簿の先頭が出ている');
});

test('区切りや合計の列は、名前の例に使わない', () => {
  const 例 = 質問例({
    人たち: [],
    記録たち: [記録({ archers: [{ isSeparator: true, name: '区切り' }, { name: '本物', marks: ['○'] }] })],
  });
  assert.ok(!文たち(例).some((x) => x.includes('区切り')));
  assert.ok(文たち(例).some((x) => x.includes('本物')));
});

test('今月の表記は、渡した日付に従う', () => {
  const 例 = 質問例({
    人たち: [{ name: '山田' }],
    記録たち: [記録({ archers: [{ name: '山田', marks: ['○'] }] })],
    いま: new Date('2026-05-15'),
  });
  assert.ok(文たち(例).some((x) => x.includes('2026年5月')), '今月が反映されていない');
});

test('人も記録も無くても落ちない', () => {
  const 例 = 質問例({});
  assert.ok(例.length > 0, '何も出せないと入口が空になる');
});

test('打ちかけの言葉で候補を絞る', () => {
  const 例 = [
    { 分類: '成績', 文: '大前に向いているのは誰？' },
    { 分類: '出欠', 文: '欠席が多いのは誰？' },
    { 分類: '成績', 文: '団体全体の的中率は？' },
  ];
  const r = 打ちかけの候補('大前', 例);
  assert.equal(r.length, 1);
  assert.equal(r[0].文, '大前に向いているのは誰？');
});

test('打ちかけ：前の方で当たるものを先に出す', () => {
  const 例 = [
    { 分類: 'a', 文: '今月の誰かの話' },
    { 分類: 'b', 文: '誰かの話' },
  ];
  const r = 打ちかけの候補('誰', 例);
  assert.equal(r[0].文, '誰かの話', '前から当たる方が先');
});

test('打ちかけ：空のときは頭から出す。上限も効く', () => {
  const 例 = [1, 2, 3, 4, 5, 6].map((n) => ({ 分類: 'x', 文: '例' + n }));
  assert.equal(打ちかけの候補('', 例).length, 4, '既定は4件');
  assert.equal(打ちかけの候補('', 例, 2).length, 2);
});

test('打ちかけ：空白の有無は無視する', () => {
  const 例 = [{ 分類: 'a', 文: '大前 に 向いて いる のは 誰？' }];
  assert.equal(打ちかけの候補('大前に向いて', 例).length, 1);
});

test('分類ごとにまとめられる', () => {
  const r = 分類ごと([
    { 分類: '成績', 文: 'A' },
    { 分類: '出欠', 文: 'B' },
    { 分類: '成績', 文: 'C' },
  ]);
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], { 分類: '成績', 文たち: ['A', 'C'] });
});
