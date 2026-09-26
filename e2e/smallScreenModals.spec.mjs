/**
 * 小さい画面でも、窓のボタンにすべて届く（画面に出ているか、流せば出る）。
 *
 *   npx playwright test e2e/smallScreenModals.spec.mjs
 *
 * メンバーの編集の窓が画面より長くなって「保存する」に届かなかった（2026-09-26）。
 * 同じ形の窓がほかに無いかを、よく使う窓を小さい画面で開いて確かめる。
 * 窓の中のボタン・入力欄が、画面の外にあって、しかも流せる入れ物の中にも無ければ届かない。
 * 開いて見るだけで保存はしない（団体には書き込まない扱い）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ } from './helpers.mjs';

const 団体 = '100001';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100001.json' });

/** 設定の画面で管理者モードを入れる（memberInvite.spec.mjs と同じ） */
async function 管理者モードにする(page) {
  await page.getByText('設定', { exact: true }).first().click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  const もう入っている = await page.getByText('アカウントを削除する', { exact: true }).isVisible();
  if (もう入っている) return;
  await page.evaluate(() => {
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
  await expect(page.getByText('管理者認証', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder('パスワード').fill(合言葉);
  await page.getByText('認証', { exact: true }).click();
  await expect(page.getByText('管理者認証', { exact: true })).toHaveCount(0, { timeout: 30_000 });
}

/** いちばん上の窓の中で、届かないボタン・入力欄の名前を返す */
const 届かないもの = (page) =>
  page.evaluate(() => {
    const 窓たち = [...document.querySelectorAll('[aria-modal="true"]')];
    const 根 = 窓たち[窓たち.length - 1];
    if (!根) return { 窓: false, 届かない: [] };
    const 高さ = window.innerHeight;
    const 幅 = window.innerWidth;
    const 届かない = [];
    for (const 要素 of 根.querySelectorAll(
      '[role="button"], button, input, textarea, [role="switch"], [tabindex="0"]'
    )) {
      const 枠 = 要素.getBoundingClientRect();
      if (!枠.width || !枠.height) continue;
      if (枠.bottom > 2 && 枠.top < 高さ - 2 && 枠.right > 2 && 枠.left < 幅 - 2) continue;
      let 親 = 要素.parentElement;
      let 流せる = false;
      while (親 && 親 !== document.body) {
        const 様 = getComputedStyle(親);
        if (
          /(auto|scroll)/.test(様.overflowY + 様.overflowX) &&
          (親.scrollHeight > 親.clientHeight + 1 || 親.scrollWidth > 親.clientWidth + 1)
        ) {
          流せる = true;
          break;
        }
        親 = 親.parentElement;
      }
      if (!流せる)
        届かない.push(
          (
            (要素.innerText ||
              要素.getAttribute('aria-label') ||
              要素.getAttribute('placeholder') ||
              要素.tagName) + ''
          )
            .trim()
            .slice(0, 30)
        );
    }
    return { 窓: true, 届かない };
  });

// 縦は小さめの Android、横はスマホを横に倒したとき（記録表は横でも使う）
for (const [向き, 幅, 高さ] of [
  ['縦', 360, 640],
  ['横', 640, 360],
]) {
  test(`小さい画面（${向き} ${幅}×${高さ}）で、よく使う窓のボタンにすべて届く`, async ({ page }) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width: 幅, height: 高さ });
    await 案内を止める(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await 管理者モードにする(page);

    const 結果 = [];
    const 調べる = async (名, 開く) => {
      await page.goto('/');
      await 画面が出るまで待つ(page);
      try {
        await 開く();
      } catch (誤り) {
        結果.push({ 名, 開けた: false, 誤り: String(誤り.message || 誤り).split('\n')[0] });
        return;
      }
      await page.waitForTimeout(900);
      const r = await 届かないもの(page);
      結果.push({ 名, 開けた: r.窓, 届かない: r.届かない });
    };
    const 押す = (字) => page.getByText(字, { exact: true }).first().click({ timeout: 10_000 });
    const 記録へ = () => 押す('記録');

    await 調べる(
      '射数',
      async () => (
        await 記録へ(),
        await page
          .getByText(/^\d+射$/)
          .first()
          .click({ timeout: 10_000 })
      )
    );
    await 調べる('表示の大きさ', async () => (await 記録へ(), await 押す('表示')));
    await 調べる('ライブ', async () => (await 記録へ(), await 押す('ライブ')));
    await 調べる('リセット', async () => (await 記録へ(), await 押す('リセット')));
    await 調べる('人を選ぶ', async () => {
      await 記録へ();
      await page.locator('[aria-label="射手を追加"]').first().click();
      await page.waitForTimeout(800);
      await 押す('選択');
    });
    await 調べる('終了・保存', async () => (await 記録へ(), await 押す('終了・保存')));
    await 調べる('運用ガイド', async () => (await 押す('設定'), await 押す('運用ガイド・ヘルプ')));
    await 調べる('アカウントの削除', async () => (await 押す('設定'), await 押す('アカウントを削除する')));
    await 調べる('ログアウト', async () => (await 押す('設定'), await 押す('ログアウト')));
    await 調べる('メンバーの新規登録', async () => {
      await 押す('メンバー');
      await page.locator('[aria-label="部員を追加"]').first().click({ timeout: 10_000 });
    });
    // 2026-09-26 に届かなかった窓。管理者モードでは招待リンクの欄まで入って長くなる
    await 調べる('メンバーの編集', async () => {
      await 押す('メンバー');
      await 押す('案内 確認用');
      await expect(page.getByTestId('招待リンクの欄')).toBeVisible({ timeout: 20_000 });
    });
    await 調べる('記録の道具（履歴）', async () => {
      await 押す('履歴');
      await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
      await page
        .getByText(/\[.+\]/)
        .first()
        .click({ timeout: 15_000 });
      await expect(page.getByText('記録詳細', { exact: true })).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: '記録の道具' }).click();
    });
    await 調べる('記録の情報を変える（履歴）', async () => {
      await 押す('履歴');
      await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
      await page
        .getByText(/\[.+\]/)
        .first()
        .click({ timeout: 15_000 });
      await expect(page.getByText('記録詳細', { exact: true })).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: '記録の道具' }).click();
      await page.getByRole('button', { name: '記録の情報を変える' }).click({ timeout: 10_000 });
    });

    console.log(JSON.stringify(結果, null, 1));
    const 開けない = 結果.filter((x) => !x.開けた).map((x) => `${x.名}${x.誤り ? `（${x.誤り}）` : ''}`);
    const 届かない = 結果
      .filter((x) => x.届かない && x.届かない.length)
      .map((x) => `${x.名}: ${x.届かない.join('・')}`);
    expect(届かない, '小さい画面で届かないボタンがある').toEqual([]);
    expect(開けない, '窓を開けなかった（検査の手順を直す）').toEqual([]);
  });
}
