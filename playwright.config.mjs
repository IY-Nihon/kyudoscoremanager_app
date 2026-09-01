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
  // 案内は手順を順に踏むので、1つの検査の中は順番どおりに流す
  fullyParallel: false,
  // 検査の束（ファイル）どうしは並列でよい。団体を分けてあるので取り合わない
  //（scripts/stg-fixtures.mjs、test/e2eSetup.test.js で決まりを押さえている）。
  // 1並列だと3機種で50分、2並列で23分だった
  workers: Number(process.env.PW_WORKERS) || 2,
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
    // iPhone(WebKit) も通っている。ここでしか出ない差が実際にあるので外さないこと
    // （例：localStorage のメソッドは WebKit では差し替えられず、検査が
    //  空振りしていた。パソコンだけ見ていると気づけない）
    { name: 'iPhone', dependencies: ['下ごしらえ'], use: { ...devices['iPhone 13'] } },
    { name: 'パソコン', dependencies: ['下ごしらえ'], use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // 無い道は index.html へ回す（本番の Firebase Hosting の rewrites と同じ）。
    // これが無いと、ログイン後に URL が /record へ変わったあとの再読み込みで
    // /record を取りにいって404になり、画面が白紙になる。
    //
    // 以前は `npx --yes http-server … --proxy http://127.0.0.1:${港}?` を使って
    // いたが、2つ困ることがあった（scripts/e2e-server.mjs に詳しく書いてある）。
    //   ・転送先が自分自身で、無い道が来るたびに接続が倍になる。機種を3つ
    //     同時に流すと配り口ごと落ちた（174件中120件が接続失敗で全滅）
    //   ・npx が間に入るので、止めても下の http-server が生き残り、
    //     港が掴まれたまま次の実行が始められなくなった
    // いまは node が直に聴いている。止めれば必ず離す。
    command: `node scripts/e2e-server.mjs`,
    env: { PW_PORT: String(港), PW_DIST: 配り元 },
    url: `http://127.0.0.1:${港}`,
    // 使い回さない。前の実行の配り口が残っていると、焼き直す前の束を
    // 配ってしまい、直したはずのものが直っていないように見える
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
