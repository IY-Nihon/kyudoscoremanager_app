/**
 * 新しい版が出たことの知らせ（src/JP_UpdateBar.js / src/updateNotice.js）。
 *
 *   npx playwright test e2e/updateBar.spec.mjs
 *
 * 開いたままのタブは、読み込み直すまで古い束のまま動く。ふだんは害が
 * 小さいが、ライブの置き場所（枝）が変わる回では、古いままの端末が別の枝を
 * 見て「相手の○×が出ない」という直しにくい形になる。
 *
 * 見たいのは2つ。
 *   ・束が変わったときに帯が出ること
 *   ・変わっていないのに出さないこと（出続けると、そのうち誰も押さなくなる）
 *
 * ログインは要らない（帯はログインの前にも出す）。団体にも触れない。
 */
import { test, expect } from '@playwright/test';

// 控えを使わない。ログイン前の画面で足りる
test.use({ storageState: { cookies: [], origins: [] } });

/** いま読み込んでいる束の名前 */
async function いまの束(page) {
  return page.evaluate(() => {
    const 札 = [...document.querySelectorAll('script[src]')]
      .map((x) => x.getAttribute('src'))
      .filter((x) => x && /AppEntry-|\.js$/.test(x));
    return 札.length ? 札[0] : null;
  });
}

/** 取り直しの index.html を、指定した束を指す中身にすり替える */
async function 返す中身を決める(page, 束) {
  await page.route('**/index.html', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!DOCTYPE html><html><head><title>弓道記録アプリ</title></head><body><div id="root"></div><script src="${束}" defer></script></body></html>`,
    });
  });
}

/** 画面が戻ってきたことにして、見に行かせる */
async function 見に行かせる(page) {
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(1500);
}

test('更新の帯：束が変わったら出る', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束, '束の名前が読めない').toBeTruthy();

  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-0000000000000000000000000000ffff.js');
  await 見に行かせる(page);

  await expect(page.getByText(/新しい版が出ています/), '帯が出ない').toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('更新', { exact: true })).toBeVisible();
});

test('更新の帯：束が同じなら出さない', async ({ page }) => {
  // 出続けると、押しても何も変わらず、そのうち誰も押さなくなる
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束).toBeTruthy();

  await 返す中身を決める(page, 束);
  await 見に行かせる(page);

  await expect(page.getByText(/新しい版が出ています/), '同じ束なのに帯が出た').toHaveCount(0);
});

test('更新の帯：閉じられる', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-1111111111111111111111111111ffff.js');
  await 見に行かせる(page);

  const 帯 = page.getByText(/新しい版が出ています/);
  await expect(帯).toBeVisible({ timeout: 10_000 });
  await page.getByText('✕', { exact: true }).first().click();
  await page.waitForTimeout(600);
  await expect(帯, '閉じても残っている').toHaveCount(0);
});

test('更新の帯：読めない中身が返っても、帯を出さない', async ({ page }) => {
  // 当てずっぽうで出すと、押しても何も変わらない
  await page.goto('/');
  await page.waitForTimeout(3000);
  await page.route('**/index.html', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html>取れなかった</html>' });
  });
  await 見に行かせる(page);
  await expect(page.getByText(/新しい版が出ています/), '読めないのに帯が出た').toHaveCount(0);
});

test('更新の帯：「更新」を押すと読み込み直す', async ({ page }) => {
  // 押しても何も起きない釦だと、帯そのものが意味を失う。
  // 読み込み直したかどうかは、押す前に窓へ置いた印が消えることで見る
  await page.goto('/');
  await page.waitForTimeout(3000);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-2222222222222222222222222222ffff.js');
  await 見に行かせる(page);
  await expect(page.getByText(/新しい版が出ています/), '帯が出ない').toBeVisible({ timeout: 10_000 });

  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  await page.getByText('更新', { exact: true }).click();

  // 読み込み直すと、窓に置いた印は消える
  await expect
    .poll(() => page.evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている')), {
      timeout: 30_000,
      message: '「更新」を押しても読み込み直していない',
    })
    .toBe('消えた');
});
