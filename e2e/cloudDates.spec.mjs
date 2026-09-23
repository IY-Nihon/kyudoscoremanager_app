/**
 * 雲の記録の日付が日時型（Timestamp）でも、履歴に正しい日付で出ること。
 *
 *   npx playwright test e2e/cloudDates.spec.mjs
 *
 * 管理画面で日時を読めるよう、雲の日時を数から日時型へ移している（2026-09-24〜。
 * scripts/convert-dates-to-timestamp.mjs）。記録の date は最後に移すが、その前に
 * 「日時型の記録も届き、日付が読める」アプリを配っておく必要がある。
 *
 * 見張り（onSnapshot）は date を数と日時型の両方で絞る or() の問い合わせにしてある。
 * 偽の Firestore（npm test）では本物の SDK の or() を確かめられないので、ここで本物に当てる。
 *
 * アプリの操作では団体には書き込まない。100007 に日時型の試しの記録を 1 件だけ
 * 所有者の権限（firebase login の控え）で置き、終わったら消す。無い端末では飛ばす。
 * 同じ団体を使うほかの検査は、記録を題か ID で選んでいるので、この 1 件には当たらない。
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';

const 団体 = '100007';
const 合言葉 = 'StgTest!2026';
const 記録ID = 'e2e-cloud-dates';
const 題 = '日時型の試し';
test.use({ storageState: 'e2e/.auth/100007.json' });

const 文書 = `https://firestore.googleapis.com/v1/projects/kyudoscoremanager-stg/databases/(default)/documents/groups/${団体}/sessions/${記録ID}`;

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

// 昨日の 10 時（端末の時刻）。見張りの窓（直近 30 日）の中
const 昨日 = new Date();
昨日.setDate(昨日.getDate() - 1);
昨日.setHours(10, 0, 0, 0);
const 日付の文 = `${昨日.getFullYear()}/${String(昨日.getMonth() + 1).padStart(2, '0')}/${String(昨日.getDate()).padStart(2, '0')}`;
const 日時型 = (日) => ({ timestampValue: 日.toISOString() });
const 字 = (s) => ({ stringValue: s });

let 鍵 = null;
test.beforeAll(async () => {
  鍵 = await 所有者の鍵();
  if (!鍵) return;
  const r = await fetch(文書, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${鍵}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        id: 字(記録ID),
        title: 字(題),
        note: 字(''),
        date: 日時型(昨日),
        lastModified: 日時型(new Date()),
        shotCount: { integerValue: '4' },
        includeInStats: { booleanValue: false },
        syncStatus: 字('同期済み'),
        tags: { arrayValue: { values: [] } },
        archerNames: { arrayValue: { values: [字('試し 太郎')] } },
        archers: {
          arrayValue: {
            values: [
              {
                mapValue: {
                  fields: {
                    id: 字('e2e-cloud-dates-a'),
                    name: 字('試し 太郎'),
                    isGuest: { booleanValue: true },
                    isSeparator: { booleanValue: false },
                    marks: { arrayValue: { values: [字('○'), 字('×'), 字('○'), 字('○')] } },
                    lastModified: 日時型(new Date()),
                  },
                },
              },
            ],
          },
        },
      },
    }),
  });
  if (!r.ok) throw new Error('試しの記録を置けません: ' + (await r.text()));
});
test.afterAll(async () => {
  if (鍵) await fetch(文書, { method: 'DELETE', headers: { Authorization: `Bearer ${鍵}` } });
});

test('日時型の date の記録が履歴に届き、日付が読める（手元では数で持つ）', async ({ page }) => {
  test.skip(!鍵, 'firebase login の控えが無い端末では試しの記録を置けない');
  test.setTimeout(180_000);
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 合言葉);

  await page.getByText('履歴', { exact: true }).first().click();
  await expect(page.getByText('過去の記録表', { exact: true })).toBeVisible({ timeout: 20_000 });
  // 題の行が出て、その行の日付が昨日（NaN/NaN/NaN にならない）
  const 行 = page.getByText(`[${題}]`, { exact: false }).first();
  await expect(行, '日時型の記録が履歴に出ない（見張りの問い合わせが日時型に当たっていない）').toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(日付の文, { exact: true }).first()).toBeVisible();
  await expect(page.getByText('NaN/NaN/NaN', { exact: false })).toHaveCount(0);

  const 手元の日付 = await page.evaluate((id) => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {};
    const 記録 = (s.sessions || []).find((x) => x && x.id === id);
    return 記録 ? [typeof 記録.date, 記録.date, typeof 記録.lastModified] : null;
  }, 記録ID);
  expect(手元の日付, '手元に届いていない').not.toBeNull();
  expect(手元の日付[0], '手元の date が数でない').toBe('number');
  expect(手元の日付[1]).toBe(昨日.getTime());
  expect(手元の日付[2], '手元の lastModified が数でない').toBe('number');
});
