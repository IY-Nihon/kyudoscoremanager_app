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

// 港と配り元は環境変数で差し替えられる。検査を流している最中に、
// 別の束を別の港で試したいときに使う（既定はこれまでと同じ）
const 港 = Number(process.env.PW_PORT) || 8091;
const 配り元 = process.env.PW_DIST || 'dist';

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
  // iPhone は WebKit で回す。日本では利用者の多くが Safari で開くうえ、
  // この案内は絶対配置・位置の実測・scrollIntoView に頼っていて、
  // そこは Chromium と WebKit で振る舞いが分かれやすい
  projects: [
    // 先に団体ごとのログインを1回だけ済ませ、控えを作る。
    // 各検査はそれを読み込むので、ログインの往復を繰り返さない。
    // 認証を短い間に何十回も投げなくなるので、429で落ちる取り合いも減る
    { name: '下ごしらえ', testMatch: /auth.setup.mjs/ },
    { name: 'スマホ', dependencies: ['下ごしらえ'], use: { ...devices['Pixel 5'] } },
    // iPhone(WebKit) はまだ緑になっていない。検査のログインが通らず
    // （activeGroupId が null のまま）、アプリ側か検査側かを切り分けられていない。
    // 本番の web 版は iPhone から使われているので、検査側の可能性が高い。
    // WebKit 本体は入れてあるので、この1行を戻せばすぐ再開できる。
    { name: 'iPhone', dependencies: ['下ごしらえ'], use: { ...devices['iPhone 13'] } },
    { name: 'パソコン', dependencies: ['下ごしらえ'], use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // --proxy で、無いパスは index.html へ回す。本番の Firebase Hosting も
    // rewrites で同じことをしている（firebase.json）。
    // これが無いと、ログイン後に URL が /record へ変わったあとの再読み込みで
    // /record を取りにいって404になり、画面が白紙になる。速い画面では
    // 間に合っていたが、iPhone では毎回踏んでいて、検査が6件とも落ちていた。
    command: `npx --yes http-server ${配り元} -p ${港} -s -c-1 --proxy http://127.0.0.1:${港}?`,
    url: `http://127.0.0.1:${港}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
