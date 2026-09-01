// 誤タップ防止（自動ロック）の確かめ。
// 入れて3秒たつと押しても変わらず、長押しするとそのますだけ開く。
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  ますが増えるまで待つ,
} from './helpers.mjs';


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
  // 案内とお知らせは開く前に止める。開いてから止めて reload すると、
  // アプリを2回起動することになる（遅い機種ほど効く）
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  // 読み込み中の画面でも「出た」になるので、ログイン欄が出るか、
  // もう入っているかが決まるまで待つ（飛ばすとログイン画面のまま進む）
  await 入り口が決まるまで待つ(page);
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
  // ここで書いて reload していたのをやめた（上の 案内を止める が代わり）

  // 射手の列が無ければ1つ足す。名前は選ばない（メンバーを作らないため）。
  // 保存もしないので、団体の中身には触れない
  if (await page.getByText('記録を始めましょう').isVisible().catch(() => false)) {
    await page.getByText('人', { exact: true }).first().click();
    await ますが増えるまで待つ(page, 1);
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
  await 画面が出るまで待つ(page);
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

// ── 矢所（ますを押してから500ミリ秒後に出る窓）─────────────
//
// ここは検査がまったく無く、2026-08-30 まで**本番で落ちていた**。
// 射手を取りに行く形へ直したとき、押したときの道だけ古い変数（archer）が
// 残っていて、矢所を出す設定の団体では○×を入れるたびに赤画面になっていた。
// 未定義の変数そのものは npm test（eslint.undef.mjs）で止まるようになったが、
// この道が一度も動かされていなかったこと自体が穴だった。
//
// 矢所の設定は端末にだけ残る（クラウドへは行かない）ので、団体は汚さない。

test('矢所：ますを押すと、500ミリ秒後に矢所の窓が出る（落ちない）', async ({ page }) => {
  const 落ちた = [];
  // 拾うのは「書き間違いで落ちた」ものだけ。
  // WebKit は Firestore の長い通信に due to access control checks という
  // 警告を出すことがあり、これはアプリの落ちではない。全部を数えると、
  // その警告だけで落ちて、本物の落ちが見えなくなる
  const 書き間違いか = (文) =>
    /is not defined|is not a function|undefined is not an object|Cannot read/i.test(文);
  page.on('pageerror', (e) => {
    const 文 = String((e && e.message) || e);
    if (書き間違いか(文)) 落ちた.push(文);
  });

  await 入る(page);

  // 設定から矢所を入れる。画面から入れるのは、切り替えそのものも見るため
  await page.getByText('設定', { exact: true }).first().click();
  await page.waitForTimeout(1500);
  const 行 = page.getByText('矢所の記録機能を有効化', { exact: true });
  await 行.scrollIntoViewIfNeeded().catch(() => {});
  await expect(行, '設定に矢所の行が無い').toBeVisible({ timeout: 15_000 });
  // 行の右側の切り替えを押す
  await page.evaluate(() => {
    const 行 = [...document.querySelectorAll('div')].find(
      (e) => (e.textContent || '').trim() === '矢所の記録機能を有効化'
    );
    let 親 = 行;
    for (let i = 0; i < 5 && 親; i++) {
      const 切替 = 親.querySelector('input[type="checkbox"], [role="switch"]');
      if (切替) return void 切替.click();
      親 = 親.parentElement;
    }
  });
  await page.waitForTimeout(1200);
  expect(
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
      return !!s.enableArrowLocation;
    }),
    '矢所の設定が入らない'
  ).toBe(true);

  // 記録へ戻って、ますを押す
  await page.getByText('記録', { exact: true }).first().click();
  await page.waitForTimeout(1500);
  const ます = page.locator('[data-testid^="ます-"]').first();
  await expect(ます, '盤面が出ていない').toBeVisible({ timeout: 15_000 });
  await 押す(page, await 真ん中(ます));

  // 窓は500ミリ秒後に出る。落ちるのもこのとき
  // 設定の行（矢所の記録機能を有効化）とも当たるので、完全一致で選ぶ
  await expect(page.getByText('矢所の記録', { exact: true }), '矢所の窓が出ない').toBeVisible({
    timeout: 15_000,
  });
  expect(落ちた, '矢所の窓を出すときに落ちた: ' + 落ちた.join(' / ')).toEqual([]);
});
