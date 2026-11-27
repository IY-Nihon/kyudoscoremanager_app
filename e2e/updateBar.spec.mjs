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
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

// 控えを使わない。ログイン前の画面で足りる
test.use({ storageState: { cookies: [], origins: [] } });

/** いま読み込んでいる束の名前 */
function いまの束(page) {
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
  await page.route('**' + 束.split('?')[0], (route) => {
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

  await expect(page.getByText(/新しいバージョンが出ています/), '帯が出ない').toBeVisible({
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

  await expect(page.getByText(/新しいバージョンが出ています/), '同じ束なのに帯が出た').toHaveCount(0);
});

test('更新の帯：閉じられる', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-1111111111111111111111111111ffff.js');
  await 束の有無を決める(page, 束, false);
  await 見に行かせる(page);

  const 帯 = page.getByText(/新しいバージョンが出ています/);
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
  await expect(page.getByText(/新しいバージョンが出ています/), '読めないのに帯が出た').toHaveCount(0);
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
  await expect(page.getByText(/新しいバージョンが出ています/), '帯が出ない').toBeVisible({ timeout: 10_000 });

  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  await page.getByText('更新', { exact: true }).click();

  // 読み込み直すと、窓に置いた印は消える
  await expect
    .poll(
      () =>
        page
          .evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている'))
          // 読み込み直しの最中に読むと「文脈が消えた」で落ちる。読み込み直している＝まだ見ない
          .catch(() => '読み込み中'),
      {
        timeout: 30_000,
        message: '「更新」を押しても読み込み直していない',
      }
    )
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

  await expect(page.getByText(/新しいバージョンが出ています/), '今の束がまだあるのに帯が出た').toHaveCount(0);
});

test('更新の帯：今の束があるかを確かめられない（通信できない）なら出さない', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束).toBeTruthy();

  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-33333333333333333333333333333333.js');
  await 束の有無を決める(page, 束, '通信できない');
  await 見に行かせる(page);

  await expect(page.getByText(/新しいバージョンが出ています/), '確かめられないのに帯が出た').toHaveCount(0);
});

test('更新の帯：AppEntry の束が無い中身（Wi-Fi のログイン画面など）なら出さない', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  expect(束).toBeTruthy();

  await 返す中身を決める(page, '/portal/login.js');
  await 束の有無を決める(page, 束, false);
  await 見に行かせる(page);

  await expect(page.getByText(/新しいバージョンが出ています/), '別の .js があるだけで帯が出た').toHaveCount(
    0
  );
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
    .poll(
      () =>
        page
          .evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている'))
          // 読み込み直しの最中に読むと「文脈が消えた」で落ちる。読み込み直している＝まだ見ない
          .catch(() => '読み込み中'),
      {
        timeout: 30_000,
        message: 'しばらく離れて戻っても、自動で読み込み直していない',
      }
    )
    .toBe('消えた');
});

test('自動で更新：読み込み直しても版が変わらないときは、繰り返さず帯にする（読み込み直しの繰り返しを防ぐ）', async ({
  page,
}) => {
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
  await expect(
    page.getByText(/新しいバージョンが出ています/),
    '自動更新を繰り返したか、帯が出ない'
  ).toBeVisible({
    timeout: 15_000,
  });
});

test('自動で更新：画面が裏に回ったら、離れた長さに関係なくすぐ読み込み直す（2026-11-08 本人）', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-6666666666666666666666666666ffff.js');
  await 束の有無を決める(page, 束, false);
  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  await 離れる(page);
  await expect
    .poll(
      () =>
        page
          .evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている'))
          // 読み込み直しの最中に読むと「文脈が消えた」で落ちる。読み込み直している＝まだ見ない
          .catch(() => '読み込み中'),
      {
        timeout: 30_000,
        message: '裏に回っても読み込み直していない',
      }
    )
    .toBe('消えた');
});

