/**
 * xlsx の組み立て（src/JP_excelExport.js）。
 *
 * 実体は ZIP + XML なので、番号や参照がずれると Excel が「開けません」と
 * 言うだけで理由を教えてくれない。組み立てだけを切り出して見張る。
 */
const test = require('node:test');
const assert = require('node:assert');
const { ブックを組む } = require('../src/JP_excelExport');

const 一枚 = { name: '記録', headers: ['氏名', '的中率'], rows: [['山田太郎', 38.9]] };

test('1枚のとき、必要なファイルがそろう', () => {
  const b = ブックを組む([一枚]);
  for (const 道 of [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml',
    'xl/worksheets/sheet1.xml',
  ]) {
    assert.ok(b[道], 道 + ' が無い');
  }
});

test('2枚のとき、シートの数だけ worksheet と Override と Relationship が増える', () => {
  const b = ブックを組む([一枚, { name: '集計に含めない記録', headers: ['日付'], rows: [['2026/08/01']] }]);
  assert.ok(b['xl/worksheets/sheet2.xml'], '2枚目が無い');
  assert.strictEqual((b['xl/workbook.xml'].match(/<sheet /g) || []).length, 2);
  assert.strictEqual(
    (b['[Content_Types].xml'].match(/worksheets\/sheet[0-9]+\.xml/g) || []).length,
    2,
    'Content_Types に2枚目が無いと Excel が開けない'
  );
});

test('styles の rId が、シートの rId と重ならない', () => {
  // ここが重なると Excel が「ファイルが壊れています」と言って開かない
  const b = ブックを組む([一枚, { name: 'B', headers: ['x'], rows: [] }, { name: 'C', headers: ['x'], rows: [] }]);
  const rels = b['xl/_rels/workbook.xml.rels'];
  const 番号たち = [...rels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]);
  assert.strictEqual(new Set(番号たち).size, 番号たち.length, 'rId が重なっている');
  assert.match(rels, /Id="rId4"[^>]*styles\.xml/, 'styles はシートの次の番号のはず');
});

test('先頭のシートだけ選ばれた状態にする', () => {
  const b = ブックを組む([一枚, { name: 'B', headers: ['x'], rows: [] }]);
  assert.match(b['xl/worksheets/sheet1.xml'], /tabSelected="1"/);
  assert.ok(!b['xl/worksheets/sheet2.xml'].includes('tabSelected'), '2枚目まで選ぶと表示が乱れる');
});

test('シート名が重なったら、後ろに番号を足して分ける', () => {
  const b = ブックを組む([
    { name: '記録', headers: ['x'], rows: [] },
    { name: '記録', headers: ['x'], rows: [] },
  ]);
  // definedName まで拾わないよう <sheet ...> に限る
  const 名たち = [...b['xl/workbook.xml'].matchAll(/<sheet name="([^"]+)"/g)].map((m) => m[1]);
  assert.strictEqual(new Set(名たち).size, 2, '同じ名前のシートが2枚あると Excel が開けない');
});

test('シート名の使えない字を置き換え、31字までに収める', () => {
  const b = ブックを組む([{ name: 'あ/い:う*え'.repeat(10), headers: ['x'], rows: [] }]);
  const 名 = b['xl/workbook.xml'].match(/<sheet name="([^"]+)"/)[1];
  assert.ok(名.length <= 31, '31字を超えている: ' + 名.length);
  assert.ok(!/[:\\/?*[\]]/.test(名), '使えない字が残っている: ' + 名);
});

test('数値は数値のまま、文字は inlineStr で書く', () => {
  const s = ブックを組む([一枚])['xl/worksheets/sheet1.xml'];
  assert.match(s, /<v>38\.9<\/v>/, '的中率が文字列になっている');
  assert.match(s, /t="inlineStr"[\s\S]*山田太郎/);
});

test('XML の特殊文字を escape する', () => {
  const s = ブックを組む([{ name: 'x', headers: ['<&">'], rows: [['a<b']] }])['xl/worksheets/sheet1.xml'];
  assert.ok(!/<t[^>]*>[^<]*<b/.test(s), 'エスケープされていない');
  assert.match(s, /a&lt;b/);
});

test('空欄はセルの中身を書かない', () => {
  const s = ブックを組む([{ name: 'x', headers: ['a', 'b'], rows: [['', null]] }])['xl/worksheets/sheet1.xml'];
  assert.match(s, /<c r="A2"\/>/);
  assert.match(s, /<c r="B2"\/>/);
});

test('シートが1枚も無ければ、黙って壊れたファイルを作らない', () => {
  assert.throws(() => ブックを組む([]), /シートが1枚も/);
  assert.throws(() => ブックを組む(null), /シートが1枚も/);
});
