// 立ち順の写真を読んで反映すると、立ごとに後ろへ区切りを置く（最後の立のあとにも）。前の並びが区切りで終わっていなければ、
// 区切りを 1 つ入れてから足す（2026-11-20 本人「②と③を入れる」。前は読み取りの間と最後の区切りを毎回手で足していた）。
// Gemini の返事は差し替える。名前は架空
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

const 返事たち = [
  {
    tachi: [
      { fuda: '壱', row: 1, seats: [] },
      { fuda: '', row: 1, seats: ['架空一', '架空二'] },
      { fuda: '弐', row: 1, seats: [] },
      { fuda: '', row: 1, seats: ['架空三', '架空四'] },
    ],
  },
  {
    tachi: [
      { fuda: '参', row: 1, seats: [] },
      { fuda: '', row: 1, seats: ['架空五', '架空六'] },
      { fuda: '四', row: 1, seats: [] },
      { fuda: '', row: 1, seats: ['架空七'] },
    ],
  },
];

async function 入る(page) {
  let 回 = 0;
  await page.route(/(?:workers\.dev|127\.0\.0\.1:8788)\/v1beta\/models\/[^/]+:generateContent/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        candidates: [
          {
            content: { role: 'model', parts: [{ text: JSON.stringify(返事たち[Math.min(回++, 1)]) }] },
            finishReason: 'STOP',
          },
        ],
      }),
    })
  );
  // 改善のための保存は本物へ送らない
  await page.route(/(?:workers\.dev|127\.0\.0\.1:8788)\/hozon/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: '{"ok":true}',
    })
  );
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, '100007', 検証のパスワード());
}

async function 読んで反映する(page) {
  await page.getByText('画像', { exact: true }).first().click();
  const 選ぶ = page.waitForEvent('filechooser');
  await page.getByText('画像を選択', { exact: true }).click();
  await (await 選ぶ).setFiles('docs/ocr-samples/hitotsu.png');
  await page.getByText('この画像で解析する', { exact: true }).click();
  await page.getByText('記録表に反映する', { exact: true }).click();
  await expect(page.getByText('画像から立ち順を登録', { exact: true })).toBeHidden();
}

/** 記録表の並び（人・区切り｜・計）を、控えから読む */
function 並びを読む(page) {
  return page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        .state || {};
    return (s.archers || []).map((a) => (a.isSeparator ? '|' : a.isTotalCalculator ? '計' : a.name || '空'));
  });
}

test.describe('立ち順の読み取りの区切り', () => {
  test.use({ storageState: 'e2e/.auth/100007.json' });

  test('続けて 2 回読むと、読み取りの間と最後の立のあとにも区切りが入る', async ({ page }) => {
    test.setTimeout(180_000);
    await 入る(page);
    await expect(page.getByText('記録を始めましょう')).toBeVisible();
    await 読んで反映する(page);
    await expect.poll(() => 並びを読む(page)).toEqual(['架空一', '架空二', '|', '架空三', '架空四', '|']);
    await 読んで反映する(page);
    await expect
      .poll(() => 並びを読む(page))
      .toEqual(['架空一', '架空二', '|', '架空三', '架空四', '|', '架空五', '架空六', '|', '架空七', '|']);
  });

  test('前の並びが区切りで終わっていなければ、区切りを入れてから足す', async ({ page }) => {
    test.setTimeout(180_000);
    await 入る(page);
    await expect(page.getByText('記録を始めましょう')).toBeVisible();
    await page.getByText('人', { exact: true }).first().click();
    await expect.poll(() => 並びを読む(page)).toEqual(['空']);
    await 読んで反映する(page);
    await expect
      .poll(() => 並びを読む(page))
      .toEqual(['空', '|', '架空一', '架空二', '|', '架空三', '架空四', '|']);
  });
});
