/**
 * 「使い方を見る」の一覧（src/usageList.js）の検査。
 *
 *   npm test
 *
 * 動画の名を書いたのに public/usage に無いと、開いても文だけになる。「画面でやってみる」の案内の題が
 * 案内（tutorialSteps）に無いと、ボタンが黙って消える。名が重なると一覧で開き分けられない。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { 使い方の一覧, まとまりたち, 困りごと } = require('../src/usageList');
const { 手順を作る } = require('../src/tutorialSteps');

const 全項目 = まとまりたち.flatMap((組) => 組.項目);

test('どの項目にも文があり、名は重ならない', () => {
  const 見た = new Set();
  for (const 項 of 全項目) {
    assert.ok(!見た.has(項.名), `${項.名}：二度出てくる`);
    見た.add(項.名);
    assert.ok(項.部分.length > 0 && 項.部分.every((部) => 部.文.length > 0), `${項.名}：文が空`);
  }
});

test('一つのまとまりの項目は多すぎない（多いと逆に分かりにくい。2026-10-19 本人）', () => {
  for (const 組 of まとまりたち) assert.ok(組.項目.length <= 7, `${組.名}：${組.項目.length} 項目`);
});

test('動画の名を書いたものは、public/usage に動画がある', () => {
  const 無い = 全項目
    .flatMap((項) => 項.部分.map((部) => 部.動画))
    .filter(Boolean)
    .filter((名) => !fs.existsSync(path.join(__dirname, '..', 'public', 'usage', 名 + '.mp4')));
  assert.deepEqual(無い, [], '撮り忘れ（e2e/record-usage-videos.spec.mjs で撮る）');
});

test('「画面でやってみる」の案内の題は、案内に在って指す先がある', () => {
  const 題たち = new Set();
  for (const 役割 of ['group', 'member'])
    for (const 部員数 of [0, 6]) {
      const { 基本, 続き } = 手順を作る(役割, { 部員数, 記録数: 10 });
      for (const 一つ of [...基本, ...続き]) if (一つ.目印) 題たち.add(一つ.題);
    }
  for (const 項 of 全項目)
    for (const 題 of 項.案内 || []) assert.ok(題たち.has(題), `${項.名}：案内に無い題「${題}」`);
});

test('個人で入ったときは、管理者や団体ログインが要る項目を出さない。困りごとは最後', () => {
  const 名たち = 使い方の一覧('member').flatMap((組) => 組.項目.map((項) => 項.名));
  assert.ok(!名たち.includes('管理者モード'));
  assert.ok(!名たち.includes('パスワードを忘れた'));
  assert.ok(名たち.includes('ログインのしかた（団体・個人）'));
  assert.equal(使い方の一覧('group').at(-1).名, 困りごと);
});
