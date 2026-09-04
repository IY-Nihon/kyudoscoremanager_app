/**
 * 新しい版の知らせ（src/updateNotice.js）。
 *
 *   npm test
 *
 * 見たいのは2つ。
 *   ・同じ束を「新しい」と言わないこと（言い続けると、誰も押さなくなる）
 *   ・読めないときに黙ること（当てずっぽうで帯を出さない）
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 束の名前, 新しい版が出たか, 名前だけにする, 見に行く間隔 } = require('../src/updateNotice');

const HTML = (束) => `<!DOCTYPE html><html><head><title>弓道記録アプリ</title></head>
<body><div id="root"></div><script src="${束}" defer></script></body></html>`;

const 束A = '/_expo/static/js/web/AppEntry-f012e44cdc3d190bc888c09c08152beb.js';
const 束B = '/_expo/static/js/web/AppEntry-0123456789abcdef0123456789abcdef.js';

test('束の名前を取り出せる', () => {
  assert.strictEqual(束の名前(HTML(束A)), 束A);
});

test('束が見つからない HTML では null', () => {
  for (const x of /** @type {any[]} */ ([null, undefined, '', '<html></html>', 123]))
    assert.strictEqual(束の名前(x), null, String(x));
});

test('同じ束なら「新しい版」と言わない', () => {
  assert.strictEqual(新しい版が出たか(束A, HTML(束A)), !1);
});

test('束が変わったら「新しい版」', () => {
  assert.strictEqual(新しい版が出たか(束A, HTML(束B)), !0);
});

test('住所の書き方が違うだけなら、新しい版ではない', () => {
  // 絶対・相対・問い合わせ付きで、同じ束を指すことがある。
  // 名前で比べないと、中身が同じでも言い続けることになる
  const 同じ = [
    'https://kyudoscoremanager.web.app' + 束A,
    束A.replace(/^\//, ''),
    束A + '?v=1',
    束A + '#x',
  ];
  for (const x of 同じ) assert.strictEqual(新しい版が出たか(束A, HTML(x)), !1, x);
});

test('どちらかが読めないときは黙る', () => {
  // 取り違えて帯を出すと、押しても何も変わらず、そのうち誰も押さなくなる
  assert.strictEqual(新しい版が出たか(null, HTML(束B)), !1);
  assert.strictEqual(新しい版が出たか(束A, null), !1);
  assert.strictEqual(新しい版が出たか(束A, '<html>取れなかった</html>'), !1);
  assert.strictEqual(新しい版が出たか(undefined, undefined), !1);
});

test('名前だけにする：問い合わせも印も落とす', () => {
  assert.strictEqual(名前だけにする('/a/b/c.js?x=1#y'), 'c.js');
  assert.strictEqual(名前だけにする('c.js'), 'c.js');
  assert.strictEqual(名前だけにする(null), null);
  assert.strictEqual(名前だけにする(''), null);
});

test('見に行く間隔は、短すぎず長すぎない', () => {
  // 短いと index.html を取りにいく回数が増える。長いと配信に気づけない
  assert.ok(見に行く間隔 >= 5 * 60 * 1000, '短すぎる');
  assert.ok(見に行く間隔 <= 60 * 60 * 1000, '長すぎる');
});

// お知らせ（src/WhatsNewModal.js）の版の見張り。
//
// 新しい項目を足したのに NOTICE_VERSION を上げ忘れると、その項目は
// 「今後表示しない」を押した人に二度と出ない。自動で出すかどうかは
// NOTICE_VERSION と、いちばん新しい項目の 版 を比べて決めているため。
// ここが食い違わないことを、走らせずにファイルから読んで確かめる。
test('お知らせ：NOTICE_VERSION が、いちばん新しい項目の版と一致する', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const 本体 = fs.readFileSync(path.join(__dirname, '..', 'src', 'WhatsNewModal.js'), 'utf8');

  const 宣言 = 本体.match(/NOTICE_VERSION\s*=\s*'([^']+)'/);
  assert.ok(宣言, 'NOTICE_VERSION の宣言が見つからない');
  const 版 = 宣言[1];

  // NOTICE_ITEMS のいちばん最初（＝いちばん新しい）項目の 版
  const 最初の項目の版 = 本体.match(/NOTICE_ITEMS\s*=\s*\[[\s\S]*?版:\s*'([^']+)'/);
  assert.ok(最初の項目の版, '最初の項目の 版 が見つからない');

  assert.strictEqual(
    版,
    最初の項目の版[1],
    `NOTICE_VERSION (${版}) が、いちばん新しい項目の版 (${最初の項目の版[1]}) と食い違っている。` +
      '新しいお知らせを足したら NOTICE_VERSION も合わせること'
  );
});

// お知らせの版は「年-月-日-連番」。新旧の比較（> で判定）に効くよう、
// 形がそろっていることを見る。ここが崩れると新旧の線が狂う
test('お知らせ：版の形が YYYY-MM-DD-NN でそろっている', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const 本体 = fs.readFileSync(path.join(__dirname, '..', 'src', 'WhatsNewModal.js'), 'utf8');
  const 版たち = [...本体.matchAll(/版:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.ok(版たち.length >= 2, '版を持つ項目が少なすぎる');
  for (const v of 版たち) {
    assert.match(v, /^\d{4}-\d{2}-\d{2}-\d{2}$/, `版の形が違う: ${v}`);
  }
});
