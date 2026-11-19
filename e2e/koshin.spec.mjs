/**
 * 本番の版から新しい版へ入れ替えたときの検査（2026-11-20。本人「現在配信中のアプリからの更新後の動作が問題ないか確認して」）。
 * 手元のエミュレーターでだけ流す。前の版の束と決まりを渡す：
 *
 *   git worktree add <どこか>/app-old <本番の版>（node_modules はつなぐ）→ そこで BUILD_OUT=dist-emu-old node scripts/build-stg.mjs --emu
 *   PW_OLD_DIST=<どこか>/app-old/dist-emu-old PW_OLD_RULES=<どこか>/app-old/firestore.rules PW_WORKERS=1 \
 *     npm run e2e:emu -- e2e/koshin.spec.mjs --project=スマホ --no-deps
 *
 * 同じ港（同じ端末の控え・IndexedDB・Firestore の送り待ち）で、配る束を前の版 → 新しい版へ入れ替え、決まりも前 → 新へ
 * 入れ替える（配る順：アプリが先、決まりが後）。端末は 4 台：
 *   団体の端末（G）… 前の版で入り、管理者モードのまま閉じた形（前の版は管理者モードを控えに残していた）
 *   部員1（M1）… 前の版で、送れた記録と、送れていない記録（Firestore の送り待ちにも残る）を持って新しい版へ。決まりはまだ前
 *   部員2（M2）… 前の版で送れていない記録を持ったまま、決まりのあとに新しい版を開く
 *   部員3（M3）… 前の版のまま開いているうちに決まりが替わる（自分の港で、あとから新しい版へ）
 * 見たことは test-results/koshin-kansatsu.json にも書く。
 * 前の版の束を渡したときだけ 1 本で流す（ほかの検査と並べて流さない。ふだんの全件では飛ばす）。団体 100001 に記録を書くが、
 * エミュレーターは毎回控えから立て直すので残らない
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, 団体で入る } from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';

const 前の束 = process.env.PW_OLD_DIST;
const 前の決まり = process.env.PW_OLD_RULES;
const 新しい束 = path.resolve(process.env.PW_DIST || 'dist-emu');
test.skip(
  process.env.FB_EMULATOR !== '1' || !前の束 || !前の決まり,
  '前の版の束（PW_OLD_DIST）と決まり（PW_OLD_RULES）を渡して、手元のエミュレーターで流す'
);
test.use({ storageState: { cookies: [], origins: [] } });

const 団体 = '100001';
const 計画 = 'kyudoscoremanager-stg';
const 根 = `http://127.0.0.1:8080/v1/projects/${計画}/databases/(default)/documents/groups/${団体}`;
const 管理 = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };
const 見たこと = {};
const 記す = (鍵, 値) => {
  見たこと[鍵] = 値;
  console.log(`[見たこと] ${鍵}: ${JSON.stringify(値)}`);
};

// ── 配り口（港ごとに配る束を替えられる） ──
const 種類 = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};
const 配る束 = {};
const 配り口たち = [];
/** 作った端末（落ちても最後に誤りを書き出す） */
const 端末たち = [];
function 配り口を立てる(港) {
  配る束[港] = path.resolve(前の束);
  const 口 = http.createServer((受, 返) => {
    const 元 = 配る束[港];
    let 道 = decodeURIComponent((受.url || '/').split('?')[0]);
    if (道.includes('..')) {
      返.writeHead(400);
      return 返.end();
    }
    let 置き場 = path.join(元, 道);
    if (!fs.existsSync(置き場) || fs.statSync(置き場).isDirectory()) 置き場 = path.join(元, 'index.html');
    返.writeHead(200, {
      'Content-Type': 種類[path.extname(置き場)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(置き場).pipe(返);
  });
  口.listen(港, '127.0.0.1');
  配り口たち.push(口);
  return `http://127.0.0.1:${港}`;
}

/** エミュレーターの決まりを差し替える（本物の配信の代わり） */
async function 決まりを置く(字) {
  const 返り = await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${計画}:securityRules`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: 字 }] } }),
  });
  expect(返り.ok, '決まりを差し替えられない ' + (await 返り.text())).toBe(true);
}

const 雲へ書く = (道, 欄) =>
  fetch(`${根}/${道}`, { method: 'PATCH', headers: 管理, body: JSON.stringify({ fields: 欄 }) });
const 雲から読む = async (道) => {
  const 返り = await fetch(`${根}/${道}`, { headers: 管理 });
  return 返り.ok ? 返り.json() : null;
};
/** 題で雲の記録を探す（管理の資格で全部読む） */
async function 雲の記録を題で(題) {
  const 返り = await fetch(`${根}:runQuery`, {
    method: 'POST',
    headers: 管理,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'sessions' }],
        where: { fieldFilter: { field: { fieldPath: 'title' }, op: 'EQUAL', value: { stringValue: 題 } } },
      },
    }),
  });
  const 行 = await 返り.json();
  return (Array.isArray(行) ? 行 : []).map((x) => x.document).filter(Boolean);
}
const 字 = (値) => ({ stringValue: 値 });
const 字の並び = (並び) => ({ arrayValue: { values: 並び.map((x) => ({ stringValue: x })) } });

/** 端末の控え（まだ書いていない写しも含む） */
const 控え = (page) =>
  page.evaluate(
    () =>
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        .state || {}
  );

/** 出欠の確認を飛ばす（保存の窓へ直に進む） */
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

/** 端末を 1 台作る。権限の誤り・入り直しの案内・不具合の便りを数える */
async function 端末を作る(browser, 名) {
  const 場 = await browser.newContext({
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await 場.newPage();
  const 誤り = [];
  page.on('console', (知らせ) => {
    const 文 = 知らせ.text();
    if (
      /insufficient permissions|permission-denied|listener error|Fetch Overwrite Error|\[syncSessions\] Error|記録の送信に失敗|Uncaught|ログインし直して/i.test(
        文
      )
    )
      誤り.push(`[${名}] ${知らせ.type()} ${文.slice(0, 220)}`);
  });
  page.on('pageerror', (e) => 誤り.push(`[${名}] pageerror ${String(e).slice(0, 220)}`));
  await 案内を止める(page);
  await 出欠の確認を切る(page);
  const 端 = { 名, 場, page, 誤り };
  端末たち.push(端);
  return 端;
}

async function 個人で入る(page, 個人ID) {
  const 番号欄 = page.getByPlaceholder('例: 123456', { exact: true });
  await 番号欄.waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByText('個人', { exact: true }).click();
  await 番号欄.click();
  await 番号欄.pressSequentially(団体, { delay: 20 });
  const 個人欄 = page.getByPlaceholder('例: K7MP3X', { exact: true });
  await 個人欄.click();
  await 個人欄.pressSequentially(個人ID, { delay: 20 });
  await page.getByText('ログイン', { exact: true }).click();
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  await expect(page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 60_000 });
}

/** 記録の画面で 1 人立てて 1 マス付け、題を付けて保存する */
async function 記録を付けて保存(page, 題) {
  await page.getByText('記録', { exact: true }).first().click();
  await page.getByText('人', { exact: true }).first().click();
  const ます = page.locator('[data-testid^="ます-"]');
  await expect(ます.first()).toBeVisible({ timeout: 20_000 });
  await ます.first().click();
  await page.getByText('終了・保存', { exact: true }).click();
  const 次へ = page.getByText(/次へ|保存へ進む/).first();
  if (await 次へ.isVisible({ timeout: 2_000 }).catch(() => false)) await 次へ.click();
  const 題の欄 = page.getByPlaceholder('大会名・練習名（例: ○○大会）');
  await expect(題の欄).toBeVisible({ timeout: 15_000 });
  await 題の欄.fill(題);
  await page.getByText('保存', { exact: true }).last().click();
  await expect(ます).toHaveCount(0, { timeout: 15_000 });
}

const 手元の記録 = async (page, 題) => ((await 控え(page)).sessions || []).find((x) => x && x.title === 題);
const 入り直しの案内が出ているか = (page) =>
  page
    .getByText(/ログインし直してください/)
    .first()
    .isVisible()
    .catch(() => false);
/** Firestore（エミュレーター）にだけ届かなくする（応答なし） */
const 雲を止める = (page) => page.route(/127\.0\.0\.1:8080/, (道) => 道.abort());
const 雲を戻す = (page) => page.unroute(/127\.0\.0\.1:8080/);

test.afterAll(() => {
  for (const 端 of 端末たち) 見たこと[`誤り（${端.名}）`] = 端.誤り.slice(0, 40);
  for (const 口 of 配り口たち) 口.close();
  try {
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/koshin-kansatsu.json', JSON.stringify(見たこと, null, 2));
  } catch {
    /* 書けなくても検査の結果は出ている */
  }
});

test('本番の版で使っていた端末を新しい版へ入れ替え、決まりも入れ替える', async ({ browser }) => {
  test.setTimeout(900_000);
  const 印 = Date.now().toString(36);
  const 字たち = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const 乱 = () => 字たち[Math.floor(Math.random() * 字たち.length)];
  const 人 = [1, 2, 3].map((番) => ({
    id: `e2e-up-m${番}-${印}`,
    名: `更新 部員${番}${印.slice(-3)}`,
    // 個人ID は 6 字（I・L・O・0・1 を除く大文字と数字）
    個人ID: 'U' + 'ABC'[番 - 1] + 乱() + 乱() + 乱() + 乱(),
  }));
  const 主 = 配り口を立てる(8097); // G・M1
  const 別 = 配り口を立てる(8098); // M3（前の版のまま開いている端末）
  // M2 は自分の港で（前の版の自動の入れ替え（5 分おきに見る）で、決まりより前に新しい版へ替わらないように）
  const 二 = 配り口を立てる(8099);

  // ── 前：本番の版と本番の決まり ──
  await 決まりを置く(fs.readFileSync(前の決まり, 'utf8'));
  for (const 一人 of 人) {
    expect((await 雲へ書く(`members/${一人.id}`, { id: 字(一人.id), name: 字(一人.名) })).ok).toBe(true);
    expect(
      (await 雲へ書く(`member_lookup/${一人.個人ID}`, { memberId: 字(一人.id), 形: { integerValue: '2' } }))
        .ok
    ).toBe(true);
  }
  // ほかの端末（前の版の団体の端末）が保存した記録：部員1・部員2 の列（作った人の印は無い）
  const 前の記録id = 'e2e-up-r0-' + 印;
  const 今 = new Date().toISOString();
  const 列 = (id, 一人, 印たち) => ({
    mapValue: {
      fields: {
        id: 字(id),
        name: 字(一人.名),
        memberId: 字(一人.id),
        marks: 字の並び(印たち),
      },
    },
  });
  expect(
    (
      await 雲へ書く(`sessions/${前の記録id}`, {
        id: 字(前の記録id),
        title: 字('前の版の団体の記録' + 印),
        date: { timestampValue: 今 },
        lastModified: { timestampValue: 今 },
        shotCount: { integerValue: '4' },
        includeInStats: { booleanValue: true },
        syncStatus: 字('同期済み'),
        archerNames: 字の並び([人[0].名, 人[1].名]),
        attendance: { mapValue: { fields: { [人[0].id]: 字('present'), [人[1].id]: 字('late') } } },
        archers: {
          arrayValue: {
            values: [列('a1', 人[0], ['○', '×', '○', '○']), 列('a2', 人[1], ['○', '○', '○', '○'])],
          },
        },
      })
    ).ok
  ).toBe(true);

  // 団体の端末（前の版）
  const G = await 端末を作る(browser, '団体');
  await G.page.goto(主 + '/');
  await 画面が出るまで待つ(G.page);
  await 入り口が決まるまで待つ(G.page);
  await 団体で入る(G.page, 団体, 検証のパスワード());
  await expect
    .poll(async () => ((await 控え(G.page)).sessions || []).some((x) => x && x.id === 前の記録id), {
      timeout: 60_000,
      message: '前の版の団体の端末に記録が届かない',
    })
    .toBe(true);
  await 記録を付けて保存(G.page, '前の版の団体で保存' + 印);
  await expect
    .poll(async () => (await 雲の記録を題で('前の版の団体で保存' + 印)).length, { timeout: 30_000 })
    .toBe(1);

  // 部員1・部員2（前の版）
  const M1 = await 端末を作る(browser, '部員1');
  await M1.page.goto(主 + '/');
  await 個人で入る(M1.page, 人[0].個人ID);
  await expect
    .poll(async () => ((await 控え(M1.page)).sessions || []).some((x) => x && x.id === 前の記録id), {
      timeout: 60_000,
    })
    .toBe(true);
  {
    const r = (await 控え(M1.page)).sessions.find((x) => x.id === 前の記録id);
    記す('前の版の部員1の端末に、ほかの人の列（○×）がある', (r.archers[1].marks || []).join(''));
  }
  await 記録を付けて保存(M1.page, '前の版の部員1で送った' + 印);
  await expect
    .poll(async () => (await 雲の記録を題で('前の版の部員1で送った' + 印)).length, { timeout: 30_000 })
    .toBe(1);
  await expect
    .poll(async () => (await 手元の記録(M1.page, '前の版の部員1で送った' + 印))?.syncStatus, {
      timeout: 30_000,
    })
    .toBe('同期済み');
  await 雲を止める(M1.page);
  await 記録を付けて保存(M1.page, '前の版の部員1で送れていない' + 印);
  expect((await 手元の記録(M1.page, '前の版の部員1で送れていない' + 印))?.syncStatus).toBe('未同期');

  const M2 = await 端末を作る(browser, '部員2');
  await M2.page.goto(二 + '/');
  await 個人で入る(M2.page, 人[1].個人ID);
  await M2.page.waitForTimeout(3000);
  await 雲を止める(M2.page);
  await 記録を付けて保存(M2.page, '前の版の部員2で送れていない' + 印);
  expect((await 手元の記録(M2.page, '前の版の部員2で送れていない' + 印))?.syncStatus).toBe('未同期');

  const M3 = await 端末を作る(browser, '部員3');
  await M3.page.goto(別 + '/');
  await 個人で入る(M3.page, 人[2].個人ID);
  await 記録を付けて保存(M3.page, '前の版の部員3で送った' + 印);
  await expect
    .poll(async () => (await 雲の記録を題で('前の版の部員3で送った' + 印)).length, { timeout: 30_000 })
    .toBe(1);

  // 控えを書き出させてから入れ替える
  for (const 端 of [G, M1, M2, M3]) await 端.page.evaluate(() => globalThis.__弓道の控えを書く?.());
  await G.page.waitForTimeout(1500);
  // 前の版は管理者モードを控えに残していた（期限なし）。管理者モードのまま閉じた団体の端末の形にする
  await G.page.addInitScript(() => {
    if (sessionStorage.getItem('検査：管理者モードを入れた')) return;
    sessionStorage.setItem('検査：管理者モードを入れた', '1');
    const 中 = JSON.parse(localStorage.getItem('archery-score-storage') || '{}');
    中.state = Object.assign({}, 中.state || {}, { isAdminMode: true });
    localStorage.setItem('archery-score-storage', JSON.stringify(中));
  });

  // ── アプリを配る（決まりはまだ前） ──
  配る束[8097] = 新しい束;
  await 雲を戻す(M1.page);
  await M1.page.goto(主 + '/');
  await 画面が出るまで待つ(M1.page);
  await expect(M1.page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(async () => (await 控え(M1.page)).雲の境目?.取り方, {
      timeout: 60_000,
      message: '新しい版の部員1が中継でそろえない',
    })
    .toBe('中継');
  await expect
    .poll(async () => (await 手元の記録(M1.page, '前の版の部員1で送れていない' + 印))?.syncStatus, {
      timeout: 30_000,
    })
    .toBe('同期済み');
  {
    const 雲 = (await 雲の記録を題で('前の版の部員1で送れていない' + 印))[0];
    記す('決まりの前に新しい版が送り直した記録の作った人', 雲?.fields?.createdBy?.stringValue ?? '(無し)');
    const 状 = await 控え(M1.page);
    const r0 = 状.sessions.find((x) => x.id === 前の記録id);
    記す(
      '新しい版の部員1：前の団体の記録のほかの人の列',
      r0 ? (r0.archers[1].marks || []).join('') : '(記録が無い)'
    );
    記す('新しい版の部員1：ゴミ箱の数', (状.trash || []).length);
    記す('新しい版の部員1：記録の数', (状.sessions || []).length);
    記す('新しい版の部員1：入り直しの案内', await 入り直しの案内が出ているか(M1.page));
  }

  await G.page.goto(主 + '/');
  await 画面が出るまで待つ(G.page);
  await expect(G.page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 60_000 });
  await G.page.waitForTimeout(3000);
  {
    const 状 = await 控え(G.page);
    記す('新しい版の団体：管理者モード（前の版の控え）', {
      isAdminMode: 状.isAdminMode,
      期限: 状.管理者の期限 ?? null,
    });
    // 前の版の期限の無い管理者モードは切る（合言葉で入り直す。残すと招待リンク・役が決まりに断られる）
    expect(状.isAdminMode, '前の版の管理者モードが新しい版でも残った').toBe(false);
  }
  await 記録を付けて保存(G.page, '新しい版の団体で保存（決まりの前）' + 印);
  await expect
    .poll(async () => (await 雲の記録を題で('新しい版の団体で保存（決まりの前）' + 印)).length, {
      timeout: 30_000,
    })
    .toBe(1);
  {
    const 雲 = (await 雲の記録を題で('新しい版の団体で保存（決まりの前）' + 印))[0];
    記す('決まりの前：団体の保存の作った人', 雲?.fields?.createdBy?.stringValue ?? '(無し)');
    記す('決まりの前：記録が変わった印（前の決まりでは書けない）', !!(await 雲から読む('changes/sessions')));
  }

  // ── 決まりを配る ──
  await 決まりを置く(fs.readFileSync('firestore.rules', 'utf8'));
  await G.page.waitForTimeout(2000);
  const 印の前 = (await 雲から読む('changes/sessions'))?.fields?.at?.timestampValue || '';
  await 記録を付けて保存(G.page, '新しい版の団体で保存（決まりのあと）' + 印);
  await expect
    .poll(async () => (await 雲から読む('changes/sessions'))?.fields?.at?.timestampValue || '', {
      timeout: 30_000,
      message: '決まりのあと、団体の端末の保存で記録が変わった印が進まない',
    })
    .not.toBe(印の前);
  // ほかの端末（団体）が部員1の列のある記録を保存した形 → 部員1の端末に開いたまま届く
  const 決まりのあとの記録id = 'e2e-up-r1-' + 印;
  const 今2 = new Date().toISOString();
  await 雲へ書く(`sessions/${決まりのあとの記録id}`, {
    id: 字(決まりのあとの記録id),
    title: 字('決まりのあとの団体の記録' + 印),
    date: { timestampValue: 今2 },
    lastModified: { timestampValue: 今2 },
    shotCount: { integerValue: '4' },
    createdBy: 字('group'),
    archerNames: 字の並び([人[0].名, 人[1].名]),
    archers: {
      arrayValue: { values: [列('a1', 人[0], ['○', '○', '×', '○']), 列('a2', 人[1], ['×', '×', '×', '×'])] },
    },
  });
  await 雲へ書く('changes/sessions', { at: { timestampValue: new Date().toISOString() } });
  const 届いたか = (上限) =>
    expect
      .poll(async () => !!(await 手元の記録(M1.page, '決まりのあとの団体の記録' + 印)), { timeout: 上限 })
      .toBe(true)
      .then(() => true)
      .catch(() => false);
  // 決まりの前に見張りを付けた端末は断られて止まっている。張り直しの待ち（30 秒から倍に）しだいで届く
  記す('決まりのあと：決まりの前に新しい版を開いた部員1の端末に、開いたまま届く', await 届いたか(40_000));
  if (!(await 手元の記録(M1.page, '決まりのあとの団体の記録' + 印))) {
    // アプリに戻った形（visibilitychange）で取り直す（止まった見張りもすぐ張り直す）
    await M1.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(await 届いたか(30_000), 'アプリに戻っても取り直さない').toBe(true);
  }
  // 張り直した見張りで、次のほかの端末の保存は開いたまま届く
  {
    const id = 'e2e-up-r2-' + 印;
    const 今3 = new Date().toISOString();
    await 雲へ書く(`sessions/${id}`, {
      id: 字(id),
      title: 字('決まりのあとの団体の記録2' + 印),
      date: { timestampValue: 今3 },
      lastModified: { timestampValue: 今3 },
      shotCount: { integerValue: '4' },
      createdBy: 字('group'),
      archerNames: 字の並び([人[0].名]),
      archers: { arrayValue: { values: [列('a1', 人[0], ['×', '○', '×', '○'])] } },
    });
    await M1.page.waitForTimeout(1000);
    await 雲へ書く('changes/sessions', { at: { timestampValue: new Date().toISOString() } });
    await expect
      .poll(async () => !!(await 手元の記録(M1.page, '決まりのあとの団体の記録2' + 印)), {
        timeout: 40_000,
        message: '張り直したあとも、ほかの端末の保存が開いたまま届かない',
      })
      .toBe(true);
  }
  // 部員1が保存する（自分の行の無い記録なので、送れたあとは端末から外れる。雲で見る）
  await 記録を付けて保存(M1.page, '新しい版の部員1で保存（決まりのあと）' + 印);
  await expect
    .poll(async () => (await 雲の記録を題で('新しい版の部員1で保存（決まりのあと）' + 印)).length, {
      timeout: 30_000,
    })
    .toBe(1);
  {
    const 雲 = (await 雲の記録を題で('新しい版の部員1で保存（決まりのあと）' + 印))[0];
    記す('決まりのあと：部員1の保存の作った人', 雲?.fields?.createdBy?.stringValue ?? '(無し)');
    記す('決まりのあと：部員1の入り直しの案内', await 入り直しの案内が出ているか(M1.page));
  }

  // 団体の端末：前の版の管理者モードは切れているので、メンバーの編集に招待リンクの欄は出ない（合言葉で入り直してから）
  await G.page.getByText('メンバー', { exact: true }).first().click();
  await G.page.getByText(人[0].名, { exact: true }).first().click();
  記す(
    '新しい版の団体（管理者モードを切った）：メンバーの編集に招待リンクの欄が出る',
    await G.page
      .getByTestId('招待リンクの欄')
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false)
  );

  // 部員2：前の版で送れていない記録を持ったまま、決まりのあとに新しい版を開く（Firestore の送り待ちが先に出る）
  配る束[8099] = 新しい束;
  await 雲を戻す(M2.page);
  await M2.page.goto(二 + '/');
  await 画面が出るまで待つ(M2.page);
  await expect(M2.page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(
      async () => {
        const r = await 手元の記録(M2.page, '前の版の部員2で送れていない' + 印);
        return r
          ? r.syncStatus === '同期済み'
            ? '同期済み'
            : r.送れない
              ? '送れない'
              : r.syncStatus
          : '無い';
      },
      { timeout: 60_000 }
    )
    .not.toBe('未同期')
    .catch(() => {});
  {
    const r = await 手元の記録(M2.page, '前の版の部員2で送れていない' + 印);
    const 雲 = (await 雲の記録を題で('前の版の部員2で送れていない' + 印))[0];
    記す('決まりのあと：部員2の前の版の送れていない記録', {
      手元: r ? { syncStatus: r.syncStatus, 送れない: !!r.送れない } : null,
      雲にある: !!雲,
      雲の作った人: 雲?.fields?.createdBy?.stringValue ?? '(無し)',
    });
    // 前の版の送り待ちが先に雲へ届いている。届いた扱い（送れないの知らせを出さない）
    expect(r && r.syncStatus, '雲に届いている前の版の記録が、送れないのまま').toBe('同期済み');
    await M2.page.getByText('設定', { exact: true }).first().click();
    await expect(M2.page.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 15_000 });
    const 知らせ = await M2.page
      .getByTestId('断られた記録')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    記す('決まりのあと：部員2の設定の「送れない記録」の知らせ', 知らせ);
    expect(知らせ, '届いている記録で「送れない記録」と知らせた').toBe(false);
    記す('決まりのあと：部員2の入り直しの案内', await 入り直しの案内が出ているか(M2.page));
  }

  // 部員3：前の版のまま（決まりのあとに開き直した）→ そのあと新しい版へ
  await M3.page.goto(別 + '/');
  await 画面が出るまで待つ(M3.page);
  await M3.page.waitForTimeout(10000);
  記す('前の版のまま決まりのあと：部員3の入り直しの案内', await 入り直しの案内が出ているか(M3.page));
  配る束[8098] = 新しい束;
  await M3.page.goto(別 + '/');
  await 画面が出るまで待つ(M3.page);
  await expect(M3.page.getByText('終了・保存', { exact: true })).toBeVisible({ timeout: 60_000 });
  await expect.poll(async () => (await 控え(M3.page)).雲の境目?.取り方, { timeout: 60_000 }).toBe('中継');
  await M3.page.waitForTimeout(3000);
  {
    const 状 = await 控え(M3.page);
    記す('新しい版へ入れ替えたあと：部員3の入り直しの案内', await 入り直しの案内が出ているか(M3.page));
    記す(
      '新しい版へ入れ替えたあと：部員3の記録',
      (状.sessions || []).map((x) => x.title).filter((t) => t && t.includes(印))
    );
  }

  for (const 端 of [G, M1, M2, M3]) await 端.場.close();
});
