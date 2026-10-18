/**
 * 「使い方を見る」の動画の窓（2026-10-19）。選ぶと動画と説明が出て、「実際にやってみる」で
 * 画面の上の案内に移る。動画の無い手順（説明だけ）は動画の枠を隠して文だけ出す。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100001.json' });

async function 選び窓を開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await page.waitForTimeout(4000);
  await page.locator('text=設定').locator('visible=true').last().click();
  await page.getByText('使い方を見る', { exact: true }).click();
}

test('使い方：動画が流れ、めくって「実際にやってみる」でその手順から案内が始まる', async ({ page }) => {
  await 選び窓を開く(page);
  await page.getByTestId('使い方の組-記録の取り方').click();
  await page.getByText('このまとまりを全部').click();
  const 動画 = page.getByTestId('使い方の動画');
  await expect(動画).toBeVisible();
  // 流れていること（止まった 0 秒のままでない）
  await expect
    .poll(() => 動画.evaluate((e) => e.currentTime), { timeout: 15_000 })
    .toBeGreaterThan(0.3);
  await page.getByLabel('次の手順').click();
  await page.getByLabel('次の手順').click();
  await expect(page.getByTestId('使い方の動画窓').getByText('誰の記録かを決めます')).toBeVisible();
  await page.getByTestId('使い方-やってみる').click();
  // 選んだ手順（3 番目）から残りの 3 つ
  await expect(page.locator('text=/^1 \/ 3$/')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('誰の記録かを決めます')).toBeVisible();
});

test('使い方：動画の無い手順は、動画の枠を出さずに文だけ見せる', async ({ page }) => {
  await 選び窓を開く(page);
  await page.getByTestId('使い方の組-記録表の便利な機能').click();
  await page.getByText('記録表は横にも並べられます', { exact: true }).click();
  await expect(page.getByTestId('使い方の動画窓')).toBeVisible();
  await expect(page.getByTestId('使い方の動画')).toHaveCount(0, { timeout: 15_000 });
  await page.getByText('一覧に戻る').click();
  await expect(page.getByTestId('使い方の選び窓')).toBeVisible();
});
