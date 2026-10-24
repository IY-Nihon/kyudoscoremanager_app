/**
 * 手書きのノートの読み取り（scripts/ocr-cells/noto.mjs・noto-tatami.json）と、AI の JSON の直し（src/ocr/jsonNaoshi.js）。
 * 見本のマス（test/ocrNoto.mihon.json）は印だけの切り抜き（名前は入れない）。斜線で塗った ○ が半分
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

test('ノートの網：× ○ 他 の 3 種類・32 マス四方', () => {
  const 中身 = JSON.parse(fs.readFileSync('scripts/ocr-cells/noto-tatami.json', 'utf8'));
  assert.strictEqual(中身.形, 'CNN');
  assert.strictEqual(中身.辺, 32);
  assert.deepStrictEqual(中身.種類, ['×', '○', '他']);
});

test('ノートの網：見本の 40 マス（斜線で塗った ○ を含む）を全部当てる。紙の網は斜線の ○ を × と読む', async () => {
  const { 畳みの網を組む, 畳みで見分ける } = await import('../scripts/ocr-cells/tatami.mjs');
  const 見本 = JSON.parse(fs.readFileSync('test/ocrNoto.mihon.json', 'utf8'));
  const 画たち = Buffer.from(見本.画, 'base64');
  const n = 見本.辺 * 見本.辺;
  const 読む = (網) =>
    見本.正解.filter((正, i) => {
      const p = 畳みで見分ける(網, new Uint8Array(画たち.subarray(i * n, (i + 1) * n)), 見本.辺, 見本.辺);
      return (p[1] > p[0] ? 1 : 0) === 正;
    }).length;
  const ノート = 畳みの網を組む(JSON.parse(fs.readFileSync('scripts/ocr-cells/noto-tatami.json', 'utf8')));
  const 紙 = 畳みの網を組む(JSON.parse(fs.readFileSync('scripts/ocr-cells/kami-tatami.json', 'utf8')));
  assert.strictEqual(読む(ノート), 40);
  assert.ok(読む(紙) < 35, `紙の網 ${読む(紙)}`);
});

test('写真を整える：幅 1600 に縮め、逆さなら 180 度回す', async () => {
  const { 写真を整える } = await import('../scripts/ocr-cells/noto.mjs');
  const 幅 = 3200,
    高 = 2400;
  const 画素 = new Uint8Array(幅 * 高).fill(200);
  for (let x = 0; x < 100; x++) 画素[x] = 0; // 左上の角だけ暗い
  const 正 = 写真を整える({ 画素, 幅, 高 });
  assert.strictEqual(正.幅, 1600);
  assert.strictEqual(正.高, 1200);
  const 逆 = 写真を整える({ 画素, 幅, 高 }, true);
  assert.ok(正.画素[0] < 正.画素[正.画素.length - 1]);
  assert.ok(逆.画素[逆.画素.length - 1] < 逆.画素[0]);
});

test('AI の JSON の直し：閉じ括弧の不足・囲み・余計なカンマは直し、直せないものは元の誤りを投げる', () => {
  const { AIのJSONを読む } = require('../src/ocr/jsonNaoshi.js');
  assert.deepStrictEqual(AIのJSONを読む('{"teams":[{"rows":[{"cells":["○","×"]}]'), {
    teams: [{ rows: [{ cells: ['○', '×'] }] }],
  });
  assert.deepStrictEqual(AIのJSONを読む('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepStrictEqual(AIのJSONを読む('{"a":[1,2,],}'), { a: [1, 2] });
  assert.deepStrictEqual(AIのJSONを読む('{"a":"x]}"'), { a: 'x]}' });
  assert.deepStrictEqual(AIのJSONを読む('{"a":["○\\","×"]}'), { a: ['○\\', '×'] });
  // 同じ返事の中に "○\"（閉じない）と "○\""（行の最後）が混ざる
  assert.deepStrictEqual(AIのJSONを読む('{"a":["○\\",\n"○\\""\n]}'), { a: ['○\\', '○\\'] });
  assert.throws(() => AIのJSONを読む('読めません'), SyntaxError);
});
