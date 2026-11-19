/**
 * 3 段目（2026-11-19 本人）：部員（自分）の端末は、記録を中継（/jibun）から自分の行だけ受け取る。中継の /jibun と
 * 新しい決まり（記録は全員を見る役だけ読める）があるのは手元のエミュレーターだけなので、そこでだけ流す（配るまで）。
 *
 *   npm run e2e:emu -- e2e/jibun.spec.mjs --project=スマホ
 *
 * 流れ（団体 100002 の個人ログイン。エミュレーターなので雲には書かない）：
 *   部員（自分）の端末を開く → ほかの端末が保存した形（雲へ記録と「記録が変わった印」を直に書く）→ 開いたまま届く
 *   → 届いた記録に、ほかの人の ○× と名前・出欠が無い。端末のどの記録にも無い。ゴミ箱を持たない。権限の誤りが出ない
 *   → 自分で記録を付けて保存すると、アプリが印を書く（ほかの部員の端末に届く合図）
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

const 団体 = '100002';
test.skip(
  process.env.FB_EMULATOR !== '1',
  '中継の /jibun と新しい決まりがあるのは手元のエミュレーターだけ（配るまで）'
);
test.use({ storageState: 'e2e/.auth/100002-個人.json' });

/** 控え（100002-個人）に入っている部員（検証の名前。出力には出さない） */
const 部員 = (() => {
  const 控え = JSON.parse(fs.readFileSync('e2e/.auth/100002-個人.json', 'utf8'));
  for (const 元 of 控え.origins || [])
    for (const 項 of 元.localStorage || [])
      if (項.name === 'archery-score-storage') {
        const s = JSON.parse(項.value).state || {};
        return { id: s.myMemberId, 名: s.myMemberName };
      }
  return { id: null, 名: null };
})();

