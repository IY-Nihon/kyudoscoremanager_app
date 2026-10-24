/**
 * 区分（団体が作る分け方。2026-10-16 の段 2）の検査。
 *
 *   npx playwright test e2e/divisions.spec.mjs
 *
 * 見るのは
 *   ・設定の「区分」で足す（同じ名前は断る）・「↑」で並べ替える・名前を直す・消す。どれも雲（app_settings の divisions）に残る
 *   ・区分があると、メンバーの編集に区分の札が出て押せる。学校の部の一覧の上に「学年ごと｜区分ごと」が出る
 *
 * ■ 記録には書き込まない（雲に書くのは設定の区分だけ）
 * 書くのは 100003 の config/app_settings の divisions だけ（ほかの検査は読まない）。前後で消す
 * （持ち主として REST で入って、その項目だけを消す）。雲の文書は 1 つなので 1 機種だけで流す。
 * メンバーの編集は開いて札を押すだけで、保存はしない。
 * 100003 を使うほかの検査（鍵・引いて更新・紹介の札）は区分を見ないので、団体を分け合ってよい
 * （区分があるあいだ、メンバーの一覧の上に「学年ごと｜区分ごと」が出るだけ）。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  画面が変わるまで待つ,
} from './helpers.mjs';
import { configFor, signIn, req, fromFields } from '../scripts/fb-rest.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

const 団体 = '100003';
const 団体のメール = 'stg-c@example.com';
const 合言葉 = 検証のパスワード();
test.use({ storageState: 'e2e/.auth/100003.json' });

const 設定 = configFor('stg');
let 持ち主の証 = '';
async function 証() {
  if (持ち主の証) return 持ち主の証;
  持ち主の証 = await signIn(設定.apiKey, 団体のメール, 合言葉);
  if (!持ち主の証) throw new Error('検証環境の団体に入れませんでした');
  return 持ち主の証;
}
const 道 = `/groups/${団体}/config/app_settings`;
async function 雲の区分() {
  const { status, json } = await req(設定.projectId, 道, { token: await 証() });
  if (200 !== status) return null;
  return (fromFields(json.fields || {}).divisions || []).map((区分) => 区分.name);
}
// divisions の項目だけを消す（ほかの設定は残す）
async function 雲の区分を消す() {
  await req(設定.projectId, 道, {
    token: await 証(),
    method: 'PATCH',
    query: '?updateMask.fieldPaths=divisions',
    body: { fields: {} },
  });
}

const 雲の機種 = 'パソコン';
test.beforeAll(async ({}, 情報) => {
  if (情報.project.name === 雲の機種) await 雲の区分を消す();
});
test.afterAll(async ({}, 情報) => {
  if (情報.project.name === 雲の機種) await 雲の区分を消す();
});

async function 開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await expect(page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 30_000 });
}
async function 設定へ(page) {
  await page.getByRole('tab', { name: '設定' }).click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  const 欄 = page.getByTestId('区分の設定');
  await 欄.scrollIntoViewIfNeeded();
  return 欄;
}
/** 欄に並んでいる区分の名前（上から） */
async function 並び(欄) {
  const 名前たち = await 欄
    .getByRole('button', { name: / の名前を直す$/ })
    .evaluateAll((要素たち) =>
      要素たち.map((要素) => (要素.getAttribute('aria-label') || '').replace(/ の名前を直す$/, ''))
    );
  return 名前たち;
}

test('区分：設定で足す・並べ替える・名前を直す・消す。メンバーの編集に札が出る', async ({ page }, 情報) => {
  test.skip(情報.project.name !== 雲の機種, '雲の文書は 1 つなので 1 機種だけ');
  test.setTimeout(180_000);
  await 開く(page);
  let 欄 = await 設定へ(page);
  const 入力 = page.getByLabel('足す区分の名前', { exact: true });

  // 足す。同じ名前は断る
  await 入力.fill('検査甲');
  await 欄.getByRole('button', { name: '足す', exact: true }).click();
  await 入力.fill('検査乙');
  await 欄.getByRole('button', { name: '足す', exact: true }).click();
  await expect.poll(() => 並び(欄)).toEqual(['検査甲', '検査乙']);
  await 入力.fill('検査甲');
  await 欄.getByRole('button', { name: '足す', exact: true }).click();
  await expect(欄.getByText('「検査甲」はもうあります', { exact: true })).toBeVisible();
  await 入力.fill('');

  // 並べ替え（乙を上へ）。端の「↑」は効かない
  await 欄.getByRole('button', { name: '検査乙 を上へ' }).click();
  await expect.poll(() => 並び(欄)).toEqual(['検査乙', '検査甲']);
  await 欄.getByRole('button', { name: '検査乙 を上へ' }).click();
  await expect.poll(() => 並び(欄)).toEqual(['検査乙', '検査甲']);
  await expect
    .poll(雲の区分, { timeout: 20_000, message: '雲に並びが残らない' })
    .toEqual(['検査乙', '検査甲']);

  // 名前を直す
  await 欄.getByRole('button', { name: '検査甲 の名前を直す' }).click();
  await page.getByLabel('区分の名前', { exact: true }).fill('検査丙');
  await 欄.getByRole('button', { name: '名前を決める' }).click();
  await expect.poll(() => 並び(欄)).toEqual(['検査乙', '検査丙']);
  await expect.poll(雲の区分, { timeout: 20_000 }).toEqual(['検査乙', '検査丙']);

  // メンバー：一覧の上に「学年ごと｜区分ごと」、足す窓に区分の札（押すと付く。保存はしない）
  await page.getByRole('tab', { name: 'メンバー' }).click();
  await 画面が変わるまで待つ(page, '部員を追加');
  await expect(page.getByRole('tab', { name: '区分ごと' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: '部員を追加' }).click();
  const 札 = page.getByRole('checkbox', { name: '検査乙' });
  await expect(札).toBeVisible({ timeout: 10_000 });
  await expect(札).toHaveAttribute('aria-checked', 'false');
  await 札.click();
  await expect(札).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('checkbox', { name: '検査丙' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: '閉じる' }).click();

  // 消す（確かめの窓で「消す」）
  欄 = await 設定へ(page);
  for (const 名 of ['検査乙', '検査丙']) {
    await 欄.getByRole('button', { name: `${名} を消す` }).click();
    await page.getByTestId('窓のボタン-消す').click();
  }
  await expect.poll(() => 並び(欄)).toEqual([]);
  await expect.poll(雲の区分, { timeout: 20_000, message: '消しても雲に残る' }).toEqual([]);
});
