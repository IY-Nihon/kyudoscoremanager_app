/**
 * 検査のあいだ dist/ を配る小さな配り口。
 *
 *   node scripts/e2e-server.mjs            （既定：dist を 8091 で）
 *   PW_DIST=dist2 PW_PORT=8090 node scripts/e2e-server.mjs
 *
 * ■ なぜ自前にしたか
 * これまでは `npx --yes http-server dist -p 8091 -s -c-1 --proxy http://127.0.0.1:8091?`
 * を使っていた。問題が2つあった。
 *
 *   1. **転送先が自分自身だった。** 見つからない道（/record など）が来るたびに
 *      自分へもう1本つなぎ直す。1つの求めが2つの接続になるので、機種を3つ
 *      同時に流すと接続が膨らみ、配り口ごと落ちた（実際、174件のうち120件が
 *      page.goto の接続失敗で全滅した）。
 *      ここでは転送をやめ、見つからない道には index.html を直接返す。
 *      本番の Firebase Hosting の rewrites と同じ振る舞いで、接続は1本のまま。
 *
 *   2. **npx が間に入っていた。** 検査が終わって Playwright が止めるのは npx の
 *      ほうで、その下の http-server が生き残る。港8091 が掴まれたままになり、
 *      次の実行が「already used」で始められない（実際に何度も起きた）。
 *      ここでは node が直に聴くので、止めれば必ず離す。
 *
 * ■ 決めごと
 * ・控えは持たせない（no-store）。焼き直した束が古いまま返ると、直したはずの
 *   ものが直っていないように見えて、原因を追う時間が丸ごと無駄になる。
 * ・dist の外は返さない。`..` を含む道は弾く。
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const 港 = Number(process.env.PW_PORT) || 8091;
const 配り元 = path.resolve(process.env.PW_DIST || 'dist');

if (!fs.existsSync(path.join(配り元, 'index.html'))) {
  console.error(`停止：${配り元}/index.html がありません。先に書き出してください`);
  process.exit(1);
}

/** 拡張子から中身の種類を決める。分からないものは、そのまま渡す */
const 種類 = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** 求められた道を、dist の中の実在するファイルへ解く。外は null */
function 解く(求め) {
  let 道;
  try {
    道 = decodeURIComponent(new URL(求め, 'http://x').pathname);
  } catch (e) {
    return null;
  }
  const 先 = path.resolve(配り元, '.' + 道);
  // dist の外へ出る道は返さない
  if (先 !== 配り元 && !先.startsWith(配り元 + path.sep)) return null;
  try {
    const 情報 = fs.statSync(先);
    if (情報.isFile()) return 先;
    if (情報.isDirectory()) {
      const 中 = path.join(先, 'index.html');
      if (fs.existsSync(中)) return 中;
    }
  } catch (e) {
    /* 無ければ下の index.html へ回す */
  }
  return null;
}

const 配り口 = http.createServer((求め, 返し) => {
  const 先 = 解く(求め.url || '/');
  // 見つからない道は index.html を返す（本番の rewrites と同じ）。
  // 転送は挟まない——自分へつなぎ直すと、1つの求めが2つの接続になる
  const 出す = 先 || path.join(配り元, 'index.html');
  fs.readFile(出す, (誤り, 中身) => {
    if (誤り) {
      返し.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      返し.end('読めません');
      return;
    }
    返し.writeHead(200, {
      'Content-Type': 種類[path.extname(出す).toLowerCase()] || 'application/octet-stream',
      // 焼き直した束が古いまま返ると、原因を追う時間が丸ごと無駄になる
      'Cache-Control': 'no-store',
    });
    返し.end(中身);
  });
});

// 同時につなぐ数が多い（機種3つ×作業者2）。node は既定で上限なしなので、
// ここでは触らない——maxConnections は 0 にすると「上限なし」ではなく
// **1本も受けない**になる（実際それで応答が壊れた）
配り口.keepAliveTimeout = 5000;

配り口.listen(港, '127.0.0.1', () => {
  console.log(`配っています: http://127.0.0.1:${港}  ← ${配り元}`);
});

// Playwright はここを止める。node が直に聴いているので、必ず港を離す
for (const 合図 of ['SIGINT', 'SIGTERM']) {
  process.on(合図, () => {
    配り口.close(() => process.exit(0));
    // 掴んだままの接続があっても、待たせすぎない
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
