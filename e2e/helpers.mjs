/**
 * e2e の検査で使い回す道具。
 *
 * ここに置くものは、どの検査からも同じように使えること。
 * 検査そのものではないので、Playwright には拾われない
 *（拾われるのは *.spec.mjs だけ）。
 *
 * ■ 決まった秒数で待たない
 * `waitForTimeout` は、その裏にある競合を覆い隠す。2026年8月30日に
 * live.spec.mjs の固定待ちを外したところ、覆われていた不具合が2つ出てきた
 *（打ち込みが落ちる／取り消しの確かめが早すぎる）。README の「e2e の待ち方」
 * を参照。ここの道具は、その置き換え先。
 */
import fs from 'node:fs';
import { expect } from '@playwright/test';

/** いまのお知らせの版。本体から読むので、版が上がっても検査を直さずに済む */
export const お知らせの版 = (fs
  .readFileSync('src/WhatsNewModal.js', 'utf8')
  .match(/NOTICE_VERSION = '([^']+)'/) || [])[1];

/**
 * 案内とお知らせを、**開く前**に止める。
 *
 * 開いてから localStorage に書いて reload する作りだと、アプリを2回
 * 起動することになる。遅い機種（WebKit）ではここが積み上がる。
 * addInitScript は画面の script より先に走るので、1回目の起動から効く。
 *
 * お知らせは『案内を終えた人』に出る作りなので、案内だけ止めると出てくる。
 * 両方まとめて止めること。
 *
 * page.goto の前に呼ぶ。
 */
export async function 案内を止める(page) {
  await page.addInitScript((版) => {
    // あえて案内を出す検査（案内をあえて出す）のときは、止め直さない。
    // addInitScript は移動のたびに走るので、断りを入れないと、
    // 検査が消した設定を毎回もとに戻してしまう（実際それで2件落ちた）
    if (localStorage.getItem('検査：案内をあえて出す')) return;
    localStorage.setItem('tutorialDoneVersion', '2026-08-13-01');
    localStorage.setItem('whatsNewDismissedVersion', 版);
  }, お知らせの版);
}

/**
 * 案内をあえて出す。案内そのものを見る検査で使う。
 *
 * 案内を止める が仕掛けた「移動のたびに止め直す」を、断りの印で外す。
 * 印を置いてから、案内の済み印を消す。順を逆にすると、次の移動で
 * また止められる。
 */
export async function 案内をあえて出す(page) {
  await page.evaluate(() => {
    localStorage.setItem('検査：案内をあえて出す', '1');
    localStorage.removeItem('tutorialDoneVersion');
    localStorage.removeItem('tutorialBoardSnapshot');
  });
}

/**
 * 画面が立ち上がるまで待つ。
 *
 * 決まった秒数だと、遅い機種では空のまま先へ進み、まったく別の顔で落ちる。
 */
export async function 画面が出るまで待つ(page, 上限 = 30000) {
  await page
    .waitForFunction(
      () => {
        const 根 = document.getElementById('root');
        return !!根 && 根.children.length > 0 && (document.body.innerText || '').trim().length > 0;
      },
      { timeout: 上限 }
    )
    .catch(() => {});
}

/**
 * 見え方がこうなるまで待つ。
 *
 * 上限は長めにしてよい。満たせばその場で抜けるので、速いときの代償は無い。
 * 短くすると、全体を流したとき（働き手が2つ、ほかの検査も動く）に
 * 間に合わず、届いているのに「届かない」として落ちる。
 *
 * 上限に達したら最後に読んだ値を返すので、そのあとの assert が落ちる。
 */
