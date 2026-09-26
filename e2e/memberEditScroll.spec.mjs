/**
 * メンバーの編集の窓は、画面より長くなっても下まで流せる。
 *
 *   npx playwright test e2e/memberEditScroll.spec.mjs
 *
 * 窓は流す仕組みを持っておらず、管理者モードで招待リンクの欄（2026-09-24）が加わって
 * 画面より長くなると、下の「保存する」「メンバーを削除」に届かなかった（2026-09-26 に
 * 使う人から「メンバーの詳細のスクロールができない」）。小さい画面で開いて確かめる。
 * 開いて見るだけで、名簿にも逆引き表にも書かない（団体には書き込まない扱い）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';

const 団体 = '100002';
const 合言葉 = 'StgTest!2026';

/** 設定の画面で管理者モードを入れる（memberInvite.spec.mjs と同じ） */
async function 管理者モードにする(page) {
  await page.getByText('設定', { exact: true }).first().click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => {
    const 行 = [...document.querySelectorAll('div')].find((e) => (e.textContent || '').trim() === '管理者モード');
    let 親 = 行;
    for (let i = 0; i < 6 && 親; i++) {
      const 切替 = 親.querySelector('input[type="checkbox"], [role="switch"]');
      if (切替) return void 切替.click();
      親 = 親.parentElement;
    }
  });
  await expect(page.getByText('管理者認証', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder('パスワード').fill(合言葉);
  await page.getByText('認証', { exact: true }).click();
  await expect(page.getByText('管理者認証', { exact: true })).toHaveCount(0, { timeout: 30_000 });
}

test('メンバーの編集の窓は、小さい画面でも下の「保存する」「メンバーを削除」まで流せる', async ({ page }, 情報) => {
  test.setTimeout(180_000);
  // iPhone SE と同じ大きさ。招待リンクの欄まで入ると、窓が画面より長くなる
  await page.setViewportSize({ width: 375, height: 667 });
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);
  await 管理者モードにする(page);
  await page.getByText('メンバー', { exact: true }).first().click();
  await page.getByText('部員1', { exact: true }).first().click();
  await expect(page.getByTestId('招待リンクの欄'), 'メンバーの編集が開かない').toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);

  const 保存 = page.getByText('保存する', { exact: true });
  const 削除 = page.getByText('メンバーを削除', { exact: true });
  // 指（ホイール）で流す。WebKit の携帯はホイールを受けないので、そこは要素まで流す形で見る
  if (情報.project.name !== 'iPhone') {
    const 窓 = await page.getByText('メンバー編集', { exact: true }).boundingBox();
    await page.mouse.move(187, (窓 ? 窓.y : 100) + 200);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(150);
    }
    await expect(保存, 'ホイールで流しても「保存する」に届かない').toBeInViewport({ timeout: 5_000 });
  } else {
    await 保存.scrollIntoViewIfNeeded();
    await expect(保存, '流しても「保存する」に届かない').toBeInViewport({ timeout: 5_000 });
  }
  await expect(削除, '「メンバーを削除」に届かない').toBeInViewport();
  // 見出しと×は流しても上に残る（窓を閉じられなくならない）
  await expect(page.getByText('メンバー編集', { exact: true })).toBeInViewport();
});
