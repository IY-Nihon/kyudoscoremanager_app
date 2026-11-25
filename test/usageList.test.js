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

test('動画の名を書いたものは、public/usage に動画がある', () => {
  const 無い = 全項目
    .flatMap((項) => 項.部分.map((部) => 部.動画))
    .filter(Boolean)
    .filter((名) => !fs.existsSync(path.join(__dirname, '..', 'public', 'usage', 名 + '.mp4')));
  assert.deepEqual(無い, [], '撮り忘れ（e2e/record-usage-videos.spec.mjs で撮る）');
});

test('public/usage の動画は、どれも一覧のどこかで使っている（使わない動画を配らない）', () => {
  const 使う = new Set(全項目.flatMap((項) => 項.部分.map((部) => 部.動画)).filter(Boolean));
  const 置き場 = path.join(__dirname, '..', 'public', 'usage');
  const 余り = fs
    .readdirSync(置き場)
    .filter((f) => f.endsWith('.mp4'))
    .map((f) => f.replace(/\.mp4$/, ''))
    .filter((名) => !使う.has(名));
  assert.deepEqual(余り, [], '使っていない動画（消すか、台本ごと外す）');
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
  assert.ok(!名たち.includes('パスワード・団体IDを忘れた'));
  const 部分の見出し = 使い方の一覧('member').flatMap((組) =>
    組.項目.flatMap((項) => 項.部分.map((部) => 部.見出し))
  );
  assert.ok(!部分の見出し.includes('練習日を登録する'), '団体だけの部分も外す');
  assert.ok(名たち.includes('ログインのしかた（団体・個人）'));
  assert.equal(使い方の一覧('group').at(-1).名, 困りごと);
});

// 運営など役のある個人ログインには、その役に関係のあるものだけ団体向けを出す（11/19 本人）。部品は src/yaku.js
const { 最初の役 } = require('../src/yaku');
const 役の部品 = (id) => 最初の役.find((役) => 役.id === id).部品;
const 中身 = (一覧) => ({
  名: 一覧.flatMap((組) => 組.項目.map((項) => 項.名)),
  見出し: 一覧.flatMap((組) => 組.項目.flatMap((項) => 項.部分.map((部) => 部.見出し))),
  文: 一覧.flatMap((組) => 組.項目.flatMap((項) => 項.部分.flatMap((部) => 部.文))),
});

test('運営：役に関係のある団体向けと役を決めるを出し、アカウント・パスワード・作る道は出さない', () => {
  const { 名, 見出し, 文 } = 中身(使い方の一覧('member', 役の部品('unei'), 'unei'));
  for (const 出る of [
    'メンバーを登録する・直す',
    '学年・進級・区分の設定',
    '過去の記録を編集する・消す',
    '管理者モード',
    '間違えて消した記録を戻したい',
  ])
    assert.ok(名.includes(出る), `運営に「${出る}」が出ない`);
  for (const 出ない of [
    '登録メールアドレスを変える',
    '団体アカウントを削除する',
    'パスワード・団体IDを忘れた',
  ])
    assert.ok(!名.includes(出ない), `運営に「${出ない}」が出る`);
  for (const 出る of ['練習日を登録する', '個人IDを伝える・招待リンクを送る', '年度が変わったとき（進級）'])
    assert.ok(見出し.includes(出る), `運営に「${出る}」が出ない`);
  assert.ok(文.some((字) => 字.startsWith('・保存した記録の的中')));
  assert.ok(文.some((字) => 字.startsWith('・メンバーの個人ID')));
  // 役を決めるは運営の役の人も持つ（11/25 本人）。団体アカウントの削除は団体だけ
  assert.ok(
    文.some((字) => 字.includes('部員の役を決める')),
    '運営に役を決めるが出ない'
  );
  assert.ok(!文.some((字) => 字.includes('団体アカウントを削除する')));
  // 作った役は、部品を全部持っていても役を決めるは出さない（運営の役だけ）
  const 作った役 = 中身(使い方の一覧('member', 役の部品('unei'), 'r_zenbu')).文;
  assert.ok(!作った役.some((字) => 字.includes('部員の役を決める')), '作った役に役を決めるが出る');
  assert.ok(!文.some((字) => 字.includes('初めてのときは、ここで作ります')), '運営に合言葉を作る道を出した');
  assert.ok(
    文.every((字) => typeof 字 === 'string'),
    '文の 1 行が字になっていない'
  );
});

