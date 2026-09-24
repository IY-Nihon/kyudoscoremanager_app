/**
 * 起動の差分の取り込みで、端末の控えから外した記録が id で戻るかの検査（本物の SDK と決まりで）。
 *
 *   npx playwright test e2e/warmStartTrim.spec.mjs
 *
 * ■ なぜこれを入れたか
 * 端末の控えは 1.5MB を超えると古い記録を端末からだけ外す（src/localTrim.js）。外した記録は
 * 雲では変わっていないので差分に出てこず、差分で起動すると履歴から消えて見えた。今は外した
 * 記録の id を控えに残し、起動のときに差分と一緒に id で取り直す（useScoreStore の
 * 起動時に取り込む。2026-09-24）。仕組みは test/warmStart.test.js が偽の Firestore で見るので、
 * ここでは本物の Firestore と決まりで、全件を読まずに戻ることを見る。
 *
 * 1.5MB を実際に超えさせるのは重いので、一度開いて起動の全件の取り込みが済むのを待ち、
 * 開き直す前に控えから 2 件を抜いて id だけを残す（addInitScript は画面の script より先に走る）。
 * 下ごしらえの控えは全件の取り込みが済む前に取られていることがあり、境目が空のことがある。
 *
 * ■ 団体には書き込まない
 * 読むだけ。100001 に書く他の検査と並べてよい（件数ではなく、外した id が戻るかで見る）。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100001.json' });

/** 端末の控え（まとめ書きの途中なら、その中身） */
const 控えを読む = (page) =>
  page.evaluate(() => JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')?.state || {});

test('控えから外した記録は、開き直すと全件を読まずに id で戻る', async ({ page }) => {
  test.setTimeout(150_000);
  let 記録 = [];
  page.on('console', (m) => 記録.push(m.text()));
  await 案内を止める(page);
  // 開き直すときだけ、控えから 2 件を抜いて、その id を「外した記録」として残す
  await page.addInitScript(() => {
    if (sessionStorage.getItem('検査.外す') !== '今') return;
    sessionStorage.removeItem('検査.外す');
    const 鍵 = 'archery-score-storage';
    const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
    const 状態 = (中 && 中.state) || {};
    const 外す = (状態.sessions || [])
      .filter((記録1件) => 記録1件 && 記録1件.id && 記録1件.syncStatus !== '未同期')
      .slice(-2)
      .map((記録1件) => 記録1件.id);
    状態.sessions = (状態.sessions || []).filter((記録1件) => !記録1件 || !外す.includes(記録1件.id));
    状態.端末から外した記録 = 外す;
    localStorage.setItem(鍵, JSON.stringify(Object.assign({}, 中, { state: 状態 })));
    sessionStorage.setItem('検査.外した', JSON.stringify(外す));
  });

  // 1 回目：起動の取り込みが済み、境目と全部そろえた時刻が控えに書かれるまで待つ
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await expect
    .poll(
      async () => {
        const s = await 控えを読む(page);
        return !!(s.雲の境目 && s.全部そろえた時刻 && (s.sessions || []).length >= 3);
      },
      { timeout: 90_000, message: '起動の取り込みが済まない（境目が控えに書かれない）' }
    )
    .toBe(true);
  await page.evaluate(() => globalThis.__弓道の控えを書く?.());

  // 2 回目：控えから 2 件を外した形で開き直す
  await page.evaluate(() => sessionStorage.setItem('検査.外す', '今'));
  記録 = [];
  await page.reload();
  await 画面が出るまで待つ(page);
  const 外した = JSON.parse((await page.evaluate(() => sessionStorage.getItem('検査.外した'))) || '[]');
  expect(外した.length, '控えから外せなかった').toBe(2);

  await expect
    .poll(
      async () => {
        const 記録たち = ((await 控えを読む(page)).sessions || []).map((記録1件) => 記録1件 && 記録1件.id);
        return 外した.filter((id) => 記録たち.includes(id)).length;
      },
      { timeout: 60_000, message: '外した記録が戻らない' }
    )
    .toBe(外した.length);
  expect(
    記録.some((行) => 行.includes(`控えから外した ${外した.length} 件は id で取り直す`)),
    '差分と id で取り込んでいない'
  ).toBe(true);
  expect(
    記録.some((行) => 行.includes('クラウドからの取得を開始')),
    '全件を読んだ'
  ).toBe(false);
});
