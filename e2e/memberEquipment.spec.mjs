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
function 自分を読む(page) {
  return page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {};
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

test('個人ログインでは、自分の情報と弓具がそのまま出る', async ({ page }) => {
  const 自分 = await 入る(page);

  // まずタブ。ここが出ていなければ、権限をいくら許しても届かない
  const タブ = page.getByText('メンバー', { exact: true }).first();
  await expect(タブ, '個人ログインでメンバーのタブが出ない').toBeVisible({ timeout: 30000 });

  await タブ.click();
  // 一覧ではなく、自分の画面がそのまま開く
  await 画面が変わるまで待つ(page, '自分の情報');
  await expect(
    page.getByText('メンバー管理', { exact: true }),
    '個人ログインなのに一覧の画面が出ている'
  ).toHaveCount(0);

  // 名簿の項目はどれも見るだけ。名前も直せない（団体で管理するもの）
  await expect(page.locator(`input[value="${自分.名}"]`), '名前が直せる欄のまま残っている').toHaveCount(0);
  // 名前は雲から名簿が届いてから出る。3機種を同時に流すと WebKit では
  // 30秒を超えることがあった（実測。単独なら5秒ほど）。既定の5秒では足りない
  await expect(page.getByText(自分.名, { exact: true }).first(), '自分の名前が出ていない').toBeVisible({
    timeout: 60000,
  });
  await expect(
    // 期を使わない団体（設定が届く前も）は「期」が入らない（2026-10-16）
    page.getByText(/^名前・性別・学年(・期)?は団体の担当者が直します$/),
    '直せない旨の断りが出ていない'
  ).toBeVisible();

  // 弓具は窓を開かずに出る。押して開かせる一手間を無くしたのが今回の狙い
  await expect(page.getByText('弓具管理', { exact: true }), '弓具管理が出ない').toBeVisible();
  await expect(page.getByPlaceholder('弓力'), '弓力を入れる欄が、開かずに出ていない').toBeVisible({
    timeout: 20000,
  });
  await expect(
    page.getByText('弓具変更履歴を表示・編集', { exact: true }),
    '個人ログインなのに、窓を開くボタンが残っている'
  ).toHaveCount(0);
  await expect(
    page.getByText('保存する', { exact: true }),
    '変えられる項目が無いのに、保存するが残っている'
  ).toHaveCount(0);
});

test('個人ログインでは、他人も出ず、部員も足せない', async ({ page }) => {
  const 自分 = await 入る(page);

  await page.getByText('メンバー', { exact: true }).first().click();
  await 画面が変わるまで待つ(page, '自分の情報');

  // メンバーを追加するボタンは、団体ログインのときだけ
  await expect(page.getByLabel('メンバーを追加'), '個人ログインなのにメンバーを追加できてしまう').toHaveCount(
    0
  );

  // 名簿そのものには自分以外も届いている（雲から遅れて来るので数で待つ）。
  // それでも画面に出るのは自分だけ、というのがここで見たいこと
  await こうなるまで待つ(
    () =>
      page.evaluate(() => {
        const s =
          JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
            ?.state || {};
        return (s.members || []).length;
      }),
    (n) => n >= 2,
    60000
  );
  const 他人たち = await page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {};
    return (s.members || []).filter((m) => m && m.id !== s.myMemberId).map((m) => m.name);
  });
  expect(他人たち.length, `団体${団体}に自分以外の部員が届かない`).toBeGreaterThan(0);

  for (const 名 of 他人たち) {
    if (!名 || 名 === 自分.名) continue;
    await expect(
      page.getByText(名, { exact: true }),
      `個人ログインなのに他人（${名}）が画面に出ている`
    ).toHaveCount(0);
  }
});

