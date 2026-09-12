/**
 * 団体アカウントを作ってから消すまでを、画面から通す（検証環境）。
 *
 *   npx playwright test e2e/accountDeletionFull.spec.mjs
 *
 * 使い捨ての団体を新規作成し、管理者モードをオンにして「アカウントを削除する」を押し、
 * 団体IDでログインできなくなったことまで見る。作った団体は自分で消すので、
 * 検証環境に残らない（写しは deleted_accounts に30日残る）。
 * 団体には書き込まない（自分で作った団体しか触らない）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test('団体アカウントを作って、設定から削除すると、その団体IDでは入れなくなる', async ({ page }) => {
  test.setTimeout(600_000);
  const t0 = Date.now();
  const 印 = (何) => console.log(`STEP ${((Date.now() - t0) / 1000).toFixed(0)}s ${何}`);
  const 宛先 = `del-e2e-${Date.now()}@example.com`;
  const 合言葉 = 'DelE2e!2026';

  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);

  印('作る');
  // ── 作る ──
  await page.getByText('団体アカウントを新規作成する', { exact: true }).click();
  await page.getByPlaceholder('例: ○○弓道部').fill('削除の検査');
  await page.getByPlaceholder('example@mail.com').fill(宛先);
  await page.getByPlaceholder('••••••••').last().fill(合言葉);
  await page.getByText('に同意します', { exact: false }).click();
  await page.getByText('部員の氏名を登録する前に', { exact: false }).click();
  await page.getByText('アカウント作成', { exact: true }).click();
  await expect(page.getByText('団体アカウントを作成しました', { exact: false })).toBeVisible({ timeout: 60_000 });
  const 文 = await page.getByText('団体ID:', { exact: false }).first().textContent();
  const 団体ID = (文.match(/団体ID:\s*(\d{6})/) || [])[1];
  expect(団体ID, '団体IDが読めない: ' + 文).toMatch(/^\d{6}$/);
  await page.getByText('OK', { exact: true }).click();
  // 作ったあとは入口に戻り、団体IDとパスワードが入った状態になる。ログインを押して入る
  await expect(page.getByPlaceholder('例: 123456')).toHaveValue(団体ID, { timeout: 30_000 });
  await page.getByText('ログイン', { exact: true }).click();
  await expect(page.getByText('ログアウト', { exact: true }).or(page.getByText('記録', { exact: true }).first())).toBeVisible({ timeout: 60_000 });

  印('入った');
  // ── 設定 → 管理者モード ──
  await page.getByText('設定', { exact: true }).first().click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('アカウントを削除する', { exact: true })).toHaveCount(0);
  await page.getByText('管理者モード', { exact: true }).scrollIntoViewIfNeeded().catch(() => {});
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

  印('管理者モード');
  // ── 消す ──
  const 削除の行 = page.getByText('アカウントを削除する', { exact: true });
  await 削除の行.scrollIntoViewIfNeeded().catch(() => {});
  await 削除の行.click();
  await expect(page.getByText('続けるには団体パスワードを入力してください。')).toBeVisible({ timeout: 10_000 });
  await page.getByPlaceholder('団体パスワード').fill(合言葉);
  await page.getByText('削除する', { exact: true }).click();
  印('削除を押した');
  await expect(page.getByText('団体アカウントを削除しました', { exact: false })).toBeVisible({ timeout: 180_000 });
  印('削除できた');
  // 知らせの窓は、入口に戻る描き直しで消えることがある。出ていれば閉じる
  const ok = page.getByText('OK', { exact: true });
  if (await ok.isVisible().catch(() => false)) await ok.click().catch(() => {});

  印('OK を押した');
  // ── 入口へ戻り、その団体IDでは入れない ──
  await expect(page.getByPlaceholder('例: 123456')).toBeVisible({ timeout: 30_000 });
  await page.getByPlaceholder('例: 123456').fill(団体ID);
  await page.locator('input[type="password"]').first().fill(合言葉);
  await page.getByText('ログイン', { exact: true }).click();
  await expect(page.getByText('団体IDまたはパスワードが正しくありません', { exact: false })).toBeVisible({ timeout: 30_000 });
});
