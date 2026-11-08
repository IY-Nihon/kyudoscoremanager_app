'use strict';
/**
 * AI の部員登録の見張り（src/chatMemberGuard.js）。2026-11-08 本人：「部員1〜100 を連番で」のような頼みは断る。50 人ずつ
 */
const test = require('node:test');
const assert = require('node:assert');
const { 部員の頼みを確かめる, 断りの文, 残りの文 } = require('../src/chatMemberGuard');

const 人 = (name) => ({ name, grade: 1, gender: 'male' });

test('利用者が書いた名前は通す（AI が姓と名の間に空白を入れても同じ人）', () => {
  const 結果 = 部員の頼みを確かめる(
    [人('山田 太郎'), 人('佐藤　花子')],
    ['山田太郎と佐藤花子を1年男子で登録して']
  );
  assert.strictEqual(結果.通す.length, 2);
  assert.strictEqual(断りの文(結果), '');
});

test('連番で AI が作った名前は通さない（「100人、部員1」）', () => {
  const 作った = Array.from({ length: 30 }, (_, i) => 人(`部員${i + 1}`));
  const 結果 = 部員の頼みを確かめる(作った, ['部員を登録して、連番で1年男', '30人、部員1']);
  // 「部員1」だけは文に入っているが、1 人でも書いていない名前があれば頼み全体を断る（1 枚だけカードを出さない）
  assert.ok(結果.名前が無い.length > 0);
  assert.match(断りの文(結果), /書いていない名前は登録しません/);
});

test('前の文で貼った名簿も、利用者が書いた名前として通す', () => {
  const 結果 = 部員の頼みを確かめる([人('鈴木 一郎')], ['名簿：鈴木一郎（2年男子）', 'これを登録して']);
  assert.strictEqual(結果.通す.length, 1);
});

test('50 人を超えたら、先の 50 人を通し、残りはもう一度頼んでもらう', () => {
  const 名前 = Array.from({ length: 73 }, (_, i) => `山田${i}郎`);
  const 結果 = 部員の頼みを確かめる(名前.map(人), [名前.join('、')]);
  assert.strictEqual(結果.通す.length, 50);
  assert.strictEqual(結果.残り.length, 23);
  assert.strictEqual(結果.残り[0].name, '山田50郎');
  assert.strictEqual(断りの文(結果), '');
  assert.match(残りの文(結果), /残りの23人（山田50郎さんから）/);
});

test('ちょうど 50 人は通す', () => {
  const 名前 = Array.from({ length: 50 }, (_, i) => `山田${i}郎`);
  const 結果 = 部員の頼みを確かめる(名前.map(人), [名前.join('、')]);
  assert.strictEqual(結果.通す.length, 50);
  assert.strictEqual(残りの文(結果), '');
});

test('誰も名前が書かれていなければ、断りの文を AI に返す', () => {
  const 結果 = 部員の頼みを確かめる([人('仮の人A'), 人('仮の人B')], ['適当な名前で2人登録して']);
  assert.strictEqual(結果.通す.length, 0);
  assert.match(断りの文(結果), /書いていない名前は登録しません/);
});

test('全角と半角・カタカナとひらがな・名字の異体字を AI が直しても、同じ人として通す', () => {
  const 結果 = 部員の頼みを確かめる(
    [人('JOHN SMITH'), 人('じょん'), 人('高橋 一郎'), 人('斎藤 花子'), 人('山田 1号')],
    ['ＪＯＨＮ　ＳＭＩＴＨとジョンと髙橋一郎と齋藤花子と山田１号を登録して']
  );
  assert.strictEqual(結果.名前が無い.length, 0, JSON.stringify(結果.名前が無い));
  assert.strictEqual(結果.通す.length, 5);
});

test('ひらがなを漢字に直されたときは同じ人と見られない（読みが分からない）', () => {
  const 結果 = 部員の頼みを確かめる([人('山田')], ['やまだを登録して']);
  assert.strictEqual(結果.名前が無い.length, 1);
});
