/**
 * 卒業・退部にしたメンバーはログインできない・ライブの合言葉を作り直す（2026-11-26 本人「退部した人は入れなくする」）。
 * 中継の /kojin と新しい決まりがあるとき（手元のエミュレーター。npm run e2e:emu）だけ流す。
 *
 *   npm run e2e:emu -- e2e/taibu.spec.mjs --project=スマホ
 *
 * 流れ（団体 100002。エミュレーターなので雲には書かない）：
 *   団体アカウントがメンバーを足す（その場で個人ID が付く）→ その個人ID でログインできる
 *   → メンバーの編集で「退部」にする → 団体の文書のライブの合言葉が作り直される（前と違う）
 *   → その個人ID でログインすると「退部したメンバーはログインできません。…」と断られる
 *   → 在籍に戻すと、またログインできる（合言葉は作り直さない）
 * ほかの検査が使う部員（控えの 100002-個人）には触らない（並べて流してもぶつからないように、足した人で確かめる）
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

const 団体 = '100002';
test.skip(
  process.env.FB_EMULATOR !== '1',
  '中継の /kojin と新しい決まりがあるのは手元のエミュレーターだけ（配るまで）'
);

/** エミュレーターの団体（管理の資格で読む・書く。e2e/emu-fetch.mjs が手元へ向ける） */
const 根 = `https://firestore.googleapis.com/v1/projects/kyudoscoremanager-stg/databases/(default)/documents/groups/${団体}`;
const 管理 = { Authorization: 'Bearer owner' };
const 読む = async (道) => (await fetch(`${根}${道}`, { headers: 管理 })).json();
const ライブの合言葉 = async () => (await 読む('')).fields?.liveSecret?.stringValue || null;

/** 名簿でその名前の人の、招待でない個人ID（逆引き表の文書の名前）。まだ無ければ null */
async function 個人IDを引く(名前) {
  const 人 = ((await 読む('/members?pageSize=300')).documents || []).find(
    (文書) => 文書.fields?.name?.stringValue === 名前
  );
  if (!人) return null;
  const id = 人.name.split('/').pop();
  const 行 = ((await 読む('/member_lookup?pageSize=300')).documents || []).find(
    (文書) => 文書.fields?.memberId?.stringValue === id && 文書.fields?.招待?.booleanValue !== true
  );
  return 行 ? 行.name.split('/').pop() : null;
}

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
async function 個人で入ってみる(browser, 個人ID) {
  const 場 = await browser.newContext();
  try {
    const page = await 場.newPage();
    await 案内を止める(page);
    await page.goto('/');
    const 番号欄 = page.getByPlaceholder('例: 123456', { exact: true });
    await 番号欄.waitFor({ state: 'visible', timeout: 60_000 });
    await page.getByText('個人', { exact: true }).click();
    await 番号欄.click();
    await 番号欄.pressSequentially(団体, { delay: 20 });
    const 個人欄 = page.getByPlaceholder('例: K7MP3X', { exact: true });
    await 個人欄.click();
    await 個人欄.pressSequentially(個人ID, { delay: 20 });
    await page.getByText('ログイン', { exact: true }).click();
    const 窓 = page.getByTestId('アプリの窓');
    const 入った = () =>
      page.evaluate(() => {
        const s =
          JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
            ?.state || {};
        return !!s.activeGroupId;
      });
    await expect
      .poll(async () => (await 窓.isVisible().catch(() => false)) || (await 入った()), { timeout: 60_000 })
      .toBe(true);
    return (await 窓.isVisible().catch(() => false)) ? await 窓.innerText() : null;
  } finally {
    await 場.close();
  }
}

test('退部にした人はログインできず、ライブの合言葉が作り直される。在籍に戻すとまた入れる', async ({
  browser,
}) => {
  test.setTimeout(300_000);
  // 前の合言葉を置いておく（無い団体は作り直さない。次に用意するときに新しく作る）
  const 前 = 'e2e' + Date.now().toString(36).padEnd(29, 'a');
  await fetch(`${根}?updateMask.fieldPaths=liveSecret`, {
    method: 'PATCH',
    headers: { ...管理, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { liveSecret: { stringValue: 前 } } }),
  });
  expect(await ライブの合言葉()).toBe(前);

  // ── 団体アカウントがメンバーを足す（名前は回ごとに変える。同じエミュレーターでほかの機種が足した人を掴まない） ──
  const 名前 = `検査 退部${Date.now().toString(36).slice(-4)}`;
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
    .poll(async () => (個人ID = await 個人IDを引く(名前)), {
      timeout: 60_000,
      message: '足した人に個人ID が付かない',
    })
    .toBeTruthy();
  expect(await 個人で入ってみる(browser, 個人ID), '在籍の人が入れない').toBeNull();

  // ── 退部にする → ライブの合言葉が作り直され、その人は入れない ──
  await 在籍を変える(持ち主, 名前, '退部');
  await expect
    .poll(ライブの合言葉, { timeout: 30_000, message: '退部にしてもライブの合言葉が作り直されない' })
    .not.toBe(前);
  const 作り直した = await ライブの合言葉();
  expect(作り直した && 作り直した.length >= 20, '作り直した合言葉が短い').toBe(true);
  expect(await 個人で入ってみる(browser, 個人ID)).toContain(
    '退部したメンバーはログインできません。続けて使うときは、団体の管理者に「在籍」に戻してもらってください。'
  );

  // ── 在籍に戻すと、また入れる（合言葉は作り直さない） ──
  await 在籍を変える(持ち主, 名前, '在籍');
  await expect
    .poll(async () => (await 個人で入ってみる(browser, 個人ID)) ?? '入れた', {
      timeout: 120_000,
      message: '在籍に戻しても入れない',
    })
    .toBe('入れた');
  expect(await ライブの合言葉()).toBe(作り直した);
  await 持ち主の場.close();
});
