/**
 * AI の図の見本を画面に並べて撮る（図の見た目を直す前と後で比べるための道具。2026-11-13）。
 *
 *   SHOT_DIR=撮る先 PW_DIST=dist-stg-e2e npx playwright test e2e/zuNoGarou.spec.mjs --project=スマホ
 *
 * 見本（e2e/zuNoMihon.cjs。作りものの団体）の図を、AI の会話の控えに入れてから AI を開く。
 * 模型は呼ばない・雲へは書かない。SHOT_DIR が無いときは、どの図も描けていること（幅と高さがある）だけを見る。
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

const { 見本を作る } = createRequire(import.meta.url)('./zuNoMihon.cjs');

test.use({ storageState: 'e2e/.auth/100007.json' });

test('図の見本：どの図も描けて、図の箱からはみ出さない', async ({ page }, 情報) => {
  const 見本 = 見本を作る();
  // 会話の控えは、図を新しい 10 件ぶんだけ残す。1 つの答えに図を 4 つずつ載せる
  const 会話 = [];
  for (let 番 = 0; 番 < 見本.length; 番 += 4) {
    const 組 = 見本.slice(番, 番 + 4);
    会話.push({ id: `q${番}`, role: 'user', text: 組.map((一つ) => 一つ.問い).join(' ／ ') });
    会話.push({ id: `a${番}`, role: 'model', text: '見本です。', 図たち: 組.map((一つ) => 一つ.図) });
  }
  // ZU_TATE=零から で、的中率の縦軸を全部 0% からにして撮る（見比べ用）
  await page.addInitScript(
    ([会話, 縦軸]) => {
      localStorage.setItem('aiChatMessages_v1_g_100007', JSON.stringify(会話));
      if (縦軸) globalThis.__図の縦軸 = 縦軸;
    },
    [会話, process.env.ZU_TATE || '']
  );
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('履歴', { exact: true }).first().click();
  await page.getByTestId('AIを開く').click();
  const 図たち = page.getByTestId('AIの図');
  await expect(図たち).toHaveCount(見本.length, { timeout: 30_000 });
  await page.waitForTimeout(800);
  const 撮る先 = process.env.SHOT_DIR && path.join(process.env.SHOT_DIR, 情報.project.name);
  if (撮る先) fs.mkdirSync(撮る先, { recursive: true });
  for (let 番 = 0; 番 < 見本.length; 番++) {
    const 一つ = 図たち.nth(番);
    await 一つ.scrollIntoViewIfNeeded();
    const 枠 = await 一つ.boundingBox();
    expect(枠 && 枠.width > 100 && 枠.height > 40, `見本「${見本[番].名}」が描けていない`).toBeTruthy();
    // 図の中の字・線が、図の箱の左右にはみ出していない
    const はみ出し = await 一つ.evaluate((元) => {
      const 外 = 元.getBoundingClientRect();
      return [...元.querySelectorAll('svg text, svg circle, svg rect')]
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 0 && (r.left < 外.left - 1 || r.right > 外.right + 1)).length;
    });
    expect(はみ出し, `見本「${見本[番].名}」で、図の箱の外に出た字や点がある`).toBe(0);
    if (撮る先) {
      const 名 = `${String(番 + 1).padStart(2, '0')}-${見本[番].名.replace(/[\\/:*?"<>| ]/g, '_')}`;
      await 一つ.screenshot({ path: path.join(撮る先, `${名}.png`) });
      if (process.env.SHOT_OOKIKU) {
        await 一つ.click();
        const 窓 = page.getByTestId('AIの図の窓');
        await expect(窓).toBeVisible();
        await page.waitForTimeout(250);
        // 折れ線は、真ん中あたりの点を押して中身を出したところを撮る
        const 押す面 = 窓.getByTestId('図の押す面');
        if (await 押す面.count()) {
          await 押す面.click();
          await expect(窓.getByTestId('図の点の中身')).toBeVisible();
        }
        await 窓.screenshot({ path: path.join(撮る先, `${名}-大.png`) });
        await page.getByTestId('AIの図を閉じる').click();
        await expect(窓).toBeHidden();
      }
    }
  }
});
