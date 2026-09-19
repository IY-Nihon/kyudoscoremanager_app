/**
 * 出欠の自動判定の決まり（src/attendanceRules.js）。
 *
 * 直した不具合：途中交代で入った人が欠席にされていた。
 * 交代で入った人は archer.memberId には出てこず、substitutionIds にだけ出てくる。
 */
const test = require('node:test');
const assert = require('node:assert');
const { 射に出ているか, 出ていた部員たち } = require('../src/attendanceRules');

test('射手そのものとして立っていれば、出ている', () => {
  const 射手 = { id: 'a1', memberId: 'm1', substitutionIds: {} };
  assert.strictEqual(射に出ているか(射手, 'm1'), true);
});

test('立っていない人は、出ていない', () => {
  const 射手 = { id: 'a1', memberId: 'm1', substitutionIds: {} };
  assert.strictEqual(射に出ているか(射手, 'm2'), false);
});

test('途中交代で入った人も、出ていると数える', () => {
  // 2立目から m9 に代わった
  const 射手 = { id: 'a1', memberId: 'm1', substitutions: { 1: '交代 太郎' }, substitutionIds: { 1: 'm9' } };
  assert.strictEqual(射に出ているか(射手, 'm9'), true, '交代で入った人が欠席にされている');
  assert.strictEqual(射に出ているか(射手, 'm1'), true, '交代で抜けた人も、前半は引いている');
});

test('交代が何回もあっても、それぞれ数える', () => {
  const 射手 = { id: 'a1', memberId: 'm1', substitutionIds: { 1: 'm9', 2: 'm7' } };
  for (const id of ['m1', 'm9', 'm7']) {
    assert.strictEqual(射に出ているか(射手, id), true, id + ' が数えられていない');
  }
  assert.strictEqual(射に出ているか(射手, 'm5'), false);
});

test('ゲストの交代（部員IDなし）は数えない', () => {
  // ゲストは substitutions に名前だけ入り、substitutionIds には入らない
  const 射手 = { id: 'a1', memberId: 'm1', substitutions: { 1: 'ゲスト 花子' }, substitutionIds: {} };
  assert.strictEqual(射に出ているか(射手, 'm9'), false);
});

test('id が数字と文字で食い違っていても、同じ人として数える', () => {
  const 射手 = { id: 'a1', memberId: 1, substitutionIds: { 1: 9 } };
  assert.strictEqual(射に出ているか(射手, '1'), true);
  assert.strictEqual(射に出ているか(射手, '9'), true);
});

test('中身が欠けていても落ちない', () => {
  assert.strictEqual(射に出ているか(null, 'm1'), false);
  assert.strictEqual(射に出ているか({ memberId: 'm1' }, null), false);
  assert.strictEqual(射に出ているか({ memberId: 'm1' }, ''), false);
  assert.strictEqual(射に出ているか({}, 'm1'), false);
  assert.strictEqual(射に出ているか({ memberId: 'm1', substitutionIds: null }, 'm1'), true);
});

test('出ていた部員たちは、交代も含めて重なりなく返す', () => {
  const 射手たち = [
    { memberId: 'm1', substitutionIds: { 1: 'm9' } },
    { memberId: 'm2', substitutionIds: {} },
    { memberId: 'm9', substitutionIds: {} }, // 別の的にも立っている
    null,
    { memberId: '', substitutionIds: { 0: '' } },
  ];
  assert.deepStrictEqual(出ていた部員たち(射手たち), ['m1', 'm9', 'm2']);
});

test('出ていた部員たちは、中身が無くても落ちない', () => {
  assert.deepStrictEqual(出ていた部員たち(null), []);
  assert.deepStrictEqual(出ていた部員たち([]), []);
});

// ── 出欠画面と同じ数え方（AI チャットの出欠の集計もこれを使う。2026-09-20） ──
const { 日付の文字, その日の出欠, 練習日で数える } = require('../src/attendanceRules');
const 日 = (文) => new Date(文 + 'T10:00:00').getTime();

