/**
 * テストの子プロセスの標準出力を結果の枠だけにする部品（test/helpers/quietStdout.cjs）の検査。
 *
 *   npm test
 *
 * node:test の親は、子の標準出力で、結果の枠の直後に日本語で始まる文字が続くと読み違えて、
 * テストファイルごと落ちる（Node v24.15.0。理由は quietStdout.cjs）。
 * ここでは、部品が「枠は標準出力へ、枠以外は標準エラーへ」振り分けることと、
 * node:test の子でないときは何もしないことを、実際に子プロセスを動かして確かめる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const 部品 = path.resolve(__dirname, 'helpers', 'quietStdout.cjs');

/** 部品を読み込んだ node を動かす。環境変数で node:test の子のふりをするかを選ぶ */
function 動かす(台本, { 子のふり }) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  if (子のふり) env.NODE_TEST_CONTEXT = 'child-v8';
  return spawnSync(process.execPath, ['--require', 部品, '-e', 台本], { env });
}

// 枠の形（FF 0F ＋長さ 4 バイト＋本体）。中身は何でもよい
const 枠 = Buffer.from([0xff, 0x0f, 0x00, 0x00, 0x00, 0x02, 0xab, 0xcd]);
const 台本 = `
  process.stdout.write('英字の行');
  console.log('ライブに参加しました: 朝練');
  process.stdout.write(Buffer.from([${[...枠].join(',')}]));
  process.stdout.write(new Uint8Array([1, 2, 3]));
`;

test('node:test の子のとき、枠は標準出力へ、枠以外（console.log・process.stdout.write）は標準エラーへ行く', () => {
  const 結果 = 動かす(台本, { 子のふり: true });
  assert.strictEqual(結果.status, 0, `異常終了: ${結果.stderr}`);
  // 標準出力は枠だけ。文字が 1 バイトも混ざらない（混ざると親が読み違える）
  assert.deepStrictEqual([...結果.stdout], [...枠], '標準出力に枠以外が混ざっている');
  const 誤 = 結果.stderr.toString('utf8');
  assert.ok(誤.includes('英字の行'), '英字の行が標準エラーに無い');
  assert.ok(誤.includes('ライブに参加しました: 朝練'), '日本語の行が標準エラーに無い');
  // FF 0F で始まらない Uint8Array も、枠ではないので標準エラーへ
  assert.ok(Buffer.from(結果.stderr).includes(Buffer.from([1, 2, 3])));
});

test('node:test の子でないときは、何もしない（標準出力はそのまま）', () => {
  const 結果 = 動かす(台本, { 子のふり: false });
  assert.strictEqual(結果.status, 0, `異常終了: ${結果.stderr}`);
  const 出 = 結果.stdout.toString('utf8');
  assert.ok(出.includes('ライブに参加しました: 朝練'), '子でないのに、標準出力を書き換えている');
  assert.ok(出.includes('英字の行'));
  assert.strictEqual(結果.stderr.length, 0);
});

test('二重に読み込んでも包み直さない', () => {
  const 台本二重 = `
    const 場所 = ${JSON.stringify(部品)};
    const 前 = process.stdout.write;
    delete require.cache[場所];
    require(場所);
    process.stderr.write(前 === process.stdout.write ? '同じ' : '包み直した');
  `;
  const 結果 = 動かす(台本二重, { 子のふり: true });
  assert.strictEqual(結果.status, 0, `異常終了: ${結果.stderr}`);
  assert.strictEqual(結果.stderr.toString('utf8'), '同じ');
});

test('枠のあとに日本語の行が続く出力を作れない（親の読み違えの形にならない）', () => {
  // 枠 → 日本語の行 → 枠 の順に書いても、標準出力は枠 2 つだけになる
  const 台本並び = `
    const 枠 = Buffer.from([${[...枠].join(',')}]);
    process.stdout.write(枠);
    console.log('ライブを開始しました: 朝練');
    process.stdout.write(枠);
  `;
  const 結果 = 動かす(台本並び, { 子のふり: true });
  assert.strictEqual(結果.status, 0, `異常終了: ${結果.stderr}`);
  assert.deepStrictEqual([...結果.stdout], [...枠, ...枠]);
});
