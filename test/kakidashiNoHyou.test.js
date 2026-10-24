/**
 * 書き出しの中身づくり（src/kakidashiNoHyou.js）の検査。
 *
 *   npm test
 *
 * 窓の部品の中にあったものを外へ出したので、選び方と行の組み方を押さえる。
 * 途中交代は人ごとに分け、個人の書き出しは自分の分だけ（交代で入った記録も含む）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 書き出しのシートを作る } = require('../src/kakidashiNoHyou');

const 名簿 = [
  { id: 'm1', name: '山田 太郎', grade: 2, gender: '男子', termKi: 52 },
  { id: 'm2', name: '鈴木 花子', grade: 1, gender: '女子', termKi: 53 },
  { id: 'm3', name: '佐藤 次郎', grade: 3, gender: '男子', termKi: 51 },
];
// 8/1：山田の列に、5射目から鈴木が交代で入る。佐藤は別の列
const 交代の記録 = {
  id: 's1',
  date: new Date(2026, 7, 1, 10).getTime(),
  title: '午前練習',
  tags: ['正規練習'],
  archers: [
    {
      id: 'a1',
      name: '山田 太郎',
      memberId: 'm1',
      marks: ['○', '×', '○', '○', '○', '×', '×', '○'],
      substitutions: { 4: '鈴木 花子' },
      substitutionIds: { 4: 'm2' },
    },
    { id: 'sep', isSeparator: true, marks: [] },
    { id: 'a2', name: '佐藤 次郎', memberId: 'm3', marks: ['○', '○', '○', '○', '×', '×', '×', '×'] },
  ],
};
// 8/2：集計に含めない記録。山田と佐藤
const 含めない記録 = {
  id: 's2',
  date: new Date(2026, 7, 2, 10).getTime(),
  title: '遊び',
  includeInStats: false,
  archers: [
    { id: 'b1', name: '山田 太郎', memberId: 'm1', marks: ['○', '○', '×', '×'] },
    { id: 'b2', name: '佐藤 次郎', memberId: 'm3', marks: ['×', '×', '×', '×'] },
  ],
};
const 記録たち = [交代の記録, 含めない記録];

test('標準：途中交代は人ごとの行に分け、分母は実際に引いた数', () => {
  const { 記録の数, シートたち } = 書き出しのシートを作る(記録たち, { 範囲: 'all', 形: 'standard' }, 名簿);
  assert.strictEqual(記録の数, 2);
  const [本表, 外した表] = シートたち;
  assert.strictEqual(本表.name, '記録');
  // 日付・題・名前・学年・性別・期・的中・射数・率
  const 行 = 本表.rows.map((列) => 列.slice(0, 9));
  assert.deepStrictEqual(行, [
    ['2026-08-01', '午前練習', '山田 太郎', '2年', '男子', 52, 3, 4, 75],
    ['2026-08-01', '午前練習', '鈴木 花子', '1年', '女子', 53, 2, 4, 50],
    ['2026-08-01', '午前練習', '佐藤 次郎', '3年', '男子', 51, 4, 8, 50],
  ]);
  assert.strictEqual(外した表.name, '集計に含めない記録');
  assert.strictEqual(外した表.rows.length, 2);
});

test('個人：交代で入っただけの記録も書き出し、自分の行だけを出す', () => {
  // 鈴木は列の持ち主ではない。前は列の持ち主だけを見ていて、この記録が丸ごと落ちていた
  const { 記録の数, シートたち } = 書き出しのシートを作る(
    記録たち,
    { 範囲: 'all', 形: 'standard', 自分id: 'm2', 自分名: '鈴木 花子' },
    名簿
  );
  assert.strictEqual(記録の数, 1);
  assert.deepStrictEqual(
    シートたち[0].rows.map((列) => 列[2]),
    ['鈴木 花子']
  );
  assert.strictEqual(シートたち.length, 1, '含めない記録には鈴木がいないので、そのシートは作らない');
});

test('個人：集計に含めない記録のシートにも、他の人の成績を出さない', () => {
  const { シートたち } = 書き出しのシートを作る(
    記録たち,
    { 範囲: 'all', 形: 'standard', 自分id: 'm1', 自分名: '山田 太郎' },
    名簿
  );
  const 外した表 = シートたち[1];
  assert.deepStrictEqual(
    外した表.rows.map((列) => 列[2]),
    ['山田 太郎']
  );
});

test('印刷向け：交代で入っただけの人も行に出し、集計しない記録の日付は列にしない', () => {
  const { シートたち } = 書き出しのシートを作る(記録たち, { 範囲: 'all', 形: 'matrix' }, 名簿);
  const 本表 = シートたち[0];
  assert.strictEqual(本表.name, '集計');
  assert.deepStrictEqual(本表.headers, ['氏名', '学年', '的中率', '的中数', '総矢数', '8月1日']);
  // 学年の順（1 年が先）
  assert.deepStrictEqual(本表.rows, [
    ['鈴木 花子', '1年', 50, 2, 4, '2/4'],
    ['山田 太郎', '2年', 75, 3, 4, '3/4'],
    ['佐藤 次郎', '3年', 50, 4, 8, '4/8'],
  ]);
});

test('詳しい条件：期間・タグ（すべて／いずれか）・言葉・メンバー名', () => {
  const 期間 = { 範囲: 'custom', 形: 'standard', 始め: new Date(2026, 7, 1), 終わり: new Date(2026, 7, 31) };
  const 数 = (条件) => 書き出しのシートを作る(記録たち, Object.assign({}, 期間, 条件), 名簿).記録の数;
  assert.strictEqual(数({}), 2);
  assert.strictEqual(数({ 終わり: new Date(2026, 7, 1) }), 1, '終わりの日は、その日の終わりまで入る');
  assert.strictEqual(数({ 選んだタグ: ['正規練習', '大会'], タグの論理: 'AND' }), 0);
  assert.strictEqual(数({ 選んだタグ: ['正規練習', '大会'], タグの論理: 'OR' }), 1);
  assert.strictEqual(数({ 言葉の絞り: '午前' }), 1);
  assert.strictEqual(数({ 言葉の絞り: '2026/08/02' }), 1, '日付にも当てる');
  assert.strictEqual(数({ 選んだ言葉: ['遊び', '午前練習'] }), 2);
  const 行 = 書き出しのシートを作る(記録たち, Object.assign({}, 期間, { 部員名の絞り: '鈴木' }), 名簿)
    .シートたち[0].rows;
  assert.deepStrictEqual(
    行.map((列) => 列[2]),
    ['鈴木 花子'],
    '名前の絞りも列ではなく人ごと'
  );
});

test('当たる記録が無ければ記録の数は 0', () => {
  const { 記録の数 } = 書き出しのシートを作る(記録たち, { 範囲: 'fiscal', 年度: 2020, 形: 'standard' }, 名簿);
  assert.strictEqual(記録の数, 0);
});
