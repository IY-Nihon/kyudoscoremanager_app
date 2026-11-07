'use strict';
/**
 * AI の道具の数え方を分析画面にそろえる（2026-11-04。A10）。
 */
const test = require('node:test');
const assert = require('node:assert');
const 統 = require('../src/chatStats');
const { 集計する, 名簿を数える } = require('../src/chatAggregate');
const { 組を作る } = require('../src/chatTeams');
const { その年度に現役だったか } = require('../src/attendanceRules');

const 今 = new Date(2026, 9, 15).getTime();
const 射手 = (id, marks) => ({ id: 'a' + id, memberId: id, name: id, marks });
const 記録 = (日, 射手たち) => ({
  id: 's' + 日,
  date: new Date(2026, 9, 日, 10).getTime(),
  archers: 射手たち,
});
const 名簿 = [
  { id: 'm1', name: '一郎', grade: 4 },
  { id: 'm2', name: '次郎', grade: 4 },
  { id: 'g1', name: '卒業さん', grade: 4, enrollment: '卒業' },
  { id: 'r1', name: '退部さん', grade: 2, enrollment: '退部' },
];
const 記録たち = [
  記録(1, [
    射手('m1', ['○', '×', '○', '×']),
    射手('m2', ['○', '○', '×', '×']),
    射手('g1', ['○', '○', '○', '○']),
  ]),
];

test('顔ぶれ：ふだんは現役だけ、卒業生も表示なら卒業・退部した人と卒業生の名簿も', () => {
  assert.deepStrictEqual(
    統.顔ぶれ(名簿).map((人) => 人.id),
    ['m1', 'm2']
  );
  const 全部 = 統.顔ぶれ(名簿, { 卒業生も: true, 卒業生たち: [{ id: 'x1', name: '昔の人' }, { id: 'g1' }] });
  assert.deepStrictEqual(
    全部.map((人) => 人.id),
    ['m1', 'm2', 'g1', 'r1', 'x1']
  );
});

test('学年で絞ると現役だけ（卒業した 4 年生は「4年生の順位」に入らない）', () => {
  const 結果 = 統.全員の成績(名簿, 記録たち, { 学年: 4 });
  assert.deepStrictEqual(結果.一覧.map((行) => 行.名前).sort(), ['一郎', '次郎']);
});

test('同じ率・同じ射数は同じ順位', () => {
  const 結果 = 統.全員の成績(統.顔ぶれ(名簿), 記録たち, {});
  assert.deepStrictEqual(
    結果.一覧.map((行) => 行.順位),
    [1, 1]
  );
});

test('名簿の人数は現役だけ。卒業生もなら卒業・退部を別に返す', () => {
  const 結果 = 名簿を数える(名簿, { 卒業生も: true, 卒業生: [{ id: 'x1', name: '昔の人' }] });
  assert.strictEqual(結果.人数, 2);
  assert.deepStrictEqual(結果.卒業生, ['卒業さん', '昔の人']);
  assert.deepStrictEqual(結果.退部した人, ['退部さん']);
});

test('万能の集計の学年の絞りも現役だけ', () => {
  const 結果 = 集計する(名簿, 記録たち, { 切り口: ['人'], 学年: 4 });
  assert.deepStrictEqual(結果.一覧.map((行) => 行.人).sort(), ['一郎', '次郎']);
});

test('組分けは名前を挙げた人のほかは現役だけ', () => {
  const 結果 = 組を作る(名簿, 記録たち, { 一組の人数: 1, 現役だけ: true });
  assert.strictEqual(結果.分けた人数, 2);
  const 挙げた = 組を作る(名簿, 記録たち, { 一組の人数: 1, 現役だけ: true, 必ず入れる: ['卒業さん'] });
  assert.strictEqual(挙げた.分けた人数, 3);
  assert.deepStrictEqual(挙げた.見つからない名前, []);
});

test('名前の無い区切り（---）ではチームを分けない。名前付きの区切りが無ければ null', () => {
  const 記 = { archers: [{ marks: ['○'] }, { isSeparator: true, teamName: '---' }, { marks: ['×'] }] };
  assert.strictEqual(統.チームごとの的中(記), null);
  const 二つ = {
    archers: [
      { isSeparator: true, teamName: 'A大' },
      { marks: ['○'] },
      { isSeparator: true, teamName: '' },
      { marks: ['○'] },
      { isSeparator: true, teamName: 'B大' },
      { marks: ['×'] },
    ],
  };
  assert.deepStrictEqual(
    統.チームごとの的中(二つ).map((組) => [組.チーム, 組.人数, 組.的中]),
    [
      ['A大', 2, 2],
      ['B大', 1, 0],
    ]
  );
});

test('比べる期間：片方の端だけなら同じ日数で補う', () => {
  const 日 = (t) => new Date(t).toLocaleDateString('sv-SE');
  const 今日 = new Date(今);
  const 前の始めだけ = 統.比べる期間を決める({ compareFrom: '2026-08-01' }, 今日);
  assert.strictEqual(日(前の始めだけ.前の期間.終わり), '2026-08-30');
  const 前の終わりだけ = 統.比べる期間を決める({ compareTo: '2026-08-31' }, 今日);
  assert.strictEqual(日(前の終わりだけ.前の期間.始め), '2026-08-02');
  const 今の終わりだけ = 統.比べる期間を決める({ dateTo: '2026-09-30' }, 今日);
  assert.strictEqual(日(今の終わりだけ.今の期間.始め), '2026-09-01');
  assert.ok(今の終わりだけ.今の期間.始め < 今の終わりだけ.今の期間.終わり);
});

test('出欠の月ごとは新しい 36 か月', () => {
  const 結果 = 統.出欠を月ごとに(名簿, [], {
    期間: { 始め: new Date(2020, 0, 1).getTime(), 終わり: new Date(2026, 9, 31).getTime() },
    今日: '2026-10-31',
  });
  assert.strictEqual(結果.月たち.length, 36);
  assert.strictEqual(結果.月たち.at(-1), '2026-10');
  assert.ok(結果.古くて数えなかった月の数 > 0);
});

test('出欠：卒業・退部した人は来たときだけ載せる。いた年度の欠席は数える', () => {
  const 練習日 = { '2026-10-01': true, '2026-10-02': true };
  const 結果 = 統.出欠の集計(名簿, 記録たち, { 練習日, 今日: '2026-10-31' });
  const 名前 = [...結果.一覧, ...結果.一度も来ていない人].map((行) => 行.名前).sort();
  assert.deepStrictEqual(名前, ['一郎', '卒業さん', '次郎']);
  assert.strictEqual(その年度に現役だったか({ enrollment: '卒業', leftYear: 2026 }, 2026), true);
  assert.strictEqual(その年度に現役だったか({ enrollment: '卒業', leftYear: 2025 }, 2026), false);
});
