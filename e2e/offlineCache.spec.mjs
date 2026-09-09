/**
 * オフラインの控え（Firestore のローカルキャッシュ）まわりの検査。
 *
 *   npx playwright test e2e/offlineCache.spec.mjs
 *
 * ■ なぜこれを入れたか
 *
 * 以前は getFirestore のあとに enableIndexedDbPersistence を呼んでいた。
 * あの作りは1つの窓しか控えを持てず、2つ目に開いた窓は
 * 「Failed to obtain exclusive access to the persistence layer」で弾かれて
 * 記憶だけの控えに落ちる。落ちるだけならまだしも、本番では
 * FIRESTORE INTERNAL ASSERTION FAILED (ID: b815) に化けて、その窓の同期が
 * まるごと死んでいた（2026/9/6、団体910280 で10回）。
 * 「スマホでアプリを開くと同期に失敗する」という声の形と合う。
 *
 * 目で見つけるのが難しい型なので、2つ開いて控えの誤りが出ないことを見る。
 * 元の作りに戻すと、2つ目で必ず誤りが出るので落ちる。
 *
 * ■ 団体には書き込まない
 * 入って眺めるだけ。記録も名簿も足さないので、100001 を使う他の検査と
 * 並べて流してよい。
 */
import { test, expect } from '@playwright/test';
import {
  案内を止める,
  画面が出るまで待つ,
  入り口が決まるまで待つ,
  こうなるまで待つ,
  団体で入る,
} from './helpers.mjs';

const 団体 = '100001';
const 合言葉 = 'StgTest!2026';
test.use({ storageState: 'e2e/.auth/100001.json' });

/** 控えが持てなかったことを表す言い回し。版が変わっても拾えるよう緩く見る */
const 控えの誤り = /exclusive access|INTERNAL ASSERTION|Falling back to memory cache/i;

test('控え：同じ端末で2つ開いても、どちらも控えを持てる', async ({ context }) => {
  test.setTimeout(300_000);

  const 誤り = [];
  const 開く = async (名) => {
    const p = await context.newPage();
    p.on('pageerror', (e) => {
      if (控えの誤り.test(String(e))) 誤り.push(名 + ': ' + String(e).slice(0, 200));
    });
    p.on('console', (m) => {
      if (控えの誤り.test(m.text())) 誤り.push(名 + ': ' + m.text().slice(0, 200));
    });
    await 案内を止める(p);
    await p.goto('/');
    await 画面が出るまで待つ(p);
    await 入り口が決まるまで待つ(p);
    await 団体で入る(p, 団体, 合言葉);
    return p;
  };

  // 1つ目が控えを取ったあとで、2つ目を開く
  const 一 = await 開く('1つ目');
  await 一.waitForTimeout(3000);
  const 二 = await 開く('2つ目');
  await 二.waitForTimeout(8000);

  // どちらの窓にも名簿が届いていること（同期が生きている）
  for (const [名, p] of [
    ['1つ目', 一],
    ['2つ目', 二],
  ]) {
    await こうなるまで待つ(
      () =>
        p.evaluate(
          () =>
            (
              (JSON.parse(localStorage.getItem('archery-score-storage') || '{}').state || {})
                .members || []
            ).length
        ),
      (n) => n > 0,
      30000
    );
    const 数 = await p.evaluate(
      () =>
        (
          (JSON.parse(localStorage.getItem('archery-score-storage') || '{}').state || {}).members ||
          []
        ).length
    );
    expect(数, `${名}に名簿が届いていない`).toBeGreaterThan(0);
  }

  // 「電波の無い場所での保存が守られません」の帯が出ていないこと。
  // 控えが取れていれば出ない
  for (const [名, p] of [
    ['1つ目', 一],
    ['2つ目', 二],
  ]) {
    await expect(
      p.getByText(/複数のタブで開かれているため|保存が保護されません/),
      `${名}に控えの警告が出ている`
    ).toHaveCount(0);
  }

  expect(誤り, '控えが取れなかった：' + 誤り.join(' / ')).toEqual([]);
});
