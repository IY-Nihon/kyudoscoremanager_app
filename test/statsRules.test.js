/**
 * 「その1射は誰のものか」の決まり（src/statsRules.js）。
 *
 * 以前は分析の順位・グラフ・矢所・チャットボットで判定が4通りに分かれ、
 * 同じ人の数字が食い違っていた。ここに寄せた決まりを見張る。
 */
const test = require('node:test');
const assert = require('node:assert');
const {
  その射の部員id,
  その人の射か,
  引いた射か,
  集計に入れるか,
  成績を数える: 集計,
} = require('../src/statsRules');

test('交代が無ければ、ぜんぶ元の射手のもの', () => {
  const 射手 = { memberId: 'm1', marks: ['○', '×', '○', '×'] };
  for (let i = 0; i < 4; i++) assert.strictEqual(その射の部員id(射手, i), 'm1');
});

test('交代した位置から後ろだけ、相手のものになる', () => {
  // 5射目（添字4）から m9 に交代
  const 射手 = { memberId: 'm1', substitutions: { 4: '交代太郎' }, substitutionIds: { 4: 'm9' } };
  assert.strictEqual(その射の部員id(射手, 3), 'm1', '交代の前は元の人');
  assert.strictEqual(その射の部員id(射手, 4), 'm9', '交代の位置から相手');
  assert.strictEqual(その射の部員id(射手, 7), 'm9');
});

test('交代が何回もあると、その射に近いほうが効く', () => {
  const 射手 = { memberId: 'm1', substitutionIds: { 2: 'm9', 5: 'm7' } };
  assert.strictEqual(その射の部員id(射手, 1), 'm1');
  assert.strictEqual(その射の部員id(射手, 2), 'm9');
  assert.strictEqual(その射の部員id(射手, 4), 'm9');
  assert.strictEqual(その射の部員id(射手, 5), 'm7');
});

test('ゲストに交代したら、そこから先は誰のものでもない', () => {
  // ゲストは substitutions に名前だけ入り、substitutionIds には入らない
  const 射手 = { memberId: 'm1', substitutions: { 4: 'ゲスト花子' }, substitutionIds: {} };
  assert.strictEqual(その射の部員id(射手, 3), 'm1');
  assert.strictEqual(その射の部員id(射手, 4), undefined, 'ゲストの射が元の人に付いている');
  assert.strictEqual(その人の射か(射手, 4, 'm1'), false);
});

test('氏名では拾わない', () => {
  // 名簿から選ばずに氏名だけで入れた射手。同姓同名や異体字での取り違えを避ける
  const 射手 = { name: '山田太郎', marks: ['○'] };
  assert.strictEqual(その射の部員id(射手, 0), undefined);
  assert.strictEqual(その人の射か(射手, 0, 'm1'), false);
});

test('idが数字と文字で食い違っていても、同じ人として数える', () => {
  const 射手 = { memberId: 1, substitutionIds: { 2: 9 } };
  assert.strictEqual(その人の射か(射手, 0, '1'), true);
  assert.strictEqual(その人の射か(射手, 2, '9'), true);
});

test('中身が欠けていても落ちない', () => {
  assert.strictEqual(その射の部員id(null, 0), undefined);
  assert.strictEqual(その射の部員id({}, 0), undefined);
  assert.strictEqual(その射の部員id({ memberId: '' }, 0), undefined);
  assert.strictEqual(その人の射か({ memberId: 'm1' }, 0, null), false);
  assert.strictEqual(その人の射か({ memberId: 'm1' }, 0, ''), false);
});

test('○ と × だけを数える', () => {
  assert.strictEqual(引いた射か('○'), true);
  assert.strictEqual(引いた射か('×'), true);
  assert.strictEqual(引いた射か(''), false);
  assert.strictEqual(引いた射か(undefined), false);
  assert.strictEqual(引いた射か('△'), false);
});

test('集計に入れるかは、false のときだけ外す', () => {
  assert.strictEqual(集計に入れるか({ includeInStats: true }), true);
  assert.strictEqual(集計に入れるか({ includeInStats: false }), false);
  // 古い記録にはこの項目が無い。外すと黙って分析から消え、Excel とも食い違う
  assert.strictEqual(集計に入れるか({}), true, '未設定は含める');
  assert.strictEqual(集計に入れるか({ includeInStats: undefined }), true);
  assert.strictEqual(集計に入れるか(null), false);
});

