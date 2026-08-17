/**
 * ライブ記録を2台・3台で確かめる。本物の Firebase（検証環境）につなぐ。
 *
 * 見たいのは2点。同時に入れた○×が全員に届くこと。そして共有の取り消しが
 * 1手だけ戻し、相手の手を飲み込まないこと。
 *
 * 場所取りを手元の目印だけで決めていたころは、2台が同じ番号に書き合い、
 * 後から書いたほうが先の手を上書きしていた。上書きされた手は
 * 「相手の入力を含まない盤面」を前として持つため、取り消すと相手の○×まで
 * 消える。単体検査は偽のRTDBで通るが、本物で確かめたことが無かった。
 *
 * 検証環境の団体（撮影用）を使い、終わったらライブの枝を消す。
 */
import { test, expect } from '@playwright/test';

const 団体 = '100006';
const 合言葉 = 'StgTest!2026';
// ライブ名は検査ごとに作る。ここ（読み込み時）で決めると、画面の種類が
// 変わっても同じ名前になり、2つ目以降は「同名あり」で開始できない。
// 参加側は前の実行の古い盤面を掴み、原因の分かりにくい失敗になる
const ライブ名を作る = (印) => {
  const 名 = 印 + Date.now() + Math.floor(Math.random() * 1000);
  作ったライブ.push(名);
  return 名;
};

/**
 * この実行で作ったライブ。終わったら消す。
 *
 * 消さずに溜めていたら検証環境に30件たまり、参加一覧の読み込みが重くなって
 * 3台の検査が時間切れになった。「端末が多くて重い」と考えて持ち時間を
 * 延ばしたが、本当の原因は後始末をしていなかったこと。
 */
const 作ったライブ = [];

// 検査ごとに片付ける。afterAll だと最後の検査より先に走ることがあり、
// そのぶんが消し残る（実際、3件中1件が残った）
test.afterEach(async () => {
  if (!作ったライブ.length) return;
  const { execFileSync } = await import('node:child_process');
  const fs = await import('node:fs');
  const path = await import('node:path');

  // firebase.cmd は Node 20 以降 execFile から直に起動できない（EINVAL）。
  // CLI の実体（JS）を node で呼ぶ。stamp-live-release-day.mjs と同じ手口。
  // 前はここで .cmd を呼んで毎回失敗しており、しかも例外を握りつぶして
  // いたので「消しました」とだけ出て、実際には消えていなかった
  const CLI = [
    path.join(process.env.APPDATA || '', 'npm/node_modules/firebase-tools/lib/bin/firebase.js'),
    '/usr/local/lib/node_modules/firebase-tools/lib/bin/firebase.js',
    '/usr/lib/node_modules/firebase-tools/lib/bin/firebase.js',
  ].find((p) => p && fs.existsSync(p));

  const 失敗 = [];
  const 消す = (道) => {
    if (!CLI) return void 失敗.push(道 + '（firebase-tools が見つからない）');
    try {
      execFileSync(
        process.execPath,
        [CLI, 'database:remove', 道, '--project', 'kyudoscoremanager-stg', '--force'],
        { stdio: 'ignore' }
      );
    } catch (e) {
      失敗.push(道 + '（' + String(e.message).slice(0, 60) + '）');
    }
  };
  // 消したぶんは一覧から外す。残すと次の検査で消し直そうとする
  const 今回 = 作ったライブ.splice(0, 作ったライブ.length);
  for (const 名 of 今回) {
    消す(`/live_sessions/${団体}/${名}`);
    消す(`/live_history/${団体}/${名}`);
  }
  if (失敗.length) {
    console.log(`後片付け: ${今回.length} 件のうち ${失敗.length} 件を消せませんでした`);
    失敗.forEach((x) => console.log('   ' + x));
  } else {
    console.log(`後片付け: ライブ ${今回.length} 件を消しました`);
  }
});

