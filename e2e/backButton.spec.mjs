/**
 * 戻るボタン（ブラウザ・Android の戻る）で、開いている窓や記録詳細を閉じる。
 *
 *   npx playwright test e2e/backButton.spec.mjs
 *
 * メンバーの詳細を開いたまま戻るを押すと、前にいた分析へ移り、メンバーの詳細が開いたまま
 * 残っていた（2026-09-26 に使う人から）。いまは戻るでまず窓を閉じ、もう一度押すと今までどおりタブを
 * 離れる（タブの移動は 2 つ目から履歴を置き換えるので、戻る先は最初のタブ）。
 * ×で閉じたときは積んだ履歴を消すので、戻る 1 回でタブを離れる（2 回押させない）。
 * 開いて閉じるだけで保存はしない（団体には書き込まない扱い）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ } from './helpers.mjs';

const 団体 = '100001';
test.use({ storageState: 'e2e/.auth/100001.json' });

const 戻る = async (page) => {
  await page.evaluate(() => window.history.back());
  await page.waitForTimeout(800);
};
const 住所 = (page) => new URL(page.url()).pathname;

async function 始める(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
}

test('メンバーの詳細を開いて戻ると、窓が閉じてメンバーの画面に残る。もう一度戻るとタブを離れる', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await 始める(page);
  await page.getByText('分析', { exact: true }).first().click();
  await expect.poll(() => 住所(page)).toContain('analysis');
  await page.getByText('メンバー', { exact: true }).first().click();
  await expect.poll(() => 住所(page)).toContain('members');
  await page.getByText('案内 確認用', { exact: true }).first().click();
  const 見出し = page.getByText('メンバー編集', { exact: true });
  await expect(見出し).toBeVisible({ timeout: 15_000 });

  await 戻る(page);
  await expect(見出し, '戻るで窓が閉じない').toBeHidden({ timeout: 5_000 });
  expect(住所(page), '窓を閉じるはずが、前のタブへ移った').toContain('members');

  await 戻る(page);
  // タブの移動は 2 つ目から履歴を置き換える（react-navigation の既定）ので、戻る先は最初のタブ。
  // ここで見るのは、窓が閉じたあとの戻るが、ふつうにメンバーの画面を離れること
  await expect
    .poll(() => 住所(page), { message: 'もう一度戻ってもメンバーの画面を離れない' })
    .not.toContain('members');
  await expect(見出し, '分析の上に窓が残った').toBeHidden();
});

test('×で閉じたあとは、戻る 1 回でタブを離れる（余計な履歴を残さない）', async ({ page }) => {
  test.setTimeout(180_000);
  await 始める(page);
  await page.getByText('分析', { exact: true }).first().click();
  await expect.poll(() => 住所(page)).toContain('analysis');
  await page.getByText('メンバー', { exact: true }).first().click();
  await expect.poll(() => 住所(page)).toContain('members');
  await page.getByText('案内 確認用', { exact: true }).first().click();
  const 見出し = page.getByText('メンバー編集', { exact: true });
  await expect(見出し).toBeVisible({ timeout: 15_000 });
  // 見出しの右の×（窓の中の最初の閉じるボタン）
  await page.locator('[aria-modal="true"]').last().locator('[tabindex="0"]').first().click();
  await expect(見出し).toBeHidden({ timeout: 5_000 });
  await page.waitForTimeout(500);

  await 戻る(page);
  await expect
    .poll(() => 住所(page), {
      message: '×で閉じたあと、戻る 1 回でメンバーの画面を離れない（余計な履歴が残った）',
    })
    .not.toContain('members');
});

test('履歴の記録詳細で戻ると、一覧に戻る（前のタブへは移らない）', async ({ page }) => {
  test.setTimeout(180_000);
  await 始める(page);
  await page.getByText('履歴', { exact: true }).first().click();
  await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page
    .getByText(/\[.+\]/)
    .first()
    .click({ timeout: 15_000 });
  await expect(page.getByText('記録詳細', { exact: true })).toBeVisible({ timeout: 15_000 });

  await 戻る(page);
  await expect(page.getByText('過去の記録表', { exact: true }), '戻るで一覧に戻らない').toBeVisible({
    timeout: 5_000,
  });
  expect(住所(page)).toContain('history');
});

test('記録画面の人を選ぶ窓も、戻るで閉じる', async ({ page }) => {
  test.setTimeout(180_000);
  await 始める(page);
  await page.getByText('記録', { exact: true }).first().click();
  await page.locator('[aria-label="射手を追加"]').first().click();
  await page.waitForTimeout(800);
  await page.getByText('選択', { exact: true }).first().click();
  const 見出し = page.getByText('メンバーを選択', { exact: true });
  await expect(見出し).toBeVisible({ timeout: 10_000 });

  await 戻る(page);
  await expect(見出し, '戻るで人を選ぶ窓が閉じない').toBeHidden({ timeout: 5_000 });
  expect(住所(page)).toContain('record');
});
