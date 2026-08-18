/**
 * 記録表の横並び（名前が左、○×が右へ伸びる）の検査。
 *
 *   npx playwright test e2e/landscape.spec.mjs
 *
 * 縦と横は同じ部品を並べ替えているだけなので、
 * 「置き場所が変わっていること」と「中身の扱いは変わらないこと」を見る。
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const お知らせの版 = (fs.readFileSync('src/JP_WhatsNewModal.js', 'utf8').match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

// 鍵（100003）・ライブ（100006）・交代（100005）とは別の団体を使う
const 団体 = '100001';
const 合言葉 = 'StgTest!2026';

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
    await page.waitForTimeout(9000);
  }
  await page.evaluate((版) => {
    localStorage.setItem('tutorialDoneVersion', '2026-08-13-01');
    localStorage.setItem('whatsNewDismissedVersion', 版);
  }, お知らせの版);
  await page.reload();
  await page.waitForTimeout(4000);

  // 射手を1人だけ立てる。ますは全部この人のものになる
  if (await page.getByText('記録を始めましょう').isVisible().catch(() => false)) {
    await page.getByText('人', { exact: true }).first().click();
    await page.waitForTimeout(1500);
  }
}

/** 1射目と2射目のますの位置を返す */
async function 二つの位置(page) {
  const ますたち = page.locator('[data-testid^="ます-"]');
  const 名 = await ますたち.first().getAttribute('data-testid');
  const 射手 = 名.slice('ます-'.length, 名.lastIndexOf('-'));
  const 一 = await page.getByTestId(`ます-${射手}-0`).boundingBox();
  const 二 = await page.getByTestId(`ます-${射手}-1`).boundingBox();
  return { 射手, 一, 二 };
}

test('並べ方：縦では射数が下に伸び、横では右に伸びる', async ({ page }) => {
  await 入る(page);

  const 縦 = await 二つの位置(page);
  expect(Math.abs(縦.一.x - 縦.二.x), '縦なのに1射目と2射目で横がずれている').toBeLessThan(2);
  expect(Math.abs(縦.一.y - 縦.二.y), '縦なのに1射目と2射目が同じ高さにある').toBeGreaterThan(10);

  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1500);

  const 横 = await 二つの位置(page);
  expect(Math.abs(横.一.y - 横.二.y), '横なのに1射目と2射目で高さがずれている').toBeLessThan(2);
  expect(横.二.x - 横.一.x, '横なのに2射目が1射目の右に無い').toBeGreaterThan(10);
});

test('並べ方：横にすると、名前が○×より左に出る', async ({ page }) => {
  await 入る(page);

  // 縦のときは名前が表の下にある
  const 名前 = page.getByText('選択', { exact: true }).first();
  const 縦の名 = await 名前.boundingBox();
  const 縦の一 = (await 二つの位置(page)).一;
  expect(縦の名.y, '縦なのに名前が表の下に無い').toBeGreaterThan(縦の一.y);

  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1500);

  const 横の名 = await page.getByText('選択', { exact: true }).first().boundingBox();
  const 横の一 = (await 二つの位置(page)).一;
  expect(横の名.x + 横の名.width, '横なのに名前が○×より左に無い').toBeLessThanOrEqual(横の一.x + 2);
});

test('並べ方：横のままでも○×を入れられ、同じ射目に入る', async ({ page }) => {
  await 入る(page);
  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1500);

  const { 射手 } = await 二つの位置(page);
  const ます = page.getByTestId(`ます-${射手}-0`);
  expect((await ます.innerText()).trim(), '始めから何か入っている').toBe('');
  await ます.click({ force: true });
  await page.waitForTimeout(800);
  expect((await ます.innerText()).trim(), '横のままだと押しても入らない').toBe('○');

  // しまわれる場所は縦のときと同じ（1射目＝0番）
  const 印 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
    const 射手 = (s.archers || []).find((a) => a && Array.isArray(a.marks));
    return 射手 ? 射手.marks.slice(0, 3) : null;
  });
  expect(印, '1射目ではない場所に入っている').toEqual(['○', '', '']);
});

test('並べ方：横のとき、立の切れ目は右の線になる', async ({ page }) => {
  await 入る(page);
  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1500);

  const 線 = await page.evaluate(() => {
    const ますたち = [...document.querySelectorAll('[data-testid^="ます-"]')].slice(0, 8);
    return ますたち.map((e) => getComputedStyle(e).borderRightWidth);
  });
  expect(線.length, 'ますが8つ無い').toBe(8);
  expect(線[3], '4射目の右に立の切れ目が引かれていない').toBe('2px');
  expect(線[0], '立の途中にまで太い線が引かれている').toBe('1px');
  expect(線[7], '最後の射のあとにまで線が引かれている').toBe('1px');
});

test('並べ方：選んだ並べ方は、読み込み直しても残る', async ({ page }) => {
  await 入る(page);
  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1500);

  await page.reload();
  await page.waitForTimeout(4000);

  const 横 = await 二つの位置(page);
  expect(Math.abs(横.一.y - 横.二.y), '読み込み直したら縦へ戻ってしまった').toBeLessThan(2);
});

