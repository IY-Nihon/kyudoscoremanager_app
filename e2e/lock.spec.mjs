// 誤タップ防止（自動ロック）の確かめ。
// 入れて3秒たつと押しても変わらず、長押しするとそのますだけ開く。
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// お知らせの版は本体から読む。版が上がっても検査を直さずに済む。
// 案内だけ止めるとお知らせが出て画面を覆うため、両方まとめて止める
const お知らせの版 = (fs.readFileSync('src/JP_WhatsNewModal.js', 'utf8').match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

// ライブの検査（100006）とは別の団体を使う。混ざる余地をなくすため。
// メンバーのいる団体にする。0人の団体だと射手を足すたびにゲストが残る。
//
// なお iPhone では、ライブの検査3件をすべて通したあとにこの検査を流すと
// 長押しが効かずに落ちる。1件ずつ前に置いたときは（2台・3台・鍵のいずれ
// でも）通るので、個々の検査ではなく積み重ねが効いている。
// 押さえの長さは900ms・2000ms・2500msで試して差が無く、押下（mousedown /
// mouseup）は届いていて mouseleave も0、盤面も正常（射手1人・○1つ）。
// 原因は未特定。アプリ側の不具合ではなく、同じ操作はスマホ・パソコンで
// 安定して通る。
const 団体 = '100003';

// ログインは下ごしらえ（auth.setup.mjs）で1回だけ済ませ、その控えを使う。
// 各検査でログインし直さないので速く、認証の投げすぎで断られることもない
test.use({ storageState: 'e2e/.auth/100003.json' });
const 合言葉 = 'StgTest!2026';

/** 触れる画面かどうか。指の画面では click ではなく tap でないと届かない */
const 触れる画面か = (page) => page.evaluate(() => 'ontouchstart' in window);

/** 1回押す */
async function 押す(page, 場所) {
  if (await 触れる画面か(page)) {
    await page.touchscreen.tap(場所.x, 場所.y);
  } else {
    await page.mouse.click(場所.x, 場所.y);
  }
  await page.waitForTimeout(600);
}

// 指で押さえたままにする道具が Playwright に無いので、
// Chromium では CDP で本物の touch を送る。
// WebKit では送れないため mouse で代える。ますは mousedown と touchstart の
// どちらでも同じ処理に入るので、押さえ続ける経路そのものは確かめられる。
async function 長押しする(page, 場所, ミリ秒) {
  const 指 = (await 触れる画面か(page)) ? await 指の便を取る(page) : null;
  if (指) {
    await 指.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 場所.x, y: 場所.y }],
    });
    await page.waitForTimeout(ミリ秒);
    await 指.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(場所.x, 場所.y);
    await page.mouse.down();
    await page.waitForTimeout(ミリ秒);
    await page.mouse.up();
  }
  await page.waitForTimeout(400);
}

async function 指の便を取る(page) {
  try {
    return await page.context().newCDPSession(page);
  } catch {
    return null;
  }
}

async function 入る(page) {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 番号欄 = page.getByPlaceholder('例: 123456');
  if (await 番号欄.isVisible().catch(() => false)) {
    await 番号欄.click();
    await 番号欄.pressSequentially(団体, { delay: 20 });
    const 合言葉欄 = page.locator('input[type="password"]').first();
    await 合言葉欄.click();
    await 合言葉欄.pressSequentially(合言葉, { delay: 20 });
    await page.getByText('ログイン', { exact: true }).click();
    // 決まった秒数で待たない。iPhone(WebKit) では9秒に収まらないことがあり、
    // 収まらないとログイン画面のまま先へ進んで、まったく別の顔で落ちる
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
            return s.activeGroupId || null;
          }),
        { timeout: 60_000, message: 'ログインが通らない（団体IDが入らない）' }
      )
      .not.toBeNull();
    // 認証の保存が書き終わるまでの余裕
    await page.waitForTimeout(1500);
  }
  // 使い方の案内は別のテストで見る。ここでは邪魔なので出さない
  await page.evaluate((版) => {
    // 案内もお知らせも、ここでは邪魔なので出さない。
    // お知らせは『案内を終えた人』に出る作りなので、案内だけ止めると出てくる
    localStorage.setItem('tutorialDoneVersion', '2026-08-13-01');
    localStorage.setItem('whatsNewDismissedVersion', 版);
  }, お知らせの版);
  await page.reload();
  await page.waitForTimeout(4000);

  // 射手の列が無ければ1つ足す。名前は選ばない（メンバーを作らないため）。
  // 保存もしないので、団体の中身には触れない
  if (await page.getByText('記録を始めましょう').isVisible().catch(() => false)) {
    await page.getByText('人', { exact: true }).first().click();
    await page.waitForTimeout(1500);
  }
}

