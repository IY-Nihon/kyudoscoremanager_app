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
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  こうなるまで待つ,
  確かに打つ,
} from './helpers.mjs';
// 共有リンクから枝を割り出して、あとで片付けるために使う
import { URLから荷を取る, 共有の荷を解く, 枝を導く } from '../src/liveShare.js';

const 団体 = '100006';

// ここを mode: 'parallel' にすると、1件が2〜3台の browser を開くため
// iPhone(WebKit) で機を占め、同じ機で走る他の検査を押しのける。
// 実測で全体 23.2分 → 29.0分に延び、案内の検査が時間切れになった。
// 束（ファイル）どうしの並列だけに留める

// ここは主催と参加で端末を2〜3台使い、台ごとに入り直す作りになっている。
// 控えを当てると、主催の台がライブを始められなくなって落ちた（「ライブ中」が出ない）。
// 台ごとの入り方をこの検査が自分で決めているので、控えは使わない
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

/**
 * 共有で作った枝。ライブ名と別に控える。
 *
 * 共有したライブは団体の枝ではなく、そのライブ専用の枝に載る（src/liveShare.js）。
 * ライブ名だけで消しにいっても当たらず、検証環境に溜まっていく
 */
const 作った共有の枝 = [];

/**
 * ライブを置く枝の名前。団体IDではなく団体ごとの合言葉（src/liveSecret.js）。
 * 画面が持っているものを借りる。ここが空だと片付けが当たらず、
 * 検証環境にライブが溜まって参加一覧が重くなる（上の説明を参照）
 */
let ライブの枝 = null;

// 検査ごとに片付ける。afterAll だと最後の検査より先に走ることがあり、
// そのぶんが消し残る（実際、3件中1件が残った）
test.afterEach(async () => {
  if (!作ったライブ.length) return;
  if (!ライブの枝) {
    console.log(`後片付け: 枝の名前が取れず、${作ったライブ.length} 件を消せませんでした`);
    作ったライブ.length = 0;
    return;
  }
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
    消す(`/live_sessions/${ライブの枝}/${名}`);
    消す(`/live_history/${ライブの枝}/${名}`);
    // 在席も別の枝にある。消し忘れると検証環境に溜まる（上の説明と同じ轍）
    消す(`/live_presence/${ライブの枝}/${名}`);
  }
  for (const 枝 of 作った共有の枝.splice(0, 作った共有の枝.length)) {
    消す(`/live_sessions/${枝}`);
    消す(`/live_history/${枝}`);
    消す(`/live_presence/${枝}`);
    消す(`/live_view/${枝}`);
    // 有効期限も別の根にある。消し忘れると検証環境に溜まり続ける。
    // ここは firebase CLI（管理の資格）で消すので、決まりの「中身が
    // 残っているうちは消せない」には掛からない
    消す(`/live_limits/${枝}`);
  }
  if (失敗.length) {
    console.log(`後片付け: ${今回.length} 件のうち ${失敗.length} 件を消せませんでした`);
    失敗.forEach((x) => console.log('   ' + x));
  } else {
    console.log(`後片付け: ライブ ${今回.length} 件を消しました`);
  }
});

