/**
 * 端末での○×の読み取り（src/ocr/yomu.js）を、本物の写真で通す。
 * 写真1枚まるごと（板2枚・16人）を Node の画像の道具で読み、本番の記録と比べる。
 * アプリと同じ道（板ごとの格子 → マス → 大前から並べる → マスを開く）を通す。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

test('写真1枚まるごとを端末の読み取りで読むと、320射のうち315以上が記録と合う', async () => {
  const { 板の印を読む, 大前から並べる } = await import('../src/ocr/yomu.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));

  const 元 = await 画を読む('docs/ocr-samples/PXL_20260906_081921509.jpg');
  const 板たち = await 板の印を読む(元, { 板の人数たち: [8, 8], 行数: 10, 回す, 重み });
  assert.strictEqual(板たち.length, 2);

  // 左の板は左から大前、右の板は右から大前（「左右から」）。板は下から書く
  let 合 = 0;
  let 番 = 0;
  板たち.forEach((板, i) => {
    const 列たち = 大前から並べる(板.列たち, '左右から', i, 板たち.length);
    for (const 列 of 列たち) {
      const 印 = マスを開く(一射目からの順にする(列, '下から'), '2射');
      const 真 = [...射手たち[番++].印];
      for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
    }
  });
  assert.ok(合 >= 315, `合ったのは ${合}/320`);
});
