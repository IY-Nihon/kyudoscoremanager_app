/**
 * 弓具を変えた前後の成績（src/equipmentTrend.js）。
 *
 *   npm test
 *
 * 見たいのは2つ。
 *   ・数え方が分析画面やAIの答えと食い違わないこと
 *   ・射数が少ないときに「良くなった／悪くなった」と言わないこと
 * 後者を外すと、3射の偶然を弓具のせいだと読ませてしまう。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  期間の成績,
  弓具の期間の成績,
  弓具の移り変わり,
  見立ての言葉,
  率を出す最小射数,
} = require('../src/equipmentTrend');

const 一日 = 86400000;
const 基準 = Date.parse('2026-06-01T00:00:00Z');

/** その日に、指定の的中数で 射数 本引いた記録を作る */
const 記録 = (日, 射数, 的中, 他 = {}) =>
  Object.assign(
    {
      id: 'r' + 日 + '-' + 射数 + '-' + 的中,
      date: 日,
      archers: [
        {
          id: 'a',
          name: '山田',
          // 部員との結び付けは memberId だけで見る（同姓同名を混ぜないため。
          // chatStats の その人の射か）。名前だけでは数えられない
          memberId: 'm1',
          marks: Array.from({ length: 射数 }, (_, i) => (i < 的中 ? '○' : '×')),
        },
      ],
    },
    他
  );

const 人 = { id: 'm1', name: '山田', grade: 1 };

test('期間の成績：その期間の記録だけを数える', () => {
  const 記録たち = [記録(基準 - 5 * 一日, 4, 4), 記録(基準 + 5 * 一日, 4, 0)];
  assert.deepStrictEqual(期間の成績(人, 記録たち, 基準 - 10 * 一日, 基準 - 1), {
    的中: 4,
    射数: 4,
    的中率: null, // 射数が足りないので率は出さない
  });
});

test('「集計に含めない」記録は数えない', () => {
  // 分析画面やAIの答えと食い違わせない
  const 記録たち = [
    記録(基準 - 5 * 一日, 40, 40),
    記録(基準 - 4 * 一日, 40, 0, { includeInStats: !1 }),
  ];
  const 出 = 期間の成績(人, 記録たち, 基準 - 10 * 一日, 基準 - 1);
  assert.strictEqual(出.射数, 40, '含めない記録を数えてしまっている');
  assert.strictEqual(出.的中率, 100);
});

test('変えた日そのものは、その弓具の側に入る', () => {
  // その日から新しい道具で引いている
  const その人 = Object.assign({}, 人, {
    equipments: [{ id: 'e1', date: 基準 - 100 * 一日 }, { id: 'e2', date: 基準 }],
  });
  const 出 = 弓具の移り変わり(その人, [記録(基準, 40, 40)]);
  // 新しい順。先頭が 基準 に変えたぶん
  assert.strictEqual(出[0].成績.射数, 40, '変えた日がその弓具に入っていない');
  assert.strictEqual(出[1].成績.射数, 0, '前の弓具に入ってしまっている');
});

test('射数が少ないときは率を出さない', () => {
  // 3射で100%を「良くなった」と読ませない
  const その人 = Object.assign({}, 人, {
    equipments: [{ id: 'e1', date: 基準 - 10 * 一日 }, { id: 'e2', date: 基準 }],
  });
  const 出 = 弓具の移り変わり(その人, [記録(基準 - 2 * 一日, 4, 4), 記録(基準 + 2 * 一日, 4, 0)]);
  assert.strictEqual(出[0].成績.的中率, null);
  assert.strictEqual(出[1].成績.的中率, null);
  assert.strictEqual(出[0].差, null, '射数が足りないのに差を出している');
});

