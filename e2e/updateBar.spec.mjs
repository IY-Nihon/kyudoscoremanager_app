/**
 * 新しい版が出たことの知らせ（src/UpdateBar.js / src/updateNotice.js）。
 *
 *   npx playwright test e2e/updateBar.spec.mjs
 *
 * 開いたままのタブは、読み込み直すまで古い束のまま動く。ふだんは害が
 * 小さいが、ライブの置き場所（枝）が変わる回では、古いままの端末が別の枝を
 * 見て「相手の○×が出ない」という直しにくい形になる。
 *
 * 見たいこと。
 *   ・束が変わり、今の束のファイルがサーバーにもう無いとき（本当に配信されたとき）に帯が出ること
 *   ・変わっていないのに出さないこと（出続けると、そのうち誰も押さなくなる）
 *   ・古い控えが返っただけのときに出さないこと（更新したのに、電波が切れた瞬間にまた出ていた。
 *     取り直した index.html は sw.js が控えの前の版を返すことがある。今の束がサーバーにまだ
 *     あるかを HEAD で確かめて、あるなら出さない。src/updateNotice.js）
 *
 * ログインは要らない（帯はログインの前にも出す）。団体にも触れない。
 */
import { test, expect } from '@playwright/test';

// 控えを使わない。ログイン前の画面で足りる
test.use({ storageState: { cookies: [], origins: [] } });

/** いま読み込んでいる束の名前 */
async function いまの束(page) {
  return page.evaluate(() => {
    const 札 = [...document.querySelectorAll('script[src]')]
      .map((x) => x.getAttribute('src'))
      .filter((x) => x && /AppEntry-|\.js$/.test(x));
    return 札.length ? 札[0] : null;
  });
}