async function 入る(page) {
  await page.goto('/');
  await page.waitForTimeout(3000);
  const 番号欄 = page.getByPlaceholder('例: 123456');
  if (await 番号欄.isVisible().catch(() => false)) {
    await 番号欄.click();
    await 番号欄.pressSequentially(団体, { delay: 20 });
    const 合言葉欄 = page.locator('input[type="password"]').first();
    await 合言葉欄.click();
    await 合言葉欄.pressSequentially(合言葉, { delay: 20 });
    await page.getByText('ログイン', { exact: true }).click();
    await page.waitForTimeout(9000);
  }
  await page.evaluate(() => localStorage.setItem('tutorialDoneVersion', '2026-08-13-01'));
  await page.reload();
  await page.waitForTimeout(4000);
}

/**
 * 射手ごとの1射目のますを返す。
 * testID は ます-<射手id>-<射番>。射手idにも「-」が入るので、
 * 後ろから読む（最後が射番、あいだが射手id）
 */
async function 一射目たち(page) {
  return page.evaluate(() => {
    // その座標で本当に押せる ます だけを拾う。
    // iPhone のように縦が短い画面では、1射目の行が下端で切れていたり、
    // 下の操作バーに隠れていたりする。矩形だけ見ていると「在る」と誤解し、
    // 何も無いところを押してしまう（○×が入らない原因になっていた）
    const 押せる = new Map();
    document.querySelectorAll('[data-testid^="ます-"]').forEach((el) => {
      const 印 = el.getAttribute('data-testid');
      const 部 = 印.split('-');
      const 射番 = Number(部[部.length - 1]);
      const 射手 = 部.slice(1, -1).join('-');
      const r = el.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return;
      const x = Math.round(r.x + r.width / 2);
      const y = Math.round(r.y + r.height / 2);
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return;
      const 最前面 = document.elementFromPoint(x, y);
      if (!最前面 || !(el === 最前面 || el.contains(最前面))) return;
      if (!押せる.has(射番)) 押せる.set(射番, []);
      押せる.get(射番).push({ 印, 射手, x, y });
    });
    // 射手ごとに1つずつ揃う射番のうち、いちばん小さいものを使う
    const 射手の数 = new Set();
    押せる.forEach((一覧) => 一覧.forEach((c) => 射手の数.add(c.射手)));
    const 候補 = [...押せる.keys()].sort((a, b) => a - b);
    for (const 番 of 候補) {
      const 一覧 = 押せる.get(番);
      if (一覧.length === 射手の数.size) return 一覧;
    }
    return 候補.length ? 押せる.get(候補[0]) : [];
  });
}
/**
 * 台どうしの見え方が揃うまで待つ。固定の待ち時間だと、遅い画面で
 * 揃う前に読んでしまい、実際には合っているのに食い違いとして落ちる。
 * 揃わないまま上限に達したら、最後に読んだ値を返す（そこで落ちる）
 */
