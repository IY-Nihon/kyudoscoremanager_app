/**
 * database.rules.json は scripts/database-rules.mjs から書き出す（2026-11-26 S8）。手で直すと食い違うので止める。
 * 決まりそのものの確かめは模擬環境（test/emu/databaseRules.test.mjs。npm run test:rules）
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('database.rules.json が scripts/database-rules.mjs の書き出しと同じ', async () => {
  const 台本 = await import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'database-rules.mjs')).href);
  const 今 = fs
    .readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8')
    .replace(/\r\n/g, '\n');
  assert.equal(今, 台本.書き出す形(), 'node scripts/database-rules.mjs で書き直してください（手で直さない）');
});

test('枝は 20 字から 64 字まで（書く決まり）', async () => {
  const 台本 = await import(pathToFileURL(path.join(__dirname, '..', 'scripts', 'database-rules.mjs')).href);
  const 決まり = 台本.決まりを作る().rules;
  for (const [名, 節] of Object.entries(決まり)) {
    const 式 = 節.$branch['.write'];
    assert.ok(式.includes('$branch.length >= 20') && 式.includes('$branch.length <= 64'), 名 + ': ' + 式);
  }
});