test('個人ログインの画面は、履歴が増えても下まで流せる', async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.__名簿の見張り = 1;
  });
  await 入る(page);
  await page.getByText('メンバー', { exact: true }).first().click();
  await 画面が変わるまで待つ(page, '自分の情報');

  // 窓を挟まない作りにしたぶん、履歴が増えると下へ伸びる。流せないと、増やしたそばから画面の外に出て
  // 届かなくなる（実際そうなった）。
  // 前は団体の履歴が 3 件以上あるのを待っていたが、検証環境の名簿から履歴が消えていて（2026-10-23 に確かめて 0 件）、
  // 待ちは黙って時間切れになっていた。手元では字体が大きく偶然はみ出して通り、GitHub の台（Noto）では収まって落ちた。
  // この束は団体に書き込まないので履歴は足さず、画面を低くして中身がはみ出す形を作る
  // 420 では流れる入れ物そのものが 150px を切る回があり（上の札と下のタブで）、下の探し方から外れた（10/24）
  await page.setViewportSize({ width: 360, height: 560 });
  await page.waitForTimeout(500);

  const 流れ = () =>
    page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(
        (x) =>
          x.scrollHeight > x.clientHeight + 8 &&
          x.clientHeight > 150 &&
          /auto|scroll/.test(getComputedStyle(x).overflowY)
      );
      return el
        ? { 位置: Math.round(el.scrollTop), 幅: Math.round(el.scrollHeight - el.clientHeight) }
        : null;
    });

  const 前 = await 流れ();
  // GitHub の台でだけ落ちる（10/22）。原因を見るため、画面の高さと一番高い入れ物を書き出す
  const 様子 = 前
    ? ''
    : await page.evaluate(() => {
        const 高い = [...document.querySelectorAll('*')]
          .filter((x) => x.clientHeight > 150)
          .sort((a, b) => b.scrollHeight - b.clientHeight - (a.scrollHeight - a.clientHeight))[0];
        return JSON.stringify({
          窓: innerHeight,
          字: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
          字体: getComputedStyle(document.body).fontFamily,
          高い: 高い && {
            中: 高い.scrollHeight,
            見える: 高い.clientHeight,
            流れ: getComputedStyle(高い).overflowY,
          },
        });
      });
  expect(前, '縦に流れる入れ物が無い（下の履歴に届かない）' + 様子).not.toBeNull();
  expect(前.幅, '流せる余地が無い').toBeGreaterThan(0);

  // ホイールは使わない。モバイル WebKit では動かせず、iPhone の検査だけが
  // 落ちる（アプリの話ではなく、動かし方の話）。入れ物を直に動かす
  const 動かす = (量) =>
    page.evaluate((y) => {
      const el = [...document.querySelectorAll('*')].find(
        (x) =>
          x.scrollHeight > x.clientHeight + 8 &&
          x.clientHeight > 150 &&
          /auto|scroll/.test(getComputedStyle(x).overflowY)
      );
      if (el) el.scrollTop = Math.max(0, el.scrollTop + y);
    }, 量);

  await 動かす(1200);
  await こうなるまで待つ(
    async () => (await 流れ()).位置,
    (x) => x > 0,
    20000
  );

  // 上へ戻れば、弓具管理もまた見える
  await 動かす(-2000);
  await こうなるまで待つ(
    async () => (await 流れ()).位置,
    (x) => x === 0,
    20000
  );
  // 落ちたときに、手元の名簿に自分がいるかを書き出す（2026-10-24：自分の情報が「読み込んでいます」に戻る回の調べ）
  const 名簿の様子 = await page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {};
    const 部員 = s.members || [];
    return JSON.stringify({
      数: 部員.length,
      自分: s.myMemberId,
      いる: 部員.some((x) => x && x.id === s.myMemberId),
      役: s.activeRole,
      団体: s.activeGroupId,
      空にした所: (globalThis.__名簿が空になった || []).map((x) =>
        x.split(String.fromCharCode(10)).slice(1, 9).join(' | ')
      ),
    });
  });
  await expect(
    page.getByText('弓具管理', { exact: true }),
    '上に戻っても弓具管理が出ない ' + 名簿の様子
  ).toBeVisible();
});
