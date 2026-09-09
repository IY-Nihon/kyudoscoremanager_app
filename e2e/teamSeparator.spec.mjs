/**
 * 区切り（間隔）まわりの検査。チーム名の帯と、合計・総計の数え方。
 *
 *   npx playwright test e2e/teamSeparator.spec.mjs
 *
 * ■ なぜこれを入れたか
 *
 * 1) 案内文と実際の側が逆だった。
 *    記録表は右から左へ並ぶ（row-reverse）ので、並びで区切りより後ろの
 *    射手は、画面では区切りの**左**に出る。窓の案内は「区切りから右」と
 *    書いてあり、入れた人は逆の側に色が付いたように見えていた。
 *    どちらか片方だけ直しても気づけないので、ここでは
 *    「案内文に書いてある側」を読み取って、その側に帯が出るかを見る。
 *    文だけ直しても、割り当てだけ変えても落ちる。
 *
 * 2) 合計の列を押したとき、範囲の切り替えだけをして窓を開かない作りに
 *    したことがあり、列を消す道がどこにも無くなった。押したら窓が開くこと、
 *    その中で範囲を変えられること、消す道が在ることを見る。
 *
 * ■ 団体には書き込まない
 * 射手を立てるだけで「終了・保存」はしないので、雲の記録は増えない。
 * 100001 を使う他の検査と並べて流してよい。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  こうなるまで待つ,
  団体で入る,
} from './helpers.mjs';

const 団体 = '100001';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100001.json' });

async function 入る(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);
}

/** 名前の欄がこの数になるまで「人」を押す */
async function 射手を立てる(page, 数) {
  const 人 = page.getByText('人', { exact: true }).first();
  for (let i = 0; i < 数; i++) {
    const いま = await page.locator('[data-testid^="名の欄-射手-"]').count();
    await 人.click();
    await こうなるまで待つ(
      () => page.locator('[data-testid^="名の欄-射手-"]').count(),
      (n) => n > いま,
      20000
    );
  }
}

/**
 * 名前の欄を測る。区切りの中心と、射手それぞれの中心・帯の有無を返す。
 *
 * 帯はチームの色を上辺に引いたもの。座標で当てにいくと機種ごとにずれるので、
 * 目印（testID）で拾って、計算後の見た目から読む。
 */
async function 名の欄を測る(page) {
  return page.evaluate(() => {
    const 出 = { 区切り: null, 射手: [] };
    for (const el of document.querySelectorAll('[data-testid^="名の欄-"]')) {
      const 名 = el.getAttribute('data-testid') || '';
      const r = el.getBoundingClientRect();
      const 中心 = r.x + r.width / 2;
      if (名.startsWith('名の欄-区切り-')) {
        出.区切り = { 中心 };
        continue;
      }
      if (!名.startsWith('名の欄-射手-')) continue;
      const s = getComputedStyle(el);
      const 太さ = parseFloat(s.borderTopWidth) || 0;
      const 色 = s.borderTopColor || '';
      // 透明・幅0は「帯なし」。それ以外が付いていればチームの色
      const 帯 = 太さ >= 1 && !/^rgba\(.*,\s*0\)$/.test(色) && 色 !== 'transparent';
      出.射手.push({ 名, 中心, 帯, 色 });
    }
    return 出;
  });
}

