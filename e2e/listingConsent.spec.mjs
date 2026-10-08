/**
 * 「使っている部として、紹介に載せてもよいですか？」の札と、設定の「紹介への掲載」の検査（2026-10-09）。
 *
 *   npx playwright test e2e/listingConsent.spec.mjs
 *
 * 見るのは
 *   ・札で一度も聞いていない団体には、設定の「紹介への掲載」を出さない（案内が来ていない団体には出さない）
 *   ・札：何を載せるかは未選択、載せる先は最初どちらもチェック、名前は団体名。足りないと決められない
 *   ・決めると雲（groups/{団体ID}/config/listing）に残り、設定に項目が出て、選んだとおりに映る
 *   ・設定で「載せない」に変えると、載せる先も外れて雲に残る
 *
 * ■ 札の開き方
 * 札を出すかの決まり（記録 10 回・14 日・あとでは次に開くまで）は test/listingConsent.test.js で見る。
 * 検証環境の団体は記録が 10 件に届かないので、保存から札が出る道は通せない。札は検査用の口
 * （globalThis.__掲載の札を開く）で開き、そこから先（選ぶ→雲に保存→設定）は本物の道を通す。
 *
 * ■ 記録には書き込まない
 * 書くのは 100003 の config/listing だけで、ほかの検査は読まない。前後で消す（持ち主として REST で入って消す）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';
import { configFor, signIn, req, fromFields } from '../scripts/fb-rest.mjs';

const 団体 = '100003';
const 団体のメール = 'stg-c@example.com';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100003.json' });
test.describe.configure({ mode: 'serial' });

const 設定 = configFor('stg');
let 持ち主の証 = '';
async function 証() {
  if (持ち主の証) return 持ち主の証;
  // signIn は ID トークンの字をそのまま返す
  持ち主の証 = await signIn(設定.apiKey, 団体のメール, 合言葉);
  if (!持ち主の証) throw new Error('検証環境の団体に入れませんでした');
  return 持ち主の証;
}
const 道 = `/groups/${団体}/config/listing`;
async function 雲の答え() {
  const { status, json } = await req(設定.projectId, 道, { token: await 証() });
  return 200 === status ? fromFields(json.fields || {}) : null;
}
async function 雲の答えを消す() {
  await req(設定.projectId, 道, { token: await 証(), method: 'DELETE' });
}

// 雲の文書は 1 つなので、雲を見る検査は 1 機種だけで流す（3 機種が並んで流れると、片付けと書き込みが取り合う）
const 雲の機種 = 'パソコン';
test.beforeAll(async ({}, 情報) => {
  if (情報.project.name === 雲の機種) await 雲の答えを消す();
});
test.afterAll(async ({}, 情報) => {
  if (情報.project.name === 雲の機種) await 雲の答えを消す();
});

async function 開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await expect(page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 30_000 });
}
async function 設定へ(page) {
  // 一度開いた画面は裏に残り、その見出しの「設定」も字で当たるので、上のバーのタブを押す
  await page.getByRole('tab', { name: '設定' }).click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
}

test('札：何を載せるかは未選択、載せる先は最初どちらもチェック。足りないと決められない。あとで・✕で閉じる', async ({ page }) => {
  await 開く(page);
  await page.evaluate(() => globalThis.__掲載の札を開く());
  const 札 = page.getByTestId('掲載の札');
  await expect(札).toBeVisible({ timeout: 10_000 });
  // 札は画面からはみ出さない
  const 枠 = await 札.boundingBox();
  const 幅 = page.viewportSize().width;
  expect(枠.x, '札が左にはみ出す').toBeGreaterThanOrEqual(0);
  expect(枠.x + 枠.width, '札が右にはみ出す').toBeLessThanOrEqual(幅 + 1);
  await page.getByTestId('掲載-決める').click();
  await expect(page.getByTestId('掲載-誤り')).toContainText('何を載せるか');
  await page.getByTestId('掲載-載せ方-地域').click();
  await expect(page.getByTestId('掲載-ホームページ')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('掲載-他校への案内')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('掲載-決める').click();
  await expect(page.getByTestId('掲載-誤り')).toContainText('地域');
  await page.getByTestId('掲載-載せ方-団体名').click();
  // 名前の欄には団体名が入っている（100003 は親の文書が無く団体名が空なので、空のまま）
  const 団体名 = await page.evaluate(
    () =>
      (JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}').state || {})
        .activeGroupName || ''
  );
  await expect(page.getByTestId('掲載-名前')).toHaveValue(団体名);
  await page.getByTestId('掲載-名前').fill('テスト大学弓道部');
  await page.getByTestId('掲載-ホームページ').click();
  await page.getByTestId('掲載-他校への案内').click();
  await page.getByTestId('掲載-決める').click();
  await expect(page.getByTestId('掲載-誤り')).toContainText('載せる先');
  // 載せないを選ぶと、載せる先は出ない
  await page.getByTestId('掲載-載せ方-載せない').click();
  await expect(page.getByTestId('掲載-ホームページ')).toHaveCount(0);
  await page.getByTestId('掲載-あとで').click();
  await expect(札).toHaveCount(0);
  await page.evaluate(() => globalThis.__掲載の札を開く());
  await expect(札).toBeVisible();
  await page.getByTestId('掲載-閉じる').click();
  await expect(札).toHaveCount(0);
});

test('雲：聞いていない団体には設定を出さない。札で決めると雲に残り、設定に同じ選びが出て、変えられる', async ({ page }, 情報) => {
  test.skip(情報.project.name !== 雲の機種, '雲の文書は 1 つなので 1 機種だけ');
  test.setTimeout(150_000);
  await 開く(page);
  await 設定へ(page);
  // 雲から読み直す間を置いても出ない
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('設定-紹介への掲載')).toHaveCount(0);

  await page.getByRole('tab', { name: '記録' }).click();
  await expect(page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => globalThis.__掲載の札を開く());
  const 札 = page.getByTestId('掲載の札');
  await expect(札).toBeVisible({ timeout: 10_000 });
  // あとで・✕ は雲に何も残さない
  await page.getByTestId('掲載-あとで').click();
  await page.waitForTimeout(1500);
  expect(await 雲の答え(), '閉じただけで雲に答えが残った').toBeNull();

  await page.evaluate(() => globalThis.__掲載の札を開く());
  await page.getByTestId('掲載-載せ方-団体名').click();
  await page.getByTestId('掲載-名前').fill('テスト大学弓道部');
  await page.getByTestId('掲載-ホームページ').click();
  await expect(page.getByTestId('掲載-ホームページ')).toHaveAttribute('aria-checked', 'false');
  await page.getByTestId('掲載-決める').click();
  await expect(札, '決めても札が閉じない').toHaveCount(0, { timeout: 15_000 });

  await expect
    .poll(async () => (await 雲の答え())?.載せ方, { timeout: 20_000, message: '雲に答えが残らない' })
    .toBe('団体名');
  const 答え = await 雲の答え();
  expect(答え.載せる名前).toBe('テスト大学弓道部');
  expect(答え.ホームページ).toBe(false);
  expect(答え.他校への案内).toBe(true);
  expect(答え.聞いた文の版).toBeTruthy();
  expect(答え.答えた日時, '答えた日時が残らない').toBeTruthy();

  await 設定へ(page);
  const 項目 = page.getByTestId('設定-紹介への掲載');
  await expect(項目).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('設定-掲載-載せ方-団体名')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('設定-掲載-ホームページ')).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByTestId('設定-掲載-他校への案内')).toHaveAttribute('aria-checked', 'true');
  await expect(項目).toContainText('に答えました');

  await page.getByTestId('設定-掲載-載せ方-載せない').click();
  await expect(page.getByTestId('設定-掲載-ホームページ')).toHaveCount(0);
  await page.getByTestId('設定-掲載-保存').click();
  await expect(項目).toContainText('保存しました', { timeout: 15_000 });
  await expect.poll(async () => (await 雲の答え())?.載せ方, { timeout: 20_000 }).toBe('載せない');
  const 後 = await 雲の答え();
  expect(後.ホームページ).toBe(false);
  expect(後.他校への案内).toBe(false);
  expect(後.載せる名前).toBe('');
});