/** ますの真ん中の座標 */
async function 真ん中(ます) {
  const 枠 = await ます.boundingBox();
  return { x: Math.round(枠.x + 枠.width / 2), y: Math.round(枠.y + 枠.height / 2) };
}

test('誤タップ防止：入れて3秒で閉じ、長押しで開く', async ({ page }) => {
  await 入る(page);

  const ます = page.locator('[data-testid^="ます-"]').first();
  await expect(ます, 'ますが1つも無い').toBeVisible();
  const 場所 = await 真ん中(ます);

  const 中身 = async () => (await ます.innerText()).trim();

  expect(await 中身(), '始めから何か入っている').toBe('');
  await 押す(page, 場所);
  const 直後 = await 中身();
  expect(直後, '押しても○が入らない').toBe('○');

  // 3秒たつと閉じる。押しても × に変わらない
  await page.waitForTimeout(3500);
  await 押す(page, 場所);
  expect(await 中身(), '3秒たっても押すだけで変わってしまう').toBe(直後);

  // 長押しすると、そのますだけ開く
  await 長押しする(page, 場所, 900);
  await 押す(page, 場所);
  expect(await 中身(), '長押しで開けても変えられない').toBe('×');
});

test('長押しで開けると帯が出て、その帯は指を下のますへ通す', async ({ page }) => {
  await 入る(page);

  const ます = page.locator('[data-testid^="ます-"]').first();
  const 場所 = await 真ん中(ます);
  await 押す(page, 場所);
  await page.waitForTimeout(3500); // 閉じるのを待つ

  // 帯は1.5秒で消える。長押しのあとに測りに行くと、混み合った実行では
  // 消えたあとに見てしまう。出るのを待つ側を先に構えてから長押しし、
  // 位置と当たり判定は1回のやり取りでまとめて測る（往復するあいだに消えるため）。
  // それでも取りこぼすことがあるので、何度か試す
  const 文 = 'このマスの鍵を開けました';
  const 帯 = page.getByText(文, { exact: true });
  let 当たり = null;
  for (let 回 = 0; 回 < 3 && !当たり; 回++) {
    const 出るのを待つ = 帯.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);
    await 長押しする(page, 場所, 900);
    await 出るのを待つ;
    当たり = await page.evaluate((文) => {
      const 帯 = [...document.querySelectorAll('div')].find(
        (e) => (e.textContent || '').trim() === 文 && e.children.length === 0
      );
      if (!帯) return null; // もう消えている。測れないので試し直す
      const r = 帯.getBoundingClientRect();
      const x = Math.round(r.x + r.width / 2);
      const y = Math.round(r.y + r.height / 2);
      const 上 = document.elementFromPoint(x, y);
      return {
        文字: 上 ? (上.textContent || '').slice(0, 30) : null,
        帯か: !!(上 && (上 === 帯 || 帯.contains(上))),
      };
    }, 文);
    if (!当たり) await page.waitForTimeout(3500); // 閉じ直してから試す
  }

  // 帯が出ること自体（開いたことが伝わらないと、押さえが届いたか分からない）
  expect(当たり, '長押しで開けても何も知らせない（帯が出ない）').not.toBeNull();
  // その帯の真ん中を指で触ると、帯ではなく下にあるものに当たること。
  // 帯が指を吸うと「開いたのに、その下のますが書けない」になる
  expect(当たり.帯か, `帯が指を吸っている（当たったもの: ${当たり.文字}）`).toBe(false);
});

