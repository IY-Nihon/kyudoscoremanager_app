/**
 * 「使い方を見る」の動画を撮る道具（検査ではない。ふだんの e2e では飛ばす）。
 *
 *   RECORD_USAGE=1 PW_DIST=dist-stg-e2e npx playwright test e2e/record-usage-videos.spec.mjs --project=スマホ --no-deps
 *   RECORD_USAGE=1 USAGE_ONLY=u05,x06 …   … 一部だけ撮り直す
 *   node scripts/usage-videos.mjs           … 撮った絵を public/usage/*.mp4 にまとめる
 *
 * 検証環境の合成の団体（100007。部員の名は「部員1」…だけ）で、動画ごとの台本どおりに画面を動かして撮る。
 * 押す前に青い枠で囲み、指の丸を出してから押す。押したあとの結果（名前が入る・12射になる…）まで撮る
 * （2026-10-19 本人：押すところだけでなく最後までの流れを見せる）。
 * 保存・リセット・ライブの開始のような雲へ書く操作は、その手前で止める。
 * 絵は写真の連写で撮る（録画の機能や screencast は CSS の大きさでしか撮れず、字がにじむ）。
 * 画面が変わったら撮り直す。
 */
import { test } from '@playwright/test';
import { 案内を止める, 自動ロックを入れる } from './helpers.mjs';
import fs from 'node:fs';
import path from 'node:path';

test.skip(!process.env.RECORD_USAGE, '動画を撮るときだけ流す');
test.use({ storageState: 'e2e/.auth/100007.json' });

const 置き場 = process.env.USAGE_RAW || path.join('e2e', '.usage-raw');
const 絞り = process.env.USAGE_ONLY ? new Set(process.env.USAGE_ONLY.split(',')) : null;

// 動画は画面まるごと。操作のあたりだけに切り抜いた版は「全画面に戻して」となった（2026-10-19）
const 切り抜き = {};

