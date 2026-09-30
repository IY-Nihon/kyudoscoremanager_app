/**
 * 個人ログイン用に絞ったデータの検査（src/chatScope.js）。
 *
 *   npm test
 *
 * 個人の端末には団体ぜんぶの部員・記録が入っている。チャットボットの道具はそれを直に読むので、
 * AI に渡す前に絞る。ここで確かめるのは「絞ったあとの JSON に、他の人の名前・成績・個人ID が
 * 一文字も残らない」ことと、「自分の成績は絞る前と同じ数字で数えられる」こと。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 自分だけに絞る, 他の人 } = require('../src/chatScope');
const { 全員の成績, 一人の成績, 射位ごとの成績, 記録をさがす } = require('../src/chatStats');

// 山田（自分）・佐藤・鈴木・田中。名前は他の人の目印にする（絞ったあとの文字に出てはいけない）
const 山田 = {
  id: 'id-yamada',
  name: '山田',
  grade: 2,
  gender: '男子',
  termKi: 60,
  personalId: '1111',
  equipments: [{ weight: 18 }],
};
const 佐藤 = { id: 'id-sato', name: '佐藤', grade: 3, gender: '女子', termKi: 59, personalId: '2222' };
const 鈴木 = { id: 'id-suzuki', name: '鈴木', grade: 1, gender: '男子', termKi: 61, personalId: '3333' };
const 田中 = { id: 'id-tanaka', name: '田中', grade: 4, gender: '女子', termKi: 58, personalId: '4444' };
const 部員たち = [山田, 佐藤, 鈴木, 田中];

const 射手 = (o) =>
  Object.assign(
    { id: 'a', name: '', marks: [], memberId: undefined, substitutions: {}, substitutionIds: {} },
    o
  );

const 記録たち = [
  // 1. 山田・佐藤・鈴木が写った記録
  {
    id: 's1',
    date: new Date(2026, 8, 1, 10).getTime(),
    title: '9月の練習',
    note: '雨上がり',
    tags: ['練習'],
    attendance: { 'id-sato': '欠席' },
    archers: [
      射手({ id: 'a1', name: '山田', memberId: 'id-yamada', marks: ['○', '○', '×', '○'] }),
      射手({ id: 'a2', name: '佐藤', memberId: 'id-sato', marks: ['○', '×', '×', '×'] }),
      射手({ id: 'a3', name: '鈴木', memberId: 'id-suzuki', marks: ['×', '×', '○', '○'] }),
      { id: 'sep', name: '', isSeparator: true, teamName: '他大学', marks: [] },
    ],
  },
  // 2. 山田が写っていない記録（佐藤・田中だけ）
  {
    id: 's2',
    date: new Date(2026, 8, 2, 10).getTime(),
    title: '別の日',
    archers: [
      射手({ id: 'b1', name: '佐藤', memberId: 'id-sato', marks: ['○', '○', '○', '○'] }),
      射手({ id: 'b2', name: '田中', memberId: 'id-tanaka', marks: ['×', '×', '×', '×'] }),
    ],
  },
  // 3. 山田が途中で佐藤の列に交代で入った（3 射目から）。1〜2 射目は佐藤の射
  {
    id: 's3',
    date: new Date(2026, 8, 3, 10).getTime(),
    title: '交代のある日',
    archers: [
      射手({
        id: 'c1',
        name: '佐藤',
        memberId: 'id-sato',
        marks: ['○', '×', '○', '○'],
        substitutions: { 2: '山田' },
        substitutionIds: { 2: 'id-yamada' },
      }),
      射手({ id: 'c2', name: '田中', memberId: 'id-tanaka', marks: ['○', '○', '○', '×'] }),
    ],
  },
  // 4. 山田の列で、途中から鈴木に代わってもらった（3 射目から）
  {
    id: 's4',
    date: new Date(2026, 8, 4, 10).getTime(),
    title: '代わってもらった日',
    archers: [
      射手({
        id: 'd1',
        name: '山田',
        memberId: 'id-yamada',
        marks: ['×', '○', '×', '×'],
        substitutions: { 2: '鈴木' },
        substitutionIds: { 2: 'id-suzuki' },
      }),
    ],
  },
  // 5. 名前だけで割り当てた列（メンバーを選ばずに名前を入れた）
  {
    id: 's5',
    date: new Date(2026, 8, 5, 10).getTime(),
    title: '名前だけの日',
    archers: [
      射手({ id: 'e1', name: '山田', marks: ['○', '×', '○', '○'] }),
      射手({ id: 'e2', name: '田中', marks: ['○', '○', '○', '○'] }),
    ],
  },
];

const 絞る = () =>
  自分だけに絞る({ members: 部員たち, sessions: 記録たち, myMemberId: 'id-yamada', myMemberName: '山田' });

test('部員は自分ひとりだけ。個人ID・弓具など成績に要らない項目は入らない', () => {
  const { members } = 絞る();
  assert.strictEqual(members.length, 1);
  assert.strictEqual(members[0].name, '山田');
  assert.strictEqual(members[0].id, 'id-yamada');
  const 文 = JSON.stringify(members);
  assert.ok(!文.includes('1111'), '個人ID（ログインに使う 4 桁）が入っている');
  assert.ok(!文.includes('equipments'), '弓具の履歴は渡さない');
});

test('記録は自分が写っているものだけ（山田が写っていない記録は落ちる）', () => {
  const { sessions } = 絞る();
  assert.deepStrictEqual(sessions.map((s) => s.id).sort(), ['s1', 's3', 's4', 's5']);
});

test('絞ったあとの JSON に、他の人の名前・個人ID・出欠・チーム名が一文字も残らない', () => {
  const 文 = JSON.stringify(絞る());
  for (const 他 of [
    '佐藤',
    '鈴木',
    '田中',
    'id-sato',
    'id-suzuki',
    'id-tanaka',
    '2222',
    '3333',
    '4444',
    '他大学',
    '欠席',
    'attendance',
  ]) {
    assert.ok(!文.includes(他), `「${他}」が残っている`);
  }
  assert.ok(文.includes('山田'), '自分の名前は残る');
});

test('交代で入った・代わってもらった相手は「（他の人）」になり、その人の射は空になる', () => {
  const { sessions } = 絞る();
  const s3 = sessions.find((s) => s.id === 's3');
  // 佐藤の列に 3 射目から山田が入った。1〜2 射目は佐藤の射なので空、3〜4 射目が山田の射
  assert.strictEqual(s3.archers[0].name, 他の人, '元の列の持ち主（佐藤）の名前が出ている');
  assert.deepStrictEqual(s3.archers[0].marks, ['', '', '○', '○']);
  const s4 = sessions.find((s) => s.id === 's4');
  // 山田の列で 3 射目から鈴木。1〜2 射目が山田、3〜4 射目は鈴木の射なので空
  assert.strictEqual(s4.archers[0].name, '山田');
  assert.deepStrictEqual(s4.archers[0].marks, ['×', '○', '', '']);
  assert.strictEqual(s4.archers[0].substitutions[2], 他の人, '代わってもらった相手の名前が出ている');
});

test('自分の成績は、絞る前と同じ数字で数えられる（絞ったせいで数が変わらない）', () => {
  const 全部 = 一人の成績(部員たち, 記録たち, '山田', {});
  const 絞った = 一人の成績(絞る().members, 絞る().sessions, '山田', {});
  assert.deepStrictEqual(絞った, 全部);
  // 手で数える：s1 3/4、s3 2/2（3〜4 射目）、s4 1/2（1〜2 射目）→ 6/8。
  // s5（メンバーを選ばず名前だけ入れた列）は、集計が部員 ID だけで数える決まりなので、絞る前も後も入らない
  const 前 = 全員の成績(部員たち, 記録たち, { 最小射数: 1 }).一覧.find((人) => 人.名前 === '山田');
  assert.strictEqual(前.的中, 6);
  assert.strictEqual(前.射数, 8);
});

test('全員の成績は、自分ひとりだけが出る。他の人は順位にも件数にも出ない', () => {
  const { members, sessions } = 絞る();
  const 結果 = 全員の成績(members, sessions, { 最小射数: 1 });
  assert.strictEqual(結果.一覧.length, 1);
  assert.strictEqual(結果.一覧[0].名前, '山田');
  assert.strictEqual(結果.一覧[0].的中, 6);
  assert.strictEqual(結果.一覧[0].射数, 8);
  assert.strictEqual(結果.全体.射数, 8, '団体全体の数字にも他の人の射が入らない');
});

test('射位ごとの成績・記録さがしにも、他の人は出ない', () => {
  const { members, sessions } = 絞る();
  const 射位 = JSON.stringify(射位ごとの成績(members, sessions, {}));
  for (const 他 of ['佐藤', '鈴木', '田中']) assert.ok(!射位.includes(他), `射位の結果に「${他}」`);
  const 探した = JSON.stringify(記録をさがす(sessions, { 言葉: '佐藤' }));
  assert.ok(!探した.includes('佐藤'), '名前で探しても他の人の名前は返らない');
  // 探しても、他の人の名前では当たらない（自分が写っていない記録は最初から無い）
  assert.strictEqual(記録をさがす(sessions, { 言葉: '佐藤' }).見つかった件数, 0);
  assert.ok(記録をさがす(sessions, { 言葉: '山田' }).見つかった件数 >= 3);
});

test('名前だけで割り当てた列（メンバーを選んでいない）も自分の分として残る', () => {
  const { sessions } = 絞る();
  const s5 = sessions.find((s) => s.id === 's5');
  assert.strictEqual(s5.archers.length, 2, '並びを保つため、同じ記録の田中の列は空の列として残る');
  assert.deepStrictEqual(s5.archers[0].marks, ['○', '×', '○', '○']);
  assert.strictEqual(s5.archers[1].name, '');
  assert.deepStrictEqual(s5.archers[1].marks, []);
});

test('他の人の列は、名前も○×も無い空の列で残る。区切り・計の印は残し、相手校の名前は渡さない', () => {
  const { sessions } = 絞る();
  const s1 = sessions.find((s) => s.id === 's1');
  // 山田・佐藤・鈴木・区切り の 4 列。並びと列の数は絞る前と同じ
  assert.strictEqual(s1.archers.length, 4);
  assert.strictEqual(s1.archers[0].name, '山田');
  for (const 列 of s1.archers.slice(1)) {
    assert.strictEqual(列.name, '');
    assert.deepStrictEqual(列.marks, []);
    assert.strictEqual(列.memberId, undefined);
  }
  assert.strictEqual(s1.archers[3].isSeparator, true, '区切りの印は割り振りに要るので残す');
  assert.ok(!('teamName' in s1.archers[3]), '相手校の名前は渡さない');
});

// 射位（大前・落）と人数は、記録の並び（区切り・計を含む）から割り振る。他の人の列を消すと、
// 自分だけが並びの先頭になり、毎回「大前」と数えてしまう。空の列で残しているので、絞る前と同じになる
test('射位（大前・2番・落）と人数は、絞る前と同じに数えられる', () => {
  const 甲 = { id: 'id-kou', name: '甲', grade: 1, gender: '男子', termKi: 1, personalId: 'pid-kou' };
  const 乙 = { id: 'id-otsu', name: '乙', grade: 2, gender: '男子', termKi: 2, personalId: 'pid-otsu' };
  const 丙 = { id: 'id-hei', name: '丙', grade: 3, gender: '男子', termKi: 3, personalId: 'pid-hei' };
  const 丁 = { id: 'id-tei', name: '丁', grade: 4, gender: '男子', termKi: 4, personalId: 'pid-tei' };
  const 名簿 = [甲, 乙, 丙, 丁];
  const 列 = (id, 人, 印) => 射手({ id, name: 人.name, memberId: 人.id, marks: 印 });
  const 記録 = [
    // 乙は 2 番目（3 人立ち）
    {
      id: 'r1',
      date: new Date(2026, 8, 10, 10).getTime(),
      archers: [
        列('r1a', 甲, ['○', '○', '×', '○']),
        列('r1b', 乙, ['○', '×', '○', '×']),
        列('r1c', 丙, ['×', '×', '○', '○']),
      ],
    },
    // 乙は落（3 人立ちの最後）
    {
      id: 'r2',
      date: new Date(2026, 8, 11, 10).getTime(),
      archers: [
        列('r2a', 甲, ['○', '○', '○', '○']),
        列('r2b', 丙, ['×', '○', '×', '○']),
        列('r2c', 乙, ['○', '○', '×', '×']),
      ],
    },
    // 区切りのあとの 2 枚目の板。乙はそこでの大前
    {
      id: 'r3',
      date: new Date(2026, 8, 12, 10).getTime(),
      archers: [
        列('r3a', 丁, ['○', '×', '○', '×']),
        { id: 'r3t', name: '計', isTotalCalculator: true, marks: [] },
        { id: 'r3s', name: '', isSeparator: true, teamName: '相手校', marks: [] },
        列('r3b', 乙, ['○', '○', '○', '×']),
        列('r3c', 丙, ['×', '○', '×', '×']),
      ],
    },
  ];
  const 絞った = 自分だけに絞る({ members: 名簿, sessions: 記録, myMemberId: 'id-otsu', myMemberName: '乙' });

  const 前の射位 = 射位ごとの成績(名簿, 記録, { 名前たち: ['乙'], 最小射数: 1 });
  const 後の射位 = 射位ごとの成績(絞った.members, 絞った.sessions, { 名前たち: ['乙'], 最小射数: 1 });
  assert.deepStrictEqual(後の射位, 前の射位, '射位ごとの成績が、絞る前と変わっている');
  assert.strictEqual(
    後の射位.一覧[0].射位ごと.length,
    3,
    '3 つの射位（2番・落・大前）に分かれる。全部が大前になっていないか'
  );

  assert.deepStrictEqual(
    一人の成績(絞った.members, 絞った.sessions, '乙', {}),
    一人の成績(名簿, 記録, '乙', {})
  );

  // 記録さがしの人数（列の数）も、絞る前と同じ
  assert.deepStrictEqual(記録をさがす(絞った.sessions, {}), 記録をさがす(記録, {}));

  // 絞ったあとの文字に、他の人の名前は出ない
  const 文 = JSON.stringify(絞った);
  for (const 他 of ['甲', '丙', '丁', 'id-kou', 'id-hei', 'id-tei', 'pid-', '相手校']) {
    assert.ok(!文.includes(他), `「${他}」が残っている`);
  }
});

test('自分が誰か分からない・データが無いときは、空を返す（団体ぜんぶを渡さない）', () => {
  assert.deepStrictEqual(自分だけに絞る({ members: 部員たち, sessions: 記録たち }), {
    members: [],
    sessions: [],
  });
  assert.deepStrictEqual(自分だけに絞る({}), { members: [], sessions: [] });
  assert.deepStrictEqual(自分だけに絞る(), { members: [], sessions: [] });
  const 空 = 自分だけに絞る({ members: [], sessions: [], myMemberId: 'id-yamada', myMemberName: '山田' });
  assert.strictEqual(空.members.length, 1, '名簿に居なくても自分の名前だけの部員にする');
  assert.strictEqual(空.sessions.length, 0);
});

test('元のデータは書き換えない（画面の表示に影響しない）', () => {
  const 前 = JSON.stringify({ 部員たち, 記録たち });
  絞る();
  assert.strictEqual(JSON.stringify({ 部員たち, 記録たち }), 前);
});
