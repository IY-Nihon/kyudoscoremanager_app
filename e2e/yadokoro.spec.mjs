/**
 * 矢所の検査（2026-10-05 の聞き取りで決めた形）。
 *
 *   npx playwright test e2e/yadokoro.spec.mjs
 *
 * 入れ方は設定で 3 つ（的で入れる＝既定／○×のあと的が開く／あとでまとめて）。どれでも○×に合わない側には
 * 置けない。表は置いたマスに小さな点だけ、マスの長押しでその射の窓。矢所の画面へは表の上の取っ手の横の
 * 丸いボタンから（下の道具は増やさない）。src/YadokoroView.js・src/YadokoroWindow.js・src/yadokoroRules.js
 *
 * ■ 団体には書き込まない
 * 盤面は端末の中だけ（保存しない）。矢所の ON と入れ方は端末の設定で、雲へは送られない。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  ますが増えるまで待つ,
} from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

async function 始める(page, { 使う = true, 人数 = 1, 入れ方 = '的で' } = {}) {
  await 案内を止める(page);
  await page.addInitScript(
    ([使う, 入れ方]) => {
      const 鍵 = 'archery-score-storage';
      const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
      const 状態 = (中 && 中.state) || {};
      状態.enableArrowLocation = 使う;
      状態.矢所の入れ方 = 入れ方;
      状態.arrowTargetType = 'kasumi36';
      状態.archers = [];
      状態.shotsPerRound = 8;
      localStorage.setItem(鍵, JSON.stringify(Object.assign({}, 中, { state: 状態 })));
    },
    [使う, 入れ方]
  );
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await page.getByText('記録', { exact: true }).first().click();
  for (let 人 = 0; 人 < 人数; 人++) {
    await page.locator('[aria-label="射手を追加"]').first().click();
    await ますが増えるまで待つ(page, 8 * (人 + 1));
  }
}

/** 射手の列（区切り・計を除く）の 印 と 矢所 を控えから読む */
const 控えを読む = (page) =>
  page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {};
    return (s.archers || [])
      .filter((x) => x && !x.isSeparator && !x.isTotalCalculator)
      .map((人) => ({
        id: 人.id,
        印: 人.marks || [],
        矢所: (人.arrowLocations || []).map((l) => (l ? { x: l.x, y: l.y } : null)),
      }));
  });