async function 入る(page) {
  // 案内とお知らせは開く前に止める（helpers.mjs の説明を参照）
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  // 読み込み中の画面でも「出た」になるので、ログイン欄が出るか、
  // もう入っているかが決まるまで待つ（飛ばすとログイン画面のまま進む）
  await 入り口が決まるまで待つ(page);
  const 番号欄 = page.getByPlaceholder('例: 123456');
  if (await 番号欄.isVisible().catch(() => false)) {
    await 番号欄.click();
    await 番号欄.pressSequentially(団体, { delay: 20 });
    const 合言葉欄 = page.locator('input[type="password"]').first();
    await 合言葉欄.click();
    await 合言葉欄.pressSequentially(合言葉, { delay: 20 });
    await page.getByText('ログイン', { exact: true }).click();
    // 決まった秒数で待たない。iPhone(WebKit) では9秒に収まらないことがあり、
    // 収まらないとログイン画面のまま先へ進んで、まったく別の顔で落ちる
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
    // 認証の保存（IndexedDB）が書き終わるまでの余裕。
    // ここは外から見える合図が無いので、決まった秒数のまま残してある。
    // 状態で待てるものは、ぜんぶ状態待ちに変えてある
    await page.waitForTimeout(1500);
  }
  // ライブを置く枝の合言葉を借りる。Firestore から取ってくるので、
  // ログインの直後にはまだ入っていないことがある。
  //
  // 上限は長めに。起動を1回にしたぶん、ここへ来るのが早くなり、
  // 30秒では WebKit で間に合わなかった（届けば即座に抜けるので代償は無い）
  if (!ライブの枝) {
    ライブの枝 = await expect
      .poll(
        () =>
          page.evaluate(() => {
            const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
            return (s.ライブの合言葉 || {}).合言葉 || null;
          }),
        { timeout: 90_000, message: 'ライブの合言葉が取れない' }
      )
      .not.toBeNull()
      .then(() =>
        page.evaluate(() => {
          const s = JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state || {};
          return (s.ライブの合言葉 || {}).合言葉 || null;
        })
      );
  }
  // ここで reload していたのをやめた（上の addInitScript が代わり）
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

/** そのますが ○ になるまで待つ。入れた直後の確認に使う */
function 印がつくまで待つ(page, 鍵, 印 = '○', 上限 = 20000) {
  return こうなるまで待つ(() => 中身(page, 鍵), (x) => x === 印, 上限);
}

/** 盤面（ます）が届くまで待つ。届いた一射目たちを返す */
async function 盤面を待つ(page, 上限 = 30000) {
  const 始め = Date.now();
  let 最後 = [];
  while (Date.now() - 始め < 上限) {
    最後 = await 一射目たち(page);
    if (最後.length) return 最後;
    // これは「待ち時間」ではなく、見に行く間隔。届いた時点で抜ける
    await page.waitForTimeout(1000);
  }
  return 最後;
}

/**
 * 射手を人数ぶん立てる。
 *
 * 押したあと「列が増えるまで」待つ。決まった秒数で待つと、遅い機種では
 * 増える前に次へ進み、まったく別の顔で落ちる（この repo で何度も踏んだ）
 */
async function 射手を立てる(page, 人数) {
  for (let i = 1; i <= 人数; i++) {
    await page.getByText('人', { exact: true }).first().click();
    await expect
      .poll(async () => (await 一射目たち(page)).length, {
        timeout: 20_000,
        message: `射手が ${i} 人に増えない`,
      })
      .toBeGreaterThanOrEqual(i);
  }
}

/** ライブを始める。帯（ライブ中）が出るところまで */
async function ライブを始める(page, ライブ名) {
  await page.getByText('ライブ', { exact: true }).first().click();
  const 開始 = page.getByText('ライブ記録を開始', { exact: true });
  await expect(開始, 'ライブの窓が開かない').toBeVisible({ timeout: 20_000 });
  await 開始.click();
  const 名欄 = page.getByPlaceholder('session_name_123');
  await expect(名欄, '名前の欄が出ない').toBeVisible({ timeout: 20_000 });
  await 確かに打つ(名欄, ライブ名);
  await expect(名欄, '名前が入りきっていない').toHaveValue(ライブ名, { timeout: 10_000 });
  await page.getByText('決定', { exact: true }).click();
  await expect(page.getByText(new RegExp('ライブ中')), 'ライブに入っていない').toBeVisible({
    timeout: 20_000,
  });
}

/**
 * ライブに参加する。役は「記録用」か「閲覧用」。
 *
 * 参加一覧はクラウドから来るので、決まった秒数で待つと、遅いときに
 * 空のまま押しにいく。一覧に名前が出るまで待つ。
 * 名前を押したあとは、名前の欄に入るのを待つ（決定はその欄が空だと効かない）
 */
async function ライブに参加する(page, ライブ名, 役 = '記録用') {
  await page.getByText('ライブ', { exact: true }).first().click();
  const 参加 = page.getByText('ライブ記録に参加', { exact: true });
  await expect(参加, 'ライブの窓が開かない').toBeVisible({ timeout: 20_000 });
  await 参加.click();
  const 印 = page.getByText(ライブ名, { exact: true }).first();
  await expect(印, `参加一覧に ${ライブ名} が出ない`).toBeVisible({ timeout: 40_000 });
  await 印.click();
  // ここに名前の欄は無い（開始の窓にしかない）。選べたかどうかの合図が
  // 画面に出ないので、決定を押して、次の窓が出るかで確かめる
  await page.getByText('決定', { exact: true }).click();
  const 選ぶ = page.getByText(役, { exact: true });
  await expect(選ぶ, '参加のしかたを選ぶ窓が出ない').toBeVisible({ timeout: 20_000 });
  await 選ぶ.click();
  await expect(page.getByText(new RegExp('ライブ中')), 'ライブに入れていない').toBeVisible({
    timeout: 20_000,
  });
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
  await 射手を立てる(A, 3);
  const A側 = await 一射目たち(A);
  expect(A側.length, '射手が3人立っていない').toBe(3);

  await ライブを始める(A, ライブ名);

  // ── 参加者側をつなぐ ──
  await 入る(B);
  // 参加のしかたを選ぶ窓が出る。検査は記録する側で入る
  await ライブに参加する(B, ライブ名);

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
    // 切り分けのための記録。届かなくてもここでは落とさない
    await こうなるまで待つ(
      async () => [await 中身(A, 見本), await 中身(B, 見本)],
      (x) => x.every((v) => v === '○'),
      15000
    );
    console.log('片方だけ入れたとき  A:', await 中身(A, 見本), '/ B:', await 中身(B, 見本));
  } else {
    console.log('（3人目がいないので片方だけの確認は省略）');
  }

  await Promise.all([
    A.mouse.click(A表[A鍵].x, A表[A鍵].y),
    B.mouse.click(B表[B鍵].x, B表[B鍵].y),
  ]);
  const 入れた後 = await こうなるまで待つ(
    async () => [
      await 中身(A, A鍵),
      await 中身(A, B鍵),
      await 中身(B, A鍵),
      await 中身(B, B鍵),
    ],
    (x) => x.every((v) => v === '○')
  );
  console.log('入れた直後 [A:A手, A:B手, B:A手, B:B手] =', JSON.stringify(入れた後));
  expect(入れた後[0], 'A の手が入っていない').toBe('○');
  expect(入れた後[3], 'B の手が入っていない').toBe('○');
  expect(入れた後[1], 'B の手が A に届いていない').toBe('○');
  expect(入れた後[2], 'A の手が B に届いていない').toBe('○');

  // ── 取り消しは1手だけ戻すこと。相手の手を巻き込まない ──
  await A.locator('[data-testid="取り消し"]').click();
  // 2台の見え方が揃い、○が1つだけ残るまで待つ。
  // 揃わないまま上限に達したら、そのあとの assert が落ちる
  const 残り = await こうなるまで待つ(
    async () => [
      await 中身(A, A鍵),
      await 中身(A, B鍵),
      await 中身(B, A鍵),
      await 中身(B, B鍵),
    ],
    (x) => x[0] === x[2] && x[1] === x[3] && x.slice(0, 2).filter((v) => v === '○').length === 1
  );
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
  await 射手を立てる(A, 3);
  await ライブを始める(A, 名);

  // ── 参加者を2台つなぐ ──
  for (const P of [B, C]) {
    await 入る(P);
    // 参加のしかたを選ぶ窓が出る。検査は記録する側で入る
    await ライブに参加する(P, 名);
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
  // 3台ぶんをまとめて読む。順に読むと1周が長くなり、見に行く間隔が空く
  const 全部見る = async () => {
    const 組 = await Promise.all(
      [['A', A], ['B', B], ['C', C]].map(async ([名前, P]) => [
        名前,
        await Promise.all([中身(P, 鍵A), 中身(P, 鍵B), 中身(P, 鍵C)]),
      ])
    );
    return Object.fromEntries(組);
  };

  const 入れた後 = await こうなるまで待つ(全部見る, (x) =>
    ['A', 'B', 'C'].every((名) => x[名].every((v) => v === '○'))
  );
  console.log('入れた直後 =', JSON.stringify(入れた後));
  for (const 名前 of ['A', 'B', 'C']) {
    expect(入れた後[名前], `${名前} に3つとも届いていない`).toEqual(['○', '○', '○']);
  }

  // ── 1台が取り消す。他2台の手は残ること ──
  await A.locator('[data-testid="取り消し"]').click();
  // 「3台が一致するまで」では足りない。取り消しが届く前も一致しており、
  // その場で返ってしまう（実際それで「3手残っている」と落ちた）。
  // 一致したうえで○が2つになるまで待つ
  const 揃った = await こうなるまで待つ(
    async () => {
      const x = await 全部見る();
      return [x.A, x.B, x.C];
    },
    (v) => {
      const 同じ = v.every((y) => JSON.stringify(y) === JSON.stringify(v[0]));
      return 同じ && v[0].filter((y) => y === '○').length === 2;
    }
  );
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
  await 射手を立てる(A, 2);
  // 間隔の列を足す。鍵ボタンはこの列に付く
  const 前の印 = (await 一射目たち(A)).map((x) => x.印);
  await A.getByText('間隔', { exact: true }).first().click();
  await こうなるまで待つ(
    async () => (await 一射目たち(A)).map((x) => x.印),
    (x) => x.some((k) => !前の印.includes(k)),
    20000
  );
  const 間隔の印 = (await 一射目たち(A)).map((x) => x.印).find((k) => !前の印.includes(k));
  expect(間隔の印, '間隔の列が増えていない').toBeTruthy();
  const 間隔id = 間隔の印.slice('ます-'.length, -2);

  await ライブを始める(A, 名);

  await 入る(B);
  // 参加のしかたを選ぶ窓が出る。検査は記録する側で入る
  await ライブに参加する(B, 名);

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
  // B の○が A に届いてから鍵をかける。届く前にかけると、
  // どちらが「最後の1手」なのかが入れ替わる
  await こうなるまで待つ(
    async () => [await 中身(B, B鍵), await 中身(A, B鍵)],
    (x) => x.every((v) => v === '○')
  );
  await A.mouse.click(鍵の場所.x, 鍵の場所.y);
  await こうなるまで待つ(
    async () => [await 中身(B, B鍵), await 中身(A, B鍵)],
    (x) => x.every((v) => v === '○')
  );

  console.log('B鍵=', B鍵);
  expect(await 中身(B, B鍵), 'B の○が入っていない').toBe('○');
  expect(await 中身(A, B鍵), 'B の○が A に届いていない').toBe('○');

  // ── A が取り消す。鍵だけ外れ、B の○は残ること ──
  await A.locator('[data-testid="取り消し"]').click();
  // 2台の見え方が揃うまで待つ。揃わなければ、そのあとの assert が落ちる
  const 残り = await こうなるまで待つ(
    async () => [await 中身(A, B鍵), await 中身(B, B鍵)],
    (x) => x[0] === x[1]
  );
  console.log('鍵を取り消したあと [A, B] =', JSON.stringify(残り));
  expect(残り[0], '取り消しで B の○まで消えた').toBe('○');
  expect(残り[1], 'A と B で見え方が違う').toBe('○');
});

