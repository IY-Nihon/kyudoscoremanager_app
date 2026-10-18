/**
 * 「使い方を見る」の一覧にだけ出す項目（src/usageExtras.js）の検査。
 *
 *   npm test
 *
 * 文は AI の Q&A から引くので、Q&A の番号が変わると空の項目になる。名が案内の手順と重なると
 * 一覧で見分けられない。動画の名を書いたのに public/usage に無いと、開いても文だけになる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { 使い方の一覧, 足す項目, 答えの文, 困りごと } = require('../src/usageExtras');
const {
  手順を作る,
  まとまりの一覧,
  まとまりの順,
  一覧の名を引く,
  動画の名,
} = require('../src/tutorialSteps');

test('足す項目：文が空でなく、Q&A どうしの参照（Q55）や AI の言い方が残っていない', () => {
  for (const 項 of 足す項目) {
    const 文 = 項.文 || 答えの文(項.qa);
    assert.ok(文.length > 0, `${項.名}：文が空（${項.qa}）`);
    for (const 行 of 文) {
      assert.ok(!/（Q\d+）/.test(行), `${項.名}：Q&A の番号が残っている`);
      assert.ok(!/このチャット|私（AI/.test(行), `${項.名}：AI の言い方が残っている`);
    }
  }
});

test('足す項目：まとまりは決まった名だけ、名は案内の手順とも互いにも重ならない', () => {
  const { 基本, 続き } = 手順を作る('group', { 部員数: 6, 記録数: 10 });
  const 案内の名 = [...基本, ...続き].map((一つ) => 一覧の名を引く(一つ.題));
  const 見た = new Set();
  for (const 項 of 足す項目) {
    assert.ok([...まとまりの順, 困りごと].includes(項.まとまり), `${項.名}：知らないまとまり ${項.まとまり}`);
    assert.ok(!案内の名.includes(項.名), `${項.名}：案内の手順と同じ名`);
    assert.ok(!見た.has(項.名), `${項.名}：二度出てくる`);
    見た.add(項.名);
  }
});

test('動画の名を書いたものは、public/usage に動画がある', () => {
  const { 基本, 続き } = 手順を作る('group', { 部員数: 6, 記録数: 10 });
  const 名たち = [
    ...足す項目.map((項) => 項.動画).filter(Boolean),
    ...[...基本, ...続き].map((一つ) => 動画の名(一つ.題)).filter(Boolean),
  ];
  const 無い = 名たち.filter(
    (名) => !fs.existsSync(path.join(__dirname, '..', 'public', 'usage', 名 + '.mp4'))
  );
  // 説明だけの手順（指す先が無い）は動画を作らない。それ以外で無いものは撮り忘れ
  const 説明だけ = new Set(['u21', 'u24', 'u26', 'u27']);
  assert.deepEqual(
    無い.filter((名) => !説明だけ.has(名)),
    [],
    '撮り忘れ（e2e/record-usage-videos.spec.mjs で撮る）'
  );
});

test('個人（部員）で入ったときは、管理者や団体ログインが要る項目を出さない', () => {
  const { 基本, 続き } = 手順を作る('member', { 部員数: 6, 記録数: 10 });
  const 一覧 = 使い方の一覧(まとまりの一覧(基本, 続き), 'member');
  const 名たち = 一覧.flatMap((組) => 組.足す.map((項) => 項.名));
  assert.ok(!名たち.includes('過去の記録を直す'));
  assert.ok(!名たち.includes('パスワードを忘れた'));
  assert.ok(名たち.includes('電波が切れたら記録はどうなる？'));
  assert.equal(一覧.at(-1).名, 困りごと, '困りごとは最後');
});
