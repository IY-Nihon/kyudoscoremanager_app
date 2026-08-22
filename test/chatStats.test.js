/**
 * チャットボットに渡す成績の集計の検査。
 *
 *   npm test
 *
 * 元は模型に「名前|率|的中/総」を人数ぶん並べて渡し、並べ替えも
 * 絞り込みも模型にさせていた。数字の取り違えはそこで起きるので、
 * 数えるのも並べるのもここで済ませ、その正しさをここで押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 全員の成績, その射を引いた人 } = require('../src/chatStats');

const 人 = (name, o) => Object.assign({ id: name, name, grade: 1 }, o);
const 記録 = (date, archers) => ({ date, archers });
const 射手 = (o) => Object.assign({ id: 'x', name: '', marks: [], memberId: null }, o);

test('的中と射数を数える（○と×だけ数え、空欄は数えない）', () => {
  const r = 全員の成績(
    [人('山田')],
    [記録(1000, [射手({ memberId: '山田', marks: ['○', '×', '', '○'] })])],
    {}
  );
  assert.equal(r.一覧[0].的中, 2);
  assert.equal(r.一覧[0].射数, 3, '空欄は射数に数えない');
  assert.equal(r.一覧[0].的中率, 66.7);
});

test('途中交代のぶんは、交代した人の側に数える', () => {
  const r = 全員の成績(
    [人('山田'), 人('田中')],
    [
      記録(1000, [
        射手({
          memberId: '山田',
          name: '山田',
          marks: ['○', '○', '×', '×'],
          substitutions: { 2: '田中' },
          substitutionIds: { 2: '田中' },
        }),
      ]),
    ],
    { 並び: '名前' }
  );
  const 見る = (名) => r.一覧.find((x) => x.名前 === 名);
  assert.equal(見る('山田').射数, 2, '交代までが山田の射');
  assert.equal(見る('山田').的中, 2);
  assert.equal(見る('田中').射数, 2, '交代からが田中の射');
  assert.equal(見る('田中').的中, 0);
});

test('順位を付けて返す。率が同じなら、たくさん引いた人が上', () => {
  const r = 全員の成績(
    [人('少ない'), 人('多い')],
    [
      記録(1000, [
        射手({ memberId: '少ない', marks: ['○', '×'] }),
        射手({ memberId: '多い', marks: ['○', '×', '○', '×', '○', '×', '○', '×'] }),
      ]),
    ],
    {}
  );
  assert.equal(r.一覧[0].名前, '多い', '同率なら射数の多い人が上');
  assert.equal(r.一覧[0].順位, 1);
  assert.equal(r.一覧[1].順位, 2);
});

test('3射だけの100%が、たくさん引いた人を追い越さない（最小射数）', () => {
  const 記録たち = [
    記録(1000, [
      射手({ memberId: 'まぐれ', marks: ['○', '○', '○'] }),
      射手({ memberId: '本命', marks: Array(40).fill('○').concat(Array(10).fill('×')) }),
    ]),
  ];
  const 素 = 全員の成績([人('まぐれ'), 人('本命')], 記録たち, {});
  assert.equal(素.一覧[0].名前, 'まぐれ', '素のままなら率で上に来る');

  const 絞る = 全員の成績([人('まぐれ'), 人('本命')], 記録たち, { 最小射数: 10 });
  assert.equal(絞る.一覧[0].名前, '本命', '最小射数で外せる');
  assert.equal(絞る.射数が足りず外した人数, 1);
});

test('期間で絞れる', () => {
  const r = 全員の成績(
    [人('山田')],
    [
      記録(1000, [射手({ memberId: '山田', marks: ['○', '○'] })]),
      記録(9000, [射手({ memberId: '山田', marks: ['×', '×'] })]),
    ],
    { 期間: { 始め: 5000, 終わり: 10000 } }
  );
  assert.equal(r.数えた記録, 1);
  assert.equal(r.一覧[0].的中, 0, '期間の外は数えない');
});

test('件数で上位だけ返せる', () => {
  const r = 全員の成績(
    [人('a'), 人('b'), 人('c')],
    [
      記録(1000, [
        射手({ memberId: 'a', marks: ['○', '○'] }),
        射手({ memberId: 'b', marks: ['○', '×'] }),
        射手({ memberId: 'c', marks: ['×', '×'] }),
      ]),
    ],
    { 件数: 2 }
  );
  assert.equal(r.一覧.length, 2);
  assert.equal(r.人数, 3, '外した人数ではなく、絞る前の人数を伝える');
});

test('一度も引いていない人は一覧に出さない', () => {
  const r = 全員の成績(
    [人('引いた'), 人('休み')],
    [記録(1000, [射手({ memberId: '引いた', marks: ['○'] })])],
    {}
  );
  assert.equal(r.一覧.length, 1);
  assert.equal(r.一覧[0].名前, '引いた');
});

test('団体全体の的中率も返す（模型に足し算をさせない）', () => {
  const r = 全員の成績(
    [人('a'), 人('b')],
    [
      記録(1000, [
        射手({ memberId: 'a', marks: ['○', '×'] }),
        射手({ memberId: 'b', marks: ['○', '○'] }),
      ]),
    ],
    {}
  );
  assert.equal(r.全体.的中, 3);
  assert.equal(r.全体.射数, 4);
  assert.equal(r.全体.的中率, 75);
});

test('名前の空白の有無は同じ人とみなす', () => {
  const r = 全員の成績(
    [人('山田 太郎')],
    [記録(1000, [射手({ memberId: null, name: '山田太郎', marks: ['○'] })])],
    {}
  );
  assert.equal(r.一覧[0].射数, 1, '空白違いで別人にしない');
});

test('記録が無くても落ちない', () => {
  const r = 全員の成績([人('山田')], [], {});
  assert.equal(r.一覧.length, 0);
  assert.equal(r.全体.的中率, null);
});

// ── 足した道具の検査 ──────────────────────────────────────────
const { 出欠の集計, 記録をさがす, 射位ごとの成績 } = require('../src/chatStats');

test('出欠：出席・遅刻・早退は「来た」に数え、欠席と分けて率を出す', () => {
  const r = 出欠の集計(
    [人('山田')],
    [
      { date: 1, attendance: { 山田: 'present' } },
      { date: 2, attendance: { 山田: 'late' } },
      { date: 3, attendance: { 山田: 'early' } },
      { date: 4, attendance: { 山田: 'absent' } },
    ],
    {}
  );
  const x = r.一覧[0];
  assert.equal(x.出席, 1);
  assert.equal(x.遅刻, 1);
  assert.equal(x.早退, 1);
  assert.equal(x.欠席, 1);
  assert.equal(x.来た回数, 3, '遅刻・早退も来たうちに数える');
  assert.equal(x.出席率, 75);
});

test('出欠：出欠を付けていない記録は数に入れない', () => {
  // 全員欠席として数えると、出席率が実態より低く出る
  const r = 出欠の集計(
    [人('山田')],
    [{ date: 1, attendance: { 山田: 'present' } }, { date: 2 }, { date: 3, attendance: {} }],
    {}
  );
  assert.equal(r.出欠を付けた記録の件数, 1);
  assert.equal(r.出欠が付いていない記録の件数, 2);
  assert.equal(r.一覧[0].出席率, 100, '付いていない回で率が下がってはいけない');
});

test('出欠：一度も名前が出ない人は一覧に出さない', () => {
  const r = 出欠の集計([人('山田'), 人('幽霊')], [{ date: 1, attendance: { 山田: 'present' } }], {});
  assert.equal(r.一覧.length, 1);
  assert.equal(r.一覧[0].名前, '山田');
});

test('検索：題・覚え書き・目印・出ている人の名前のどれでも見つかる', () => {
  const 記録たち = [
    { id: 's1', date: 1000, title: '春季大会', archers: [] },
    { id: 's2', date: 2000, title: '練習', note: '雨で中断', archers: [] },
    { id: 's3', date: 3000, title: '練習', tags: ['審査'], archers: [] },
    { id: 's4', date: 4000, title: '練習', archers: [{ name: '山田 太郎', marks: [] }] },
  ];
  assert.equal(記録をさがす(記録たち, { 言葉: '大会' }).一覧[0].id, 's1');
  assert.equal(記録をさがす(記録たち, { 言葉: '雨' }).一覧[0].id, 's2');
  assert.equal(記録をさがす(記録たち, { 言葉: '審査' }).一覧[0].id, 's3');
  assert.equal(記録をさがす(記録たち, { 言葉: '山田太郎' }).一覧[0].id, 's4', '空白違いでも見つかる');
});

test('検索：新しい順に返し、件数で絞れる', () => {
  const 記録たち = [
    { id: 'a', date: 1000, title: '練習', archers: [] },
    { id: 'b', date: 3000, title: '練習', archers: [] },
    { id: 'c', date: 2000, title: '練習', archers: [] },
  ];
  const r = 記録をさがす(記録たち, { 言葉: '練習', 件数: 2 });
  assert.equal(r.見つかった件数, 3, '絞る前の件数も伝える');
  assert.deepEqual(r.一覧.map((x) => x.id), ['b', 'c'], '新しい順');
});

test('射位：先頭が大前、最後が落。区切りと合計は数えない', () => {
  const r = 射位ごとの成績(
    [],
    [
      {
        date: 1000,
        archers: [
          { name: '前', marks: ['○', '○'] },
          { isSeparator: true },
          { name: '中', marks: ['○', '×'] },
          { name: '後', marks: ['×', '×'] },
          { isTotalCalculator: true },
        ],
      },
    ],
    {}
  );
  const 見る = (名) => r.一覧.find((x) => x.名前 === 名);
  assert.equal(見る('前').射位ごと[0].射位, '大前');
  assert.equal(見る('後').射位ごと[0].射位, '落');
  assert.equal(見る('中').射位ごと[0].射位, '2番', '区切りを除いた並びで数える');
});

test('射位：同じ人でも、射位ごとに分けて数える', () => {
  const r = 射位ごとの成績(
    [],
    [
      { date: 1, archers: [{ name: '山田', marks: ['○', '○'] }, { name: '他', marks: ['×'] }] },
      { date: 2, archers: [{ name: '他', marks: ['×'] }, { name: '山田', marks: ['×', '×'] }] },
    ],
    {}
  );
  const 山田 = r.一覧.find((x) => x.名前 === '山田');
  const 位 = Object.fromEntries(山田.射位ごと.map((x) => [x.射位, x.的中率]));
  assert.equal(位['大前'], 100, '大前では2射2中');
  assert.equal(位['落'], 0, '落では2射0中');
  assert.equal(山田.全体の射数, 4);
});

test('射位：名前を指定すると、その人たちだけ返す', () => {
  const r = 射位ごとの成績(
    [],
    [{ date: 1, archers: [{ name: '山田', marks: ['○'] }, { name: '田中', marks: ['○'] }] }],
    { 名前たち: ['山田'] }
  );
  assert.equal(r.一覧.length, 1);
  assert.equal(r.一覧[0].名前, '山田');
});