test('チームの帯は、窓の案内が言うとおりの側に出る', async ({ page }) => {
  await 入る(page);

  // 射手2人 → 区切り → 射手2人。並びで後ろの2人が、画面では区切りの逆側に出る
  await 射手を立てる(page, 2);
  await page.getByText('間隔', { exact: true }).first().click();
  await こうなるまで待つ(
    () => page.locator('[data-testid^="名の欄-区切り-"]').count(),
    (n) => n === 1,
    20000
  );
  await 射手を立てる(page, 2);

  // 区切りを押すと窓が開き、そこから「チーム名を付ける」に入れる。
  // 以前は長押しでしか入れられず、押す＝そのまま消すだったので気づけなかった
  await page.locator('[data-testid^="名の欄-区切り-"]').first().click();
  const 名を付ける = page.getByText('チーム名を付ける', { exact: true });
  await expect(名を付ける, '区切りを押しても窓に「チーム名を付ける」が出ない').toBeVisible({
    timeout: 20000,
  });
  await 名を付ける.click();

  const 案内 = page.getByText(/この区切り(より|から)(左|右)の射手が、そのチームになります/);
  await expect(案内, 'チーム名の窓が開かない').toBeVisible({ timeout: 20000 });

  // 案内が「左」と言っているのか「右」と言っているのかを、文から読み取る
  const 文 = await 案内.innerText();
  const 言っている側 = /より左|から左/.test(文) ? '左' : '右';

  // fill は WebKit で入らない（値が空のまま決定される）。実機の打鍵と同じ形にする
  const 名入れ = page.getByPlaceholder('例: ◯◯大学');
  await 名入れ.click();
  // 窓が出きるまで、打った字が落ちる。指が乗るのを待ってから打つ
  //（待たずに打つと、最初の1文字だけ消えて「大学」になることがあった）
  await こうなるまで待つ(
    () => page.evaluate(() => document.activeElement && document.activeElement.tagName),
    (名) => 'INPUT' === 名 || 'TEXTAREA' === 名,
    20000
  );
  await 名入れ.pressSequentially('A大学', { delay: 60 });
  // 入ったことをここで確かめる。入らないまま決定すると、空で消えて
  // 「色が付かない」という遠い場所で落ちる
  await expect(名入れ, 'チーム名が入力欄に入っていない').toHaveValue('A大学', { timeout: 10000 });
  await page.getByText('決定', { exact: true }).click();

  // 区切りに名前が出るまで待つ。ここを待たずに測ると、遅い機種では
  // 窓の操作が終わる前に数えて「色が付いていない」と見える
  await こうなるまで待つ(
    () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-testid^="名の欄-区切り-"]');
        return el ? (el.innerText || '').trim() : '';
      }),
    (字) => 字.includes('A大学'),
    20000
  );

  await こうなるまで待つ(
    async () => (await 名の欄を測る(page)).射手.filter((x) => x.帯).length,
    (n) => n > 0,
    20000
  );

  const 測り = await 名の欄を測る(page);
  expect(測り.区切り, '区切りの欄が見つからない').not.toBeNull();

  const 帯あり = 測り.射手.filter((x) => x.帯);
  const 帯なし = 測り.射手.filter((x) => !x.帯);
  expect(帯あり.length, 'チームに入った射手が2人にならない').toBe(2);
  expect(帯なし.length, 'チームの外の射手が2人にならない').toBe(2);

  for (const x of 帯あり) {
    if (言っている側 === '左') {
      expect(
        x.中心,
        `案内は「${言っている側}」と言っているのに、帯が区切りの右に出ている（${x.名}）`
      ).toBeLessThan(測り.区切り.中心);
    } else {
      expect(
        x.中心,
        `案内は「${言っている側}」と言っているのに、帯が区切りの左に出ている（${x.名}）`
      ).toBeGreaterThan(測り.区切り.中心);
    }
  }
  for (const x of 帯なし) {
    if (言っている側 === '左') {
      expect(x.中心, `チームの外なのに区切りの左にいる（${x.名}）`).toBeGreaterThan(測り.区切り.中心);
    } else {
      expect(x.中心, `チームの外なのに区切りの右にいる（${x.名}）`).toBeLessThan(測り.区切り.中心);
    }
  }
});

test('合計の列は、押すと窓が開き、そこで範囲を変えられて消す道もある', async ({ page }) => {
  await 入る(page);
  await 射手を立てる(page, 2);

  await page.getByText('Σ', { exact: true }).first().click();
  const 合計 = page.locator('[data-testid^="名の欄-合計-"]').first();
  await expect(合計, '合計の列が出ない').toBeVisible({ timeout: 20000 });
  await expect(合計).toContainText('合計');

  // 押したら窓が開く。ここで範囲だけを切り替えていたころは、
  // 窓が開かず列を消せなくなっていた
  await 合計.click();
  const 総計にする = page.getByText('手前の計もまとめた総計にする', { exact: true });
  await expect(総計にする, '合計の列を押しても窓が開かない').toBeVisible({ timeout: 20000 });
  await expect(page.getByText('削除', { exact: true }), '消す道が無い').toBeVisible();

  await 総計にする.click();
  await expect(合計, '総計に切り替わらない').toContainText('総計', { timeout: 20000 });

  // 切り替えたあとも、もう一度開けること（開けないと消せない）
  await 合計.click();
  await expect(
    page.getByText('この立ちだけの合計にする', { exact: true }),
    '切り替えたあとに窓が開かない'
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('削除', { exact: true }), '消す道が無い').toBeVisible();
});

