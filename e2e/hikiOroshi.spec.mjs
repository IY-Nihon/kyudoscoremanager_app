// 上から引っ張って更新（src/hikiOroshi.js）。履歴・メンバーの一覧で、いちばん上から下へ引いて離すと
// 「離すと更新」が出て、雲から取り直す。指の出来事は TouchEvent を一覧の DOM へ直に送る
//（Playwright には指で引く操作が無い）。パソコンは指が無いので流さない
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100003.json' });

/** 一覧（testID の DOM）へ、上から下へ引く指の出来事を送る。離す が false なら引いたまま */
async function 引く(page, 一覧, 長さ, 離す = true) {
  await page.evaluate(
    async ([一覧, 長さ, 離す]) => {
      const 節 = document.querySelector(`[data-testid="${一覧}"]`);
      if (!節) throw new Error('一覧が見つからない');
      節.scrollTop = 0;
      // WebKit は Touch を new できない。指の出来事の形（touches と clientY）だけを持つ出来事を送る
      const 送る = (種, y) => {
        const e = new Event(種, { bubbles: true, cancelable: true });
        const 点 = { identifier: 1, target: 節, clientX: 100, clientY: y };
        Object.defineProperty(e, 'touches', { value: 種 === 'touchend' ? [] : [点] });
        Object.defineProperty(e, 'changedTouches', { value: [点] });
        節.dispatchEvent(e);
      };
      if (長さ !== null) {
        送る('touchstart', 200);
        for (let k = 1; k <= 10; k++) {
          送る('touchmove', 200 + (長さ * k) / 10);
          await new Promise((r) => setTimeout(r, 16));
        }
      }
      if (離す) 送る('touchend', 200 + (長さ || 0));
    },
    [一覧, 長さ, 離す]
  );
}

for (const [タブ, 一覧] of [
  ['履歴', '履歴の一覧'],
  ['メンバー', 'メンバーの一覧'],
]) {
  test(`${タブ}：上から引いて離すと雲から取り直す。少しだけ引いたときは取り直さない`, async ({ page }, 情報) => {
    test.skip(情報.project.name === 'パソコン', 'パソコンには指が無い');
    await 案内を止める(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await 入り口が決まるまで待つ(page);
    await page.getByRole('tab', { name: タブ }).click();
    await expect(page.getByTestId(一覧)).toBeVisible({ timeout: 15_000 });
    const 回数 = () => page.evaluate(() => globalThis.__引いて更新した回数 || 0);

    // 少しだけ（30px、半分にして 15）では取り直さない
    await 引く(page, 一覧, 30);
    await page.waitForTimeout(300);
    expect(await 回数()).toBe(0);

    // 引いている途中は「離すと更新」、離すと取り直す
    await 引く(page, 一覧, 160, false);
    await expect(page.getByText('離すと更新', { exact: true })).toBeVisible();
    await 引く(page, 一覧, null, true);
    await expect.poll(回数, { timeout: 10_000 }).toBe(1);
    await expect(page.getByTestId('引いて更新')).toHaveCount(0, { timeout: 20_000 });
  });
}
