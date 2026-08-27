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
