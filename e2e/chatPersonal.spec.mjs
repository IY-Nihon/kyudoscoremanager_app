/**
 * 個人ログイン（部員）のAIアシスタントの検査。
 *
 *   PW_PORT=8093 npx playwright test e2e/chatPersonal.spec.mjs
 *
 * ■ 見たいこと
 *   ・個人で入ってもAIのボタンが出て、個人用のあいさつと質問例になる
 *   ・AIに送る中身（指示文・道具・会話）に、ほかの部員の名前・個人ID・出欠が入らない
 *     （端末には団体ぜんぶの部員・記録が入っている。AIに渡す前に本人の分へ絞る。src/chatScope.js）
 *   ・AIが全員の成績・出欠・部員の追加の道具を呼んできても、動かさない（道具の側でも止める）
 *   ・会話の控えは本人ごとの鍵に置き、団体の会話（同じ端末で前に使われたもの）は読まない・書かない
 *
 * ■ 団体には書き込まない
 * 100002 の個人ログインで開いて、質問を送るだけ。Gemini の返事と、改善のための保存（/hozon）は
 * 偽の応答に差し替える（本物は呼ばない）。
 *
 * ■ 名前は出さない
 * ほかの部員の名前は実行時に控えから読む。失敗の表示に名前が出ないよう、真偽だけで見る。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ, こうなるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100002-個人.json' });

const 個人が使える道具 = [
  'getDetailedMemberStats',
  'getPositionStats',
  'getSessionsByDate',
  'navigateToScreen',
  'searchSessions',
  'countSessionParticipation',
  'startTutorial',
];

/** 控えから、自分と、ほかの部員を読む */
async function 控えを読む(page) {
  return page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {};
    const 部員たち = (s.members || []).filter((m) => m && m.id);
    const 自分 = 部員たち.find((m) => m.id === s.myMemberId) || {};
    return {
      役: s.activeRole || null,
      id: s.myMemberId || null,
      名: s.myMemberName || null,
      自分の個人ID: 自分.personalId || null,
      他の人たち: 部員たち
        .filter((m) => m.id !== s.myMemberId)
        .map((m) => ({ 名: m.name || '', id: m.id, 個人ID: m.personalId || '' })),
      記録数: (s.sessions || []).length,
    };
  });
}

async function 入る(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  const 自分 = await 控えを読む(page);
  expect(自分.役, '控えが個人ログインになっていない').toBe('member');
  expect(自分.名, '控えに自分の名前が入っていない').toBeTruthy();
  // ほかの部員は雲から遅れて届く。届いてから見ないと、何も入っていないだけで通ってしまう
  await こうなるまで待つ(
    async () => (await 控えを読む(page)).他の人たち.length,
    (n) => n >= 1,
    60_000
  );
  return 控えを読む(page);
}

/** 記録の画面には浮くボタンが出ない（盤面を覆わないため）ので、履歴へ移ってから探す */
async function AIを開く(page) {
  const 自分 = await 入る(page);
  await page.getByText('履歴', { exact: true }).first().click();
  const 釦 = page.getByTestId('AIを開く');
  await expect(釦, '個人ログインで、AIの入口が出ない').toBeVisible({ timeout: 20_000 });
  await 釦.click();
  await expect(
    page.getByText('ほかの人の成績はお答えできません').first(),
    '個人用のあいさつが出ない'
  ).toBeVisible({ timeout: 20_000 });
  return 自分;
}

/** 改善のための保存（本物の置き場へ送らない）。送ろうとした中身は控えて返す */
async function 保存を偽にする(page) {
  const 送った = [];
  await page.route(/workers\.dev\/hozon/, async (route) => {
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, PUT, OPTIONS',
          'access-control-allow-headers': 'Authorization, Content-Type',
        },
      });
    try {
      送った.push(route.request().postDataJSON());
    } catch (誤り) {
      /* 中身が読めなくても応答は返す（写真の PUT は JSON ではない） */
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: '{"ok":true}',
    });
  });
  return 送った;
}

