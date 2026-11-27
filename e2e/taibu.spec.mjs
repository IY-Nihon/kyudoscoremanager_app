/**
 * 卒業・退部にしたメンバーはログインできない・ライブの合言葉を作り直す（2026-11-26 本人「退部した人は入れなくする」）。
 * 中継の /kojin と新しい決まりがあるとき（手元のエミュレーター。npm run e2e:emu）だけ流す。
 *
 *   npm run e2e:emu -- e2e/taibu.spec.mjs --project=スマホ
 *
 * 流れ（団体はこの検査が回ごとに作る：e2e/emu-dantai.mjs。エミュレーターなので雲には書かない）：
 *   団体アカウントがメンバーを足す（その場で個人ID が付く）→ その個人ID でログインできる
 *   → メンバーの編集で「退部」にする → 団体の文書のライブの合言葉が作り直される（前と違う）
 *   → その個人ID でログインすると「退部したメンバーはログインできません。…」と断られる
 *   → 在籍に戻すと、またログインできる（合言葉は作り直さない）
 * 前は 100002 で流していたが、同じ団体を使う検査がほかに 6 つあり、並べて流すと名簿・ライブの合言葉を取り合うおそれが
 * あった（test/e2eSetup.test.js の重なりの検査が止めた。2026-11-26）
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  団体で入る,
  個人で入る,
} from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';
import { 文書の根, 管理, 検査の団体を作る, 名簿で引く } from './emu-dantai.mjs';

test.skip(
  process.env.FB_EMULATOR !== '1',
  '中継の /kojin と新しい決まりがあるのは手元のエミュレーターだけ（配るまで）'
);

/** エミュレーターの団体を管理の資格で読む（e2e/emu-fetch.mjs が手元へ向ける） */
const 読む = async (団体, 道 = '') =>
  (await fetch(`${文書の根}/groups/${団体}${道}`, { headers: 管理 })).json();
const ライブの合言葉 = async (団体) => (await 読む(団体)).fields?.liveSecret?.stringValue || null;

/** 上のタブ（role="tab"） */
const タブ = (page, 名) => page.getByRole('tab', { name: 名 }).first();

/** メンバーの編集で在籍を選んで保存する */
async function 在籍を変える(page, 名前, 在籍) {
  await タブ(page, 'メンバー').click();
  // 卒業・退部の人は一覧の下にまとまって畳まれている。畳まれていれば開く
  const 名 = page.getByTestId('メンバーの一覧').getByText(名前, { exact: true }).first();
  if (!(await 名.isVisible().catch(() => false)))
    await page
      .getByText(/した人を表示|卒業生を表示/)
      .first()
      .click();
  await 名.click();
  await page.getByRole('radio', { name: 在籍, exact: true }).click();
  await page.getByText('保存する', { exact: true }).click();
  await expect(page.getByText('保存する', { exact: true })).toHaveCount(0, { timeout: 10_000 });
}

/** 新しい端末で個人ID のログインを試す。断られたら窓の文を、入れたら null を返す */
async function 個人で入ってみる(browser, 団体, 個人ID) {
  const 場 = await browser.newContext();
  try {
    const page = await 場.newPage();
    await 案内を止める(page);
    await page.goto('/');
    return await 個人で入る(page, 団体, 個人ID);
  } finally {
    await 場.close();
  }
}