test('射数が足りていれば、前の弓具との差を出す', () => {
  const その人 = Object.assign({}, 人, {
    equipments: [{ id: 'e1', date: 基準 - 10 * 一日 }, { id: 'e2', date: 基準 }],
  });
  const 出 = 弓具の移り変わり(その人, [
    記録(基準 - 2 * 一日, 40, 32), // 80%
    記録(基準 + 2 * 一日, 40, 24), // 60%
  ]);
  assert.strictEqual(出[1].成績.的中率, 80, '前の弓具');
  assert.strictEqual(出[0].成績.的中率, 60, 'いまの弓具');
  assert.strictEqual(出[0].差, -20);
  assert.strictEqual(出[1].差, null, 'いちばん古いものに差は出さない');
});

test('いちばん新しい弓具は、いまも使っている扱いにする', () => {
  // 終わりを置かないので、ずっと後の記録も入る
  const その人 = Object.assign({}, 人, { equipments: [{ id: 'e1', date: 基準 }] });
  const 出 = 弓具の移り変わり(その人, [記録(基準 + 500 * 一日, 40, 40)]);
  assert.strictEqual(出[0].終わり, Infinity);
  assert.strictEqual(出[0].成績.射数, 40, 'ずっと後の記録が入っていない');
});

test('変える前の記録は、どの弓具にも入らない', () => {
  // 何を使っていたか分からないので、数えない
  const その人 = Object.assign({}, 人, { equipments: [{ id: 'e1', date: 基準 }] });
  const 出 = 弓具の移り変わり(その人, [記録(基準 - 100 * 一日, 40, 40)]);
  assert.strictEqual(出[0].成績.射数, 0);
});

test('期間は、次に変えた日の前日で切れる', () => {
  const その人 = Object.assign({}, 人, {
    equipments: [{ id: 'e1', date: 基準 }, { id: 'e2', date: 基準 + 10 * 一日 }],
  });
  const 出 = 弓具の移り変わり(その人, []);
  assert.strictEqual(出[1].始め, 基準);
  assert.strictEqual(出[1].終わり, 基準 + 10 * 一日 - 1, '次の弓具の日と重なっている');
  assert.strictEqual(出[0].始め, 基準 + 10 * 一日);
});

test('移り変わり：新しい順に並ぶ', () => {
  const その人 = Object.assign({}, 人, {
    equipments: [
      { id: 'e1', date: 基準 - 60 * 一日, weight: '15' },
      { id: 'e2', date: 基準, weight: '16' },
      { id: 'e3', date: 基準 - 30 * 一日, weight: '15.5' },
    ],
  });
  const 並び = 弓具の移り変わり(その人, []);
  assert.deepStrictEqual(並び.map((x) => x.変更.id), ['e2', 'e3', 'e1']);
});

test('移り変わり：種類が無いものは弓力の変更として扱う', () => {
  // 古い記録には種類が付いていない
  const その人 = Object.assign({}, 人, {
    equipments: [
      { id: 'e1', date: 基準, weight: '16' },
      { id: 'e2', date: 基準 - 一日, kind: '弦' },
    ],
  });
  const 並び = 弓具の移り変わり(その人, []);
  assert.strictEqual(並び[0].種類, '弓力');
  assert.strictEqual(並び[1].種類, '弦');
});

test('移り変わり：日付の無いものは飛ばす', () => {
  const その人 = Object.assign({}, 人, {
    equipments: [{ id: 'e1' }, { id: 'e2', date: 基準 }, null],
  });
  assert.strictEqual(弓具の移り変わり(その人, []).length, 1);
});

test('移り変わり：弓具が無くても落ちない', () => {
  assert.deepStrictEqual(弓具の移り変わり(人, []), []);
  assert.deepStrictEqual(弓具の移り変わり(null, []), []);
});

test('言葉：射数が足りないときは、率を出さずにそう言う', () => {
  const 言葉 = 見立ての言葉({
    成績: { 射数: 4, 的中率: null },
    前の成績: null,
    差: null,
  });
  assert.ok(言葉.includes('4射'), 言葉);
  assert.ok(言葉.includes(String(率を出す最小射数)), 言葉);
  assert.ok(!言葉.includes('％'), '率を出してしまっている: ' + 言葉);
});

