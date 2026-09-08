/**
 * 個人ログイン（部員）で、自分の弓具を登録できるかの検査。
 *
 *   npx playwright test e2e/memberEquipment.spec.mjs
 *
 * ■ なぜこれを入れたか
 *
 * 弓具の登録は「メンバー画面 → 自分の欄 → 弓具管理」にしか入り口が無い。
 * ところがメンバーのタブは団体ログイン専用に絞ってあり、個人で入った人は
 * 画面そのものに辿り着けなかった。中の権限は本人に許してあったので、
 * 画面の中だけを見ていても見つからない。ここでは**タブが出ること**から見る。
 *
 * 併せて、タブを開けたことで壊してはいけない決まりも見る。
 *   ・個人ログインでは部員を足せない
 *   ・他人の欄は開けない（開こうとすると断られる）
 *
 * ■ 団体には書き込まない
 * 弓具管理の入り口が在ることと、開くところまでを見る。履歴は足さないので
 * 名簿は変わらない。100002 を使う他の検査と並べて流してよい。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  画面が変わるまで待つ,
  こうなるまで待つ,
} from './helpers.mjs';

const 団体 = '100002';
test.use({ storageState: 'e2e/.auth/100002-個人.json' });

/** 控えに入っている「自分」。誰の欄を開けばよいかは端末が覚えている */
async function 自分を読む(page) {
  return page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
    return { 役: s.activeRole || null, id: s.myMemberId || null, 名: s.myMemberName || null };
  });
}

async function 入る(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  const 自分 = await 自分を読む(page);
  expect(自分.役, `団体${団体}の控えが個人ログインになっていない`).toBe('member');
  expect(自分.名, '控えに自分の名前が入っていない').toBeTruthy();
  return 自分;
}

test('個人ログインでもメンバーのタブが出て、自分の弓具を登録しにいける', async ({ page }) => {
  const 自分 = await 入る(page);

  // ここが本体。タブが出ていなければ、権限をいくら許しても届かない
  const タブ = page.getByText('メンバー', { exact: true }).first();
  await expect(タブ, '個人ログインでメンバーのタブが出ない').toBeVisible({ timeout: 30000 });

  await タブ.click();
  await 画面が変わるまで待つ(page, 'メンバー管理');

  // 自分の欄を開く
  await page.getByText(自分.名, { exact: true }).first().click();
  await expect(
    page.getByText('弓具管理', { exact: true }),
    '自分の欄を開いても弓具管理が出ない'
  ).toBeVisible({ timeout: 20000 });

  // 登録の窓まで開けること（ここまで来られれば弓力を入れられる）
  await page.getByText('弓具変更履歴を表示・編集', { exact: true }).click();
  await expect(
    page.getByPlaceholder('弓力'),
    '弓具変更履歴の窓に、弓力を入れる欄が出ない'
  ).toBeVisible({ timeout: 20000 });
});

test('個人ログインでは、部員を足せず、他人の欄も開けない', async ({ page }) => {
  const 自分 = await 入る(page);

  await page.getByText('メンバー', { exact: true }).first().click();
  await 画面が変わるまで待つ(page, 'メンバー管理');

  // 部員を追加するボタンは、団体ログインのときだけ
  await expect(
    page.getByLabel('部員を追加'),
    '個人ログインなのに部員を追加できてしまう'
  ).toHaveCount(0);

  // 自分以外が名簿に届くのを待つ。雲から遅れて来るので、数で待つ
  await こうなるまで待つ(
    () => page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
      return (s.members || []).length;
    }),
    (n) => n >= 2,
    30000
  );
  const 他人 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
    const 自分 = s.myMemberId;
    return (s.members || []).filter((m) => m && m.id !== 自分).map((m) => m.name)[0] || null;
  });
  expect(他人, `団体${団体}に自分以外の部員が届かない`).toBeTruthy();
  expect(他人).not.toBe(自分.名);

  await page.getByText(他人, { exact: true }).first().click();
  // 断りはアプリの中の窓で出る（ブラウザの窓には出さない決まり）
  await expect(
    page.getByText('メンバーモードでは自分以外の情報は編集できません。'),
    '他人の欄が開けてしまう'
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('弓具管理', { exact: true }), '他人の弓具が見えている').toHaveCount(0);
});