test('退部にした人はログインできず、ライブの合言葉が作り直される。在籍に戻すとまた入れる', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const 団体 = await 検査の団体を作る('taibu');
  // 前の合言葉を置いておく（無い団体は作り直さない。次に用意するときに新しく作る）
  const 前 = 'e2e' + Date.now().toString(36).padEnd(29, 'a');
  await fetch(`${文書の根}/groups/${団体}?updateMask.fieldPaths=liveSecret`, {
    method: 'PATCH',
    headers: 管理,
    body: JSON.stringify({ fields: { liveSecret: { stringValue: 前 } } }),
  });
  expect(await ライブの合言葉(団体)).toBe(前);

  // ── 団体アカウントがメンバーを足す ──
  const 名前 = '検査 退部';
  const 持ち主の場 = await browser.newContext();
  const 持ち主 = await 持ち主の場.newPage();
  await 案内を止める(持ち主);
  await 持ち主.goto('/');
  await 画面が出るまで待つ(持ち主);
  await 入り口が決まるまで待つ(持ち主);
  await 団体で入る(持ち主, 団体, 検証のパスワード());
  await タブ(持ち主, 'メンバー').click();
  await 持ち主.getByRole('button', { name: 'メンバーを追加' }).click();
  await 持ち主.getByLabel('名前', { exact: true }).fill(名前);
  await 持ち主.getByText('保存する', { exact: true }).click();
  let 個人ID = null;
  await expect
    .poll(async () => (個人ID = (await 名簿で引く(団体, 名前))?.個人ID), {
      timeout: 60_000,
      message: '足した人に個人ID が付かない',
    })
    .toBeTruthy();
  expect(await 個人で入ってみる(browser, 団体, 個人ID), '在籍の人が入れない').toBeNull();

  // ── 退部にする → ライブの合言葉が作り直され、その人は入れない ──
  await 在籍を変える(持ち主, 名前, '退部');
  await expect
    .poll(() => ライブの合言葉(団体), {
      timeout: 30_000,
      message: '退部にしてもライブの合言葉が作り直されない',
    })
    .not.toBe(前);
  const 作り直した = await ライブの合言葉(団体);
  expect(作り直した && 作り直した.length >= 20, '作り直した合言葉が短い').toBe(true);
  expect(await 個人で入ってみる(browser, 団体, 個人ID)).toContain(
    '退部したメンバーはログインできません。続けて使うときは、団体の管理者に「在籍」に戻してもらってください。'
  );

  // ── 在籍に戻すと、また入れる（合言葉は作り直さない） ──
  await 在籍を変える(持ち主, 名前, '在籍');
  await expect
    .poll(async () => (await 個人で入ってみる(browser, 団体, 個人ID)) ?? '入れた', {
      timeout: 120_000,
      message: '在籍に戻しても入れない',
    })
    .toBe('入れた');
  expect(await ライブの合言葉(団体)).toBe(作り直した);
  await 持ち主の場.close();
});

test('配る前に退部にした人がいる団体は、管理できる端末で一度だけ合言葉を作り直す（11/27 の点検）', async ({ browser }) => {
  test.setTimeout(180_000);
  const 団体 = await 検査の団体を作る('taibu-mae');
  // 前の版のままの団体：合言葉はあるが世代の印は無く、名簿に前から退部の人がいる
  const 前 = 'e2e' + Date.now().toString(36).padEnd(29, 'b');
  await fetch(`${文書の根}/groups/${団体}?updateMask.fieldPaths=liveSecret`, {
    method: 'PATCH',
    headers: 管理,
    body: JSON.stringify({ fields: { liveSecret: { stringValue: 前 } } }),
  });
  await fetch(`${文書の根}/groups/${団体}/members/mae-taibu`, {
    method: 'PATCH',
    headers: 管理,
    body: JSON.stringify({
      fields: {
        id: { stringValue: 'mae-taibu' },
        name: { stringValue: '検査 前から退部' },
        enrollment: { stringValue: '退部' },
      },
    }),
  });
  const 世代 = async () => (await 読む(団体)).fields?.liveSecretGen?.integerValue ?? null;

  const 場 = await browser.newContext();
  const page = await 場.newPage();
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 検証のパスワード());
  await expect
    .poll(() => ライブの合言葉(団体), { timeout: 60_000, message: '前から退部の人がいても作り直されない' })
    .not.toBe(前);
  expect(await 世代()).toBe('1');
  const 作り直した = await ライブの合言葉(団体);

  // 開き直しても、もう作り直さない（一度だけ）
  await page.reload();
  await 画面が出るまで待つ(page);
  await page.waitForTimeout(8_000);
  expect(await ライブの合言葉(団体), '開き直すたびに作り直した').toBe(作り直した);
  await 場.close();
});
