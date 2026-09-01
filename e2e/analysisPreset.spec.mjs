/**
 * 比較のひな型と、不具合の便りの検査。
 *
 *   npx playwright test e2e/analysisPreset.spec.mjs
 *
 * どちらも端末の中だけで完結する仕組みなので、団体の中身には何も書かない。
 * （団体には書き込まない：他の検査と同じ団体を使ってよい印）
 * ひな型は localStorage に持ち、便りは送れないあいだ localStorage に貯まる。
 *
 * 便りのほうは「電波が無いときに消えないこと」がいちばん大事なので、
 * わざと回線を切って、貯まることと、直前の操作が付いていることを見る。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
} from './helpers.mjs';
import fs from 'node:fs';

const お知らせの版 = (fs.readFileSync('src/JP_WhatsNewModal.js', 'utf8').match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

// 部員6人と記録が入っている団体。読むだけで、書き込みはしない
const 団体 = '100001';
test.use({ storageState: 'e2e/.auth/100001.json' });

async function 入る(page) {
  // 案内とお知らせは開く前に止める。開いてから止めて reload すると、
  // アプリを2回起動することになる（遅い機種ほど効く）
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  // 読み込み中の画面でも「出た」になるので、ログイン欄が出るか、
  // もう入っているかが決まるまで待つ（飛ばすとログイン画面のまま進む）
  await 入り口が決まるまで待つ(page);
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

  // 記録が手元に届くまで待つ。
  //
  // e2e/.auth の控えは記録を持っていない（同期の完了を待たずに保存される
  // ため）ので、雲から取り直すまで分析は空のまま。団体IDが入っただけで
  // 先へ進むと、弓具の節も的中の型も「まだ何も無い」画面を見ることになる。
  // 決まった秒数を置くやり方だと、取り直しが間に合った回だけ通る。
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          try {
            const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
            return (s.sessions || []).length;
          } catch (e) {
            return 0;
          }
        }),
      { timeout: 60_000, message: '記録が手元に届かない（分析が空のまま進む）' }
    )
    .toBeGreaterThan(0);
  // ここで書いて reload していたのをやめた（上の 案内を止める が代わり）
}

/**
 * 重なりを避けて、その字が本当に手前にあるときだけ押す。
 *
 * 画面の中に入っていなければ、まず送ってから測る。分析の一覧は
 * 入れ子の巻物の中にあり、Playwright の scrollIntoViewIfNeeded では
 * 外側しか動かないことがある（iPhone の狭い画面で、部員の一覧まで
 * 届かずに落ちた）。要素そのものに scrollIntoView させると中まで動く。
 */
async function 押す(page, 文) {
  const 群 = page.getByText(文, { exact: false });
  // 描き終わるのを待つ。決まった秒数で待つと、iPhone のように遅い側で
  // まだ一覧が無いうちに数えてしまい、候補0件のまま「押せない」と答える
  try {
    await 群.first().waitFor({ state: 'attached', timeout: 15000 });
  } catch (e) {
    return false;
  }
  const 数 = await 群.count();
  for (let i = 0; i < 数; i++) {
    for (const 送るか of [false, true]) {
      try {
        if (送るか) {
          await 群.nth(i).evaluate((el) => el.scrollIntoView({ block: 'center' }));
          await page.waitForTimeout(500);
        }
        const 枠 = await 群.nth(i).boundingBox();
        if (!枠) continue;
        const 手前 = await page.evaluate(
          ([x, y, t]) => {
            const e = document.elementFromPoint(x, y);
            return !!e && (e.textContent || '').indexOf(t) >= 0;
          },
          [枠.x + 枠.width / 2, 枠.y + 枠.height / 2, 文]
        );
        if (!手前) continue;
        await 群.nth(i).click({ timeout: 5000 });
        return true;
      } catch (e) {
        /* 次へ */
      }
    }
  }
  return false;
}

test('ひな型：組み合わせを名前で残し、解除しても呼び出せる', async ({ page }) => {
  await 入る(page);
  expect(await 押す(page, '分析')).toBe(true);
  await page.waitForTimeout(2500);

  // 部員1の詳細を開き、部員2を比較に足す
  expect(await 押す(page, '部員1')).toBe(true);
  await page.waitForTimeout(2000);
  expect(await 押す(page, '他のメンバーと比較')).toBe(true);
  await page.waitForTimeout(1500);
  expect(await 押す(page, '部員2')).toBe(true);
  await page.waitForTimeout(600);
  await 押す(page, '完了');
  await page.waitForTimeout(1200);

  // 名前を付けて残す
  const 名前欄 = page.getByPlaceholder('この組み合わせに名前を付けて残す');
  await expect(名前欄).toHaveCount(1);
  await 名前欄.first().fill('検査のひな型');
  expect(await 押す(page, '保存')).toBe(true);
  await page.waitForTimeout(1500);

  // 端末に残っていること。ここが残らないと、開き直したときに消える
  const 残った = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
    return (s.比較のひな型 || []).map((x) => x.名前);
  });
  expect(残った).toContain('検査のひな型');

  // 解除しても、ひな型そのものは残る
  expect(await 押す(page, '比較をすべて解除')).toBe(true);
  await expect(page.getByText('検査のひな型', { exact: false }).first()).toBeVisible();

  // 押すと比較が戻る（相手の名前が表の中に出る）
  expect(await 押す(page, '検査のひな型')).toBe(true);
  await page.waitForTimeout(2000);
  const 本文 = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  expect(本文).toContain('立ちの結果分布');
  expect(本文).toContain('立数');

  // 後片付け。次に流したときへ持ち越さない
  await page.evaluate(() => {
    const 箱 = JSON.parse(localStorage.getItem('archery-score-storage') || '{}');
    if (箱.state) {
      箱.state.比較のひな型 = [];
      localStorage.setItem('archery-score-storage', JSON.stringify(箱));
    }
  });
});