test('立ち順：窓から1つずつ動かせて、端では出ない', async ({ page }) => {
  await 入る(page);
  await 射手を立てる(page, 3);

  /** 名前の欄を、画面の右から左の順で返す */
  const 並び = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-testid^="名の欄-射手-"]')]
        .map((el) => ({ 名: el.getAttribute('data-testid'), x: el.getBoundingClientRect().x }))
        .sort((a, z) => z.x - a.x)
        .map((v) => v.名)
    );

  const 前 = await 並び();
  expect(前.length, '射手が3人立たない').toBe(3);

  // いちばん右（大前）の欄を押す。右端なので「右へ動かす」は出ないはず
  const 欄 = page.locator('[data-testid^="名の欄-射手-"]');
  const 位置 = await 欄.evaluateAll((els) => els.map((e, i) => ({ i, x: e.getBoundingClientRect().x })));
  const 右端 = 位置.sort((a, z) => z.x - a.x)[0].i;
  await 欄.nth(右端).click();

  const 左へ = page.getByText('左へ動かす', { exact: true });
  await expect(左へ, '窓に「左へ動かす」が出ない').toBeVisible({ timeout: 20000 });
  await expect(
    page.getByText('右へ動かす', { exact: true }),
    '右端なのに「右へ動かす」が出ている'
  ).toHaveCount(0);

  await 左へ.click();
  await こうなるまで待つ(
    async () => (await 並び())[0],
    (先頭) => 先頭 !== 前[0],
    20000
  );
  const 後 = await 並び();
  expect(後[0], '押した列が1つ左へ動いていない').toBe(前[1]);
  expect(後[1]).toBe(前[0]);
  expect(後[2], '関係のない列まで動いている').toBe(前[2]);

  // 窓は開いたままで、続けて押せる。左端まで来たら出なくなる
  await page.getByText('左へ動かす', { exact: true }).click();
  await こうなるまで待つ(
    () => page.getByText('左へ動かす', { exact: true }).count(),
    (n) => n === 0,
    20000
  );
  const 端 = await 並び();
  expect(端[2], '左端まで動いていない').toBe(前[0]);
});

test('立ち順：横に並べたときは「上へ／下へ」になる', async ({ page }) => {
  // 縦の表は右から左、横の表は上から下。同じ「並びの後ろへ」が縦では左、
  // 横では下になる。字と動く向きが食い違わないことを見る
  await 入る(page);
  await 射手を立てる(page, 3);

  await page.getByTestId('並べ方').click();
  await こうなるまで待つ(
    () => page.getByText('縦へ', { exact: true }).count(),
    (n) => n > 0,
    20000
  );

  /** 名前の欄を、画面の上から下の順で返す（横のときの並び） */
  const 縦の並び = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-testid^="名の欄-射手-"]')]
        .map((el) => ({ 名: el.getAttribute('data-testid'), y: el.getBoundingClientRect().y }))
        .sort((a, z) => a.y - z.y)
        .map((v) => v.名)
    );

  // 横のときの名前の欄は、記録画面の別の作りなので目印が付いていない。
  // 窓は射手の欄から開く（画面のいちばん上の人＝並びの先頭）
  const 欄 = page.locator('[data-testid^="名の欄-射手-"]');
  if ((await 欄.count()) === 0) {
    // 横では目印付きの欄が無い作りなので、ここでは字だけを見る
    await page.getByText('選択', { exact: true }).first().click();
    await expect(
      page.getByText('下へ動かす', { exact: true }),
      '横に並べているのに「下へ動かす」が出ない'
    ).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByText('左へ動かす', { exact: true }),
      '横に並べているのに「左へ動かす」が出ている（縦の言い方）'
    ).toHaveCount(0);
    return;
  }

  const 前 = await 縦の並び();
  await 欄.first().click();
  const 下へ = page.getByText('下へ動かす', { exact: true });
  await expect(下へ, '横なのに「下へ動かす」が出ない').toBeVisible({ timeout: 20000 });
  await expect(
    page.getByText('左へ動かす', { exact: true }),
    '横なのに縦の言い方が残っている'
  ).toHaveCount(0);
  await 下へ.click();
  await こうなるまで待つ(
    async () => (await 縦の並び())[0],
    (先頭) => 先頭 !== 前[0],
    20000
  );
  const 後 = await 縦の並び();
  expect(後[1], '「下へ」で1つ下がっていない').toBe(前[0]);
});

