// 板の○×を端末（ブラウザの canvas）で読む道が、本物の写真で通るかを確かめる。
// Node の試験（test/ocrYomu.test.js）は sharp で画を読むので、canvas で読んだときに
// 同じ数字になるかはここでしか分からない。
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { 案内を止める } from './helpers.mjs';

test('写真1枚まるごとを canvas で読むと、320射のうち316以上が記録と合う', async ({ page }) => {
  test.setTimeout(240_000);
  await 案内を止める(page);
  await page.goto('/');
  await page.waitForFunction(() => window.端末の読み取り != null, null, { timeout: 60_000 });

  const base64 = fs.readFileSync('docs/ocr-samples/PXL_20260906_081921509.jpg').toString('base64');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = await import('../src/ocrCells.js');
  const { 大前から並べる } = await import('../src/ocr/yomu.js');

  const 板たち = await page.evaluate(
    ([b64]) => window.端末の読み取り.板の印を読む(b64, [8, 8], 10),
    [base64]
  );
  expect(板たち.length).toBe(2);
  let 合 = 0;
  let 番 = 0;
  板たち.forEach((板, i) => {
    for (const 列 of 大前から並べる(板.列たち, '左右から', i, 板たち.length)) {
      const 印 = マスを開く(一射目からの順にする(列, '下から'), '2射');
      const 真 = [...射手たち[番++].印];
      for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
    }
  });
  // 3つのブラウザとも 318（残る2射は途中交代の段）。
  // 合計の列を射手の列と取り違えたときは 295 まで落ちたので、316 なら格子は合っている
  expect(合, `合ったのは ${合}/320`).toBeGreaterThanOrEqual(316);
});