/** 道具一式。台本はこれだけで書く */
function 道具(page) {
  const 待つ = (ms) => page.waitForTimeout(ms);
  const 枠を描く = (b, 長さ) =>
    page.evaluate(
      ([b, 長さ]) => {
        const 枠 = document.createElement('div');
        枠.style.cssText = `position:fixed;left:${b.x - 5}px;top:${b.y - 5}px;width:${b.width + 10}px;height:${b.height + 10}px;border:3px solid #007AFF;border-radius:10px;box-shadow:0 0 0 4px rgba(0,122,255,.18);z-index:2147483646;pointer-events:none;transition:opacity .3s`;
        document.body.appendChild(枠);
        setTimeout(() => (枠.style.opacity = '0'), 長さ);
        setTimeout(() => 枠.remove(), 長さ + 400);
      },
      [b, 長さ]
    );
  const 指 = (x, y) =>
    page.evaluate(
      ([x, y]) => {
        const 丸 = document.createElement('div');
        丸.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:22px;background:rgba(255,90,60,.12);border:2px solid rgba(255,90,60,.9);z-index:2147483647;pointer-events:none;transition:transform .25s, opacity .4s;transform:scale(1.3)`;
        document.body.appendChild(丸);
        requestAnimationFrame(() => (丸.style.transform = 'scale(1)'));
        setTimeout(() => (丸.style.opacity = '0'), 700);
        setTimeout(() => 丸.remove(), 1200);
      },
      [x, y]
    );
  const 箱 = async (loc) => {
    await loc.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await loc.waitFor({ state: 'visible', timeout: 8000 });
    // 字だけでなく、押せる部品ごと（タブなら絵と名前の両方）を囲む（2026-10-19 本人：「記録」の字だけ囲んでいた）
    const b = await loc.evaluate((e) => {
      const 部品 = e.closest('[role="button"],[role="tab"],[role="link"],button,a,[tabindex]') || e;
      const r = (
        部品.getBoundingClientRect().width > window.innerWidth * 0.9 ? e : 部品
      ).getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    if (!b || !b.width) throw new Error('見つからない: ' + loc);
    return b;
  };
  const 見える = (loc) => loc.locator('visible=true').first();
  return {
    page,
    待つ,
    字: (文字) => 見える(page.getByText(文字, { exact: true })),
    札: (札) => 見える(page.getByLabel(札, { exact: true })),
    印: (印) => 見える(page.getByTestId(印)),
    タブ: (名) =>
      page
        .locator('text=' + 名)
        .locator('visible=true')
        .last(),
    // 段は射の順。1射目はいちばん下のマス（記録表は下から入れていく。上から押すと見た人が戸惑う。2026-10-19 本人）
    マス: (列 = 0, 段 = 0) =>
      page
        .locator('[data-testid^="ます-"]')
        .locator('visible=true')
        .nth(列 * 8 + (7 - 段)),
    /** 囲んで見せるだけ（押さない） */
    囲む: async (loc, 長さ = 1800) => {
      await 枠を描く(await 箱(loc), 長さ);
      await 待つ(長さ + 300);
    },
    /** 囲んで、指で押す */
    押す: async (loc, { 囲まない = false, 後 = 900 } = {}) => {
      const b = await 箱(loc);
      if (!囲まない) {
        await 枠を描く(b, 700);
        await 待つ(650);
      }
      const x = b.x + b.width / 2;
      const y = b.y + b.height / 2;
      await 指(x, y);
      await 待つ(300);
      await page.mouse.click(x, y);
      await 待つ(後);
    },
    長押し: async (loc, { 後 = 900 } = {}) => {
      const b = await 箱(loc);
      const x = b.x + b.width / 2;
      const y = b.y + b.height / 2;
      await 枠を描く(b, 900);
      await 待つ(600);
      await 指(x, y);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await 待つ(900);
      await page.mouse.up();
      await 待つ(後);
    },
    長押しで動かす: async (loc, 先x, 先y) => {
      const b = await 箱(loc);
      const x = b.x + b.width / 2;
      const y = b.y + b.height / 2;
      await 枠を描く(b, 600);
      await 待つ(600);
      await 指(x, y);
      await page.mouse.move(x, y);
      await page.mouse.down();
      await 待つ(900);
      for (let i = 1; i <= 15; i++) {
        await page.mouse.move(x + ((先x - x) * i) / 15, y + ((先y - y) * i) / 15);
        await 待つ(50);
      }
      await page.mouse.up();
      await 待つ(1000);
    },
    巻く: async (量) => {
      await page.mouse.move(190, 450);
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 量 / 6);
        await 待つ(70);
      }
      await 待つ(500);
    },
  };
}

/** testID がその頭で始まる箱のうち、いちばん下（1立目）のもの */
async function 下の箱(t, 頭) {
  const 箱たち = t.page.locator(`[data-testid^="${頭}"]`).locator('visible=true');
  let 一番 = null;
  let 下 = -1;
  for (let 番 = 0; 番 < (await 箱たち.count()); 番++) {
    const b = await 箱たち.nth(番).boundingBox();
    if (b && b.y > 下) ((下 = b.y), (一番 = 箱たち.nth(番)));
  }
  return 一番;
}

/** 記録表に射手を並べる（撮る前の下ごしらえ） */
// 検証環境の団体の合言葉（scripts/seed-stg.mjs・e2e/tutorial.spec.mjs と同じ。検証専用）
const 合言葉 = 'StgTest!2026';

/** 設定で管理者モードを入れる。映す＝押すところを囲む */
async function 管理者モードを入れる(t, { 映す = false } = {}) {
  await t.タブ('設定').click();
  await t.待つ(800);
  const 名 = t.page.getByText('管理者モード', { exact: true }).locator('visible=true').first();
  await 名.scrollIntoViewIfNeeded();
  await t.待つ(400);
  // 同じ行の切り替え（名前と高さがいちばん近い switch）
  const 名の箱 = await 名.boundingBox();
  const 切り替えたち = t.page.getByRole('switch').locator('visible=true');
  let 近い = null;
  let 差 = 1e9;
  for (let 番 = 0; 番 < (await 切り替えたち.count()); 番++) {
    const b = await 切り替えたち.nth(番).boundingBox();
    if (b && Math.abs(b.y - 名の箱.y) < 差) ((差 = Math.abs(b.y - 名の箱.y)), (近い = 切り替えたち.nth(番)));
  }
  if (映す) await t.押す(近い, { 後: 800 });
  else await 近い.click();
  await t.待つ(600);
  const 欄 = t.page.getByLabel('管理者モードのパスワード');
  await 欄.click();
  await t.page.keyboard.type(合言葉, { delay: 映す ? 60 : 0 });
  if (映す) await t.押す(t.字('認証'), { 後: 1500 });
  else await t.字('認証').click();
  await t.待つ(2500);
}

/**
 * 射手の 1 立目（1〜4 射目）を埋める。押す回数の並びは 射手ごと（右から数えた順）・1射目から。1＝○、2＝×。
 * null の射手は飛ばす。射手は名前の欄の位置（右から）で数える（ますの並びは足した順と一致しないことがあった）
 */
async function 一立目を埋める(t, 回数たち, { 見せる = false } = {}) {
  const 名の欄 = t.page.locator('[data-testid^="名の欄-射手-"]').locator('visible=true');
  const 射手たち = [];
  for (let 番 = 0; 番 < (await 名の欄.count()); 番++) {
    const b = await 名の欄.nth(番).boundingBox();
    const id = ((await 名の欄.nth(番).getAttribute('data-testid')) || '').replace('名の欄-射手-', '');
    if (b) 射手たち.push({ id, x: b.x });
  }
  射手たち.sort((甲, 乙) => 乙.x - 甲.x);
  for (const [番, 回数] of 回数たち.entries()) {
    if (!回数 || !射手たち[番]) continue;
    for (const [射, 回] of 回数.entries()) {
      const マス = t.page.getByTestId(`ます-${射手たち[番].id}-${射}`);
      for (let 何 = 0; 何 < 回; 何++) {
        if (見せる) await t.押す(マス, { 囲まない: true, 後: 120 });
        else {
          await マス.click();
          await t.待つ(120);
        }
      }
    }
  }
}

async function 射手を並べる(t, 人数 = 3) {
  for (let 回 = 0; 回 < 人数; 回++) {
    await t.札('射手を追加').click();
    await t.待つ(250);
  }
}
async function 入れておく(t, 位置) {
  for (const [列, 段] of 位置) {
    await t.マス(列, 段).click();
    await t.待つ(150);
  }
}
// 検証環境の合成の部員（scripts/seed-stg.mjs）。100001 には元の分からない名前が混じっているので使わない（公開の倉庫に載る）
const 部員の行 = (t) =>
  t.page
    .getByText(/^部員\d/)
    .locator('visible=true')
    .first();

/**
 * 台本。キーは public/usage/<キー>.mp4。用意 は撮る前（映らない）、見せる は撮るところ。
 * 始め: '設定' … 設定の画面から始める（既定は記録の画面）
 */
const 台本 = {
  u02: {
    見せる: async (t) => {
      await t.押す(t.タブ('メンバー'), { 後: 1000 });
      await t.押す(t.印('AIを開く'), { 後: 2000 });
    },
  },
  x03: {
    用意: async (t) => {
      await 射手を並べる(t, 1);
      await t.字('選択').click();
      await t.待つ(800);
      await 部員の行(t).click();
      await t.待つ(600);
      await 入れておく(t, [[0, 0]]);
    },
    見せる: async (t) => {
      await t.押す(t.札('終了して保存'), { 後: 1500 });
      await t.押す(t.字('遅刻'), { 後: 2000 });
    },
  },
  u22: { 用意: (t) => 射手を並べる(t, 2), 見せる: async (t) => t.押す(t.字('ライブ'), { 後: 2400 }) },
  x08: {
    見せる: async (t) => {
      await t.押す(t.タブ('履歴'), { 後: 1000 });
      await t.押す(t.page.getByPlaceholder(/検索/).locator('visible=true').first(), { 後: 300 });
      await t.page.keyboard.type('練習', { delay: 200 });
      await t.待つ(2000);
    },
  },
  x09: {
    見せる: async (t) => {
      await t.押す(t.タブ('分析'), { 後: 1000 });
      await t.巻く(2400);
      await t.押す(部員の行(t), { 後: 1300 });
      await t.巻く(1200);
      await t.待つ(900);
    },
  },
  // 立ちごとの計と総計（本番の組み方：人…・計・人…・計・総計）
  y05: {
    // 本番の組み方：右から 人・人・計・人・人・計・総計。どの射手も1立目（1〜4射目）を全部埋める（○以外は×）
    用意: async (t) => {
      // 列が7本になり画面に収まらない（右の射手が隠れた）ので、表示を 75% にしておく
      await t.page.getByText(/^100%/).locator('visible=true').first().click();
      await t.待つ(500);
      await t.字('75%').click();
      await t.待つ(500);
      await 射手を並べる(t, 2);
      await 一立目を埋める(t, [
        [1, 2, 1, 2],
        [2, 1, 1, 2],
      ]);
    },
    見せる: async (t) => {
      await t.押す(t.字('Σ'), { 後: 900 });
      await t.押す(t.札('射手を追加'), { 後: 500 });
      await t.押す(t.札('射手を追加'), { 囲まない: true, 後: 600 });
      await 一立目を埋める(t, [null, null, [1, 1, 2, 2], [2, 1, 2, 1]], { 見せる: true });
      await t.押す(t.字('Σ'), { 後: 900 });
      await t.押す(t.字('Σ'), { 後: 900 });
      // いちばん左の計（いま足した計）の名前のマス
      const 計たち = t.page.locator('[data-testid^="名の欄-合計-"]').locator('visible=true');
      let 左 = null;
      let 左のx = 1e9;
      for (let 番 = 0; 番 < (await 計たち.count()); 番++) {
        const b = await 計たち.nth(番).boundingBox();
        if (b && b.x < 左のx) ((左のx = b.x), (左 = 計たち.nth(番)));
      }
      await t.押す(左, { 後: 1100 });
      await t.押す(t.字('手前の計もまとめた総計にする'), { 後: 2400 });
    },
  },
  // チームを分ける：間隔・次のチーム・区切りの「⋯」からチーム名
  y04: {
    // 右から 間隔・人・人・間隔・人・人（記録表は右から並ぶ。足した順に左へ伸びる）
    見せる: async (t) => {
      await t.押す(t.字('間隔'), { 後: 600 });
      await t.押す(t.札('射手を追加'), { 後: 400 });
      await t.押す(t.札('射手を追加'), { 囲まない: true, 後: 600 });
      await t.押す(t.字('間隔'), { 後: 600 });
      await t.押す(t.札('射手を追加'), { 後: 400 });
      await t.押す(t.札('射手を追加'), { 囲まない: true, 後: 800 });
      // 右の区切りに名前を付ける
      const 区切り = t.page.locator('[data-testid^="名の欄-区切り-"]').locator('visible=true');
      let 右 = null;
      let 右のx = -1;
      for (let 番 = 0; 番 < (await 区切り.count()); 番++) {
        const b = await 区切り.nth(番).boundingBox();
        if (b && b.x > 右のx) ((右のx = b.x), (右 = 区切り.nth(番)));
      }
      await t.押す(右, { 後: 1000 });
      await t.押す(t.字('チーム名を付ける'), { 後: 900 });
      // 窓が開いた直後は欄に焦点が来ておらず、最初の字が落ちた。欄を押してから打つ
      await t.page.getByPlaceholder('例: ◯◯大学').click();
      await t.page.keyboard.type('A大学', { delay: 150 });
      await t.待つ(500);
      await t.押す(t.字('決定'), { 後: 1000 });
      // 左の区切りにも名前を付けると、そこから左が別のチームになる
      let 左 = null;
      let 左のx = 1e9;
      for (let 番 = 0; 番 < (await 区切り.count()); 番++) {
        const b = await 区切り.nth(番).boundingBox();
        if (b && b.x < 左のx) ((左のx = b.x), (左 = 区切り.nth(番)));
      }
      await t.押す(左, { 後: 900 });
      await t.押す(t.字('チーム名を付ける'), { 後: 800 });
      await t.page.getByPlaceholder('例: ◯◯大学').click();
      await t.page.keyboard.type('B大学', { delay: 150 });
      await t.待つ(400);
      await t.押す(t.字('決定'), { 後: 2400 });
    },
  },
  // 過去の記録を編集する：管理者モードを入れ、履歴の記録を開いて○×を押す。
  // 撮ったあと、押したマスを元に戻す（○→×→空→○ と 3 回で一周する）
  y01: {
    見せる: async (t) => {
      await 管理者モードを入れる(t, { 映す: true });
      await t.押す(t.タブ('履歴'), { 後: 1200 });
      await t.押す(
        t.page
          .getByText(/^2026\/\d\d\/\d\d/)
          .locator('visible=true')
          .first(),
        { 後: 1500 }
      );
      t.元の印 = ((await t.マス(0, 0).textContent()) || '').trim();
      await t.押す(t.マス(0, 0), { 後: 1800 });
    },
    // 検証環境の記録を元に戻す（locator の click では届かなかったので、座標で押して確かめる）
    後始末: async (t) => {
      for (let 回 = 0; 回 < 3; 回++) {
        if (((await t.マス(0, 0).textContent()) || '').trim() === t.元の印) return;
        const b = await t.マス(0, 0).boundingBox();
        await t.page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
        await t.待つ(1200);
      }
      throw new Error('撮影で変えたマスを戻せなかった');
    },
  },
  // 団体アカウントを削除する：警告の窓が出るところまで（削除はしない）
  y02: {
    用意: (t) => 管理者モードを入れる(t),
    見せる: async (t) => {
      await t.page.mouse.move(190, 300);
      await t.page.mouse.wheel(0, -3000);
      await t.待つ(600);
      await t.押す(t.字('アカウントを削除する'), { 後: 3000 });
    },
    後始末: async (t) => {
      await t.字('キャンセル').click();
    },
  },
  // AIに聞く：分析の画面から開き、聞けることの例を見せる（記録の画面には AI の印が無い。
  // 送ると本番と同じ枠の模型を使うので送らない）
  x16: {
    見せる: async (t) => {
      await t.押す(t.タブ('分析'), { 後: 1000 });
      await t.押す(t.印('AIを開く'), { 後: 2600 });
    },
  },
  u05: {
    用意: (t) => 射手を並べる(t, 1),
    見せる: async (t) => {
      await t.押す(t.字('選択'), { 後: 1200 });
      await t.押す(部員の行(t), { 後: 1800 });
    },
  },
  // ── 記録表の便利な機能
  u08: { 用意: (t) => 射手を並べる(t, 3), 見せる: async (t) => t.押す(t.印('並べ方'), { 後: 2000 }) },
  u09: {
    用意: (t) => 射手を並べる(t, 3),
    見せる: async (t) => {
      await t.押す(t.印('帯の開け閉め'), { 後: 1600 });
      await t.押す(t.印('帯の開け閉め'), { 後: 1300 });
    },
  },
  u10: {
    用意: (t) => 射手を並べる(t, 2),
    見せる: async (t) => {
      await t.押す(t.字('選択'), { 後: 1000 });
      await t.押す(t.字('途中交代'), { 後: 2200 });
    },
  },
  u11: {
    用意: (t) => 射手を並べる(t, 3),
    見せる: async (t) => {
      await t.押す(t.字('8射'), { 後: 1000 });
      await t.押す(t.字('12射'), { 後: 1700 });
    },
  },
  u13: {
    自動ロック: true,
    用意: (t) => 射手を並べる(t, 3),
    見せる: async (t) => {
      await t.押す(t.マス(0, 0), { 後: 400 });
      await t.押す(t.マス(1, 0), { 囲まない: true, 後: 3800 });
      await t.押す(t.マス(0, 0), { 後: 1500 });
      // 直したいときは長押しで開く
      await t.長押し(t.マス(0, 0), { 後: 1800 });
    },
  },
  x06: {
    用意: async (t) => {
      await 射手を並べる(t, 2);
      await 入れておく(t, [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 2],
        [0, 4],
      ]);
      await t.字('Σ').click();
      await t.待つ(500);
    },
    見せる: async (t) => {
      const 計 = t.page.locator('[data-testid^="計の箱-"]').locator('visible=true').first();
      for (let 回 = 0; 回 < 5; 回++) await t.押す(計, { 囲まない: 回 > 0, 後: 1400 });
    },
  },
  u17: {
    // 右から 人・人・計。1立目（下の4マス）を全部埋めてから、計の列の1立目の鍵を押す
    用意: async (t) => {
      await 射手を並べる(t, 2);
      await 入れておく(t, [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
      ]);
      // ○ と × を混ぜる（もう一度押すと ×）
      await 入れておく(t, [
        [0, 1],
        [1, 3],
        [1, 0],
      ]);
      await t.字('Σ').click();
      await t.待つ(500);
    },
    見せる: async (t) => t.押す(await 下の箱(t, '計の鍵-'), { 後: 2200 }),
  },
  x05: {
    // 動いたのが分かるよう、先頭の列にだけ○を入れておく
    用意: async (t) => {
      await 射手を並べる(t, 3);
      await 入れておく(t, [
        [0, 0],
        [0, 1],
        [0, 2],
      ]);
    },
    見せる: async (t) => {
      const 名 = t.page.getByText('選択', { exact: true }).locator('visible=true');
      const 先 = await 名.nth(2).boundingBox();
      await t.長押しで動かす(名.nth(0), 先.x + 先.width / 2 + 12, 先.y + 先.height / 2);
      await t.待つ(800);
    },
  },
  x11: {
    見せる: async (t) => {
      await t.押す(t.タブ('メンバー'), { 後: 900 });
      await t.押す(部員の行(t), { 後: 1000 });
      await t.押す(
        t.page
          .getByText(/弓具変更履歴/)
          .locator('visible=true')
          .first(),
        { 後: 2000 }
      );
    },
  },
};

/** ログインしていない端末で撮る台本。個人IDは検証環境の合成の値（scripts/seed-stg.mjs の 100007 の部員1） */
const 入る前の台本 = {
  x14: {
    見せる: async (t) => {
      await t.押す(t.字('個人'), { 後: 800 });
      await t.押す(t.page.getByPlaceholder('例: 123456', { exact: true }), { 後: 200 });
      await t.page.keyboard.type('100007', { delay: 120 });
      await t.押す(t.page.getByPlaceholder('例: 1234', { exact: true }), { 後: 200 });
      await t.page.keyboard.type('1071', { delay: 150 });
      await t.待つ(500);
      await t.押す(t.字('ログイン'), { 後: 5000 });
    },
  },
};

for (const [名, 本] of [
  ...Object.entries(台本),
  ...Object.entries(入る前の台本).map(([名, 本]) => [名, { ...本, 入る前: true }]),
]) {
  if (絞り && !絞り.has(名)) continue;
  test(`動画：${名}`, async ({ page, browser }) => {
    if (本.入る前) {
      // 団体の控えを読まない、まっさらの端末
      const 端末 = await browser.newContext({ ...test.info().project.use, storageState: undefined });
      page = await 端末.newPage();
    }
    test.setTimeout(120_000);
    await 案内を止める(page);
    if (本.自動ロック) await 自動ロックを入れる(page);
    await page.goto('/');
    await page.waitForTimeout(本.入る前 ? 6000 : 4000);
    const t = 道具(page);
    if (本.用意) await 本.用意(t);
    if (本.始め === '設定') {
      await t.タブ('設定').click();
      await t.待つ(1200);
    }

    const 絵 = [];
    let 撮る = true;
    const 連写 = (async () => {
      while (撮る) {
        const 時 = Date.now() / 1000;
        const 中身 = await page.screenshot({ type: 'jpeg', quality: 85, scale: 'device' }).catch(() => null);
        if (中身) 絵.push({ 時, 中身 });
      }
    })();
    try {
      await t.待つ(700);
      await 本.見せる(t);
    } finally {
      撮る = false;
      await 連写;
      if (本.後始末) await 本.後始末(t);
    }

    const 絵の置き場 = path.join(置き場, 名);
    fs.rmSync(絵の置き場, { recursive: true, force: true });
    fs.mkdirSync(絵の置き場, { recursive: true });
    const 画面 = page.viewportSize();
    fs.writeFileSync(
      path.join(絵の置き場, 'crop.json'),
      JSON.stringify({ 画面, 切り抜き: 切り抜き[名] || null })
    );
    絵.forEach((一枚, 番) =>
      fs.writeFileSync(
        path.join(絵の置き場, `${String(番).padStart(4, '0')}_${一枚.時.toFixed(3)}.jpg`),
        一枚.中身
      )
    );
  });
}