test('ライブ：主催者が横・参加者が縦でも、○×は同じますに届く', async ({ browser }) => {
  // 並べ方は端末ごとの好み。2台で違っていても、届く先は同じ射手・同じ射番の
  // はずだが、横は ○× を並べる向きも線の向きも入れ替えている。
  // 送るものは盤面そのものなので理屈では影響しないが、実物で確かめておく
  test.setTimeout(300_000);
  const ライブ名 = ライブ名を作る('yoko');
  const 主 = await browser.newContext();
  const 参 = await browser.newContext();
  const A = await 主.newPage();
  const B = await 参.newPage();

  await 入る(A);
  await 射手を立てる(A, 2);
  // 主催者だけ横に並べる
  await A.getByTestId('並べ方').click();
  // 縦は列が上下に、横は左右に並ぶ。並びが変わるまで待つ
  await こうなるまで待つ(
    async () => (await 一射目たち(A)).map((m) => [m.x, m.y]),
    (並び) => 並び.length >= 2 && 並び[0][1] === 並び[1][1] && 並び[0][0] !== 並び[1][0],
    20000
  );

  // 横に並べたまま始める。ここが崩れると、横の人だけライブに入れない
  await ライブを始める(A, ライブ名);

  await 入る(B);
  // 参加のしかたを選ぶ窓が出る。ここは記録する側で入る
  await ライブに参加する(B, ライブ名);

  const A側 = await 一射目たち(A);
  const B側 = await 一射目たち(B);
  expect(A側.length, '横の主催者に盤面が出ていない').toBeGreaterThan(0);
  expect(B側.length, '縦の参加者へ盤面が届いていない').toBeGreaterThan(0);

  // 横の主催者が入れたものが、縦の参加者の同じますに出ること
  const 的 = A側[0];
  await A.mouse.click(的.x, 的.y);
  expect(await 印がつくまで待つ(A, 的.印), '横のままだと○が入らない').toBe('○');

  const 届いた = await 揃うまで待つ(async () => [await 中身(A, 的.印), await 中身(B, 的.印)]);
  expect(届いた[1], `横→縦へ届いていない（A=${届いた[0]} B=${届いた[1]}）`).toBe('○');

  // 逆向きも見る。縦の参加者が入れたものが、横の主催者に出ること
  const B的 = (await 一射目たち(B)).find((x) => x.印 !== 的.印);
  expect(B的, '参加者側に別の射手が無い').toBeTruthy();
  await B.mouse.click(B的.x, B的.y);
  await 印がつくまで待つ(B, B的.印);
  const 戻り = await 揃うまで待つ(async () => [await 中身(A, B的.印), await 中身(B, B的.印)]);
  expect(戻り[0], `縦→横へ届いていない（A=${戻り[0]} B=${戻り[1]}）`).toBe('○');

  await 主.close();
  await 参.close();
});