/** マスを長押しする（0.5 秒で窓が開く） */
async function 長押し(page, testID) {
  const 枠 = await page.getByTestId(testID).boundingBox();
  await page.mouse.move(枠.x + 枠.width / 2, 枠.y + 枠.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
}

/** 的の中心から（的の半径を 1 として）ずらした所を押す */
async function 的を押す(page, 横ずれ, 縦ずれ, 的 = '矢所-的') {
  const 枠 = await page.getByTestId(的).boundingBox();
  const 半径 = (枠.width * 0.75) / 2;
  await page.mouse.click(枠.x + 枠.width / 2 + 横ずれ * 半径, 枠.y + 枠.height / 2 + 縦ずれ * 半径);
}

const 開く = async (page) => {
  await page.getByTestId('矢所の画面を開く').click();
  await expect(page.getByTestId('矢所の画面'), '矢所の画面が出ない').toBeVisible({ timeout: 10_000 });
};

test('矢所の記録が OFF のときは、丸いボタンを出さない', async ({ page }) => {
  await 始める(page, { 使う: false });
  await expect(page.locator('[data-testid^="ます-"]').first()).toBeVisible();
  await expect(page.getByTestId('矢所の画面を開く')).toHaveCount(0);
});

test('的を押すと矢所と○×が入って次の射へ進む。外は×。取り消しで戻り、表には○×だけが出る', async ({
  page,
}) => {
  await 始める(page);
  // 表には矢所の部品を出さない（前の「矢所の行」）
  await expect(page.locator('[data-testid^="矢所の行"]')).toHaveCount(0);
  await 開く(page);
  // 下の道具（人・保存など）は隠れて、的が大きく出る
  await expect(page.locator('[aria-label="射手を追加"]')).toHaveCount(0);
  const 枠 = await page.getByTestId('矢所-的').boundingBox();
  expect(枠.width, '的が小さい').toBeGreaterThanOrEqual(240);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');

  // 真ん中 → ○。位置は中心の近く。次の射（2 射目）へ進む
  await 的を押す(page, 0.1, -0.1);
  await expect
    .poll(async () => (await 控えを読む(page))[0].印[0], {
      timeout: 10_000,
      message: '中を押したのに○にならない',
    })
    .toBe('○');
  let 控え = await 控えを読む(page);
  expect(Math.abs(控え[0].矢所[0].x - 0.1), '押した所と位置がずれている').toBeLessThan(0.08);
  expect(Math.abs(控え[0].矢所[0].y + 0.1), '押した所と位置がずれている').toBeLessThan(0.08);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('2射目');

  // 的の外 → ×（x は 1 より大きい）。3 射目へ
  await 的を押す(page, 1.2, 0);
  await expect
    .poll(async () => (await 控えを読む(page))[0].印[1], {
      timeout: 10_000,
      message: '外を押したのに×にならない',
    })
    .toBe('\xd7');
  控え = await 控えを読む(page);
  expect(控え[0].矢所[1].x, '外の位置が的の外にならない').toBeGreaterThan(1);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('3射目');

  // 取り消し：位置と○×が一緒に戻り、その射へ戻る
  await page.getByTestId('矢所-取り消し').click();
  await expect
    .poll(
      async () => {
        const c = (await 控えを読む(page))[0];
        return `${c.印[1]}|${c.矢所[1]}`;
      },
      { timeout: 10_000, message: '取り消しで位置と○×が一緒に戻らない' }
    )
    .toBe('|null');
  await expect(page.getByTestId('矢所-いまの射')).toContainText('2射目');

  // 射を押して選び直す。置いてある射に置き直すときは進まない
  await page.getByTestId('矢所-射-0').click();
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');
  await 的を押す(page, -0.3, 0.2);
  await expect
    .poll(async () => (await 控えを読む(page))[0].矢所[0]?.x, { timeout: 10_000 })
    .toBeLessThan(-0.2);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');

  // 表へ戻ると、表は○×だけ（1 射目＝下のマスに○）
  await page.getByTestId('矢所-表へ').click();
  await expect(page.getByTestId('矢所の画面')).toHaveCount(0);
  const id = (await 控えを読む(page))[0].id;
  await expect(page.getByTestId(`ます-${id}-0`)).toContainText('○');
  // 置いたマスにだけ小さな点（2 射目は取り消したので点が無い）
  await expect(page.getByTestId(`矢所の点-${id}-0`), '置いたマスに点が無い').toBeVisible();
  await expect(page.getByTestId(`矢所の点-${id}-1`)).toHaveCount(0);
});

test('○×に合わない側には置けない（○の射の的の外を押しても、何も変わらない）', async ({ page }) => {
  await 始める(page);
  const id = (await 控えを読む(page))[0].id;
  // 表で 1 射目に○を入れておく
  await page.getByTestId(`ます-${id}-0`).click();
  await expect.poll(async () => (await 控えを読む(page))[0].印[0], { timeout: 10_000 }).toBe('○');
  await 開く(page);
  // ○だけ入っていて矢所が無いので、開いたときは 1 射目
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');
  await 的を押す(page, 1.2, 0.2);
  await expect(page.getByTestId('矢所-知らせ'), '置けないことを知らせない').toContainText(
    '的の中に置いてください',
    {
      timeout: 10_000,
    }
  );
  await page.waitForTimeout(500);
  expect((await 控えを読む(page))[0].印[0], '○×が変わった').toBe('○');
  expect((await 控えを読む(page))[0].矢所[0], '合わない側に置いた').toBeNull();
  // 中なら置ける
  await 的を押す(page, 0.2, 0.2);
  await expect
    .poll(async () => (await 控えを読む(page))[0].矢所[0]?.x, { timeout: 10_000 })
    .toBeGreaterThan(0.1);
});

test('的で入れる（既定）は隣の人の同じ射へ進む。全員で人を選べる', async ({ page }) => {
  await 始める(page, { 人数: 2 });
  const [甲, 乙] = await 控えを読む(page);
  await 開く(page);
  await expect(page.getByTestId(`矢所-人-${甲.id}`)).toHaveAttribute('aria-selected', 'true');
  await 的を押す(page, 0, 0);
  await expect(page.getByTestId(`矢所-人-${乙.id}`), '隣の人へ進まない').toHaveAttribute(
    'aria-selected',
    'true',
    {
      timeout: 10_000,
    }
  );
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');

  // 全員：狭い画面は「全員」に切り替える。広い画面は最初から並んでいる
  const 全員の札 = page.getByTestId('矢所-全員');
  if (await 全員の札.isVisible().catch(() => false)) await 全員の札.click();
  await expect(page.getByTestId(`矢所-全員-${甲.id}`)).toBeVisible();
  await expect(page.getByTestId(`矢所-全員-${乙.id}`)).toBeVisible();
  await page.getByTestId('矢所-範囲-全部').click();
  await page.getByTestId(`矢所-全員-${甲.id}`).click();
  await expect(page.getByTestId(`矢所-人-${甲.id}`)).toHaveAttribute('aria-selected', 'true', {
    timeout: 10_000,
  });
  await expect(page.getByTestId('矢所-的')).toBeVisible();
  // 甲は 1 射目が置いてあるので、この立ちで置いていない最初の射（2 射目）
  await expect(page.getByTestId('矢所-いまの射')).toContainText('2射目');
});

test('あとでまとめて：名前を押すと、その人のその立ちの 4 本を続けて置ける', async ({ page }) => {
  await 始める(page, { 人数: 2, 入れ方: 'まとめて' });
  const [, 乙] = await 控えを読む(page);
  await 開く(page);
  await page.getByTestId(`矢所-人-${乙.id}`).click();
  await expect(page.getByTestId(`矢所-人-${乙.id}`)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');
  await 的を押す(page, 0, 0);
  await expect(page.getByTestId('矢所-いまの射'), '同じ人の次の射へ進まない').toContainText('2射目', {
    timeout: 10_000,
  });
  await expect(page.getByTestId(`矢所-人-${乙.id}`)).toHaveAttribute('aria-selected', 'true');
  await 的を押す(page, 1.2, 0);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('3射目', { timeout: 10_000 });
  const 乙の控え = (await 控えを読む(page))[1];
  expect(乙の控え.印.slice(0, 2)).toEqual(['○', String.fromCharCode(0xd7)]);
});

test('○×のあと的が開く：○×を押すと大きな窓が開き、置いても閉じず「完了」で閉じる', async ({ page }) => {
  await 始める(page, { 入れ方: '○×のあと' });
  const id = (await 控えを読む(page))[0].id;
  await page.getByTestId(`ます-${id}-0`).click();
  await expect(page.getByTestId('矢所の窓'), '○×のあとに窓が開かない').toBeVisible({ timeout: 10_000 });
  const 枠 = await page.getByTestId('矢所の窓-的').boundingBox();
  expect(枠.width, '窓の的が小さい').toBeGreaterThanOrEqual(260);
  // ○なので外には置けない。中に置くと置ける。置いても閉じない
  await 的を押す(page, 1.2, 0, '矢所の窓-的');
  await expect(page.getByTestId('矢所の窓-知らせ')).toContainText('的の中に置いてください');
  await 的を押す(page, -0.2, 0.1, '矢所の窓-的');
  await expect
    .poll(async () => (await 控えを読む(page))[0].矢所[0]?.x, { timeout: 10_000 })
    .toBeLessThan(-0.1);
  await expect(page.getByTestId('矢所の窓')).toBeVisible();
  await page.getByTestId('矢所の窓-完了').click();
  await expect(page.getByTestId('矢所の窓')).toHaveCount(0);
  await expect(page.getByTestId(`矢所の点-${id}-0`)).toBeVisible();
});

test('マスの長押しでその射の窓が開く（的で入れるでも）。空の射なら置くと○×も入る', async ({ page }) => {
  await 始める(page);
  const id = (await 控えを読む(page))[0].id;
  // 押すだけでは窓は開かない（的で入れるとき）
  await page.getByTestId(`ます-${id}-1`).click();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('矢所の窓')).toHaveCount(0);
  await 長押し(page, `ます-${id}-2`);
  await expect(page.getByTestId('矢所の窓'), '長押しで窓が開かない').toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('矢所の窓-射')).toContainText('3射目');
  await 的を押す(page, 1.3, -0.2, '矢所の窓-的');
  await expect
    .poll(async () => (await 控えを読む(page))[0].印[2], { timeout: 10_000 })
    .toBe(String.fromCharCode(0xd7));
  // 長押しは○×を切り替えない（ほかの射は変わらない）
  expect((await 控えを読む(page))[0].印[1]).toBe('○');
  await page.getByTestId('矢所の窓-消す').click();
  await expect.poll(async () => (await 控えを読む(page))[0].矢所[2], { timeout: 10_000 }).toBeNull();
  await page.getByTestId('矢所の窓-完了').click();
  await expect(page.getByTestId('矢所の窓')).toHaveCount(0);
});

