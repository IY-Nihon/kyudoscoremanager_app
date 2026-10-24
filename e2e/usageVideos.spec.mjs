/**
 * 「使い方を見る」の一覧（2026-10-19）。項目を押すとその場で開いて動画と説明が出て、
 * 「画面でやってみる」でその手順だけ画面の上の案内が始まる。動画の無い手順は文だけ出す。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100001.json' });

async function 一覧を開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await page.waitForTimeout(4000);
  await page.locator('text=設定').locator('visible=true').last().click();
  await page.getByText('使い方を見る', { exact: true }).click();
  await expect(page.getByTestId('使い方の選び窓')).toBeVisible();
}

test('使い方：項目を押すとその場で動画が流れ、「画面でやってみる」でその手順だけ案内が始まる', async ({
  page,
}) => {
  await 一覧を開く(page);
  await page.getByTestId('使い方の組-記録を取る').click();
  // 一覧では短い名で出す
  await expect(page.getByText('射手を並べて名前を決める', { exact: true })).toBeVisible();
  await page.getByTestId('使い方の項目-射手を並べて名前を決める').click();
  const 動画 = page.getByTestId('使い方の動画').first(); // まとめた項目は小見出しごとに動画がある
  await expect(動画).toBeVisible();
  await expect.poll(() => 動画.evaluate((e) => e.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.3);
  // 別の項目を開くと前のは閉じる
  await page.getByTestId('使い方の項目-○×を入れる').click();
  await expect(page.getByTestId('使い方の中身')).toHaveCount(1);
  await page.getByTestId('使い方-やってみる').click();
  await expect(page.locator('text=/^1 / 1$/')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('○×は押して入れます')).toBeVisible();
});

test('使い方：動画の無い手順は、動画の枠を出さずに文だけ見せる', async ({ page }) => {
  await 一覧を開く(page);
  await page.getByTestId('使い方の組-ライブ（複数の端末）').click();
  await page.getByTestId('使い方の項目-ライブをリンクで配る').click();
  await expect(page.getByTestId('使い方の中身')).toBeVisible();
  await expect(page.getByTestId('使い方の動画')).toHaveCount(0, { timeout: 15_000 });
});

test('使い方：一覧にだけある項目と困りごとは、文（と動画）だけで「画面でやってみる」は出さない', async ({
  page,
}) => {
  await 一覧を開く(page);
  await page.getByTestId('使い方の組-よくある困りごと').click();
  await page.getByTestId('使い方の項目-入れた○×が手や袖で消えてしまう').click();
  await expect(page.getByTestId('使い方の中身')).toContainText('長押し');
  await expect(page.getByTestId('使い方の動画')).toBeVisible();
  await expect(page.getByTestId('使い方-やってみる')).toHaveCount(0);
});