/**
 * つないでいる台数（src/livePresence.js）。
 *
 * 電波の切れる弓道場で「相手に届いているか」をその場で見るための表示。
 * 少なく出るのがいちばん困るので、2台になることと、抜けたら減ることを見る。
 * 1台のときは出さない決まりなので、主催者だけの間は出ていないことも見る。
 */
test('ライブ：つないでいる台数が出て、抜けると減る', async ({ browser }) => {
  test.setTimeout(300_000);
  const ライブ名 = ライブ名を作る('num');
  const 主 = await browser.newContext();
  const 参 = await browser.newContext();
  const A = await 主.newPage();
  const B = await 参.newPage();

  await 入る(A);
  await 射手を立てる(A, 1);
  await ライブを始める(A, ライブ名);

  // 主催者だけの間は出さない。「1台接続中」は、相手が居るのか自分だけなのか読めない。
  //
  // ここは「出ないこと」を見るので、決まった秒数を置くしかない。
  // 状態待ちにすると、出ないものを待って上限まで座り続けることになる
  await A.waitForTimeout(2000);
  await expect(A.getByText('接続中'), '1台なのに台数が出ている').toHaveCount(0);

  await 入る(B);
  await ライブに参加する(B, ライブ名);

  await expect(A.getByText('2台接続中'), '主催者から2台に見えない').toBeVisible({ timeout: 20_000 });
  await expect(B.getByText('2台接続中'), '参加者から2台に見えない').toBeVisible({ timeout: 20_000 });

  // 参加者が抜けたら、主催者の側から減ること。
  // ライブ中は同じ場所が「退出」（参加者）／「停止」（主催者）に変わり、
  // 押すと窓を出さずにその場で抜ける
  await B.getByText('退出', { exact: true }).first().click();
  await expect(B.getByText(new RegExp('ライブ中')), 'B が抜けられていない').toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(A.getByText('接続中'), '抜けたのに台数が残っている').toHaveCount(0, { timeout: 20_000 });

  await 主.close();
  await 参.close();
});