/** 取り直しの index.html を、指定した束を指す中身にすり替える */
async function 返す中身を決める(page, 束) {
  await page.route('**/index.html', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!DOCTYPE html><html><head><title>弓道記録アプリ</title></head><body><div id="root"></div><script src="${束}" defer></script></body></html>`,
    });
  });
}

/**
 * 今の束のファイルが、サーバーに「まだある／もう無い」ことにする（HEAD の答えをすり替える）。
 * 本物の配信では、前の束は消えて、求めると index.html（text/html）に回される。
 * @param {boolean|'通信できない'} まだある
 */
async function 束の有無を決める(page, 束, まだある) {
  await page.route('**' + 束.split('?')[0], async (route) => {
    if (route.request().method() !== 'HEAD') return route.continue();
    if (まだある === '通信できない') return route.abort('internetdisconnected');
    return route.fulfill({
      status: 200,
      contentType: まだある ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8',
      body: '',
    });
  });
}

/** 画面が戻ってきたことにして、見に行かせる */
async function 見に行かせる(page) {
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await page.waitForTimeout(1500);
}

test('更新の帯：束が変わったら出る', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束, '束の名前が読めない').toBeTruthy();

  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-0000000000000000000000000000ffff.js');
  await 束の有無を決める(page, 束, false);
  await 見に行かせる(page);

  await expect(page.getByText(/新しい版が出ています/), '帯が出ない').toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('更新', { exact: true })).toBeVisible();
});

test('更新の帯：束が同じなら出さない', async ({ page }) => {
  // 出続けると、押しても何も変わらず、そのうち誰も押さなくなる
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束).toBeTruthy();

  await 返す中身を決める(page, 束);
  await 見に行かせる(page);

  await expect(page.getByText(/新しい版が出ています/), '同じ束なのに帯が出た').toHaveCount(0);
});

test('更新の帯：閉じられる', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-1111111111111111111111111111ffff.js');
  await 束の有無を決める(page, 束, false);
  await 見に行かせる(page);

  const 帯 = page.getByText(/新しい版が出ています/);
  await expect(帯).toBeVisible({ timeout: 10_000 });
  await page.getByText('✕', { exact: true }).first().click();
  await page.waitForTimeout(600);
  await expect(帯, '閉じても残っている').toHaveCount(0);
});

test('更新の帯：読めない中身が返っても、帯を出さない', async ({ page }) => {
  // 当てずっぽうで出すと、押しても何も変わらない
  await page.goto('/');
  await page.waitForTimeout(3000);
  await page.route('**/index.html', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html>取れなかった</html>' });
  });
  await 見に行かせる(page);
  await expect(page.getByText(/新しい版が出ています/), '読めないのに帯が出た').toHaveCount(0);
});

test('更新の帯：「更新」を押すと読み込み直す', async ({ page }) => {
  // 押しても何も起きない釦だと、帯そのものが意味を失う。
  // 読み込み直したかどうかは、押す前に窓へ置いた印が消えることで見る
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-2222222222222222222222222222ffff.js');
  await 束の有無を決める(page, 束, false);
  await 見に行かせる(page);
  await expect(page.getByText(/新しい版が出ています/), '帯が出ない').toBeVisible({ timeout: 10_000 });

  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  await page.getByText('更新', { exact: true }).click();

  // 読み込み直すと、窓に置いた印は消える
  await expect
    .poll(() => page.evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている')), {
      timeout: 30_000,
      message: '「更新」を押しても読み込み直していない',
    })
    .toBe('消えた');
});

test('更新の帯：古い控えが返っただけ（今の束はサーバーにまだある）なら出さない', async ({ page }) => {
  // 更新したのに「新しい版が出ています」がまた出ていた。電波が切れた瞬間に取り直すと、
  // sw.js が控えの前の版の index.html を返し、束の名前が違って見えていた
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束).toBeTruthy();

  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-00000000000000000000000000000000.js');
  await 束の有無を決める(page, 束, true);
  await 見に行かせる(page);

  await expect(page.getByText(/新しい版が出ています/), '今の束がまだあるのに帯が出た').toHaveCount(0);
});

test('更新の帯：今の束があるかを確かめられない（通信できない）なら出さない', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束).toBeTruthy();

  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-33333333333333333333333333333333.js');
  await 束の有無を決める(page, 束, '通信できない');
  await 見に行かせる(page);

  await expect(page.getByText(/新しい版が出ています/), '確かめられないのに帯が出た').toHaveCount(0);
});

test('更新の帯：AppEntry の束が無い中身（Wi-Fi のログイン画面など）なら出さない', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束).toBeTruthy();

  await 返す中身を決める(page, '/portal/login.js');
  await 束の有無を決める(page, 束, false);
  await 見に行かせる(page);

  await expect(page.getByText(/新しい版が出ています/), '別の .js があるだけで帯が出た').toHaveCount(0);
});

// ───── 自動で更新する（しばらく離れて戻ってきたとき） ─────

/** 画面を離れた・戻ったことにする（document.hidden を差し替えて、visibilitychange を出す） */
async function 離れる(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}
async function 戻る(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1500);
}
/** 離席の最短を 0 にして、すぐ戻っても「しばらく離れた」とみなす（本番は 3 分） */
async function 離席を短くする(page) {
  await page.addInitScript(() => {
    globalThis.__自動更新の離席ミリ秒 = 0;
  });
}

test('自動で更新：しばらく離れて戻ると、帯を出さずに読み込み直す', async ({ page }) => {
  await 離席を短くする(page);
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-4444444444444444444444444444ffff.js');
  await 束の有無を決める(page, 束, false);
  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  await 離れる(page);
  await 戻る(page);
  await expect
    .poll(() => page.evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている')), {
      timeout: 30_000,
      message: 'しばらく離れて戻っても、自動で読み込み直していない',
    })
    .toBe('消えた');
});

test('自動で更新：読み込み直しても版が変わらないときは、繰り返さず帯にする（読み込み直しの繰り返しを防ぐ）', async ({ page }) => {
  await 離席を短くする(page);
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  // この検査では、何度読み込み直しても「新しい版が出ている」と答え続ける（版が変わらない場面）
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-5555555555555555555555555555ffff.js');
  await 束の有無を決める(page, 束, false);
  await 離れる(page);
  await 戻る(page); // 1 回目：自動で読み込み直す
  await page.waitForTimeout(4000);
  await 離れる(page);
  await 戻る(page); // 2 回目：同じ版へは繰り返さない → 帯
  await expect(page.getByText(/新しい版が出ています/), '自動更新を繰り返したか、帯が出ない').toBeVisible({ timeout: 15_000 });
});

test('自動で更新：短い離席（3 分に満たない）は、読み込み直さず帯のまま', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-6666666666666666666666666666ffff.js');
  await 束の有無を決める(page, 束, false);
  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  await 離れる(page);
  await 戻る(page);
  await expect(page.getByText(/新しい版が出ています/), '帯が出ない').toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => typeof window.__押す前の印), '短い離席で勝手に読み込み直した').toBe('number');
});

test('自動で更新：字を入力している最中は、読み込み直さず帯にする', async ({ page }) => {
  await 離席を短くする(page);
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-7777777777777777777777777777ffff.js');
  await 束の有無を決める(page, 束, false);
  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  // ログイン前の画面の入力欄に、字を打っている最中にする
  const 欄 = page.getByPlaceholder('例: 123456');
  await 欄.click();
  await 欄.pressSequentially('1234', { delay: 20 });
  await 離れる(page);
  await 戻る(page);
  await expect(page.getByText(/新しい版が出ています/), '帯が出ない').toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => typeof window.__押す前の印), '入力中に勝手に読み込み直した').toBe('number');
  expect(await 欄.inputValue(), '打っていた字が消えた').toBe('1234');
});
