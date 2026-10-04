/**
 * 矢所ノート（マスを的にして、的を直接押すと矢所と○×が一度に入る）の検査（2026-10-04）。
 *
 *   npx playwright test e2e/arrowNote.spec.mjs
 *
 * 弓道の的中記録帳は、1 射ごとのマスに小さな的が印刷してあり、当たった所に点を打つ。それに近づけた
 * （src/ScoreCell.js の 矢所ノート・useScoreStore の 矢所を置いて印を入れる）。
 *  ・的の円の内側を押すと○、外側を押すと×（窓の「○は内側・×は外側」の決まりと同じ）
 *  ・押した位置が矢所として残る。押し直すと置き直し。取り消しは 1 回で、位置と○×が一緒に戻る
 *  ・設定が OFF（既定）のときは、今までの押すたびに○→×→空の切り替えのまま
 *
 * ■ 団体には書き込まない
 * 盤面は端末の中だけ（保存しない）。設定は端末の中で、雲へは送られない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

async function 始める(page, ノート) {
  await 案内を止める(page);
  await page.addInitScript((使う) => {
    const 鍵 = 'archery-score-storage';
    const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
    const 状態 = (中 && 中.state) || {};
    状態.enableArrowLocation = true;
    状態.矢所ノート = 使う;
    状態.viewScale = 1.5; // 押しやすい大きさ（検査で外さないため）
    localStorage.setItem(鍵, JSON.stringify(Object.assign({}, 中, { state: 状態 })));
  }, ノート);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('記録', { exact: true }).first().click();
  await page.locator('[aria-label="射手を追加"]').first().click();
  await expect(page.locator('[data-testid^="ます-"]').first(), '盤面にますが出ない').toBeVisible({ timeout: 20_000 });
}

/** 先頭の射手の印と矢所（控えから） */
const 控えを読む = (page) =>
  page.evaluate(() => {
    const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')?.state || {};
    const 人 = (s.archers || []).find((x) => x && !x.isSeparator && !x.isTotalCalculator) || {};
    return { 印: 人.marks || [], 矢所: (人.arrowLocations || []).map((l) => (l ? { x: l.x, y: l.y } : null)) };
  });

async function ますを押す(page, 番, 横ずれ, 縦ずれ) {
  const 枠 = await page.locator('[data-testid^="ます-"]').nth(番).boundingBox();
  await page.mouse.click(枠.x + 枠.width / 2 + 横ずれ * 枠.height * 0.4, 枠.y + 枠.height / 2 + 縦ずれ * 枠.height * 0.4);
}

test('矢所ノート：的の内側を押すと○、外側を押すと×。位置が残り、取り消し 1 回で一緒に戻る', async ({ page }) => {
  await 始める(page, true);
  await expect(page.getByTestId('矢所の行の見出し'), '矢所ノートなのに、列の下の的の行が出ている').toHaveCount(0);

  await ますを押す(page, 0, 0, 0); // 中心 → ○（上のますは最後の射 = 8 射目 = 添字 7）
  await expect.poll(async () => (await 控えを読む(page)).印[7], { timeout: 10_000, message: '内側を押したのに○にならない' }).toBe('○');
  let 控え = await 控えを読む(page);
  expect(Math.abs(控え.矢所[7].x), '中心を押したのに位置がずれている').toBeLessThan(0.3);

  await ますを押す(page, 1, 1.5, 0); // 右の外側 → ×
  await expect.poll(async () => (await 控えを読む(page)).印[6], { timeout: 10_000, message: '外側を押したのに×にならない' }).toBe('\xd7');
  控え = await 控えを読む(page);
  expect(控え.矢所[6].x, '外側の位置が的の外（1 より大きい）にならない').toBeGreaterThan(1);

  // 押し直すと置き直し（印も位置も入れ替わる）
  await ますを押す(page, 1, 0, 0);
  await expect.poll(async () => (await 控えを読む(page)).印[6], { timeout: 10_000 }).toBe('○');

  // 取り消しは 1 回で、位置と○×が一緒に戻る（置き直しの前＝外側の×）
  await page.getByTestId('取り消し').click();
  await expect
    .poll(async () => {
      const c = await 控えを読む(page);
      return `${c.印[6]}|${c.矢所[6] && c.矢所[6].x > 1}`;
    }, { timeout: 10_000, message: '取り消しで、位置と○×が一緒に戻らない' })
    .toBe('\xd7|true');
});

test('矢所ノートが OFF（既定）のときは、押すたびに○→×→空と切り替わる', async ({ page }) => {
  await 始める(page, false);
  await ますを押す(page, 0, 0, 0);
  await expect.poll(async () => (await 控えを読む(page)).印[7], { timeout: 10_000 }).toBe('○');
  await ますを押す(page, 0, 0, 0);
  await expect.poll(async () => (await 控えを読む(page)).印[7], { timeout: 10_000 }).toBe('\xd7');
  await ますを押す(page, 0, 0, 0);
  await expect.poll(async () => (await 控えを読む(page)).印[7], { timeout: 10_000 }).toBe('');
});
