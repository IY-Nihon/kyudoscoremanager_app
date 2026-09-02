/**
 * 端末に書けなくなったときの知らせ（src/useScoreStore.js の 端末の置き場）。
 *
 *   npx playwright test e2e/storageFull.spec.mjs
 *
 * 端末の控えが書けなくなっても、これまでは利用者に何も出さなかった。
 * 便りは運営者にしか届かないので、利用者は入れた記録が次に開いたときに
 * 消えていて初めて気づく。とくに個人モードは雲へ上げないため、端末に
 * 書けなければどこにも残らない。
 *
 * ここでは保存の鍵だけをわざと失敗させる。ほかの鍵は通すので、
 * 起動そのものは普段どおり進む。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ } from './helpers.mjs';

// ログインは要らない。書けないことは団体に関わらず起きる
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * 保存の鍵（zustand の persist）だけ、書き込みを失敗させる。
 *
 * WebKit では、localStorage そのものを触っても差し替えられない。
 *   ・`localStorage.setItem = 関数` … **「setItem」という名前の保存項目**が
 *     増えるだけで、本物のメソッドは無傷のまま残る
 *   ・`Object.defineProperty(localStorage, 'setItem', …)` … これも効かない
 * どちらも Chromium では差し替わるので、パソコンだけ見ていると気づけない
 * （実際 iPhone でだけ落ちて分かった）。Storage.prototype なら効く。
 */
async function 書けなくする(page) {
  await page.addInitScript(() => {
    // 差し替えるのは Storage.prototype のほう。localStorage そのものへ
    // 代入しても defineProperty しても、WebKit では効かない（実測）
    const 元 = Storage.prototype.setItem;
    Object.defineProperty(Storage.prototype, 'setItem', {
      configurable: true,
      writable: true,
      value: function (鍵, 値) {
        if (String(鍵) === 'archery-score-storage') {
          const 誤り = new Error('QuotaExceededError（検査でわざと起こしている）');
          誤り.name = 'QuotaExceededError';
          throw 誤り;
        }
        return 元.call(this, 鍵, 値);
      },
    });
  });
}

/** 仕掛けが本当に効いているか。効いていない検査は、通っても意味が無い */
async function 差し替わっているか(page) {
  return page.evaluate(() => {
    try {
      window.localStorage.setItem('archery-score-storage', 'x');
      return false; // 投げなかった＝差し替わっていない
    } catch (e) {
      return true;
    }
  });
}

test('端末に書けないとき、利用者にも知らせが出る', async ({ page }) => {
  await 書けなくする(page);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);

  // 仕掛けが効いていないまま「知らせが出ない」を見ても、何も確かめたことに
  // ならない。先にここで落とす
  expect(await 差し替わっているか(page), '書けなくする仕掛けが効いていない').toBe(true);

  await expect(
    page.getByText('端末に保存できませんでした'),
    '端末に書けないのに、利用者に何も出ていない'
  ).toBeVisible({ timeout: 30_000 });
});

test('書けているうちは、その知らせを出さない', async ({ page }) => {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);

  // 出ないことを見るので、決まった時間を置くしかない。
  // 短くすると「出るのが遅いだけ」と見分けがつかない
  await page.waitForTimeout(4000);
  await expect(
    page.getByText('端末に保存できませんでした'),
    '書けているのに知らせが出ている'
  ).toHaveCount(0);
});
