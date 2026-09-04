/**
 * ホーム画面に追加したときのアイコンが、正しく置かれているかを見る。
 *
 * ■ なぜこの検査が要るか
 *
 * 2026-09 に本番の配信物を実測したところ、iPad でホーム画面に置いても
 * アイコンが出なかった。原因は apple-touch-icon が**透過付き**で、角の
 * アルファが 103〜174 と半透明だったこと。iOS は透明な角を黒で合成した
 * うえに自前の角丸マスクを重ねるため、うまく表示できなかった。
 * Android と PC では出ていたが、余白と角丸が焼き込まれていて座りが悪かった。
 *
 * どれも走らせても分からない。ホーム画面に追加して初めて見える。
 * だから、走らせずにファイルを読んで確かめる。
 *
 * ■ web の PWA アイコンの置き場
 *   pwa/ に置き、deploy-web.ps1 が dist の直下へ配る。ここが本番で使われる
 *   唯一の系。アイコンは scripts/make-icons.mjs が pwa/ に作る。
 *
 * ■ 何を見るか
 *   1. pwa/ に必要なファイルが揃っているか
 *   2. manifest が指すアイコンが実在し、宣言どおりの大きさか
 *   3. すべてのアイコンが**不透明**か（iOS の件の再発を防ぐ肝）
 *   4. maskable と名乗る絵が、端まで塗ってあり、図柄が安全域に収まっているか
 *   5. deploy-web.ps1 が apple-touch-icon と manifest を注入するか
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 根 = path.resolve(__dirname, '..');
const ある = (p) => fs.existsSync(path.join(根, p));
const 読む = (p) => fs.readFileSync(path.join(根, p), 'utf8');

/** PNG の IHDR から幅・高さ・色の種類を読む */
function png情報(p) {
  const b = fs.readFileSync(path.join(根, p));
  assert.equal(
    b.slice(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    `${p} が PNG ではありません（名前が .png でも中身が JPEG のことがある）`
  );
  // colorType 6 と 4 はアルファの層を持つ（＝透過あり）
  const colorType = b[25];
  return { 幅: b.readUInt32BE(16), 高さ: b.readUInt32BE(20), 透過: colorType === 6 || colorType === 4 };
}

const アイコン = [
  ['pwa/apple-touch-icon.png', 180],
  ['pwa/icon-192.png', 192],
  ['pwa/icon-512.png', 512],
];

test('ホーム画面に追加するのに要るファイルが揃っている', () => {
  for (const f of ['pwa/manifest.json', 'pwa/sw.js', ...アイコン.map(([f]) => f)]) {
    assert.ok(ある(f), `${f} がありません。node scripts/make-icons.mjs で作れます`);
  }
});

test('アイコンは本物の PNG で、名乗っている大きさと合っている', () => {
  for (const [f, 大きさ] of アイコン) {
    const s = png情報(f);
    assert.equal(s.幅, 大きさ, `${f} の幅が ${s.幅} です（${大きさ} のはず）`);
    assert.equal(s.高さ, 大きさ, `${f} の高さが ${s.高さ} です（${大きさ} のはず）`);
  }
});

test('アイコンはすべて不透明（iOS でアイコンが出なくなる透過を持たない）', () => {
  for (const [f] of アイコン) {
    const s = png情報(f);
    assert.equal(s.透過, false, `${f} がアルファの層を持っています（iOS の apple-touch-icon は透過を嫌う）`);
  }
});

test('manifest が指すアイコンが実在し、大きさの宣言と食い違わない', () => {
  const m = JSON.parse(読む('pwa/manifest.json'));
  assert.ok(Array.isArray(m.icons) && m.icons.length, 'manifest に icons がありません');
  for (const 絵 of m.icons) {
    const f = 'pwa' + 絵.src;
    assert.ok(ある(f), `manifest が ${絵.src} を指していますが、${f} がありません`);
    const s = png情報(f);
    assert.equal(
      `${s.幅}x${s.高さ}`,
      絵.sizes,
      `${絵.src} は ${絵.sizes} と名乗っていますが、実際は ${s.幅}x${s.高さ} です`
    );
  }
  // ホーム画面の名前は横に広がらない。長いと真ん中で省かれる
  assert.ok(m.short_name && m.short_name.length <= 12, 'short_name が長すぎます');
});

test('maskable と名乗る絵は、端まで塗ってあり図柄が安全域に収まる', async () => {
  const sharp = require('sharp');
  const m = JSON.parse(読む('pwa/manifest.json'));
  const 対象 = m.icons.filter((x) => String(x.purpose || '').includes('maskable'));
  assert.ok(対象.length, 'maskable と名乗る絵がありません');

  for (const 絵 of 対象) {
    const f = path.join(根, 'pwa' + 絵.src);
    const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const 点 = (x, y) => {
      const i = (y * W + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };

    // 1. 四隅が白くない（＝端まで塗ってある）
    for (const [x, y, 名] of [
      [0, 0, '左上'],
      [W - 1, 0, '右上'],
      [0, H - 1, '左下'],
      [W - 1, H - 1, '右下'],
    ]) {
      const p = 点(x, y);
      assert.ok(
        !(p[0] > 240 && p[1] > 240 && p[2] > 240),
        `${絵.src} の${名}が白いままです（OS が切り抜くと白い座布団になる）`
      );
    }

    // 2. 図柄が中央8割の円（安全域）に収まっている
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

test('配信の台本が、アイコンと manifest を注入・配布する', () => {
  const ps = 読む('scripts/deploy-web.ps1');
  for (const 印 of ['apple-touch-icon', 'manifest.json', 'theme-color', 'sw.js']) {
    assert.ok(ps.includes(印), `deploy-web.ps1 が ${印} を扱っていません`);
  }
  // pwa/ の中身を dist へ配っているか
  for (const 絵 of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
    assert.ok(ps.includes(`pwa/${絵}`), `deploy-web.ps1 が pwa/${絵} を配っていません`);
  }
});

test('配信の決まりが、manifest の型を正しく出す', () => {
  const j = JSON.parse(読む('firebase.json'));
  const 決まり = (j.hosting?.headers || []).find((h) => h.source === '/manifest.json');
  assert.ok(決まり, 'firebase.json に /manifest.json の決まりがありません');
  const 型 = (決まり.headers || []).find((h) => h.key === 'Content-Type');
  assert.ok(
    型 && 型.value.includes('application/manifest+json'),
    'manifest.json の Content-Type が application/manifest+json になっていません'
  );
});
