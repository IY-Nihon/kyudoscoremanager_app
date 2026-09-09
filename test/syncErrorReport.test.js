/**
 * 同期エラーにするときは、必ず便りを出しているかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 *
 * 2026-09-09、スマホで「同期エラー」の帯が出たのに、こちらに届いた便りは
 * 1通も無かった。調べると、雲との連絡口が用意できなかったときだけ
 * 黙って同期エラーにする道が2つ残っていた。
 *
 * 画面に帯を出すということは、利用者が困っているということ。そこで
 * 何も残らないと、次に同じことが起きても原因にたどり着けない。
 * 「帯を出すなら跡も残す」を機械で押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 店の中身 = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'useScoreStore.js'),
  'utf8'
);

const 改行 = String.fromCharCode(10);

test('同期エラーにする所は、どこも便りを出している', () => {
  const 印 = "syncStatus: '同期エラー'";
  const 黙っている = [];
  let 位置 = 0;
  let 数 = 0;
  for (;;) {
    const 見つけ = 店の中身.indexOf(印, 位置);
    if (見つけ < 0) break;
    位置 = 見つけ + 印.length;
    数++;
    // 手前の 15 行を見る。catch で受けたときも、用意できなかったときも、
    // すぐ上で 不具合を控える を呼んでいるのが決まり
    const 手前 = 店の中身.slice(0, 見つけ).split(改行).slice(-15).join(改行);
    if (!手前.includes('不具合を控える(')) {
      黙っている.push(店の中身.slice(0, 見つけ).split(改行).length);
    }
  }

  assert.ok(数 >= 5, '同期エラーにする所が見つからない（' + 数 + 'か所）');
  assert.deepStrictEqual(
    黙っている,
    [],
    '便りを出さずに同期エラーにしている行: ' + 黙っている.join(', ')
  );
});
