/**
 * Playwright の設定。書き出した dist/ を配って、本物のブラウザで動かす。
 *
 *   npm run build:stg     … 検証環境向けに書き出す（先に一度）
 *   npm run e2e           … 検査を流す
 *   npm run e2e:ui        … 目で見ながら流す
 *
 * ■ なぜこれを入れたか
 * 案内（チュートリアル）の不具合は、これまで全部この repo の人間が手で
 * 20回くらい押して目で見つけてきた。吹き出しの位置、行き止まり、押しやすさ。
 * どれも機械で測れるものだった。
 *
 * ■ 注意
 * dist/ は書き出したときの接続先（本番／検証）を焼き込んでいる。
 * 検査を流す前に、必ず検証環境向けに書き出し直すこと。
 */
import { defineConfig, devices } from '@playwright/test';

const 港 = 8091;

export default defineConfig({
  testDir: './e2e',
  // 案内は手順を順に踏むので、並列にすると端末保存がぶつかる
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // 案内は27手順あり、手順ごとに位置を測る間がある。既定の30秒では足りない
  timeout: 180_000,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${港}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // iPhone のプロファイルは WebKit を要求して別途100MB落とすことになる。
  // 見たいのは「狭い画面＋指で押す」なので、Chromium 系の端末で足りる
  projects: [
    { name: 'スマホ', use: { ...devices['Pixel 5'] } },
    { name: 'パソコン', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx --yes http-server dist -p ${港} -s -c-1`,
    url: `http://127.0.0.1:${港}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
