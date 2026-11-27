// 写真の読み取りは、答えが届く前に窓を閉じても読み続け、届いたら記録画面の帯で知らせる。
// [見る] で、届いた結果（確かめの画面）が出る。まだ読んでいるうちに開き直せば、読み取り中の画面に戻る。
// 読めなかったときも帯で知らせ、[見る] で同じ写真と訳の出た窓が開く（2026-11-20 本人「閉じても読み続ける」）。
// Gemini の返事は差し替え、門を開けるまで返さない（混んだ日の長い待ちの代わり）。名前は架空
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

const 立ち順の返事 = {
  tachi: [
    { fuda: '壱', row: 1, seats: [] },
    { fuda: '', row: 1, seats: ['架空一', '架空二'] },
    { fuda: '弐', row: 1, seats: [] },
    { fuda: '', row: 1, seats: ['架空三'] },
  ],
};

/** 中継の読み取りを門で止める。門を開けたら 返事 を返す（状態 503 なら混雑の断り） */
async function 中継を止めておく(page, 状態 = 200) {
  let 開ける;
  const 門 = new Promise((r) => (開ける = r));
  let 呼ばれた = 0;
  await page.route(
    /(?:workers\.dev|127\.0\.0\.1:8788)\/v1beta\/models\/[^/]+:generateContent/,
    async (route) => {
      呼ばれた++;
      await 門;
      if (状態 !== 200)
        return route.fulfill({
          status: 状態,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 状態,
              message: 'This model is currently experiencing high demand.',
              status: 'UNAVAILABLE',
            },
          }),
        });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [
            {
              content: { role: 'model', parts: [{ text: JSON.stringify(立ち順の返事) }] },
              finishReason: 'STOP',
            },
          ],
        }),
      });
    }
  );
  // 改善のための保存は本物へ送らない（送った文は取っておき、印を確かめる）
  const 保存 = [];
  await page.route(/(?:workers\.dev|127\.0\.0\.1:8788)\/hozon/, (route) => {
    保存.push(route.request().postData() || '');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: '{"ok":true}',
    });
  });
  return { 開ける: () => 開ける(), 呼ばれた: () => 呼ばれた, 保存: () => 保存 };
}

/** 記録画面で立ち順の写真を選んで読み始め、読み取り中の画面まで進める */
async function 読み始める(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, '100007', 検証のパスワード());
  await page.getByText('画像', { exact: true }).first().click();
  await expect(page.getByText('画像から立ち順を登録', { exact: true })).toBeVisible();
  const 選ぶ = page.waitForEvent('filechooser');
  await page.getByText('画像を選択', { exact: true }).click();
  await (await 選ぶ).setFiles('docs/ocr-samples/hitotsu.png');
  await expect(page.getByText('1枚目', { exact: true })).toBeVisible();
  await page.getByText('この画像で解析する', { exact: true }).click();
  await expect(page.getByText('AIが立ち順表を読み取っています...', { exact: true })).toBeVisible();
}

