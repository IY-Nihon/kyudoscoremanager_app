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
    [記録(1000, [射手({ memberId: 'a', marks: ['○', '×'] }), 射手({ memberId: 'b', marks: ['○', '○'] })])],
    {}
  );
  assert.equal(r.全体.的中, 3);
  assert.equal(r.全体.射数, 4);
  assert.equal(r.全体.的中率, 75);
});

test('氏名では拾わない。部員IDの無い射は誰の成績にも入らない', () => {
  // 以前は氏名でも拾っていたため、分析画面の順位（IDだけで判定）と数字が
  // 食い違っていた。同姓同名や異体字（渡邊／渡辺）で別人を同一視する危険もある
  const r = 全員の成績(
    [人('山田 太郎')],
    [記録(1000, [射手({ memberId: null, name: '山田太郎', marks: ['○'] })])],
    {}
  );
  assert.equal(r.一覧.length, 0, '氏名だけで入った射を部員の成績に混ぜている');
});

test('部員IDが付いていれば、氏名が違っていても数える', () => {
  // 改名したあとの古い記録でも、IDで正しくその人に付く
  const 本人 = 人('山田太郎');
  const r = 全員の成績(
    [本人],
    [記録(1000, [射手({ memberId: 本人.id, name: '旧姓太郎', marks: ['○', '×'] })])],
    {}
  );
  assert.equal(r.一覧[0].射数, 2);
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

test('出欠：正規練習日があれば、出欠画面と同じく練習日ごとに数える（記録に出ていれば来た、無ければ欠席）', () => {
  // 9 月に記録が 2 件しか無い団体で「来た回数 2 回・出席率 100%」が 8 人並んだ（2026-09-20）。
  // 練習日 4 日（1 日は未来）で、山田は 2 日出て 1 日休み
  const 日 = (文) => new Date(文 + 'T10:00:00').getTime();
  const r = 出欠の集計(
    [人('山田'), Object.assign(人('佐藤'), { grade: 2 })],
    [
      { date: 日('2026-09-06'), archers: [{ memberId: '山田' }, { memberId: '佐藤' }] },
      { date: 日('2026-09-13'), archers: [{ memberId: '山田' }] },
    ],
    {
      期間: { 始め: 日('2026-09-01'), 終わり: new Date('2026-09-30').getTime() + 86400000 },
      練習日: { '2026-08-30': {}, '2026-09-06': {}, '2026-09-13': {}, '2026-09-17': {}, '2026-09-27': {} },
      今日: '2026-09-20',
    }
  );
  assert.equal(r.数え方, '練習日');
  assert.equal(r.練習日数, 4, '期間の外の練習日は数えない');
  const 山田 = r.一覧.find((x) => x.名前 === '山田');
  assert.equal(山田.来た回数, 2);
  assert.equal(山田.欠席, 1, '記録の無い練習日は欠席');
  assert.equal(山田.出席率, 66.7, '分母は今日までの練習日数（未来の 27 日は入れない）');
  const 佐藤 = r.一覧.find((x) => x.名前 === '佐藤');
  assert.equal(佐藤.来た回数, 1);
  assert.equal(佐藤.出席率, 33.3);
  assert.equal(r.一覧[0].名前, '山田', '出席率の順');
});

test('出欠：練習日が期間に無ければ、前のまま記録の出欠の印で数える', () => {
  const r = 出欠の集計([人('山田')], [{ date: 1, attendance: { 山田: 'present' } }], {
    練習日: { '2030-01-01': {} },
    期間: { 始め: 0, 終わり: 10 },
  });
  assert.equal(r.数え方, '記録の出欠');
  assert.equal(r.一覧[0].出席率, 100);
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
  assert.deepEqual(
    r.一覧.map((x) => x.id),
    ['b', 'c'],
    '新しい順'
  );
});

test('射位：先頭が大前、最後が落。区切りごとに数え直し、合計は数えない', () => {
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
  // 区切りより後ろは別の立ち（板が 2 つ写った記録の 2 枚目）。先頭がまた大前
  assert.equal(見る('中').射位ごと[0].射位, '大前', '区切りごとに数え直す');
});

test('射位：同じ人でも、射位ごとに分けて数える', () => {
  const r = 射位ごとの成績(
    [],
    [
      {
        date: 1,
        archers: [
          { name: '山田', marks: ['○', '○'] },
          { name: '他', marks: ['×'] },
        ],
      },
      {
        date: 2,
        archers: [
          { name: '他', marks: ['×'] },
          { name: '山田', marks: ['×', '×'] },
        ],
      },
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
    [
      {
        date: 1,
        archers: [
          { name: '山田', marks: ['○'] },
          { name: '田中', marks: ['○'] },
        ],
      },
    ],
    { 名前たち: ['山田'] }
  );
  assert.equal(r.一覧.length, 1);
  assert.equal(r.一覧[0].名前, '山田');
});

test('射位：「集計に含めない」にした記録は数えない（全員の成績と揃える）', () => {
  const 記録たち = [
    { date: 1, includeInStats: true, archers: [{ memberId: '山田', name: '山田', marks: ['○', '○'] }] },
    { date: 2, includeInStats: false, archers: [{ memberId: '山田', name: '山田', marks: ['×', '×'] }] },
  ];
  const r = 射位ごとの成績([], 記録たち, {});
  const 山田 = r.一覧.find((x) => x.名前 === '山田');
  assert.equal(山田.全体の射数, 2, '外した記録の射まで数えている');
  assert.equal(山田.全体の的中率, 100);

  // 同じ記録を順位側に渡したときと、射数が一致すること
  const 順位 = 全員の成績([{ id: '山田', name: '山田', grade: 1 }], 記録たち, {});
  assert.equal(順位.一覧[0].射数, 山田.全体の射数, '順位と射位別で射数が食い違う');
});

test('射位：この項目が無い古い記録は、これまでどおり数える', () => {
  const r = 射位ごとの成績([], [{ date: 1, archers: [{ name: '山田', marks: ['○'] }] }], {});
  assert.equal(r.一覧.find((x) => x.名前 === '山田').全体の射数, 1);
});

// ── AI チャットの不具合を洗った（2026-09-20） ──────────────────────────
const { 一人の成績, 名前で選ぶ, 期間にする, 日付の始まり, 日付の終わり } = require('../src/chatStats');

test('期間の日付は端末の時刻で読む（世界標準時で読むと月初の朝練が落ちる）', () => {
  const 始め = 日付の始まり('2026-09-01');
  const d = new Date(始め);
  assert.deepEqual([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()], [2026, 9, 1, 0]);
  const 終わり = 日付の終わり('2026-09-30');
  const e = new Date(終わり + 1);
  assert.deepEqual([e.getFullYear(), e.getMonth() + 1, e.getDate(), e.getHours()], [2026, 10, 1, 0]);
  // 9/1 の朝 8 時の記録が 9 月に入り、10/1 の朝 8 時の記録は入らない
  const 期間 = 期間にする('2026-09-01', '2026-09-30');
  const 朝練 = new Date(2026, 8, 1, 8).getTime();
  const 翌月 = new Date(2026, 9, 1, 8).getTime();
  assert.ok(朝練 >= 期間.始め && 朝練 <= 期間.終わり);
  assert.ok(!(翌月 >= 期間.始め && 翌月 <= 期間.終わり));
  assert.deepEqual(期間にする(undefined, undefined), { 始め: 0, 終わり: Infinity });
});

test('名前で選ぶ：同じ名前が先、無ければ含む・含まれる。2 人以上当たれば決めない', () => {
  const 名簿 = [人('山田 太郎'), 人('山田 花子'), 人('†永井 優郷†'), 人('田')];
  assert.equal(名前で選ぶ(名簿, '永井').人.name, '†永井 優郷†');
  assert.equal(名前で選ぶ(名簿, '山田太郎').人.name, '山田 太郎', '空白を除いて同じ');
  const 迷う = 名前で選ぶ(名簿, '山田');
  assert.equal(迷う.人, null);
  assert.deepEqual(
    迷う.候補.map((x) => x.name),
    ['山田 太郎', '山田 花子']
  );
  assert.equal(名前で選ぶ(名簿, '').人, null);
});

test('一人の成績：射位は区切りと計を除いた並びで見る（計が末尾でも落を数える）', () => {
  const 日 = (文, 時 = 10) => new Date(文 + 'T' + String(時).padStart(2, '0') + ':00:00').getTime();
  const 名簿 = [人('山田'), 人('佐藤'), 人('鈴木')];
  const 記録たち = [
    {
      id: 's1',
      date: 日('2026-09-13'),
      title: '9/13',
      archers: [
        { memberId: '山田', name: '山田', marks: ['○', '○', '×', '○'] },
        { memberId: '佐藤', name: '佐藤', marks: ['×', '×', '×', '×'] },
        { memberId: '鈴木', name: '鈴木', marks: ['○', '×', '○', '○'] },
        { isTotalCalculator: true, marks: [] },
      ],
    },
    {
      id: 's2',
      date: 日('2026-09-06'),
      title: '9/6',
      archers: [
        { isSeparator: true, marks: [] },
        { memberId: '鈴木', name: '鈴木', marks: ['○', '○', '○', '○'] },
        { memberId: '山田', name: '山田', marks: ['×', '○', '×', '×'] },
      ],
    },
  ];
  const 鈴木 = 一人の成績(名簿, 記録たち, '鈴木');
  assert.equal(鈴木.totalSessions, 2);
  assert.equal(鈴木.ochiHitRate, '75.0%', '9/13 は計を除いた並びの落');
  assert.equal(鈴木.omaeHitRate, '100.0%', '9/6 は区切りの次が大前（2 人なので落は数えない）');
  assert.equal(鈴木.kaichuCount, 1);
  assert.deepEqual(
    鈴木.recentSessionsDetail.map((x) => [x.date, x.position, x.marks, x.result]),
    [
      ['2026-09-13', '落', '○×○○', '3/4'],
      ['2026-09-06', '大前', '○○○○', '4/4'],
    ],
    '日付の新しい順'
  );
  const 山田 = 一人の成績(名簿, 記録たち, '山田');
  assert.equal(山田.firstShotHitRate, '50.0%');
  assert.equal(山田.totalHitRate, '50.0%');
});

test('一人の成績：名簿に無い名前は断り、記録に出ていればゲストの旨。複数当たれば聞き返す', () => {
  const 名簿 = [人('山田 太郎'), 人('山田 花子')];
  const 記録たち = [{ id: 's1', date: 1, archers: [{ name: '相手校 一郎', marks: ['○'] }] }];
  assert.match(一人の成績(名簿, 記録たち, '相手校').error, /ゲスト/);
  assert.equal(一人の成績(名簿, 記録たち, '誰も').error, '選手が見つかりませんでした。');
  const 迷う = 一人の成績(名簿, 記録たち, '山田');
  assert.match(迷う.error, /2 人います/);
  assert.deepEqual(迷う.候補, ['山田 太郎', '山田 花子']);
});

test('射位ごとの成績：名前の絞り込みは短い名前でも当たる', () => {
  const 記録たち = [
    {
      date: 1,
      archers: [
        { memberId: 'n', name: '†永井 優郷†', marks: ['○', '×'] },
        { memberId: 't', name: '津高', marks: ['○', '○'] },
      ],
    },
  ];
  const r = 射位ごとの成績([], 記録たち, { 名前たち: ['永井'] });
  assert.deepEqual(
    r.一覧.map((x) => x.名前),
    ['†永井 優郷†']
  );
});

test('一人の成績：期間を渡せばその範囲だけ（皆中も同じ範囲）', () => {
  const 日 = (文) => new Date(文 + 'T10:00:00').getTime();
  const 名簿 = [人('山田')];
  const 記録たち = [
    {
      id: 's1',
      date: 日('2026-08-30'),
      archers: [{ memberId: '山田', name: '山田', marks: ['○', '○', '○', '○'] }],
    },
    {
      id: 's2',
      date: 日('2026-09-06'),
      archers: [{ memberId: '山田', name: '山田', marks: ['×', '×', '×', '○'] }],
    },
  ];
  const 全部 = 一人の成績(名簿, 記録たち, '山田');
  assert.equal(全部.期間, '全期間');
  assert.equal(全部.totalArrows, 8);
  assert.equal(全部.kaichuCount, 1);
  const 九月 = 一人の成績(名簿, 記録たち, '山田', 期間にする('2026-09-01', '2026-09-30'));
  assert.equal(九月.期間, '指定の期間だけ');
  assert.equal(九月.totalArrows, 4);
  assert.equal(九月.totalHitRate, '25.0%');
  assert.equal(九月.kaichuCount, 0);
  assert.equal(九月.totalSessions, 1);
});
