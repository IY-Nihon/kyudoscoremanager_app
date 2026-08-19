/**
 * 途中交代の単位（立目／射目）の検査。
 *
 *   npx playwright test e2e/substitution.spec.mjs
 *
 * 交代は「その射目から後ろは別の人が引いた」という印で、
 * 記録表の合計の内訳と、履歴・分析の「自分の記録か」の判定に効く。
 * 単位を立目にしても、しまわれる位置（何射目か）が同じであることを見る。
 *
 * 番号は打ち込まずに一覧から選ぶ（記録表で人を選ぶのと同じ形）。
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const お知らせの版 = (fs.readFileSync('src/JP_WhatsNewModal.js', 'utf8').match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

// 鍵の検査（e2e/lock.spec.mjs）と同じ団体を使う。どちらも「終了・保存」を
// 押さないので、団体の中身には何も書かない（検査は workers:1 で1つずつ動く）。
// 部員0人の 100005 は使わない。あちらは「作りたての団体」を再現するための
// 場所で、空のまま保つと決めてある（案内の検査がその前提で書かれている）
const 団体 = '100003';
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
  await page.evaluate((版) => {
    localStorage.setItem('tutorialDoneVersion', '2026-08-13-01');
    localStorage.setItem('whatsNewDismissedVersion', 版);
  }, お知らせの版);
  await page.reload();
  await page.waitForTimeout(4000);
}

/** 射手を1人立てて、その人の操作から途中交代の画面を開く */
async function 交代の画面を開く(page) {
  await 入る(page);
  await page.getByText('人', { exact: true }).first().click();
  await page.waitForTimeout(1500);

  // 名前のますを押すと操作の一覧が出る
  await page.getByText('選択', { exact: true }).first().click();
  await page.waitForTimeout(1200);
  await page.getByText('途中交代', { exact: true }).click();
  await page.waitForTimeout(1200);
  await expect(page.getByText('途中交代の設定', { exact: true })).toBeVisible();
}

test('途中交代：開くと立目の一覧が出て、射目にも切り替えられる', async ({ page }) => {
  await 交代の画面を開く(page);

  // 既定は立目。8射なら 1立目・2立目 が選べる
  await expect(page.getByText('1立目', { exact: true }), '開いたときに立目の一覧が無い').toBeVisible();
  await expect(page.getByText('2立目', { exact: true })).toBeVisible();
  await expect(page.getByText('3立目', { exact: true }), '8射なのに3立目が出ている').toHaveCount(0);
  await expect(page.getByText('1射目', { exact: true }), '立目なのに射目の一覧が出ている').toHaveCount(0);

  // 射目へ切り替えると、1射目から8射目まで選べる
  await page.getByText('射目', { exact: true }).click();
  await page.waitForTimeout(600);
  await expect(page.getByText('1射目', { exact: true }), '射目へ切り替わらない').toBeVisible();
  await expect(page.getByText('8射目', { exact: true })).toBeVisible();
  await expect(page.getByText('9射目', { exact: true }), '8射なのに9射目が出ている').toHaveCount(0);

  // 立目へ戻せる
  await page.getByText('立目', { exact: true }).click();
  await page.waitForTimeout(600);
  await expect(page.getByText('1立目', { exact: true }), '立目へ戻せない').toBeVisible();
});

test('途中交代：2立目を選ぶと、5射目からの交代として書かれる', async ({ page }) => {
  await 交代の画面を開く(page);

  await page.getByText('2立目', { exact: true }).click();
  await page.waitForTimeout(600);

  // 何射目になるかを、決める前に見せる
  await expect(page.getByText('2立目（5射目）から交代します'), '案内が出ない').toBeVisible();

  // ゲスト名で確定する
  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('交代太郎', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1500);

  // しまわれた位置が 4（＝5射目、0始まり）であること
  const 位置 = await page.evaluate(() => {
    const 生 = localStorage.getItem('archery-score-storage');
    const 状態 = JSON.parse(生 || '{}')?.state || {};
    const 射手 = (状態.archers || []).find((a) => a && a.substitutions && Object.keys(a.substitutions).length > 0);
    return 射手 ? Object.keys(射手.substitutions).map(Number) : [];
  });
  expect(位置, '2立目が5射目（位置4）としてしまわれていない').toEqual([4]);
});

