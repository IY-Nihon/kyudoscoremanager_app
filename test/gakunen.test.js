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
  assert.deepStrictEqual(学.設定から読む({}), { groupType: null, promotionCheck: true, useTerm: false });
  assert.deepStrictEqual(学.設定から読む(null), { groupType: null, promotionCheck: true, useTerm: false });
  assert.deepStrictEqual(学.設定から読む({ autoPromotionEnabled: false, currentFreshmanTerm: 53 }), {
    groupType: null,
    promotionCheck: false,
    useTerm: true,
  });
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
    { groupType: 'kosen5', promotionCheck: false, useTerm: true }
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
