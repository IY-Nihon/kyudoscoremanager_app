/**
 * 矢所パネル（記録画面のそばに並ぶ、射手ごとの大きな的）の検査（2026-10-04）。
 *
 *   npx playwright test e2e/arrowPanel.spec.mjs
 *
 * 矢所の記録を ON にしていても、置いた矢所は窓を開き直さないと見えなかった。立ごと（4 本）の的を
 * 記録表の右（広い画面）か下（狭い画面）に出し、置いた矢所をその場で確かめられるようにした
 * （src/ArrowPanel.js・src/arrowPanelRules.js）。
 *
 * ■ 団体には書き込まない
 * 盤面は端末の中だけ（保存しない）。矢所の ON は端末の設定で、雲へは送られない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

async function 始める(page, 矢所を使う) {
  await 案内を止める(page);
  await page.addInitScript((使う) => {
    const 鍵 = 'archery-score-storage';
    const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
    const 状態 = (中 && 中.state) || {};
    状態.enableArrowLocation = 使う;
    localStorage.setItem(鍵, JSON.stringify(Object.assign({}, 中, { state: 状態 })));
  }, 矢所を使う);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('記録', { exact: true }).first().click();
  await page.locator('[aria-label="射手を追加"]').first().click();
  await expect(page.locator('[data-testid^="ます-"]').first(), '盤面にますが出ない').toBeVisible({ timeout: 20_000 });
}

test('矢所の記録が OFF のときは、矢所パネルを出さない', async ({ page }) => {
  await 始める(page, false);
  await expect(page.getByTestId('矢所パネル')).toHaveCount(0);
  await expect(page.getByTestId('矢所パネルを開く')).toHaveCount(0);
});

test('矢所を置くと、パネルの的に載る。立の切り替え・畳む・直す窓が使え、広さで右か下に出る', async ({ page }) => {
  await 始める(page, true);
  const ます = page.locator('[data-testid^="ます-"]');
  const パネル = page.getByTestId('矢所パネル');
  await expect(パネル, '矢所パネルが出ない').toBeVisible({ timeout: 10_000 });

  // 置き場所：広い画面（幅 900 以上）は記録表の右、狭い画面は下
  const 窓 = page.viewportSize();
  const 表 = await ます.first().boundingBox();
  const 箱 = await パネル.boundingBox();
  if (窓.width >= 900) expect(箱.x, '広い画面なのに、パネルが表の右に無い').toBeGreaterThan(表.x + 表.width);
  else expect(箱.y, '狭い画面なのに、パネルが表の下に無い').toBeGreaterThan(表.y + 表.height);

  // 縦の表は上が最後の射（8 射目）。上のますを○にして、窓が開いたら的を押して置く
  await ます.nth(0).click();
  await expect(page.getByText('矢所の記録', { exact: false }).first(), '矢所の窓が開かない').toBeVisible({ timeout: 10_000 });
  await page.mouse.click(窓.width / 2, 窓.height / 2 + 30);
  await page.getByText('完了', { exact: true }).click();

  // 8 射目は 2 立の ④。いま記録している立（2 立）に自動で付いていき、④ が押せる
  await expect(page.getByTestId('矢所パネル-的'), '射手の的が出ない').toHaveCount(1);
  await expect(page.getByTestId('矢所パネル-ます-7'), '8 射目（④）が出ない').toBeVisible();
  await page.getByTestId('矢所パネル-ます-6').click({ force: true });
  await expect(page.getByText('矢所の記録', { exact: false }), '印の無い 7 射目（③）を押すと窓が開いてしまう').toHaveCount(0);
  await expect(page.getByTestId('矢所パネル-ます-0'), '出ていない立（1 立）のますが出ている').toHaveCount(0);

  // 1 立に切り替えると、8 射目は載らない（④ は 2 立）
  await page.getByTestId('矢所パネル-立-1').click();
  await expect(page.getByTestId('矢所パネル-ます-7')).toHaveCount(0);
  await page.getByTestId('矢所パネル-立-2').click();
  await expect(page.getByTestId('矢所パネル-ます-7')).toBeVisible();

  // ④ を押すと、その矢所を直す窓が開く
  await page.getByTestId('矢所パネル-ます-7').click();
  await expect(page.getByText('矢所の記録', { exact: false }).first(), 'パネルから直す窓が開かない').toBeVisible({ timeout: 10_000 });
  await page.getByText('完了', { exact: true }).click();

  // 畳むと細い帯だけが残り、開くと戻る
  await page.getByTestId('矢所パネルを畳む').click();
  await expect(パネル).toHaveCount(0);
  await page.getByTestId('矢所パネルを開く').click();
  await expect(パネル).toBeVisible();
});
