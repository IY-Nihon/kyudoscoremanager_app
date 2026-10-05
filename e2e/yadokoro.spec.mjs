/**
 * 矢所の画面（記録画面の下の「矢所」で替わる画面）の検査（2026-10-05 に作り直した）。
 *
 *   npx playwright test e2e/yadokoro.spec.mjs
 *
 * 前の形（○×のあとに開く窓・表の下の矢所の行・矢所ノート）は、入れるのが手間で遅い・表がごちゃごちゃ・
 * 全員の矢所が分からない・スマホで小さい、が困りごとだった。いまは記録表に矢所を出さず、専用の画面で
 * 大きな的を押す（src/YadokoroView.js・決まりは src/yadokoroRules.js）。
 *
 * ■ 団体には書き込まない
 * 盤面は端末の中だけ（保存しない）。矢所の ON と進み方は端末の設定で、雲へは送られない。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  ますが増えるまで待つ,
} from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100007.json' });

async function 始める(page, { 使う = true, 人数 = 1, 進み方 = '人を回る' } = {}) {
  await 案内を止める(page);
  await page.addInitScript(
    ([使う, 進み方]) => {
      const 鍵 = 'archery-score-storage';
      const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
      const 状態 = (中 && 中.state) || {};
      状態.enableArrowLocation = 使う;
      状態.矢所の進み方 = 進み方;
      状態.arrowTargetType = 'kasumi36';
      状態.archers = [];
      状態.shotsPerRound = 8;
      localStorage.setItem(鍵, JSON.stringify(Object.assign({}, 中, { state: 状態 })));
    },
    [使う, 進み方]
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

/** 的の中心から（的の半径を 1 として）ずらした所を押す */
async function 的を押す(page, 横ずれ, 縦ずれ) {
  const 枠 = await page.getByTestId('矢所-的').boundingBox();
  const 半径 = (枠.width * 0.75) / 2;
  await page.mouse.click(枠.x + 枠.width / 2 + 横ずれ * 半径, 枠.y + 枠.height / 2 + 縦ずれ * 半径);
}

const 開く = async (page) => {
  await page.getByTestId('矢所の画面を開く').click();
  await expect(page.getByTestId('矢所の画面'), '矢所の画面が出ない').toBeVisible({ timeout: 10_000 });
};

test('矢所の記録が OFF のときは、下の道具に「矢所」を出さない', async ({ page }) => {
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
});

test('○×と合わない側を押すと、黙って変えずに聞く。「×に直して置く」で直る', async ({ page }) => {
  await 始める(page);
  const id = (await 控えを読む(page))[0].id;
  // 表で 1 射目に○を入れておく
  await page.getByTestId(`ます-${id}-0`).click();
  await expect.poll(async () => (await 控えを読む(page))[0].印[0], { timeout: 10_000 }).toBe('○');
  await 開く(page);
  // ○だけ入っていて矢所が無いので、開いたときは 1 射目
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');
  await 的を押す(page, 1.2, 0.2);
  await expect(page.getByTestId('矢所-食い違い'), '食い違いを聞かない').toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(500);
  expect((await 控えを読む(page))[0].印[0], '聞く前に○×が変わった').toBe('○');
  expect((await 控えを読む(page))[0].矢所[0], '聞く前に置いた').toBeNull();

  // やめると何も変わらない。もう一度押して、今度は直す
  await page.getByTestId('矢所-食い違い-やめる').click();
  await expect(page.getByTestId('矢所-食い違い')).toHaveCount(0);
  await 的を押す(page, 1.2, 0.2);
  await page.getByTestId('矢所-食い違い-直す').click();
  await expect
    .poll(async () => (await 控えを読む(page))[0].印[0], {
      timeout: 10_000,
      message: '直して置いたのに×にならない',
    })
    .toBe('\xd7');
  expect((await 控えを読む(page))[0].矢所[0].x).toBeGreaterThan(1);
});

test('進み方：隣の人（既定）は次の人の同じ射、同じ人はその人の次の射。全員で人を選べる', async ({ page }) => {
  await 始める(page, { 人数: 2 });
  const [甲, 乙] = await 控えを読む(page);
  await 開く(page);
  await expect(page.getByTestId(`矢所-人-${甲.id}`)).toHaveAttribute('aria-selected', 'true');

  // 隣の人：甲の 1 射目 → 乙の 1 射目
  await 的を押す(page, 0, 0);
  await expect(page.getByTestId(`矢所-人-${乙.id}`), '隣の人へ進まない').toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 10_000 }
  );
  await expect(page.getByTestId('矢所-いまの射')).toContainText('1射目');

  // 同じ人へ切り替える：乙の 1 射目 → 乙の 2 射目
  await page.getByTestId('矢所-進み方').click();
  await expect(page.getByTestId('矢所-進み方')).toContainText('次は同じ人');
  await 的を押す(page, 0, 0.5);
  await expect(page.getByTestId('矢所-いまの射')).toContainText('2射目', { timeout: 10_000 });
  await expect(page.getByTestId(`矢所-人-${乙.id}`)).toHaveAttribute('aria-selected', 'true');
  // 進み方は端末に残る
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
              ?.state?.矢所の進み方
        ),
      { timeout: 10_000 }
    )
    .toBe('同じ人');

  // 全員：狭い画面は「全員」に切り替える。広い画面は最初から並んでいる
  const 全員の札 = page.getByTestId('矢所-全員');
  if (await 全員の札.isVisible().catch(() => false)) await 全員の札.click();
  await expect(page.getByTestId(`矢所-全員-${甲.id}`)).toBeVisible();
  await expect(page.getByTestId(`矢所-全員-${乙.id}`)).toBeVisible();
  // 全部の射へ切り替えても出る。甲を押すと、甲の射へ（入れる側へ戻る）
  await page.getByTestId('矢所-範囲-全部').click();
  await page.getByTestId(`矢所-全員-${甲.id}`).click();
  await expect(page.getByTestId(`矢所-人-${甲.id}`)).toHaveAttribute('aria-selected', 'true', {
    timeout: 10_000,
  });
  await expect(page.getByTestId('矢所-的')).toBeVisible();
  // 甲は 1 射目が置いてあるので、この立ちで置いていない最初の射（2 射目）
  await expect(page.getByTestId('矢所-いまの射')).toContainText('2射目');
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
