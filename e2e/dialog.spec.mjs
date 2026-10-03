/**
 * 確認・お知らせがアプリの中に出ることの検査。
 *
 *   npx playwright test e2e/dialog.spec.mjs
 *
 * 前は Web だけ window.confirm / window.alert を使っていた。
 * 見た目がアプリと揃わず、機種によって出る場所も違うので、
 * すべて alertBridge → AppDialog に寄せた。ここでは
 *   ・ブラウザの窓が一度も出ないこと
 *   ・ボタン1つ以下は帯（自動で消える）で出ること
 *   ・ボタン2つ以上は画面の中の窓で止まり、キャンセルで何も起きないこと
 * を見る。ブラウザの窓に戻ると、この検査が落ちる。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  画面が変わるまで待つ,
  入り口が決まるまで待つ,
} from './helpers.mjs';
import fs from 'node:fs';

const お知らせの版 = (fs.readFileSync('src/WhatsNewModal.js', 'utf8').match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

// 鍵(100003)・ライブ(100006)・交代(100005)とは別の団体を使う
const 団体 = '100001';

// ここはログイン前の画面も見るので、控えは使わず素の状態から始める
const 合言葉 = 'StgTest!2026';

/** ブラウザの窓が出たら数える。出た時点で不合格なので、内容は見ずに閉じる */
function 窓を見張る(page) {
  const 数 = { 件: 0, 中身: [] };
  page.on('dialog', async (d) => {
    数.件 += 1;
    数.中身.push(d.message());
    await d.dismiss().catch(() => {});
  });
  return 数;
}

/**
 * 打って、入ったかを確かめ、違えば打ち直す（入力欄は controlled で、打ち込みの途中の描き直しで字が落ちる。
 * 焦点が取れないと、何度打っても 0 字のまま）。入ったら true
 */
async function 確かに打つ(欄, 文字) {
  for (let 回 = 0; 回 < 3; 回++) {
    await 欄.click();
    await 欄.pressSequentially(文字, { delay: 20 });
    if ((await 欄.inputValue()) === 文字) return true;
    await 欄.fill('');
  }
  return false;
}

/**
 * 帯が出きるのを待つ。Modal のころの囲いは、出る動き（300 ミリ秒）が終わってから働いたので、
 * 帯が見えた直後に打つと、囲いのある古い作りでも通ってしまう（この検査が何も見ない）。
 * 帯の最短は 2.6 秒なので、そのうち 0.8 秒だけ置く
 */
function 帯が出きるのを待つ(page) {
  return page.waitForTimeout(800);
}

/** いま焦点が当たっている欄の placeholder（欄でなければ空） */
function 焦点の欄の印(page) {
  return page.evaluate(() => (document.activeElement && document.activeElement.getAttribute('placeholder')) || '');
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
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')?.state || {};
            return s.activeGroupId || null;
          }),
        { timeout: 60_000, message: 'ログインが通らない（団体IDが入らない）' }
      )
      .not.toBeNull();
    await page.waitForTimeout(1500);
  }
  // ここで書いて reload していたのをやめた（上の 案内を止める が代わり）
}

