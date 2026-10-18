/**
 * 「使い方を見る」の動画を撮る道具（検査ではない。ふだんの e2e では飛ばす）。
 *
 *   RECORD_USAGE=1 PW_DIST=dist-stg-e2e npx playwright test e2e/record-usage-videos.spec.mjs --project=スマホ
 *   node scripts/usage-videos.mjs   … 撮った絵を public/usage/*.mp4 にまとめる
 *
 * 検証環境の合成の団体で、選び窓から手順を 1 つずつ始め、青い枠の先を指で押すところを撮る。
 * 吹き出しは隠す（動画の下に同じ文を出すので）。絵は写真の連写で撮る
 * （録画の機能は画質が粗い）。画面が変わったら撮り直す。
 */
import { test } from '@playwright/test';
import { 案内を止める } from './helpers.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { 手順を作る, まとまりの一覧, 動画の名 } from '../src/tutorialSteps.js';

test.skip(!process.env.RECORD_USAGE, '動画を撮るときだけ流す');
test.use({ storageState: 'e2e/.auth/100001.json' });

const 置き場 = process.env.USAGE_RAW || path.join('e2e', '.usage-raw');
const 一覧 = (() => {
  const { 基本, 続き } = 手順を作る('group', { 部員数: 6, 記録数: 10 });
  const 全部 = [...基本, ...続き];
  return まとまりの一覧(基本, 続き).flatMap((組) =>
    組.題たち.map((題) => ({ 組: 組.名, 題, 手順: 全部.find((一つ) => 一つ.題 === 題) }))
  );
})();
const 絞り = process.env.USAGE_ONLY ? new Set(process.env.USAGE_ONLY.split(',')) : null;

/** 指の丸を出してから押す */
async function 指で押す(page, x, y) {
  await page.evaluate(
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
  await page.waitForTimeout(350);
  await page.mouse.click(x, y);
}

/** 吹き出しを隠す（番号札「1 / 1」からたどる。tutorial.spec と同じ見つけ方） */
const 吹き出しを隠す = (page) =>
  page.evaluate(() => {
    const 札 = [...document.querySelectorAll('div')].find(
      (e) => e.children.length === 0 && /^\d+ \/ \d+$/.test((e.textContent || '').trim())
    );
    let n = 札;
    for (let i = 0; n && i < 14 && n.parentElement; i++) {
      n = n.parentElement;
      if ((n.textContent || '').includes('スキップ') && getComputedStyle(n).position === 'absolute') {
        n.style.visibility = 'hidden';
        return true;
      }
    }
    return false;
  });

const 青い枠 = (page) =>
  page.evaluate(() => {
    const 枠 = [...document.querySelectorAll('div')].find((e) => {
      const s = getComputedStyle(e);
      return (
        s.position === 'absolute' &&
        s.borderStyle === 'solid' &&
        parseFloat(s.borderTopWidth) >= 2 &&
        /rgb\(0,\s*122,\s*255\)/.test(s.borderTopColor)
      );
    });
    if (!枠) return null;
    const r = 枠.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

for (const { 組, 題, 手順 } of 一覧) {
  if (絞り && !絞り.has(動画の名(題))) continue;
  // 指す先の無い手順（説明だけ）は、撮っても止まった画面になるので撮らない。
  // 「設定を見てみましょう」は設定から始めるので、押しても変わらない
  if (!手順.目印 || 手順.題 === '設定を見てみましょう') continue;
  test(`動画：${動画の名(題)} ${題}`, async ({ page }) => {
    test.setTimeout(120_000);
    await 案内を止める(page);
    await page.goto('/');
    await page.waitForTimeout(4000);
    // 空の記録表では何の話か分かりにくいので、射手を 3 人並べておく（案内が終われば元に戻る）
    for (let 回 = 0; 回 < 3; 回++) {
      await page.getByText('人', { exact: true }).locator('visible=true').first().click();
      await page.waitForTimeout(300);
    }
    // 設定のタブ → 使い方を見る → まとまり → 手順
    await page.locator('text=設定').locator('visible=true').last().click();
    await page.getByText('使い方を見る', { exact: true }).click();
    await page.getByTestId('使い方の組-' + 組).click();

    const 絵の置き場 = path.join(置き場, 動画の名(題));
    fs.rmSync(絵の置き場, { recursive: true, force: true });
    fs.mkdirSync(絵の置き場, { recursive: true });
    // 絵は写真の連写で撮る。screencast は CSS の大きさ（393 幅）でしか届かず、動画にすると字がにじむ
    const 絵 = [];
    let 撮る = false;
    let 連写 = null;
    const 撮り始める = () => {
      撮る = true;
      連写 = (async () => {
        while (撮る) {
          const 時 = Date.now() / 1000;
          const 中身 = await page
            .screenshot({ type: 'jpeg', quality: 85, scale: 'device' })
            .catch(() => null);
          if (中身) 絵.push({ 時, 中身 });
        }
      })();
    };
    await page
      .locator('[testID="使い方の選び窓"], [data-testid="使い方の選び窓"]')
      .getByText(題, { exact: true })
      .click();
    // 項目を押すとその場で動画が開く。撮るのは画面の上の案内なので「実際にやってみる」へ進む
    await page.getByTestId('使い方-やってみる').click();
    // 枠が測り終わるまで待ってから撮り始める
    await page.waitForTimeout(1500);
    await 吹き出しを隠す(page);
    撮り始める();
    await page.waitForTimeout(900);
    const 枠 = await 青い枠(page);
    const 種類 = 手順.操作 && 手順.操作.種類;
    if (枠 && 種類 && 種類 !== '部員を増やす') {
      if (種類 === '鍵をかける') {
        // 鍵は区切りの箱にある
        const b = await page.locator('[data-testid^="間隔の箱-"]').first().boundingBox();
        await 指で押す(page, b.x + b.width / 2, b.y + b.height / 2);
      } else {
        await 指で押す(page, 枠.x + 枠.w / 2, 枠.y + Math.min(枠.h / 2, 60));
      }
      // 押したところで手順は済み、少しすると案内が閉じて始めた画面（設定）へ戻る。
      // 開いた一覧で選ぶところまでは撮れないので、開いたところで止める
      if (種類 === '○×を入れる') {
        // 続けて押して ○ → × → 空 と変わるところと、別のマスに入れるところを見せる
        for (const [右, 下] of [
          [0, 0],
          [0, 0],
          [0, 38],
          [0, 76],
        ]) {
          await page.waitForTimeout(500);
          await 指で押す(page, 枠.x + 枠.w / 2 + 右, 枠.y + Math.min(枠.h / 2, 60) + 下);
        }
      }
      await page.waitForTimeout(種類 === '○×を入れる' ? 1000 : 900);
    } else {
      await page.waitForTimeout(2600);
    }
    撮る = false;
    await 連写;
    // 指す先が画面の外（設定の下のほう）だと、暗い画面が映るだけなので動画にしない
    const 画面 = page.viewportSize();
    if (!枠 || 枠.y + 枠.h / 2 > 画面.height || 枠.y + 枠.h / 2 < 0) {
      fs.rmSync(絵の置き場, { recursive: true, force: true });
      fs.rmSync(path.join('public', 'usage', 動画の名(題) + '.mp4'), { force: true });
      test.info().annotations.push({ type: '撮らない', description: '指す先が画面の外' });
      return;
    }
    絵.forEach((一枚, 番) =>
      fs.writeFileSync(
        path.join(絵の置き場, `${String(番).padStart(4, '0')}_${一枚.時.toFixed(3)}.jpg`),
        一枚.中身
      )
    );
  });
}