test('1立が埋まって3秒たつと、間隔の鍵が自動でかかる', async ({ page }) => {
  await 入る(page);

  // 間隔の列を足す。鍵ボタンはこの列に付く
  await page.getByText('間隔', { exact: true }).first().click();
  await page.waitForTimeout(1500);

  const ますたち = page.locator('[data-testid^="ます-"]');
  const 数 = await ますたち.count();
  expect(数, 'ますが足りない').toBeGreaterThanOrEqual(4);

  // 上から4ます＝1立ぶん。5つ目は次の立で、埋めずに残しておく（比べる相手）
  const 空 = [];
  for (let i = 0; i < 数 && 空.length < 5; i++) {
    const ま = ますたち.nth(i);
    if ((await ま.innerText()).trim() === '') 空.push(ま);
  }
  expect(空.length, '空のますが5つ無い').toBe(5);
  for (const ま of 空.slice(0, 4)) await 押す(page, await 真ん中(ま));

  const 最後 = 空[3];
  const 前 = (await 最後.innerText()).trim();
  expect(前, '○が入っていない').not.toBe('');

  // 3秒たつと立ごと閉じる。こちらは長押しでも開かない（鍵ボタンで開ける決まり）
  await page.waitForTimeout(4000);
  const 場所 = await 真ん中(最後);
  await 長押しする(page, 場所, 900);
  await 押す(page, 場所);
  expect((await 最後.innerText()).trim(), '立の鍵が長押しで開いてしまう').toBe(前);

  // 埋まっていない立は今までどおり押せる。
  // （これが変わらないなら、上の結果は「押せていないだけ」かもしれない）
  const 次の立 = 空[4];
  await 押す(page, await 真ん中(次の立));
  expect((await 次の立.innerText()).trim(), '埋まっていない立まで閉じている').toBe('○');
});

test('読み込み直しても、入れてある○×は閉じたまま', async ({ page }) => {
  await 入る(page);

  const ます = page.locator('[data-testid^="ます-"]').first();
  await 押す(page, await 真ん中(ます));
  expect((await ます.innerText()).trim(), '○が入らない').toBe('○');

  // 入れた覚えは端末に残さない。残さないまま開いてしまうと無防備になるので、
  // 覚えの無い○×は初めから閉じている決まりにしてある
  await page.reload();
  await page.waitForTimeout(4000);
  const 後 = page.locator('[data-testid^="ます-"]').first();
  expect((await 後.innerText()).trim(), '読み込み直しで○が消えた').toBe('○');

  const 場所 = await 真ん中(後);
  await 押す(page, 場所);
  expect((await 後.innerText()).trim(), '読み込み直すと鍵が外れている').toBe('○');

  await 長押しする(page, 場所, 900);
  await 押す(page, 場所);
  expect((await 後.innerText()).trim(), '長押しでも開けられない').toBe('×');
});

test('鍵がかかったますを押すと、開け方を知らせる', async ({ page }) => {
  // 黙って何も起きないと、壊れたと思って何度も押すことになる。
  // 「長押しで開く」と分かる道は、灰色になること以外に無かった
  await 入る(page);

  const ます = page.locator('[data-testid^="ます-"]').first();
  const 場所 = await 真ん中(ます);
  await 押す(page, 場所);
  await page.waitForTimeout(3500); // 閉じるのを待つ

  const 帯 = page.getByText('このマスは鍵がかかっています。長押しで開きます', { exact: true });
  // 帯は1.5秒で消えるので、待つ側を先に構えてから押す
  const 待つ = 帯.waitFor({ state: 'visible', timeout: 4000 });
  await 押す(page, 場所);
  await 待つ;

  // 知らせるだけで、○×は変わらないこと
  const 印 = await ます.innerText();
  expect(印.trim(), '知らせるだけのはずが、○×まで変わっている').toBe('○');
});
