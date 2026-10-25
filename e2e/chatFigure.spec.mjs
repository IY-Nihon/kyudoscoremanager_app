/**
 * AI の答えの図（表・棒・折れ線・矢所）が、画面の大きさに合わせて収まるかの検査（2026-10-25）。
 *
 *   npx playwright test e2e/chatFigure.spec.mjs
 *
 * 本番の iPhone で、組分けの表の右が空き、2 行で切った名前の 3 行目の頭が覗き、
 * 大きく出しても名前が「…」で切れていた。図を実際の幅で描くように直した。
 *
 * 模型の返事は差し替える：道具を呼ぶ → 図を出す（showFigure）→ 文、の順に返す。
 * 図の中身は団体 100001 の手元の控えから作る（雲には書き込まない）。
 * 1 つの図を、機種の大きさ・小さいスマホ・横向き（パソコンは広い窓）で測り直す。
 */
import { test, expect } from '@playwright/test';
import { 案内を止める, 画面が出るまで待つ, 入り口が決まるまで待つ } from './helpers.mjs';

test.use({ storageState: 'e2e/.auth/100001.json' });

const 改善の保存を偽にする = (page) =>
  page.route(/workers\.dev\/hozon/, (route) =>
    route.fulfill({
      status: route.request().method() === 'OPTIONS' ? 204 : 200,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, PUT, OPTIONS',
        'access-control-allow-headers': 'Authorization, Content-Type',
      },
      body: route.request().method() === 'OPTIONS' ? '' : '{"ok":true}',
    })
  );

/**
 * 模型の返事を差し替える。1 回目は道具、2 回目は図（道具の返事にある 図にするとき.source を使う）、
 * 3 回目からは文
 */
async function 偽の模型(page, 道具, 形) {
  let 回 = 0;
  await page.route(/workers\.dev\/v1beta\//, (route) => {
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
    const 中身 = 依頼.postDataJSON();
    const 番号 = (中身.contents || [])
      .flatMap((c) => c.parts || [])
      .map((p) => p.functionResponse?.response?.図にするとき?.source)
      .filter(Boolean)
      .pop();
    const 部品 =
      回 === 0
        ? [{ functionCall: 道具 }]
        : 回 === 1 && 番号
          ? [{ functionCall: { name: 'showFigure', args: { source: 番号, kind: 形 } } }]
          : [{ text: '図にしました。' }];
    回++;
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/event-stream', 'access-control-allow-origin': '*' },
      body:
        'data: ' +
        JSON.stringify({ candidates: [{ content: { role: 'model', parts: 部品 }, finishReason: 'STOP' }] }) +
        '\n\n',
    });
  });
}

async function AIを開く(page) {
  await 案内を止める(page);
  await page.goto('/');
  await 画面が出るまで待つ(page);
  await 入り口が決まるまで待つ(page);
  // 図は手元の記録から作るので、記録が届くまで待つ
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          try {
            const s =
              JSON.parse(
                (globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}'
              )?.state || {};
            return (s.sessions || []).length;
          } catch {
            return 0;
          }
        }),
      { timeout: 60_000, message: '記録が届かない' }
    )
    .toBeGreaterThan(0);
  await page.getByText('履歴', { exact: true }).first().click();
  await page.getByTestId('AIを開く').click();
  await expect(page.getByText('こんなことが聞けます')).toBeVisible({ timeout: 20_000 });
}

/**
 * 検証の団体の記録には、名簿の人の矢所が無い。開く前の手元の控えで、名簿の人の記録 1 件に
 * ○×に合わせた矢所の点を置く（○は的の中、×は的の外。雲へは送らない：同期済みのまま・時刻も変えない）
 */
const 矢所を足す = (page) =>
  page.addInitScript(() => {
    try {
      const 鍵 = 'archery-score-storage';
      const 中 = JSON.parse(localStorage.getItem(鍵) || '{}');
      const s = 中.state || {};
      const 名簿 = s.members || [];
      const 点を置く = (人) => {
        人.arrowLocations = (人.marks || []).map((印, i) => {
          if (印 !== '○' && 印 !== '×') return null;
          const 半径 = 印 === '○' ? 0.25 + (i % 3) * 0.2 : 1.08 + (i % 2) * 0.1;
          return { x: Math.cos(i * 1.7) * 半径, y: Math.sin(i * 1.7) * 半径, targetType: 'kasumi36' };
        });
        localStorage.setItem(鍵, JSON.stringify(中));
      };
      const 射手たち = (s.sessions || [])
        .filter((記録) => 記録.includeInStats !== false)
        .flatMap((記録) => 記録.archers || [])
        .filter(
          (a) =>
            !a.isTotalCalculator && !a.isSeparator && (a.marks || []).some((印) => 印 === '○' || 印 === '×')
        );
      const 名簿の射手 = 射手たち.find((a) => 名簿.some((m) => m.id === a.memberId || m.name === a.name));
      if (名簿の射手) return 点を置く(名簿の射手);
      // 名簿の人の○×が控えに無い台もある（GitHub の台は控えを取り直す）。射手 1 人を名簿の 1 人にする
      if (射手たち.length && 名簿.length) {
        Object.assign(射手たち[0], { name: 名簿[0].name, memberId: 名簿[0].id });
        点を置く(射手たち[0]);
      }
    } catch {
      /* 控えが読めなければ、矢所の人が見つからずに落ちる */
    }
  });