test('言葉：いちばん古い弓具には「前」が無いと言う', () => {
  const 言葉 = 見立ての言葉({
    成績: { 射数: 40, 的中率: 60 },
    前の成績: null,
    差: null,
  });
  assert.ok(言葉.includes('60％'), 言葉);
  assert.ok(言葉.includes('弓具の記録がありません'), 言葉);
});

test('言葉：差が出せても、言い切らない', () => {
  // 「弓具のせいで下がった」と読ませない
  const 言葉 = 見立ての言葉({
    成績: { 射数: 40, 的中率: 60 },
    前の成績: { 射数: 40, 的中率: 80 },
    差: -20,
  });
  assert.ok(言葉.includes('60％'), 言葉);
  assert.ok(言葉.includes('80％'), 言葉);
  assert.ok(言葉.includes('下がっています'), 言葉);
  assert.ok(言葉.includes('弓具だけが理由とは限りません'), '言い切ってしまっている: ' + 言葉);
});

// ── 分析画面が読む項目 ────────────────────────────────
//
// 弓具の節（src/JP_AnalysisScreen_1000.js の 弓具の節）は、この形をそのまま
// 読んでいる。項目名を1つ変えると、画面には「undefined」と出るだけで、
// どこも落ちないので気づけない。ここで名前を押さえておく。
//
// 検証環境には弓具の履歴を持つ部員が1人もいないため、画面での見た目は
// e2e では確かめられていない。実データを入れると台帳が汚れるので、
// 代わりにここで形を固定している。

test('分析画面が読む項目が、そのまま揃っている', () => {
  const 日 = (s) => new Date(s).getTime();
  const 人 = {
    id: 'a1',
    name: '一人目',
    grade: 1,
    equipments: [
      { id: 'e1', date: 日('2026-01-01'), weight: 15, note: '入部のとき' },
      { id: 'e2', date: 日('2026-03-01'), weight: 17, note: '強くした' },
    ],
  };
  // 変更の前後30日に、率が出るだけの射数を置く
  const 記録たち = [];
  for (let i = 0; i < 12; i++) {
    const 前後 = i < 6 ? 日('2026-02-15') : 日('2026-03-15');
    記録たち.push({
      id: 'r' + i,
      date: 前後 + i * 86400000 * (i < 6 ? -1 : 1),
      includeInStats: true,
      archers: [{ id: 'a1', name: '一人目', marks: ['○', '×', '○', '×', '○', '×', '○', '×'] }],
    });
  }
  const 並び = 弓具の移り変わり(人, 記録たち);
  assert.ok(並び.length > 0, '移り変わりが1件も出ていない');

  for (const 一件 of 並び) {
    // 画面はこれらを読む。1つでも名前が変わると「undefined」と出る
    assert.ok(一件.変更 && typeof 一件.変更 === 'object', '変更 が無い');
    assert.ok(一件.成績 && typeof 一件.成績.射数 === 'number', '成績 が無い');
    assert.ok('前の成績' in 一件, '前の成績 が無い');
    assert.ok('始め' in 一件 && '終わり' in 一件, '期間が無い');
    assert.strictEqual(typeof 一件.変更.date, 'number', '変更.date が数でない');
    assert.ok('weight' in 一件.変更, '変更.weight が無い');
    assert.ok('note' in 一件.変更, '変更.note が無い');
    assert.ok('id' in 一件.変更, '変更.id が無い（並びの鍵に使っている）');
    assert.strictEqual(typeof 一件.種類, 'string', '種類 が字でない');
    // 見立ての言葉は、この一件をそのまま受け取る
    const 言葉 = 見立ての言葉(一件);
    assert.strictEqual(typeof 言葉, 'string');
    assert.ok(言葉.length > 0, '見立ての言葉が空');
    assert.ok(!言葉.includes('undefined'), '見立ての言葉に undefined が混じっている: ' + 言葉);
  }
});
