/**
 * 出欠画面が開き、出席率の一覧が出ることを見る。
 *
 *   npx playwright test e2e/attendanceScreen.spec.mjs
 *
 * 出欠の数え方（attendanceRules の その日の出欠・練習日で数える）を画面と AI チャットで
 * 共有した（2026-09-20）ので、画面が前と同じに出ることをここで押さえる。
 * 読むだけ。団体には何も書かない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

test('出欠画面：出席率の一覧と練習日設定が出る', async ({ page }) => {
  test.setTimeout(120_000);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('出欠', { exact: true }).first().click();
  // 出席率の一覧（○○.○%）が部員の数だけ出る
  const 率 = page.getByText(/^\d+\.\d%$/);
  await expect(率.first()).toBeVisible({ timeout: 30_000 });
  expect(await 率.count()).toBeGreaterThan(0);
  // 練習日設定に切り替わる
  await page.getByText('練習日設定', { exact: true }).click();
  await expect(page.getByText(/月の練習日数/)).toBeVisible();
});