test('紙の写真をページ全体から canvas で読むと、80射のうち79以上が記録と合う', async ({ page }) => {
  test.setTimeout(240_000);
  await 案内を止める(page);
  await page.goto('/');
  await page.waitForFunction(() => window.端末の読み取り != null, null, { timeout: 60_000 });

  const base64 = fs.readFileSync('docs/ocr-samples/1788683956272.jpg').toString('base64');
  const { 紙の射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = await import('../src/ocrCells.js');
  const { 大前から並べる } = await import('../src/ocr/yomu.js');

  const 紙 = await page.evaluate(([b64]) => window.端末の読み取り.紙の印を読む(b64, 4, 5, 4), [base64]);
  let 合 = 0;
  大前から並べる(紙.列たち, '右から', 0, 1).forEach((列, i) => {
    const 印 = マスを開く(一射目からの順にする(列, '下から'), '1射');
    const 真 = [...紙の射手たち[i].印];
    expect(印.length).toBe(真.length);
    for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
  });
  expect(合, `合ったのは ${合}/80`).toBeGreaterThanOrEqual(79);
});

// ── 確認画面まで通す ─────────────────────────────────────────
// Gemini の返事は差し替える（名前と並びだけ返し、マスは空）。○×は端末が読む。
// 途中交代の段（射手10の4段目、確からしさ 0.42）が「迷ったマス」として色付きで出て、
// タップすると色が消えることを見る
import { 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';

test.describe('確認画面', () => {
  test.use({ storageState: 'e2e/.auth/100007.json' });

  /** Gemini の返事を差し替えて、板の写真を解析し、確認画面まで進める */
  async function 確認画面まで(page, 行を直す, 箱の返事) {
    const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
    // Gemini の返事（名前は本番の記録の番号。マスは全部空）
    const 返事 = {
      teams: [0, 1].map((i) => ({
        name: '', cellStyle: '2射', tachiPeople: 4,
        // roster は null（名簿に無い＝ゲスト）。無いと古い文字比較が「11」を部員1に寄せて要選択になり、反映できない
        rows: 射手たち.slice(i * 8, i * 8 + 8).map((s) => ({ name: s.名, roster: null, cells: Array(10).fill('') })),
      })),
    };
    if (行を直す) 行を直す(返事);
    await page.route(/generativelanguage\.googleapis\.com|workers\.dev\/v1beta\//, (route) => {
      // 箱を聞く2度目の呼び出し（指示文に box_2d がある）には、箱の返事を返す
      const 箱を聞いている = 箱の返事 && /box_2d/.test(route.request().postData() || '');
      const 中身 = 箱を聞いている ? 箱の返事 : 返事;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(中身) }] }, finishReason: 'STOP' }] }),
      });
    });

    await 案内を止める(page);
    await page.goto('/');
    await 画面が出るまで待つ(page);
    await 入り口が決まるまで待つ(page);
    await 団体で入る(page, '100007', 'StgTest!2026');
    await page.waitForFunction(() => window.端末の読み取り != null, null, { timeout: 60_000 });

    await page.getByText('画像', { exact: true }).first().click();
    await page.getByText('紙の記録', { exact: true }).click();
    await page.getByText('板が2つ（外側が大前）', { exact: true }).click();
    const 選ぶ = page.waitForEvent('filechooser');
    await page.getByText('画像を選択', { exact: true }).click();
    await (await 選ぶ).setFiles('docs/ocr-samples/PXL_20260906_081921509.jpg');
    await expect(page.getByText('1枚目', { exact: true })).toBeVisible();
    await page.getByText('この画像で解析する', { exact: true }).click();
  }

  test('改善のため、読み取りの直後に写真と最初の結果を、反映したら直したあとを送る', async ({ page }) => {
    test.setTimeout(300_000);
    // 中継の /hozon を横取りして中身を見る（本物の置き場には送らない）
    const 送った = [];
    await page.route(/workers\.dev\/hozon/, async (route) => {
      const r = route.request();
      if (r.method() === 'OPTIONS')
        return route.fulfill({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'POST, PUT, OPTIONS',
            'access-control-allow-headers': 'Authorization, Content-Type',
          },
        });
      送った.push({
        道: new URL(r.url()).pathname,
        方法: r.method(),
        型: r.headers()['content-type'] || '',
        体: r.method() === 'POST' ? r.postDataJSON() : null,
        大きさ: (r.postDataBuffer() || Buffer.alloc(0)).length,
      });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: '{"ok":true}',
      });
    });
    // 送った写真の大きさは画面の中で控える（WebKit では Playwright が Blob の本文を拾えず 0 になる）
    await page.addInitScript(() => {
      const 元 = window.fetch;
      window.__送った写真 = [];
      window.fetch = (道, init) => {
        if (String(道).includes('/hozon/photo/') && init && init.body && typeof init.body.size === 'number')
          window.__送った写真.push({ 大きさ: init.body.size, 型: init.body.type });
        return 元(道, init);
      };
    });
    await 確認画面まで(page);
    await expect(page.getByTestId('ocr-yomitori-tanmatsu')).toBeAttached({ timeout: 120_000 });
    await expect
      .poll(() => 送った.filter((x) => x.方法 === 'PUT').length, { timeout: 60_000, message: '写真を送っていない' })
      .toBeGreaterThan(0);
    const 読み = 送った.find((x) => x.方法 === 'POST' && x.体 && x.体.中身 && x.体.中身.段階 === '読み取り');
    expect(読み, '読み取りの記録を送っていない').toBeTruthy();
    expect(読み.体.種類).toBe('写真読み取り');
    expect(読み.体.中身.結果).toBe('読んだ');
    expect(読み.体.中身.最初.length, '最初の結果が空').toBeGreaterThan(0);
    expect(読み.体.中身.団体).toBe('100007');
    const 写真 = 送った.find((x) => x.方法 === 'PUT');
    expect(写真.道).toBe(`/hozon/photo/${読み.体.id}/0`);
    expect(写真.型).toBe('image/jpeg');
    const 作った写真 = (await page.evaluate(() => window.__送った写真))[0];
    expect(作った写真 && 作った写真.型).toBe('image/jpeg');
    expect(作った写真.大きさ, `写真が小さすぎる（縮め方がおかしい）: ${作った写真.大きさ} バイト`).toBeGreaterThan(20_000);
    expect(作った写真.大きさ, '写真を縮めていない').toBeLessThan(5 * 1024 * 1024);

    await page.getByText('記録表に反映する', { exact: true }).click();
    await expect
      .poll(() => 送った.some((x) => x.体 && x.体.中身 && x.体.中身.段階 === '反映'), { timeout: 30_000 })
      .toBe(true);
    const 反映 = 送った.find((x) => x.体 && x.体.中身 && x.体.中身.段階 === '反映');
    expect(反映.体.中身.元の読み取り, '反映の記録が読み取りの記録を指していない').toBe(読み.体.id);
    expect(反映.体.中身.直したあと.length).toBeGreaterThan(0);
  });

  test('「もしかして」の名前が残っていると、反映を押したときにその旨が窓で出る', async ({ page }) => {
    test.setTimeout(300_000);
    // 2人目を、Gemini が名簿の「部員1」に寄せたが読めた字は違う体（要選択になる）
    await 確認画面まで(page, (返事) => {
      返事.teams[0].rows[1].roster = '部員1';
    });
    // 端末で読めた印（画面には出ない）
    await expect(page.getByTestId('ocr-yomitori-tanmatsu')).toBeAttached({ timeout: 120_000 });
    await expect(page.getByText('(要選択)', { exact: false }).first()).toBeVisible();
    // React Native の Alert はブラウザで何も出ず、押しても何も起きないように見えた（実際に踏んだ）
    await page.getByText('記録表に反映する', { exact: true }).click();
    await expect(page.getByText('候補が複数ある名前が残っています', { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test('端末で読んだ○×が確認画面に出て、迷ったマスに色が付く', async ({ page }) => {
    test.setTimeout(300_000);
    await 確認画面まで(page);

    // 端末で読めた印（画面には出ない）
    await expect(page.getByTestId('ocr-yomitori-tanmatsu')).toBeAttached({ timeout: 120_000 });
    // 射数は写真に合わせる（団体の設定は8射、板は20射）
    await expect(page.getByText('射数を8射から20射に合わせます', { exact: false })).toBeVisible();
    await expect(page.getByText('読み取りが迷ったマス', { exact: true })).toBeVisible();
    // 迷ったマスには途中交代の段（2射）が入る。canvas の復号はブラウザで少し違い、
    // 際どいマスがほかに数個入ることがある（Chromium で3マス）。多すぎなければよい
    const 迷い = page.getByTestId('ocr-mayoi-cell');
    const 数 = await 迷い.count();
    expect(数, `迷ったマスが ${数}射`).toBeGreaterThanOrEqual(2);
    expect(数, `迷ったマスが ${数}射（多すぎる）`).toBeLessThanOrEqual(12);
    if (process.env.PW_SHOT) {
      await 迷い.first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: process.env.PW_SHOT });
    }
    // タップして直すと、そのマスの色は消える
    await 迷い.first().click();
    await expect(迷い).toHaveCount(数 - 1);

    // 反映すると、記録表の射数が写真に合わせて 8 → 20 に広がり、16人が後ろに足される。
    // 手元の盤面が変わるだけで、クラウドには書かない（終了・保存は押さない）
    await expect(page.getByText('8射', { exact: true })).toBeVisible();
    await page.getByText('記録表に反映する', { exact: true }).click();
    await expect(page.getByText('20射', { exact: true })).toBeVisible({ timeout: 15_000 });
    const 盤面 = await page.evaluate(() => {
      const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}').state || {};
      return { shotsPerRound: s.shotsPerRound, 人数: (s.archers || []).filter((a) => a && !a.isSeparator && !a.isTotalCalculator).length };
    });
    expect(盤面.shotsPerRound).toBe(20);
    expect(盤面.人数, '16人が足されていない').toBe(16);
    await expect(page.getByText('画像から記録を読み取りました')).toBeVisible({ timeout: 15_000 });
  });

  test('Gemini が板を割りすぎても、記録表は板2枚に組み直される', async ({ page }) => {
    test.setTimeout(300_000);
    // 右の板を「5人・2人・1人」の3つに割って 4 teams で返してきた体
    //（2026-09-13 の板で本番に出た。そのまま通すと区切りと計が余計に入る）
    await 確認画面まで(page, (返事) => {
      // 左の板の 4 人は名簿の部員に寄せる（部員でも区切りと計が入ること。前は名簿の人に板の番号を
      // 付けておらず、全員が部員だと区切りも計も入らなかった）
      返事.teams[0].rows.slice(0, 4).forEach((r, i) => { r.name = `部員${i + 1}`; r.roster = `部員${i + 1}`; });
      const 右 = 返事.teams[1].rows;
      返事.teams = [
        返事.teams[0],
        { ...返事.teams[1], rows: 右.slice(0, 5) },
        { ...返事.teams[1], tachiPeople: 2, rows: 右.slice(5, 7) },
        { ...返事.teams[1], tachiPeople: 1, rows: 右.slice(7, 8) },
      ];
    });
    // 端末で読めた印（画面には出ない）
    await expect(page.getByTestId('ocr-yomitori-tanmatsu')).toBeAttached({ timeout: 120_000 });
    await page.getByText('記録表に反映する', { exact: true }).click();
    await expect(page.getByText('20射', { exact: true })).toBeVisible({ timeout: 15_000 });
    const 並び = await 並びを読む(page);
    // 板2枚 × 8人、どちらも名前の無い板（自校）。立（4人）ごとに計、板の間に区切りは
    // 入れず、端に総計（使う人が手で作る形。2026-09-15 の期待図）
    expect(並び.join(' '), '区切りと計の入り方が違う').toBe(
      '人 人 人 人 計 人 人 人 人 計 人 人 人 人 計 人 人 人 人 計 総計'
    );
  });

  /** 記録表の並びを、人・計・総計・|名前 の字に直して返す */
  async function 並びを読む(page) {
    return page.evaluate(() => {
      const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}').state || {};
      return (s.archers || []).map((a) =>
        a.isSeparator ? '|' + (a.teamName || '') : a.isTotalCalculator ? (a.またぐ合計 ? '総計' : '計') : '人'
      );
    });
  }

  test('チーム名が読めた板は、先頭に名前付きの区切り、立ごとに計、端に総計で組む', async ({ page }) => {
    test.setTimeout(300_000);
    // 左の板は A大学、右の板は B大学（それぞれ 8 人＝2 立）
    await 確認画面まで(page, (返事) => {
      返事.teams[0].name = 'A大学';
      返事.teams[1].name = 'B大学';
    });
    await expect(page.getByTestId('ocr-yomitori-tanmatsu')).toBeAttached({ timeout: 120_000 });
    await page.getByText('記録表に反映する', { exact: true }).click();
    await expect(page.getByText('20射', { exact: true })).toBeVisible({ timeout: 15_000 });
    const 並び = await 並びを読む(page);
    // 板の順は写真と逆（右の板が並びの先＝画面の右）。チームの先頭に名前付きの区切り、
    // 区切りより左（並びでは後ろ）の射手がそのチームの色になる
    expect(並び.join(' '), 'チームごとの組み方が違う').toBe(
      '|B大学 人 人 人 人 計 人 人 人 人 計 総計 |A大学 人 人 人 人 計 人 人 人 人 計 総計'
    );
    // 総計は手前の計をまとめて数える（区切りで止まる）。B大学の 8 人ぶんが入っていること
    const 総計 = await page.evaluate(() => {
      const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}').state || {};
      const 並び = s.archers || [];
      const i = 並び.findIndex((a) => a.isTotalCalculator && a.またぐ合計);
      let 人 = 0, 的中 = 0;
      for (let k = i - 1; k >= 0 && !並び[k].isSeparator; k--) if (!並び[k].isTotalCalculator) { 人++; 的中 += (並び[k].marks || []).filter((m) => m === '○').length; }
      return { 人, 的中 };
    });
    expect(総計.人).toBe(8);
    expect(総計.的中).toBeGreaterThan(0);
  });

  test('Gemini が段を数え違えたら、箱（○×の範囲）を聞いて端末で読み直す', async ({ page }) => {
    test.setTimeout(300_000);
    // 10 段の板を 5 段と答えてきた体（印が 10 段並ぶ相手校の板で実際に起きた）。
    // 5 段で当てはめると 1 行が 2 段ぶんになり、端末は「段の数が少なすぎる」と断る。
    // そこで箱を聞き、帯の数×帯の中の印の数（5×2）で 10 段として読み直す
    await 確認画面まで(
      page,
      (返事) => {
        for (const t of 返事.teams) for (const r of t.rows) r.cells = Array(5).fill('');
      },
      // 9/6 の板の、かたまりの格子から作った箱（[上, 左, 下, 右]、0〜1000）
      { boards: [{ box_2d: [335, 67, 621, 387], people: 8, bands: 5, marks_per_band: 2 }, { box_2d: [335, 648, 636, 964], people: 8, bands: 5, marks_per_band: 2 }] }
    );
    // 端末で読めた印（画面には出ない）
    await expect(page.getByTestId('ocr-yomitori-tanmatsu')).toBeAttached({ timeout: 120_000 });
    // 5 段（10射）ではなく 10 段（20射）で読めていること
    await expect(page.getByText('射数を8射から20射に合わせます', { exact: false })).toBeVisible();
    await page.getByText('記録表に反映する', { exact: true }).click();
    await expect(page.getByText('20射', { exact: true })).toBeVisible({ timeout: 15_000 });
    // 箱の等分で読んだ○×が、記録と 8 割以上合うこと（かたまりの格子ほどは合わないが、
    // Gemini の○×（丸に線の向きは 25%）より確かに良い）
    const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
    const 読み = await page.evaluate(() => {
      const s = JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}').state || {};
      return (s.archers || []).filter((a) => a && !a.isSeparator && !a.isTotalCalculator).map((a) => ({ name: a.name, marks: a.marks }));
    });
    expect(読み.length).toBe(16);
    // 記録表の板の順は写真と逆（右の板が先）なので、名前で突き合わせる
    let 合 = 0;
    for (const { name, marks } of 読み) {
      const 人 = 射手たち.find((s) => s.名 === name);
      expect(人, `${name} が記録に無い`).toBeTruthy();
      const 真 = [...人.印];
      for (let k = 0; k < 真.length; k++) if (marks[k] === 真[k]) 合++;
    }
    expect(合, `合ったのは ${合}/320`).toBeGreaterThanOrEqual(256);
  });
});
