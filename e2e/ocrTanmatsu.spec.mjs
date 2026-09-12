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

// ── 確認画面まで通す ─────────────────────────────────────────
// Gemini の返事は差し替える（名前と並びだけ返し、マスは空）。○×は端末が読む。
// 途中交代の段（射手10の4段目、確からしさ 0.42）が「迷ったマス」として色付きで出て、
// タップすると色が消えることを見る
import { 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';

test.describe('確認画面', () => {
  test.use({ storageState: 'e2e/.auth/100007.json' });

  test('端末で読んだ○×が確認画面に出て、迷ったマスに色が付く', async ({ page }) => {
    test.setTimeout(300_000);
    const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
    // Gemini の返事（名前は本番の記録の番号。マスは全部空）
    const 返事 = {
      teams: [0, 1].map((i) => ({
        name: '', cellStyle: '2射', tachiPeople: 4,
        rows: 射手たち.slice(i * 8, i * 8 + 8).map((s) => ({ name: s.名, cells: Array(10).fill('') })),
      })),
    };
    await page.route(/generativelanguage\.googleapis\.com/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(返事) }] }, finishReason: 'STOP' }] }),
      })
    );

    await 案内を止める(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await 入り口が決まるまで待つ(page);
    await 団体で入る(page, '100007', 'StgTest!2026');
    // 板は10段（20射）。団体の設定は8射なので、端末に残る設定だけ20射にして開き直す
    await page.evaluate(() => {
      const 鍵 = 'archery-score-storage';
      const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
      中.state = { ...(中.state || {}), shotsPerRound: 20 };
      localStorage.setItem(鍵, JSON.stringify(中));
    });
    await page.reload();
    await 画面が出るまで待つ(page);
    await 入り口が決まるまで待つ(page);
    await page.waitForFunction(() => window.端末の読み取り != null, null, { timeout: 60_000 });

    await page.getByText('画像', { exact: true }).first().click();
    await page.getByText('紙の記録', { exact: true }).click();
    await page.getByText('板が2つ（外側が大前）', { exact: true }).click();
    await page.getByText('下から書く', { exact: true }).click();
    const 選ぶ = page.waitForEvent('filechooser');
    await page.getByText('画像を選択', { exact: true }).click();
    await (await 選ぶ).setFiles('docs/ocr-samples/PXL_20260906_081921509.jpg');
    await expect(page.getByText('1枚目', { exact: true })).toBeVisible();
    await page.getByText('この画像で解析する', { exact: true }).click();

    await expect(page.getByText('○×は端末で読み取りました（名前と並びはAI）。')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText('読み取りが迷ったマス', { exact: true })).toBeVisible();
    // 迷ったマスには途中交代の段（2射）が入る。canvas の復号はブラウザで少し違い、
    // 際どいマスがほかに数個入ることがある（Chromium で3マス）。多すぎなければよい
    const 迷い = page.getByTestId('ocr-mayoi-cell');
    const 数 = await 迷い.count();
    expect(数, `迷ったマスが ${数}射`).toBeGreaterThanOrEqual(2);
    expect(数, `迷ったマスが ${数}射（多すぎる）`).toBeLessThanOrEqual(12);
    if (process.env.PW_SHOT) {
      await 迷い.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: process.env.PW_SHOT });
    }
    // タップして直すと、そのマスの色は消える
    await 迷い.first().click();
    await expect(迷い).toHaveCount(数 - 1);
  });
});
