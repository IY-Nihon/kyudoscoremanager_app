/**
 * 管理者の合言葉（2026-11-14）。中継の /kanri があるとき（手元のエミュレーターの中継の代わり。npm run e2e:emu）だけ流す。
 * 配っている中継に /kanri がまだ無い検証環境では、前の窓（管理者認証）になるので飛ばす。
 *
 *   npm run e2e:emu -- e2e/kanriAikotoba.spec.mjs
 *   SHOT_DIR=撮る先 … 窓の写真を撮る
 *
 * 流れ：初めて（説明とログインのパスワード）→ 新しい合言葉（2 回違うと断る。ログインのパスワードと同じでもよい：11/18 本人）→ 管理者モード →
 * 切る → 合言葉で入る（違うと残りの回数）→ 合言葉を変える。団体 100007（エミュレーターなので雲には書かない。記録には書き込まない）
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

const 団体 = '100007';
const ログインの字 = 検証のパスワード();
test.use({ storageState: 'e2e/.auth/100007.json' });
test.skip(process.env.FB_EMULATOR !== '1', '中継の /kanri があるのは手元のエミュレーターだけ（配るまで）');

const 撮る = async (page, 名, 情報) => {
  if (!process.env.SHOT_DIR) return;
  await page.waitForTimeout(600);
  await page.getByTestId('管理者の合言葉の窓').screenshot({
    path: path.join(process.env.SHOT_DIR, `${情報.project.name}-${名}.png`),
  });
};

test('管理者の合言葉：初めて作り、入り、変える', async ({ page }, 情報) => {
  test.setTimeout(180_000);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, ログインの字);
  await page.getByText('設定', { exact: true }).first().click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  const 切り替える = () =>
    page.evaluate(() => {
      const 行 = [...document.querySelectorAll('div')].find(
        (e) => (e.textContent || '').trim() === '管理者モード'
      );
      let 親 = 行;
      for (let i = 0; i < 6 && 親; i++) {
        const 切替 = 親.querySelector('input[type="checkbox"], [role="switch"]');
        if (切替) return void 切替.click();
        親 = 親.parentElement;
      }
    });
  const 窓 = page.getByTestId('管理者の合言葉の窓');
  const 誤り = page.getByTestId('管理者の合言葉の誤り');
  const 決める = page.getByTestId('管理者の合言葉を決める');

  // 初めて：何のための合言葉かと、ログインのパスワード
  await 切り替える();
  await expect(窓.getByText('管理者の合言葉を作ります', { exact: true })).toBeVisible({ timeout: 20_000 });
  await 撮る(page, '1-初めて', 情報);
  await page.getByLabel('ログインのパスワード').fill('ちがうパスワード');
  await 決める.click();
  await expect(誤り).toHaveText('ログインのパスワードが正しくありません', { timeout: 20_000 });
  await page.getByLabel('ログインのパスワード').fill(ログインの字);
  await 決める.click();

  // 新しい合言葉
  await expect(page.getByLabel('新しい合言葉')).toBeVisible({ timeout: 20_000 });
  await 撮る(page, '2-新しく', 情報);
  await page.getByLabel('新しい合言葉').fill('yumi-2026');
  await page.getByLabel('もう一度').fill('yumi-2027');
  await 決める.click();
  await expect(誤り).toHaveText('2 回の合言葉が違います');
  await page.getByLabel('新しい合言葉').fill('yumi-2026');
  await page.getByLabel('もう一度').fill('yumi-2026');
  await 決める.click();
  await expect(窓).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByTestId('管理者の合言葉を変える')).toBeVisible({ timeout: 10_000 });

  // 切って、合言葉で入る
  await 切り替える();
  await expect(page.getByTestId('管理者の合言葉を変える')).toHaveCount(0, { timeout: 10_000 });
  await 切り替える();
  await expect(page.getByLabel('管理者の合言葉')).toBeVisible({ timeout: 20_000 });
  await page.getByLabel('管理者の合言葉').fill('yumi-9999');
  await 決める.click();
  await expect(誤り).toContainText('合言葉が違います（あと 4 回', { timeout: 20_000 });
  await 撮る(page, '3-入る', 情報);
  await page.getByLabel('管理者の合言葉').fill('yumi-2026');
  await 決める.click();
  await expect(窓).toHaveCount(0, { timeout: 20_000 });

  // 合言葉を変える
  await page.getByTestId('管理者の合言葉を変える').click();
  await expect(窓.getByText('管理者の合言葉を変える', { exact: true })).toBeVisible();
  await 撮る(page, '4-変える', 情報);
  await page.getByLabel('今の合言葉').fill('yumi-2026');
  await page.getByLabel('新しい合言葉（6〜64 字）').fill('yumi-2028');
  await page.getByLabel('新しい合言葉をもう一度').fill('yumi-2028');
  await 決める.click();
  await expect(窓).toHaveCount(0, { timeout: 20_000 });

  // 開き直しても、印の期限までは管理者モードのまま。期限の過ぎた控えで開き直すと切れる（11/19 の見直し：前は時計が消え、
  // 印が切れたあとも画面は管理者モードのままだった）
  const 設定へ = () => page.getByRole('tab', { name: '設定' }).first().click();
  await page.waitForTimeout(1500); // 控えのまとめ書きを待つ
  await page.reload();
  await 画面が出るまで待つ(page);
  await 設定へ();
  await expect(page.getByTestId('管理者の合言葉を変える'), '開き直したら期限の前に切れた').toBeVisible({
    timeout: 20_000,
  });
  // 次に開くとき、控えの期限を過去にしてから読ませる（開いている画面が控えを書き戻さないよう、読み込みの最初に直す）
  await page.addInitScript(() => {
    if (sessionStorage.getItem('期限を過去に')) return;
    sessionStorage.setItem('期限を過去に', '1');
    const 鍵 = 'archery-score-storage';
    const 控え = JSON.parse(localStorage.getItem(鍵) || '{}');
    if (控え.state) {
      控え.state.管理者の期限 = Date.now() - 60_000;
      localStorage.setItem(鍵, JSON.stringify(控え));
    }
  });
  await page.reload();
  await 画面が出るまで待つ(page);
  await 設定へ();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('管理者の合言葉を変える'), '期限が過ぎても管理者モードのまま').toHaveCount(
    0,
    {
      timeout: 20_000,
    }
  );
});
