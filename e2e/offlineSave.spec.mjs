/**
 * 電波が弱いときの「終了・保存」の検査。
 *
 *   npx playwright test e2e/offlineSave.spec.mjs
 *
 * ■ なぜこれを入れたか
 *
 * 個人ログインの保存は「雲にすでにある記録か」を getDoc で確かめてから手元に
 * 確定していた。電波が弱い（つながっているのに応答が来ない）と getDoc が返らず、
 * 「保存しました」と出るのに記録表が残り、もう一度押せてしまった（2026-09-19）。
 * 電波を切る（setOffline）と Firestore がすぐ諦めるので再現しない。応答が来ない
 * 形（route で握りつぶす）でないと出ない型なので、その形で見る。
 *
 * ■ 団体には書き込まない
 * 保存は通信を止めたまま行い、電波を戻さずに閉じる。雲へは届かない。
 * 100002 を使う他の検査と並べて流してよい。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100002-個人.json' });

/** 出欠の確認を飛ばして、保存の窓へ直に進む */
async function 出欠の確認を切る(page) {
  await page.addInitScript(() => {
    const 鍵 = 'archery-score-storage';
    let 中 = {};
    try {
      中 = JSON.parse(localStorage.getItem(鍵) || '{}') || {};
    } catch {
      中 = {};
    }
    中.state = Object.assign({}, 中.state || {}, { 保存時に出欠を確認する: false });
    if (中.version == null) 中.version = 0;
    localStorage.setItem(鍵, JSON.stringify(中));
  });
}

test('個人ログイン：雲が応答しなくても、終了・保存で記録表が片付き、手元に未同期で残る', async ({ page }) => {
  test.setTimeout(120_000);
  await 案内を止める(page);
  await 出欠の確認を切る(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await expect(page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 30_000 });

  await page.getByText('人', { exact: true }).first().click();
  const ます = page.locator('[data-testid^="ます-"]');
  await expect(ます.first()).toBeVisible();
  await ます.first().click();

  // 通信を「応答が来ない」形で止める。切る（setOffline）と Firestore がすぐ
  // 諦めてしまい、実際の弓道場の電波の弱さと違う
  await page.route(/googleapis\.com|firebaseio\.com/, () => {});

  await page.getByText('終了・保存', { exact: true }).click();
  await page.getByPlaceholder('大会名・練習名（例: ○○大会）').fill('電波なしの保存');
  await page.getByText('保存', { exact: true }).last().click();

  // 雲の応答を待たずに、記録表が片付く
  await expect(ます).toHaveCount(0, { timeout: 5_000 });
  const 手元 = await page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        .state || {};
    return (s.sessions || []).filter((x) => x && x.title === '電波なしの保存').map((x) => x.syncStatus);
  });
  expect(手元, '手元の控えに 1 件だけ、未同期で入る').toEqual(['未同期']);
  // 電波は戻さない（検証環境に記録を残さない）
});