/** 矢所のある人（手元の控えでいちばん多い人）の名前 */
const 矢所のある人 = (page) =>
  page.evaluate(() => {
    const s =
      JSON.parse((globalThis.__弓道の控え?.() ?? localStorage.getItem('archery-score-storage')) || '{}')
        ?.state || {};
    // 道具と同じ数え方：集計に入れる記録の、名簿の人（id か名前）の、位置のある点だけ
    const 名簿 = s.members || [];
    const 数 = new Map();
    for (const 記録 of s.sessions || []) {
      if (記録.includeInStats === false) continue;
      for (const 人 of 記録.archers || []) {
        if (人.isTotalCalculator || 人.isSeparator) continue;
        const 部員 = 名簿.find((m) => m.id === 人.memberId) || 名簿.find((m) => m.name === 人.name);
        const 点 = (Array.isArray(人.arrowLocations) ? 人.arrowLocations : []).filter(
          (l) => l && l.x != null && l.y != null
        ).length;
        if (点 && 部員) 数.set(部員.name, (数.get(部員.name) || 0) + 点);
      }
    }
    return [...数.entries()].sort((甲, 乙) => 乙[1] - 甲[1])[0]?.[0] || null;
  });

/**
 * 図の収まりを測る。返すのは見つかった崩れの文の一覧（空なら良い）。
 * 大きく … 窓で大きく出しているときは、字が切れていないか・窓が画面に収まるかも見る
 */