/**
 * URLで配る共有（src/liveShare.js）。
 *
 * 見たいのは3つ。
 *   ・主催者がリンクを2本作れること
 *   ・編集用のリンクで、団体に入っていない人が記録できること
 *   ・閲覧用のリンクでは、見えるが記録できないこと
 * 3つ目が崩れると「閲覧用」が飾りになる。
 */
test('ライブ：URLで配ると、編集用は記録でき、閲覧用は見るだけになる', async ({ browser }) => {
  // 台を3つ開き、それぞれアプリを起動し直すので長くかかる。
  // 合言葉から枝を導く計算そのものは速い（実測でChromium 82ms・WebKit 192ms）
  test.setTimeout(600_000);
  const ライブ名 = ライブ名を作る('shr');
  const 合言葉 = 'ひみつ123';
  const 主 = await browser.newContext();
  const A = await 主.newPage();

  await 入る(A);
  await 射手を立てる(A, 1);
  await ライブを始める(A, ライブ名);

  // 配る前に○×を入れておく。あとから来た人に「すでに入っている○×」が
  // 見えるかどうかは、入ってから入れるぶんとは別の道を通る
  const A側 = await 盤面を待つ(A);
  expect(A側.length, '主催者に盤面が出ていない').toBeGreaterThan(0);
  const 先の的 = A側[0];
  await A.locator(`[data-testid="${先の的.印}"]`).click();
  expect(await 印がつくまで待つ(A, 先の的.印), '主催者の側に○が入らない').toBe('○');

  // 主催者は帯を押すと、配る窓が開く
  await A.getByText(new RegExp('ライブ中')).click();
  await expect(A.getByText('ライブをリンクで配る')).toBeVisible({ timeout: 10_000 });

  // 有効期限が選べること。既定は24時間（期限なしを既定にすると、
  // ほとんどのリンクが永久に生き続ける）
  await expect(A.getByText('リンクの有効期限', { exact: true })).toBeVisible();
  for (const 名 of ['12時間', '24時間', '7日間', '期限なし'])
    await expect(A.getByText(名, { exact: true }), `期限の選び方に「${名}」が無い`).toBeVisible();
  const 選ばれている = () =>
    A.evaluate(() =>
      [...document.querySelectorAll('[aria-selected="true"]')]
        .map((e) => (e.textContent || '').trim())
        .filter((t) => /時間|日間|期限なし/.test(t))
    );
  expect(await 選ばれている(), '既定が24時間になっていない').toEqual(['24時間']);
  // 選び直せること
  await A.getByText('7日間', { exact: true }).click();
  await こうなるまで待つ(選ばれている, (x) => x.length === 1 && x[0] === '7日間', 10000);
  expect(await 選ばれている(), '選び直しても印が移らない').toEqual(['7日間']);
  // 合言葉の入切も、絵ではなく印として読めること。
  // ✓ は絵で描いてあるので、これが無いと読み上げでは入か切か分からない
  expect(
    await A.evaluate(() => document.querySelectorAll('[aria-checked]').length),
    '合言葉の入切が読み上げに伝わらない'
  ).toBeGreaterThan(0);

  const 合言葉欄 = A.getByPlaceholder(/文字以上/);
  await 確かに打つ(合言葉欄, 合言葉);
  await expect(合言葉欄, '合言葉が入りきっていない').toHaveValue(合言葉, { timeout: 10_000 });
  await A.getByText('リンクを作る', { exact: true }).click();

  // 2本できること。作るのに時間がかかる（合言葉から枝を導くため）
  await expect(A.getByText('編集用', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(A.getByText('閲覧用', { exact: true })).toBeVisible();
  const URLたち = await A.evaluate(() =>
    [...document.querySelectorAll('*')]
      .map((x) => (x.childElementCount === 0 ? x.textContent || '' : ''))
      .filter((x) => x.includes('#共有='))
  );
  expect(URLたち.length, 'リンクが2本出ていない').toBe(2);
  // 選んだ期限が、できたリンクの説明にも出ること
  await expect(
    A.getByText(/有効期限：/),
    'リンクを作ったあとに有効期限が出ていない'
  ).toBeVisible();
  const [編集のURL, 閲覧のURL] = URLたち;
  // 共有の枝は名前では消せない。ここで割り出して控えておく
  for (const URL of URLたち) {
    const 中身 = 共有の荷を解く(URLから荷を取る(URL));
    if (中身) 作った共有の枝.push(枝を導く(中身.種, 合言葉));
  }
  expect(編集のURL).not.toBe(閲覧のURL);
  await A.getByText('閉じる', { exact: true }).click();
  await expect(A.getByText('ライブをリンクで配る'), '配る窓が閉じない').toHaveCount(0, {
    timeout: 10_000,
  });

  // ── 編集用のリンクで、団体に入っていない人が入る ──
  const 外 = await browser.newContext();
  const B = await 外.newPage();
  await B.goto(編集のURL.replace(/^https?:\/\/[^/]+/, ''));
  await 画面が出るまで待つ(B);
  const B合言葉 = B.getByPlaceholder('合言葉');
  await expect(B合言葉, '共有リンクの窓が出ない').toBeVisible({ timeout: 30_000 });
  await 確かに打つ(B合言葉, 合言葉);
  await expect(B合言葉, '合言葉が入りきっていない').toHaveValue(合言葉, { timeout: 10_000 });
  await B.getByText('参加する', { exact: true }).click();
  await expect(B.getByText(new RegExp('ライブ中')), '編集用リンクで入れていない').toBeVisible({
    timeout: 60_000,
  });
  const B側 = await 盤面を待つ(B);
  expect(B側.length, '編集用リンクに盤面が届いていない').toBeGreaterThan(0);
  expect(await 中身(B, 先の的.印), '先に入っていた○が編集用リンクに出ていない').toBe('○');
  // 来客に出すのは記録だけ。履歴・分析・設定は中身が無い
  await expect(B.getByText('分析', { exact: true }), '来客に分析が出ている').toHaveCount(0);
  await expect(B.getByText('履歴', { exact: true }), '来客に履歴が出ている').toHaveCount(0);

  // 入れた○×が主催者に届く
  // ますは座標で押す（一射目たち が返すのは {印, 射手, x, y}）
  // ますは testID で押す。座標だと、射手が1人だけの細い盤面では
  // 割り出した位置と実際の位置がずれて、押しても何も起きない
  const B的 = B側[0];
  await B.locator(`[data-testid="${B的.印}"]`).click();
  expect(await 印がつくまで待つ(B, B的.印), '編集用リンクの側に○が入らない').toBe('○');
  const 届いた = await 揃うまで待つ(async () => [await 中身(A, B的.印), await 中身(B, B的.印)]);
  expect(届いた[0], '編集用リンクの○×が主催者に届いていない').toBe('○');

  // ── 閲覧用のリンクは見るだけ ──
  const 見 = await browser.newContext();
  const C = await 見.newPage();
  await C.goto(閲覧のURL.replace(/^https?:\/\/[^/]+/, ''));
  await 画面が出るまで待つ(C);
  const C合言葉 = C.getByPlaceholder('合言葉');
  await expect(C合言葉, '共有リンクの窓が出ない').toBeVisible({ timeout: 30_000 });
  await 確かに打つ(C合言葉, 合言葉);
  await expect(C合言葉, '合言葉が入りきっていない').toHaveValue(合言葉, { timeout: 10_000 });
  await C.getByText('参加する', { exact: true }).click();
  await expect(C.getByText(new RegExp('ライブ中')), '閲覧用リンクで入れていない').toBeVisible({
    timeout: 60_000,
  });
  const C側 = await 盤面を待つ(C);
  expect(C側.length, '閲覧用リンクに写しが届いていない').toBeGreaterThan(0);
  expect(await 中身(C, 先の的.印), '先に入っていた○が閲覧用リンクに出ていない').toBe('○');

  // 見るだけの側が押しても、主催者の盤面は変わらない
  // まだ何も入っていないますを選んで押す
  const C的 = C側.find((x) => x.印 !== B的.印) || C側[0];
  const 押す前 = await 中身(A, C的.印);
  // 閲覧用のますは押せない作りなので、強いて押す。
  // それでも記録に届かないことが、ここで見たいこと
  await C.locator(`[data-testid="${C的.印}"]`).click({ force: true });
  // ここも「届かないこと」を見るので、決まった秒数を置くしかない。
  // 短くすると、届くのが遅いだけの場合と見分けがつかなくなる
  await C.waitForTimeout(4000);
  expect(await 中身(A, C的.印), '閲覧用の人の操作が主催者に届いている').toBe(押す前);
  expect(await 中身(C, C的.印), '閲覧用の人の手元にも入ってしまっている').toBe(押す前);

  // ── 荷はタブ限りの控えに移してある ──
  // router が起動のときにハッシュを落とすので、控えが無いと再読み込みで
  // 来客が締め出される。控えを止めて焼き直すと、下の2件が落ちることを確かめた。
  // タブを閉じれば消えるので、次に端末を使う人には残らない。
  const 控え = await B.evaluate(() => {
    try {
      return window.sessionStorage.getItem('kyudo.共有の荷');
    } catch (e) {
      return null;
    }
  });
  expect(控え, '共有の荷がタブの控えに入っていない').toBeTruthy();

  await B.reload();
  await 画面が出るまで待つ(B);
  await expect(
    B.getByPlaceholder('合言葉'),
    '再読み込みで共有の荷が失われた（リンクをもらい直すことになる）'
  ).toBeVisible({ timeout: 30_000 });

  await 主.close();
  await 外.close();
  await 見.close();
});
