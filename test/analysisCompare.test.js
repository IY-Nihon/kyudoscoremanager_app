/**
 * 分析の「比較」まわり（src/AnalysisScreen.js）。
 *
 * 2026-09-08 に直した3つが、戻っていないかを見る。走らせずに読んで確かめる。
 *
 *   1. 長い名前の下に的中率が被る
 *      左（順位・名前）に幅の制御が無く、名前が右の的中率を押しのけていた。
 *   2. 的中の型が、比較中は本人の分しか出ない
 *      「16通りを人数ぶん並べても読めない」として出していなかったが、
 *      本人の分だけが残ってかえって紛らわしかった。名前の見出しを付けて並べる。
 *   3. 比較中に全体の的中率が見えない
 *      ランキングへ戻らないと相手の全体の的中率が見られなかった。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 本体 = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'AnalysisScreen.js'),
  'utf8'
);

test('順位の行：名前が長くても的中率を押しのけない', () => {
  // 左は縮む（flex:1 + minWidth:0）、右は縮まない（flexShrink:0）
  const 左 = 本体.match(/rowLeft:\s*\{[^}]*\}/);
  assert.ok(左, 'rowLeft がありません');
  assert.ok(/flex:\s*1/.test(左[0]), 'rowLeft に flex:1 がありません（余白を左が取る）');
  assert.ok(/minWidth:\s*0/.test(左[0]), 'rowLeft に minWidth:0 がありません（縮めるのに要る）');

  const 右 = 本体.match(/rowRight:\s*\{[^}]*\}/);
  assert.ok(右, 'rowRight がありません');
  assert.ok(
    /flexShrink:\s*0/.test(右[0]),
    'rowRight に flexShrink:0 がありません（的中率が縮んで隠れる）'
  );

  const 名 = 本体.match(/nameContainer:\s*\{[^}]*\}/);
  assert.ok(名 && /minWidth:\s*0/.test(名[0]), 'nameContainer が縮めるようになっていません');
});

test('順位の行：長い名前は行数を区切る', () => {
  // 切らないと縦に伸びて、右の的中率と上下がずれる
  const i = 本体.indexOf('F.memberName');
  assert.ok(i > 0, 'memberName を使っている所が見つかりません');
  const 節 = 本体.slice(i, i + 400);
  assert.ok(/numberOfLines:\s*2/.test(節), '名前に numberOfLines がありません');
});

test('的中の型：比較中は誰の型かを見出しに出せる', () => {
  // 引数「誰の」を受け取り、見出しに使っていること
  assert.ok(
    /function 型の節\(成績, 期間の名, 誰の\)/.test(本体),
    '型の節 が名前を受け取るようになっていません'
  );
  assert.ok(/的中の型 — \$\{誰の\}/.test(本体), '見出しに名前を出していません');
});

test('的中の型：比較している人ぶん並べる', () => {
  // compareMembers を回して 型の節 を呼んでいること
  // 比較相手ぶん 型の節 を呼んでいる所を探す
  const i = 本体.indexOf('型の節(比較の成績.get(cm.id)');
  assert.ok(i > 0, '比較相手について 型の節 を呼んでいる所が見つかりません');
  const 前 = 本体.slice(Math.max(0, i - 300), i);
  assert.ok(/compareMembers/.test(前), '比較相手ぶん回していません');
});

test('比較中：全体の的中率を、人数ぶんまとめて出す', () => {
  for (const 名 of ['比較の的中率', '比較の的中率の行', '比較の的中率の名', '比較の的中率の数']) {
    assert.ok(new RegExp(名 + ':').test(本体), `${名} の見た目がありません`);
  }
  // 本人と比較相手の両方を並べていること
  const i = 本体.indexOf('style: F.比較の的中率,');
  assert.ok(i > 0, '全体の的中率を出している所が見つかりません');
  const 節 = 本体.slice(i, i + 1400);
  assert.ok(/ae\.name/.test(節), '本人が入っていません');
  assert.ok(/compareMembers\.map/.test(節), '比較相手が入っていません');
  assert.ok(/比較の色たち/.test(節), 'グラフと同じ色で見分けられるようにしていません');
});

test('比較の相手を選ぶ一覧：男女が色で分かる', () => {
  const i = 本体.indexOf("'男子' === item.gender");
  assert.ok(i > 0, '比較の選択の一覧に男女の色分けがありません');
  const 節 = 本体.slice(Math.max(0, i - 900), i + 900);
  assert.ok(/'男子' === item\.gender/.test(節), '男子の色分けがありません');
  assert.ok(/'女子' === item\.gender/.test(節), '女子の色分けがありません');
  // メンバー画面と同じ色にそろえる
  assert.ok(/#007AFF/.test(節) && /#FF2D55/.test(節), '色がメンバー画面とそろっていません');
});