const 崩れを探す = (page, 大きく, 形) =>
  page.evaluate(
    ([大きく, 形]) => {
      const 崩れ = [];
      const 画面 = { w: innerWidth, h: innerHeight };
      if (document.documentElement.scrollWidth > 画面.w + 1)
        崩れ.push(`ページが横にはみ出す（${document.documentElement.scrollWidth} > ${画面.w}）`);
      const 図たち = [...document.querySelectorAll('[data-testid="AIの図"]')];
      const 窓 = document.querySelector('[data-testid="AIの図の窓"]');
      const 枠 = 大きく ? 窓 : 図たち[図たち.length - 1];
      if (!枠) return ['図が無い'];
      const 外 = 枠.getBoundingClientRect();
      const 内の幅 = 外.width - (大きく ? 32 : 0);
      if (大きく) {
        if (外.left < -1 || 外.right > 画面.w + 1 || 外.top < -1 || 外.bottom > 画面.h + 1)
          崩れ.push(
            `大きく出す窓が画面の外へ出る（${JSON.stringify(外.toJSON())}・画面 ${画面.w}×${画面.h}）`
          );
        if (外.width > 721) 崩れ.push(`大きく出す窓が広すぎる（${Math.round(外.width)}）`);
      }
      // 表：図の幅いっぱい・升の字が切れない（答えの下では 2 行まで切ってよいが、3 行目の頭を覗かせない）
      const 表 = 枠.querySelector('[data-testid="AIの表"]');
      if (表) {
        const 表の幅 = 表.getBoundingClientRect().width;
        if (表の幅 > 内の幅 + 1)
          崩れ.push(`表が図の外へはみ出す（${Math.round(表の幅)} > ${Math.round(内の幅)}）`);
        for (const 字 of 表.querySelectorAll('div[dir="auto"]')) {
          const 様 = getComputedStyle(字);
          const 切れた = 字.scrollHeight > 字.clientHeight + 1;
          if (切れた && 大きく) {
            崩れ.push(`大きく出しても表の字が切れる（「${字.textContent.slice(0, 6)}…」）`);
            break;
          }
          if (切れた && parseFloat(様.paddingBottom) > 0) {
            崩れ.push('2 行で切った字に下の余白があり、3 行目の頭が覗く');
            break;
          }
        }
        // いちばん右の列（率）は右に寄せるので、その字の右端が表の右端に近ければ、表は幅いっぱい
        const 字たち = [...表.querySelectorAll('div[dir="auto"]')];
        const 右の字 = 字たち[字たち.length - 1];
        if (右の字 && getComputedStyle(右の字).textAlign === 'right') {
          const 空き = 表.getBoundingClientRect().right - 右の字.getBoundingClientRect().right;
          if (空き > 12) 崩れ.push(`表の右が ${Math.round(空き)}px 空いている`);
        }
      }
      // 図の中身が枠の外へ出ていない（表は横に流せるので除く）
      const 枠の外 = 枠.getBoundingClientRect();
      for (const e of 枠.querySelectorAll('svg, div')) {
        if (表 && 表.contains(e)) continue;
        const r = e.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > 枠の外.right + 1 || r.left < 枠の外.left - 1) {
          崩れ.push(
            `図の中身が枠の横へはみ出す（${Math.round(r.left)}〜${Math.round(r.right)}・枠 ${Math.round(枠の外.left)}〜${Math.round(枠の外.right)}）`
          );
          break;
        }
      }
      // SVG の字は、どの画面でも読める大きさ（小さすぎず、大きすぎず）
      // （見える大きさ＝字の大きさの指定 × SVG の伸び縮み。前は 300 の幅で描いて伸ばしていて、7px や 47px になった）
      for (const t of 形 === '矢所' ? [] : 枠.querySelectorAll('svg text')) {
        if (!t.textContent) continue;
        const svg = t.ownerSVGElement;
        const 元の幅 = svg.viewBox.baseVal?.width || svg.getBoundingClientRect().width;
        // react-native-svg は字の大きさを属性でなく style に置く。計算された大きさ（SVG の座標での px）で見る
        const 指定 = parseFloat(getComputedStyle(t).fontSize || t.getAttribute('font-size'));
        const 見える = 指定 * (svg.getBoundingClientRect().width / 元の幅);
        if (!(見える >= 8 && 見える <= 16)) {
          崩れ.push(`図の字の大きさが ${見える.toFixed(1)}px（「${t.textContent}」）`);
          break;
        }
      }
      // SVG の字どうしが重ならない（棒の上の数・下の名・目盛り）
      for (const svg of 形 === '矢所' ? [] : 枠.querySelectorAll('svg')) {
        const 箱 = [...svg.querySelectorAll('text')]
          .filter((t) => t.textContent)
          .map((t) => t.getBoundingClientRect());
        const 重なる = 箱.some((a, i) =>
          箱
            .slice(i + 1)
            .some(
              (b) =>
                a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1
            )
        );
        if (重なる) 崩れ.push('図の字どうしが重なる');
      }
      // 大きく出したとき、折れ線・棒の SVG は窓の高さに収まる（巻かずに全部見える）
      if (大きく) {
        const svg = 枠.querySelector('svg');
        if (svg && svg.getBoundingClientRect().bottom > 外.bottom + 1)
          崩れ.push('大きく出した図が窓の下へはみ出す');
      }
      // 図の上でも指で上下に巻ける（touch-action: none の箱が無い。横に流す表は除く）。答えの下ではチャットを、
      // 大きく出した窓では窓の中を巻く。前は表が横に流さない ScrollView に包まれ、どちらも指で巻けなかった（iPhone）
      {
        const 止める = [枠, ...枠.querySelectorAll('*')].find(
          (e) => getComputedStyle(e).touchAction === 'none' && !(e.scrollWidth > e.clientWidth + 1)
        );
        if (止める) 崩れ.push('図の上で指の上下の動きを止める箱がある（touch-action: none）');
      }
      // 大きく出した窓は、中身が窓より高ければ巻ける（窓の外で切れたままにしない）
      if (大きく) {
        const 巻く = [...枠.querySelectorAll('*')].find((e) =>
          /auto|scroll/.test(getComputedStyle(e).overflowY)
        );
        if (巻く && 巻く.getBoundingClientRect().bottom > 外.bottom + 1)
          崩れ.push('大きく出した窓の巻く箱が窓より高く、下が切れて巻けない');
      }
      return 崩れ;
    },
    [大きく, 形]
  );

