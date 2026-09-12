// 板の○×を端末（ブラウザの canvas）で読む道が、本物の写真で通るかを確かめる。
// Node の試験（test/ocrYomu.test.js）は sharp で画を読むので、canvas で読んだときに
// 同じ数字になるかはここでしか分からない。
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { 案内を止める } from './helpers.mjs';

test('写真1枚まるごとを canvas で読むと、320射のうち312以上が記録と合う', async ({ page }) => {
  test.setTimeout(240_000);
  await 案内を止める(page);
  await page.goto('/');
  await page.waitForFunction(() => window.端末の読み取り != null, null, { timeout: 60_000 });

  const base64 = fs.readFileSync('docs/ocr-samples/PXL_20260906_081921509.jpg').toString('base64');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = await import('../src/ocrCells.js');
  const { 大前から並べる } = await import('../src/ocr/yomu.js');

  const 板たち = await page.evaluate(
    ([b64]) => window.端末の読み取り.板の印を読む(b64, [8, 8], 10),
    [base64]
  );
  expect(板たち.length).toBe(2);
  let 合 = 0;
  let 番 = 0;
  板たち.forEach((板, i) => {
    for (const 列 of 大前から並べる(板.列たち, '左右から', i, 板たち.length)) {
      const 印 = マスを開く(一射目からの順にする(列, '下から'), '2射');
      const 真 = [...射手たち[番++].印];
      for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
    }
  });
  // Chromium は 317、WebKit は 314（JPEG の復号がわずかに違い、3マスが揺れる）。
  // 合計の列を射手の列と取り違えたときは 295 まで落ちたので、312 なら格子は合っている
  expect(合, `合ったのは ${合}/320`).toBeGreaterThanOrEqual(312);
});

test('紙の写真をページ全体から canvas で読むと、80射のうち79以上が記録と合う', async ({ page }) => {
  test.setTimeout(240_000);
  await 案内を止める(page);
  await page.goto('/');
  await page.waitForFunction(() => window.端末の読み取り != null, null, { timeout: 60_000 });

  const base64 = fs.readFileSync('docs/ocr-samples/1788683956272.jpg').toString('base64');
  const { 紙の射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = await import('../src/ocrCells.js');
  const { 大前から並べる } = await import('../src/ocr/yomu.js');

  const 紙 = await page.evaluate(([b64]) => window.端末の読み取り.紙の印を読む(b64, 4, 5, 4), [base64]);
  let 合 = 0;
  大前から並べる(紙.列たち, '右から', 0, 1).forEach((列, i) => {
    const 印 = マスを開く(一射目からの順にする(列, '下から'), '1射');
    const 真 = [...紙の射手たち[i].印];
    expect(印.length).toBe(真.length);
    for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
  });
  expect(合, `合ったのは ${合}/80`).toBeGreaterThanOrEqual(79);
});
