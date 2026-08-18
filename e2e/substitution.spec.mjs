/**
 * 途中交代の単位（立／射目）の検査。
 *
 *   npx playwright test e2e/substitution.spec.mjs
 *
 * 交代は「その射目から後ろは別の人が引いた」という印で、
 * 記録表の合計の内訳と、履歴・分析の「自分の記録か」の判定に効く。
 * 単位を立にしても、しまわれる位置（何射目か）が同じであることを見る。
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const お知らせの版 = (fs.readFileSync('src/JP_WhatsNewModal.js', 'utf8').match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

// 鍵の検査（100003）とも、ライブの検査（100006）とも別の団体を使う。
// 保存はしないので団体の中身には触れないが、混ざる余地をなくす
const 団体 = '100005';
const 合言葉 = 'StgTest!2026';

async function 入る(page) {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 番号欄 = page.getByPlaceholder('例: 123456');
  if (await 番号欄.isVisible().catch(() => false)) {
    await 番号欄.click();
    await 番号欄.pressSequentially(団体, { delay: 20 });
    const 合言葉欄 = page.locator('input[type="password"]').first();
    await 合言葉欄.click();
    await 合言葉欄.pressSequentially(合言葉, { delay: 20 });
    await page.getByText('ログイン', { exact: true }).click();
    await page.waitForTimeout(9000);
  }
  await page.evaluate((版) => {
    localStorage.setItem('tutorialDoneVersion', '2026-08-13-01');
    localStorage.setItem('whatsNewDismissedVersion', 版);
  }, お知らせの版);
  await page.reload();
  await page.waitForTimeout(4000);
}

/** 射手を1人立てて、その人の操作から途中交代の画面を開く */
async function 交代の画面を開く(page) {
  await 入る(page);
  await page.getByText('人', { exact: true }).first().click();
  await page.waitForTimeout(1500);

  // 名前のますを押すと操作の一覧が出る
  await page.getByText('選択', { exact: true }).first().click();
  await page.waitForTimeout(1200);
  await page.getByText('途中交代', { exact: true }).click();
  await page.waitForTimeout(1200);
  await expect(page.getByText('途中交代の設定', { exact: true })).toBeVisible();
}

test('途中交代：開くと立の単位になっていて、射目にも切り替えられる', async ({ page }) => {
  await 交代の画面を開く(page);

  // 既定は立。番号の呼び方も「立の番号」になる
  await expect(page.getByText('立の番号', { exact: true }), '開いたときに立になっていない').toBeVisible();
  await expect(page.getByText('射目番号', { exact: true })).toHaveCount(0);

  await page.getByText('射目', { exact: true }).click();
  await page.waitForTimeout(400);
  await expect(page.getByText('射目番号', { exact: true }), '射目へ切り替わらない').toBeVisible();

  await page.getByText('立', { exact: true }).first().click();
  await page.waitForTimeout(400);
  await expect(page.getByText('立の番号', { exact: true }), '立へ戻せない').toBeVisible();
});

test('途中交代：2立目と入れると、5射目からの交代として書かれる', async ({ page }) => {
  await 交代の画面を開く(page);

  const 番号欄 = page.getByPlaceholder(/^1〜/);
  await 番号欄.click();
  await 番号欄.pressSequentially('2', { delay: 30 });
  await page.waitForTimeout(400);

  // 何射目になるかを、決める前に見せる
  await expect(page.getByText('2立目（5射目）から交代します'), '案内が出ない').toBeVisible();

  // ゲスト名で確定する
  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('交代太郎', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1500);

  // しまわれた位置が 4（＝5射目、0始まり）であること
  const 位置 = await page.evaluate(() => {
    const 生 = localStorage.getItem('archery-score-storage');
    const 状態 = JSON.parse(生 || '{}')?.state || {};
    const 射手 = (状態.archers || []).find((a) => a && a.substitutions && Object.keys(a.substitutions).length > 0);
    return 射手 ? Object.keys(射手.substitutions).map(Number) : [];
  });
  expect(位置, '2立目が5射目（位置4）としてしまわれていない').toEqual([4]);
});

test('途中交代：射数からはみ出す立の番号では確定できない', async ({ page }) => {
  await 交代の画面を開く(page);

  const 番号欄 = page.getByPlaceholder(/^1〜/);
  await 番号欄.click();
  await 番号欄.pressSequentially('9', { delay: 30 });
  await page.waitForTimeout(400);
  await expect(page.getByText(/で入れてください/), '範囲外だと分からない').toBeVisible();

  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('出ない人', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1200);

  // 画面は閉じない（＝書かれていない）
  await expect(page.getByText('途中交代の設定', { exact: true }), '範囲外なのに確定できてしまう').toBeVisible();
});
