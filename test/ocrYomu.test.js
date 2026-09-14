/**
 * 端末での○×の読み取り（src/ocr/yomu.js）を、本物の写真で通す。
 * 写真1枚まるごと（板2枚・16人）を Node の画像の道具で読み、本番の記録と比べる。
 * アプリと同じ道（板ごとの格子 → マス → 大前から並べる → マスを開く）を通す。
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

test('写真1枚まるごとを端末の読み取りで読むと、320射のうち317以上が記録と合う', async () => {
  const { 板の印を読む, 大前から並べる } = await import('../src/ocr/yomu.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));

  const 元 = await 画を読む('docs/ocr-samples/PXL_20260906_081921509.jpg');
  const 板たち = await 板の印を読む(元, { 板の人数たち: [8, 8], 行数: 10, 回す, 重み });
  assert.strictEqual(板たち.length, 2);

  // 左の板は左から大前、右の板は右から大前（「左右から」）。板は下から書く
  let 合 = 0;
  let 番 = 0;
  板たち.forEach((板, i) => {
    const 列たち = 大前から並べる(板.列たち, '左右から', i, 板たち.length);
    for (const 列 of 列たち) {
      const 印 = マスを開く(一射目からの順にする(列, '下から'), '2射');
      const 真 = [...射手たち[番++].印];
      for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
    }
  });
  assert.ok(合 >= 317, `合ったのは ${合}/320`);
});

test('紙の写真をページ全体から読むと、80射のうち79以上が記録と合う', async () => {
  const { 紙の印を読む, 大前から並べる } = await import('../src/ocr/yomu.js');
  const { 画を読む } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const { 紙の射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/kami-omomi.json', 'utf8'));

  const 元 = await 画を読む('docs/ocr-samples/1788683956272.jpg');
  const 紙 = await 紙の印を読む(元, { 人数: 4, 立数: 5, 立のマス: 4, 重み });
  // 右の列が大前。1射目は下から
  const 列たち = 大前から並べる(紙.列たち, '右から', 0, 1);
  let 合 = 0;
  列たち.forEach((列, i) => {
    const 印 = マスを開く(一射目からの順にする(列, '下から'), '1射');
    const 真 = [...紙の射手たち[i].印];
    assert.strictEqual(印.length, 真.length);
    for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
  });
  // Node の画像の道具は明暗を normalise するので、アプリ（そのまま）と1マスだけ違う
  //（そのままなら 80/80、normalise だと 0.51 の際どいマスが1つ外れる）
  assert.ok(合 >= 79, `合ったのは ${合}/80`);
});

/** Node の画像の道具。base64 の代わりにファイルの道を受ける */
async function 道具をつくる() {
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  return { 画を読む: (みち) => 画を読む(みち), 回す };
}

test('マスを端末で差し替える: 紙（1射）の teams を端末の読み取りに差し替える', async () => {
  const { マスを端末で差し替える } = await import('../src/ocr/sashikae.js');
  const { 紙の射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
  const 紙の重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/kami-omomi.json', 'utf8'));
  // Gemini が返したつもりの teams。マスは全部空（読めなかった体）
  const teams = [{ name: '', cellStyle: '1射', tachiPeople: 4, rows: 紙の射手たち.map((s) => ({ name: s.名, cells: Array(20).fill('') })) }];
  const 出 = await マスを端末で差し替える(teams, [{ base64: 'docs/ocr-samples/1788683956272.jpg' }], {
    向き: '右から', 道具: await 道具をつくる(), 重み, 紙の重み,
  });
  assert.strictEqual(出.読み取り元, '端末', 出.訳);
  let 合 = 0;
  出.teams[0].rows.forEach((r, i) => {
    const 印 = マスを開く(一射目からの順にする(r.cells, '下から'), '1射');
    const 真 = [...紙の射手たち[i].印];
    for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
  });
  assert.ok(合 >= 79, `合ったのは ${合}/80`);
});

test('マスを端末で差し替える: 写真2枚に板が1枚ずつでも、板と写真を対応づけて読める', async () => {
  const sharp = (await import('sharp')).default;
  const path = require('node:path');
  const os = require('node:os');
  const { マスを端末で差し替える } = await import('../src/ocr/sashikae.js');
  const { 板ごとの格子 } = await import('../scripts/ocr-cells/kiridasu.mjs');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));

  // 板2枚の写真を、板と板の間で左右に切って2枚の写真にする
  const みち = 'docs/ocr-samples/PXL_20260906_081921509.jpg';
  const 元 = await 画を読む(みち);
  const 板たち = await 板ごとの格子(元, { 板の人数たち: [8, 8], 行数: 10, 回す });
  const 境 = 板たち[1].左;
  const 置き場 = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-nimai-'));
  const 左 = path.join(置き場, 'hidari.png');
  const 右 = path.join(置き場, 'migi.png');
  await sharp(みち).extract({ left: 0, top: 0, width: 境, height: 元.高 }).toFile(左);
  await sharp(みち).extract({ left: 境, top: 0, width: 元.幅 - 境, height: 元.高 }).toFile(右);

  const teams = [0, 1].map((i) => ({
    name: '', cellStyle: '2射', tachiPeople: 4,
    rows: 射手たち.slice(i * 8, i * 8 + 8).map((s) => ({ name: s.名, cells: Array(10).fill('') })),
  }));
  const 出 = await マスを端末で差し替える(teams, [{ base64: 左 }, { base64: 右 }], {
    向き: '左右から', 道具: { 画を読む: (p) => 画を読む(p), 回す }, 重み,
  });
  assert.strictEqual(出.読み取り元, '端末', 出.訳);
  let 合 = 0;
  let 番 = 0;
  for (const t of 出.teams) {
    for (const r of t.rows) {
      const 印 = マスを開く(一射目からの順にする(r.cells, '下から'), '2射');
      const 真 = [...射手たち[番++].印];
      for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
    }
  }
  assert.ok(合 >= 312, `合ったのは ${合}/320`);
});

