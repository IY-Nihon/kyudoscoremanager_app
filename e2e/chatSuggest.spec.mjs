/**
 * AIアシスタントの質問例が、分類ごとに全部出ることの検査。
 *
 *   npx playwright test e2e/chatSuggest.spec.mjs
 *
 * 前は分類ごとに1件ずつ・5件だけ出していた。11件あるうちの5件なので、
 * 「成績のことは1つしか聞けない」ように見えていた。
 * 分類を左に置いて、その行を横へ流せば、縦は5行のままで全部に届く。
 *
 * 見たいのは3つ。
 *   ・分類の見出しが出ること
 *   ・1分類に2件以上ある分類で、2件目も画面に在ること（横に流せば届く）
 *   ・長い文が途中で切れていないこと（2行まで折り返す）
 *
 * この検査は団体には書き込まない（開いて見るだけ）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

const 団体 = '100001';
test.use({ storageState: 'e2e/.auth/100001.json' });
const 合言葉 = 'StgTest!2026';

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
}

/**
 * AIの窓を開く。
 *
 * 浮くボタンは**記録の画面には出ない**（盤面を覆わないため。
 * AIChatBot.js の `currentRouteName === "記録"` の分岐）。
 * 記録のまま探すと「入口が見つからない」で落ちるので、先に画面を移る
 */
/**
 * 記録が手元に届くまで待つ。
 *
 * 質問例は団体の中身から作る。「成績」の分類は記録があるときだけ出る
 * （src/chatSuggestions.js の 記録あり）。ところが e2e/.auth の控えは
 * 記録を持っていない（同期の完了を待たずに保存されるため）ので、
 * 雲から取り直すまでは記録なしの質問例になる。
 * 窓が開いたことだけを待って分類を見ると、取り直しが間に合った回だけ
 * 通る検査になる（実際 iPhone で落ちた）。
 */
async function 記録が届くまで待つ(page, 上限 = 60_000) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          try {
            const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')?.state || {};
            return (s.sessions || []).length;
          } catch (e) {
            return 0;
          }
        }),
      { timeout: 上限, message: '記録が手元に届かない（質問例が記録なしのまま作られる）' }
    )
    .toBeGreaterThan(0);
}

async function AIを開く(page) {
  await 入る(page);
  // 分類は記録の有無で変わる。届く前に開くと「成績」が出ない
  await 記録が届くまで待つ(page);
  await page.getByText('履歴', { exact: true }).first().click();
  const 釦 = page.getByTestId('AIを開く');
  await expect(釦, 'AIの入口が見つからない').toBeVisible({ timeout: 20_000 });
  await 釦.click();
  await expect(page.getByText('こんなことが聞けます'), 'AIの窓が開かない').toBeVisible({
    timeout: 20_000,
  });
}

test('質問例：分類ごとに出て、2件目以降も画面に在る', async ({ page }) => {
  test.setTimeout(180_000);
  await AIを開く(page);

  // 分類の見出し。記録のある団体なら、少なくとも成績と使い方は出る
  for (const 分類 of ['成績', '使い方'])
    await expect(page.getByText(分類, { exact: true }).first(), `分類「${分類}」が出ていない`).toBeVisible();

  // 質問例の札の数。前は5件だった
  const 札の数 = await page.evaluate(() => {
    const 前置き = [...document.querySelectorAll('div')].find(
      (e) => (e.textContent || '').trim() === 'こんなことが聞けます'
    );
    if (!前置き) return 0;
    const 枠 = 前置き.parentElement;
    return [...枠.querySelectorAll('div')].filter((e) => /[？?]$/.test((e.textContent || '').trim()))
      .length;
  });
  expect(札の数, `質問例が5件以下しか出ていない（${札の数}件）`).toBeGreaterThan(5);
});

test('質問例：ホイールを回すと横へ流れる', async ({ page }) => {
  // 横に並べた札は、指では流せてもマウスでは動かせない。
  // ホイールは縦にしか効かないので、乗せている間だけ横へ回している
  test.setTimeout(180_000);
  await AIを開く(page);

  // 流す先のある行（札がはみ出している行）を選ぶ
  const 前後 = await page.evaluate(async () => {
    const 前置き = [...document.querySelectorAll('div')].find(
      (e) => (e.textContent || '').trim() === 'こんなことが聞けます'
    );
    if (!前置き) return { 訳: '前置きが無い' };
    const 枠 = 前置き.parentElement;
    const 行 = [...枠.querySelectorAll('div')].find(
      (e) => e.scrollWidth > e.clientWidth + 4 && e.clientWidth > 0
    );
    if (!行) return { 訳: 'はみ出している行が無い' };
    const 前 = 行.scrollLeft;
    行.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, bubbles: true, cancelable: true }));
    await new Promise((r) => setTimeout(r, 300));
    return { 前, 後: 行.scrollLeft, 幅: 行.scrollWidth, 見え: 行.clientWidth };
  });

  expect(前後.訳, '流す先のある行が見つからない: ' + JSON.stringify(前後)).toBeUndefined();
  expect(前後.後, `ホイールで横へ流れない（${前後.前} → ${前後.後}）`).toBeGreaterThan(前後.前);
});

