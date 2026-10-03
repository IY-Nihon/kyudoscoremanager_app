/**
 * 記録画面のますに、置いた矢所の「ミニの的」が出ることの検査（2026-10-04）。
 *
 *   npx playwright test e2e/arrowMini.spec.mjs
 *
 * 矢所の記録を ON にしていても、置いた矢所は窓を開き直さないと見えなかった。ますの隅に小さな的を
 * 出し、どこへ外れたかを記録画面のまま一覧できるようにした（src/ScoreCell.js の ミニの的）。
 *
 * ■ 団体には書き込まない
 * 盤面は端末の中だけ（保存しない）。矢所の ON は端末の設定で、雲へは送られない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

test('矢所を置いたますだけに、ミニの的が出る', async ({ page }) => {
  await 案内を止める(page);
  // 矢所の記録を ON にして始める（読み込みより先に控えへ書く）
  await page.addInitScript(() => {
    const 鍵 = 'archery-score-storage';
    const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
    const 状態 = (中 && 中.state) || {};
    状態.enableArrowLocation = true;
    localStorage.setItem(鍵, JSON.stringify(Object.assign({}, 中, { state: 状態 })));
  });
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('記録', { exact: true }).first().click();
  await page.locator('[aria-label="射手を追加"]').first().click();
  const ます = page.locator('[data-testid^="ます-"]');
  await expect(ます.first(), '盤面にますが出ない').toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('ミニの的'), '矢所を置く前に出ている').toHaveCount(0);

  // 1 つ目のますを○にして、窓が開いたら的を押して置く
  await ます.nth(0).click();
  await expect(page.getByText('矢所の記録', { exact: false }).first(), '矢所の窓が開かない').toBeVisible({ timeout: 10_000 });
  const 窓 = page.viewportSize();
  await page.mouse.click(窓.width / 2, 窓.height / 2 + 30);
  await page.getByText('完了', { exact: true }).click();

  // 置いたますにだけ出る（2 つ目は○だけで、矢所は置かない）
  await expect(page.getByTestId('ミニの的'), '置いた矢所がますに出ない').toHaveCount(1, { timeout: 10_000 });
  await ます.nth(1).click();
  await expect(page.getByText('矢所の記録', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  await page.getByText('完了', { exact: true }).click(); // 置かずに閉じる
  await expect(page.getByTestId('ミニの的'), '置いていないますにも出ている').toHaveCount(1);
});
