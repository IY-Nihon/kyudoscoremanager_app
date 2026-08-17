/**
 * 使い方の案内を、本物のブラウザで最初から最後まで踏む検査。
 *
 *   npm run e2e
 *
 * これまで案内の不具合は、全部手で20回くらい押して目で見つけてきた。
 * 吹き出しが画面の外へ出た／指す先を覆った／押すものが無くて詰んだ／
 * ボタンが小さくて押せない。どれも機械で測れる。
 *
 * 検証環境の合成アカウントで入る（合言葉は seed-stg.mjs と同じ・検証専用）。
 * 事前に検証環境向けの dist/ が要る（npm run build:stg）。
 */
import { test, expect } from '@playwright/test';
// 手順の中身は画面の部品を持たないので、検査からそのまま読める。
// 「目印があると書いてあるのに、枠が出ない」を突き合わせるために使う
import { 手順を作る } from '../src/tutorialSteps.js';

/**
 * 押す。スマホの側では本物のタップ（touchstart/touchend）を送る。
 *
 * click() はタッチ端末の設定でもマウスの出来事を送るだけなので、
 * 「指で触ったら動くか」は確かめられない。案内は指で押してもらう作りなので、
 * ここは分けておく必要がある。
 */
const 指の端末 = ['スマホ', 'iPhone'];

async function 押す(要素) {
  if (指の端末.includes(test.info().project.name)) await 要素.tap();
  else await 要素.click();
}

const 団体 = '100005'; // 部員0人。作りたての団体と同じ道筋を踏める
const 合言葉 = 'StgTest!2026';
const 指の目安 = 44; // iOS の指針。Android は 48

/**
 * 案内が出ているか。出ていれば「3 / 21」の文字を返す。
 *
 * 手順の切り替わりでは、指す先を測り終わるまで案内をわざと出さない
 * （出すと中央に描かれてから飛ぶため）。その空白を「終わった」と
 * 取り違えないよう、しばらく待ってから無いと判断する。
 */
async function いまの手順(page, { 待つ = 4000 } = {}) {
  // 案内の番号は「21 / 28」と空白入り。分析の見本に出る的中「21/28」と
  // 紛れるので、空白まで含めて見分ける
  const 札 = page.locator('text=/^\\d+ \\/ \\d+$/').first();
  try {
    await 札.waitFor({ state: 'visible', timeout: 待つ });
  } catch {
    return null;
  }
  return (await 札.textContent()).trim();
}

/** いまの手順の見出し。失敗したときにどの手順か分かるように */
async function 手順の題(page) {
  return page.evaluate(() => {
    const 札 = [...document.querySelectorAll('div')].find(
      (e) => e.children.length === 0 && /^\d+ \/ \d+$/.test((e.textContent || '').trim())
    );
    if (!札) return '';
    const 親 = 札.parentElement && 札.parentElement.parentElement;
    if (!親) return '';
    const 太字 = [...親.querySelectorAll('div')].find(
      (e) => e.children.length === 0 && parseFloat(getComputedStyle(e).fontSize) >= 16
    );
    return 太字 ? (太字.textContent || '').trim() : '';
  });
}

/** 吹き出しの箱。手順の番号札から親をたどって見つける */
async function 吹き出しの枠(page) {
  return page.evaluate(() => {
    const 札 = [...document.querySelectorAll('div')].find(
      (e) => e.children.length === 0 && /^\d+ \/ \d+$/.test((e.textContent || '').trim())
    );
    if (!札) return null;
    // 影だけを目印にすると、見本の画面に並ぶカードを掴んでしまう。
    // 番号札から上へたどり、「スキップ」を含む位置指定の箱を吹き出しとみなす。
    // 見つからなければ、番号札を含む一番内側の影付きの箱で代用する
    let 控え = null;
    let n = 札;
    for (let i = 0; i < 14 && n.parentElement; i++) {
      n = n.parentElement;
      const s = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // 画面いっぱいのものは幕であって吹き出しではない
      const 幕らしい = r.width >= window.innerWidth - 2 && r.height >= window.innerHeight - 2;
      if (幕らしい) break;
      if ((n.textContent || '').includes('スキップ') && s.position === 'absolute') {
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }
      if (!控え && s.boxShadow && s.boxShadow !== 'none') {
        控え = { x: r.x, y: r.y, w: r.width, h: r.height };
      }
    }
    return 控え;
  });
}

