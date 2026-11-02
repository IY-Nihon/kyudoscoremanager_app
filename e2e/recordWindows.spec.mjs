/**
 * 記録画面の窓（表示の拡大率・射数）の検査（2026-10-05）。
 *
 *   npx playwright test e2e/recordWindows.spec.mjs
 *
 * 記録画面の窓を RecordScreen.js から別のファイル（RecordZoom.js・RecordShots.js ほか）へ切り出したときに
 * 足した。拡大率の窓を踏む E2E が無く、射数の窓も一覧から選ぶ道は踏んでいなかった。
 *  ・拡大率：「表示」を押すと窓が出る。⊕ で 5% 上がり、一覧から 150% を選ぶと表示の倍率が 1.5 になる
 *  ・射数：射数を押すと窓が出る。一覧から 12射 を選ぶと 12 射になる。自由入力の窓で 500 を超えると止まる
 *
 * ■ 団体には書き込まない
 * 表示の倍率と射数は端末の中だけ。盤面は保存しない。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 確かに打つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

const 控え = (page) =>
  page.evaluate(
    () =>
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {}
  );

async function 記録画面へ(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('記録', { exact: true }).first().click();
  await expect(page.getByText('表示', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
}

test('拡大率の窓：開いて ⊕ で上がり、一覧から 150% を選べる', async ({ page }) => {
  await 記録画面へ(page);
  const 前 = (await 控え(page)).viewScale || 1;
  await page.getByText('表示', { exact: true }).first().click();
  const 大きく = page.locator('[aria-label="表示を大きくする"]');
  await expect(大きく, '拡大率の窓が出ない').toBeVisible({ timeout: 10_000 });
  await 大きく.click();
  await expect
    .poll(async () => Math.round(((await 控え(page)).viewScale || 1) * 100), { timeout: 10_000 })
    .toBe(Math.round(Math.min(2, 前 + 0.05) * 100));
  await page.getByText('150%', { exact: true }).click();
  await expect
    .poll(async () => (await 控え(page)).viewScale, {
      timeout: 10_000,
      message: '150% を選んでも倍率が変わらない',
    })
    .toBe(1.5);
});

test('射数の窓：一覧から 12射 を選べる。自由入力は 500 を超えると止まる', async ({ page }) => {
  await 記録画面へ(page);
  await page
    .getByText(/^\d+射$/)
    .first()
    .click();
  await expect(page.getByText('射数の設定', { exact: true }), '射数の窓が出ない').toBeVisible({
    timeout: 10_000,
  });
  await page.getByText('12射', { exact: true }).click();
  await expect.poll(async () => (await 控え(page)).shotsPerRound, { timeout: 10_000 }).toBe(12);

  // 自由入力（射数の窓の最後の行から）
  await page.getByText('12射', { exact: true }).first().click();
  await page.getByText('任意...', { exact: true }).click();
  const 欄 = page.getByLabel('射数', { exact: true });
  await expect(欄, '自由入力の窓が出ない').toBeVisible({ timeout: 10_000 });
  // WebKit では fill() の値が画面の状態に届かないことがあるので、1 字ずつ打って確かめる
  await 確かに打つ(欄, '600');
  await 欄.press('Enter');
  await expect(page.getByText('1〜500までの数字を入力してください', { exact: true }).first()).toBeVisible({
    timeout: 10_000,
  });
  expect((await 控え(page)).shotsPerRound, '500 を超えた射数が入った').toBe(12);
});

test('保存の窓：タグの打ちかけ（後ろの空白・「#」だけ）を消さず、同じタグは 1 つにする（保存はしない）', async ({
  page,
}) => {
  await 記録画面へ(page);
  // 人を 1 人立ててから「終了・保存」で窓を開く
  await page.getByText('人', { exact: true }).first().click();
  await expect(page.locator('[data-testid^="名の欄-射手-"]')).toHaveCount(1, { timeout: 20_000 });
  await page.getByText('終了・保存', { exact: true }).first().click();
  // 出欠の確かめが入っていれば先に出る
  const 出欠 = page.getByText('出欠を確定して次へ', { exact: true });
  if (await 出欠.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true, () => false)) {
    await 出欠.click();
    // 出欠の窓は消える動きが終わると、開く前の焦点（「終了・保存」）を戻す（RN-web の Modal）。
    // 終わる前に打ち始めると、途中で欄から焦点が外れる
    await expect(page.getByText('出欠の最終確認', { exact: true })).toHaveCount(0, { timeout: 10_000 });
    await page.waitForTimeout(800);
  }
  const 欄 = page.getByLabel('タグ', { exact: true });
  await expect(欄, '保存の窓が出ない').toBeVisible({ timeout: 10_000 });

  // 1 字ずつ打つ（打つたびにタグを整えても、欄の字は打ったまま）
  await 欄.fill('');
  await 欄.pressSequentially('雨天 #', { delay: 30 });
  await expect(欄).toHaveValue('雨天 #');
  await 欄.pressSequentially('審査 雨天', { delay: 30 });
  await expect(欄).toHaveValue('雨天 #審査 雨天');
  // しまう形はほかと同じ決まり（# を付け、同じものは 1 つ）
  const 控えのタグ = async () => {
    await page.evaluate(() => globalThis.__弓道の控えを書く?.());
    return (await 控え(page)).currentSessionTags;
  };
  await expect.poll(控えのタグ, { timeout: 10_000 }).toEqual(['#雨天', '#審査']);

  // 保存はせずに閉じる
  await page.getByText('キャンセル', { exact: true }).last().click();
});

test('窓の中を押しても閉じない。外側（幕）を押すと閉じる（射数・ライブの選び・履歴の年度）', async ({ page }) => {
  await 記録画面へ(page);
  // 窓の外の左上の角（窓はどれも真ん中か下にある）
  const 外を押す = () => page.mouse.click(8, 8);

  // 射数：見出しを押しても閉じない
  await page
    .getByText(/^\d+射$/)
    .first()
    .click();
  const 射数の見出し = page.getByText('射数の設定', { exact: true });
  await expect(射数の見出し).toBeVisible({ timeout: 10_000 });
  await 射数の見出し.click();
  await page.waitForTimeout(400);
  await expect(射数の見出し, '見出しを押したら閉じた').toBeVisible();
  await 外を押す();
  await expect(射数の見出し, '外を押しても閉じない').toHaveCount(0, { timeout: 10_000 });

  // ライブの選び：外を押すと閉じる（中はボタンだけ）
  await page.getByText('ライブ', { exact: true }).first().click();
  const 開始 = page.getByText('ライブ記録を開始', { exact: true });
  await expect(開始).toBeVisible({ timeout: 10_000 });
  await 外を押す();
  await expect(開始, '外を押しても閉じない').toHaveCount(0, { timeout: 10_000 });

  // 履歴の年度：見出しを押しても閉じない
  await page.getByText('履歴', { exact: true }).first().click();
  await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
  await page.getByText(/年度/).first().click();
  const 年度の見出し = page.getByText('年度を選択', { exact: true });
  await expect(年度の見出し).toBeVisible({ timeout: 10_000 });
  await 年度の見出し.click();
  await page.waitForTimeout(400);
  await expect(年度の見出し, '見出しを押したら閉じた').toBeVisible();
  await 外を押す();
  await expect(年度の見出し, '外を押しても閉じない').toHaveCount(0, { timeout: 10_000 });
});
