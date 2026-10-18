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
        丸.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:22px;background:rgba(255,255,255,.55);border:3px solid rgba(255,90,60,.95);z-index:2147483647;pointer-events:none;transition:transform .25s, opacity .4s;transform:scale(1.3)`;
        document.body.appendChild(丸);
        requestAnimationFrame(() => (丸.style.transform = 'scale(1)'));
        setTimeout(() => (丸.style.opacity = '0'), 700);
        setTimeout(() => 丸.remove(), 1200);
      },
      [x, y]
    );
  const 箱 = async (loc) => {
    await loc.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    const b = await loc.boundingBox({ timeout: 8000 });
    if (!b) throw new Error('見つからない: ' + loc);
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

/** 並べた射手に、左から部員を割り当てる（撮る前の下ごしらえ） */
async function 名前を決めておく(t, 人数) {
  // 窓の一覧の並び（学年の順）。先に割り当てた人は「選択済」になるので、毎回ちがう人を名指しする。
  // 記録表の名前のマスにも同じ字が出るので、窓の側（あとに描かれる方）を押す
  const 名たち = ['部員4', '部員1', '部員2', '部員3'];
  for (let 番 = 0; 番 < 人数; 番++) {
    await t.字('選択').click();
    await t.待つ(700);
    await t.page.getByText(new RegExp('^' + 名たち[番] + ' ')).locator('visible=true').last().click();
    await t.待つ(500);
  }
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
  // ── メンバーの登録
  u01: { 見せる: async (t) => t.押す(t.タブ('メンバー'), { 後: 1800 }) },
  u02: {
    見せる: async (t) => {
      await t.押す(t.タブ('メンバー'), { 後: 1000 });
      await t.押す(t.印('AIを開く'), { 後: 2000 });
    },
  },
  x01: {
    見せる: async (t) => {
      await t.押す(t.タブ('メンバー'), { 後: 1000 });
      await t.押す(部員の行(t), { 後: 2000 });
    },
  },
  // ── 記録の取り方
  u03: { 始め: '設定', 見せる: async (t) => t.押す(t.タブ('記録'), { 後: 1800 }) },
  u04: {
    見せる: async (t) => {
      await t.押す(t.札('射手を追加'), { 後: 700 });
      await t.押す(t.札('射手を追加'), { 囲まない: true, 後: 700 });
      await t.押す(t.札('射手を追加'), { 囲まない: true, 後: 1300 });
    },
  },
  u05: {
    用意: (t) => 射手を並べる(t, 1),
    見せる: async (t) => {
      await t.押す(t.字('選択'), { 後: 1200 });
      await t.押す(部員の行(t), { 後: 1800 });
    },
  },
  u06: {
    用意: (t) => 射手を並べる(t, 3),
    見せる: async (t) => {
      await t.押す(t.マス(0, 0), { 後: 700 });
      await t.押す(t.マス(0, 0), { 囲まない: true, 後: 700 });
      await t.押す(t.マス(0, 0), { 囲まない: true, 後: 700 });
      await t.押す(t.マス(0, 0), { 囲まない: true, 後: 600 });
      await t.押す(t.マス(1, 0), { 囲まない: true, 後: 500 });
      await t.押す(t.マス(2, 0), { 囲まない: true, 後: 500 });
      await t.押す(t.マス(2, 0), { 囲まない: true, 後: 1500 });
    },
  },
  u07: {
    用意: async (t) => {
      await 射手を並べる(t, 2);
      await 名前を決めておく(t, 2);
      await 入れておく(t, [
        [0, 0],
        [1, 1],
      ]);
    },
    見せる: async (t) => t.押す(t.札('終了して保存'), { 後: 2400 }),
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
  u12: {
    用意: (t) => 射手を並べる(t, 3),
    見せる: async (t) => {
      await t.押す(t.page.getByText(/^100%/).locator('visible=true').first(), { 後: 1000 });
      await t.押す(t.字('150%'), { 後: 1700 });
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
  u14: { 用意: (t) => 射手を並べる(t, 2), 見せる: async (t) => t.押す(t.字('間隔'), { 後: 1800 }) },
  u15: {
    用意: (t) => 射手を並べる(t, 2),
    見せる: async (t) => {
      await t.押す(t.字('間隔'), { 後: 800 });
      await t.押す(t.札('射手を追加'), { 後: 600 });
      await t.押す(t.札('射手を追加'), { 囲まない: true, 後: 1500 });
    },
  },
  u16: {
    用意: async (t) => {
      await 射手を並べる(t, 3);
      await 入れておく(t, [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 2],
      ]);
    },
    見せる: async (t) => t.押す(t.字('Σ'), { 後: 2000 }),
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
  x07: {
    用意: async (t) => {
      await 射手を並べる(t, 2);
      await t.字('間隔').click();
      await t.待つ(200);
      await 射手を並べる(t, 2);
      await 入れておく(t, [
        [0, 0],
        [1, 0],
        [1, 1],
      ]);
      await t.字('Σ').click();
      await t.待つ(400);
    },
    見せる: async (t) => {
      // 計の列のいちばん下（名前の欄）
      await t.押す(t.page.locator('[data-testid^="名の欄-合計-"]').locator('visible=true').last(), {
        後: 1200,
      });
      await t.押す(t.字('手前の計もまとめた総計にする'), { 後: 2000 });
    },
  },
  u17: {
    用意: async (t) => {
      await t.字('間隔').click();
      await t.待つ(300);
      await 射手を並べる(t, 2);
      await 入れておく(t, [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 2],
        [1, 3],
      ]);
    },
    // 数え終わった 1立目（いちばん下の箱）を固定する
    見せる: async (t) => t.押す(await 下の箱(t, '間隔の箱-'), { 後: 2200 }),
  },
  u18: {
    用意: (t) => 射手を並べる(t, 2),
    見せる: async (t) => {
      await t.押す(t.マス(0, 0), { 後: 500 });
      await t.押す(t.マス(0, 1), { 囲まない: true, 後: 800 });
      await t.押す(t.印('取り消し'), { 後: 1000 });
      await t.押す(t.印('取り消し'), { 囲まない: true, 後: 1500 });
    },
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
  u19: { 用意: (t) => 射手を並べる(t, 2), 見せる: async (t) => t.囲む(t.札('リセット'), 2400) },
  // ── 写真・ライブ
  u20: { 用意: (t) => 射手を並べる(t, 2), 見せる: async (t) => t.囲む(t.字('画像'), 2400) },
  u22: { 用意: (t) => 射手を並べる(t, 2), 見せる: async (t) => t.押す(t.字('ライブ'), { 後: 2400 }) },
  // ── 履歴・分析
  u23: {
    見せる: async (t) => {
      await t.押す(t.タブ('履歴'), { 後: 1200 });
      await t.巻く(500);
      await t.待つ(700);
    },
  },
  x08: {
    見せる: async (t) => {
      await t.押す(t.タブ('履歴'), { 後: 1000 });
      await t.押す(t.page.getByPlaceholder(/検索/).locator('visible=true').first(), { 後: 300 });
      await t.page.keyboard.type('練習', { delay: 200 });
      await t.待つ(2000);
    },
  },
  u25: {
    見せる: async (t) => {
      await t.押す(t.タブ('分析'), { 後: 1200 });
      await t.巻く(700);
      await t.待つ(700);
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
  // ── 弓具・出欠・設定
  u28: { 見せる: async (t) => t.押す(t.タブ('出欠'), { 後: 1800 }) },
  x10: {
    見せる: async (t) => {
      await t.押す(t.タブ('出欠'), { 後: 1000 });
      await t.押す(
        t.page
          .getByText(/練習日/)
          .locator('visible=true')
          .first(),
        { 後: 1200 }
      );
      const 日 = t.page.getByText('25', { exact: true }).locator('visible=true').first();
      await t.押す(日, { 後: 1500 });
      // 検証環境の練習日を残さないよう、もう一度押して戻す（映すのはここまで）
      await t.押す(日, { 囲まない: true, 後: 600 });
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
  u29: { 見せる: async (t) => t.押す(t.タブ('設定'), { 後: 1800 }) },
  u30: {
    始め: '設定',
    見せる: async (t) =>
      t.囲む(
        t.page.getByText('矢所の記録機能を有効化', { exact: true }).locator('visible=true').first(),
        2200
      ),
  },
  u31: {
    始め: '設定',
    見せる: async (t) =>
      t.囲む(
        t.page
          .getByText(/^管理者モード/)
          .locator('visible=true')
          .first(),
        2200
      ),
  },
  u32: { 始め: '設定', 見せる: async (t) => t.囲む(t.字('運用ガイド・ヘルプ'), 2200) },
  x12: {
    始め: '設定',
    見せる: async (t) =>
      t.押す(
        t.page
          .getByText(/Excel形式で書き出し/)
          .locator('visible=true')
          .first(),
        { 後: 2200 }
      ),
  },
  x13: {
    始め: '設定',
    見せる: async (t) => {
      await t.押す(t.字('ダーク'), { 後: 1600 });
      await t.押す(t.字('ライト'), { 後: 1200 });
    },
  },
};

/**
 * ログインしていない端末で撮る台本。個人IDは検証環境の合成の値（scripts/seed-stg.mjs の 100007 の部員1）
 */
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