test('立ち順：横に並べても、長押しから指で動かせる', async ({ page }) => {
  // 縦では指の動きを PanResponder が受け取れたが、横（縦の動き）では
  // 受け取れず、掴めるのに動かせなかった。横は指の動きを直に見ている。
  // 目印も横には付いていなかったので、そこも一緒に押さえる
  await 入る(page);
  await 射手を立てる(page, 3);

  await page.getByTestId('並べ方').click();
  await こうなるまで待つ(
    () => page.getByText('縦へ', { exact: true }).count(),
    (n) => n > 0,
    20000
  );

  const 欄 = page.locator('[data-testid^="名の欄-射手-"]');
  await こうなるまで待つ(
    () => 欄.count(),
    (n) => n === 3,
    20000
  );

  /** 名前の欄を、画面の上から下の順で返す */
  const 並び = async () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[data-testid^="名の欄-射手-"]')]
        .map((el) => ({ 名: el.getAttribute('data-testid'), y: el.getBoundingClientRect().y }))
        .sort((a, z) => a.y - z.y)
        .map((v) => v.名)
    );

  const 前 = await 並び();
  const 位置 = await 欄.evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    })
  );
  位置.sort((a, z) => a.cy - z.cy);

  // いちばん上を掴んで、いちばん下まで運ぶ
  await page.mouse.move(位置[0].cx, 位置[0].cy);
  await page.mouse.down();
  await page.waitForTimeout(700);
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(位置[0].cx, 位置[0].cy + ((位置[2].cy - 位置[0].cy) * i) / 6, { steps: 2 });
    await page.waitForTimeout(90);
  }
  await page.mouse.up();

  await こうなるまで待つ(
    async () => (await 並び())[0],
    (先頭) => 先頭 !== 前[0],
    20000
  );
  const 後 = await 並び();
  expect(後[2], '掴んだ列がいちばん下へ移っていない').toBe(前[0]);
});

