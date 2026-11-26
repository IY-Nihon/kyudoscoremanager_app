/**
 * 部員の役（2026-11-19 本人）。中継の /kanri と新しい決まりがあるとき（手元のエミュレーター。npm run e2e:emu）だけ流す。
 *
 *   npm run e2e:emu -- e2e/yaku.spec.mjs --project=スマホ
 *   SHOT_DIR=撮る先 … 役の窓・役を選ぶ欄・個人の設定の写真を撮る
 *
 * 流れ（団体はこの検査が回ごとに作る：e2e/emu-dantai.mjs。エミュレーターなので雲には書かない）：
 *   持ち主が部員を足す（その場で個人ID が付く）→ 管理者モード（合言葉を初めて作る）で「部員の役」を開く → 4 つの役
 *   → 役を作る（質問に答え、文で確かめる）→ メンバーの編集で、足した部員に「見るだけ」を割り当てる
 *   → 部員の端末（個人ID で入る）：設定に役・○×を押しても入らない（いまの役では…）・ライブは始められず閲覧用だけ・分析は自分だけでない
 *   → 持ち主が「運営」に替える → 部員の端末：いつも付けるタグを選べる・合言葉なしで足した人にもその場で個人ID が付く
 *     （逆引き表をエミュレーターで読む。持ち主の端末は先に閉じる）
 *   → 管理者の合言葉で管理者モードに入れる（作る道は出ない）→ メンバーの一覧・ほかの人の個人ID・招待リンク・足した人の個人ID
 * 前は 100002 と控えの個人ログイン（100002-個人）で流していたが、3 機種を一度に流すと、先に流れた機種が役を作り割り当てを
 * 替えていて落ちた（2026-11-26）。控えの部員を運営のまま残すので、同じ部員を使うほかの検査とも取り合うおそれがあった
 */
import { test, expect } from '@playwright/test';
import path from 'node:path';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  団体で入る,
  個人で入る,
  管理者の窓で入る,
} from './helpers.mjs';
import { 検証のパスワード } from '../scripts/fb-rest.mjs';
import { 文書の根, 管理, 検査の団体を作る, 名簿で引く } from './emu-dantai.mjs';

const 合言葉 = 検証のパスワード();
test.skip(
  process.env.FB_EMULATOR !== '1',
  '中継の /kanri と新しい決まりがあるのは手元のエミュレーターだけ（配るまで）'
);

const 撮る = async (page, 的, 名, 情報) => {
  if (!process.env.SHOT_DIR) return;
  await page.waitForTimeout(600);
  await 的.screenshot({ path: path.join(process.env.SHOT_DIR, `${情報.project.name}-役-${名}.png`) });
};

/** 名前の近くのスイッチを押す（RN-web の Switch は中の checkbox を押す） */
const スイッチを押す = (page, 名) =>
  page.evaluate((名) => {
    const 行 = [...document.querySelectorAll('div')].find((e) => (e.textContent || '').trim() === 名);
    let 親 = 行;
    for (let i = 0; i < 6 && 親; i++) {
      const 切替 = 親.querySelector('input[type="checkbox"], [role="switch"]');
      if (切替) return void 切替.click();
      親 = 親.parentElement;
    }
  }, 名);

/**
 * 名簿でその名前の人を引き、逆引き表にその人の個人ID の行がいくつあるか（招待の行は数えない）。
 * エミュレーターを管理の資格で読む（e2e/emu-fetch.mjs が手元へ向ける）。名簿にいなければ -1
 */
async function 個人IDの行の数(団体, 名前) {
  const 読む = async (集まり) => {
    const 返り = await fetch(`${文書の根}/groups/${団体}/${集まり}?pageSize=300`, { headers: 管理 });
    return (await 返り.json()).documents || [];
  };
  const 人 = (await 読む('members')).find((文書) => 文書.fields?.name?.stringValue === 名前);
  if (!人) return -1;
  const id = 人.name.split('/').pop();
  return (await 読む('member_lookup')).filter(
    (文書) => 文書.fields?.memberId?.stringValue === id && 文書.fields?.招待?.booleanValue !== true
  ).length;
}

/**
 * 名簿でその名前の人を引き、役の文書（config/roles）の割り当てで、その人たちに付いた役の id の並び。
 * 同じ名前の人が何人かいれば全員分。エミュレーターを管理の資格で読む
 */