/**
 * Gemini の返事を差し替える。送られた中身は控えて返す（本物は呼ばない）。
 * 返事は { text } か { calls: [{name, args}] } か { parts: [部品…] }（1 つのかけらに入れる部品をそのまま）。
 * 配列なら順に、関数なら（何番目の依頼か）から作る。使い切った配列は、最後の返事を繰り返す
 */
async function 偽のGemini(page, 返事たち) {
  const 送った = [];
  const 返事を作る =
    typeof 返事たち === 'function' ? 返事たち : (番) => 返事たち[Math.min(番, 返事たち.length - 1)];
  await page.route(/workers\.dev\/v1beta\//, async (route) => {
    const 依頼 = route.request();
    if (依頼.method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': '*',
        },
      });
    const 返事 = 返事を作る(送った.length);
    送った.push(依頼.postDataJSON());
    const 部品 =
      返事.parts ||
      (返事.calls
        ? 返事.calls.map((c) => ({ functionCall: { name: c.name, args: c.args || {} } }))
        : [{ text: 返事.text }]);
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream', 'access-control-allow-origin': '*' },
      body:
        'data: ' +
        JSON.stringify({ candidates: [{ content: { role: 'model', parts: 部品 }, finishReason: 'STOP' }] }) +
        '\n\n',
    });
  });
  return 送った;
}

async function 送る(page, 文) {
  await page.getByPlaceholder('メッセージを入力...').fill(文);
  await page.getByTestId('AIに送る').click();
}

/** その文字列に、ほかの部員の名前・id・個人ID・自分の個人IDが入っていないか（入っていたら「何番目の人の何か」を返す） */
function 漏れを探す(文, 自分) {
  const 漏れ = [];
  自分.他の人たち.forEach((他, 番) => {
    if (他.名 && 文.includes(他.名)) 漏れ.push(`他の人${番}の名前`);
    if (他.id && 文.includes(他.id)) 漏れ.push(`他の人${番}のid`);
    if (他.個人ID && 文.includes(他.個人ID)) 漏れ.push(`他の人${番}の個人ID`);
  });
  if (自分.自分の個人ID && 文.includes(自分.自分の個人ID)) 漏れ.push('自分の個人ID');
  return 漏れ;
}

test('個人ログイン：AIのボタンが出て、個人用のあいさつと質問例になる', async ({ page }) => {
  test.setTimeout(180_000);
  await 保存を偽にする(page);
  await AIを開く(page);

  // 個人で使える例は出る
  await expect(page.getByText('分析の画面を開いて').first(), '個人用の質問例が出ない').toBeVisible();
  // 団体だけの例は出ない（できない操作・全員の成績を勧めない）
  for (const 団体の例 of [
    '新しい部員を追加して',
    '団体全体の的中率',
    '的中率が高い順に3人',
    '写真から記録を読み取るには？',
  ]) {
    await expect(
      page.getByText(団体の例, { exact: false }),
      `団体だけの質問例「${団体の例}」が個人に出ている`
    ).toHaveCount(0);
  }
});

test('個人ログイン：AIに送る中身に、ほかの人の名前・個人ID・出欠が入らず、道具は本人の分だけ', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await 保存を偽にする(page);
  const 送った = await 偽のGemini(page, [{ text: 'お答えします。' }]);
  const 自分 = await AIを開く(page);
  console.log(`[個人のチャット] 部員 ${自分.他の人たち.length + 1} 人・記録 ${自分.記録数} 件の端末`);

  await 送る(page, '自分の最近の調子は？');
  await expect(page.getByText('お答えします。')).toBeVisible({ timeout: 30_000 });
  expect(送った.length, 'Gemini へ送っていない').toBeGreaterThan(0);

  const 依頼 = 送った[0];
  const 文 = JSON.stringify(依頼);
  expect(漏れを探す(文, 自分), '送る中身に、ほかの人の情報か個人IDが入っている').toEqual([]);

  // 指示文：本人の分だけを扱う決まりと、本人の名前
  const 指示 = JSON.stringify(依頼.systemInstruction || {});
  expect(指示.includes('本人の分だけを扱います'), '個人用の指示文になっていない').toBe(true);
  expect(指示.includes(自分.名), '指示文に本人の名前が入っていない').toBe(true);
  for (const 団体の決まり of [
    '部員の追加について',
    '立ち順を尋ねられたとき',
    'getAllMembersStats',
    'addMembers',
  ]) {
    expect(指示.includes(団体の決まり), `個人用の指示文に団体用の「${団体の決まり}」が残っている`).toBe(
      false
    );
  }
  // 話し相手は本人だけ（部員一覧は入れない）
  expect(指示.includes('話し相手（本人）'), '話し相手（本人）が入っていない').toBe(true);
  expect(指示.includes('部員一覧'), '部員一覧が入っている').toBe(false);

  // 道具：本人の分だけの 5 つ。全員の成績・出欠・部員の追加は出さない
  const 道具 = (依頼.tools || []).flatMap((t) => (t.functionDeclarations || []).map((d) => d.name)).sort();
  expect(道具, '個人に出す道具が、本人の分だけになっていない').toEqual([...個人が使える道具].sort());
});

