/**
 * 団体のパスワードを変える（設定。2026-11-26 U1 本人「管理者モードでなくても出す」）。手元のエミュレーター（npm run e2e:emu）だけで流す
 * （パスワードを本当に変えるので、検証環境の団体では流さない。団体はこの検査が回ごとに作る：e2e/emu-dantai.mjs）。
 *
 *   npm run e2e:emu -- e2e/dantaiPassword.spec.mjs
 *   SHOT_DIR=撮る先 … 窓の写真を撮る
 *
 * 流れ：団体アカウントで入る → 設定の「団体のパスワードを変える」→ 空のまま押すと欄の下に入力漏れ（U5）
 *   → 今のパスワードを間違えると欄の下に「パスワードが違います」→ 正しく入れると変わる
 *   → 新しい端末：前のパスワードでは入れない・新しいパスワードで入れる
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';
import { 検査の団体を作る } from './emu-dantai.mjs';

test.skip(process.env.FB_EMULATOR !== '1', 'パスワードを本当に変えるので、手元のエミュレーターだけ');

const 前 = 検証のパスワード();
const 新しい = 'kensa-' + Date.now().toString(36);

const 撮る = async (的, 名, 情報) => {
  if (!process.env.SHOT_DIR) return;
  await 的.page().waitForTimeout(400);
  await 的.screenshot({ path: path.join(process.env.SHOT_DIR, `${情報.project.name}-パスワード-${名}.png`) });
};

async function 開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
}

test('団体のパスワードを変えると、前のパスワードでは入れず、新しいパスワードで入れる', async ({
  browser,
}, 情報) => {
  test.setTimeout(240_000);
  const 団体 = await 検査の団体を作る('pass');
  const 場 = await browser.newContext({ ...情報.project.use, storageState: { cookies: [], origins: [] } });
  const page = await 場.newPage();
  await 開く(page);
  await 団体で入る(page, 団体, 前);
  await page.getByRole('tab', { name: '設定' }).first().click();
  // 管理者モードでなくても出す（11/26 本人）
  await page.getByText('団体のパスワードを変える', { exact: true }).click();
  const 窓 = page.getByTestId('団体のパスワードの窓');
  await expect(窓).toBeVisible({ timeout: 15_000 });
  const 決める = 窓.getByTestId('団体のパスワードを決める');
  // 空のまま押すと欄の下に
  await 決める.click();
  await expect(窓.getByTestId('入力の誤り-今のパスワード')).toHaveText('今のパスワードを入力してください');
  await expect(窓.getByTestId('入力の誤り-新しいパスワード（6文字以上）')).toHaveText(
    '新しいパスワードを入力してください'
  );
  await 撮る(窓, '1-入力漏れ', 情報);
  // 今のパスワードを間違える
  await 窓.getByTestId('団体のパスワード-今').fill('chigau-pass');
  await expect(窓.getByTestId('入力の誤り-今のパスワード')).toHaveCount(0);
  await 窓.getByTestId('団体のパスワード-新しい').fill(新しい);
  await 窓.getByTestId('団体のパスワード-もう一度').fill(新しい);
  await 決める.click();
  await expect(窓.getByTestId('入力の誤り-今のパスワード')).toHaveText('パスワードが違います', {
    timeout: 20_000,
  });
  // 正しく入れると変わる
  await 窓.getByTestId('団体のパスワード-今').fill(前);
  await 決める.click();
  await expect(窓.getByTestId('団体のパスワードを変えた')).toBeVisible({ timeout: 20_000 });
  await 撮る(窓, '2-変えた', 情報);
  await 窓.getByText('閉じる', { exact: true }).click();
  await expect(窓).toHaveCount(0);
  // 変えた端末はそのまま使える（ログイン画面に戻らない）
  await expect(page.getByPlaceholder('例: 123456')).toHaveCount(0);

  // 新しい端末：前のパスワードでは入れない
  const 別 = await browser.newContext({ ...情報.project.use, storageState: { cookies: [], origins: [] } });
  const 別の頁 = await 別.newPage();
  await 開く(別の頁);
  const 番号欄 = 別の頁.getByPlaceholder('例: 123456');
  await 番号欄.fill(団体);
  await 別の頁.locator('input[type="password"]').first().fill(前);
  await 別の頁.getByText('ログイン', { exact: true }).click();
  await expect(別の頁.getByTestId('アプリの帯').or(別の頁.getByTestId('アプリの窓'))).toBeVisible({
    timeout: 30_000,
  });
  await expect(番号欄).toBeVisible();
  // 新しいパスワードで入れる
  await 別の頁.reload();
  await 開く(別の頁);
  await 団体で入る(別の頁, 団体, 新しい);
  await 別.close();
  await 場.close();
});
