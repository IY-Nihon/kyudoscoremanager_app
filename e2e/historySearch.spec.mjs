/**
 * 履歴の検索は、1 字ずつ打っても字が途切れず、結果が絞られる。
 *
 *   npx playwright test e2e/historySearch.spec.mjs
 *
 * 2026-09-26 に、検索・タグ・年度・月の欄を一覧の頭（FlatList の ListHeaderComponent）へ
 * 移した（画面の大きさによって一覧の高さが 0 になり、記録が出なかったため）。一覧の頭の中の
 * 入力欄は、描き直しで作り直されると打つたびに字が落ちるので、それが無いことを確かめる。
 * 打つだけで保存はしない（団体には書き込まない扱い）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ } from './helpers.mjs';

const 団体 = '100001';
test.use({ storageState: 'e2e/.auth/100001.json' });

test('履歴の検索：1 字ずつ打っても字が途切れず、結果が出る', async ({ page }) => {
  test.setTimeout(180_000);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await page.getByText('履歴', { exact: true }).first().click();
  await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });

  const 欄 = page.getByPlaceholder('日付や内容を検索（全期間対象）');
  await 欄.click();
  await 欄.pressSequentially('2026', { delay: 120 });
  await expect(欄, '打つたびに字が落ちた（一覧の頭で入力欄が作り直されている）').toHaveValue('2026');
  await expect(page.getByText('の全期間検索結果', { exact: false })).toBeVisible({ timeout: 10_000 });
  // 絞った結果の記録を開ける
  await page
    .getByText(/\[.+\]/)
    .first()
    .click({ timeout: 10_000 });
  await expect(page.getByText('記録詳細', { exact: true })).toBeVisible({ timeout: 15_000 });
});
