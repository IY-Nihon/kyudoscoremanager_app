/**
 * 管理者モードの履歴から、記録を記録画面に載せて直す。
 *
 *   npx playwright test e2e/historyEditInRecord.spec.mjs
 *
 * 履歴の詳細で直せるのは ○×・名前・鍵・削除だけで、人や間隔や計を足す・並べ替える・矢所は
 * できなかった（使う人：「普通の記録表でできることをすべて」2026-09-17）。
 * 「記録画面で直す」を押すと記録が記録画面に乗り、道具は全部そのまま使える。
 *
 * 見るのは
 *   ・三本線の窓の「記録画面で直す」を押すと記録画面に移り、帯が出て、記録の人が並ぶ
 *   ・「人」で人を足せる（記録画面の道具が効く）
 *   ・「やめる」で履歴の詳細に戻り、記録は変わっていない。記録画面は直す前の盤面に戻る
 * 団体には書き込まない（保存の道は test/historyEditInRecord.test.js で見ている）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る, こうなるまで待つ } from './helpers.mjs';

const 団体 = '100007';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100007.json' });

/** 設定の画面で管理者モードを入れる（団体パスワードで認証） */
async function 管理者モードにする(page) {
  await page.getByText('設定', { exact: true }).first().click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
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
}

/** 記録画面の名前の欄に並ぶ名前 */
async function 記録画面の名前たち(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-testid^="名の欄-射手-"]')].map((e) => (e.innerText || '').split('\n')[0].trim())
  );
}

test('管理者モードの履歴から記録画面で直し、やめると元に戻る', async ({ page }) => {
  test.setTimeout(240_000);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);

  // 記録画面に「いま記録中」の人を 1 人立てておく（戻ったときに残っているかを見る）
  await page.getByText('記録', { exact: true }).first().click();
  const 人 = page.getByText('人', { exact: true }).first();
  await 人.click();
  await こうなるまで待つ(() => page.locator('[data-testid^="名の欄-射手-"]').count(), (n) => n === 1, 20000);

  await 管理者モードにする(page);

  await page.getByText('履歴', { exact: true }).first().click();
  await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
  // 管理者モードでないと出ない入口
  await expect(page.getByText('(管理者モード解除)', { exact: true })).toBeVisible({ timeout: 15_000 });
  // 一覧の題は「 [練習3]」の形で出る
  const 行 = page.getByText('[練習3]', { exact: false }).first();
  test.skip(!(await 行.isVisible({ timeout: 15_000 }).catch(() => false)), '種の記録「練習3」が無い');
  await 行.click();
  await expect(page.getByText('記録詳細', { exact: true })).toBeVisible({ timeout: 15_000 });

  // 管理者モードの詳細にある三本線の窓（人追加・間隔追加・計追加・記録を編集）から入る
  await page.getByRole('button', { name: '記録の道具' }).click();
  await expect(page.getByText('人追加', { exact: true })).toBeVisible({ timeout: 15_000 });
  const 直す = page.getByRole('button', { name: '記録画面で直す' });
  await expect(直す, '窓に「記録画面で直す」が無い').toBeVisible({ timeout: 15_000 });
  await 直す.click();

  // 記録画面に移り、帯が出て、記録の 2 人が並ぶ
  const 帯 = page.getByTestId('履歴の編集の帯');
  await expect(帯, '帯が出ない').toBeVisible({ timeout: 20_000 });
  await expect(帯).toContainText('練習3');
  await こうなるまで待つ(() => page.locator('[data-testid^="名の欄-射手-"]').count(), (n) => n === 2, 20000);
  expect(await 記録画面の名前たち(page)).toEqual(['部員1', '部員2']);
  // ライブと終了・保存は出ない。代わりに「保存して戻る」
  await expect(page.getByText('ライブ', { exact: true })).toHaveCount(0);
  // 帯と下のボタンの 2 か所に出る
  await expect(page.getByText('保存して戻る', { exact: true })).toHaveCount(2);
  await expect(page.getByText('終了・保存', { exact: true })).toHaveCount(0);

  // 記録画面の道具が効く：人を足す
  await 人.click();
  await こうなるまで待つ(() => page.locator('[data-testid^="名の欄-射手-"]').count(), (n) => n === 3, 20000);

  // やめる → 確認 → 履歴の詳細へ戻り、記録は 2 人のまま
  await page.getByText('やめる', { exact: true }).click();
  await expect(page.getByText('直すのをやめますか', { exact: true })).toBeVisible({ timeout: 10_000 });
  await page.getByText('やめる', { exact: true }).last().click();
  await expect(page.getByText('記録詳細', { exact: true })).toBeVisible({ timeout: 20_000 });
  const 記録 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}').state || {};
    return { 人数: ((s.sessions || []).find((x) => x && x.id === 'ses-100007-3') || {}).archers?.length, 編集中: s.履歴の編集, 盤面: (s.archers || []).length };
  });
  expect(記録.人数, '記録が変わっている').toBe(2);
  expect(記録.編集中).toBeNull();
  // 記録画面は直す前の盤面（1 人）に戻っている
  expect(記録.盤面).toBe(1);
  await page.getByText('記録', { exact: true }).first().click();
  await expect(page.getByTestId('履歴の編集の帯')).toHaveCount(0);
  await こうなるまで待つ(() => page.locator('[data-testid^="名の欄-射手-"]').count(), (n) => n === 1, 20000);
});
