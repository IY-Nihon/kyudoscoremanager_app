/**
 * 設定の「アカウントを削除する」の見え方の検査。
 *
 *   npx playwright test e2e/accountDeletion.spec.mjs
 *
 * 見るのは入口だけ。
 *   ・管理者モードがオフのときは行が無い
 *   ・オンにすると行が出て、押すと警告の窓が出る
 *   ・パスワードを入れるまで「削除する」は押せない
 *   ・キャンセルで閉じる
 * 実際に消す流れは test/accountDeletion.test.js（偽の Firestore）と
 * scripts/check-account-deletion.mjs（検証環境の決まり）で見る。ここでは消さない。
 * 団体には書き込まない（途中交代の検査と同じ 100007 を読むだけ）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';

const 団体 = '100007';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100007.json' });

test('アカウントの削除：管理者モードのときだけ行が出て、警告の窓はパスワード無しでは進めない', async ({ page }) => {
  test.setTimeout(180_000);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);

  await page.getByText('設定', { exact: true }).first().click();
  await page.waitForTimeout(1500);
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('アカウントを削除する', { exact: true }), '管理者モードでないのに行がある').toHaveCount(0);

  // 管理者モードをオンにする（団体パスワードで認証）
  const 行 = page.getByText('管理者モード', { exact: true });
  await 行.scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(() => {
    const 行 = [...document.querySelectorAll('div')].find((e) => (e.textContent || '').trim() === '管理者モード');
    let 親 = 行;
    for (let i = 0; i < 6 && 親; i++) {
      const 切替 = 親.querySelector('input[type="checkbox"], [role="switch"]');
      if (切替) return void 切替.click();
      親 = 親.parentElement;
    }
  });
  await expect(page.getByText('管理者認証', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder('パスワード').fill(合言葉);
  await page.getByText('認証', { exact: true }).click();
  await expect(page.getByText('管理者認証', { exact: true })).toHaveCount(0, { timeout: 30_000 });

  const 削除の行 = page.getByText('アカウントを削除する', { exact: true });
  await 削除の行.scrollIntoViewIfNeeded().catch(() => {});
  await expect(削除の行, '管理者モードなのに行が無い').toBeVisible({ timeout: 15_000 });
  await 削除の行.click();

  await expect(page.getByText('続けるには団体パスワードを入力してください。')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('削除後30日間は復旧のために運営者が保管し')).toBeVisible();
  const 削除する = page.getByText('削除する', { exact: true });
  await expect(削除する).toBeVisible();
  // パスワードが空のうちは押しても何も起きない（窓が残る）
  await 削除する.click({ force: true });
  await page.waitForTimeout(800);
  await expect(page.getByText('続けるには団体パスワードを入力してください。')).toBeVisible();
  await expect(page.getByText('削除中…', { exact: true })).toHaveCount(0);

  if (process.env.PW_SHOT) await page.screenshot({ path: process.env.PW_SHOT });
  await page.getByText('キャンセル', { exact: true }).click();
  await expect(page.getByText('続けるには団体パスワードを入力してください。')).toHaveCount(0, { timeout: 10_000 });
  // 団体はそのまま
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible();
});