test('自動で更新：画面を見ているときは、触れたばかりなら帯、しばらく触れずにいたら読み込み直す', async ({
  page,
}) => {
  // 本番は 20 秒。検査では 6 秒にする
  await page.addInitScript(() => {
    globalThis.__自動更新の触れずに待つミリ秒 = 6000;
  });
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 束 = await いまの束(page);
  await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-5555555555555555555555555555ffff.js');
  await 束の有無を決める(page, 束, false);
  await page.evaluate(() => {
    window.__押す前の印 = 1;
  });
  // 触れたばかり（iPhone の WebKit は wheel を打てないので、合図を直に送る）
  await page.evaluate(() => window.dispatchEvent(new Event('pointerdown')));
  await 見に行かせる(page);
  await expect(page.getByText(/新しいバージョンが出ています/), '触れたばかりなのに帯が出ない').toBeVisible({
    timeout: 10_000,
  });
  expect(await page.evaluate(() => typeof window.__押す前の印), '触れたばかりで読み込み直した').toBe(
    'number'
  );
  await expect
    .poll(
      () =>
        page
          .evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている'))
          // 読み込み直しの最中に読むと「文脈が消えた」で落ちる。読み込み直している＝まだ見ない
          .catch(() => '読み込み中'),
      {
        timeout: 30_000,
        message: 'しばらく触れずにいても読み込み直していない',
      }
    )
    .toBe('消えた');
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
  await expect(page.getByText(/新しいバージョンが出ています/), '帯が出ない').toBeVisible({ timeout: 10_000 });
  expect(await page.evaluate(() => typeof window.__押す前の印), '入力中に勝手に読み込み直した').toBe(
    'number'
  );
  expect(await 欄.inputValue(), '打っていた字が消えた').toBe('1234');
});