export async function こうなるまで待つ(読む, 良いか, 上限 = 60000) {
  const 始め = Date.now();
  let 最後 = null;
  while (Date.now() - 始め < 上限) {
    最後 = await 読む();
    try {
      if (良いか(最後)) return 最後;
    } catch {
      /* まだ読めない形。次で見る */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return 最後;
}

/**
 * 欄に確かに入れる。入りきらなければ打ち直す。
 *
 * この画面の入力欄は controlled で、窓が開ききる前に打つと、打ち込みの
 * 途中で再描画が入って何文字か落ちる。実際 chk1788094022464946 が
 * c88094022464946 になり、欠けた名前のライブが検証環境にできた。
 *
 * 効かなかった手：
 *   ・toBeFocused を待ってから打つ … 焦点は合っていても落ちる
 *   ・fill() … WebKit では値が入らない（Chromium では入る）
 */
export async function 確かに打つ(欄, 文字, 回数 = 5) {
  for (let i = 0; i < 回数; i++) {
    await 欄.click();
    // 前の打ち込みが半端に残っていることがある。選んでから上書きする
    await 欄.press('ControlOrMeta+a').catch(() => {});
    await 欄.pressSequentially(文字, { delay: 30 });
    const いま = await 欄.inputValue().catch(() => null);
    if (いま === 文字) return;
  }
  // ここまで来たら、呼び出し側の確かめで落とす
}

/**
 * 団体でログインする。控え（storageState）があれば素通りする。
 *
 * 決まった秒数で待たない。iPhone(WebKit) では9秒に収まらないことがあり、
 * 収まらないとログイン画面のまま先へ進んで、まったく別の顔で落ちる。
 */
export async function 団体で入る(page, 団体, 合言葉) {
  const 番号欄 = page.getByPlaceholder('例: 123456');
  if (!(await 番号欄.isVisible().catch(() => false))) return;
  await 確かに打つ(番号欄, 団体);
  const 合言葉欄 = page.locator('input[type="password"]').first();
  await 確かに打つ(合言葉欄, 合言葉);
  await page.getByText('ログイン', { exact: true }).click();
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
  // ここは外から見える合図が無いので、決まった秒数のまま残してある
  await page.waitForTimeout(1500);
}

/**
 * 並べ方が横（射数が右に伸びる）になるまで待つ。
 *
 * 押した合図（localStorage の 横に並べる）はすぐ立つが、描き直しはそのあと。
 * 位置を測る検査は描き直しを待つ必要があるので、ますが在るときは位置も見る。
 * ますが1つも無い画面（射手を立てる前）では、合図だけで足りる。
 */
export async function 横並びになるまで待つ(page, 上限 = 20000) {
  return こうなるまで待つ(
    async () => {
      const 印 = await page
        .evaluate(() => JSON.parse(localStorage.getItem('archery-score-storage') || '{}')?.state?.横に並べる)
        .catch(() => null);
      const 名 = await page
        .locator('[data-testid^="ます-"]')
        .first()
        .getAttribute('data-testid')
        .catch(() => null);
      if (!名) return { 印, ます無し: true };
      const 射手 = 名.slice('ます-'.length, 名.lastIndexOf('-'));
      const 一 = await page.getByTestId(`ます-${射手}-0`).boundingBox().catch(() => null);
      const 二 = await page.getByTestId(`ます-${射手}-1`).boundingBox().catch(() => null);
      return { 印, 一, 二 };
    },
    (v) => {
      if (!v || !v.印) return false;
      if (v.ます無し) return true;
      // 横は「同じ高さで、2射目が1射目の右」
      return !!v.一 && !!v.二 && Math.abs(v.一.y - v.二.y) < 2 && v.二.x - v.一.x > 10;
    },
    上限
  );
}

/**
 * ログイン画面か、入ったあとの画面か、**どちらかに決まるまで**待つ。
 *
 * `画面が出るまで待つ` だけでは足りない。読み込み中の画面でも「出た」に
 * なるので、その時点ではログイン欄がまだ無い。そこで isVisible を見て
 * 「無い＝もう入っている」と取り違え、ログインを飛ばしてしまう。
 *
 * 実際、起動を1回にしたあとの iPhone でこれが起き、ログイン画面のまま
 * 先へ進んで「ライブの合言葉が取れない」という別の顔で落ちた。
 * 上限を90秒まで伸ばしても直らず、時間の問題ではなかった。
 */
export async function 入り口が決まるまで待つ(page, 上限 = 60000) {
  return こうなるまで待つ(
    async () => ({
      ログイン欄: await page
        .getByPlaceholder('例: 123456')
        .isVisible()
        .catch(() => false),
      // 「入っている」は localStorage ではなく**画面**で見る。
      // 控え（storageState）を使う検査では activeGroupId が最初から
      // 入っているので、localStorage を見ると即座に通ってしまい、
      // 記録の画面が描かれる前に先へ進む。
      // 実際それで iPhone の検査が5件落ちた（ますが1つも無い状態で数えていた）
      入っている: await page
        .getByText('リセット', { exact: true })
        .first()
        .isVisible()
        .catch(() => false),
    }),
    (v) => v.ログイン欄 || v.入っている,
    上限
  );
}

/** ますが指定の数だけ出るまで待つ。射手を立てたあとに使う */
export async function ますが増えるまで待つ(page, 数 = 1, 上限 = 20000) {
  return こうなるまで待つ(
    () => page.locator('[data-testid^="ます-"]').count(),
    (n) => n >= 数,
    上限
  );
}

/**
 * 画面が切り替わるまで待つ。切り替わった先にしか無い字を目印にする。
 *
 * タブを押したあとに決まった秒数を置くと、遅い機種では前の画面のまま
 * 数えてしまう。目印が出れば、そこで進んでよい。
 */
export async function 画面が変わるまで待つ(page, 目印, 上限 = 20000) {
  return こうなるまで待つ(
    () =>
      page
        .getByText(目印, { exact: true })
        .first()
        .isVisible()
        .catch(() => false),
    (x) => x === true,
    上限
  );
}
