/**
 * Service Worker（pwa/sw.js）の控えの決まり。
 *
 *   npm test
 *
 * Firebase Hosting は無いファイルにも 200 で index.html を返す。束・字体・画像の名前で HTML が返ったときに
 * 控えると、次からずっとその HTML を返し続けて画面が壊れるので、控えない（前に控えたものも使わない）
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function 読み込む() {
  const 場 = {
    self: { addEventListener: () => {}, location: { origin: 'https://example.test' }, skipWaiting: () => {}, clients: {} },
    caches: {},
    URL,
    console,
  };
  vm.createContext(場);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../pwa/sw.js'), 'utf8'), 場);
  return 場;
}

const 応答 = (ok, 型) => ({ ok, headers: { get: (名) => (名.toLowerCase() === 'content-type' ? 型 : null) } });

test('束・字体・画像の名前で HTML が返ったら、本物の応答とみなさない（控えない）', () => {
  const { 本物の静的応答か } = 読み込む();
  assert.strictEqual(本物の静的応答か(応答(true, 'application/javascript')), true);
  assert.strictEqual(本物の静的応答か(応答(true, 'font/ttf')), true);
  assert.strictEqual(本物の静的応答か(応答(true, 'text/html; charset=utf-8')), false);
  assert.strictEqual(本物の静的応答か(応答(false, 'application/javascript')), false);
  assert.strictEqual(本物の静的応答か(undefined), false);
});
