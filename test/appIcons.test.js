/**
 * ホーム画面に追加したときのアイコンが、正しく置かれているかを見る。
 *
 * ■ なぜこの検査が要るか
 *
 * 2026-09-04 に実測したところ、配信中の Web 版は
 *
 *   ・apple-touch-icon が無い
 *       → iOS はアイコンの代わりに**画面の写し**をホーム画面に置く。
 *         「アイコンが出ない・白紙になる」の正体はこれだった。
 *   ・manifest が無い
 *       → Android でもアプリとして入らず、favicon で代用されていた。
 *   ・絵の周りに白い余白と角丸が焼き込まれていた
 *       → OS が自分の形で切り抜くので、内側に白い四角が残る。
 *         これが「白い座布団」「二重枠」の正体。
 *
 * どれも走らせても分からない。ホーム画面に追加して初めて見える。
 * だから、走らせずにファイルを読んで確かめる。
 *
 * ■ 何を見るか
 *   1. public/ に必要なファイルが揃っているか
 *   2. manifest が指すアイコンが実在し、宣言どおりの大きさか
 *   3. maskable と名乗る絵が、本当に切り抜かれても大丈夫か
 *      （端まで塗ってあり、図柄が中央8割の円に収まっているか）
 *   4. 書き出しの台本が、これらを index.html へ足すようになっているか
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 根 = path.resolve(__dirname, '..');
const ある = (p) => fs.existsSync(path.join(根, p));
const 読む = (p) => fs.readFileSync(path.join(根, p), 'utf8');

/** PNG の IHDR から幅と高さを読む */
function pngの大きさ(p) {
  const b = fs.readFileSync(path.join(根, p));
  assert.equal(
    b.slice(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    `${p} が PNG ではありません（名前が .png でも中身が JPEG のことがある）`
  );
  return { 幅: b.readUInt32BE(16), 高さ: b.readUInt32BE(20) };
}

test('ホーム画面に追加するのに要るファイルが揃っている', () => {
  for (const f of [
    'public/site.webmanifest',
    'public/apple-touch-icon.png',
    'public/icon-192.png',
    'public/icon-512.png',
  ]) {
    assert.ok(ある(f), `${f} がありません。node scripts/make-icons.mjs で作れます`);
  }
});

test('アイコンは本物の PNG で、名乗っている大きさと合っている', () => {
  const 決まり = [
    ['public/apple-touch-icon.png', 180],
    ['public/icon-192.png', 192],
    ['public/icon-512.png', 512],
  ];
  for (const [f, 大きさ] of 決まり) {
    const s = pngの大きさ(f);
    assert.equal(s.幅, 大きさ, `${f} の幅が ${s.幅} です（${大きさ} のはず）`);
    assert.equal(s.高さ, 大きさ, `${f} の高さが ${s.高さ} です（${大きさ} のはず）`);
  }
});

test('manifest が指すアイコンが実在し、大きさの宣言と食い違わない', () => {
  const m = JSON.parse(読む('public/site.webmanifest'));
  assert.ok(Array.isArray(m.icons) && m.icons.length, 'manifest に icons がありません');
  for (const 絵 of m.icons) {
    const f = 'public' + 絵.src;
    assert.ok(ある(f), `manifest が ${絵.src} を指していますが、${f} がありません`);
    const s = pngの大きさ(f);
    assert.equal(
      `${s.幅}x${s.高さ}`,
      絵.sizes,
      `${絵.src} は ${絵.sizes} と名乗っていますが、実際は ${s.幅}x${s.高さ} です`
    );
  }
  // ホーム画面の名前は横に広がらない。長いと真ん中で省かれる
  assert.ok(m.short_name && m.short_name.length <= 12, 'short_name が長すぎます');
});

test('maskable と名乗る絵は、切り抜かれても白が出ない', async () => {
  const sharp = require('sharp');
  const m = JSON.parse(読む('public/site.webmanifest'));
  const 対象 = m.icons.filter((x) => String(x.purpose || '').includes('maskable'));
  assert.ok(対象.length, 'maskable と名乗る絵がありません');

  for (const 絵 of 対象) {
    const f = path.join(根, 'public' + 絵.src);
    const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H, channels: C } = info;
    const 点 = (x, y) => {
      const i = (y * W + x) * C;
      return [data[i], data[i + 1], data[i + 2], C > 3 ? data[i + 3] : 255];
    };

    // 1. 四隅が透けても白くもない（＝端まで塗ってある）
    for (const [x, y, 名] of [
      [0, 0, '左上'],
      [W - 1, 0, '右上'],
      [0, H - 1, '左下'],
      [W - 1, H - 1, '右下'],
    ]) {
      const p = 点(x, y);
      assert.equal(p[3], 255, `${絵.src} の${名}が透けています（maskable は端まで塗る）`);
      assert.ok(
        !(p[0] > 240 && p[1] > 240 && p[2] > 240),
        `${絵.src} の${名}が白いままです（OS が切り抜くと白い座布団になる）`
      );
    }

    // 2. 図柄が中央8割の円（安全域）に収まっている。
    //    ここからはみ出した所は、OS の切り抜きで欠ける
    const 地 = 点(0, 0);
    const 同じ色 = (p) =>
      Math.abs(p[0] - 地[0]) < 40 && Math.abs(p[1] - 地[1]) < 40 && Math.abs(p[2] - 地[2]) < 40;
    const cx = W / 2;
    const cy = H / 2;
    let 最遠 = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (同じ色(点(x, y))) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d > 最遠) 最遠 = d;
      }
    }
    const 安全半径 = W * 0.4;
    assert.ok(
      最遠 <= 安全半径,
      `${絵.src} の図柄が安全域をはみ出しています（中心から ${最遠.toFixed(0)}px / 上限 ${安全半径.toFixed(0)}px）`
    );
  }
});

test('書き出しの台本が、アイコンと manifest を index.html へ足す', () => {
  const s = 読む('scripts/patch-index-html.mjs');
  for (const 印 of [
    'apple-touch-icon',
    'site.webmanifest',
    'theme-color',
    'apple-mobile-web-app-capable',
  ]) {
    assert.ok(s.includes(印), `patch-index-html.mjs が ${印} を足していません`);
  }
});

test('配信の決まりが、manifest の型を正しく出す', () => {
  const j = JSON.parse(読む('firebase.json'));
  const 決まり = (j.hosting?.headers || []).find((h) => h.source === '/site.webmanifest');
  assert.ok(決まり, 'firebase.json に /site.webmanifest の決まりがありません');
  const 型 = (決まり.headers || []).find((h) => h.key === 'Content-Type');
  assert.ok(
    型 && 型.value.includes('application/manifest+json'),
    'site.webmanifest の Content-Type が application/manifest+json になっていません'
  );
});
