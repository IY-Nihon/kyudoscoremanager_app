/**
 * 写真で学習済みの網（scripts/ocr-cells/mobilenet.mjs・omomi-mobilenet.bin）と、その重みの取り寄せ（src/ocr/shashinNoMou.js）。
 * 板のマスは畳み込みの網で読み、迷ったマスだけこの網と混ぜる（src/ocr/yomu.js）。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

test('写真の網：重みの .bin を読むと、網 2 枚・迷いの境 0.9・畳み込みの網と同じ種類の順', async () => {
  const { 薄い網を組む } = await import('../scripts/ocr-cells/mobilenet.mjs');
  const 網 = 薄い網を組む(fs.readFileSync('scripts/ocr-cells/omomi-mobilenet.bin'));
  const 畳み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-tatami.json', 'utf8'));
  assert.strictEqual(網.網たち.length, 2);
  assert.strictEqual(網.迷いの境, 0.9);
  assert.strictEqual(網.辺, 32);
  assert.strictEqual(網.中の辺, 96);
  assert.deepStrictEqual(網.種類, 畳み.種類);
});

test('写真の網：JS で読んだ確からしさが、PyTorch で読んだものと 0.002 以内でそろう（板のマス 40 個）', async () => {
  const { 薄い網を組む, 薄い網で見分ける } = await import('../scripts/ocr-cells/mobilenet.mjs');
  const 網 = 薄い網を組む(fs.readFileSync('scripts/ocr-cells/omomi-mobilenet.bin'));
  const 見本 = JSON.parse(fs.readFileSync('test/ocrMobilenet.mihon.json', 'utf8'));
  const 画たち = Buffer.from(見本.画, 'base64');
  const n = 見本.辺 * 見本.辺;
  let 最大の差 = 0;
  let 合 = 0;
  見本.確からしさ.forEach((真, i) => {
    const p = 薄い網で見分ける(網, new Uint8Array(画たち.subarray(i * n, (i + 1) * n)), 見本.辺, 見本.辺);
    for (let k = 0; k < p.length; k++) 最大の差 = Math.max(最大の差, Math.abs(p[k] - 真[k]));
    if (p.indexOf(Math.max(...p)) === 見本.正解[i]) 合++;
  });
  assert.ok(最大の差 < 0.002, `差 ${最大の差}`);
  assert.strictEqual(合, 見本.確からしさ.length);
});

test('写真1枚まるごと：写真の網を足しても 320 射のうち 317 以上が記録と合い、迷ったマスだけを写真の網に回す', async () => {
  const { 板の印を読む, 大前から並べる } = await import('../src/ocr/yomu.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-tatami.json', 'utf8'));
  const 薄い重み = fs.readFileSync('scripts/ocr-cells/omomi-mobilenet.bin');

  const 元 = await 画を読む('docs/ocr-samples/PXL_20260906_081921509.jpg');
  const 板たち = await 板の印を読む(元, { 板の人数たち: [8, 8], 行数: 10, 回す, 重み, 薄い重み });
  let 合 = 0;
  let 番 = 0;
  板たち.forEach((板, i) => {
    for (const 列 of 大前から並べる(板.列たち, '左右から', i, 板たち.length)) {
      const 印 = マスを開く(一射目からの順にする(列, '下から'), '2射');
      const 真 = [...射手たち[番++].印];
      for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
    }
  });
  assert.ok(合 >= 317, `合ったのは ${合}/320`);
  const 回した = 板たち.reduce((s, b) => s + b.格子.写真の網で見た, 0);
  assert.ok(回した > 0 && 回した < 160, `写真の網に回したマス ${回した}`);
});

test('重みの取り寄せ：取れたら中身、取れなければ null で、次に読むときに取り直す', async () => {
  const { 写真の網の重みを読む, 写真の網の控えを捨てる } = require('../src/ocr/shashinNoMou');
  写真の網の控えを捨てる();
  let 呼んだ = 0;
  const だめ = { 場所: () => '/assets/x.bin', fetch: async () => (呼んだ++, { ok: false, status: 503 }) };
  const 元の警告 = console.warn;
  console.warn = () => {};
  try {
    assert.strictEqual(await 写真の網の重みを読む(だめ), null);
    const 中身 = new Uint8Array([1, 2, 3]);
    const よい = { 場所: () => '/assets/x.bin', fetch: async () => (呼んだ++, { ok: true, arrayBuffer: async () => 中身.buffer }) };
    assert.deepStrictEqual(Array.from(await 写真の網の重みを読む(よい)), [1, 2, 3]);
    // 取れたあとは取りに行かない
    await 写真の網の重みを読む(よい);
    assert.strictEqual(呼んだ, 2);
  } finally {
    console.warn = 元の警告;
    写真の網の控えを捨てる();
  }
});

test('重みの取り寄せ：上限を過ぎたら待たずに null（取り寄せは裏で続き、次の読み取りで使う）', async () => {
  const { 写真の網の重みを待つ, 写真の網の重みを読む, 写真の網の控えを捨てる } = require('../src/ocr/shashinNoMou');
  写真の網の控えを捨てる();
  let 渡す;
  const 遅い = { 場所: () => '/assets/x.bin', fetch: () => new Promise((r) => (渡す = r)) };
  assert.strictEqual(await 写真の網の重みを待つ(20, 遅い), null);
  渡す({ ok: true, arrayBuffer: async () => new Uint8Array([7]).buffer });
  assert.deepStrictEqual(Array.from(await 写真の網の重みを読む()), [7]);
  写真の網の控えを捨てる();
});
