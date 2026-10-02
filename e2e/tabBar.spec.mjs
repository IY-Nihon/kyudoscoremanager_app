/**
 * 上のバー（記録・履歴・分析・メンバー・出欠・設定）の絵と並べ方の検査。
 *
 *   PW_PORT=8093 npx playwright test e2e/tabBar.spec.mjs
 *
 * ■ 見たいこと
 *   ・最近の携帯の幅（機種ごとの幅）では、どのタブも「絵＋名前」で、帯が窓からはみ出さない
 *   ・狭い端末（300px）では、絵だけになり、今いるタブだけ名前が出る。帯は窓に収まる
 *   ・絵だけでも、名前でタブを押せる（getByText と role=tab のどちらでも）。名前は読み上げ用の
 *     label としても付いている
 *   ・タブを押すと、今いるタブが移る（aria-selected）
 *
 * この検査は団体には書き込まない（開いて、タブを押して見るだけ）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

const 団体 = '100001';
test.use({ storageState: 'e2e/.auth/100001.json' });
const 合言葉 = 'StgTest!2026';
const 団体のタブ = ['記録', '履歴', '分析', 'メンバー', '出欠', '設定'];

async function 入る(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  const 番号欄 = page.getByPlaceholder('例: 123456');
  if (await 番号欄.isVisible().catch(() => false)) {
    await 番号欄.click();
    await 番号欄.pressSequentially(団体, { delay: 20 });
    const 合言葉欄 = page.locator('input[type="password"]').first();
    await 合言葉欄.click();
    await 合言葉欄.pressSequentially(合言葉, { delay: 20 });
    await page.getByText('ログイン', { exact: true }).click();
    await 入り口が決まるまで待つ(page);
  }
  await expect(page.getByRole('tablist')).toBeVisible({ timeout: 60_000 });
}

/** 帯と、タブごとの様子（名前が見えるか、絵があるか）を読む */
async function 帯を読む(page) {
  return page.evaluate(() => {
    const 帯 = document.querySelector('[role="tablist"]');
    const r = 帯.getBoundingClientRect();
    return {
      左: Math.round(r.left),
      右: Math.round(r.right),
      窓: window.innerWidth,
      タブ: [...帯.querySelectorAll('[role="tab"]')].map((タブ) => {
        const 名前 = タブ.getAttribute('aria-label');
        // 名前の字の要素。見えない名前は opacity 0 で置いてある
        const 字 = [...タブ.querySelectorAll('div')].find((e) => e.children.length === 0 && e.textContent === 名前);
        return {
          名前,
          選ばれている: タブ.getAttribute('aria-selected') === 'true',
          絵: !!タブ.querySelector('svg'),
          名前が見える: !!字 && Number(getComputedStyle(字).opacity) > 0,
        };
      }),
    };
  });
}

test('今の機種の幅では、団体の 6 タブがぜんぶ「絵＋名前」で、帯が窓に収まる', async ({ page }) => {
  await 入る(page);
  const 帯 = await 帯を読む(page);
  expect(帯.タブ.map((t) => t.名前)).toEqual(団体のタブ);
  for (const タブ of 帯.タブ) {
    expect(タブ.絵, `${タブ.名前} に絵が無い`).toBe(true);
    expect(タブ.名前が見える, `${タブ.名前} の名前が見えない`).toBe(true);
  }
  expect(帯.左, '帯が左にはみ出す').toBeGreaterThanOrEqual(0);
  expect(帯.右, '帯が右にはみ出す').toBeLessThanOrEqual(帯.窓);
});

test('狭い端末（300px）は絵だけ。今いるタブだけ名前が出て、帯は窓に収まる', async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 700 });
  await 入る(page);
  const 帯 = await 帯を読む(page);
  expect(帯.タブ.map((t) => t.名前)).toEqual(団体のタブ);
  for (const タブ of 帯.タブ) {
    expect(タブ.絵, `${タブ.名前} に絵が無い`).toBe(true);
    expect(タブ.名前が見える, `${タブ.名前}：名前は、今いるタブだけ見える`).toBe(タブ.選ばれている);
  }
  expect(帯.左).toBeGreaterThanOrEqual(0);
  expect(帯.右).toBeLessThanOrEqual(帯.窓);
});

test('絵だけでも、名前でタブを押せて、今いるタブが移る（role と getByText のどちらでも）', async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 700 });
  await 入る(page);
  await page.getByRole('tab', { name: '履歴', exact: true }).click();
  await expect(page.getByRole('tab', { name: '履歴', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: '記録', exact: true })).toHaveAttribute('aria-selected', 'false');
  // これまでの検査は、名前の字でタブを押している。絵だけのタブでも押せること
  await page.getByText('分析', { exact: true }).first().click();
  await expect(page.getByRole('tab', { name: '分析', exact: true })).toHaveAttribute('aria-selected', 'true');
  // 今いるタブが移ると、名前の出るタブも移る
  const 帯 = await 帯を読む(page);
  expect(帯.タブ.filter((t) => t.名前が見える).map((t) => t.名前)).toEqual(['分析']);
});

test('広がったら、絵＋名前に戻る（幅の変化に追いつく）', async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 700 });
  await 入る(page);
  expect((await 帯を読む(page)).タブ.filter((t) => t.名前が見える).length).toBe(1);
  await page.setViewportSize({ width: 800, height: 700 });
  await expect
    .poll(async () => (await 帯を読む(page)).タブ.filter((t) => t.名前が見える).length, { message: '広げても絵だけのまま' })
    .toBe(6);
});
