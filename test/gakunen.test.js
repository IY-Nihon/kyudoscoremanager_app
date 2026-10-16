/**
 * 学年の決まり（src/gakunen.js）。大学 4 年制の動きを集める前と同じに保ち、ほかの種類と在籍を足す。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const 学 = require('../src/gakunen.js');

const 人 = (grade, o) => Object.assign({ grade }, o);
const 高専 = 学.決まりを作る('kosen5');
const 高校 = 学.決まりを作る('school3');

test('卒業生か：在籍が卒業の人。前の形（学年 5・卒業生の印）も卒業生と読む', () => {
  assert.strictEqual(学.卒業生か(人(4, { enrollment: '卒業' })), true);
  assert.strictEqual(学.卒業生か(人(5)), true, '前の形の学年 5');
  assert.strictEqual(学.卒業生か(人('5')), true, '文字の 5 も');
  assert.strictEqual(学.卒業生か(人(4)), false);
  assert.strictEqual(学.卒業生か(人(0)), false, 'その他は現役');
  assert.strictEqual(学.卒業生か(人(undefined)), false, '値が無いのはその他');
  assert.strictEqual(学.卒業生か(人(2, { isAlumni: true })), true);
  assert.strictEqual(学.卒業生か(人(2, { graduationYear: 2025 })), true);
  assert.strictEqual(学.卒業生か(人(2, { graduationYear: null })), false, '本番の null は印ではない');
  assert.strictEqual(学.卒業生か(null), false);
});

test('高専・6 年制では学年 5 は在籍の学年（卒業生ではない）', () => {
  assert.strictEqual(学.卒業生か(人(5), 高専), false);
  assert.strictEqual(学.現役か(人(5), 高専), true);
  assert.strictEqual(学.学年の名前(人(5), 高専), '5年');
  assert.strictEqual(学.卒業生か(人(5, { enrollment: '卒業' }), 高専), true);
});

test('現役か・その他か・退部', () => {
  assert.strictEqual(学.現役か(人(1)), true);
  assert.strictEqual(学.現役か(人(0)), true);
  assert.strictEqual(学.現役か(人(5)), false);
  assert.strictEqual(学.現役か(人(2, { enrollment: '退部' })), false);
  assert.strictEqual(学.退部した人か(人(2, { enrollment: '退部' })), true);
  assert.strictEqual(学.現役か(人(2, { enrollment: '在籍' })), true);
  assert.strictEqual(学.その他か(人(0)), true);
  assert.strictEqual(学.その他か(人(null)), true);
  assert.strictEqual(学.その他か(人(3)), false);
  assert.strictEqual(学.その他か(人(5)), false, '卒業生はその他ではない');
  assert.strictEqual(学.その他か(人(4), 高校), true, '種類の学年に無い値はその他');
  assert.strictEqual(
    学.現役か(人(5, { enrollment: '在籍' })),
    true,
    '在籍に戻した人は前の形の印より在籍が正'
  );
  assert.strictEqual(学.現役か(人(2, { enrollment: '在籍', graduationYear: 2025 })), true);
});

test('学年の名前', () => {
  assert.strictEqual(学.学年の名前(人(3)), '3年');
  assert.strictEqual(学.学年の名前(人(3), null, { 生: true }), '3年生');
  assert.strictEqual(学.学年の名前(人(0)), 'その他');
  assert.strictEqual(学.学年の名前(人(0), null, { その他: 'その他/ゲスト' }), 'その他/ゲスト');
  assert.strictEqual(学.学年の名前(人(5)), '卒業生');
  assert.strictEqual(学.学年の名前(人(4, { enrollment: '卒業' })), '卒業生');
  assert.strictEqual(学.学年の名前(人(2, { enrollment: '退部' })), '退部');
  assert.strictEqual(学.学年の値の名前('5'), '卒業生');
  assert.deepStrictEqual(学.学年の名前たち(), ['1年', '2年', '3年', '4年']);
  assert.deepStrictEqual(学.学年の名前たち(高専), ['1年', '2年', '3年', '4年', '5年']);
  assert.strictEqual(学.種類の説明('univ6'), '6年制の大学（1年〜6年）');
  assert.strictEqual(学.種類の説明(高校), '中学・高校（1年〜3年）');
});

test('学年の順：若い学年から、その他、卒業生、退部の順', () => {
  const 並び = [人(5), 人(2, { enrollment: '退部' }), 人(0), 人(3), 人(undefined), 人(1)].sort(
    (甲, 乙) => 学.学年の順(甲) - 学.学年の順(乙)
  );
  assert.deepStrictEqual(
    並び.map((x) => (x.enrollment ? x.enrollment : x.grade)),
    [1, 3, 0, undefined, 5, '退部']
  );
});

test('進級の変更：1 つ上がり、最後の学年は卒業。上げない人・その他・卒業生・退部はそのまま', () => {
  assert.deepStrictEqual(学.進級の変更(人(1), false, 2026), { grade: 2 });
  assert.deepStrictEqual(学.進級の変更(人('3'), false, 2026), { grade: 4 });
  assert.deepStrictEqual(学.進級の変更(人(4), false, 2026), { enrollment: '卒業', leftYear: 2026 });
  assert.deepStrictEqual(学.進級の変更(人(4), false, 2026, 高専), { grade: 5 }, '高専の 4 年は 5 年へ');
  assert.deepStrictEqual(学.進級の変更(人(5), false, 2026, 高専), { enrollment: '卒業', leftYear: 2026 });
  assert.deepStrictEqual(学.進級の変更(人(3), false, 2026, 高校), { enrollment: '卒業', leftYear: 2026 });
  assert.strictEqual(学.進級の変更(人(3), true, 2026), null, '上げない');
  assert.strictEqual(学.進級の変更(人(4), true, 2026), null, '卒業しない');
  assert.strictEqual(学.進級の変更(人(0), false, 2026), null);
  assert.strictEqual(学.進級の変更(人(undefined), false, 2026), null);
  assert.strictEqual(学.進級の変更(人(5), false, 2026), null, '前の形の卒業生');
  assert.strictEqual(学.進級の変更(人(2, { enrollment: '退部' }), false, 2026), null);
  assert.strictEqual(学.最後の学年か(人(4)), true);
  assert.strictEqual(学.最後の学年か(人(4), 高専), false);
  assert.strictEqual(学.最後の学年か(人(0)), false);
});

test('学年の無い団体（社会人の会・道場）：全員が会員。進級も期も無い。呼び方が変わる', () => {
  const 会 = 学.決まりを作る('club');
  assert.strictEqual(会.学年なし, true);
  assert.deepStrictEqual(学.学年の名前たち(会), []);
  assert.strictEqual(学.種類の説明('club'), '社会人の会・道場（学年なし）');
  assert.strictEqual(学.学年の幅の名前('univ4'), '1年〜4年');
  assert.strictEqual(学.学年の名前(人(3), 会), '会員', '前に学校だった団体の学年は出さない');
  assert.strictEqual(学.学年の名前(人(0), 会), '会員');
  assert.strictEqual(学.学年の名前(人(2, { enrollment: '退部' }), 会), '退会');
  assert.strictEqual(学.学年の名前(人(2, { enrollment: '退部' })), '退部', '学校の部では退部');
  assert.strictEqual(学.現役か(人(3), 会), true);
  assert.strictEqual(学.その他か(人(3), 会), true);
  assert.strictEqual(学.進級の変更(人(3), false, 2026, 会), null);
  assert.strictEqual(学.最後の学年か(人(3), 会), false);
  assert.strictEqual(学.期を付ける学年か(1, 会), false);
  assert.strictEqual(学.性別の名前('男子', 会), '男性');
  assert.strictEqual(学.性別の名前('女子', 会), '女性');
  assert.strictEqual(学.性別の名前('男子'), '男子');
  assert.strictEqual(学.性別の名前(undefined, 会), '未設定');
  assert.deepStrictEqual(学.在籍の選び(会), ['在籍', '退部']);
  assert.deepStrictEqual(学.在籍の選び(), ['在籍', '卒業', '退部']);
  assert.strictEqual(学.在籍の名前('退部', 会), '退会');
  assert.strictEqual(学.在籍の名前('卒業', 会), '卒業');
  assert.strictEqual(学.呼び方(会).部員, '会員');
  assert.strictEqual(学.呼び方().部員, '部員');
});

test('選ぶ組：学校の部は学年ごと（その他/ゲストは後ろ）。学年の無い団体は区分ごと', () => {
  const 人たち = [人(2, { id: 'a' }), 人(0, { id: 'b' }), 人(1, { id: 'c' }), 人(2, { id: 'd' })];
  assert.deepStrictEqual(
    学.選ぶ組(人たち).map((組) => [組.鍵, 組.題, 組.人たち.map((x) => x.id)]),
    [
      ['1', '1年生', ['c']],
      ['2', '2年生', ['a', 'd']],
      ['0', 'その他/ゲスト', ['b']],
    ]
  );
  const 会 = 学.決まりを作る('club');
  assert.deepStrictEqual(
    学.選ぶ組(人たち, 会, []).map((組) => [組.鍵, 組.題, 組.人たち.length]),
    [['全員', '会員', 4]],
    '区分が無ければ全員を 1 組'
  );
  const 区分 = [{ id: 'k1', name: '一般' }];
  const 区分つき = [人(0, { id: 'e', divisionIds: ['k1'] }), 人(0, { id: 'f' })];
  assert.deepStrictEqual(
    学.選ぶ組(区分つき, 会, 区分).map((組) => [組.鍵, 組.題, 組.人たち.map((x) => x.id)]),
    [
      ['k1', '一般', ['e']],
      ['なし', '区分なし', ['f']],
    ]
  );
  assert.deepStrictEqual(学.選ぶ組([], 会, []), []);
  assert.deepStrictEqual(
    学.選ぶ組([人(5, { id: 'g' })], 学.決まりを作る('kosen5')).map((組) => 組.題),
    ['5年生'],
    '高専の 5 年生'
  );
});

test('人の説明：期は使う団体だけ。学年の無い団体は入会した年と男性・女性', () => {
  const 区分たち = [{ id: 'k1', name: '一般' }];
  const 太郎 = 人(3, { termKi: 52, gender: '男子', divisionIds: ['k1'] });
  assert.strictEqual(学.人の説明(太郎, null, { 期を使う: true, 区分たち }), '52期 / 男子 / 3年 / 一般');
  assert.strictEqual(学.人の説明(太郎, null, { 区分たち }), '男子 / 3年 / 一般', '期を使わない団体');
  assert.strictEqual(学.人の説明(太郎), '男子 / 3年');
  const 会 = 学.決まりを作る('club');
  assert.strictEqual(
    学.人の説明(Object.assign({}, 太郎, { joinedYear: 2019 }), 会, { 期を使う: true, 区分たち }),
    '2019年入会 / 男性 / 一般',
    '学年の無い団体には期も学年も出さない'
  );
  assert.strictEqual(学.人の説明(人(0, { gender: '女子', enrollment: '退部' }), 会), '女性 / 退会');
  assert.strictEqual(学.人の説明(null), '');
});

test('今の決まりを置くと、省いたときの決まりが変わる', () => {
  try {
    学.決まりを置く('kosen5');
    assert.strictEqual(学.現役か(人(5)), true);
    assert.deepStrictEqual(学.学年の名前たち(), ['1年', '2年', '3年', '4年', '5年']);
    学.決まりを置く('知らない種類');
    assert.strictEqual(学.今の決まりを見る().種類, 'univ4', '知らない種類は大学');
  } finally {
    学.決まりを置く(学.既定の種類);
  }
});

test('設定から読む：段 1 より前の団体は前の項目から決める', () => {
  const 空 = { groupType: null, promotionCheck: true, useTerm: false, divisions: [] };
  assert.deepStrictEqual(学.設定から読む({}), 空);
  assert.deepStrictEqual(学.設定から読む(null), 空);
  assert.deepStrictEqual(学.設定から読む({ autoPromotionEnabled: false, currentFreshmanTerm: 53 }), {
    groupType: null,
    promotionCheck: false,
    useTerm: true,
    divisions: [],
  });
  assert.deepStrictEqual(学.設定から読む({ divisions: [{ id: 'a', name: '一般' }, { id: '' }] }).divisions, [
    { id: 'a', name: '一般' },
  ]);
  assert.strictEqual(
    学.設定から読む({ currentFreshmanTerm: 1 }).useTerm,
    false,
    '既定の 1 期のままは使っていない'
  );
  assert.deepStrictEqual(
    学.設定から読む({
      groupType: 'kosen5',
      promotionCheck: false,
      useTerm: true,
      autoPromotionEnabled: false,
    }),
    { groupType: 'kosen5', promotionCheck: false, useTerm: true, divisions: [] }
  );
  assert.strictEqual(学.設定を書き足すか({}), true);
  assert.strictEqual(
    学.設定を書き足すか({ promotionCheck: true, useTerm: false }),
    true,
    '古い版の自動進級が入ったまま'
  );
  assert.strictEqual(
    学.設定を書き足すか({ promotionCheck: true, useTerm: false, autoPromotionEnabled: false }),
    false
  );
});

test('進級待ちの年：4 月 1 日を過ぎ、その年の進級がまだのとき', () => {
  assert.strictEqual(学.進級待ちの年(new Date(2027, 3, 1), 2026, true), 2027);
  assert.strictEqual(学.進級待ちの年(new Date(2027, 2, 31), 2026, true), null, '3 月はまだ');
  assert.strictEqual(学.進級待ちの年(new Date(2027, 3, 1), 2027, true), null, '済んでいる');
  assert.strictEqual(学.進級待ちの年(new Date(2027, 3, 1), 2026, false), null, '進級の確認が切');
  assert.strictEqual(学.進級待ちの年(new Date(2027, 3, 1), null, true), null, '前の年が無い団体');
  assert.strictEqual(学.進級待ちの年(new Date(2028, 6, 1), 2026, true), 2028, '1 年飛んでも今年の分だけ');
});

test('期の計算と卒業の年度', () => {
  assert.strictEqual(学.学年の期(53, 1), 53);
  assert.strictEqual(学.学年の期(53, 4), 50);
  assert.strictEqual(学.期を付ける学年か(3), true);
  assert.strictEqual(学.期を付ける学年か(5), false, '前の形の卒業生の学年には付けない');
  assert.strictEqual(学.期を付ける学年か(0), false);
  // 今の 1 年生が 53 期・今年度が 2026 なら、53 期は 2029 年度、50 期（4 年生）は 2026 年度に卒業
  assert.strictEqual(学.卒業の年度(53, 53, 2026), 2029);
  assert.strictEqual(学.卒業の年度(50, 53, 2026), 2026);
  // 進級して今の 1 年生が 54 期になった 2027 年度、50 期の卒業生は 2026 年度まで現役だった
  assert.strictEqual(学.卒業の年度(50, 54, 2027), 2026);
  assert.strictEqual(学.年度(new Date(2027, 2, 31)), 2026);
  assert.strictEqual(学.年度(new Date(2027, 3, 1)), 2027);
});
