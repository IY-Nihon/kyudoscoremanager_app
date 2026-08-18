/**
 * 個人ログインで使い方の案内を踏む検査。
 *
 *   npm run e2e
 *
 * 他の e2e はすべて団体ログインで入るので、個人ログインの道筋はここだけが
 * 通る。実際、個人ログインでは案内の「履歴」「分析」の見本が一度も出ない
 * という不具合が、団体でいくら踏んでも見つからなかった。
 *
 * 原因は見本を出すかどうかの判断。端末には団体ぜんぶの記録が入っているので、
 * 素の件数で決めると「団体に記録はあるが、自分は1件も写っていない」人に
 * 見本が出ず、絞り込みで空になった画面だけが残っていた。
 *
 * 検証環境の作りに依存する（scripts/seed-stg.mjs）：
 *   団体 100002 … 記録が4件ある
 *   個人ID 1023  … そのどれにも写っていない
 * この2つが崩れると、前提が成り立たないので検査の意味が無くなる。
 * 記録が0件の団体だと、直っていなくても見本が出てしまう。
 */
import { test, expect } from '@playwright/test';

const 団体 = '100002';
const 個人ID = '1023';

test('個人ログインでも、案内の履歴と分析の見本が出る', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/');
  await page.waitForTimeout(3000);

  // 「例: 1234」は「例: 123456」に前方一致してしまうので、完全一致で選ぶ
  const 番号欄 = page.getByPlaceholder('例: 123456', { exact: true });
  if (await 番号欄.isVisible().catch(() => false)) {
    await page.getByText('個人', { exact: true }).click();
    await page.waitForTimeout(500);
    await 番号欄.click();
    await 番号欄.pressSequentially(団体, { delay: 20 });
    const 個人欄 = page.getByPlaceholder('例: 1234', { exact: true });
    await 個人欄.click();
    await 個人欄.pressSequentially(個人ID, { delay: 20 });
    await page.getByText('ログイン', { exact: true }).click();
    // 決まった秒数で待たない。個人ログインは団体の逆引きを1回はさむぶん遅く、
    // iPhone(WebKit) では9秒に収まらないことがある。収まらないと、まだ
    // ログイン画面のまま先へ進み、案内が出ないという別の顔で落ちていた
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
    await page.waitForTimeout(1500);
  }

  // 初めて使う人と同じ状態にしてから開き直す
  await page.evaluate(() => {
    localStorage.removeItem('tutorialDoneVersion');
    localStorage.removeItem('tutorialBoardSnapshot');
  });
  await page.reload();
  await expect(page.locator('text=ようこそ')).toBeVisible({ timeout: 30_000 });

  // 前提：この人には自分の記録が1件も無い（あると見本の手順が出ない作り）
  const 自分の記録数 = await page.evaluate(() => {
    try {
      const s = JSON.parse(localStorage.getItem('archery-score-storage') || 'null');
      const st = (s && s.state) || {};
      const id = st.myMemberId;
      const 名 = st.myMemberName;
      return (st.sessions || []).filter(
        (x) =>
          x &&
          Array.isArray(x.archers) &&
          x.archers.some((a) => a && (a.memberId === id || (名 && a.name === 名)))
      ).length;
    } catch (e) {
      return -1;
    }
  });
  expect(自分の記録数, '前提が崩れている（この人にも記録がある）').toBe(0);

  // 最後まで進めながら、見本の帯が出たかを数える
  let 見本を見た = 0;
  const 踏んだ = [];
  for (let i = 0; i < 60; i++) {
    const 札 = page.locator('text=/^\\d+ \\/ \\d+$/').first();
    if (!(await 札.isVisible().catch(() => false))) break;
    踏んだ.push((await 札.textContent()).trim());
    if (await page.locator('text=見本です').first().isVisible().catch(() => false)) 見本を見た++;

    let 進めた = false;
    for (const 文字 of ['とばす', '次へ', '続きを見る', '始める']) {
      const b = page.getByText(文字, { exact: true }).first();
      if (await b.isVisible().catch(() => false)) {
        await b.click();
        進めた = true;
        break;
      }
    }
    if (!進めた) break;
    await page.waitForTimeout(700);
  }

  expect(
    見本を見た,
    `個人ログインで見本が出ない（踏んだ手順 ${踏んだ.length} 件）。` +
      '履歴・分析の画面が絞り込みで空になり、説明だけが宙に浮く'
  ).toBeGreaterThan(0);
});
