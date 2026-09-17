/**
 * ゴミ箱の記録の詳細から、復元と完全な削除ができること。
 *
 *   npx playwright test e2e/trashRestoreDelete.spec.mjs
 *
 * 帯に「復元」しか無かったので「完全に削除」を足した（使う人の要望 2026-09-17）。
 * ここでは記録を 1 つ作って消し、ゴミ箱の詳細から復元 → もう一度消す → 完全に削除、と
 * ひと巡りさせる。最後に完全に消すので団体に残らない（開き直しても戻ってこないことまで見る）。
 * 種の記録には触らない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る, こうなるまで待つ, 確かに打つ } from './helpers.mjs';

// 記録を作って消すので、途中交代の検査（100007）と取り合わないよう専用の団体
const 団体 = '100008';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100008.json' });

// 3 機種が同じ団体で同時に走るので、題は機種ごとに変える（雲で互いの記録が見える）
let 題 = 'e2e ゴミ箱の巡り';

async function 手元の記録(page) {
  return page.evaluate((題) => {
    const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}').state || {};
    const 探す = (xs) => (xs || []).find((x) => x && x.title === 題);
    return { 一覧: 探す(s.sessions), ゴミ箱: 探す(s.trash) };
  }, 題);
}

/** 一覧で題の記録を選んで消す（ゴミ箱へ） */
async function 一覧から消す(page) {
  await 一覧へ戻す(page);
  // 一覧は月で絞られる。今日の月の札を押す（無ければ、その月しか無いので押さなくてよい）
  const 今月 = String(new Date().getMonth() + 1).padStart(2, '0') + '月';
  const 札 = page.getByText(今月, { exact: true }).first();
  if (await 札.isVisible().catch(() => false)) await 札.click();
  const 行 = page.getByText(`[${題}]`, { exact: false }).first();
  await expect(行).toBeVisible({ timeout: 20_000 });
  await 行.click();
  await expect(page.getByText('記録詳細', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'この記録を消す' }).click();
  await page.getByText('移動する', { exact: true }).click();
  await こうなるまで待つ(async () => (await 手元の記録(page)).ゴミ箱 ? 1 : 0, (n) => n === 1, 20_000);
}

/** 履歴の一覧（過去の記録表）に戻す。詳細やゴミ箱の一覧に居れば「戻る」を押す */
async function 一覧へ戻す(page) {
  for (let i = 0; i < 3; i++) {
    if (await page.getByText('過去の記録表', { exact: true }).isVisible().catch(() => false)) return;
    const 戻る = page.getByText('戻る', { exact: true }).first();
    if (await 戻る.isVisible().catch(() => false)) await 戻る.click();
    await page.waitForTimeout(800);
  }
  await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
}

/** ゴミ箱の一覧を開き、題の記録の詳細へ */
async function ゴミ箱の詳細へ(page) {
  await 一覧へ戻す(page);
  await page.getByRole('button', { name: '選んだ記録を消す' }).click();
  await expect(page.getByText('ゴミ箱', { exact: true })).toBeVisible({ timeout: 15_000 });
  const { ゴミ箱 } = await 手元の記録(page);
  const 行 = page.getByTestId(`ゴミ箱の記録-${ゴミ箱.id}`);
  await expect(行).toBeVisible({ timeout: 15_000 });
  await 行.click();
  await expect(page.getByTestId('ゴミ箱の帯')).toBeVisible({ timeout: 15_000 });
  return ゴミ箱.id;
}

test('ゴミ箱の詳細から復元でき、完全に削除すると開き直しても戻らない', async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  題 = `e2e ゴミ箱の巡り ${testInfo.project.name}`;
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);

  // 記録を 1 つ作って保存する（前の回の途中で残っていれば、それを使う）
  await page.waitForTimeout(2_000);
  const 前の = await 手元の記録(page);
  if (!前の.一覧 && !前の.ゴミ箱) {
    await page.getByText('記録', { exact: true }).first().click();
    await page.getByText('人', { exact: true }).first().click();
    await こうなるまで待つ(() => page.locator('[data-testid^="名の欄-射手-"]').count(), (n) => n === 1, 20_000);
    await page.getByLabel('終了して保存').click();
    const 次へ = page.getByText(/次へ|保存へ進む/).first();
    if (await 次へ.isVisible({ timeout: 3_000 }).catch(() => false)) await 次へ.click();
    await expect(page.getByText('練習記録の保存', { exact: true })).toBeVisible({ timeout: 15_000 });
    await 確かに打つ(page.getByPlaceholder('大会名・練習名（例: ○○大会）'), 題);
    await page.getByText('保存', { exact: true }).first().click();
    await こうなるまで待つ(async () => (await 手元の記録(page)).一覧 ? 1 : 0, (n) => n === 1, 20_000);
  }

  // 消す → ゴミ箱の詳細 → 復元 → 一覧に戻っている
  await page.getByText('履歴', { exact: true }).first().click();
  if (!前の.ゴミ箱) await 一覧から消す(page);
  await ゴミ箱の詳細へ(page);
  await page.getByRole('button', { name: 'この記録を復元する' }).click();
  await こうなるまで待つ(async () => { const r = await 手元の記録(page); return r.一覧 && !r.ゴミ箱 ? 1 : 0; }, (n) => n === 1, 20_000);

  // もう一度消す → ゴミ箱の詳細 → 完全に削除 → 手元から消え、ゴミ箱の一覧へ戻る
  await page.getByText('履歴', { exact: true }).first().click();
  await 一覧へ戻す(page);
  await 一覧から消す(page);
  const id = await ゴミ箱の詳細へ(page);
  await page.getByRole('button', { name: 'この記録を完全に削除する' }).click();
  await expect(page.getByText('完全に削除', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  await page.getByText('削除', { exact: true }).last().click();
  await expect(page.getByText('ゴミ箱', { exact: true }), 'ゴミ箱の一覧へ戻らない').toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId(`ゴミ箱の記録-${id}`)).toHaveCount(0);
  await こうなるまで待つ(async () => { const r = await 手元の記録(page); return !r.一覧 && !r.ゴミ箱 ? 1 : 0; }, (n) => n === 1, 20_000);

  // 雲にも残っていない：開き直して、雲から取り直しても戻ってこない
  await page.waitForTimeout(3_000);
  await page.reload();
  await 画面が出るまで待つ(page);
  await page.waitForTimeout(5_000);
  const 後 = await 手元の記録(page);
  expect(後.一覧, '完全に削除したのに一覧に戻ってきた').toBeFalsy();
  expect(後.ゴミ箱, '完全に削除したのにゴミ箱に戻ってきた').toBeFalsy();
});