test('並べ方：横でも誤タップ防止の鍵は効く（入れて3秒で閉じ、長押しで開く）', async ({ page }) => {
  // 鍵はますの部品が受け持つ。並べ方を変えても規則は同じはずだが、
  // 横では線の向きも大きさも入れ替えているので、実物で確かめておく
  await 入る(page);
  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1500);

  const { 射手 } = await 二つの位置(page);
  const ます = page.getByTestId(`ます-${射手}-0`);
  const 枠 = await ます.boundingBox();
  const 場所 = { x: Math.round(枠.x + 枠.width / 2), y: Math.round(枠.y + 枠.height / 2) };
  const 触れる = await page.evaluate(() => 'ontouchstart' in window);
  const 押す = async () => {
    if (触れる) await page.touchscreen.tap(場所.x, 場所.y);
    else await page.mouse.click(場所.x, 場所.y);
    await page.waitForTimeout(600);
  };

  await 押す();
  expect((await ます.innerText()).trim(), '横だと押しても○が入らない').toBe('○');

  await page.waitForTimeout(3500);
  await 押す();
  expect((await ます.innerText()).trim(), '横だと3秒たっても閉じない').toBe('○');

  // 長押しで、そのますだけ開く
  await page.mouse.move(場所.x, 場所.y);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
  await page.waitForTimeout(400);
  await 押す();
  expect((await ます.innerText()).trim(), '横だと長押しで開けられない').toBe('×');
});

test('並べ方：横のとき、個人の計は一番右に出る', async ({ page }) => {
  await 入る(page);
  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1500);

  // 1射目に○を入れて、右端の数が動くことで「そこが計」だと確かめる
  const { 射手 } = await 二つの位置(page);
  await page.getByTestId(`ます-${射手}-0`).click({ force: true });
  await page.waitForTimeout(800);

  const 最後のます = await page.getByTestId(`ます-${射手}-7`).boundingBox();
  const 計 = await page.getByText('1', { exact: true }).last().boundingBox();
  expect(計.x, '計が最後の射より左にある').toBeGreaterThan(最後のます.x);

  // 見出しの「計」も右端
  const 見出し = await page.getByText('計', { exact: true }).first().boundingBox();
  expect(見出し.x, '見出しの計が最後の射より左にある').toBeGreaterThan(最後のます.x);
});

test('並べ方：横のままでも案内は最後まで進み、名前の位置も指せる', async ({ page }) => {
  // 案内の目印「記録.射手選択」は、もともと縦の足元の名前セルにしか
  // 置いていなかった。横では指す先が消え、名前がどこかを教えられない。
  // 目印が無いと中央の吹き出しだけになり、行き止まりにはならないので
  // 気づきにくい。ここで実際に指せていることを見る
  await 入る(page);
  await page.getByTestId('並べ方').click();
  await page.waitForTimeout(1200);

  await page.evaluate(() => {
    localStorage.removeItem('tutorialDoneVersion');
    localStorage.removeItem('tutorialBoardSnapshot');
  });
  await page.reload();
  await expect(page.locator('text=ようこそ'), '横だと案内が始まらない').toBeVisible({ timeout: 30_000 });

  const 指す先の枠 = () =>
    page.evaluate(() => {
      const 枠 = [...document.querySelectorAll('div')].find((e) => {
        const s = getComputedStyle(e);
        return (
          s.position === 'absolute' &&
          s.borderStyle === 'solid' &&
          parseFloat(s.borderTopWidth) >= 2 &&
          /rgb\(0,\s*122,\s*255\)/.test(s.borderTopColor)
        );
      });
      if (!枠) return null;
      const r = 枠.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });

  const 進む手 = ['とばす', '次へ', '続きを見る', '始める'];
  let 踏んだ = 0;
  let 名前を指せた = false;
  for (let i = 0; i < 40; i++) {
    // 手順の切り替わりでは、指す先を測り終わるまで番号札を出さない。
    // その空白を「終わった」と取り違えないよう、しばらく待ってから無いと判断する
    const 札 = page.locator('text=/^\\d+ \\/ \\d+$/').first();
    const 出ている = await 札.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
    if (!出ている) break;
    踏んだ++;

    const 題 = await page
      .locator('text=誰の記録かを決めます')
      .first()
      .isVisible()
      .catch(() => false);
    if (題) {
      const 枠 = await 指す先の枠();
      if (枠 && 枠.w > 0) {
        // 指しているのが左の名前のところであること（○×の側ではない）
        const 一つ目 = await page.locator('[data-testid^="ます-"]').first().boundingBox();
        expect(枠.x, '名前ではなく○×のほうを指している').toBeLessThan(一つ目.x + 2);
        名前を指せた = true;
      }
    }

    let 進めた = false;
    for (const 文字 of 進む手) {
      const b = page.getByText(文字, { exact: true }).first();
      if (await b.isVisible().catch(() => false)) {
        await b.click().catch(() => {});
        進めた = true;
        break;
      }
    }
    expect(進めた, `横の案内が${踏んだ}手目で行き止まりになった`).toBe(true);
    await page.waitForTimeout(700);
  }

  expect(踏んだ, '横だと案内が途中で止まる').toBeGreaterThan(5);
  expect(名前を指せた, '横のとき、案内が名前の位置を指せていない').toBe(true);
});
