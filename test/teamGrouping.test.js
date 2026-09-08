/**
 * 立ちの中の「どこからどこまでが、どのチームか」（src/teamGrouping.js）。
 *
 * リーグで大学名を出すための仕組み。区切り（間隔）にチーム名を付けると、
 * そこから右がそのチームになる。射手を一人ずつ設定しなくてよい。
 *
 * 見たいのは3つ。
 *   ・区切りより右に、まとめて付くこと（手間が減る肝）
 *   ・名前の付いていない区切り（ただの間隔）は、持ち主を変えないこと
 *   ・同じ名前なら、いつでも同じ色になること
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  チームを割り当てる,
  チームの色,
  区切りのチーム名,
  出てくるチーム,
  チームの色たち,
} = require('../src/teamGrouping');

const 人 = (id) => ({ id, name: id, isSeparator: !1 });
const 区切り = (id, teamName) => ({ id, name: '---', isSeparator: !0, teamName });
const 計 = (id) => ({ id, isTotalCalculator: !0 });

test('区切りより右が、まとめてそのチームになる', () => {
  const 並び = [人('a'), 人('b'), 区切り('s1', '◯◯大学'), 人('c'), 人('d')];
  const r = チームを割り当てる(並び);
  // 区切りより左は自団体（名前なし）
  assert.equal(r[0].チーム, null);
  assert.equal(r[1].チーム, null);
  // 区切り自身はチームに属さない
  assert.equal(r[2].チーム, null);
  // 区切りより右は、2人ともまとめて付く
  assert.equal(r[3].チーム, '◯◯大学');
  assert.equal(r[4].チーム, '◯◯大学');
});

test('チームが3つ以上でも、区切りごとに切り替わる', () => {
  const 並び = [
    人('a'),
    区切り('s1', 'A大'),
    人('b'),
    人('c'),
    区切り('s2', 'B大'),
    人('d'),
  ];
  const r = チームを割り当てる(並び);
  assert.equal(r[0].チーム, null, '最初は自団体');
  assert.equal(r[2].チーム, 'A大');
  assert.equal(r[3].チーム, 'A大');
  assert.equal(r[5].チーム, 'B大');
});

test('名前の付いていない区切りは、持ち主を変えない', () => {
  // 「間隔」をただの隙間として使っている今までの立ちが、
  // この仕組みを入れたせいで勝手にチーム分けされては困る
  const 並び = [人('a'), 区切り('s1'), 人('b'), 区切り('s2', '---'), 人('c')];
  const r = チームを割り当てる(並び);
  assert.equal(r[0].チーム, null);
  assert.equal(r[2].チーム, null, 'ただの間隔で持ち主が変わってはいけない');
  assert.equal(r[4].チーム, null, "'---' もチーム名とは見なさない");
});

test('名前なしの区切りをはさんでも、前のチームが続く', () => {
  const 並び = [区切り('s1', 'A大'), 人('a'), 区切り('s2'), 人('b')];
  const r = チームを割り当てる(並び);
  assert.equal(r[1].チーム, 'A大');
  assert.equal(r[3].チーム, 'A大', 'ただの間隔で切れてはいけない');
});

test('合計の列は、どのチームにも属さない', () => {
  const 並び = [区切り('s1', 'A大'), 人('a'), 計('t')];
  const r = チームを割り当てる(並び);
  assert.equal(r[2].チーム, null);
});

test('同じ名前なら、いつでも同じ色になる', () => {
  // 並び順や登録順で色が入れ替わると「昨日は赤、今日は青」になる
  const 一回目 = チームの色('◯◯大学');
  const 二回目 = チームの色('◯◯大学');
  assert.equal(一回目, 二回目);
  assert.ok(チームの色たち.includes(一回目), '決めてある色の中から選ばれる');
  // 前後の空白は同じものとして扱う
  assert.equal(チームの色(' ◯◯大学 '), 一回目);
});

test('名前が無ければ色も無い', () => {
  assert.equal(チームの色(''), null);
  assert.equal(チームの色('   '), null);
  assert.equal(チームの色(null), null);
  assert.equal(チームの色(undefined), null);
});

test('区切りのチーム名：ただの間隔とチーム名を見分ける', () => {
  assert.equal(区切りのチーム名(区切り('s', 'A大')), 'A大');
  assert.equal(区切りのチーム名(区切り('s', '---')), null);
  assert.equal(区切りのチーム名(区切り('s', '  ')), null);
  assert.equal(区切りのチーム名(区切り('s')), null);
  assert.equal(区切りのチーム名(人('a')), null, '区切りでないものは対象外');
  assert.equal(区切りのチーム名(null), null);
});

test('出てくるチームを、出た順に並べる', () => {
  const 並び = [人('a'), 区切り('s1', 'B大'), 人('b'), 区切り('s2', 'A大'), 人('c'), 区切り('s3', 'B大')];
  // 出た順。同じ名前は1つだけ
  assert.deepEqual(出てくるチーム(並び), ['B大', 'A大']);
});

test('空でも壊れない', () => {
  assert.deepEqual(チームを割り当てる([]), []);
  assert.deepEqual(チームを割り当てる(null), []);
  assert.deepEqual(出てくるチーム(null), []);
  const r = チームを割り当てる([null]);
  assert.equal(r[0].チーム, null);
});

// ── チーム名が消えないことを見張る ──────────────────
//
// 射手は保存・読み込み・ライブ送信のたびに作り直される。その作り直しで
// teamName を書き忘れると、色分けが「使っているうちに消える」壊れ方をする。
// 走らせても気づきにくいので、ファイルを読んで確かめる。
test('射手を作り直す所が、teamName を落とさない', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const 店 = fs.readFileSync(path.join(__dirname, '..', 'src', 'useScoreStore.js'), 'utf8');

  // 作り直しの型は isSeparator を必ず持つ。その一帯に teamName があるか見る
  const place = [];
  const re = /isSeparator:\s*(?:!0 === e\.isSeparator|e\.isSeparator \|\| !1)/g;
  let m;
  while ((m = re.exec(店)) !== null) place.push(m.index);
  assert.ok(place.length >= 2, '射手を作り直している所が見つかりません');

  for (const i of place) {
    const 節 = 店.slice(i, i + 700);
    assert.ok(
      /teamName/.test(節),
      '射手を作り直す所で teamName を写していません（読み直すと色分けが消える）'
    );
  }
});

test('区切りにチーム名を付ける処理が、ストアに在る', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const 店 = fs.readFileSync(path.join(__dirname, '..', 'src', 'useScoreStore.js'), 'utf8');
  assert.ok(/setSeparatorTeam\s*:/.test(店), 'setSeparatorTeam がありません');
  const i = 店.indexOf('setSeparatorTeam:');
  const 節 = 店.slice(i, i + 1200);
  assert.ok(/書き換えを止めるか/.test(節), '見るだけのライブ中に書き換えられてはいけない');
  assert.ok(/historyStack/.test(節), '取り消しできるよう、履歴に積む必要がある');
});

// ── 合計の数え方 ──────────────────────────────
const { 合計を数える } = require('../src/teamGrouping');
const 中り = (id, n) => ({ id, marks: Array(n).fill('○'), isSeparator: !1 });
const 合計列 = (id, またぐ) => ({ id, isTotalCalculator: !0, またぐ合計: !!またぐ });

test('計：区切りに当たると止まる（1立ぶん）', () => {
  const 並び = [中り('a', 3), 区切り('s'), 中り('b', 2), 合計列('t')];
  assert.equal(合計を数える(並び, 3), 2, '区切りより手前は数えない');
});

test('総計：区切りをまたいで端まで数える', () => {
  const 並び = [中り('a', 3), 区切り('s'), 中り('b', 2), 合計列('t', !0)];
  assert.equal(合計を数える(並び, 3), 5, '前の立ちと後ろの立ちを合わせる');
});

test('総計：区切りが複数あってもまたぐ', () => {
  const 並び = [中り('a', 1), 区切り('s1'), 中り('b', 2), 区切り('s2'), 中り('c', 3), 合計列('t', !0)];
  assert.equal(合計を数える(並び, 5), 6);
});

test('合計の合計にならない（別の合計に当たったら止まる）', () => {
  // 「計」のあとに「総計」を置いても、計の分を二重に数えない
  const 並び = [中り('a', 2), 合計列('t1'), 中り('b', 3), 合計列('t2', !0)];
  assert.equal(合計を数える(並び, 3), 3, '手前の合計より先は数えない');
});

test('合計の列でなければ0', () => {
  const 並び = [中り('a', 2), 中り('b', 3)];
  assert.equal(合計を数える(並び, 1), 0);
  assert.equal(合計を数える([], 0), 0);
  assert.equal(合計を数える(null, 0), 0);
});

test('○以外は数えない', () => {
  const 並び = [{ id: 'a', marks: ['○', '×', '', '○'] }, 合計列('t')];
  assert.equal(合計を数える(並び, 1), 2);
});
