/**
 * 区切り（間隔）まわりの検査。チーム名の帯と、区切りをまたぐ総計。
 *
 *   npx playwright test e2e/teamSeparator.spec.mjs
 *
 * ■ なぜこれを入れたか
 *
 * 1) 案内文と実際の側が逆だった。
 *    記録表は右から左へ並ぶ（row-reverse）ので、並びで区切りより後ろの
 *    射手は、画面では区切りの**左**に出る。窓の案内は「区切りから右」と
 *    書いてあり、入れた人は逆の側に色が付いたように見えていた。
 *    どちらか片方だけ直しても気づけないので、ここでは
 *    「案内文に書いてある側」を読み取って、その側に帯が出るかを見る。
 *    文だけ直しても、割り当てだけ変えても落ちる。
 *
 * 2) 合計の列を押したとき、範囲の切り替えだけをして窓を開かない作りに
 *    したことがあり、列を消す道がどこにも無くなった。押したら窓が開くこと、
 *    その中で範囲を変えられること、消す道が在ることを見る。
 *
 * ■ 団体には書き込まない
 * 射手を立てるだけで「終了・保存」はしないので、雲の記録は増えない。
 * 100001 を使う他の検査と並べて流してよい。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  こうなるまで待つ,
  団体で入る,
} from './helpers.mjs';

const 団体 = '100001';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100001.json' });

async function 入る(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);
}

/** 名前の欄がこの数になるまで「人」を押す */
async function 射手を立てる(page, 数) {
  const 人 = page.getByText('人', { exact: true }).first();
  for (let i = 0; i < 数; i++) {
    const いま = await page.locator('[data-testid^="名の欄-射手-"]').count();
    await 人.click();
    await こうなるまで待つ(
      () => page.locator('[data-testid^="名の欄-射手-"]').count(),
      (n) => n > いま,
      20000
    );
  }
}

/**
 * 名前の欄を測る。区切りの中心と、射手それぞれの中心・帯の有無を返す。
 *
 * 帯はチームの色を上辺に引いたもの。座標で当てにいくと機種ごとにずれるので、
 * 目印（testID）で拾って、計算後の見た目から読む。
 */
async function 名の欄を測る(page) {
  return page.evaluate(() => {
    const 出 = { 区切り: null, 射手: [] };
    for (const el of document.querySelectorAll('[data-testid^="名の欄-"]')) {
      const 名 = el.getAttribute('data-testid') || '';
      const r = el.getBoundingClientRect();
      const 中心 = r.x + r.width / 2;
      if (名.startsWith('名の欄-区切り-')) {
        出.区切り = { 中心 };
        continue;
      }
      if (!名.startsWith('名の欄-射手-')) continue;
      const s = getComputedStyle(el);
      const 太さ = parseFloat(s.borderTopWidth) || 0;
      const 色 = s.borderTopColor || '';
      // 透明・幅0は「帯なし」。それ以外が付いていればチームの色
      const 帯 = 太さ >= 1 && !/^rgba\(.*,\s*0\)$/.test(色) && 色 !== 'transparent';
      出.射手.push({ 名, 中心, 帯, 色 });
    }
    return 出;
  });
}

test('チームの帯は、窓の案内が言うとおりの側に出る', async ({ page }) => {
  await 入る(page);

  // 射手2人 → 区切り → 射手2人。並びで後ろの2人が、画面では区切りの逆側に出る
  await 射手を立てる(page, 2);
  await page.getByText('間隔', { exact: true }).first().click();
  await こうなるまで待つ(
    () => page.locator('[data-testid^="名の欄-区切り-"]').count(),
    (n) => n === 1,
    20000
  );
  await 射手を立てる(page, 2);

  // 区切りを長押しするとチーム名の窓が開く
  await page.locator('[data-testid^="名の欄-区切り-"]').first().click({ delay: 800 });
  const 案内 = page.getByText(/この区切り(より|から)(左|右)の射手が、そのチームになります/);
  await expect(案内, 'チーム名の窓が開かない').toBeVisible({ timeout: 20000 });

  // 案内が「左」と言っているのか「右」と言っているのかを、文から読み取る
  const 文 = await 案内.innerText();
  const 言っている側 = /より左|から左/.test(文) ? '左' : '右';

  await page.getByPlaceholder('例: ◯◯大学').fill('A大学');
  await page.getByText('決定', { exact: true }).click();

  await こうなるまで待つ(
    async () => (await 名の欄を測る(page)).射手.filter((x) => x.帯).length,
    (n) => n > 0,
    20000
  );

  const 測り = await 名の欄を測る(page);
  expect(測り.区切り, '区切りの欄が見つからない').not.toBeNull();

  const 帯あり = 測り.射手.filter((x) => x.帯);
  const 帯なし = 測り.射手.filter((x) => !x.帯);
  expect(帯あり.length, 'チームに入った射手が2人にならない').toBe(2);
  expect(帯なし.length, 'チームの外の射手が2人にならない').toBe(2);

  for (const x of 帯あり) {
    if (言っている側 === '左') {
      expect(
        x.中心,
        `案内は「${言っている側}」と言っているのに、帯が区切りの右に出ている（${x.名}）`
      ).toBeLessThan(測り.区切り.中心);
    } else {
      expect(
        x.中心,
        `案内は「${言っている側}」と言っているのに、帯が区切りの左に出ている（${x.名}）`
      ).toBeGreaterThan(測り.区切り.中心);
    }
  }
  for (const x of 帯なし) {
    if (言っている側 === '左') {
      expect(x.中心, `チームの外なのに区切りの左にいる（${x.名}）`).toBeGreaterThan(測り.区切り.中心);
    } else {
      expect(x.中心, `チームの外なのに区切りの右にいる（${x.名}）`).toBeLessThan(測り.区切り.中心);
    }
  }
});

test('合計の列は、押すと窓が開き、そこで範囲を変えられて消す道もある', async ({ page }) => {
  await 入る(page);
  await 射手を立てる(page, 2);

  await page.getByText('Σ', { exact: true }).first().click();
  const 合計 = page.locator('[data-testid^="名の欄-合計-"]').first();
  await expect(合計, '合計の列が出ない').toBeVisible({ timeout: 20000 });
  await expect(合計).toContainText('合計');

  // 押したら窓が開く。ここで範囲だけを切り替えていたころは、
  // 窓が開かず列を消せなくなっていた
  await 合計.click();
  const 総計にする = page.getByText('区切りをまたぐ総計にする', { exact: true });
  await expect(総計にする, '合計の列を押しても窓が開かない').toBeVisible({ timeout: 20000 });
  await expect(page.getByText('削除', { exact: true }), '消す道が無い').toBeVisible();

  await 総計にする.click();
  await expect(合計, '総計に切り替わらない').toContainText('総計', { timeout: 20000 });

  // 切り替えたあとも、もう一度開けること（開けないと消せない）
  await 合計.click();
  await expect(
    page.getByText('この立ちだけの合計にする', { exact: true }),
    '切り替えたあとに窓が開かない'
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('削除', { exact: true }), '消す道が無い').toBeVisible();
});
