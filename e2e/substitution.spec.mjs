/**
 * 途中交代の単位（立目／射目）の検査。
 *
 *   npx playwright test e2e/substitution.spec.mjs
 *
 * 交代は「その射目から後ろは別の人が引いた」という印で、
 * 記録表の合計の内訳と、履歴・分析の「自分の記録か」の判定に効く。
 * 単位を立目にしても、しまわれる位置（何射目か）が同じであることを見る。
 *
 * 番号は打ち込まずに一覧から選ぶ（記録表で人を選ぶのと同じ形）。
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const お知らせの版 = (fs.readFileSync('src/JP_WhatsNewModal.js', 'utf8').match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

// 鍵の検査（e2e/lock.spec.mjs）と同じ団体を使う。どちらも「終了・保存」を
// 押さないので、団体の中身には何も書かない（検査は workers:1 で1つずつ動く）。
// 部員0人の 100005 は使わない。あちらは「作りたての団体」を再現するための
// 場所で、空のまま保つと決めてある（案内の検査がその前提で書かれている）
const 団体 = '100003';
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
    // 決まった秒数で待たない。iPhone(WebKit) では9秒に収まらないことがあり、
    // 収まらないとログイン画面のまま先へ進んで、まったく別の顔で落ちる
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
            return s.activeGroupId || null;
          }),
        { timeout: 60_000, message: 'ログインが通らない（団体IDが入らない）' }
      )
      .not.toBeNull();
    // 認証の保存が書き終わるまでの余裕
    await page.waitForTimeout(1500);
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

test('途中交代：開くと立目の一覧が出て、射目にも切り替えられる', async ({ page }) => {
  await 交代の画面を開く(page);

  // 既定は立目。8射なら 1立目・2立目 が選べる
  await expect(page.getByText('1立目', { exact: true }), '開いたときに立目の一覧が無い').toBeVisible();
  await expect(page.getByText('2立目', { exact: true })).toBeVisible();
  await expect(page.getByText('3立目', { exact: true }), '8射なのに3立目が出ている').toHaveCount(0);
  await expect(page.getByText('1射目', { exact: true }), '立目なのに射目の一覧が出ている').toHaveCount(0);

  // 射目へ切り替えると、1射目から8射目まで選べる
  await page.getByText('射目', { exact: true }).click();
  await page.waitForTimeout(600);
  await expect(page.getByText('1射目', { exact: true }), '射目へ切り替わらない').toBeVisible();
  await expect(page.getByText('8射目', { exact: true })).toBeVisible();
  await expect(page.getByText('9射目', { exact: true }), '8射なのに9射目が出ている').toHaveCount(0);

  // 立目へ戻せる
  await page.getByText('立目', { exact: true }).click();
  await page.waitForTimeout(600);
  await expect(page.getByText('1立目', { exact: true }), '立目へ戻せない').toBeVisible();
});

test('途中交代：2立目を選ぶと、5射目からの交代として書かれる', async ({ page }) => {
  await 交代の画面を開く(page);

  await page.getByText('2立目', { exact: true }).click();
  await page.waitForTimeout(600);

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

test('途中交代：射目で選んだときも、その射目にしまわれる', async ({ page }) => {
  await 交代の画面を開く(page);

  await page.getByText('射目', { exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByText('3射目', { exact: true }).click();
  await page.waitForTimeout(600);
  await expect(page.getByText('3射目から交代します'), '案内が出ない').toBeVisible();

  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('交代次郎', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1500);

  const 位置 = await page.evaluate(() => {
    const 状態 = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
    const 射手 = (状態.archers || []).find((a) => a && a.substitutions && Object.keys(a.substitutions).length > 0);
    return 射手 ? Object.keys(射手.substitutions).map(Number) : [];
  });
  expect(位置, '3射目が位置2としてしまわれていない').toEqual([2]);
});

test('途中交代：どこで交代するかを選ぶまでは確定できない', async ({ page }) => {
  await 交代の画面を開く(page);

  await expect(page.getByText('上から交代するところを選んでください'), '選ぶ前の案内が出ない').toBeVisible();

  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('出ない人', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1200);

  // 画面は閉じない（＝書かれていない）
  await expect(page.getByText('途中交代の設定', { exact: true }), '選ばずに確定できてしまう').toBeVisible();
});