test('個人ログイン：出していない道具を AI が呼んできても動かさず、他の人の成績は取れない', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await 保存を偽にする(page);
  // ほかの人の名前は、端末に届いてから分かる。返事は依頼のときに作る
  let 他の名 = '';
  const 送った = await 偽のGemini(page, (番) =>
    0 === 番
      ? {
          calls: [
            { name: 'getAllMembersStats', args: {} },
            { name: 'getAttendanceStats', args: {} },
            { name: 'addMember', args: { name: 'テスト', grade: 1, gender: 'male' } },
            { name: 'addMembers', args: { members: [{ name: 'テスト', grade: 1, gender: 'male' }] } },
            { name: 'navigateToScreen', args: { screenName: '出欠' } },
            { name: 'getDetailedMemberStats', args: { memberName: 他の名 } },
            { name: 'searchSessions', args: { keyword: 他の名 } },
            { name: 'getSessionsByDate', args: { recentCount: 30 } },
            { name: 'getPositionStats', args: { memberNames: [他の名] } },
          ],
        }
      : { text: '個人ではお答えできません。' }
  );
  const 自分 = await AIを開く(page);
  他の名 = 自分.他の人たち[0].名;

  await 送る(page, '全員の成績を教えて');
  await expect(page.getByText('個人ではお答えできません。')).toBeVisible({ timeout: 30_000 });
  expect(送った.length, '道具の返りを付けた 2 回目の依頼が無い').toBe(2);

  const 返り = 送った[1].contents
    .flatMap((c) => c.parts || [])
    .filter((p) => p.functionResponse)
    .map((p) => p.functionResponse);
  const 返りを取る = (名) => {
    const r = 返り.find((x) => x.name === 名);
    expect(r, `${名} の返りが無い`).toBeTruthy();
    return r.response;
  };

  // 出していない道具は動かさない
  for (const 名 of ['getAllMembersStats', 'getAttendanceStats', 'addMember', 'addMembers']) {
    expect(返りを取る(名).success, `個人なのに ${名} を動かしてしまった`).toBe(false);
  }
  // 出欠の画面には行けない。行ける画面は個人のタブと同じ
  const 画面 = 返りを取る('navigateToScreen');
  expect(画面.success, '出欠の画面へ移ろうとしてしまった').toBe(false);
  expect(画面.行ける画面).toEqual(['記録', '履歴', '分析', 'メンバー', '設定']);
  // ほかの人の名前で成績は取れない（成績が返らない）
  const 詳細 = 返りを取る('getDetailedMemberStats');
  expect(詳細.error, 'ほかの人の成績が取れてしまった').toBeTruthy();
  expect(
    Object.keys(詳細).filter((k) => k !== 'error'),
    'エラーのほかに成績が付いている'
  ).toEqual([]);
  // ほかの道具の返りに、ほかの人の情報が無い。名前を渡した呼び出しの返しは、詳細だけが名前を
  // 添える（渡された名前をそのまま返す）ので外す
  const 文 = JSON.stringify(返り.filter((x) => x.name !== 'getDetailedMemberStats'));
  expect(漏れを探す(文, 自分), '道具の返りに、ほかの人の情報か個人IDが入っている').toEqual([]);
});

