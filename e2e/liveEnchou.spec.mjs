/**
 * ライブのリンクの期限を延ばす（B3。2026-11-26 本人「見本のとおり」）。中継の /enchou があるとき（手元のエミュレーターの
 * 中継の代わり。npm run e2e:emu）だけ流す。団体はこの検査が回ごとに作る（e2e/emu-dantai.mjs）。
 *
 *   npm run e2e:emu -- e2e/liveEnchou.spec.mjs
 *   SHOT_DIR=撮る先 … 帯と窓の写真を撮る
 *
 * 流れ：団体アカウントでライブを始めて配る（12 時間）→ 配った枝の期限を 20 分後へ縮める（管理の資格で。期限が近づいた形）
 *   → 下に「ライブのリンクはあと 20 分で切れます」の帯 → 延ばす → 24 時間で延ばす → 帯が消え、配った枝と閲覧の枝の期限・
 *   道しるべの期限が 24 時間ほど先になる → 配る窓をもう一度開くと「期限を延ばす」の欄がある
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  団体で入る,
  確かに打つ,
} from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';
import { 文書の根, 管理, 検査の団体を作る } from './emu-dantai.mjs';

test.skip(process.env.FB_EMULATOR !== '1', '中継の /enchou があるのは手元のエミュレーターだけ（配るまで）');

/** エミュレーターの Realtime Database（管理の資格。決まりを通らない） */
const RTDB = 'http://127.0.0.1:9000';
const ns = 'kyudoscoremanager-stg-default-rtdb';
const 道に = (道) => 道.split('/').map(encodeURIComponent).join('/');
const ライブを読む = async (道) =>
  (await fetch(`${RTDB}/${道に(道)}.json?ns=${ns}`, { headers: { Authorization: 'Bearer owner' } })).json();
const ライブに書く = (中身) =>
  fetch(`${RTDB}/.json?ns=${ns}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner' },
    body: JSON.stringify(中身),
  });

const 撮る = async (的, 名, 情報) => {
  if (!process.env.SHOT_DIR) return;
  await 的.page().waitForTimeout(400);
  await 的.screenshot({ path: path.join(process.env.SHOT_DIR, `${情報.project.name}-延ばす-${名}.png`) });
};

test('配ったライブの期限が近づくと下に帯が出て、延ばすと期限だけが延びる', async ({ browser }, 情報) => {
  test.setTimeout(300_000);
  const 団体 = await 検査の団体を作る('enchou');
  const ライブ名 = 'enchou' + Date.now().toString(36);
  const 場 = await browser.newContext({ ...情報.project.use, storageState: { cookies: [], origins: [] } });
  const page = await 場.newPage();
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await 団体で入る(page, 団体, 検証のパスワード());

  // ライブを始める
  await page.getByRole('tab', { name: '記録' }).first().click();
  await page.locator('[aria-label="射手を追加"]').first().click();
  await page.getByText('ライブ', { exact: true }).first().click();
  await page.getByText('ライブ記録を開始', { exact: true }).click();
  const 名欄 = page.getByPlaceholder('session_name_123');
  await expect(名欄).toBeVisible({ timeout: 20_000 });
  await 確かに打つ(名欄, ライブ名);
  await page.getByText('決定', { exact: true }).click();
  await expect(page.getByText(/ライブ中/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('ライブを開始', { exact: true })).toBeHidden({ timeout: 60_000 });

  // 配る（12 時間）
  await page.getByText(/ライブ中/).click();
  await expect(page.getByText('ライブをリンクで配る')).toBeVisible({ timeout: 10_000 });
  await page.getByText('12時間', { exact: true }).click();
  await 確かに打つ(page.getByPlaceholder(/文字以上/), '検査の合言葉1');
  await page.getByText('リンクを作る', { exact: true }).click();
  await expect(page.getByText('編集用', { exact: true })).toBeVisible({ timeout: 30_000 });
  // 配った直後から延ばせる
  await expect(page.getByTestId('期限を延ばす欄')).toBeVisible();
  await page.getByText('閉じる', { exact: true }).last().click();

  // 配った枝を引き、期限を 20 分後へ縮める（期限が近づいた形）
  const 団体の文書 = await (await fetch(`${文書の根}/groups/${団体}`, { headers: 管理 })).json();
  const 団の枝 = 団体の文書.fields.liveSecret.stringValue;
  const 道しるべ = await ライブを読む(`live_sessions/${団の枝}/${ライブ名}/state`);
  const 共の枝 = 道しるべ.共有の枝;
  const 見の枝 = 道しるべ.閲覧の枝;
  expect(共の枝 && 見の枝, '道しるべに配った枝が無い').toBeTruthy();
  const 近い = Date.now() + 20 * 60 * 1000;
  await ライブに書く({
    [`live_limits/${共の枝}`]: 近い,
    [`live_limits/${見の枝}`]: 近い,
    [`live_sessions/${共の枝}/${ライブ名}/state/期限`]: 近い,
    [`live_sessions/${団の枝}/${ライブ名}/state/期限`]: 近い,
  });

  // 下の帯
  const 帯 = page.getByTestId('ライブの期限の帯');
  await expect(帯).toBeVisible({ timeout: 30_000 });
  await expect(帯).toContainText(
    /ライブのリンクはあと(19|20)分で切れます。続けるときは期限を延ばしてください/
  );
  await 撮る(帯, '1-帯', 情報);
  await 帯.getByText('延ばす', { exact: true }).click();
  const 窓 = page.getByTestId('期限を延ばす窓');
  await expect(窓).toBeVisible({ timeout: 10_000 });
  // 既定は 24 時間
  await expect(窓.getByLabel('延ばす長さ 24時間')).toHaveAttribute('aria-checked', 'true');
  await 撮る(窓, '2-窓', 情報);
  await 窓.getByTestId('期限を延ばす').click();
  await expect(窓.getByTestId('期限を延ばした')).toBeVisible({ timeout: 30_000 });
  await 窓.getByText('閉じる', { exact: true }).click();
  await expect(帯).toHaveCount(0);

  // 期限だけが延びた（枝はそのまま）
  const 延びた = await ライブを読む(`live_limits/${共の枝}`);
  const 二十四時間後 = Date.now() + 24 * 3600 * 1000;
  expect(Math.abs(延びた - 二十四時間後), '配った枝の期限が 24 時間後になっていない').toBeLessThan(
    10 * 60 * 1000
  );
  expect(await ライブを読む(`live_limits/${見の枝}`)).toBe(延びた);
  expect(await ライブを読む(`live_sessions/${団の枝}/${ライブ名}/state/期限`)).toBe(延びた);
  expect((await ライブを読む(`live_sessions/${団の枝}/${ライブ名}/state`)).共有の枝).toBe(共の枝);
  await 場.close();
});