async function 割り当てた役(団体, 名前) {
  const 根 = `${文書の根}/groups/${団体}`;
  const 頭 = { headers: 管理 };
  const 人たち = ((await (await fetch(`${根}/members?pageSize=300`, 頭)).json()).documents || []).filter(
    (文書) => 文書.fields?.name?.stringValue === 名前
  );
  const 役の文書 = await (await fetch(`${根}/config/roles`, 頭)).json();
  const 割り当て = 役の文書.fields?.['割り当て']?.mapValue?.fields || {};
  return 人たち.map((文書) => 割り当て[文書.name.split('/').pop()]?.stringValue).filter(Boolean);
}

/** 上のタブ（role="tab"）。字で探すと、裏に残った画面の見出し（設定の「設定」など）を掴んで押せずに待ち続けた */
const タブ = (page, 名) => page.getByRole('tab', { name: 名 }).first();

async function 開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
}

test('部員の役：持ち主が作って割り当て、個人ログインの端末で効く', async ({ browser }, 情報) => {
  test.setTimeout(300_000);
  const 団体 = await 検査の団体を作る('yaku');

  // ── 持ち主 ──
  const 持ち主の場 = await browser.newContext({
    ...情報.project.use,
    storageState: { cookies: [], origins: [] },
  });
  const 持ち主 = await 持ち主の場.newPage();
  await 開く(持ち主);
  await 団体で入る(持ち主, 団体, 合言葉);
  // 個人ログインで使う部員を足す（その場で個人ID が付く）
  const 部員の名 = '検査 部員';
  await タブ(持ち主, 'メンバー').click();
  await 持ち主.getByRole('button', { name: 'メンバーを追加' }).click();
  await 持ち主.getByLabel('名前', { exact: true }).fill(部員の名);
  await 持ち主.getByText('保存する', { exact: true }).click();
  let 部員 = null;
  await expect
    .poll(async () => (部員 = await 名簿で引く(団体, 部員の名))?.個人ID ?? null, {
      timeout: 60_000,
      message: '足した部員に個人ID が付かない',
    })
    .toBeTruthy();
  await タブ(持ち主, '設定').click();
  await expect(持ち主.getByText('ログアウト', { exact: true })).toBeVisible({ timeout: 20_000 });
  // 管理者モードでなければ「部員の役」は出ない
  await expect(持ち主.getByTestId('部員の役を開く')).toHaveCount(0);
  await スイッチを押す(持ち主, '管理者モード');
  await 管理者の窓で入る(持ち主, 合言葉);
  await 持ち主.getByTestId('部員の役を開く').click();
  const 役の窓 = 持ち主.getByTestId('部員の役の窓');
  await expect(役の窓).toBeVisible();
  for (const id of ['jibun', 'zenin', 'miru', 'unei'])
    await expect(役の窓.getByTestId(`役の札-${id}`)).toBeVisible();
  await 撮る(持ち主, 役の窓, '1-一覧', 情報);

  // 役を作る：名前を入れ、出欠を「はい」にすると、文が変わる
  await 役の窓.getByTestId('役を作る').click();
  await 役の窓.getByLabel('役の名前').fill('出欠の係');
  await expect(役の窓.getByTestId('役の文')).toContainText(
    '出欠と練習日を管理する、団体の設定を変えることはできません'
  );
  await スイッチを押す(持ち主, '出欠・練習日を管理できる');
  await expect(役の窓.getByTestId('役の文')).toContainText(
    '記録を付ける、出欠と練習日を管理することができます'
  );
  await 撮る(持ち主, 役の窓, '2-作る', 情報);
  await 役の窓.getByTestId('役を保存').click();
  await expect(役の窓.getByText('出欠の係', { exact: true })).toBeVisible({ timeout: 10_000 });
  // 同じ名前は断る
  await 役の窓.getByTestId('役を作る').click();
  await 役の窓.getByLabel('役の名前').fill('運営');
  await 役の窓.getByTestId('役を保存').click();
  await expect(役の窓.getByTestId('役の誤り')).toHaveText('同じ名前の役があります');
  await 役の窓.getByText('戻る', { exact: true }).click();
  await 役の窓.getByText('閉じる', { exact: true }).click();

  // メンバーの編集で「見るだけ」を割り当てる
  await タブ(持ち主, 'メンバー').click();
  await 持ち主.getByTestId('メンバーの一覧').getByText(部員の名, { exact: true }).first().click();
  const 役の欄 = 持ち主.getByTestId('役を選ぶ欄');
  await expect(役の欄).toBeVisible({ timeout: 20_000 });
  await expect(役の欄.getByTestId('役を選ぶ-jibun')).toHaveAttribute('aria-pressed', 'true');
  await 役の欄.getByTestId('役を選ぶ-miru').click();
  await expect(役の欄.getByTestId('役を選ぶ-miru')).toHaveAttribute('aria-pressed', 'true');
  await 撮る(持ち主, 役の欄, '3-選ぶ', 情報);

  // ── 部員の端末（見るだけ） ──
  const 部員の場 = await browser.newContext({
    ...情報.project.use,
    storageState: { cookies: [], origins: [] },
  });
  const 部員の頁 = await 部員の場.newPage();
  // 見るだけに替わる前に付けて、まだ送れていない記録が 1 件ある端末にする（電波の無い所で付けたあと役が替わった形）。
  // 控えの役も見るだけにしておく（開いた直後に部員（自分）のまま送ってしまわないように）。個人ID で入ったあと、
  // 開き直したときに 1 回だけ置く
  await 部員の頁.addInitScript(
    ({ 部員id }) => {
      if (sessionStorage.getItem('送れない記録を置いた')) return;
      const 鍵 = 'archery-score-storage';
      const 控え = JSON.parse(localStorage.getItem(鍵) || '{}');
      if (!控え.state?.activeGroupId) return;
      sessionStorage.setItem('送れない記録を置いた', '1');
      const 今 = Date.now();
      控え.state.sessions = [
        ...(控え.state.sessions || []),
        {
          id: 'e2e-okurenai-1',
          title: '送れない検査',
          date: 今,
          lastModified: 今,
          archers: [],
          syncStatus: '未同期',
        },
      ];
      控え.state.役の設定 = { 役: {}, 割り当て: { [部員id]: 'miru' } };
      localStorage.setItem(鍵, JSON.stringify(控え));
    },
    { 部員id: 部員.id }
  );
  await 開く(部員の頁);
  expect(await 個人で入る(部員の頁, 団体, 部員.個人ID), '足した部員が個人ID で入れない').toBeNull();
  await 部員の頁.reload();
  await 画面が出るまで待つ(部員の頁);
  await タブ(部員の頁, '設定').click();
  await expect(部員の頁.getByTestId('自分の役')).toContainText('見るだけ', { timeout: 30_000 });
  // 送れない記録は送らずに残し、役の下で知らせる（11/19 本人「知らせる」）
  await expect(部員の頁.getByTestId('送れない記録')).toContainText(
    'いまの役では送れない記録が 1 件あります',
    {
      timeout: 20_000,
    }
  );
  await 撮る(部員の頁, 部員の頁.getByTestId('送れない記録'), '4b-送れない記録', 情報);
  // 使い方の一覧：見るだけには記録を付ける項目（記録を取る）を出さない（11/19 本人）
  await 部員の頁.getByText('使い方を見る', { exact: true }).click();
  const 見るだけの使い方 = 部員の頁.getByTestId('使い方の選び窓');
  await expect(見るだけの使い方.getByTestId('使い方の組-履歴・分析')).toBeVisible();
  await expect(見るだけの使い方.getByTestId('使い方の組-記録を取る')).toHaveCount(0);
  await 見るだけの使い方.getByLabel('閉じる', { exact: true }).click();
  await expect(見るだけの使い方).toHaveCount(0);
  // 管理者設定は出ない（見るだけには合言葉の要る部品が無い）
  await expect(部員の頁.getByText('管理者モード', { exact: true })).toHaveCount(0);
  // いつも付けるタグ（保存のしかた）は、記録を付けられない見るだけには出ない
  await expect(部員の頁.locator('[aria-label$="をいつも付けるタグにする"]')).toHaveCount(0);
  await 撮る(部員の頁, 部員の頁.getByTestId('自分の役'), '4-個人の設定', 情報);
  // 記録：押しても入らず、そのわけを知らせる
  await タブ(部員の頁, '記録').click();
  // 画面に出ているリセットだけを押す（見えない同じ名前のボタンを掴むと押せずに待ち続けた）
  await 部員の頁.locator('[aria-label="リセット"]:visible').first().click();
  await expect(部員の頁.getByText('いまの役では記録を付けられません', { exact: true })).toBeVisible({
    timeout: 10_000,
  });
  // 分析：全員を見る役なので「マイ・パフォーマンス統計」（自分だけの形）ではない
  await タブ(部員の頁, '分析').click();
  await expect(部員の頁.getByText('マイ・パフォーマンス統計', { exact: true })).toHaveCount(0);

  // ── 持ち主が「運営」に替える → 部員の端末で管理者モードに入れる ──
  await 役の欄.getByTestId('役を選ぶ-unei').click();
  await expect(役の欄.getByTestId('役を選ぶ-unei')).toHaveAttribute('aria-pressed', 'true');
  await タブ(部員の頁, '設定').click();
  await expect(部員の頁.getByTestId('自分の役')).toContainText('運営', { timeout: 30_000 });
  // 記録を付けられる役に戻ったので、送れない記録の知らせは消える（記録は次の同期で送られる）
  await expect(部員の頁.getByTestId('送れない記録')).toHaveCount(0);
  // ここから先は持ち主の端末を使わない。閉じておく（持ち主の端末の同期が個人IDを振ると、下で運営の一括が
  // 付けたのか分からなくなる）
  await 持ち主の場.close();
  // 記録を付けられる役の個人ログインでも、いつも付けるタグを「保存のしかた」で選べる（11/19 本人：部員の端末にも出す）
  const 選ぶ札 = 部員の頁.locator('[aria-label$="をいつも付けるタグにする"]').first();
  await 選ぶ札.scrollIntoViewIfNeeded();
  const 札の名 = (await 選ぶ札.getAttribute('aria-label')).replace(' をいつも付けるタグにする', '');
  await 選ぶ札.click();
  await expect(部員の頁.locator(`[aria-label="${札の名} をいつも付けるタグから外す"]`)).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  // 使い方の一覧：運営には役に関係のある団体向け（メンバーの登録・管理者モード）を出し、団体の口座だけのもの
  // （登録メールアドレス）は出さない（11/19 本人）
  await 部員の頁.getByText('使い方を見る', { exact: true }).click();
  const 使い方 = 部員の頁.getByTestId('使い方の選び窓');
  await 使い方.getByTestId('使い方の組-はじめに（ログイン・メンバー）').click();
  await expect(使い方.getByTestId('使い方の項目-メンバーを登録する・編集する')).toBeVisible();
  await 使い方.getByTestId('使い方の組-設定・アカウント').click();
  await expect(使い方.getByTestId('使い方の項目-管理者モード')).toBeVisible();
  await expect(使い方.getByTestId('使い方の項目-登録メールアドレスを変える')).toHaveCount(0);
  await 撮る(部員の頁, 使い方, '5-運営の使い方', 情報);
  await 使い方.getByLabel('閉じる', { exact: true }).click();
  await expect(使い方).toHaveCount(0);
  // 合言葉を入れていない運営が足した人にも、その場で個人IDが付く（11/19 本人）。運営の画面には出ないので、
  // エミュレーターを管理の資格で読んで確かめる
  const 合言葉なしで足す人 = '検査 合言葉なし';
  await タブ(部員の頁, 'メンバー').click();
  await 部員の頁.getByRole('button', { name: 'メンバーを追加' }).click();
  await 部員の頁.getByLabel('名前', { exact: true }).fill(合言葉なしで足す人);
  await 部員の頁.getByText('保存する', { exact: true }).click();
  await expect
    .poll(() => 個人IDの行の数(団体, 合言葉なしで足す人), {
      timeout: 30_000,
      message: '合言葉を入れていない運営が足した人に個人IDが付かない',
    })
    .toBe(1);
  await タブ(部員の頁, '設定').click();
  await スイッチを押す(部員の頁, '管理者モード');
  const 合言葉の窓 = 部員の頁.getByTestId('管理者の合言葉の窓');
  await expect(合言葉の窓.getByLabel('管理者の合言葉')).toBeVisible({ timeout: 20_000 });
  // 個人ログインには「忘れたとき」（作り直し）の道を出さない
  await expect(合言葉の窓.getByText('合言葉を忘れたとき', { exact: true })).toHaveCount(0);
  await 合言葉の窓.getByLabel('管理者の合言葉').fill(合言葉);
  await 合言葉の窓.getByTestId('管理者の合言葉を決める').click();
  await expect(合言葉の窓).toHaveCount(0, { timeout: 30_000 });
  // 合言葉を変えるは団体の口座だけ。部員の役は運営の役の人も決められる（11/25 本人）
  await expect(部員の頁.getByTestId('管理者の合言葉を変える')).toHaveCount(0);
  await expect(部員の頁.getByTestId('部員の役を開く'), '運営に部員の役が出ない').toBeVisible({
    timeout: 20_000,
  });
  // メンバーの一覧（管理できる）が出る
  await タブ(部員の頁, 'メンバー').click();
  await expect(部員の頁.getByText('自分の情報', { exact: true })).toHaveCount(0, { timeout: 20_000 });
  // 管理者モードの運営は、ほかの人の個人IDが見え、招待リンクを作れる（決まりの memberAdmin）。役も選べる（11/25 本人）
  // 一覧の中で探す（字だけで探すと、裏に残った分析の画面の順位の名前を掴む）
  await 部員の頁.getByTestId('メンバーの一覧').getByText(合言葉なしで足す人, { exact: true }).first().click();
  const 招待の欄 = 部員の頁.getByTestId('招待リンクの欄');
  await expect(招待の欄, '運営に招待リンクの欄が出ない').toBeVisible({ timeout: 20_000 });
  await expect(部員の頁.getByText('******** (管理者のみ表示)', { exact: true })).toHaveCount(0);
  await expect(部員の頁.getByText(/^[A-Z0-9]{6}$/).first(), '運営に個人IDが見えない').toBeVisible({
    timeout: 20_000,
  });
  await expect(部員の頁.getByTestId('役を選ぶ欄'), '運営に役を選ぶ欄が出ない').toBeVisible();
  const 作る = 招待の欄.getByText('招待リンクを作る', { exact: true });
  const 作り直す = 招待の欄.getByText('招待リンクを作り直す', { exact: true });
  await expect(作る.or(作り直す)).toBeVisible({ timeout: 20_000 });
  await 作る.or(作り直す).click();
  if (await 部員の頁.getByTestId('窓のボタン-作り直す').count())
    await 部員の頁.getByTestId('窓のボタン-作り直す').click();
  await expect(部員の頁.getByTestId('招待リンク'), '運営が招待リンクを作れない').toBeVisible({
    timeout: 20_000,
  });
  // 管理者モードの運営が足した人には、その場で個人IDが付く（11/19 の見直し：前は団体の端末を開くまで付かなかった）
  await 部員の頁.getByLabel('閉じる', { exact: true }).filter({ visible: true }).first().click();
  await 部員の頁.getByRole('button', { name: 'メンバーを追加' }).click();
  await 部員の頁.getByLabel('名前', { exact: true }).fill('検査 運営');
  await 部員の頁.getByText('保存する', { exact: true }).click();
  await 部員の頁.getByTestId('メンバーの一覧').getByText('検査 運営', { exact: true }).first().click();
  await expect(部員の頁.getByTestId('招待リンクの欄')).toBeVisible({ timeout: 20_000 });
  await expect(部員の頁.getByText(/^[A-Z0-9]{6}$/).first(), '運営が足した人に個人IDが付かない').toBeVisible({
    timeout: 30_000,
  });
  // 管理者モードの運営が、足した人に役を割り当てる（11/25 本人「運営の役の人もできる」）。決まりが通したかは、
  // エミュレーターの役の文書を管理の資格で読んで確かめる（断られると手元だけ変わり、窓で知らせて雲の中身に戻る）
  const 運営の役の欄 = 部員の頁.getByTestId('役を選ぶ欄');
  await 運営の役の欄.getByTestId('役を選ぶ-zenin').click();
  await expect(運営の役の欄.getByTestId('役を選ぶ-zenin')).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => 割り当てた役(団体, '検査 運営'), { timeout: 30_000, message: '運営の割り当てが雲に届かない' })
    .toContain('zenin');
  await expect(部員の頁.getByText('役を保存できませんでした', { exact: true })).toHaveCount(0);

  await 部員の場.close();
});
