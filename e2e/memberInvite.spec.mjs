/**
 * メンバーの招待リンク：持ち主が作り、別の端末で開くとそのメンバーとして入れる。
 *
 *   npx playwright test e2e/memberInvite.spec.mjs
 *
 * 持ち主は管理者モードでメンバーの編集を開き、「招待リンクを作る」でリンクを作る。
 * 新しい端末（別のブラウザ）でそのリンクを開き、「入る」を押すと、団体ID と個人ID を
 * 打たずにそのメンバーとして入れる（src/memberInvite.js・src/InviteModal.js）。
 * リンクは作ってから 7 日で切れる。切れたリンクでは入れず、期限切れと知らせる。
 *
 * 記録と名簿には触らないので、並列の取り合いの意味では団体には書き込まない扱いにする。
 * 逆引き表に招待の合言葉を置き、終わったら所有者の権限（firebase login の控え）で消す
 * （ほかの検査は逆引き表の招待を読まない。個人ID での入り方は変わらない）。
 * 端末の種類ごとに別のメンバーを使う。同じメンバーだと、並んで流れる相手が作り直して
 * こちらのリンクを消してしまう（2026-09-24 にスマホと iPhone を並べて踏んだ）。
 * 後片付けも、この検査が作った合言葉だけを消す。
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';

const 団体 = '100002';
const 合言葉 = 'StgTest!2026';
/** 端末の種類ごとのメンバー（団体 100002 の名簿は 部員1〜部員5） */
const 使うメンバー = { パソコン: '部員5', スマホ: '部員4', iPhone: '部員3' };
/** この検査が作った合言葉（後片付けで消す） */
const 作った合言葉 = [];

async function 所有者の鍵() {
  const 設定 = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(設定)) return null;
  const refresh = JSON.parse(fs.readFileSync(設定, 'utf8')).tokens?.refresh_token;
  if (!refresh) return null;
  const j = await (
    await fetch('https://www.googleapis.com/oauth2/v4/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
        client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi',
        refresh_token: refresh,
        grant_type: 'refresh_token',
      }),
    })
  ).json();
  return j.access_token || null;
}