// ── 成績を数える ──────────────────────────────────

const 記 = (archers) => ({ date: 1, includeInStats: true, archers });

test('成績を数える：的中・射数・率を数える', () => {
  const r = 集計(
    [記([{ memberId: 'm1', marks: ['○', '×', '○', '×'] }])],
    'm1'
  );
  assert.strictEqual(r.shots, 4);
  assert.strictEqual(r.hits, 2);
  assert.strictEqual(r.rate, 50);
});

test('成績を数える：一射も無ければ 0 で、率も 0（0除算しない）', () => {
  const r = 集計([記([{ memberId: 'm9', marks: ['○'] }])], 'm1');
  assert.strictEqual(r.shots, 0);
  assert.strictEqual(r.rate, 0);
});

test('成績を数える：立ち順別は4射ずつの位置で分ける', () => {
  // 8射。1射目と5射目が同じ「1射目」に入る
  const r = 集計(
    [記([{ memberId: 'm1', marks: ['○', '×', '×', '×', '○', '×', '×', '×'] }])],
    'm1'
  );
  assert.deepStrictEqual(
    r.perShotStats.map((x) => x.shots),
    [2, 2, 2, 2]
  );
  assert.strictEqual(r.perShotStats[0].hits, 2, '1射目は2本とも中り');
  assert.strictEqual(r.perShotStats[1].hits, 0);
  // 立ち順別の合計は、総射数と一致する
  assert.strictEqual(
    r.perShotStats.reduce((a, x) => a + x.shots, 0),
    r.shots
  );
});

test('成績を数える：結果分布は4射そろった立ちだけ数える', () => {
  const r = 集計(
    [
      記([
        // 皆中 / 羽分 / 途中までしか入っていない立ち
        { memberId: 'm1', marks: ['○', '○', '○', '○', '○', '○', '×', '×', '○', '', '', ''] },
      ]),
    ],
    'm1'
  );
  assert.strictEqual(r.patterns.kaichu, 1);
  assert.strictEqual(r.patterns.hake, 1);
  const 立ち合計 = Object.values(r.patterns).reduce((a, b) => a + b, 0);
  assert.strictEqual(立ち合計, 2, '埋まっていない立ちを数えている');
});

test('成績を数える：立ちの途中で交代したら、どちらの分布にも数えない', () => {
  // 3射目（添字2）から m9 に交代。1立目は2人にまたがる
  const r1 = 集計(
    [記([{ memberId: 'm1', marks: ['○', '○', '○', '○'], substitutionIds: { 2: 'm9' } }])],
    'm1'
  );
  const r2 = 集計(
    [記([{ memberId: 'm1', marks: ['○', '○', '○', '○'], substitutionIds: { 2: 'm9' } }])],
    'm9'
  );
  assert.strictEqual(r1.shots, 2, '交代前の2射だけ');
  assert.strictEqual(r2.shots, 2, '交代後の2射だけ');
  assert.strictEqual(Object.values(r1.patterns).reduce((a, b) => a + b, 0), 0, 'またぐ立ちを数えている');
  assert.strictEqual(Object.values(r2.patterns).reduce((a, b) => a + b, 0), 0, 'またぐ立ちを数えている');
});

test('成績を数える：区切りと計の列は数えない（部員IDを持たない）', () => {
  const r = 集計(
    [
      記([
        { memberId: 'm1', marks: ['○', '○'] },
        { name: '', isSeparator: true, marks: ['○', '○'] },
        { name: '計', isTotalCalculator: true, marks: ['○', '○'] },
      ]),
    ],
    'm1'
  );
  assert.strictEqual(r.shots, 2);
});

test('成績を数える：中身が欠けていても落ちない', () => {
  assert.strictEqual(集計(null, 'm1').shots, 0);
  assert.strictEqual(集計([null, {}, { archers: null }], 'm1').shots, 0);
});

// ── 射手を区間に分ける ────────────────────────────

const 分ける = require('../src/statsRules').射手を区間に分ける;