test('チーム：縦でも横でも、同じ数の射手に色が付き、区切りに名前が出る', async ({ page }) => {
  // 横の名前の欄は縦とは別の作りなので、縦に足したものが横に入らない。
  // 実際、チームの色が横だけ出ていなかった（2026-09-08）。
  // 片方だけ直したことに気づけるよう、両方を突き合わせる
  await 入る(page);
  await 射手を立てる(page, 2);
  await page.getByText('間隔', { exact: true }).first().click();
  await こうなるまで待つ(
    () => page.locator('[data-testid^="名の欄-区切り-"]').count(),
    (n) => n === 1,
    20000
  );
  await 射手を立てる(page, 2);

  await page.locator('[data-testid^="名の欄-区切り-"]').first().click();
  await page.getByText('チーム名を付ける', { exact: true }).click();
  // fill は WebKit で入らない（値が空のまま決定される）。実機の打鍵と同じ形にする
  const 名入れ = page.getByPlaceholder('例: ◯◯大学');
  await 名入れ.click();
  // 窓が出きるまで、打った字が落ちる。指が乗るのを待ってから打つ
  //（待たずに打つと、最初の1文字だけ消えて「大学」になることがあった）
  await こうなるまで待つ(
    () => page.evaluate(() => document.activeElement && document.activeElement.tagName),
    (名) => 'INPUT' === 名 || 'TEXTAREA' === 名,
    20000
  );
  await 名入れ.pressSequentially('A大学', { delay: 60 });
  // 入ったことをここで確かめる。入らないまま決定すると、空で消えて
  // 「色が付かない」という遠い場所で落ちる
  await expect(名入れ, 'チーム名が入力欄に入っていない').toHaveValue('A大学', { timeout: 10000 });
  await page.getByText('決定', { exact: true }).click();

  // 区切りに名前が出るまで待つ。ここを待たずに測ると、遅い機種では
  // 窓の操作が終わる前に数えて「色が付いていない」と見える
  await こうなるまで待つ(
    () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-testid^="名の欄-区切り-"]');
        return el ? (el.innerText || '').trim() : '';
      }),
    (字) => 字.includes('A大学'),
    20000
  );

  /** 色の帯が付いている射手の数と、区切りに出ている字 */
  const 見え方 = () =>
    page.evaluate(() => {
      const 帯あり = [...document.querySelectorAll('[data-testid^="名の欄-射手-"]')].filter((el) => {
        const st = getComputedStyle(el);
        // 縦は上の辺、横は左の辺に出す。どちらかに色が付いていればよい
        return ['borderTop', 'borderLeft'].some((辺) => {
          const w = parseFloat(st[辺 + 'Width']) || 0;
          const c = st[辺 + 'Color'] || '';
          return w >= 2 && !/rgba\(0, 0, 0, 0\)|transparent/.test(c);
        });
      }).length;
      const 区切り = document.querySelector('[data-testid^="名の欄-区切り-"]');
      return { 帯あり, 区切りの字: 区切り ? (区切り.innerText || '').trim() : '' };
    });

  await こうなるまで待つ(
    async () => (await 見え方()).帯あり,
    (n) => n > 0,
    20000
  );
  const 縦 = await 見え方();
  expect(縦.帯あり, '縦でチームの色が2人に付かない').toBe(2);
  expect(縦.区切りの字, '縦で区切りにチーム名が出ない').toBe('A大学');

  await page.getByTestId('並べ方').click();
  await こうなるまで待つ(
    () => page.getByText('縦へ', { exact: true }).count(),
    (n) => n > 0,
    20000
  );
  await こうなるまで待つ(
    () => page.locator('[data-testid^="名の欄-射手-"]').count(),
    (n) => n === 4,
    20000
  );

  const 横 = await 見え方();
  expect(横.帯あり, '横だけチームの色が付いていない').toBe(縦.帯あり);
  expect(横.区切りの字, '横だけ区切りのチーム名が出ていない').toBe(縦.区切りの字);
});

test('立ち順：表の外で指を離しても、掴みが残らない', async ({ page }) => {
  // 横に並べたときは、指の動きを名前の行が直に受けている。行の外まで
  // 動かして離すと、その行の「離した」が来ないまま掴んだ状態が残り、
  // 押していない指に札が付いてきた（2026-09-09 に踏んだ）。
  // いまは窓ごと「離した」を受けるので、どこで離しても終わる。
  await 入る(page);
  await 射手を立てる(page, 3);

  await page.getByTestId('並べ方').click();
  await こうなるまで待つ(
    () => page.getByText('縦へ', { exact: true }).count(),
    (n) => n > 0,
    20000
  );

  const 欄 = page.locator('[data-testid^="名の欄-射手-"]');
  await こうなるまで待つ(
    () => 欄.count(),
    (n) => n === 3,
    20000
  );
  const 位置 = await 欄.evaluateAll((els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
    })
  );
  位置.sort((a, z) => a.cy - z.cy);

  const 札 = page.getByTestId('運ぶ札');

  // 掴んで少し動かす。ここでは札が出ている
  await page.mouse.move(位置[0].cx, 位置[0].cy);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.move(位置[1].cx, 位置[1].cy, { steps: 6 });
  await expect(札, '掴んで動かしても札が出ない').toBeVisible({ timeout: 20000 });

  // 表のずっと下、名前の行の外で離す
  const 高さ = page.viewportSize().height;
  await page.mouse.move(位置[0].cx, 高さ - 5, { steps: 6 });
  await page.mouse.up();
  await expect(札, '外で離したのに札が残っている').toHaveCount(0, { timeout: 20000 });

  // 押していない指で表の上を通っても、付いてこない
  await page.mouse.move(位置[2].cx, 位置[2].cy, { steps: 5 });
  await page.waitForTimeout(500);
  await expect(札, '離したあとなのに札が付いてくる').toHaveCount(0);
});
