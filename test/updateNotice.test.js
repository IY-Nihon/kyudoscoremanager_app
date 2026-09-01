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
