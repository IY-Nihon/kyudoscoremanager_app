/**
 * ゴミ箱の記録を、押して中身を見られること（見るだけ）。
 *
 *   npx playwright test e2e/trashView.spec.mjs
 *
 * ゴミ箱に入っている記録は、これまで「復元」か「完全に削除」しかできず、
 * 中身を見てから決められなかった。押すと詳細が開き、
 *   ・ゴミ箱の中だと分かる帯が出る（見出しも「ゴミ箱の記録」）
 *   ・直す・消す・前後へ送るは出ない
 *   ・戻ると、ゴミ箱の一覧に戻る
 * ことを見る。団体には書き込まない（100007 の種の記録 tra-100007-1 を開くだけ。
 * 復元は押さない）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';

const 団体 = '100007';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100007.json' });

test('ゴミ箱の記録は、押すと見るだけで開き、戻るとゴミ箱へ戻る', async ({ page }) => {
  test.setTimeout(180_000);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);

  await page.getByText('履歴', { exact: true }).first().click();
  await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: '選んだ記録を消す' }).click();
  await expect(page.getByText('ゴミ箱', { exact: true })).toBeVisible({ timeout: 15_000 });

  // 種の記録（削除済み）が一覧に無ければ、この団体では見られない
  const 行 = page.getByTestId(`ゴミ箱の記録-tra-${団体}-1`);
  test.skip(!(await 行.isVisible().catch(() => false)), 'ゴミ箱に種の記録が無い');
  await 行.click();

  const 帯 = page.getByTestId('ゴミ箱の帯');
  await expect(帯, 'ゴミ箱の中だと分かる帯が出ない').toBeVisible({ timeout: 15_000 });
  await expect(帯).toContainText('見るだけ');
  await expect(page.getByText('ゴミ箱の記録', { exact: true }), '見出しがゴミ箱の記録になっていない').toBeVisible();
  await expect(page.getByText('記録詳細', { exact: true }), 'ふつうの詳細の見出しが出ている').toHaveCount(0);
  // 消す・直すの入口が無いこと
  await expect(page.getByRole('button', { name: 'この記録を消す' }), '消すボタンが出ている').toHaveCount(0);
  // 復元はここからもできる（押さない。押すと団体に書き込む）
  await expect(page.getByRole('button', { name: 'この記録を復元する' })).toBeVisible();

  // 戻ると、ゴミ箱の一覧へ戻る
  await page.getByText('戻る', { exact: true }).first().click();
  await expect(page.getByText('ゴミ箱', { exact: true }), 'ゴミ箱の一覧に戻らない').toBeVisible({ timeout: 15_000 });
  await expect(行).toBeVisible({ timeout: 15_000 });
});
