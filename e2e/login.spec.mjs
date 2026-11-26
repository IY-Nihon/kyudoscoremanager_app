/**
 * ログインそのものの検査。
 *
 * 各検査は控え（auth.setup.mjs）を読み込んで始めるので、ふだんは
 * ログイン画面を通らない。そのぶんの穴を、ここで機種ごとに埋める。
 * 控えを使わず、素の状態から団体IDと合言葉で入れることを見る。
 */
import { test, expect } from '@playwright/test';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

const 団体 = '100001';
const 合言葉 = 検証のパスワード();

// 控えを使わない。まっさらな端末として始める
test.use({ storageState: { cookies: [], origins: [] } });

test('団体IDと合言葉で入れる', async ({ page }) => {
  await page.goto('/');
  const 番号欄 = page.getByPlaceholder('例: 123456');
  await 番号欄.waitFor({ state: 'visible', timeout: 60_000 });
  await 番号欄.click();
  await 番号欄.pressSequentially(団体, { delay: 20 });
  const 合言葉欄 = page.locator('input[type="password"]').first();
  await 合言葉欄.click();
  await 合言葉欄.pressSequentially(合言葉, { delay: 20 });
  await page.getByText('ログイン', { exact: true }).click();

  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const s =
            JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
              ?.state || {};
          return s.activeGroupId || null;
        }),
      { timeout: 90_000, message: 'ログインが通らない（団体IDが入らない）' }
    )
    .toBe(団体);
});

test('合言葉が違うと入れない', async ({ page }) => {
  await page.goto('/');
  const 番号欄 = page.getByPlaceholder('例: 123456');
  await 番号欄.waitFor({ state: 'visible', timeout: 60_000 });
  await 番号欄.click();
  await 番号欄.pressSequentially(団体, { delay: 20 });
  const 合言葉欄 = page.locator('input[type="password"]').first();
  await 合言葉欄.click();
  await 合言葉欄.pressSequentially('ちがう合言葉', { delay: 20 });
  await page.getByText('ログイン', { exact: true }).click();

  // 断られたことがアプリの中で知らされ、ログイン画面のまま
  await expect(page.getByTestId('アプリの帯').or(page.getByTestId('アプリの窓'))).toBeVisible({
    timeout: 30_000,
  });
  await expect(番号欄).toBeVisible();
});

test('入力漏れは窓でなく欄の下に出て、字を入れ始めると消える（2026-11-26 U5）', async ({ page }) => {
  await page.goto('/');
  const 番号欄 = page.getByPlaceholder('例: 123456');
  await 番号欄.waitFor({ state: 'visible', timeout: 60_000 });
  // 団体ログイン：両方空
  await page.getByText('ログイン', { exact: true }).click();
  await expect(page.getByTestId('入力の誤り-団体ID')).toHaveText('団体IDを入力してください');
  await expect(page.getByTestId('入力の誤り-パスワード')).toHaveText('パスワードを入力してください');
  await expect(page.getByTestId('アプリの帯').or(page.getByTestId('アプリの窓'))).toHaveCount(0);
  // 打ち始めた欄だけ消える
  await 番号欄.click();
  await 番号欄.pressSequentially('1', { delay: 20 });
  await expect(page.getByTestId('入力の誤り-団体ID')).toHaveCount(0);
  await expect(page.getByTestId('入力の誤り-パスワード')).toBeVisible();
  // 個人ログインへ替えると消え、個人ID の漏れだけ出る
  await page.getByText('個人', { exact: true }).click();
  await expect(page.getByTestId('入力の誤り-パスワード')).toHaveCount(0);
  await page.getByText('ログイン', { exact: true }).click();
  await expect(page.getByTestId('入力の誤り-個人ID')).toHaveText('個人IDを入力してください');
  await expect(page.getByTestId('入力の誤り-団体ID')).toHaveCount(0);
});