const 根 = `https://firestore.googleapis.com/v1/projects/kyudoscoremanager-stg/databases/(default)/documents/groups/${団体}`;
/** エミュレーターへ管理の資格で直に書く（e2e/emu-fetch.mjs が手元へ向ける） */
const 雲へ書く = (道, 欄) =>
  fetch(`${根}/${道}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: 欄 }),
  });
/** 記録が変わった印の時刻（無ければ 0） */
const 印の時刻 = async () => {
  const 返り = await fetch(`${根}/changes/sessions`, { headers: { Authorization: 'Bearer owner' } });
  if (!返り.ok) return 0;
  const 中身 = await 返り.json();
  return Date.parse((中身.fields && 中身.fields.at && 中身.fields.at.timestampValue) || '') || 0;
};
/** 端末の控え（まだ書いていない写しも含む） */
const 控え = (page) =>
  page.evaluate(
    () =>
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        .state || {}
  );
const 字の並び = (並び) => ({ arrayValue: { values: 並び.map((字) => ({ stringValue: 字 })) } });

/** 出欠の確認を飛ばして、保存の窓へ直に進む（offlineSave.spec と同じ） */
async function 出欠の確認を切る(page) {
  await page.addInitScript(() => {
    const 鍵 = 'archery-score-storage';
    let 中;
    try {
      中 = JSON.parse(localStorage.getItem(鍵) || '{}') || {};
    } catch {
      中 = {};
    }
    中.state = Object.assign({}, 中.state || {}, { 保存時に出欠を確認する: false });
    if (中.version == null) 中.version = 0;
    localStorage.setItem(鍵, JSON.stringify(中));
  });
}

test('部員（自分）：ほかの端末の保存が開いたまま自分の行だけ届く。自分で保存すると印を書く', async ({
  page,
}) => {
  test.setTimeout(180_000);
  expect(部員.id, '控え（100002-個人）に部員が入っていない').toBeTruthy();
  // 記録を直接読もうとして決まりに断られたら、ここに出る
  const 誤り = [];
  page.on('console', (知らせ) => {
    const 字 = 知らせ.text();
    if (
      /insufficient permissions|permission-denied|listener error|Fetch Overwrite Error|\[syncSessions\] Error/i.test(
        字
      )
    )
      誤り.push(字.slice(0, 200));
  });
  await 案内を止める(page);
  await 出欠の確認を切る(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await expect(page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 30_000 });
  // 起動の取り込みと見張りが付くのを待つ
  await page.waitForTimeout(3000);

  // ほかの端末が保存した形：雲へ記録と印を直に書く（自分の列とほかの人の列）
  const 記録id = 'e2e-jibun-' + Date.now().toString(36);
  const 今 = new Date().toISOString();
  const 書いた = await 雲へ書く(`sessions/${記録id}`, {
    id: { stringValue: 記録id },
    title: { stringValue: '自分の行だけの検査' },
    date: { timestampValue: 今 },
    lastModified: { timestampValue: 今 },
    shotCount: { integerValue: '4' },
    includeInStats: { booleanValue: true },
    archerNames: 字の並び([部員.名, 'ほかの人']),
    attendance: {
      mapValue: { fields: { [部員.id]: { stringValue: 'present' }, other: { stringValue: 'late' } } },
    },
    archers: {
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                id: { stringValue: 'a1' },
                name: { stringValue: 部員.名 },
                memberId: { stringValue: 部員.id },
                marks: 字の並び(['○', '×', '○', '○']),
              },
            },
          },
          {
            mapValue: {
              fields: {
                id: { stringValue: 'a2' },
                name: { stringValue: 'ほかの人' },
                memberId: { stringValue: 'other' },
                marks: 字の並び(['○', '○', '○', '○']),
              },
            },
          },
        ],
      },
    },
  });
  expect(書いた.ok, '雲へ記録を書けない').toBe(true);
  expect((await 雲へ書く('changes/sessions', { at: { timestampValue: new Date().toISOString() } })).ok).toBe(
    true
  );

  // 開いたまま届く（中継から自分の行だけ）
  await expect
    .poll(async () => ((await 控え(page)).sessions || []).some((記録) => 記録 && 記録.id === 記録id), {
      timeout: 30_000,
      message: 'ほかの端末の保存が、開いたまま届かない',
    })
    .toBe(true);
  const 状 = await 控え(page);
  const 届いた = 状.sessions.find((記録) => 記録.id === 記録id);
  const 自分の = 届いた.archers.find((射手) => 射手.id === 'a1');
  const ほかの = 届いた.archers.find((射手) => 射手.id === 'a2');
  expect(自分の.marks, '自分の ○× が届かない').toEqual(['○', '×', '○', '○']);
  expect(ほかの.marks, 'ほかの人の ○× が端末に届いた').toEqual([]);
  expect(ほかの.name, 'ほかの人の名前が端末に届いた').toBe('');
  expect(届いた.archerNames).toEqual([部員.名]);
  expect(届いた.attendance, 'ほかの人の出欠が端末に届いた').toEqual({ [部員.id]: 'present' });
  // 端末のどの記録にも（送れていない記録は除く）、ほかの人の ○× が無い。ゴミ箱を持たない
  for (const 記録 of 状.sessions || []) {
    if (!記録 || 記録.syncStatus === '未同期') continue;
    for (const 射手 of 記録.archers || []) {
      if (!射手 || 射手.memberId === 部員.id) continue;
      const 交代 = Object.values(射手.substitutionIds || {});
      if (交代.includes(部員.id)) continue;
      expect(
        (射手.marks || []).every((印) => !印),
        `ほかの人の ○× が残っている（${記録.id}）`
      ).toBe(true);
    }
  }
  expect(状.trash || [], 'ゴミ箱（ほかの人の記録）を持っている').toEqual([]);
  // 履歴にも出る
  await page.getByRole('tab', { name: '履歴' }).first().click();
  await expect(page.getByText('自分の行だけの検査').first()).toBeVisible({ timeout: 20_000 });

  // 自分で記録を付けて保存すると、アプリが印を書く
  const 前の印 = await 印の時刻();
  await page.getByRole('tab', { name: '記録' }).first().click();
  await page.getByText('人', { exact: true }).first().click();
  const ます = page.locator('[data-testid^="ます-"]:visible');
  await expect(ます.first()).toBeVisible({ timeout: 10_000 });
  await ます.first().click();
  await page.getByText('終了・保存', { exact: true }).click();
  await page.getByPlaceholder('大会名・練習名（例: ○○大会）').fill('自分で付けた検査');
  await page.getByText('保存', { exact: true }).last().click();
  await expect
    .poll(印の時刻, { timeout: 30_000, message: '保存したのに、記録が変わった印が進まない' })
    .toBeGreaterThan(前の印);
  expect(誤り, '記録を直接読もうとして断られた').toEqual([]);
});
