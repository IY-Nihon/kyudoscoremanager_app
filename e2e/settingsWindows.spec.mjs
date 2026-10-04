/**
 * 設定の窓（書き出し・お問い合わせ）の検査（2026-10-05）。
 *
 *   npx playwright test e2e/settingsWindows.spec.mjs
 *
 * 書き出しとお問い合わせの窓を SettingsScreen.js から src/SettingsExport.js・SettingsInquiry.js へ
 * 切り出したときに足した。それまでどちらも踏む E2E が無く、切り出しで壊れても気づけなかった。
 * 書き出し：
 *  ・窓が開き、年度を前後に動かせる
 *  ・「すべてのデータ」で .xlsx が実際に落ちる。中身（ZIP の中のシート）に見出しと記録の行がある
 *  ・期間を選ぶ暦の窓は 1 枚だけ出る（前は同じ条件で 2 枚重なって出ていた）
 *
 * お問い合わせ：空のまま送ると止まる。キャンセルで閉じると下書きが消える（送信まではしない）
 *
 * ■ 団体には書き込まない
 * 書き出しは読むだけ。お問い合わせは送らない。検証環境の団体 100007 の記録（ses-100007-*）を使う。
 */
import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, こうなるまで待つ } from './helpers.mjs';

const require = createRequire(import.meta.url);
const { unzipSync, strFromU8 } = require('fflate');

test.use({ storageState: 'e2e/.auth/100007.json' });

async function 書き出しの窓を開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  // 記録が雲から届くのを待つ（届く前に書き出すと「対象のデータがありません」になる）
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
  await page.getByText('設定', { exact: true }).first().click();
  await page.getByText('データをExcel形式で書き出し', { exact: true }).click();
  await expect(page.getByText('書き出すデータの範囲を選択してください。', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
}

test('書き出し：窓が開き、年度を動かせ、すべてのデータを Excel で書き出せる', async ({ page }) => {
  await 書き出しの窓を開く(page);

  // 年度を動かす（前の年度へ・戻す）
  const 年度の字 = page.getByText(/^\d{4}年度のデータ$/);
  const 今 = Number((await 年度の字.textContent()).slice(0, 4));
  await page.locator('[aria-label="前へ"]').first().click();
  await expect(年度の字).toHaveText(`${今 - 1}年度のデータ`);
  await page.locator('[aria-label="次へ"]').first().click();
  await expect(年度の字).toHaveText(`${今}年度のデータ`);

  const 落ちる = page.waitForEvent('download', { timeout: 30_000 });
  await page.getByText('すべてのデータ', { exact: true }).click();
  const 落ちた = await 落ちる;
  expect(落ちた.suggestedFilename(), 'ファイル名の形').toMatch(/^kyudo_records_all_\d{4}-\d{2}-\d{2}\.xlsx$/);
  const 道 = await 落ちた.path();
  const 中身 = unzipSync(new Uint8Array(fs.readFileSync(道)));
  const 本 = strFromU8(中身['xl/workbook.xml']);
  expect(本, 'シートの名前').toContain('記録');
  const 表 = strFromU8(中身['xl/worksheets/sheet1.xml']);
  for (const 見出し of ['日付', '射手名', '的中率']) expect(表, `見出し「${見出し}」が無い`).toContain(見出し);
  const 行の数 = (表.match(/<row /g) || []).length;
  expect(行の数, '見出しのほかに記録の行が無い').toBeGreaterThan(1);
});

test('書き出し：期間を選ぶ暦の窓は 1 枚だけ出る', async ({ page }) => {
  await 書き出しの窓を開く(page);
  await page.getByText('詳細な条件で絞り込む...', { exact: true }).click();
  // 日付範囲の始め（既定は今月の 1 日）を押すと、暦の窓が開く
  const 月初め = await page.evaluate(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('ja-JP');
  });
  await page.getByText(月初め, { exact: true }).first().click();
  // 暦の窓の題は「開始日を選択」。前は同じ窓が 2 枚重なって出ていた
  await expect(page.getByText('開始日を選択', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  expect(await page.getByText('開始日を選択', { exact: true }).count(), '暦の窓が 2 枚出ている').toBe(1);
});

test('お問い合わせ：空のまま送ると止まり、キャンセルで閉じると下書きが消える（送信はしない）', async ({
  page,
}) => {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('設定', { exact: true }).first().click();
  await page.getByText('お問い合わせ', { exact: true }).first().click();
  const 本文 = page.getByLabel('お問い合わせ内容', { exact: true });
  await expect(本文).toBeVisible({ timeout: 10_000 });
  await page.getByText('送信', { exact: true }).click();
  await expect(page.getByText('お問い合わせ内容を入力してください', { exact: true }).first()).toBeVisible({
    timeout: 10_000,
  });
  await 本文.click();
  await 本文.pressSequentially('検査の下書き', { delay: 20 });
  await expect(本文).toHaveValue('検査の下書き');
  await page.getByText('キャンセル', { exact: true }).click();
  await expect(本文).toHaveCount(0, { timeout: 10_000 });
  await page.getByText('お問い合わせ', { exact: true }).first().click();
  await expect(page.getByLabel('お問い合わせ内容', { exact: true })).toHaveValue('');
});
