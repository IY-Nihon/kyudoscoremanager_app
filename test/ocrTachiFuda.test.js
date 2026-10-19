/**
 * 立の番号の札で、空きごとの組を立にまとめる（src/ocrTachiFuda.js）。名前は架空。
 */
const test = require('node:test');
const assert = require('node:assert');
const { 札で立にまとめる, 札の番号 } = require('../src/ocrTachiFuda');

const 組 = (fuda, row, n, 頭) => ({ fuda, row, seats: Array.from({ length: n }, (_, i) => `${頭}${i + 1}`) });
const 人数 = (立たち) => 立たち.map((x) => x.seats.length).join('+');

test('札の字から番号を取る', () => {
  assert.strictEqual(札の番号('壱'), 1);
  assert.strictEqual(札の番号('弐之立'), 2);
  assert.strictEqual(札の番号('参'), 3);
  assert.strictEqual(札の番号('四'), 4);
  assert.strictEqual(札の番号('3立'), 3);
  assert.strictEqual(札の番号(''), null);
  assert.strictEqual(札の番号('A立'), null);
});

test('札が無ければ組をそのまま立にする', () => {
  assert.strictEqual(人数(札で立にまとめる([{ seats: ['a', 'b'] }, { seats: ['c'] }])), '2+1');
});

test('札1枚に組2つ・上下2段で、札の番号の順に並べる（10/19 の板の形）', () => {
  // 上の段：参（6）＋札なし（5）、四（5）。下の段：壱（6）＋札なし（6）、弐（6）＋札なし（6）
  const 立たち = 札で立にまとめる([
    組('参', 1, 6, 'あ'),
    組('', 1, 5, 'い'),
    組('四', 1, 5, 'う'),
    組('壱', 2, 6, 'え'),
    組('', 2, 6, 'お'),
    組('弐', 2, 6, 'か'),
    組('', 2, 6, 'き'),
  ]);
  assert.strictEqual(人数(立たち), '12+12+11+5');
  assert.strictEqual(立たち[0].seats[0], 'え1');
  assert.strictEqual(立たち[0].seats[6], 'お1');
});

test('段の頭の札の無い組は、写っていない札の立として先に置く（10/17 の板の形）', () => {
  const 立たち = 札で立にまとめる([組('', 1, 6, 'あ'), 組('', 1, 6, 'い'), 組('弐', 1, 6, 'う'), 組('', 1, 5, 'え')]);
  assert.strictEqual(人数(立たち), '12+11');
});

test('札の無い組は、別の段の立には入れない', () => {
  assert.strictEqual(人数(札で立にまとめる([組('壱', 1, 3, 'あ'), 組('', 2, 4, 'い')])), '4+3');
});