test('個人ログイン：会話の控えは本人ごとの鍵に置き、団体の会話は読まない・書かない', async ({ page }) => {
  test.setTimeout(180_000);
  await 保存を偽にする(page);
  await 偽のGemini(page, () => ({ text: '控えの確認です。' }));
  // 同じ端末で前に団体が使った会話が、控えに残っている状態にする（読み込みのたびに戻す）
  const 団体の印 = '団体の管理者だけの会話の印';
  await page.addInitScript((印) => {
    try {
      localStorage.setItem('aiChatMessages_v1', JSON.stringify([{ id: 'g1', role: 'model', text: 印 }]));
    } catch (誤り) {
      /* 入れられなければ、下の「見えていない」は空振りする（控えを読んで確かめる） */
    }
  }, 団体の印);

  const 自分 = await AIを開く(page);
  await expect(page.getByText(団体の印), '団体の会話が個人に見えている').toHaveCount(0);

  await 送る(page, '確かめます');
  await expect(page.getByText('控えの確認です。')).toBeVisible({ timeout: 30_000 });
  // 控えに書けるまでの短い間を待つ（会話の変化から少し遅れて書く）
  await こうなるまで待つ(
    () => page.evaluate((id) => localStorage.getItem(`aiChatMessages_v1_member_${id}`) || '', 自分.id),
    (文) => 文.includes('控えの確認です。'),
    15_000
  );
  const 控え = await page.evaluate(
    (id) => ({
      団体: localStorage.getItem('aiChatMessages_v1'),
      本人: localStorage.getItem(`aiChatMessages_v1_member_${id}`),
    }),
    自分.id
  );
  expect(JSON.parse(控え.団体), '個人が団体の会話の控えを書き換えた').toEqual([
    { id: 'g1', role: 'model', text: 団体の印 },
  ]);
  const 本人 = JSON.parse(控え.本人 || '[]');
  expect(
    本人.some((m) => m.role === 'user' && m.text === '確かめます'),
    '本人の鍵に会話が残っていない'
  ).toBe(true);
  expect(
    本人.some((m) => m.text === 団体の印),
    '団体の会話が本人の控えに混ざった'
  ).toBe(false);

  // 開き直しても、本人の会話は続きから読める
  await AIを開く(page);
  await expect(page.getByText('確かめます').first(), '開き直したら、本人の会話が消えている').toBeVisible({
    timeout: 20_000,
  });
});

// SDK（@google/generative-ai 0.24.1）は、流れてきた 1 つのかけらに部品が 2 つ以上あると、
// 集約した答えの文を取り違える（署名だけの空の部品が付くと同じ文が重なり、文が 2 つに分かれると
// 前の文が落ちる）。アプリは積んだ生の部品から答えを取るので、重ならず・落ちない。
// 団体でも同じ経路なので、個人の入り口を借りて見る
test('答えの文：1 つのかけらに文・空の署名・文が並んでも、重ならず落ちない', async ({ page }) => {
  test.setTimeout(180_000);
  const 保存 = await 保存を偽にする(page);
  await 偽のGemini(page, [
    { parts: [{ text: '的中は' }, { text: '', thoughtSignature: 'SIG' }, { text: '矢が当たることです。' }] },
  ]);
  await AIを開く(page);
  await 送る(page, '的中とは？');
  await expect(page.getByText('的中は矢が当たることです。', { exact: true }), '答えが出ない').toBeVisible({
    timeout: 30_000,
  });
  // 最終の答えは、改善のための保存に載る。画面の途中の札ではなく、確定した文で見る
  await expect
    .poll(() => 保存.filter((x) => x && x.種類 === 'チャット').length, {
      timeout: 15_000,
      message: 'チャットの記録を送っていない',
    })
    .toBeGreaterThan(0);
  const 答え = 保存.find((x) => x && x.種類 === 'チャット').中身.答え;
  expect(答え, '答えの文が、重なったか落ちている').toBe('的中は矢が当たることです。');
});