test('区間：交代が無ければ1区間', () => {
  const r = 分ける({ memberId: 'm1', name: '山田', marks: ['○', '×', '○', '×'] });
  assert.strictEqual(r.length, 1);
  assert.deepStrictEqual(
    { 部員id: r[0].部員id, 的中: r[0].的中, 射数: r[0].射数, 開始: r[0].開始 },
    { 部員id: 'm1', 的中: 2, 射数: 4, 開始: 0 }
  );
});

test('区間：交代したら人ごとに分かれる', () => {
  const r = 分ける({
    memberId: 'm1',
    name: '山田',
    marks: ['○', '○', '×', '×'],
    substitutions: { 2: '田中' },
    substitutionIds: { 2: 'm9' },
  });
  assert.strictEqual(r.length, 2);
  assert.deepStrictEqual(
    r.map((x) => [x.部員id, x.名前, x.的中, x.射数]),
    [
      ['m1', '山田', 2, 2],
      ['m9', '田中', 0, 2],
    ]
  );
});

test('区間：ゲストに交代しても、その人の区間として分ける', () => {
  const r = 分ける({
    memberId: 'm1',
    name: '山田',
    marks: ['○', '○'],
    substitutions: { 1: 'ゲスト花子' },
    substitutionIds: {},
  });
  assert.deepStrictEqual(
    r.map((x) => [x.部員id, x.名前, x.射数]),
    [
      ['m1', '山田', 1],
      [undefined, 'ゲスト花子', 1],
    ]
  );
});

test('区間：空欄しか無ければ、区間を作らない', () => {
  assert.deepStrictEqual(分ける({ memberId: 'm1', marks: ['', '', ''] }), []);
  assert.deepStrictEqual(分ける({ memberId: 'm1' }), []);
  assert.deepStrictEqual(分ける(null), []);
});

test('区間の射数の合計は、○×の数と一致する', () => {
  const 射手 = {
    memberId: 'm1',
    name: '山田',
    marks: ['○', '×', '', '○', '×', '○'],
    substitutions: { 3: '田中' },
    substitutionIds: { 3: 'm9' },
  };
  const 合計 = 分ける(射手).reduce((a, x) => a + x.射数, 0);
  assert.strictEqual(合計, 射手.marks.filter((m) => m === '○' || m === '×').length);
});

test('成績を数える：4射に満たない末尾は、結果分布に数えず別に数える', () => {
  // 6射。1立目（4射）は数え、残る2射は分類できないので数えない
  const r = 集計([記([{ memberId: 'm1', marks: ['○', '○', '×', '×', '○', '○'] }])], 'm1');
  assert.strictEqual(r.shots, 6, '的中率の分母には入る');
  assert.strictEqual(Object.values(r.patterns).reduce((a, b) => a + b, 0), 1, '完全な立ちだけ');
  assert.strictEqual(r.patterns.hake, 1);
  assert.strictEqual(r.端数の射, 2, '断り書きを出すために数えておく');
});

test('成績を数える：4の倍数なら端数は出ない', () => {
  const r = 集計([記([{ memberId: 'm1', marks: ['○', '○', '×', '×', '○', '○', '×', '×'] }])], 'm1');
  assert.strictEqual(r.端数の射, 0);
  assert.strictEqual(Object.values(r.patterns).reduce((a, b) => a + b, 0), 2);
});

test('成績を数える：端数が他人の射なら数えない', () => {
  const r = 集計(
    [記([{ memberId: 'm1', marks: ['○', '○', '×', '×', '○', '○'], substitutionIds: { 4: 'm9' } }])],
    'm1'
  );
  assert.strictEqual(r.端数の射, 0, '交代後の端数を自分のぶんに数えている');
});

// ── 的中の型（どの位置で中った／抜いたか）─────────────────
// 「三中のうち留矢で抜きがち」「一中のうち初矢だけ中っている」を見るためのもの。
// 結果分布（patterns）が中り数までしか見ないので、その中の位置を数える。

const { 型を並べる, 矢の名前, 立ちの呼び名 } = require('../src/statsRules');

/** 4文字の型を並べて、1人ぶんの記録にする */
const 型で記録 = (型たち) => ({
  archers: [{ memberId: 'm1', marks: 型たち.flatMap((x) => x.split('')) }],
});

test('型は、そろった立ちの印をそのまま鍵にして数える', () => {
  const r = 集計([型で記録(['○○○×', '○○○×', '×○○○'])], 'm1');
  assert.deepStrictEqual(r.型, { '○○○×': 2, '×○○○': 1 });
});