test('日付の文字：数・文字列・Timestamp 風のどれでも YYYY-MM-DD にし、読めなければ null', () => {
  assert.strictEqual(日付の文字(日('2026-09-06')), '2026-09-06');
  assert.strictEqual(日付の文字('2026-09-06T10:00:00'), '2026-09-06');
  assert.strictEqual(日付の文字({ seconds: Math.floor(日('2026-09-06') / 1000) }), '2026-09-06');
  assert.strictEqual(日付の文字({ toDate: () => new Date(日('2026-09-06')) }), '2026-09-06');
  assert.strictEqual(日付の文字('でたらめ'), null);
  assert.strictEqual(日付の文字(null), null);
});

test('その日の出欠：記録に出ていれば出席、印だけなら印、記録の無い練習日は現役だけ欠席、未来は無し', () => {
  const 練習日 = { '2026-09-06': {}, '2026-09-13': {}, '2026-09-27': {} };
  const 記録たち = [
    { date: 日('2026-09-06'), archers: [{ memberId: 'a' }], attendance: { b: 'late' } },
    { date: 日('2026-09-13'), archers: [], attendance: { a: 'absent', b: 'early' } },
  ];
  const 今日 = '2026-09-20';
  const 現役 = { id: 'a', grade: 2 };
  const 卒業 = { id: 'c', grade: 5 };
  assert.strictEqual(
    その日の出欠(記録たち, 練習日, 現役, '2026-09-06', 今日),
    'present',
    '射手として出ている'
  );
  assert.strictEqual(
    その日の出欠(記録たち, 練習日, { id: 'b', grade: 1 }, '2026-09-06', 今日),
    'late',
    '印だけ'
  );
  assert.strictEqual(その日の出欠(記録たち, 練習日, 現役, '2026-09-13', 今日), 'absent', '印が欠席');
  assert.strictEqual(
    その日の出欠(記録たち, 練習日, 卒業, '2026-09-13', 今日),
    'none',
    '記録はあるが印の無い卒業生は無し'
  );
  assert.strictEqual(その日の出欠(記録たち, 練習日, 現役, '2026-09-27', 今日), 'none', '未来の練習日');
  assert.strictEqual(
    その日の出欠(記録たち, 練習日, 現役, '2026-09-10', 今日),
    'none',
    '練習日でも記録でもない日'
  );
  assert.strictEqual(
    その日の出欠(記録たち, { ...練習日, '2026-09-08': {} }, 現役, '2026-09-08', 今日),
    'absent',
    '記録の無い練習日'
  );
});

test('練習日で数える：来た回数と出席率は出欠画面と同じ（分母は今日までの練習日数）', () => {
  // 9 月の練習日 4 日（うち 1 日は未来）。a は 2 日出て 1 日休み、b は 1 日だけ
  const 練習日 = { '2026-09-06': {}, '2026-09-13': {}, '2026-09-17': {}, '2026-09-27': {} };
  const 記録たち = [
    { date: 日('2026-09-06'), archers: [{ memberId: 'a' }, { memberId: 'b' }] },
    { date: 日('2026-09-13'), archers: [{ memberId: 'a' }] },
    // 練習日でない日の記録は数えない
    { date: 日('2026-09-10'), archers: [{ memberId: 'b' }] },
  ];
  const 出 = 練習日で数える(
    [
      { id: 'a', grade: 1, name: 'A' },
      { id: 'b', grade: 2, name: 'B' },
      { id: 'c', grade: 5, name: 'C' },
    ],
    記録たち,
    練習日,
    { 今日: '2026-09-20' }
  );
  assert.deepStrictEqual(
    出.map((x) => [x.部員.name, x.来た回数, x.欠席, x.練習日数, Math.round(x.出席率)]),
    [
      ['A', 2, 1, 3, 67],
      ['B', 1, 2, 3, 33],
      // 卒業生は、記録のある日に印が無ければ「無し」、記録そのものが無い練習日だけ「欠席」。分母は来た＋欠席
      ['C', 0, 1, 1, 0],
    ]
  );
});

test('練習日で数える：始め・終わりで練習日を絞れる', () => {
  const 練習日 = { '2026-08-30': {}, '2026-09-06': {}, '2026-10-04': {} };
  const 記録たち = [{ date: 日('2026-09-06'), archers: [{ memberId: 'a' }] }];
  const 出 = 練習日で数える([{ id: 'a', grade: 1 }], 記録たち, 練習日, {
    始め: '2026-09-01',
    終わり: '2026-09-30',
    今日: '2026-10-10',
  });
  assert.strictEqual(出[0].練習日数, 1);
  assert.strictEqual(出[0].来た回数, 1);
});