test.describe('閉じても読み続ける', () => {
  test.use({ storageState: 'e2e/.auth/100007.json' });

  test('待つ間に秒と説明を出し、閉じたあとに届いたら帯で知らせ、[見る] で確かめの画面が出る', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const 中継 = await 中継を止めておく(page);
    await 読み始める(page);
    // 10 秒を過ぎたら説明（混んでいる日は 1〜3 分・閉じても読み続ける）
    await expect(page.getByTestId('ocr-matta-byou')).toBeVisible();
    await expect(page.getByTestId('ocr-matsu-setsumei')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('ocr-matsu-setsumei')).toContainText('閉じても読み続け');
    // 閉じる（戻るの確かめは出さない）。まだ届いていないので帯は無い
    await page.getByTestId('ocr-tojiru').click();
    await expect(page.getByText('画像から立ち順を登録', { exact: true })).toBeHidden();
    await expect(page.getByTestId('読み取りの届いた帯')).toHaveCount(0);
    // 届く
    中継.開ける();
    await expect(page.getByTestId('読み取りの届いた帯')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('読み取りの届いた帯')).toContainText('立ち順の読み取りが届きました');
    await page.getByTestId('読み取りの届いた帯-見る').click();
    await expect(page.getByText('記録表に反映する', { exact: true })).toBeVisible();
    await expect(page.getByText('架空一(ゲスト)', { exact: true })).toBeVisible();
    await expect(page.getByTestId('読み取りの届いた帯')).toHaveCount(0);
    expect(中継.呼ばれた(), '開き直したときに読み直した').toBe(1);
    await page.getByText('記録表に反映する', { exact: true }).click();
    await expect(page.getByText('画像から立ち順を登録', { exact: true })).toBeHidden();
    await expect(page.getByText('架空三', { exact: true }).first()).toBeVisible();
  });

  test('ほかの画面にいても帯が出て、[見る] で記録画面の確かめの画面が開く（11/28 本人）', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const 中継 = await 中継を止めておく(page);
    await 読み始める(page);
    await page.getByTestId('ocr-tojiru').click();
    await expect(page.getByText('画像から立ち順を登録', { exact: true })).toBeHidden();
    // 履歴の画面へ移ってから届く
    await page.getByText('履歴', { exact: true }).first().click();
    await expect(page).toHaveURL(/\/history/);
    中継.開ける();
    await expect(page.getByTestId('読み取りの届いた帯')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('読み取りの届いた帯')).toContainText('立ち順の読み取りが届きました');
    await page.getByTestId('読み取りの届いた帯-見る').click();
    await expect(page).not.toHaveURL(/\/history/);
    await expect(page.getByText('記録表に反映する', { exact: true })).toBeVisible();
    await expect(page.getByTestId('読み取りの届いた帯')).toHaveCount(0);
    expect(中継.呼ばれた(), '開き直したときに読み直した').toBe(1);
  });

  test('まだ読んでいるうちに開き直すと、読み取り中の画面に戻り、届いたら確かめの画面になる', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const 中継 = await 中継を止めておく(page);
    await 読み始める(page);
    await page.getByTestId('ocr-tojiru').click();
    await expect(page.getByText('画像から立ち順を登録', { exact: true })).toBeHidden();
    // 開き直す（同じ読み取りにつなぎ直す。新しく読まない）
    await page.getByText('画像', { exact: true }).first().click();
    await expect(page.getByText('AIが立ち順表を読み取っています...', { exact: true })).toBeVisible();
    中継.開ける();
    await expect(page.getByText('記録表に反映する', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('架空二(ゲスト)', { exact: true })).toBeVisible();
    expect(中継.呼ばれた()).toBe(1);
  });

  test('読み取り中の「やめる」は確かめてから写真を選ぶ画面に戻り、届いた答えは出さない（11/25 本人「足す」）', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const 中継 = await 中継を止めておく(page);
    await 読み始める(page);
    // 「続ける」なら読み取り中のまま
    await page.getByTestId('ocr-yameru').click();
    await expect(page.getByTestId('アプリの窓')).toContainText('読み取りを中止しますか？');
    await page.getByTestId('窓のボタン-続ける').click();
    await expect(page.getByText('AIが立ち順表を読み取っています...', { exact: true })).toBeVisible();
    // やめる。写真は残り、すぐ読み直せる
    await page.getByTestId('ocr-yameru').click();
    await page.getByTestId('窓のボタン-読み取りを中止').click();
    await expect(page.getByText('この画像で解析する', { exact: true })).toBeVisible();
    await expect(page.getByText('1枚目', { exact: true })).toBeVisible();
    // 届いても確かめの画面にはならない。ログには、やめた印を付けて送る
    中継.開ける();
    await expect
      .poll(() => 中継.保存().some((文) => 文.includes('読んでいる途中でやめた')), { timeout: 30_000 })
      .toBe(true);
    await expect(page.getByText('記録表に反映する', { exact: true })).toHaveCount(0);
    await expect(page.getByText('この画像で解析する', { exact: true })).toBeVisible();
    // 閉じても帯は出ない（預けていない）
    await page.getByTestId('ocr-tojiru').click();
    await expect(page.getByText('画像から立ち順を登録', { exact: true })).toBeHidden();
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('読み取りの届いた帯')).toHaveCount(0);
  });

  test('閉じたあとに読めなかったときも帯で知らせ、[見る] で同じ写真と訳の出た窓が開く', async ({ page }) => {
    test.setTimeout(180_000);
    const 中継 = await 中継を止めておく(page, 503);
    await 読み始める(page);
    await page.getByTestId('ocr-tojiru').click();
    中継.開ける();
    await expect(page.getByTestId('読み取りの届いた帯')).toContainText('立ち順の読み取りができませんでした', {
      timeout: 60_000,
    });
    await page.getByTestId('読み取りの届いた帯-見る').click();
    await expect(page.getByText(/混み合っています/)).toBeVisible();
    // 訳の文と「この画像で解析する」は写真の下にある。開いたら、そこまで送って見えるようにする
    await expect(page.getByText(/混み合っています/)).toBeInViewport();
    await expect(page.getByText('この画像で解析する', { exact: true })).toBeInViewport();
    await expect(page.getByText('1枚目', { exact: true })).toBeVisible();
    // もう一度閉じて読み直さない。帯は出ない
    await page.getByTestId('ocr-tojiru').click();
    await expect(page.getByTestId('読み取りの届いた帯')).toHaveCount(0);
  });

  test('帯の × で、届いた結果を捨てる（次に開くと新しい読み取りの画面）', async ({ page }) => {
    test.setTimeout(180_000);
    const 中継 = await 中継を止めておく(page);
    await 読み始める(page);
    await page.getByTestId('ocr-tojiru').click();
    中継.開ける();
    await expect(page.getByTestId('読み取りの届いた帯')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('読み取りの届いた帯-閉じる').click();
    await expect(page.getByTestId('読み取りの届いた帯')).toHaveCount(0);
    await page.getByText('画像', { exact: true }).first().click();
    await expect(page.getByText('画像を選択', { exact: true })).toBeVisible();
    await expect(page.getByText('記録表に反映する', { exact: true })).toHaveCount(0);
    await expect(page.getByText('1枚目', { exact: true })).toHaveCount(0);
  });

  test('待つ間にほかのタブへ移っても読み続け、記録のタブに戻ると帯が出る', async ({ page }) => {
    test.setTimeout(180_000);
    const 中継 = await 中継を止めておく(page);
    await 読み始める(page);
    await page.getByTestId('ocr-tojiru').click();
    await page.getByText('履歴', { exact: true }).first().click();
    中継.開ける();
    // 届くのを待ってから戻る（記録画面はタブを移っても残る）
    await expect.poll(() => 中継.呼ばれた()).toBe(1);
    await page.waitForTimeout(1500);
    await page.getByText('記録', { exact: true }).first().click();
    await expect(page.getByTestId('読み取りの届いた帯')).toContainText('立ち順の読み取りが届きました', {
      timeout: 30_000,
    });
    await page.getByTestId('読み取りの届いた帯-見る').click();
    await expect(page.getByText('記録表に反映する', { exact: true })).toBeVisible();
  });
});
