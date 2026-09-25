/**
 * 記録画面で、ますを押してから描き変わるまでの時間をはかる。
 *
 *   node scripts/perf-tap.mjs [人数] [射数] [CPUの遅さ] [端末に持たせる記録の件数]
 *   例: node scripts/perf-tap.mjs 30 20 6 100   → 30 人・20 射、CPU を 6 倍遅く、記録 100 件を持たせて
 *
 * 検証用サーバー（PW_PORT=8091 node scripts/e2e-server.mjs）を立てておくこと。
 * 団体 100003 の控え（e2e/.auth）で入り、人を足して射数を増やし、ますを 12 回押す。
 * 押した時刻（pointerdown）と、画面が書き変わった時刻（MutationObserver）の差を出す。
 * 古い端末を考えるときの物差し。人が遅いと感じるのは 100ms あたりから。
 *
 * 記録の件数を渡すと、開く前に端末の控え（localStorage）へ偽の記録を足す。
 * 本番の大きい団体は記録が 2MB を超えていて、ますを押すたびに控えを書き直す
 * 重さが効くので、それを再現する（1 件はおよそ 15KB。20 人 × 20 射 に矢所つき）。
 */
'use strict';

import { chromium } from '@playwright/test';

const 人数 = Number(process.argv[2]) || 20;
const 射数 = Number(process.argv[3]) || 20;
const 遅さ = Number(process.argv[4]) || 4;
const 記録の件数 = Number(process.argv[5]) || 0;

const b = await chromium.launch();
const c = await b.newContext({
  storageState: 'e2e/.auth/100003.json',
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
if (記録の件数 > 0) {
  await c.addInitScript((件数) => {
    try {
      if (window.__足した) return;
      window.__足した = true;
      const 鍵 = 'archery-score-storage';
      const 元 = JSON.parse(localStorage.getItem(鍵) || '{}');
      const 状態 = 元.state || (元.state = {});
      const 今 = Date.now();
      const 記録たち = [];
      for (let i = 0; i < 件数; i++) {
        const archers = [];
        for (let a = 0; a < 20; a++) {
          archers.push({
            id: `perf-${i}-${a}`,
            name: `部員${a + 1}`,
            memberId: `m-${a}`,
            gender: a % 2 ? '男子' : '女子',
            grade: (a % 4) + 1,
            marks: Array.from({ length: 20 }, (_, k) => ((a + k + i) % 3 ? '○' : '×')),
            arrowLocations: Array.from({ length: 20 }, (_, k) => ({
              x: ((a * 7 + k) % 100) / 100,
              y: ((k * 13 + i) % 100) / 100,
            })),
            lockedBlocks: { 0: true, 1: true, 2: true, 3: true, 4: true },
            substitutions: {},
            substitutionIds: {},
            lastModified: 今 - i * 86400000,
          });
        }
        記録たち.push({
          id: `perf-ses-${i}`,
          date: 今 - (i + 1) * 86400000,
          title: `性能の確かめ ${i + 1}`,
          note: '端末の控えの重さを見るための偽の記録',
          archers,
          archerNames: archers.map((x) => x.name),
          shotCount: 20,
          includeInStats: true,
          tags: ['#正規練習'],
          syncStatus: '同期済み',
          lastModified: 今 - i * 86400000,
        });
      }
      状態.sessions = [...(状態.sessions || []), ...記録たち];
      状態.lastSyncTime = 今;
      localStorage.setItem(鍵, JSON.stringify(元));
    } catch (e) {
      console.error('偽の記録を足せなかった', e);
    }
  }, 記録の件数);
}
const p = await c.newPage();
await p.goto('http://127.0.0.1:8091/');
await p.waitForTimeout(8000);
const skip = p.getByText('スキップ', { exact: true });
if (await skip.isVisible().catch(() => false)) await skip.click();
for (let i = 0; i < 人数; i++) {
  await p.getByText('人', { exact: true }).first().click();
  await p.waitForTimeout(40);
}
for (let s = 8; s < 射数; s += 4) {
  await p.locator('[aria-label="射数を4本増やす"]').click();
  await p.waitForTimeout(150);
}
await p.waitForTimeout(500);
// PERF_TABS=1 のときは先に履歴と分析のタブを、PERF_TABS=全部 のときは全部のタブを開いてから戻る。タブは一度開くと裏でも
// 生きたままなので、それらの画面の描き直しも押した手応えに乗るかを見る
if (process.env.PERF_TABS) {
  const 開く = process.env.PERF_TABS === '全部' ? ['履歴', '分析', 'メンバー', '出欠', '設定', '記録'] : ['履歴', '分析', '記録'];
  for (const 名 of 開く) {
    await p.getByText(名, { exact: true }).last().click();
    await p.waitForTimeout(2500);
  }
}
const 数 = await p.locator('[data-testid^="ます-"]').count();
const 控え = await p.evaluate(() => {
  const s = localStorage.getItem('archery-score-storage') || '';
  return {
    大きさKB: Math.round(s.length / 1024),
    記録: (JSON.parse(s || '{}').state || {}).sessions?.length,
  };
});

const cdp = await c.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 遅さ });
await p.evaluate(() => {
  window.__計測 = { 押した: 0, 出た: 0 };
  document.addEventListener(
    'pointerdown',
    () => {
      window.__計測.押した = performance.now();
      window.__計測.出た = 0;
    },
    true
  );
  new MutationObserver(() => {
    if (window.__計測.押した && !window.__計測.出た) window.__計測.出た = performance.now();
  }).observe(document.body, { subtree: true, childList: true, characterData: true });
});
const cells = p.locator('[data-testid^="ます-"]');
const 時間 = [];
for (let i = 0; i < 12; i++) {
  const cell = cells.nth((i * 37) % 数);
  await cell.scrollIntoViewIfNeeded();
  await cell.click();
  await p.waitForTimeout(600);
  時間.push(Math.round(await p.evaluate(() => window.__計測.出た - window.__計測.押した)));
}
const 並び = [...時間].sort((x, y) => x - y);
console.log(
  `${人数} 人 × ${射数} 射（ます ${数}）、CPU ${遅さ} 倍遅く、端末の控え ${控え.大きさKB}KB（記録 ${控え.記録} 件）`
);
console.log(`押してから描き変わるまで(ms): ${時間.join(' ')}`);
console.log(`中央値 ${並び[Math.floor(並び.length / 2)]} ms、最大 ${並び[並び.length - 1]} ms`);
await b.close();