test('型の合計は、結果分布と必ず一致する', () => {
  const r = 集計([型で記録(['○○○○', '○○○×', '×○○○', '○×○×', '○×××', '××××'])], 'm1');
  const 型の合計 = Object.values(r.型).reduce((a, b) => a + b, 0);
  const 分布の合計 = Object.values(r.patterns).reduce((a, b) => a + b, 0);
  assert.strictEqual(型の合計, 分布の合計, '同じ立ちを数えているのに合わない');
});

test('4射そろわない末尾は、型に数えない', () => {
  // 6射＝1立と半端2射。半端は分類できない
  const r = 集計([型で記録(['○○○×']).archers[0].marks.concat(['○', '○'])].map((marks) => ({
    archers: [{ memberId: 'm1', marks }],
  })), 'm1');
  assert.deepStrictEqual(r.型, { '○○○×': 1 }, '半端が型に混ざっている');
  assert.strictEqual(r.端数の射, 2);
});

test('立ちの途中で交代していたら、どちらの型にも数えない', () => {
  const 記録 = {
    archers: [
      { memberId: 'm1', marks: ['○', '○', '○', '×'], substitutions: { 2: '交代太郎' }, substitutionIds: { 2: 'm9' } },
    ],
  };
  assert.deepStrictEqual(集計([記録], 'm1').型, {}, '交代をまたいだ立ちを数えている');
  assert.deepStrictEqual(集計([記録], 'm9').型, {}, '交代をまたいだ立ちを数えている');
});

test('割合は「同じ中り数の中で」出す（皆中と混ぜない）', () => {
  // 三中が4回、皆中が1回。三中の 3:1 は 75% と 25% になる
  const r = 集計([型で記録(['○○○○', '○○○×', '○○○×', '○○○×', '×○○○'])], 'm1');
  const 並び = 型を並べる(r.型);
  const 留め = 並び.find((x) => x.型 === '○○○×');
  const 初 = 並び.find((x) => x.型 === '×○○○');
  assert.strictEqual(Math.round(留め.割合), 75);
  assert.strictEqual(Math.round(初.割合), 25);
  assert.strictEqual(Math.round(並び.find((x) => x.型 === '○○○○').割合), 100, '皆中は皆中だけで100%');
});

test('要点は、短いほうの側を言う', () => {
  const 並び = 型を並べる({ '○○○×': 1, '○×××': 1, '○×○×': 1, '○○○○': 1, '××××': 1 });
  const 引く = (型) => 並び.find((x) => x.型 === 型).要点;
  assert.strictEqual(引く('○○○×'), '留矢を抜いた', '三中は抜いた矢を言う');
  assert.strictEqual(引く('○×××'), '初矢だけ中った', '一中は中った矢を言う');
  assert.strictEqual(引く('○×○×'), '2本目・留矢を抜いた');
  assert.strictEqual(引く('○○○○'), null, '皆中は型が1通りなので要点を出さない');
  assert.strictEqual(引く('××××'), null, '残念も同じ');
});

test('並びは多い順。同数なら型の文字で決めて、数え直しても入れ替わらない', () => {
  const 一度目 = 型を並べる({ '×○○○': 2, '○○×○': 2, '○○○×': 5 }).map((x) => x.型);
  const 二度目 = 型を並べる({ '○○×○': 2, '○○○×': 5, '×○○○': 2 }).map((x) => x.型);
  assert.deepStrictEqual(一度目, 二度目, '鍵の順番で並びが変わっている');
  assert.strictEqual(一度目[0], '○○○×', '多いものが先頭に来ていない');
});

test('矢の名前と呼び名は、画面が期待する並び', () => {
  // 甲矢・乙矢は一手ごとに繰り返して4つの位置を区別できないので、
  // 名前のある両端だけ弓道の言い方にして、中は番号で補っている。
  // 「二の矢」「三の矢」は弓道の言葉ではない（一度そう書いて直した）
  assert.deepStrictEqual(矢の名前, ['初矢', '2本目', '3本目', '留矢']);
  assert.ok(!矢の名前.includes('二の矢'), '造語が戻っている');
  assert.deepStrictEqual([4, 3, 2, 1, 0].map(立ちの呼び名), ['皆中', '三中', '羽分', '一中', '残念']);
});