test('飛ばす・消す・立ちの移り', async ({ page }) => {
  await 始める(page);
  await 開く(page);
  await page.getByTestId('矢所-飛ばす').click();
  await expect(page.getByTestId('矢所-いまの射')).toContainText('2射目');
  await page.getByTestId('矢所-立-次').click();
  await expect(page.getByTestId('矢所-立')).toContainText('2立目');
  await expect(page.getByTestId('矢所-いまの射')).toContainText('5射目');
  await 的を押す(page, 0.2, 0.2);
  await expect.poll(async () => (await 控えを読む(page))[0].印[4], { timeout: 10_000 }).toBe('○');
  await page.getByTestId('矢所-射-4').click();
  await page.getByTestId('矢所-消す').click();
  await expect
    .poll(async () => (await 控えを読む(page))[0].矢所[4], {
      timeout: 10_000,
      message: '消すで位置が消えない',
    })
    .toBeNull();
  expect((await 控えを読む(page))[0].印[4], '消すは位置だけ。○×はそのまま').toBe('○');
  await page.getByTestId('矢所-立-前').click();
  await expect(page.getByTestId('矢所-立')).toContainText('1立目');
});

test('的の切り替え：いまの的の矢だけ出し、ほかの的で置いた射を選ぶと的も切り替わる', async ({ page }) => {
  await 始める(page);
  const 的の種類 = () =>
    page.evaluate(
      () =>
        JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
          ?.state?.arrowTargetType
    );
  await 開く(page);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');
  // 霞的で 1 射目を置く（2 射目へ進む）
  await 的を押す(page, 0.2, 0.2);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('2射目', { timeout: 10_000 });
  // 星的へ切り替える（狭い画面は「全員」の中にある）
  const 全員の札 = page.getByTestId('矢所-全員');
  if (await 全員の札.isVisible().catch(() => false)) await 全員の札.click();
  await page.getByTestId('矢所-的の種類').click();
  await expect.poll(的の種類, { timeout: 10_000 }).toBe('hoshi36');
  const 入れる札 = page.getByTestId('矢所-入れる');
  if (await 入れる札.isVisible().catch(() => false)) await 入れる札.click();
  // 1 射目は霞的で置いたので、射のボタンに的の名前が出る
  await expect(page.getByTestId('矢所-射-0'), 'ほかの的で置いた射に的の名前が出ない').toContainText('霞的');
  // 2 射目は星的で置く。種類が残る
  await 的を押す(page, -0.2, 0.1);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const s =
            JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
              ?.state || {};
          const 人 = (s.archers || []).find((x) => x && !x.isSeparator && !x.isTotalCalculator);
          return (人.arrowLocations || [])
            .slice(0, 2)
            .map((l) => l && l.targetType)
            .join(',');
        }),
      { timeout: 10_000 }
    )
    .toBe('kasumi36,hoshi36');
  // 1 射目を選ぶと、的が霞的に戻る
  await page.getByTestId('矢所-射-0').click();
  await expect
    .poll(的の種類, { timeout: 10_000, message: '射を選んでも的が切り替わらない' })
    .toBe('kasumi36');
  await expect(page.getByTestId('矢所-知らせ')).toContainText('的を切り替えました');
});