/** 機種のまま・小さいスマホ・横向き（パソコンは狭い窓・広い窓）で、答えの下と大きく出した窓を測る */
async function 大きさを変えて測る(page, 機種, 形) {
  const 元 = page.viewportSize();
  const 大きさたち =
    機種 === 'パソコン'
      ? [元, { width: 1024, height: 700 }, { width: 1600, height: 900 }]
      : [
          元,
          { width: 320, height: 640 },
          { width: Math.max(元.height, 640), height: Math.min(元.width, 390) },
        ];
  for (const 大きさ of 大きさたち) {
    await page.setViewportSize(大きさ);
    // 図は幅を測り直してから描き直す。遅い台（GitHub の WebKit）では 400ms 待っても前の幅のままだったので、
    // 崩れが消えるまで待つ（消えなければ落ちる）
    await expect
      .poll(() => 崩れを探す(page, false, 形), {
        timeout: 10_000,
        message: `答えの下の図（${大きさ.width}×${大きさ.height}）`,
      })
      .toEqual([]);
    await page.getByTestId('AIの図').last().click();
    await expect(page.getByTestId('AIの図の窓')).toBeVisible();
    await expect
      .poll(() => 崩れを探す(page, true, 形), {
        timeout: 10_000,
        message: `大きく出した図（${大きさ.width}×${大きさ.height}）`,
      })
      .toEqual([]);
    await page.getByTestId('AIの図を閉じる').click();
    await expect(page.getByTestId('AIの図の窓')).toHaveCount(0);
  }
  await page.setViewportSize(元);
}

const 図たち = [
  { 名: '組分けの表', 道具: { name: 'makeBalancedTeams', args: { teamSize: 3 } }, 形: '表' },
  // 1 組の顔ぶれが長い（答えの下では 2 行で切れ、大きく出すと全部出る）
  { 名: '7 人ずつの組分けの表', 道具: { name: 'makeBalancedTeams', args: { teamSize: 7 } }, 形: '表' },
  { 名: '成績の表（6 列）', 道具: { name: 'getAllMembersStats', args: {} }, 形: '表' },
  { 名: '成績の横の棒', 道具: { name: 'getAllMembersStats', args: {} }, 形: '棒' },
  { 名: '曜日の縦の棒', 道具: { name: 'aggregateStats', args: { groupBy: ['曜日'] } }, 形: '棒' },
  // 本数の多い縦の棒（射目は 20 本を超える団体もある。数と名が重ならず、名が切れない）
  { 名: '射目の縦の棒', 道具: { name: 'aggregateStats', args: { groupBy: ['射目'] } }, 形: '棒' },
  { 名: '月の折れ線', 道具: { name: 'aggregateStats', args: { groupBy: ['月'] } }, 形: '折れ線' },
  { 名: '矢所', 道具: { name: 'getArrowLocationStats', args: {} }, 形: '矢所' },
];

for (const 図 of 図たち) {
  test(`図：${図.名}が、画面の大きさを変えても図の中に収まり、大きく出すと字が切れない`, async ({
    page,
  }, 情報) => {
    test.setTimeout(180_000);
    await 改善の保存を偽にする(page);
    if (図.形 === '矢所') await 矢所を足す(page);
    await AIを開く(page);
    const 道具 = { ...図.道具, args: { ...図.道具.args } };
    if (道具.name === 'getArrowLocationStats') {
      const 人 = await 矢所のある人(page);
      // 落ちたときに控えの様子を出す（GitHub の台でだけ見つからないことがあった）
      const 様子 = 人
        ? ''
        : await page.evaluate(() => {
            const 控え = globalThis.__弓道の控え?.();
            const s = JSON.parse(控え ?? localStorage.getItem('archery-score-storage') ?? '{}')?.state || {};
            const 射手 = (s.sessions || []).flatMap((r) => r.archers || []);
            return JSON.stringify({
              控えから: !!控え,
              記録: (s.sessions || []).length,
              射手: 射手.length,
              印のある射手: 射手.filter((a) => (a.marks || []).some((m) => m === '○' || m === '×')).length,
              矢所のある射手: 射手.filter((a) => (a.arrowLocations || []).some(Boolean)).length,
              名簿: (s.members || []).length,
            });
          });
      expect(人, `手元の控えに矢所のある人がいない（矢所を足す が効いていない）${様子}`).toBeTruthy();
      道具.args.memberName = 人;
    }
    await 偽の模型(page, 道具, 図.形);
    await page.getByPlaceholder('メッセージを入力...').fill('図にして');
    await page.getByTestId('AIに送る').click();
    await expect(page.getByText('図にしました。')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('AIの図'), '図が出ない').toHaveCount(1);
    if (図.形 === '表') await expect(page.getByTestId('AIの表')).toHaveCount(1);
    await 大きさを変えて測る(page, 情報.project.name, 図.形);
  });
}