/** 設定の画面で管理者モードを入れる（団体パスワードで認証。historyEditInRecord と同じ） */
async function 管理者モードにする(page) {
  await page.getByText('設定', { exact: true }).first().click();
  await expect(page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.evaluate(() => {
    const 行 = [...document.querySelectorAll('div')].find(
      (e) => (e.textContent || '').trim() === '管理者モード'
    );
    let 親 = 行;
    for (let i = 0; i < 6 && 親; i++) {
      const 切替 = 親.querySelector('input[type="checkbox"], [role="switch"]');
      if (切替) return void 切替.click();
      親 = 親.parentElement;
    }
  });
  await expect(page.getByText('管理者認証', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder('パスワード').fill(合言葉);
  await page.getByText('認証', { exact: true }).click();
  await expect(page.getByText('管理者認証', { exact: true })).toHaveCount(0, { timeout: 30_000 });
}

test('持ち主が作った招待リンクを別の端末で開くと、そのメンバーとして入れる', async ({ page, browser }, 情報) => {
  test.setTimeout(240_000);
  const 招待する人 = 使うメンバー[情報.project.name] || '部員5';
  // ── 持ち主：リンクを作る ──
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);
  await 管理者モードにする(page);
  await page.getByText('メンバー', { exact: true }).first().click();
  await page.getByText(招待する人, { exact: true }).first().click();
  const 欄 = page.getByTestId('招待リンクの欄');
  await expect(欄, 'メンバーの編集に招待リンクの欄が出ない').toBeVisible({ timeout: 20_000 });
  const 作る = 欄.getByText('招待リンクを作る', { exact: true });
  const 作り直す = 欄.getByText('作り直す', { exact: true });
  await expect(作る.or(作り直す)).toBeVisible({ timeout: 20_000 });
  // 続けて 2 回押しても、画面に出たリンクが雲に在ること（2 回目は受け付けない作り。
  // 2 つ作ると画面に出したほうが片付けで消されうるが、その順番はここでは毎回は作れない）
  if (await 作る.isVisible()) await 作る.dblclick();
  const リンクの字 = page.getByTestId('招待リンク');
  await expect(リンクの字).toBeVisible({ timeout: 20_000 });
  const 前のリンク = (await リンクの字.innerText()).trim();
  expect(前のリンク).toMatch(/#招待=100002\.[0-9a-f]{32}$/);
  作った合言葉.push(前のリンク.split('.').pop());
  const 雲の鍵 = await 所有者の鍵();
  if (雲の鍵) {
    // 片付けが走り終わるのを待ってから、画面のリンクの合言葉が雲に在るかを見る
    await page.waitForTimeout(3000);
    const 在るか = await fetch(
      `https://firestore.googleapis.com/v1/projects/kyudoscoremanager-stg/databases/(default)/documents/groups/${団体}/member_lookup/${前のリンク.split('.').pop()}`,
      { headers: { Authorization: `Bearer ${雲の鍵}` } }
    );
    expect(在るか.status, '画面に出たリンクの合言葉が雲に無い').toBe(200);
  }
  await expect(欄.getByTestId('招待リンクの期限')).toContainText('まで使えます');

  // ── 作り直す（確かめの窓を通る）。前のリンクは使えなくなる ──
  await 欄.getByText('作り直す', { exact: true }).click();
  await expect(page.getByText('作り直しますか？', { exact: true })).toBeVisible({ timeout: 10_000 });
  // 確かめの窓（src/AppDialog.js）のボタン。欄にも同じ字のボタンがあるので目印で選ぶ
  await page.getByTestId('窓のボタン-作り直す').click();
  await expect(リンクの字).not.toHaveText(前のリンク, { timeout: 20_000 });
  const リンク = (await リンクの字.innerText()).trim();
  expect(リンク).toMatch(/#招待=100002\.[0-9a-f]{32}$/);
  作った合言葉.push(リンク.split('.').pop());

  // 前のリンクでは入れない
  const 前の端末 = await browser.newContext();
  const 前で開く = await 前の端末.newPage();
  await 案内を止める(前で開く);
  await 前で開く.goto(前のリンク.replace(/^https?:\/\/[^/]+/, ''));
  await expect(前で開く.getByTestId('招待の窓')).toBeVisible({ timeout: 30_000 });
  await 前で開く.getByTestId('招待の窓').getByText('入る', { exact: true }).click();
  await expect(前で開く.getByText(/この招待リンクは使えません/)).toBeVisible({ timeout: 30_000 });
  await 前の端末.close();

  // ── 新しい端末：リンクを開いて入る ──
  const 別の端末 = await browser.newContext();
  const 開く = await 別の端末.newPage();
  await 案内を止める(開く);
  const 手元のリンク = リンク.replace(/^https?:\/\/[^/]+/, '');
  await 開く.goto(手元のリンク);
  const 窓 = 開く.getByTestId('招待の窓');
  await expect(窓, '招待の窓が出ない').toBeVisible({ timeout: 30_000 });
  await expect(開く).not.toHaveURL(/招待=|%E6%8B%9B%E5%BE%85=/, { timeout: 10_000 }); // 合言葉を URL に残さない
  await 窓.getByText('入る', { exact: true }).click();
  await expect
    .poll(
      () =>
        開く.evaluate(() => {
          const s =
            JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
              ?.state || {};
          return [s.activeGroupId, s.activeRole, s.myMemberName];
        }),
      { timeout: 60_000, message: '招待リンクで入れない' }
    )
    .toEqual([団体, 'member', 招待する人]);
  await 別の端末.close();

  // ── 期限が切れたリンクでは入れない（期限を過去にして確かめる。所有者の権限）──
  const 鍵 = await 所有者の鍵();
  test.skip(!鍵, 'firebase login の控えが無いので、期限切れは確かめない');
  const 招待の合言葉 = リンク.split('.').pop();
  const 変える = await fetch(
    `https://firestore.googleapis.com/v1/projects/kyudoscoremanager-stg/databases/(default)/documents/groups/${団体}/member_lookup/${招待の合言葉}?updateMask.fieldPaths=expiresAt`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${鍵}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { expiresAt: { timestampValue: new Date(Date.now() - 60_000).toISOString() } } }),
    }
  );
  expect(変える.status, '期限を過去にできない').toBe(200);
  const 後の端末 = await browser.newContext();
  const 後で開く = await 後の端末.newPage();
  await 案内を止める(後で開く);
  await 後で開く.goto(手元のリンク);
  await expect(後で開く.getByTestId('招待の窓')).toBeVisible({ timeout: 30_000 });
  await 後で開く.getByTestId('招待の窓').getByText('入る', { exact: true }).click();
  await expect(後で開く.getByText(/期限が切れています/)).toBeVisible({ timeout: 30_000 });
  await 後の端末.close();
});

// 片付け：この検査が作った招待の合言葉を消す（検証環境の所有者の権限。firebase login の控え）。
// 作り直しで消えたものは 404 になるだけ
test.afterAll(async () => {
  const 鍵 = await 所有者の鍵();
  if (!鍵) return;
  const 根 = `https://firestore.googleapis.com/v1/projects/kyudoscoremanager-stg/databases/(default)/documents/groups/${団体}/member_lookup`;
  for (const 合言葉1つ of 作った合言葉.splice(0))
    await fetch(`${根}/${合言葉1つ}`, { method: 'DELETE', headers: { Authorization: `Bearer ${鍵}` } });
});
