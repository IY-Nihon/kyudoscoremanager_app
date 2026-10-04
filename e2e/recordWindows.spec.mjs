/**
 * 記録画面の窓（表示の拡大率・射数）の検査（2026-10-05）。
 *
 *   npx playwright test e2e/recordWindows.spec.mjs
 *
 * 記録画面の窓を RecordScreen.js から別のファイル（RecordZoom.js・RecordShots.js ほか）へ切り出したときに
 * 足した。拡大率の窓を踏む E2E が無く、射数の窓も一覧から選ぶ道は踏んでいなかった。
 *  ・拡大率：「表示」を押すと窓が出る。⊕ で 5% 上がり、一覧から 150% を選ぶと表示の倍率が 1.5 になる
 *  ・射数：射数を押すと窓が出る。一覧から 12射 を選ぶと 12 射になる。自由入力の窓で 500 を超えると止まる
 *
 * ■ 団体には書き込まない
 * 表示の倍率と射数は端末の中だけ。盤面は保存しない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 確かに打つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

const 控え = (page) =>
  page.evaluate(
    () =>
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {}
  );

async function 記録画面へ(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('記録', { exact: true }).first().click();
  await expect(page.getByText('表示', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
}

test('拡大率の窓：開いて ⊕ で上がり、一覧から 150% を選べる', async ({ page }) => {
  await 記録画面へ(page);
  const 前 = (await 控え(page)).viewScale || 1;
  await page.getByText('表示', { exact: true }).first().click();
  const 大きく = page.locator('[aria-label="表示を大きくする"]');
  await expect(大きく, '拡大率の窓が出ない').toBeVisible({ timeout: 10_000 });
  await 大きく.click();
  await expect
    .poll(async () => Math.round(((await 控え(page)).viewScale || 1) * 100), { timeout: 10_000 })
    .toBe(Math.round(Math.min(2, 前 + 0.05) * 100));
  await page.getByText('150%', { exact: true }).click();
  await expect
    .poll(async () => (await 控え(page)).viewScale, {
      timeout: 10_000,
      message: '150% を選んでも倍率が変わらない',
    })
    .toBe(1.5);
});

test('射数の窓：一覧から 12射 を選べる。自由入力は 500 を超えると止まる', async ({ page }) => {
  await 記録画面へ(page);
  await page
    .getByText(/^\d+射$/)
    .first()
    .click();
  await expect(page.getByText('射数の設定', { exact: true }), '射数の窓が出ない').toBeVisible({
    timeout: 10_000,
  });
  await page.getByText('12射', { exact: true }).click();
  await expect.poll(async () => (await 控え(page)).shotsPerRound, { timeout: 10_000 }).toBe(12);

  // 自由入力（射数の窓の最後の行から）
  await page.getByText('12射', { exact: true }).first().click();
  await page.getByText('任意...', { exact: true }).click();
  const 欄 = page.getByLabel('射数', { exact: true });
  await expect(欄, '自由入力の窓が出ない').toBeVisible({ timeout: 10_000 });
  // WebKit では fill() の値が画面の状態に届かないことがあるので、1 字ずつ打って確かめる
  await 確かに打つ(欄, '600');
  await 欄.press('Enter');
  await expect(page.getByText('1〜500までの数字を入力してください', { exact: true }).first()).toBeVisible({
    timeout: 10_000,
  });
  expect((await 控え(page)).shotsPerRound, '500 を超えた射数が入った').toBe(12);
});
