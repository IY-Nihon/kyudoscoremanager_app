/**
 * 2026-11-13 の直しを画面で確かめる。
 *  ・履歴：月の札の「すべて」で年度を一続きに出し、月の見出しが付く。今見ている範囲に無いタグは後ろ
 *  ・設定：タグの定型を押すと「いつも付けるタグ」になる（この端末だけ。雲へは書かない）
 *
 * ■ 団体には書き込まない（見るだけ・端末の中の設定だけ）。検証環境の団体 100007（履歴は 100006）。
 * 写真は SHOT_DIR を渡したときだけ撮る。
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, こうなるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

const 撮る = async (page, 名, 情報) => {
  if (!process.env.SHOT_DIR) return;
  await page.screenshot({ path: path.join(process.env.SHOT_DIR, `${情報.project.name}-${名}.png`) });
};

async function 開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await こうなるまで待つ(
    () =>
      page.evaluate(() => {
        const s =
          JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
            ?.state || {};
        return (s.sessions || []).length;
      }),
    (n) => n > 0,
    60_000
  );
}

// 履歴は、記録が何か月にもまたがる団体 100006 で見る
test.describe('履歴', () => {
  test.use({ storageState: 'e2e/.auth/100006.json' });
  test('履歴：月の「すべて」で年度を一続きに出し、月の見出しが付く。無いタグは後ろに並ぶ', async ({
    page,
  }, 情報) => {
    await 開く(page);
    await page.getByText('履歴', { exact: true }).first().click();
    await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 15_000 });
    await 撮る(page, '履歴-月', 情報);
    // 有るタグの札は、無いタグの札より前に並ぶ（選んでいないとき）
    const 並び = await page
      .locator('[data-testid="ここに有るタグ"], [data-testid="ここに無いタグ"]')
      .evaluateAll((札たち) => 札たち.map((札) => 札.getAttribute('data-testid')));
    const 最初の無い = 並び.indexOf('ここに無いタグ');
    if (最初の無い >= 0)
      expect(並び.slice(最初の無い), '無いタグのあとに有るタグが並んでいる').not.toContain('ここに有るタグ');
    const すべて = page.getByTestId('月すべて');
    test.skip((await すべて.count()) === 0, 'この年度の記録が 1 つの月にしか無い');
    await すべて.click();
    await expect(page.getByTestId('月の見出し').first()).toHaveText(/^\d{4}年\d{1,2}月 {2}\d+件$/);
    expect(await page.getByTestId('月の見出し').count(), '月の見出しが 2 つ以上').toBeGreaterThan(1);
    await 撮る(page, '履歴-すべて', 情報);
  });
});

test('設定：タグの定型を押すと、いつも付けるタグになる（もう一度押すと外れる）', async ({ page }, 情報) => {
  await 開く(page);
  await page.getByText('設定', { exact: true }).first().click();
  const 札 = page.locator('[aria-label$="をいつも付けるタグにする"]').first();
  await 札.scrollIntoViewIfNeeded();
  const 名 = (await 札.getAttribute('aria-label')).replace(' をいつも付けるタグにする', '');
  await 札.click();
  const 付いた = page.locator(`[aria-label="${名} をいつも付けるタグから外す"]`);
  await expect(付いた).toHaveAttribute('aria-pressed', 'true');
  await 撮る(page, '設定-いつも付けるタグ', 情報);
  await 付いた.click();
  await expect(page.locator(`[aria-label="${名} をいつも付けるタグにする"]`)).toBeVisible();
  // 設定の「クラウドへ同期」の行は無い
  await expect(page.getByText('クラウドへ同期', { exact: true })).toHaveCount(0);
});

test('書き出し：確かめる段の見た目', async ({ page }, 情報) => {
  await 開く(page);
  await page.getByText('設定', { exact: true }).first().click();
  await page.getByText('データをExcel形式で書き出し', { exact: true }).click();
  await page.getByText('すべてのデータ', { exact: true }).click();
  await expect(page.getByTestId('書き出す内容の数')).toBeVisible({ timeout: 10_000 });
  await page.getByText('詳細を見る', { exact: true }).click();
  await expect(page.getByText('詳細を閉じる', { exact: true })).toBeVisible();
  await 撮る(page, '書き出し', 情報);
});
