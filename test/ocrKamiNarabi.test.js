/**
 * 1 枚の用紙に表が 2 つ並ぶ紙（関東学生の男子の記録用紙。後立 4 人・前立 4 人）を、端末で読む。
 * 合成の用紙（scripts/ocr-cells/kami-ban.mjs の 紙をえがく に 並び: [4, 4]）で確かめる。
 * 本物（2026-10-01 の写真）は名前入りなので倉庫に入れていない。本物でも 160/160（scripts/ocr-cells/README.md）
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

const 重み = () => JSON.parse(fs.readFileSync('scripts/ocr-cells/kami-tatami.json', 'utf8'));

/** 表ごとの列たち（写真で上から下）を、答え（1 射目＝下から）と比べた一致数 */
function 数える(表たち, 答え) {
  let 合 = 0;
  表たち.forEach((表, k) =>
    表.列たち.forEach((列, i) => {
      const 真 = 答え.マス[k * 4 + i];
      const 読 = 列.slice().reverse();
      for (let s = 0; s < 真.length; s++) if (読[s] === 真[s]) 合++;
    })
  );
  return 合;
}

test('男子の記録用紙：表を左から 2 つ見つけ、合計の列を射手と取り違えずに 160 射を読む（列の幅 25〜60px）', async () => {
  const { 紙をえがく } = await import('../scripts/ocr-cells/kami-ban.mjs');
  const { 紙の表たちの印を読む } = await import('../src/ocr/yomu.js');
  for (const [種, マス幅] of [[9001, 25], [9004, 45], [9006, 60]]) {
    const b = 紙をえがく({ 種, 並び: [4, 4], マス幅 });
    const 表たち = await 紙の表たちの印を読む({ 画素: b.白黒, 幅: b.幅, 高: b.高 }, { 人数たち: [4, 4], 立数: 5, 立のマス: 4, 重み: 重み() });
    assert.strictEqual(表たち.length, 2);
    assert.ok(表たち[0].四角.left < 表たち[1].四角.left, '左の表から返す');
    assert.strictEqual(数える(表たち, b.答え), 160, `列の幅 ${マス幅}px`);
  }
});

test('男子の記録用紙：台形に写っても読む（列の幅が端から端へ変わり、罫線の角度も変わる）', async () => {
  const { 紙をえがく } = await import('../scripts/ocr-cells/kami-ban.mjs');
  const { 崩し方, ゆがませる } = await import('../scripts/ocr-cells/kuzusu.mjs');
  const { 紙の表たちの印を読む } = await import('../src/ocr/yomu.js');
  const b = 紙をえがく({ 種: 9102, 並び: [4, 4], マス幅: 45 });
  // 写真のページのように余白を足してから崩す
  const 余 = 60;
  const W = b.幅 + 余 * 2;
  const H = b.高 + 余 * 2;
  const 画 = new Uint8Array(W * H).fill(235);
  for (let y = 0; y < b.高; y++) 画.set(b.白黒.subarray(y * b.幅, (y + 1) * b.幅), (y + 余) * W + 余);
  const 崩し = 崩し方({ 幅: W, 高: H, 回す: 0, 台形: 0.2, 種: 12345 });
  const 歪み = ゆがませる({ 画, 幅: W, 高: H, 面: 1 }, { 明るさ: 1, 締まり: 1, ざらつき: 0, 崩し, 種: 9102 });
  const 表たち = await 紙の表たちの印を読む({ 画素: 歪み.画, 幅: 歪み.幅, 高: 歪み.高 }, { 人数たち: [4, 4], 立数: 5, 立のマス: 4, 重み: 重み() });
  assert.strictEqual(数える(表たち, b.答え), 160);
});

test('マスを端末で差し替える：写真 1 枚に紙の表が 2 つ。Gemini が右の表（前立）を先に返しても、正しい表の ○× を付ける', async () => {
  const { 紙をえがく } = await import('../scripts/ocr-cells/kami-ban.mjs');
  const { マスを端末で差し替える } = await import('../src/ocr/sashikae.js');
  const { 一射目からの順にする } = require('../src/ocrCells');
  const b = 紙をえがく({ 種: 9003, 並び: [4, 4], マス幅: 38 });
  // 答えの列（左から）を、大前（各表の右の列）から並べた人にする。前立＝右の表
  const 人 = (列番) => ({ name: '人' + 列番, cells: b.答え.マス[列番].slice().reverse() });
  const 前立 = { name: '', cellStyle: '1射', tachiPeople: 4, rows: [7, 6, 5, 4].map(人) };
  const 後立 = { name: '', cellStyle: '1射', tachiPeople: 4, rows: [3, 2, 1, 0].map(人) };
  // Gemini の ○× は少し外す（端末の読みに差し替わることを見る）
  const 外す = (t) => ({ ...t, rows: t.rows.map((r) => ({ ...r, cells: r.cells.map((c, k) => (k % 7 === 0 ? (c === '○' ? '×' : '○') : c)) })) });
  const 出 = await マスを端末で差し替える([外す(前立), 外す(後立)], [{ base64: '合成' }], {
    向き: '左右から',
    道具: { 画を読む: async () => ({ 画素: b.白黒, 幅: b.幅, 高: b.高 }), 回す: null },
    重み: JSON.parse(fs.readFileSync('scripts/ocr-cells/omomi-tatami.json', 'utf8')),
    紙の重み: 重み(),
  });
  assert.strictEqual(出.読み取り元, '端末', 出.訳);
  assert.strictEqual(出.板の順を直した, true);
  for (const t of 出.teams) {
    for (const r of t.rows) {
      const 列番 = Number(r.name.slice(1));
      assert.deepStrictEqual(一射目からの順にする(r.cells, '下から'), b.答え.マス[列番], r.name);
    }
  }
});
