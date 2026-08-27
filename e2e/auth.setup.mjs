/**
 * ログインを1回だけ済ませて、その状態を控えておく。
 *
 * これまでは検査1件ごとにログインし直していた。1回に15〜25秒かかるうえ、
 * 短い間に何十回も認証を投げるので、Firebase に断られて（429）
 * 「記録が0件」に見えるような、中身と関係ない失敗も起きていた。
 *
 * ここで団体ごとに1回だけ入り、端末の控え（localStorage）を書き出す。
 * 各検査はそれを読み込んで始めるので、ログイン画面を通らない。
 * 各検査の「入る」はログイン欄が見えるときだけ入力する作りなので、
 * 控えが効いていれば素通りする。
 *
 * 控えには IndexedDB も含める（indexedDB: true）。Firebase の認証は
 * そこに入るため、含めないと「アプリは入ったつもりだが Firestore からは
 * 権限なしで弾かれる」という、いちばん分かりにくい壊れ方をする。
 */
import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const 合言葉 = 'StgTest!2026';
// 検査が使う団体。増やしたらここにも足す
const 団体たち = ['100001', '100003', '100005', '100006', '100007']; // 100002 は個人で入るので下に別で用意

export const 控えの道 = (団体) => path.join('e2e', '.auth', `${団体}.json`);

// 個人（部員）で入る検査もある。役割が変わると見えるものが変わるので、
// 団体の控えでは代用できない。別に1つ作っておく
setup('団体100002に個人で入っておく', async ({ page }) => {
  setup.setTimeout(120_000);
  const 団体 = '100002';
  const 個人ID = '1023';
  await page.goto('/');
  const 番号欄 = page.getByPlaceholder('例: 123456', { exact: true });
  await 番号欄.waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByText('個人', { exact: true }).click();
  await 番号欄.click();
  await 番号欄.pressSequentially(団体, { delay: 20 });
  const 個人欄 = page.getByPlaceholder('例: 1234', { exact: true });
  await 個人欄.click();
  await 個人欄.pressSequentially(個人ID, { delay: 20 });
  await page.getByText('ログイン', { exact: true }).click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
          return s.activeGroupId || null;
        }),
      { timeout: 90_000, message: '団体100002の個人ログインが通らない' }
    )
    .not.toBeNull();
  fs.mkdirSync(path.dirname(控えの道('100002-個人')), { recursive: true });
  await page.context().storageState({ path: 控えの道('100002-個人'), indexedDB: true });
});

for (const 団体 of 団体たち) {
  setup(`団体${団体}に入っておく`, async ({ page }) => {
    setup.setTimeout(120_000);
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
            const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
            return s.activeGroupId || null;
          }),
        { timeout: 90_000, message: `団体${団体}のログインが通らない` }
      )
      .not.toBeNull();

    // 認証の控えが書き終わるまで待つ。ここで急ぐと、控えが半端なまま残る
    await expect
      .poll(() => page.evaluate(() => !!localStorage.getItem('archery-score-storage')), { timeout: 30_000 })
      .toBe(true);

    fs.mkdirSync(path.dirname(控えの道(団体)), { recursive: true });
    await page.context().storageState({ path: 控えの道(団体), indexedDB: true });
  });
}