/** 青い枠（指す先）の位置。無ければ null */
async function 指す先の枠(page) {
  return page.evaluate(() => {
    const 枠 = [...document.querySelectorAll('div')].find((e) => {
      const s = getComputedStyle(e);
      return (
        s.position === 'absolute' &&
        s.borderStyle === 'solid' &&
        parseFloat(s.borderTopWidth) >= 2 &&
        /rgb\(0,\s*122,\s*255\)/.test(s.borderTopColor)
      );
    });
    if (!枠) return null;
    const r = 枠.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
}

/** 失敗したときに、案内に見えている短い文字を並べる（原因を追うため） */
async function 案内の文字(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('div,span')]
      .filter((e) => e.children.length === 0)
      .map((e) => (e.textContent || '').trim())
      .filter((t) => t && t.length <= 8)
      .slice(0, 20)
  );
}

/** 案内の押せるところを測る */
async function 押せるところ(page) {
  return page.evaluate(() => {
    const 名 = ['スキップ', '次へ', 'とばす', '戻る', 'あとで', '続きを見る', '始める'];
    const 出 = [];
    for (const e of document.querySelectorAll('div,span')) {
      if (e.children.length) continue;
      const t = (e.textContent || '').trim();
      if (!名.includes(t)) continue;
      const 的 = e.closest('[role="button"]') || e.parentElement;
      const r = 的.getBoundingClientRect();
      if (r.width === 0) continue;
      出.push({ 文字: t, 幅: Math.round(r.width), 高さ: Math.round(r.height) });
    }
    return 出;
  });
}

/**
 * 指す先のうち、吹き出しに覆われずに残っている割合。
 *
 * 「重なりゼロ」にはできない。記録表そのものを指す手順では、指す先が画面より
 * 高く、吹き出しをどこに置いても必ず一部に重なる。
 * 大事なのは押せるぶんが残っているかなので、残った割合で見る。
 */
function 残っている割合(先, 箱) {
  if (!先 || !箱) return 1;
  const 横 = Math.max(0, Math.min(先.x + 先.w, 箱.x + 箱.w) - Math.max(先.x, 箱.x));
  const 縦 = Math.max(0, Math.min(先.y + 先.h, 箱.y + 箱.h) - Math.max(先.y, 箱.y));
  const 面積 = 先.w * 先.h;
  if (面積 <= 0) return 0;
  return 1 - (横 * 縦) / 面積;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // 描き終わる前に打ち込むと、欄には入るのに React 側へ届かず、空のまま
  // 送ることになる（Safari で顕著）。落ち着いてから触る
  await page.waitForTimeout(3000);

  // すでに入っていれば、そのまま。入っていなければ団体でログインする
  const 団体ID欄 = page.getByPlaceholder('例: 123456');
  if (await 団体ID欄.isVisible().catch(() => false)) {
    // Safari(WebKit) では fill() だけだと React 側に伝わらないことがある。
    // 触ってから一文字ずつ打ち、入ったことを確かめてから送る
    await 団体ID欄.click();
    await 団体ID欄.pressSequentially(団体, { delay: 20 });
    const 合言葉欄 = page.locator('input[type="password"]').first();
    await 合言葉欄.click();
    await 合言葉欄.pressSequentially(合言葉, { delay: 20 });
    await expect(団体ID欄).toHaveValue(団体);
    await expect(合言葉欄).toHaveValue(合言葉);
    await 押す(page.getByText('ログイン', { exact: true }));
    // ログインの直後に読み直すと、Safari(WebKit) では認証の保存が間に合わず、
    // ログアウトした状態で開いてしまう。書き終わるまで待つ
    await page.waitForTimeout(9000);
  }

  // 初めて使う人と同じ状態にしてから開き直す
  await page.evaluate(() => {
    localStorage.removeItem('tutorialDoneVersion');
    localStorage.removeItem('tutorialBoardSnapshot');
  });
  await page.reload();
  await expect(page.locator('text=ようこそ')).toBeVisible({ timeout: 30_000 });
});