test('マスを端末で差し替える: Gemini の行の数が板の列の数と違えば、端末の読み取りは使わない', async () => {
  const { マスを端末で差し替える } = await import('../src/ocr/sashikae.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
  // 左の板は8列なのに、Gemini が10人と言ってきた体（相手校の板で実際に 14〜17 に揺れた）
  const teams = [10, 8].map((n) => ({
    name: '', cellStyle: '2射', tachiPeople: 4,
    rows: Array.from({ length: n }, (_, i) => ({ name: String(i + 1), cells: Array(10).fill('') })),
  }));
  const 出 = await マスを端末で差し替える(teams, [{ base64: 'docs/ocr-samples/PXL_20260906_081921509.jpg' }], {
    向き: '左右から', 道具: { 画を読む: (p) => 画を読む(p), 回す }, 重み,
  });
  assert.strictEqual(出.読み取り元, 'AI');
  assert.match(出.訳 || '', /列の数が合わない/);
});

test('マスを端末で差し替える: Gemini のマスの数（段数）が板と違えば、端末の読み取りは使わない', async () => {
  const { マスを端末で差し替える } = await import('../src/ocr/sashikae.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
  // 10段の板なのに、28射の設定に引かれて 14 マスと答えてきた体（本番で実際に起きた）。
  // 余った段は板の上に置かれ、各人の的中数の数字の行がマスになる。「上に字の行がある」で弾く
  const teams = [8, 8].map((n) => ({
    name: '', cellStyle: '2射', tachiPeople: 4,
    rows: Array.from({ length: n }, (_, i) => ({ name: String(i + 1), roster: null, cells: Array(14).fill('') })),
  }));
  const 出 = await マスを端末で差し替える(teams, [{ base64: 'docs/ocr-samples/PXL_20260906_081921509.jpg' }], {
    向き: '左右から', 道具: { 画を読む: (p) => 画を読む(p), 回す }, 重み,
  });
  assert.strictEqual(出.読み取り元, 'AI');
  assert.match(出.訳 || '', /行の数が合わない/);
});

test('マスを端末で差し替える: Gemini が板を割りすぎても、端末の見当で行を組み直して読む', async () => {
  const { マスを端末で差し替える, 行を組み直す } = await import('../src/ocr/sashikae.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
  // 板2枚（8人＋8人）なのに、右の板を「5人・2人・1人」に割って 4 teams で返してきた体
  //（2026-09-13 の板で本番に出た。行そのものは板ごとに前から順で、総数は合っている）
  let 番 = 0;
  const 板 = (n, tachiPeople) => ({
    name: '', cellStyle: '2射', tachiPeople,
    rows: Array.from({ length: n }, () => ({ name: String(++番), roster: null, cells: Array(10).fill('') })),
  });
  const teams = [板(8, 4), 板(5, 4), 板(2, 2), 板(1, 1)];
  const 出 = await マスを端末で差し替える(teams, [{ base64: 'docs/ocr-samples/PXL_20260906_081921509.jpg' }], {
    向き: '左右から', 道具: { 画を読む: (p) => 画を読む(p), 回す }, 重み,
  });
  assert.strictEqual(出.読み取り元, '端末', 出.訳);
  assert.deepStrictEqual(出.組み直した, [8, 8]);
  assert.deepStrictEqual(出.teams.map((t) => t.rows.length), [8, 8]);
  assert.deepStrictEqual(出.teams.map((t) => t.tachiPeople), [4, 4], '立の人数は大きい板のもの');
  // 行の並びは崩れず、○×は端末のもの（317/320 以上）
  assert.deepStrictEqual(出.teams.flatMap((t) => t.rows.map((r) => r.name)), Array.from({ length: 16 }, (_, i) => String(i + 1)));
  let 合 = 0;
  let k = 0;
  for (const t of 出.teams) for (const r of t.rows) {
    const 印 = マスを開く(一射目からの順にする(r.cells, '下から'), '2射');
    const 真 = [...射手たち[k++].印];
    for (let j = 0; j < 真.length; j++) if (印[j] === 真[j]) 合++;
  }
  assert.ok(合 >= 317, `合ったのは ${合}/320`);

  // 総数が合わなければ組み直さない
  assert.strictEqual(行を組み直す([板(8, 4), 板(5, 4)], [8, 8]), null);
  assert.strictEqual(行を組み直す([板(8, 4), 板(8, 4)], [8, 8]), null, '板の数が同じなら何もしない');
});

test('箱で格子: 板ごとの○×の範囲（箱）を渡すと、その中を等分した格子で読める', async () => {
  // 印がマスいっぱいで隣と触れ合う板（相手校の板）は、かたまりから格子が立たない。
  // Gemini に範囲だけを出させ（本物の相手校の板 2 枚で 1% ほどの精度）、中を等分して読む。
  // ここでは 9/6 の板の格子から箱を作って渡す（相手校の板の写真は名前が写るので倉庫に無い）。
  // 印が小さく行の間隔がそろっていない 9/6 の板では、かたまりの格子（318）には及ばないが、
  // 相手校の板 2 枚では 96/160・72/160 → 159/160・156/160 になった（2026-09-14）
  const { 板の印を読む, 大前から並べる } = await import('../src/ocr/yomu.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const { 射手たち } = await import('../scripts/ocr-cells/kiroku.mjs');
  const { マスを開く, 一射目からの順にする } = require('../src/ocrCells');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
  const 元 = await 画を読む('docs/ocr-samples/PXL_20260906_081921509.jpg');
  // [上, 左, 下, 右]（0〜1000）。かたまりの格子の外側の列・行から半マスずつ広げたもの
  const 箱たち = [[335, 67, 621, 387], [335, 648, 636, 964]];
  const 板たち = await 板の印を読む(元, { 板の人数たち: [8, 8], 行数: 10, 回す, 重み, 箱たち });
  assert.strictEqual(板たち.length, 2);
  assert.deepStrictEqual(板たち.map((b) => b.列たち.length), [8, 8]);
  assert.ok(板たち.every((b) => b.列たち.every((列) => 列.length === 10)));
  let 合 = 0;
  let 番 = 0;
  板たち.forEach((板, i) => {
    const 列たち = 大前から並べる(板.列たち, '左右から', i, 板たち.length);
    for (const 列 of 列たち) {
      const 印 = マスを開く(一射目からの順にする(列, '下から'), '2射');
      const 真 = [...射手たち[番++].印];
      for (let k = 0; k < 真.length; k++) if (印[k] === 真[k]) 合++;
    }
  });
  assert.ok(合 >= 285, `合ったのは ${合}/320`);
});

test('マスを端末で差し替える: 箱たち を渡すと、写真1枚・板の数が合うときだけ箱で読む', async () => {
  const { マスを端末で差し替える } = await import('../src/ocr/sashikae.js');
  const { 画を読む, 回す } = await import('../scripts/ocr-cells/gazou-node.mjs');
  const 重み = JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-chiisai.json', 'utf8'));
  const teams = [8, 8].map((n) => ({
    name: '', cellStyle: '2射', tachiPeople: 4,
    rows: Array.from({ length: n }, (_, i) => ({ name: String(i + 1), roster: null, cells: Array(10).fill('') })),
  }));
  const 設定 = { 向き: '左右から', 道具: { 画を読む: (p) => 画を読む(p), 回す }, 重み };
  const 出 = await マスを端末で差し替える(teams, [{ base64: 'docs/ocr-samples/PXL_20260906_081921509.jpg' }], {
    ...設定, 箱たち: [[335, 67, 621, 387], [335, 648, 636, 964]],
  });
  assert.strictEqual(出.読み取り元, '端末', 出.訳);
  assert.ok(出.teams[0].rows[0].cells.some((c) => c === '◎' || c === '×' || c.startsWith('○')), '箱で読んだ印が入っていない');
  // 箱の数が板と合わなければ、箱は使わない（ふつうの格子で読む。ここでは読めるので端末のまま）
  const 出2 = await マスを端末で差し替える(teams, [{ base64: 'docs/ocr-samples/PXL_20260906_081921509.jpg' }], {
    ...設定, 箱たち: [[335, 67, 621, 387]],
  });
  assert.strictEqual(出2.読み取り元, '端末');
});