test('途中交代：射目で選んだときも、その射目にしまわれる', async ({ page }) => {
  await 交代の画面を開く(page);

  await page.getByText('射目', { exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByText('3射目', { exact: true }).click();
  await page.waitForTimeout(600);
  await expect(page.getByText('3射目から交代します'), '案内が出ない').toBeVisible();

  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('交代次郎', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1500);

  const 位置 = await page.evaluate(() => {
    const 状態 = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
    const 射手 = (状態.archers || []).find((a) => a && a.substitutions && Object.keys(a.substitutions).length > 0);
    return 射手 ? Object.keys(射手.substitutions).map(Number) : [];
  });
  expect(位置, '3射目が位置2としてしまわれていない').toEqual([2]);
});

test('途中交代：どこで交代するかを選ぶまでは確定できない', async ({ page }) => {
  await 交代の画面を開く(page);

  await expect(page.getByText('上から交代するところを選んでください'), '選ぶ前の案内が出ない').toBeVisible();

  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('出ない人', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1200);

  // 画面は閉じない（＝書かれていない）
  await expect(page.getByText('途中交代の設定', { exact: true }), '選ばずに確定できてしまう').toBeVisible();
});

test('途中交代：交代相手は学年でまとまり、開け閉めできる', async ({ page }) => {
  // 記録表の人の選択と同じ形にしてある。名前で絞っているあいだは、
  // 閉じていても出す（閉じたままだと「居ない」と見えてしまう）
  await 交代の画面を開く(page);

  const 見えている人数 = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('div')].filter((e) => /^(男子|女子|未設定)$/.test((e.textContent || '').trim()))
          .length
    );

  const 見出し = page.getByText(/^1年生 \(\d+人\)$/);
  await expect(見出し, '学年の見出しが出ていない').toBeVisible();

  const 初め = await 見えている人数();
  expect(初め, '初めから誰も出ていない').toBeGreaterThan(0);

  await 見出し.click();
  await page.waitForTimeout(700);
  const 閉じた = await 見えている人数();
  expect(閉じた, '見出しを押しても閉じない').toBeLessThan(初め);

  await 見出し.click();
  await page.waitForTimeout(700);
  expect(await 見えている人数(), '押し直しても開かない').toBe(初め);

  // 閉じたまま名前で絞ると、隠れずに出てくること
  await 見出し.click();
  await page.waitForTimeout(600);
  const 検索 = page.getByPlaceholder('名前で検索...');
  await 検索.click();
  await 検索.pressSequentially('部員', { delay: 30 });
  await page.waitForTimeout(800);
  expect(await 見えている人数(), '閉じたままだと、絞り込んでも出てこない').toBeGreaterThan(閉じた);
});

test('途中交代：細い画面でも、窓を流せば交代相手にたどり着ける', async ({ page }) => {
  // 立目の一覧と相手の一覧を、それぞれ別に流せる箱にしていたとき、
  // 細い画面では相手の一覧が0pxまで潰れ、部員が1人も見えなかった。
  // いまは窓ごと流す（人の選択と同じ骨組み）
  await page.setViewportSize({ width: 320, height: 568 });
  await 交代の画面を開く(page);

  const 見える人数 = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('div')]
          .filter((e) => e.children.length === 0 && /^(男子|女子|未設定)$/.test((e.textContent || '').trim()))
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
          }).length
    );

  // 交代相手の見出しの上で指をすべらせる
  const 場所 = await page.evaluate(() => {
    const e = [...document.querySelectorAll('div')].find(
      (x) => /交代相手/.test(x.textContent || '') && x.children.length === 0
    );
    const r = e.getBoundingClientRect();
    return { x: Math.round(r.x + 20), y: Math.round(r.y) };
  });
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(場所.x, 場所.y);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(600);

  expect(await 見える人数(), '細い画面だと、流しても交代相手が見えない').toBeGreaterThan(0);
  await expect(page.getByText(/^\d年生 \(\d+人\)$/).first(), '学年の見出しにも届かない').toBeVisible();
});

test('途中交代：入れたあと、人の選択から取り消せる', async ({ page }) => {
  // 解除する口がどこにも無く、履歴にも積んでいないので取り消しでも戻らなかった。
  // 一度間違えるとリセットするしかない状態だった
  await 交代の画面を開く(page);
  await page.getByText('2立目', { exact: true }).click();
  await page.waitForTimeout(600);
  const ゲスト欄 = page.getByPlaceholder('ゲスト名を入力');
  await ゲスト欄.click();
  await ゲスト欄.pressSequentially('取消太郎', { delay: 30 });
  await page.getByText('確定', { exact: true }).click();
  await page.waitForTimeout(1500);

  const 交代の数 = () =>
    page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
      const 射手 = (s.archers || []).find((a) => a && a.substitutions);
      return 射手 ? Object.keys(射手.substitutions).length : 0;
    });
  expect(await 交代の数(), '前提：交代が入っていない').toBe(1);

  // 名前のますから、いま入っている交代が見えて、押すと消える
  await page.getByText('選択', { exact: true }).first().click();
  await page.waitForTimeout(1200);
  const 取り消し = page.getByText(/5射目〜 取消太郎 の交代を取り消す/);
  await expect(取り消し, 'いま誰と代わっているかが出ていない').toBeVisible();
  await 取り消し.click();
  await page.waitForTimeout(1500);

  expect(await 交代の数(), '押しても交代が消えない').toBe(0);
});