test('案内：最後まで踏んでも、行き止まりも画面外もはみ出しも無い', async ({ page }) => {
  const 通った = [];

  // 「3 / 28」の番号から、その手順の台本を引く。
  // 部員0人の団体で踏むので、その前提で作った並びと突き合わせる
  const { 基本, 続き } = 手順を作る('group', { 部員数: 0, 記録数: 0 });
  const 分かれ道 = { 題: 'ここまでが基本の流れです' };
  const 台本たち = { 基本の並び: [...基本, 分かれ道], 続きの並び: [...基本, ...続き] };
  const 手順の台本 = (札) => {
    const [番号, 総数] = 札.split('/').map((x) => Number(x.trim()));
    const 並び =
      総数 === 台本たち.基本の並び.length
        ? 台本たち.基本の並び
        : 総数 === 台本たち.続きの並び.length
          ? 台本たち.続きの並び
          : null;
    return 並び ? 並び[番号 - 1] : null;
  };

  for (let i = 0; i < 60; i++) {
    const 札 = await いまの手順(page);
    if (!札) break; // 終わった
    通った.push(札);

    const 画面 = page.viewportSize();
    const 箱 = await 吹き出しの枠(page);
    expect(箱, `${札}：吹き出しが見つからない`).not.toBeNull();

    // 1. 画面の外へ出ていないこと（矢所の手順で起きた不具合）
    expect(箱.y, `${札}：吹き出しが画面の上に出ている`).toBeGreaterThanOrEqual(-1);
    expect(
      箱.y + 箱.h,
      `${札}「${await 手順の題(page)}」：吹き出しが画面の下に出ている` +
        `（吹き出し y=${Math.round(箱.y)} 高さ=${Math.round(箱.h)} / 画面 ${画面.height}）`
    ).toBeLessThanOrEqual(画面.height + 1);
    expect(箱.x, `${札}：吹き出しが画面の左に出ている`).toBeGreaterThanOrEqual(-1);
    expect(箱.x + 箱.w, `${札}：吹き出しが画面の右に出ている`).toBeLessThanOrEqual(画面.width + 1);

    // 2. 押してもらう手順では、押せるぶんが残っていること
    const 触ってもらう = await page
      .getByText('してみましょう', { exact: false })
      .first()
      .isVisible()
      .catch(() => false);
    // 「覆わない」を立てた手順も同じ。押してもらうわけではないが、指す先を
    // 見てもらう手順なので、覆うと何の話か分からなくなる（記録表の鍵の説明が
    // 記録表ごと隠れていた）
    const 覆えない = 触ってもらう || !!(手順の台本(札) || {}).覆わない;
    if (覆えない) {
      const 先 = await 指す先の枠(page);
      if (先) {
        const 残り = 残っている割合(先, 箱);
        expect(
          残り,
          `${札}：吹き出しが見せたい場所をほとんど覆っている（残り ${Math.round(残り * 100)}%）`
        ).toBeGreaterThan(0.4);
      }
    }

    // 3. 目印があると書いてある手順では、指す枠が実際に出ていること。
    //    矢所の手順で「案内は？」となったのは、画面側の登録漏れだった
    const 台本 = 手順の台本(札);
    if (台本 && 台本.目印 && !台本.見本) {
      const 先 = await 指す先の枠(page);
      expect(先, `${札}「${台本.題}」：目印(${台本.目印})を指す枠が出ていない`).not.toBeNull();
    }

    // 4. 指で押せる大きさがあること
    for (const b of await 押せるところ(page)) {
      expect(b.高さ, `${札}：「${b.文字}」が低すぎる（${b.幅}×${b.高さ}）`).toBeGreaterThanOrEqual(指の目安);
    }

    // 5. 先へ進む道があること（無ければ行き止まり）
    const 進む手 = ['とばす', '次へ', '続きを見る', '始める'];
    let 進めた = false;
    // 位置が決まった直後は、まだ描き終わっていないことがある。二度試す
    for (let 回 = 0; 回 < 2 && !進めた; 回++) {
      for (const 文字 of 進む手) {
        const b = page.getByText(文字, { exact: true }).first();
        if (await b.isVisible().catch(() => false)) {
          await 押す(b).catch(() => {});
          進めた = true;
          break;
        }
      }
      if (!進めた) await page.waitForTimeout(800);
    }
    expect(
      進めた,
      `${札}「${await 手順の題(page)}」：先へ進む道が無い（行き止まり）。` +
        `見えている案内の文字: ${JSON.stringify(await 案内の文字(page))}`
    ).toBe(true);
    await page.waitForTimeout(700);
  }

  // 途中で止まらず、最後まで行ったこと
  expect(通った.length, '案内が途中で止まっている').toBeGreaterThan(5);
  expect(await いまの手順(page), '最後まで行っても案内が消えない').toBeNull();
});