test('質問例：長い文が途中で切れていない', async ({ page }) => {
  // 1行で切ると、長い例の末尾が見えず、何を聞けるのかが伝わらない
  test.setTimeout(180_000);
  await AIを開く(page);

  const 切れ = await page.evaluate(() => {
    const 前置き = [...document.querySelectorAll('div')].find(
      (e) => (e.textContent || '').trim() === 'こんなことが聞けます'
    );
    if (!前置き) return ['前置きが無い'];
    const 枠 = 前置き.parentElement;
    // 葉（中に別の要素を持たないもの）だけを見る。
    // 行そのものは横へ流すためにわざとはみ出しているので、
    // 一緒に数えると「切れている」と誤って言うことになる
    return [...枠.querySelectorAll('div')]
      .filter((e) => e.childElementCount === 0)
      .filter((e) => /[？?]$/.test((e.textContent || '').trim()))
      .filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)
      .map((e) => (e.textContent || '').trim());
  });
  expect(切れ, '札の中で文が切れている: ' + 切れ.join(' / ')).toEqual([]);
});

/**
 * 浮くボタンは指で引いて角へ動かせる（左右×上下）。
 *
 * パソコン（マウス）で引くと、字の上を通ったときに字の選択が始まり、
 * react-native-web の responder が選択の合図で責任を取り上げて、
 * ボタンが途中で止まっていた。記録表の取っ手と同じ直し方をしてある。
 * 引き終わりに角へ吸い付き、置いた角は端末（localStorage）に残ること
 */
test('改善のため、チャットの質問と答えを送る', async ({ page }) => {
  test.setTimeout(180_000);
  const 送った = [];
  await page.route(/workers\.dev\/hozon/, async (route) => {
    const r = route.request();
    if (r.method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, PUT, OPTIONS',
          'access-control-allow-headers': 'Authorization, Content-Type',
        },
      });
    送った.push(r.postDataJSON());
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' });
  });
  // Gemini の返事は差し替える（本物は呼ばない）
  await page.route(/workers\.dev\/v1beta\//, (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream', 'access-control-allow-origin': '*' },
      body:
        'data: ' +
        JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: '的中は矢が的に当たることです。' }] }, finishReason: 'STOP' }] }) +
        '\n\n',
    })
  );
  await AIを開く(page);
  const 欄 = page.getByPlaceholder('メッセージを入力...');
  await 欄.fill('的中とは？');
  await page.getByTestId('AIに送る').click();
  await expect(page.getByText('的中は矢が的に当たることです。')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => 送った.length, { timeout: 15_000, message: 'チャットの記録を送っていない' }).toBeGreaterThan(0);
  expect(送った[0].種類).toBe('チャット');
  expect(送った[0].中身.質問).toBe('的中とは？');
  expect(送った[0].中身.答え).toBe('的中は矢が的に当たることです。');
  expect(送った[0].中身.結果).toBe('答えた');
});

test('浮くボタン：横へ引くと左の角へ動き、置いた角が残る', async ({ page }) => {
  await 入る(page);
  await page.getByText('履歴', { exact: true }).first().click();
  const 釦 = page.getByTestId('AIを開く');
  await expect(釦, 'AIの入口が見つからない').toBeVisible({ timeout: 20_000 });
  // 角はアプリの枠（親）の中で決まる。パソコンでは窓よりアプリの枠が狭いことがあるので、
  // 窓の幅ではなく枠の実測で見る（前は窓の幅で計算していて、枠の外へ飛び出していた）
  const 枠 = await 釦.evaluate((el) => {
    const r = el.parentElement.getBoundingClientRect();
    return { x: r.x, right: r.right };
  });
  const 前 = await 釦.boundingBox();
  expect(前.x, '前提：ボタンが右に無い').toBeGreaterThan((枠.x + 枠.right) / 2);

  // 引く。字（記録の一覧）の上を通る道で、何回かに分けて動かす
  await page.mouse.move(前.x + 前.width / 2, 前.y + 前.height / 2);
  await page.mouse.down();
  await page.mouse.move(枠.x + 40, 前.y + 前.height / 2 - 30, { steps: 15 });
  await page.mouse.up();
  // 角へ吸い付く動き（spring）が終わるまで待つ。途中で次を掴みにいくと空振りする
  await expect
    .poll(async () => Math.round((await 釦.boundingBox()).x - 枠.x), {
      timeout: 10_000,
      message: 'ボタンが左の角（枠から20px）に来ない',
    })
    .toBe(20);
  const 覚え = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('aiButtonPos_v1') || 'null');
    } catch (e) {
      return null;
    }
  });
  expect(覚え && 覚え.x, '置いた角が端末に残っていない').toBe('left');
  // 引いただけでは窓は開かない
  await expect(page.getByText('こんなことが聞けます')).toHaveCount(0);

  // 右へ戻す（次の検査のために元の角へ）
  const いま = await 釦.boundingBox();
  await page.mouse.move(いま.x + いま.width / 2, いま.y + いま.height / 2);
  await page.mouse.down();
  await page.mouse.move(枠.right - 40, いま.y + いま.height / 2 + 30, { steps: 15 });
  await page.mouse.up();
  await expect
    .poll(async () => Math.round(枠.right - (await 釦.boundingBox()).x - いま.width), {
      timeout: 10_000,
      message: 'ボタンが右の角（枠から20px）へ戻らない',
    })
    .toBe(20);
});