test('作った役：部品の分だけ出す（消すだけ・設定だけ・出欠だけ）', () => {
  const 消す = 中身(使い方の一覧('member', ['付ける', '消す']));
  assert.ok(消す.見出し.includes('消す・戻す') && !消す.見出し.includes('編集する'));
  assert.ok(消す.名.includes('間違えて消した記録を戻したい'));
  assert.ok(!消す.名.includes('管理者モード'), '合言葉の要る部品が無いのに管理者モードを出した');
  const 設定 = 中身(使い方の一覧('member', ['付ける', '設定']));
  assert.ok(設定.名.includes('学年・進級・区分の設定'));
  assert.ok(!設定.見出し.includes('年度が変わったとき（進級）'), '進級の窓はメンバーと設定の両方が要る');
  const 出欠 = 中身(使い方の一覧('member', ['付ける', '出欠']));
  assert.ok(出欠.見出し.includes('練習日を登録する'));
  assert.ok(!出欠.名.includes('メンバーを登録する・直す'));
});

test('団体の口座には全部（役だけの言い回しは出さない）。部員（自分）は部品を渡さないときと同じ', () => {
  const 団体 = 中身(使い方の一覧('group'));
  assert.equal(団体.名.length, 全項目.length);
  assert.ok(団体.文.some((字) => 字.includes('初めてのときは、ここで作ります')));
  assert.ok(
    !団体.文.includes(
      '設定の「管理者モード」を入れます（管理者の合言葉を聞かれます）。入れると、次のことができます。'
    )
  );
  assert.deepEqual(使い方の一覧('member', 役の部品('jibun')), 使い方の一覧('member'));
});

test('運営に出す項目の「画面でやってみる」は、団体の口座で出せるものなら運営でも出せる', () => {
  const 部品 = 役の部品('unei');
  const 出せる題 = (手順) =>
    new Set([...手順.基本, ...手順.続き].filter((一つ) => 一つ.目印).map((一つ) => 一つ.題));
  const 団体の題 = 出せる題(手順を作る('group', { 部員数: 6, 記録数: 10 }));
  const 運営の題 = 出せる題(手順を作る('member', { 部員数: 6, 記録数: 10, 部品 }));
  for (const 組 of 使い方の一覧('member', 部品))
    for (const 項 of 組.項目)
      for (const 題 of (項.案内 || []).filter((題) => 団体の題.has(題)))
        assert.ok(運営の題.has(題), `${項.名}：運営の案内に無い題「${題}」`);
});

test('見るだけ（記録を付けられない役）：記録を付ける項目を出さず、ライブは閲覧用で入る説明を出す（11/19 本人）', () => {
  const 一覧 = 使い方の一覧('member', 役の部品('miru'));
  const { 名, 見出し, 文 } = 中身(一覧);
  assert.ok(!一覧.some((組) => 組.名 === '記録を取る'), '見るだけに「記録を取る」が出る');
  for (const 出ない of [
    '立ちごとの計と総計',
    '押し間違いを防ぐ・戻す',
    '矢所（当たった場所）を残す',
    '入れた○×が手や袖で消えてしまう',
    '練習に遅れて来た人がいる',
  ])
    assert.ok(!名.includes(出ない), `見るだけに「${出ない}」が出る`);
  assert.ok(!見出し.includes('射数を変える') && 見出し.includes('表示の大きさ'));
  assert.ok(名.includes('何台かで同時に記録する'));
  assert.ok(
    文.some((字) => 字.includes('閲覧用で入れます')),
    '見るだけにライブを閲覧用で見る説明が無い'
  );
  assert.ok(!文.some((字) => 字.startsWith('記録画面の上の「ライブ」で記録を始めると')));
  // 付けられる人には閲覧用だけの言い回しを出さない
  for (const [役割, 部品] of [
    ['group', []],
    ['member', 役の部品('jibun')],
  ])
    assert.ok(
      !中身(使い方の一覧(役割, 部品)).文.some((字) => 字.includes('閲覧用で入れます')),
      `${役割}に見るだけの言い回しが出る`
    );
});

test('出欠のタブは「出欠」の部品のある人だけなので、出欠の項目もその人だけに出す', () => {
  assert.ok(!中身(使い方の一覧('member')).名.includes('出欠と練習日'), '部員（自分）に出欠の項目が出る');
  assert.ok(中身(使い方の一覧('member', ['付ける', '出欠'])).名.includes('出欠と練習日'));
  assert.ok(中身(使い方の一覧('group')).名.includes('出欠と練習日'));
});