async function 揃うまで待つ(読む, 上限 = 20000) {
  const 始め = Date.now();
  let 最後 = null;
  while (Date.now() - 始め < 上限) {
    最後 = await 読む();
    const 並び = 最後.map((x) => JSON.stringify(x));
    if (並び.every((x) => x === 並び[0])) return 最後;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return 最後;
}

const 中身 = (page, 鍵) =>
  page.evaluate((k) => {
    const el = document.querySelector(`[data-testid="${k}"]`);
    return el ? (el.innerText || '').trim() : null;
  }, 鍵);

test('ライブ：同時に入れた○×が両方に届き、取り消しは1手だけ戻す', async ({ browser }) => {
  test.setTimeout(300_000);
  const ライブ名 = ライブ名を作る('chk');
  const 主 = await browser.newContext();
  const 参 = await browser.newContext();
  const A = await 主.newPage();
  const B = await 参.newPage();

  // ── 主催者側を用意する ──
  await 入る(A);
  for (let i = 0; i < 3; i++) {
    await A.getByText('人', { exact: true }).first().click();
    await A.waitForTimeout(1200);
  }
  const A側 = await 一射目たち(A);
  expect(A側.length, '射手が3人立っていない').toBe(3);

  await A.getByText('ライブ', { exact: true }).first().click();
  await A.waitForTimeout(1500);
  await A.getByText('ライブ記録を開始', { exact: true }).click();
  await A.waitForTimeout(1500);
  const 名欄 = A.getByPlaceholder('session_name_123');
  await 名欄.click();
  await 名欄.pressSequentially(ライブ名, { delay: 20 });
  await A.getByText('決定', { exact: true }).click();
  await A.waitForTimeout(8000);
  await expect(A.getByText(new RegExp('ライブ中')), 'A がライブに入っていない').toBeVisible();

  // ── 参加者側をつなぐ ──
  await 入る(B);
  await B.getByText('ライブ', { exact: true }).first().click();
  await B.waitForTimeout(1500);
  await B.getByText('ライブ記録に参加', { exact: true }).click();
  await B.waitForTimeout(3000);
  await B.getByText(ライブ名, { exact: true }).first().click();
  await B.waitForTimeout(500);
  await B.getByText('決定', { exact: true }).click();
  await B.waitForTimeout(8000);

  const B側 = await 一射目たち(B);
  expect(B側.length, '参加側に盤面が届いていない').toBe(3);

  // ── ここが本題。2台が同時に、別々の射手へ入れる ──
  // 座標は押す直前に測り直す。ライブが始まると上に「ライブ中」の帯が出て、
  // 盤面が下へずれる。並び順は2台で揃うとは限らないので、印で突き合わせる
  const 表にする = (一覧) => Object.fromEntries(一覧.map((x) => [x.印, x]));
  const A表 = 表にする(await 一射目たち(A));
  const B表 = 表にする(await 一射目たち(B));
  const 共通 = Object.keys(A表)
    .filter((k) => B表[k])
    .sort();
  expect(共通.length, '2台に共通の射手が2人いない').toBeGreaterThanOrEqual(2);
  const [A鍵, B鍵] = 共通;

  // まず片方だけ動かして、そもそも同期が生きているかを見る（切り分け）
  const 見本 = 共通[2] || null;
  if (見本) {
    await A.mouse.click(A表[見本].x, A表[見本].y);
    await A.waitForTimeout(6000);
    console.log('片方だけ入れたとき  A:', await 中身(A, 見本), '/ B:', await 中身(B, 見本));
  } else {
    console.log('（3人目がいないので片方だけの確認は省略）');
  }

  await Promise.all([
    A.mouse.click(A表[A鍵].x, A表[A鍵].y),
    B.mouse.click(B表[B鍵].x, B表[B鍵].y),
  ]);
  await A.waitForTimeout(6000);
  await B.waitForTimeout(1000);

  const 入れた後 = [
    await 中身(A, A鍵),
    await 中身(A, B鍵),
    await 中身(B, A鍵),
    await 中身(B, B鍵),
  ];
  console.log('入れた直後 [A:A手, A:B手, B:A手, B:B手] =', JSON.stringify(入れた後));
  expect(入れた後[0], 'A の手が入っていない').toBe('○');
  expect(入れた後[3], 'B の手が入っていない').toBe('○');
  expect(入れた後[1], 'B の手が A に届いていない').toBe('○');
  expect(入れた後[2], 'A の手が B に届いていない').toBe('○');

  // ── 取り消しは1手だけ戻すこと。相手の手を巻き込まない ──
  await A.locator('[data-testid="取り消し"]').click();
  await A.waitForTimeout(6000);
  await B.waitForTimeout(1000);

  const 残り = [
    await 中身(A, A鍵),
    await 中身(A, B鍵),
    await 中身(B, A鍵),
    await 中身(B, B鍵),
  ];
  console.log('取り消し後 [A:A手, A:B手, B:A手, B:B手] =', JSON.stringify(残り));

  const 残った数 = 残り.slice(0, 2).filter((x) => x === '○').length;
  expect(残った数, '取り消し1回で両方消えた（相手の手を飲み込んでいる）').toBe(1);
  expect(残り[0], 'A と B で見え方が違う').toBe(残り[2]);
  expect(残り[1], 'A と B で見え方が違う').toBe(残り[3]);
});

test('ライブ：3台が同時に入れても届き、取り消しは1手だけ戻す', async ({ browser }) => {
  // 3台を WebKit（iPhone）で動かすと重く、7分では足りずに時間切れになっていた。
  // 端末が1つ増えるぶん、参加の手順も突き合わせも増える
  test.setTimeout(900_000);
  const 名 = ライブ名を作る('chk3');
  const 文脈 = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
  const [A, B, C] = await Promise.all(文脈.map((c) => c.newPage()));

  // ── 主催者：射手を3人立ててライブを始める ──
  await 入る(A);
  for (let i = 0; i < 3; i++) {
    await A.getByText('人', { exact: true }).first().click();
    await A.waitForTimeout(1200);
  }
  await A.getByText('ライブ', { exact: true }).first().click();
  await A.waitForTimeout(1500);
  await A.getByText('ライブ記録を開始', { exact: true }).click();
  await A.waitForTimeout(1500);
  const 名欄 = A.getByPlaceholder('session_name_123');
  await 名欄.click();
  await 名欄.pressSequentially(名, { delay: 20 });
  await A.getByText('決定', { exact: true }).click();
  await A.waitForTimeout(8000);
  await expect(A.getByText(new RegExp('ライブ中')), 'A がライブに入っていない').toBeVisible();

  // ── 参加者を2台つなぐ ──
  for (const P of [B, C]) {
    await 入る(P);
    await P.getByText('ライブ', { exact: true }).first().click();
    await P.waitForTimeout(1500);
    await P.getByText('ライブ記録に参加', { exact: true }).click();
    await P.waitForTimeout(3000);
    await P.getByText(名, { exact: true }).first().click();
    await P.waitForTimeout(500);
    await P.getByText('決定', { exact: true }).click();
    await P.waitForTimeout(8000);
  }

  // ── 3台に共通の射手を3人ぶん見つける ──
  const 表にする = (一覧) => Object.fromEntries(一覧.map((x) => [x.印, x]));
  const 表 = { A: 表にする(await 一射目たち(A)), B: 表にする(await 一射目たち(B)), C: 表にする(await 一射目たち(C)) };
  const 共通 = Object.keys(表.A)
    .filter((k) => 表.B[k] && 表.C[k])
    .sort();
  expect(共通.length, '3台に共通の射手が3人いない').toBeGreaterThanOrEqual(3);
  const [鍵A, 鍵B, 鍵C] = 共通;

  // ── 3台が同時に、別々の射手へ入れる ──
  await Promise.all([
    A.mouse.click(表.A[鍵A].x, 表.A[鍵A].y),
    B.mouse.click(表.B[鍵B].x, 表.B[鍵B].y),
    C.mouse.click(表.C[鍵C].x, 表.C[鍵C].y),
  ]);
  await A.waitForTimeout(8000);

  const 全部見る = async () => {
    const 出 = {};
    for (const [名前, P] of [['A', A], ['B', B], ['C', C]]) {
      出[名前] = [await 中身(P, 鍵A), await 中身(P, 鍵B), await 中身(P, 鍵C)];
    }
    return 出;
  };

  const 入れた後 = await 全部見る();
  console.log('入れた直後 =', JSON.stringify(入れた後));
  for (const 名前 of ['A', 'B', 'C']) {
    expect(入れた後[名前], `${名前} に3つとも届いていない`).toEqual(['○', '○', '○']);
  }

  // ── 1台が取り消す。他2台の手は残ること ──
  await A.locator('[data-testid="取り消し"]').click();
  await A.waitForTimeout(3000);

  const 揃った = await 揃うまで待つ(async () => {
    const x = await 全部見る();
    return [x.A, x.B, x.C];
  });
  const 残り = { A: 揃った[0], B: 揃った[1], C: 揃った[2] };
  console.log('取り消し後 =', JSON.stringify(残り));

  const 残った数 = 残り.A.filter((x) => x === '○').length;
  expect(残った数, '取り消し1回で2手以上消えた').toBe(2);
  expect(残り.B, 'A と B で見え方が違う').toEqual(残り.A);
  expect(残り.C, 'A と C で見え方が違う').toEqual(残り.A);
});

test('ライブ：鍵の取り消しが、相手の○×を巻き込まない', async ({ browser }) => {
  test.setTimeout(420_000);
  const 名 = ライブ名を作る('chkL');
  console.log('ライブ名=', 名);
  const [主, 参] = await Promise.all([browser.newContext(), browser.newContext()]);
  const A = await 主.newPage();
  const B = await 参.newPage();

  await 入る(A);
  for (let i = 0; i < 2; i++) {
    await A.getByText('人', { exact: true }).first().click();
    await A.waitForTimeout(1200);
  }
  // 間隔の列を足す。鍵ボタンはこの列に付く
  const 前の印 = (await 一射目たち(A)).map((x) => x.印);
  await A.getByText('間隔', { exact: true }).first().click();
  await A.waitForTimeout(1500);
  const 間隔の印 = (await 一射目たち(A)).map((x) => x.印).find((k) => !前の印.includes(k));
  expect(間隔の印, '間隔の列が増えていない').toBeTruthy();
  const 間隔id = 間隔の印.slice('ます-'.length, -2);

  await A.getByText('ライブ', { exact: true }).first().click();
  await A.waitForTimeout(1500);
  await A.getByText('ライブ記録を開始', { exact: true }).click();
  await A.waitForTimeout(1500);
  const 名欄 = A.getByPlaceholder('session_name_123');
  await 名欄.click();
  await 名欄.pressSequentially(名, { delay: 20 });
  await A.getByText('決定', { exact: true }).click();
  await A.waitForTimeout(8000);
  await expect(A.getByText(new RegExp('ライブ中')), 'A がライブに入っていない').toBeVisible();

  await 入る(B);
  await B.getByText('ライブ', { exact: true }).first().click();
  await B.waitForTimeout(1500);
  await B.getByText('ライブ記録に参加', { exact: true }).click();
  await B.waitForTimeout(3000);
  await B.getByText(名, { exact: true }).first().click();
  await B.waitForTimeout(500);
  await B.getByText('決定', { exact: true }).click();
  await B.waitForTimeout(8000);

  // B が○を入れる射手（間隔ではない側）
  const B表 = Object.fromEntries((await 一射目たち(B)).map((x) => [x.印, x]));
  const B鍵 = Object.keys(B表)
    .filter((k) => !k.startsWith(`ます-${間隔id}-`))
    .sort()[0];
  expect(B鍵, '参加側に射手が届いていない').toBeTruthy();

  // A が押す鍵の位置（間隔の列の、立ちの上端のます）
  const 鍵の場所 = await A.evaluate((id) => {
    const el = document.querySelector(`[data-testid="ます-${id}-7"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  }, 間隔id);
  expect(鍵の場所, '鍵のますが見つからない').toBeTruthy();

  // ── B が○を入れ、そのあと A が鍵をかける ──
  // 同時に押すと、控えの最後がどちらの操作か決まらない。共有の取り消しは
  // 「最後の1手」を戻すので、B の○が最後なら戻るのが正しい。
  // ここで見たいのは「鍵を取り消したときに相手の○×を巻き込まないか」なので、
  // 鍵が最後になるよう順を決める
  await B.mouse.click(B表[B鍵].x, B表[B鍵].y);
  await B.waitForTimeout(6000);
  await A.mouse.click(鍵の場所.x, 鍵の場所.y);
  await A.waitForTimeout(8000);

  console.log('B鍵=', B鍵);
  expect(await 中身(B, B鍵), 'B の○が入っていない').toBe('○');
  expect(await 中身(A, B鍵), 'B の○が A に届いていない').toBe('○');

  // ── A が取り消す。鍵だけ外れ、B の○は残ること ──
  await A.locator('[data-testid="取り消し"]').click();
  await A.waitForTimeout(8000);

  const 残り = [await 中身(A, B鍵), await 中身(B, B鍵)];
  console.log('鍵を取り消したあと [A, B] =', JSON.stringify(残り));
  expect(残り[0], '取り消しで B の○まで消えた').toBe('○');
  expect(残り[1], 'A と B で見え方が違う').toBe('○');
});