// 窓が開いている間は、読み込み直さない。窓はログインのあとにしか無いので、ログイン済みの団体で見る
// （メンバーの編集の窓を開いて、保存せずに閉じる。団体には書き込まない）
test.describe('自動で更新：窓が開いている間', () => {
  test.use({ storageState: 'e2e/.auth/100007.json' });

  test('メンバーの窓を開いたまま離れて戻っても、読み込み直さず帯にする（窓の中に保存前の内容があるかもしれない）', async ({
    page,
  }) => {
    await 案内を止める(page);
    await 離席を短くする(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await 入り口が決まるまで待つ(page);
    await page.getByRole('tab', { name: 'メンバー', exact: true }).click();
    await page.getByText('部員1', { exact: false }).first().click();
    await expect(page.getByText('保存する', { exact: true }).first(), 'メンバーの窓が開かない').toBeVisible({
      timeout: 15_000,
    });
    const 束 = await いまの束(page);
    await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-8888888888888888888888888888ffff.js');
    await 束の有無を決める(page, 束, false);
    await page.evaluate(() => {
      window.__押す前の印 = 1;
    });
    await 離れる(page);
    await 戻る(page);
    await expect(page.getByText(/新しいバージョンが出ています/), '帯が出ない').toBeVisible({
      timeout: 10_000,
    });
    expect(
      await page.evaluate(() => typeof window.__押す前の印),
      '窓が開いているのに勝手に読み込み直した'
    ).toBe('number');
  });
});

// 分析・履歴のタブを見ている間は、自動で読み込み直さず帯にする（映して説明しているときに画面が入れ替わらない）。
// 読み込み直したときは、選んでいた物とスクロールの位置を戻す（src/yominaoshiHikae.js。2026-11-22 本人）。
// ログイン済みの団体で見る。団体には書き込まない
test.describe('自動で更新：分析・履歴を見ている間', () => {
  test.use({ storageState: 'e2e/.auth/100007.json' });

  /** ログインして、タブを開く（住所も変わることを確かめる。UpdateBar は住所で見分ける） */
  async function タブを開く(page, タブ) {
    await 案内を止める(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await 入り口が決まるまで待つ(page);
    await page.getByRole('tab', { name: タブ, exact: true }).click();
    await expect(page).toHaveURL(タブ === '分析' ? /\/analysis\/?$/ : /\/history\/?$/);
  }

  /** 中にある要素から外へたどって、中身が枠より高い流れる箱を探す */
  async function 流れる箱(locator) {
    const 手 = await locator.elementHandle();
    return 手.evaluateHandle((要素) => {
      for (let 今 = 要素; 今 && 今 !== document.body; 今 = 今.parentElement) {
        const 形 = getComputedStyle(今);
        if ((形.overflowY === 'auto' || 形.overflowY === 'scroll') && 今.scrollHeight > 今.clientHeight + 10)
          return 今;
      }
      return null;
    });
  }

  /** 流れる箱を y まで流す（流せる所まで）。置けた位置を返す */
  function 流す(箱, y) {
    return 箱.evaluate((節, 目当て) => {
      節.scrollTop = Math.min(目当て, 節.scrollHeight - 節.clientHeight);
      return 節.scrollTop;
    }, y);
  }

  async function 新しい版が出たことにする(page) {
    const 束 = await いまの束(page);
    await 返す中身を決める(page, '/_expo/static/js/web/AppEntry-7777777777777777777777777777eeee.js');
    await 束の有無を決める(page, 束, false);
    await page.evaluate(() => {
      window.__押す前の印 = 1;
    });
  }

  for (const タブ of ['分析', '履歴']) {
    test(`${タブ}を見ているあいだは、しばらく離れて戻っても読み込み直さず帯にする`, async ({ page }) => {
      await 離席を短くする(page);
      await タブを開く(page, タブ);
      await 新しい版が出たことにする(page);
      await 離れる(page);
      // 裏にある間は読み込み直してよいので、裏の間に見に行かないよう、すぐ戻す
      await 戻る(page);
      await expect(page.getByText(/新しいバージョンが出ています/), '帯が出ない').toBeVisible({
        timeout: 10_000,
      });
      expect(
        await page.evaluate(() => typeof window.__押す前の印),
        `${タブ}を見ているのに勝手に読み込み直した`
      ).toBe('number');
    });
  }

  test('裏に回って読み込み直したら、分析の期間の選び方とスクロールの位置が戻る', async ({ page }) => {
    await タブを開く(page, '分析');
    await page.getByText('期間指定', { exact: true }).first().click();
    await expect(page.getByText(/^開始: /).first(), '期間指定の欄が出ない').toBeVisible();
    const 箱 = await 流れる箱(page.getByText('期間指定', { exact: true }).first());
    expect(await 箱.evaluate((節) => !!節), '分析の流れる箱が見つからない').toBe(true);
    const 位置 = await 流す(箱, 400);
    expect(位置, '分析の中身が短くて流せない').toBeGreaterThan(100);
    await page.waitForTimeout(800); // 位置を控えるのは止まってから 300ms
    await 新しい版が出たことにする(page);
    await 離れる(page); // 裏に回ったら、分析を見ていてもすぐ読み込み直す
    await expect
      .poll(
        () =>
          page
            .evaluate(() => (typeof window.__押す前の印 === 'undefined' ? '消えた' : '残っている'))
            .catch(() => '読み込み中'),
        { timeout: 30_000, message: '裏に回っても読み込み直していない' }
      )
      .toBe('消えた');
    await 画面が出るまで待つ(page);
    await expect(page).toHaveURL(/\/analysis\/?$/);
    await expect(page.getByText(/^開始: /).first(), '期間指定が戻っていない').toBeVisible({
      timeout: 15_000,
    });
    const 後の箱 = await 流れる箱(page.getByText('期間指定', { exact: true }).first());
    await expect
      .poll(() => 後の箱.evaluate((節) => Math.round(節.scrollTop)), {
        timeout: 10_000,
        message: 'スクロールの位置が戻っていない',
      })
      .toBeGreaterThanOrEqual(Math.round(位置) - 3);
    expect(await 後の箱.evaluate((節) => Math.round(節.scrollTop))).toBeLessThanOrEqual(Math.round(位置) + 3);
  });

  // 100007 は記録が 1 か月に 3 件だけで、流せず月も選べない。記録の多い 100001 で、スマホの高さにして見る
  test.describe('記録の多い団体', () => {
    test.use({ storageState: 'e2e/.auth/100001.json', viewport: { width: 390, height: 640 } });

    test('読み込み直したら、履歴の月の選び方とスクロールの位置が戻る', async ({ page }) => {
      await タブを開く(page, '履歴');
      // 既定はいちばん新しい月。「すべて」に変えると、月の見出しが出る
      const すべて = page.getByTestId('月すべて');
      await expect(すべて, '月が 2 つ以上ある年度でない（「すべて」の札が無い）').toBeVisible({
        timeout: 15_000,
      });
      await すべて.click();
      await expect(page.getByTestId('月の見出し').first()).toBeVisible();
      const 箱 = await 流れる箱(page.getByTestId('履歴の一覧'));
      expect(await 箱.evaluate((節) => !!節), '履歴の一覧が流せない（記録が少ない）').toBe(true);
      const 位置 = await 流す(箱, 600);
      expect(位置, '履歴の一覧が短くて流せない').toBeGreaterThan(200);
      await page.waitForTimeout(800); // 位置を控えるのは止まってから 300ms
      await page.reload();
      await 画面が出るまで待つ(page);
      await expect(page).toHaveURL(/\/history\/?$/);
      await expect(page.getByTestId('月の見出し').first(), '「すべて」が戻っていない').toBeVisible({
        timeout: 15_000,
      });
      const 後の箱 = await 流れる箱(page.getByTestId('履歴の一覧'));
      await expect
        .poll(() => 後の箱.evaluate((節) => (節 ? Math.round(節.scrollTop) : -1)), {
          timeout: 10_000,
          message: 'スクロールの位置が戻っていない',
        })
        .toBeGreaterThanOrEqual(Math.round(位置) - 3);
      expect(await 後の箱.evaluate((節) => Math.round(節.scrollTop))).toBeLessThanOrEqual(
        Math.round(位置) + 3
      );
    });
  });
});