test('不具合の便り：電波が無いと端末に貯まり、直前の操作が付く', async ({ page, context }, 情報) => {
  // 端末の中の控えを見るだけなので、機種で振る舞いは変わらない。
  // 3機種で回すと、電波を切って待つ20秒ぶんだけ全体が混み合い、
  // 時間に敏感な他の検査（鍵の帯・ライブ）を落としやすくなる
  情報.skip(情報.project.name !== 'パソコン', '端末に依らないので1機種だけで見る');
  await 入る(page);
  // 直前の操作を1つ残す。便りに載ることを見たい
  expect(await 押す(page, '分析')).toBe(true);
  await page.waitForTimeout(1500);

  await context.setOffline(true);
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const 誤 = new Error('検査でわざと起こした不具合');
    window.dispatchEvent(
      new PromiseRejectionEvent('unhandledrejection', { promise: Promise.reject(誤), reason: 誤 })
    );
  });

  // 送りきれないぶんは時間で見切って貯めに回す（既定10秒）
  const 貯め = await expect
    .poll(
      () =>
        page.evaluate(() => {
          const 鍵 = Object.keys(localStorage).find((k) => k.includes('kyudo-error-queue'));
          return 鍵 ? JSON.parse(localStorage.getItem(鍵) || '[]') : [];
        }),
      { timeout: 40_000, message: '送れなかった便りが端末に残らない' }
    )
    .not.toHaveLength(0)
    .then(() =>
      page.evaluate(() => {
        const 鍵 = Object.keys(localStorage).find((k) => k.includes('kyudo-error-queue'));
        return 鍵 ? JSON.parse(localStorage.getItem(鍵) || '[]') : [];
      })
    );

  const わざと = 貯め.find((x) => String(x.起きたこと).includes('わざと起こした'));
  expect(わざと, 'わざと起こした不具合が拾えていない').toBeTruthy();
  expect(わざと.行動.map((a) => a.名)).toContain('アプリを開く');
  expect(わざと.団体id).toBe(団体);

  // 部員の氏名が便りに混ざらないこと
  expect(JSON.stringify(貯め)).not.toContain('部員1');

  await context.setOffline(false);
  await page.evaluate(() => {
    const 鍵 = Object.keys(localStorage).find((k) => k.includes('kyudo-error-queue'));
    if (鍵) localStorage.removeItem(鍵);
  });
});

// ── 弓具を変えた前後（個人の詳細）────────────────────
//
// 「弓具履歴と的中の因果関係は分析の個人詳細で見たい」という求めに対して
// 作ったが、弓具の履歴が無い人には何も出ず、在ることに気づけなかった。
// 履歴が無いときは、どこで記録するかだけを出す。
//
// この検査は団体には書き込まない（開いて見るだけ）。

test('個人の詳細に、弓具を変えた前後の節がある', async ({ page }) => {
  await 入る(page);
  expect(await 押す(page, '分析')).toBe(true);
  await page.waitForTimeout(2500);

  expect(await 押す(page, '部員1')).toBe(true);
  await page.waitForTimeout(2000);

  // 見出しは、履歴の有る無しにかかわらず出る
  const 見出し = page.getByText('弓具を変えた前後', { exact: true });
  await 見出し.first().scrollIntoViewIfNeeded().catch(() => {});
  await expect(見出し.first(), '個人の詳細に弓具の節が無い').toBeVisible({ timeout: 15_000 });

  // 検証環境の部員は弓具の履歴を持たないので、記録するところの案内が出る
  await expect(
    page.getByText(/弓具管理/),
    '履歴が無いときに、どこで記録するかが出ていない'
  ).toBeVisible({ timeout: 10_000 });
});

// ── 的中の型（個人の詳細）────────────────────────
//
// 結果分布（皆中・三中…）は中り数までしか見ないので、同じ三中でも
// 「留矢を抜いた」のか「初矢を抜いた」のかが分からなかった。
// 数える決まりは statsRules（型を並べる）にあり、ここは画面に出ることを見る。
//
// この検査は団体には書き込まない（開いて見るだけ）。

test('個人の詳細に、的中の型が出る', async ({ page }) => {
  await 入る(page);
  expect(await 押す(page, '分析')).toBe(true);
  await page.waitForTimeout(2500);

  expect(await 押す(page, '部員1')).toBe(true);
  await page.waitForTimeout(2000);

  const 見出し = page.getByText(/的中の型/);
  await 見出し.first().scrollIntoViewIfNeeded().catch(() => {});
  await expect(見出し.first(), '個人の詳細に的中の型の節が無い').toBeVisible({ timeout: 15_000 });

  // 中身。○×の型と、要点（「留矢を抜いた」など）が並ぶ。
  // 検証環境の記録がどんな型かは決められないので、
  // 「何か型が出ていること」と「言葉が弓道の言い方であること」を見る
  const 本文 = await page.evaluate(() => document.body.innerText);
  expect(本文, '結果分布のすぐ下に置いたのに、分布が見当たらない').toContain('立ちの結果分布');
  expect(本文, '型の印（○×の並び）が出ていない').toMatch(/[○×]{4}/);
  // 「初矢」はAIアシスタントのQ&Aにも出てくるので、それだけでは
  // この節を見たことにならない。この節にしか無い断り書きで見る
  expect(本文, '的中の型の節の中身が出ていない').toContain('割合は同じ中り数の中での割合');
});
