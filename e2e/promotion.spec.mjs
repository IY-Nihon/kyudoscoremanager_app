/**
 * 学年まわりの画面の検査（団体の種類・在籍・進級の窓。2026-10-16 の段 1）。
 *
 *   npx playwright test e2e/promotion.spec.mjs
 *
 * 見るのは
 *   ・進級の窓：最後の学年の組だけ開いている。人を押すと「4年のまま」に変わり、組の頭に「1人そのまま」が出る。
 *     もう一度押すと戻る。閉じた組は頭を押すと開く。「あとで」で閉じると記録画面の上に帯が出て、押すと窓が開き直す
 *   ・設定：団体の種類・4月1日の進級の確認・期を使う が出る。種類の窓に 5 つの種類が出て、今の種類が選ばれている
 *   ・メンバー：学年は札（1年〜4年・その他）。足すときは在籍を出さず、いる人を直すときは在籍（在籍・卒業・退部）を出す
 *
 * ■ 窓の開き方
 * 進級の窓は 4 月 1 日を過ぎるまで本物の道では出ない。検査用の口（globalThis.__進級の窓を開く）で開く。
 * 窓を出すかの決まりは test/gakunen.test.js（進級待ちの年）と test/storeSync.test.js（進級の確かめ）で見る。
 *
 * ■ 雲には書かない
 * 「進級する」は押さない（検証環境の名簿が上がる。進級そのものは test/storeSync.test.js で見る）。
 * 設定の切り替えも押さない（ほかの検査と同じ団体を使う）。種類の窓・メンバーの窓は閉じるだけ。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  画面が変わるまで待つ,
} from './helpers.mjs';

// 100001 は 1〜4 年の部員がいる（4 年は 1 人）
test.use({ storageState: 'e2e/.auth/100001.json' });

async function 開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await expect(page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 30_000 });
}

test('進級の窓：上げない人だけ名前を押して選べ、「あとで」で閉じると帯から開き直せる', async ({ page }) => {
  await 開く(page);
  const 窓 = page.getByTestId('進級の窓');
  // 開いた直後の同期が「進級待ちではない」と置き直すことがあるので、窓が残るまで開き直す
  await expect(async () => {
    await page.evaluate(() => globalThis.__進級の窓を開く(2027));
    await expect(窓).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await expect(窓.getByText('2027年度の進級', { exact: true })).toBeVisible();

  // 最後の学年（4 年）の組だけ開いている。押すと「4年のまま」、もう一度押すと「卒業」に戻る
  await expect(窓.getByRole('button', { name: /^4年 → 卒業（1人）/ })).toBeVisible();
  const 四年生 = 窓.getByRole('button', { name: / 卒業$/ });
  await expect(四年生).toHaveCount(1);
  await 四年生.click();
  await expect(窓.getByRole('button', { name: / 4年のまま$/ })).toHaveCount(1);
  await expect(窓.getByText('1人そのまま', { exact: true })).toBeVisible();
  await 窓.getByRole('button', { name: / 4年のまま$/ }).click();
  await expect(窓.getByRole('button', { name: / 卒業$/ })).toHaveCount(1);
  await expect(窓.getByText('1人そのまま', { exact: true })).toHaveCount(0);

  // 3 年の組は閉じている。頭を押すと開き、「4年へ」が並ぶ
  await expect(窓.getByRole('button', { name: / 4年へ$/ })).toHaveCount(0);
  await 窓.getByRole('button', { name: /^3年 → 4年（2人）/ }).click();
  await expect(窓.getByRole('button', { name: / 4年へ$/ })).toHaveCount(2);

  // 窓は画面からはみ出さない
  const 枠 = await 窓.boundingBox();
  const 幅 = page.viewportSize().width;
  expect(枠.x, '窓が左にはみ出す').toBeGreaterThanOrEqual(0);
  expect(枠.x + 枠.width, '窓が右にはみ出す').toBeLessThanOrEqual(幅 + 1);

  // あとで → 帯が出る → 帯を押すと窓が開き直す
  await page.getByTestId('進級-あとで').click();
  await expect(窓).toHaveCount(0);
  const 帯 = page.getByTestId('進級の帯');
  await expect(帯).toBeVisible();
  await expect(帯).toContainText('2027年度の進級がまだです');
  await 帯.click();
  await expect(窓).toBeVisible();
  await page.getByTestId('進級-あとで').click();
  await expect(窓).toHaveCount(0);
});

test('設定：団体の種類・進級の確認・期を使うが出て、種類の窓に 5 つの種類が並ぶ', async ({ page }) => {
  await 開く(page);
  await page.getByRole('tab', { name: '設定' }).click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('4月1日の進級の確認', { exact: true })).toBeVisible();
  await expect(page.getByText('期を使う', { exact: true })).toBeVisible();
  await expect(page.getByText('4月1日の自動進級', { exact: true }), '前の切り替えは無い').toHaveCount(0);
  await page.getByRole('button', { name: '団体の種類 大学（1年〜4年）' }).click();
  const 種類の窓 = page.getByTestId('種類の窓');
  await expect(種類の窓).toBeVisible();
  const 種類 = 種類の窓.getByRole('radio');
  await expect(種類).toHaveCount(5);
  await expect(種類の窓.getByRole('radio', { name: /^大学/ })).toHaveAttribute('aria-checked', 'true');
  await expect(種類の窓.getByRole('radio', { name: /^高専/ })).toHaveAttribute('aria-checked', 'false');
  // 今の種類を押しても何も変えずに閉じる
  await 種類の窓.getByRole('radio', { name: /^大学/ }).click();
  await expect(種類の窓).toHaveCount(0);
});

test('メンバー：学年は札で選び、いる人を直すときだけ在籍を選べる', async ({ page }) => {
  await 開く(page);
  await page.getByRole('tab', { name: 'メンバー' }).click();
  await 画面が変わるまで待つ(page, '部員を追加');

  // 足すとき：学年の札は 1年〜4年とその他。在籍は出さない
  await page.getByRole('button', { name: '部員を追加' }).click();
  const 学年 = page.getByRole('radiogroup', { name: '学年' });
  await expect(学年).toBeVisible({ timeout: 10_000 });
  await expect(学年.getByRole('radio')).toHaveText(['1年', '2年', '3年', '4年', 'その他']);
  await expect(学年.getByRole('radio', { name: '1年' })).toHaveAttribute('aria-checked', 'true');
  await 学年.getByRole('radio', { name: 'その他' }).click();
  await expect(学年.getByRole('radio', { name: 'その他' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radiogroup', { name: '在籍' })).toHaveCount(0);
  await page.getByRole('button', { name: '閉じる' }).click();
  await expect(学年).toHaveCount(0);

  // いる人を直すとき：今の学年が選ばれ、在籍は「在籍」
  await page
    .getByText(/ \/ 4年$/)
    .first()
    .click();
  await expect(学年).toBeVisible({ timeout: 10_000 });
  await expect(学年.getByRole('radio', { name: '4年' })).toHaveAttribute('aria-checked', 'true');
  const 在籍 = page.getByRole('radiogroup', { name: '在籍' });
  await expect(在籍.getByRole('radio')).toHaveText(['在籍', '卒業', '退部']);
  await expect(在籍.getByRole('radio', { name: '在籍' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: '閉じる' }).click();
  await expect(学年).toHaveCount(0);
});