test.describe('確認とお知らせ', () => {
  test('ログインの前でも、空のまま押すとアプリの中に帯が出る', async ({ page }) => {
    const 窓 = 窓を見張る(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);

    await page.getByText('ログイン', { exact: true }).click();

    // 帯はボタンが1つ以下のとき。押させずに自動で消える
    await expect(page.getByTestId('アプリの帯')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('アプリの帯')).toContainText('入力してください');
    expect(窓.件, `ブラウザの窓が出た: ${窓.中身.join(' / ')}`).toBe(0);
  });

  test('帯はしばらくすると自分で消える', async ({ page }) => {
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await page.getByText('ログイン', { exact: true }).click();
    const 帯 = page.getByTestId('アプリの帯');
    await expect(帯).toBeVisible({ timeout: 10_000 });
    await expect(帯).toBeHidden({ timeout: 10_000 });
  });

  test('帯が出ている間も、下の入力欄を押して字が打てる（帯は焦点を取らない）', async ({ page }) => {
    // 帯が Modal の中にあったころ（〜2026-10-03）は、react-native-web の Modal が窓の外へ移った焦点を
    // 中へ戻すので、帯の 2.6〜6 秒のあいだ入力欄に打てなかった（ログイン失敗の帯の間は打ち直せない）
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await page.getByText('ログイン', { exact: true }).click();
    const 帯 = page.getByTestId('アプリの帯');
    await expect(帯).toBeVisible({ timeout: 10_000 });
    await 帯が出きるのを待つ(page);

    const 欄 = page.getByPlaceholder('例: 123456');
    expect(await 確かに打つ(欄, '123'), '帯が出ている間に、団体IDの欄へ字が打てない').toBe(true);
    // 打てたのは帯が出ている間のこと（帯が先に消えていたら、この検査は何も見ていない）
    await expect(帯, '打っている間に帯が消えた（検査が成り立たない）').toBeVisible();
    expect(await 焦点の欄の印(page)).toBe('例: 123456');
  });

  test('長い知らせは流さず、窓で止めて読ませる', async ({ page }) => {
    // 団体IDや注意書きは「読んで控える」もの。2.6秒で消えると前より悪くなる。
    // 改行つき・長い文はボタンが無くても窓にして、OK を押すまで残す決まり
    const 窓 = 窓を見張る(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);

    await page.getByText('団体IDを忘れた', { exact: true }).click();

    const 札 = page.getByTestId('アプリの窓');
    await expect(札).toBeVisible({ timeout: 10_000 });
    // 見たいのは「長い知らせが帯ではなく窓で止まる」こと。
    // 文言そのものを丸ごと書くと、案内を直すたびにここが落ちる
    await expect(札).toContainText('登録直後の画面にのみ表示されます');
    await expect(page.getByTestId('窓のボタン-OK')).toBeVisible();
    expect(窓.件, `ブラウザの窓が出た: ${窓.中身.join(' / ')}`).toBe(0);

    // 帯とちがって、待っても勝手には消えない
    await expect(札).toBeVisible();

    await page.getByTestId('窓のボタン-OK').click();
    await expect(札).toBeHidden({ timeout: 10_000 });
  });

  test('ボタンが2つの確認は画面の中の窓で止まり、キャンセルでは消えない', async ({ page }) => {
    const 窓 = 窓を見張る(page);
    await 入る(page);

    await page.getByText('メンバー', { exact: true }).first().click();
    await 画面が変わるまで待つ(page, '部員を追加');

    // 一覧の先頭の部員を開く。1人もいない団体ではこの検査は流す
    const 削除ボタン = page.getByText('メンバーを削除', { exact: true }).first();
    const 一覧 = page.locator('[data-testid^="メンバー-"], text=/年生/');
    await page.locator('div').filter({ hasText: /^\S+$/ }).first().waitFor().catch(() => {});
    const 開けた = await (async () => {
      const 行 = page.getByText(/さん|年生|その他/).first();
      if (!(await 行.isVisible().catch(() => false))) return false;
      await 行.click().catch(() => {});
      await page.waitForTimeout(1200);
      return await 削除ボタン.isVisible().catch(() => false);
    })();
    test.skip(!開けた, '部員が開けなかった（この団体に部員がいない）');

    const 人数の前 = await page.evaluate(() => {
      const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')?.state || {};
      return (s.members || []).length;
    });

    await 削除ボタン.click();

    // アプリの中の窓。うしろの画面にも同じ字があるので、目印で窓の中だけを見る
    const 札 = page.getByTestId('アプリの窓');
    await expect(札).toBeVisible({ timeout: 10_000 });
    await expect(札).toContainText('削除しますか？');
    await expect(page.getByTestId('窓のボタン-キャンセル')).toBeVisible();
    await expect(page.getByTestId('窓のボタン-削除')).toBeVisible();
    expect(窓.件, `ブラウザの窓が出た: ${窓.中身.join(' / ')}`).toBe(0);

    await page.getByTestId('窓のボタン-キャンセル').click();
    await expect(札).toBeHidden({ timeout: 10_000 });

    // キャンセルなので1人も減っていないこと
    const 人数の後 = await page.evaluate(() => {
      const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')?.state || {};
      return (s.members || []).length;
    });
    expect(人数の後).toBe(人数の前);
  });
});

