/**
 * AI チャットの図（showFigure）の形を作る検査。
 *
 *   npm test
 *
 * 図は道具の結果（端末に控えたもの）から直に作る。模型には数字を書き写させない（2026-10-25 本人と決めた）
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 図を作る, 使える形, 図の分を外す } = require('../src/chatFigures');
const { 集計する } = require('../src/chatAggregate');
const { 矢所の成績 } = require('../src/chatStats');

const 人 = (name) => ({ id: name, name, grade: 1, gender: '男子' });
const 列 = (memberId, marks, o) => Object.assign({ id: 'a-' + memberId, name: memberId, memberId, marks }, o);
const 記録 = (日, archers) => ({
  id: 'r-' + 日,
  date: new Date(日 + 'T18:00:00').getTime(),
  title: '通常練習',
  archers,
});
const 記録たち = [
  記録('2026-09-05', [列('山田', ['○', '○', '×', '×']), 列('佐藤', ['○', '×', '×', '×'])]),
  記録('2026-10-03', [列('山田', ['○', '○', '○', '×']), 列('佐藤', ['○', '○', '×', '×'])]),
];

test('集計（月ごと）：折れ線・棒・表を作れる。折れ線は道具の的中率をそのまま使う', () => {
  const 結果 = 集計する([人('山田'), 人('佐藤')], 記録たち, { 切り口: ['月'] });
  assert.deepEqual(使える形('aggregateStats', 結果), ['折れ線', '棒', '表']);
  const 線 = 図を作る('aggregateStats', 結果, '折れ線', '月ごとの的中率');
  assert.equal(線.形, '折れ線');
  assert.equal(線.題, '月ごとの的中率');
  assert.deepEqual(
    線.系列[0].点.map((点) => [点.x, 点.y]),
    [
      ['9月', 37.5],
      ['10月', 62.5],
    ]
  );
  const 表 = 図を作る('aggregateStats', 結果, '表');
  assert.deepEqual(表.列, ['月', '射数', '的中', '皆中', '的中率']);
  assert.deepEqual(表.行[1], ['10月', '8', '5', '0', '62.5%']);
});

test('集計（射目ごと）：射の順の棒と折れ線にできる。選べない形には使える形を返す', () => {
  const 結果 = 集計する([人('山田'), 人('佐藤')], 記録たち, { 切り口: ['射目'] });
  assert.deepEqual(使える形('aggregateStats', 結果), ['折れ線', '棒', '表']);
  const 誤り = 図を作る('aggregateStats', 結果, '矢所');
  assert.match(誤り.error, /折れ線・棒・表/);
  const 棒 = 図を作る('aggregateStats', 結果, '棒');
  assert.equal(棒.向き, '縦');
  assert.deepEqual(
    棒.並び.map((項) => [項.名, 項.値]),
    [
      ['1', 100],
      ['2', 75],
      ['3', 25],
      ['4', 0],
    ]
  );
});

test('集計（人 × 月）：表は人ごとの行に月の列、折れ線は人ごとの系列', () => {
  const 結果 = 集計する([人('山田'), 人('佐藤')], 記録たち, { 切り口: ['人', '月'] });
  const 表 = 図を作る('aggregateStats', 結果, '表');
  assert.deepEqual(表.列.slice(0, 3), ['人', '9月', '10月']);
  const 山田 = 表.行.find((行) => 行[0] === '山田');
  assert.deepEqual(山田.slice(0, 3), ['山田', '50.0%', '75.0%']);
  const 線 = 図を作る('aggregateStats', 結果, '折れ線');
  assert.equal(線.系列.length, 2);
});

test('全員の成績・組分け・名簿など、ほかの道具の結果も図にできる', () => {
  const 成績 = { 順位: [{ 順位: 1, 名前: '山田', 学年: 1, 的中: 5, 射数: 8, 的中率: 62.5 }] };
  assert.deepEqual(使える形('getAllMembersStats', 成績), ['棒', '表']);
  assert.equal(図を作る('getAllMembersStats', 成績, '棒').向き, '横');
  assert.deepEqual(図を作る('getAllMembersStats', 成績, '表').行[0], ['1', '山田', '1年', '8', '5', '62.5%']);
  const 組 = { 組: [{ 組: 1, 部員: [{ 名前: '山田' }, { 名前: '佐藤' }], 見込みの的中率: 50.1 }] };
  assert.deepEqual(図を作る('makeBalancedTeams', 組, '表').行[0], ['1', '山田・佐藤', '50.1%']);
  const 名簿 = { 一覧: [{ 名前: '山田', 学年: '1年', 性別: '男子' }], 学年ごと: { '1年': 1 } };
  assert.deepEqual(図を作る('listMembers', 名簿, '棒').並び, [{ 名: '1年', 値: 1 }]);
  const 出欠 = {
    月たち: ['2026-09', '2026-10'],
    一覧: [{ 名前: '山田', 月ごと: [{ 月: '2026-09', 出席率: 100 }] }],
  };
  assert.deepEqual(図を作る('getAttendanceStats', 出欠, '表').行[0], ['山田', '100.0%', '—']);
  assert.deepEqual(使える形('navigateToScreen', { success: true }), []);
  assert.match(図を作る('getAllMembersStats', { 順位: [] }, '表').error, /図にできません/);
});

test('矢所：道具の点から図を作る。点は模型に渡さない（_ の項目を外す）', () => {
  const 矢所の記録 = [
    {
      date: 1,
      archers: [
        {
          id: 'a',
          name: '山田',
          memberId: '山田',
          marks: ['○', '×'],
          arrowLocations: [
            { x: 0.1, y: 0.2, targetType: 'kasumi36' },
            { x: 1.3, y: 0.1, targetType: 'kasumi36' },
          ],
        },
      ],
    },
  ];
  const 結果 = 矢所の成績([人('山田')], 矢所の記録, '山田');
  assert.deepEqual(使える形('getArrowLocationStats', 結果), ['矢所']);
  const 図 = 図を作る('getArrowLocationStats', 結果, '矢所', '山田さんの矢所');
  assert.equal(図.中り, 1);
  assert.equal(図.外れ, 1);
  assert.deepEqual(図.点たち[0], { x: 0.1, y: 0.2, mark: '○', targetType: 'kasumi36' });
  const 渡す = 図の分を外す(結果);
  assert.equal(渡す._点たち, undefined);
  assert.equal(渡す.name, '山田');
});

test('矢所：凡例の中り・外れは、描く的の点だけで数える（違う的の点を数えない）', () => {
  const 矢所の記録 = [
    {
      date: 1,
      archers: [
        {
          id: 'a',
          name: '山田',
          memberId: '山田',
          marks: ['○', '×', '○'],
          arrowLocations: [
            { x: 0.1, y: 0.2, targetType: 'hoshi36' },
            { x: 1.3, y: 0.1, targetType: 'kasumi36' },
            { x: 0.2, y: 0.1, targetType: 'kasumi36' },
          ],
        },
      ],
    },
  ];
  const 図 = 図を作る('getArrowLocationStats', 矢所の成績([人('山田')], 矢所の記録, '山田'), '矢所');
  assert.equal(図.的, 'kasumi36');
  assert.equal(図.点たち.length, 2);
  assert.equal(図.中り + 図.外れ, 図.点たち.length, '凡例の数が図の点の数とずれている');
  assert.equal(図.中り, 1);
});

test('折れ線（人 × 月）：1 本目の人に無い月も、横の名に月の順で入る', () => {
  // 佐藤さんだけが 9 月にも引いた。山田さんの系列には 9 月の点が無い
  const 記録 = (日, archers) => ({ id: 'r-' + 日, date: new Date(日 + 'T18:00:00').getTime(), title: '通常練習', archers });
  const 結果 = 集計する(
    [人('山田'), 人('佐藤')],
    [
      記録('2026-09-05', [列('佐藤', ['○', '×', '×', '×'])]),
      記録('2026-10-03', [列('山田', ['○', '○', '○', '×']), 列('佐藤', ['○', '○', '×', '×'])]),
    ],
    { 切り口: ['人', '月'] }
  );
  // 表の列も月の順（前は 1 行目の山田さんに無い 9 月が後ろに付いた）
  assert.deepEqual(図を作る('aggregateStats', 結果, '表').列.slice(0, 3), ['人', '9月', '10月']);
  const 線 = 図を作る('aggregateStats', 結果, '折れ線');
  assert.deepEqual(線.名たち, ['9月', '10月']);
  const 佐藤 = 線.系列.find((系列) => 系列.名 === '佐藤');
  assert.deepEqual(
    佐藤.点.map((点) => 点.x),
    ['9月', '10月']
  );
});

test('表は 50 行まで（注に全部の件数）・題は 40 字まで', () => {
  const 多い = {
    順位: Array.from({ length: 60 }, (_, i) => ({
      順位: i + 1,
      名前: 'p' + i,
      学年: 1,
      的中: 1,
      射数: 2,
      的中率: 50,
    })),
  };
  const 表 = 図を作る('getAllMembersStats', 多い, '表', 'あ'.repeat(60));
  assert.equal(表.行.length, 50);
  assert.match(表.注, /全 60 件/);
  assert.equal(表.題.length, 40);
});

test('射目ごとの棒は、率の順でなく射の順に並び、名は番号だけ（10/26 本番：30 本が「2」「6」と切れていた）', () => {
  const 一覧 = [
    { 射目: '26射目', 射数: 10, 的中: 6, 的中率: 61.7 },
    { 射目: '2射目', 射数: 10, 的中: 5, 的中率: 40.9 },
    { 射目: '10射目', 射数: 10, 的中: 5, 的中率: 50 },
    { 射目: '1射目', 射数: 10, 的中: 4, 的中率: 38.3 },
  ];
  const 棒 = 図を作る('aggregateStats', { 切り口: ['射目'], 一覧 }, '棒');
  assert.deepEqual(
    棒.並び.map((項) => 項.名),
    ['1', '2', '10', '26']
  );
  const 曜日 = 図を作る(
    'aggregateStats',
    { 切り口: ['曜日'], 一覧: ['土', '月', '水'].map((d) => ({ 曜日: d, 射数: 4, 的中: 2, 的中率: 50 })) },
    '棒'
  );
  assert.deepEqual(
    曜日.並び.map((項) => 項.名),
    ['月', '水', '土']
  );
});

test('射目が 13 本以上の棒は折れ線になる（細い棒が並んで読めない。本人 10/26）', () => {
  const 一覧 = Array.from({ length: 20 }, (_, i) => ({
    射目: `${20 - i}射目`,
    射数: 10,
    的中: 4,
    的中率: 40 + i,
  }));
  const 図 = 図を作る('aggregateStats', { 切り口: ['射目'], 一覧 }, '棒');
  assert.equal(図.形, '折れ線');
  assert.deepEqual(
    図.系列[0].点.slice(0, 3).map((点) => 点.x),
    ['1', '2', '3']
  );
});

test('折れ線の横の名は日付を短く（記録・日は「10/3」、週は「10/5〜」）。同じ日の 2 つ目は「②」。通算と射数も持つ（11/13）', () => {
  const 同じ日 = [...記録たち, { ...記録たち[1], id: 'r-2', title: '自主練', date: 記録たち[1].date + 3600_000 }];
  const 結果 = 集計する([人('山田'), 人('佐藤')], 同じ日, { 切り口: ['記録'] });
  const 線 = 図を作る('aggregateStats', 結果, '折れ線');
  assert.deepEqual(線.名たち, ['9/5', '10/3', '10/3②']);
  assert.equal(線.通算, 結果.全体.的中率);
  assert.equal(線.系列[0].点[0].射数, 8);
  const 週 = 図を作る('aggregateStats', 集計する([人('山田')], 記録たち, { 切り口: ['週'] }), '折れ線');
  assert.match(週.名たち[0], /^\d{1,2}\/\d{1,2}〜$/);
});

test('射位の棒は名のまま（「大前」「落」が空にならない）で、大前が先・落が最後', () => {
  const 行 = (射位) => ({ 射位, 射数: 4, 的中: 2, 的中率: 50 });
  const 結果 = { 切り口: ['射位'], 全体: {}, 一覧: [行('落'), 行('2番'), 行('大前')] };
  assert.deepEqual(図を作る('aggregateStats', 結果, '棒').並び.map((項) => 項.名), ['大前', '2番', '落']);
});
