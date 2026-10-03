/**
 * 記録表の「矢所の行」（各列の下に並ぶ、その列の人の小さな的）の検査（2026-10-04）。
 *
 *   npx playwright test e2e/arrowRow.spec.mjs
 *
 * 矢所の記録を ON にしていても、置いた矢所は窓を開き直さないと見えなかった。ますの隅の小さな的は読めず、
 * 右や下のパネルは見比べる手間があり、全員を 1 つの的に重ねる案は 20 人で読めない。そこで、表の各列の
 * 下に、列と同じ幅・同じ位置で、その人の的を並べた（src/ArrowRow.js・src/arrowRowRules.js）。
 *
 * ■ 団体には書き込まない
 * 盤面は端末の中だけ（保存しない）。矢所の ON と見せ方は端末の設定で、雲へは送られない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

async function 始める(page, 矢所を使う) {
  await 案内を止める(page);
  await page.addInitScript((使う) => {
    const 鍵 = 'archery-score-storage';
    const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
    const 状態 = (中 && 中.state) || {};
    状態.enableArrowLocation = 使う;
    状態.矢所の行 = '全部';
    localStorage.setItem(鍵, JSON.stringify(Object.assign({}, 中, { state: 状態 })));
  }, 矢所を使う);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('記録', { exact: true }).first().click();
  await page.locator('[aria-label="射手を追加"]').first().click();
  await expect(page.locator('[data-testid^="ます-"]').first(), '盤面にますが出ない').toBeVisible({ timeout: 20_000 });
}

test('矢所の記録が OFF のときは、矢所の行を出さない', async ({ page }) => {
  await 始める(page, false);
  await expect(page.getByTestId('矢所の行の見出し')).toHaveCount(0);
  await expect(page.locator('[data-testid^="矢所の行-"]')).toHaveCount(0);
});

test('矢所を置くと、その列の下の的に点が載る。見出しで見せ方が変わり、的を押すと窓が開く', async ({ page }) => {
  await 始める(page, true);
  const ます = page.locator('[data-testid^="ます-"]');
  const 見出し = page.getByTestId('矢所の行の見出し');
  const 的 = page.locator('[data-testid^="矢所の行-"]');
  await expect(見出し, '矢所の行の見出しが出ない').toBeVisible({ timeout: 10_000 });
  await expect(的, '射手の列の下に的が無い').toHaveCount(1);

  // 列と同じ幅・同じ位置（左右がそろう）。表のます（その列の 1 つ）と見比べる
  const ますの枠 = await ます.first().boundingBox();
  const 的の枠 = await 的.first().boundingBox();
  expect(Math.abs(的の枠.x - ますの枠.x), '的が列とそろっていない（左端）').toBeLessThanOrEqual(2);
  expect(Math.abs(的の枠.width - ますの枠.width), '的が列とそろっていない（幅）').toBeLessThanOrEqual(2);
  expect(的の枠.y, '的が列の下に無い').toBeGreaterThan(ますの枠.y);

  // 矢所を置く。置く前は的を押しても窓は開かない
  await 的.first().click({ force: true });
  await expect(page.getByText('矢所の記録', { exact: false })).toHaveCount(0);
  await ます.nth(0).click();
  await expect(page.getByText('矢所の記録', { exact: false }).first(), '矢所の窓が開かない').toBeVisible({ timeout: 10_000 });
  const 窓 = page.viewportSize();
  await page.mouse.click(窓.width / 2 + 40, 窓.height / 2 + 30);
  await page.getByText('完了', { exact: true }).click();

  // 見せ方：全部 → この立 → 隠す → 全部。隠すと的は消え、見出しだけ細く残る
  await expect(見出し).toContainText('全部');
  await 見出し.click();
  await expect(見出し).toContainText('この立');
  const 高さ = (await 的.first().boundingBox()).height;
  await 見出し.click();
  const 隠した高さ = (await 的.first().boundingBox()).height;
  expect(隠した高さ, '隠しても行の高さが変わらない').toBeLessThan(高さ);
  await 見出し.click();
  await expect(見出し).toContainText('全部');

  // 的を押すと、その人の矢所の窓が開く
  await 的.first().click();
  await expect(page.getByText('矢所の記録', { exact: false }).first(), '的を押しても窓が開かない').toBeVisible({ timeout: 10_000 });
  // 窓：置き済みの案内と、的に載せる範囲（この立 / 全部の射）の切り替え
  await expect(page.getByText('置き済みです', { exact: false }), '置き済みの案内が出ない').toBeVisible();
  await expect(page.getByTestId('矢所の窓-範囲-立')).toBeVisible();
  await page.getByTestId('矢所の窓-範囲-全部').click();
  await page.getByTestId('矢所の窓-範囲-立').click();
  await page.getByText('完了', { exact: true }).click();
});