test.describe('帯は窓の上に出る', () => {
  // 帯も「出るときだけ置く」形にしていないと、部員の窓の下に隠れて読めない。
  // 名前を空にして保存を押すと知らせが出るので、そこで見る（保存は止まるので中身は変わらない）
  test('部員の窓を開いたままでも、知らせの帯が読める', async ({ page }) => {
    const 窓 = 窓を見張る(page);
    await 入る(page);

    await page.getByText('メンバー', { exact: true }).first().click();
    await 画面が変わるまで待つ(page, '部員を追加');

    const 行 = page.getByText(/年生|その他/).first();
    test.skip(!(await 行.isVisible().catch(() => false)), 'この団体に部員がいない');
    await 行.click();
    await page.waitForTimeout(1200);

    // うしろの検索欄をつかまないよう、窓の中の名前欄だけを指す
    const 名前欄 = page.locator('input:not([placeholder="メンバーを検索..."])').first();
    test.skip(!(await 名前欄.isVisible().catch(() => false)), '部員の窓が開かなかった');
    await 名前欄.click();
    await 名前欄.fill('');
    await page.getByText('保存する', { exact: true }).first().click();

    const 帯 = page.getByTestId('アプリの帯');
    await expect(帯).toBeVisible({ timeout: 10_000 });
    await expect(帯).toContainText('名前を入力してください');
    expect(窓.件, `ブラウザの窓が出た: ${窓.中身.join(' / ')}`).toBe(0);

    // 帯は押す邪魔をしない。消えるのを待たずに、うしろの窓を閉じられること
    await page.getByText('メンバーを削除', { exact: true }).first().click();
    await expect(page.getByTestId('アプリの窓')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('窓のボタン-キャンセル').click();
  });
  test('部員の窓の中でも、帯が出ている間に名前欄へ字が打てる。帯は窓より手前の専用の箱に出る', async ({ page }) => {
    // 窓（Modal）の中の入力欄は、帯が Modal だったころは「いちばん手前の Modal」が帯に替わるため、
    // 帯の間は焦点を取れなかった。今は帯が Modal ではない箱に出るので、窓の中でそのまま打てる
    await 入る(page);
    await page.getByText('メンバー', { exact: true }).first().click();

    // 新規登録の窓（名前が空）。保存を押すと「名前を入力してください」の帯が出て、保存は止まる
    // （団体には何も書き込まない）。追加の釦は絵だけなので、読み上げの名前で探す
    const 追加 = page.getByLabel('部員を追加', { exact: true });
    await expect(追加, '部員を追加の釦が出ない').toBeVisible({ timeout: 20_000 });
    await 追加.click();
    await expect(page.getByText('保存する', { exact: true }).first(), '新規登録の窓が開かない').toBeVisible({ timeout: 15_000 });
    await page.getByText('保存する', { exact: true }).first().click();

    const 帯 = page.getByTestId('アプリの帯');
    await expect(帯).toBeVisible({ timeout: 10_000 });
    await expect(帯).toContainText('名前を入力してください');
    await 帯が出きるのを待つ(page);

    // 窓の中の名前欄（うしろの検索欄ではなく）
    const 名前欄 = page.getByPlaceholder('例: 山田 太郎');
    expect(await 確かに打つ(名前欄, 'ab'), '帯が出ている間に、窓の中の名前欄へ字が打てない').toBe(true);
    await expect(帯, '打っている間に帯が消えた（検査が成り立たない）').toBeVisible();
    expect(await 焦点の欄の印(page)).toBe('例: 山田 太郎');

    // 帯は Modal ではない専用の箱（body の直下）にあり、窓（react-native-web の Modal は 9999）より手前
    const 重なり = await page.evaluate(() => {
      const 層 = document.querySelector('[data-testid="アプリの帯の層"]');
      if (!層) return { 層あり: false };
      const 窓たち = [...document.querySelectorAll('[aria-modal="true"]')].map((m) => {
        let n = m;
        while (n && n !== document.body && getComputedStyle(n).zIndex === 'auto') n = n.parentElement;
        return n && n !== document.body ? Number(getComputedStyle(n).zIndex) : 0;
      });
      return {
        層あり: true,
        直下: 層.parentElement === document.body,
        層の重なり: Number(getComputedStyle(層).zIndex),
        指を通す: getComputedStyle(層).pointerEvents === 'none',
        帯は窓の中: !!層.closest('[aria-modal]') || !!層.querySelector('[aria-modal]'),
        窓の数: 窓たち.length,
        窓の重なりの最大: Math.max(0, ...窓たち),
      };
    });
    expect(重なり.層あり, '帯の専用の箱が無い').toBe(true);
    expect(重なり.直下, '帯の箱が body の直下に無い').toBe(true);
    expect(重なり.指を通す, '帯の箱が指を通さない').toBe(true);
    expect(重なり.帯は窓の中, '帯が窓（aria-modal）の中にある').toBe(false);
    expect(重なり.窓の数, '新規登録の窓が数えられない').toBeGreaterThan(0);
    expect(重なり.層の重なり, '帯が窓より手前にない').toBeGreaterThan(重なり.窓の重なりの最大);

    // 窓を閉じる（保存はしない）
    await page.keyboard.press('Escape');
  });

});