test('案内：終わると記録表が元に戻り、控えも残らない', async ({ page }) => {
  const 前 = await page.evaluate(() => {
    const o = JSON.parse(localStorage.getItem('archery-score-storage') || '{}');
    return ((o.state || o).archers || []).length;
  });

  // 最後まで飛ばす
  for (let i = 0; i < 60; i++) {
    if (!(await いまの手順(page))) break;
    const b = page.getByText('スキップ', { exact: true }).first();
    if (await b.isVisible().catch(() => false)) {
      await 押す(b);
      break;
    }
  }
  await page.waitForTimeout(1000);

  const 後 = await page.evaluate(() => {
    const o = JSON.parse(localStorage.getItem('archery-score-storage') || '{}');
    return {
      列: ((o.state || o).archers || []).length,
      控え: localStorage.getItem('tutorialBoardSnapshot'),
    };
  });
  expect(後.列, '案内で足した列が記録表に残っている').toBe(前);
  expect(後.控え, '控えが片付いていない').toBeNull();
});

test('案内：指のタップで進む（スマホの側だけ）', async ({ page }) => {
  test.skip(!指の端末.includes(test.info().project.name), 'タッチのある側だけで見る');

  // 触った種類を記録する。RN Web はタッチの出来事を拾って反応する作りなので、
  // ここがマウスのままだと「指で押したら動くか」を確かめたことにならない
  await page.evaluate(() => {
    window.__触った = [];
    for (const 名 of ['touchstart', 'touchend', 'mousedown']) {
      document.addEventListener(名, () => window.__触った.push(名), true);
    }
  });

  const 前 = await いまの手順(page);
  await 押す(page.getByText('次へ', { exact: true }).first());
  await page.waitForTimeout(1500);

  const 触った = await page.evaluate(() => window.__触った);
  expect(触った, 'タッチの出来事が送られていない').toContain('touchstart');
  expect(触った, 'タッチの出来事が送られていない').toContain('touchend');

  const 後 = await いまの手順(page);
  expect(後, `指のタップで進めなかった（${前} のまま）`).not.toBe(前);
});

// 案内を終えた（またはスキップした）人には、次に開いたときお知らせを出す。
// お知らせ側のコメントにも「使い方の案内を終えた人から変更点をお知らせする」
// と書いてあるが、実装は案内が未了のときに「見た」印を永久に付けていたため、
// 案内を終えても二度と出なかった
test('お知らせ：案内をスキップして開き直すと出る', async ({ page }) => {
  test.setTimeout(120000);

  // 配信を受け取ったばかりの人と同じ状態にする（お知らせは未読）
  await page.evaluate(() => {
    localStorage.removeItem('whatsNewDismissedVersion');
    localStorage.removeItem('tutorialDoneVersion');
  });
  await page.reload();
  await expect(page.locator('text=ようこそ')).toBeVisible({ timeout: 30_000 });

  // このとき、お知らせはまだ出さない（案内と二重になるため）
  expect(
    await page.getByText('お知らせ', { exact: true }).first().isVisible().catch(() => false),
    '案内の最中にお知らせまで出ている'
  ).toBe(false);

  await 押す(page.getByText('スキップ', { exact: true }).first());
  await page.waitForTimeout(1500);
  const 案内済み = await page.evaluate(() => localStorage.getItem('tutorialDoneVersion'));
  expect(案内済み, '前提：スキップで案内が終わったことになっていない').toBeTruthy();

  await page.reload();
  await page.waitForTimeout(5000);
  await expect(
    page.getByText('お知らせ', { exact: true }).first(),
    '案内を終えたのに、開き直してもお知らせが出ない'
  ).toBeVisible({ timeout: 20_000 });
});
