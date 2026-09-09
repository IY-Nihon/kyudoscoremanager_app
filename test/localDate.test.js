/**
 * 日付を端末の日付で切っているかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 *
 * toISOString() は世界標準時で切る。日本は9時間先なので、朝9時より前の
 * ことは「前の日」として出てしまう。
 *
 *   ・朝練（6時や7時）の記録が、ひとつ前の日付でAIに渡っていた。
 *   ・弓具を変えた日の既定値が、朝に開くと前の日になっていた。
 *
 * どちらも「その日のことなのに1日ずれる」という、目で気づきにくい型。
 * 直したあとも、別の場所で同じ書き方をされると戻るので、機械で押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { 記録をさがす } = require('../src/chatStats');

test('朝の練習でも、その日の日付でAIに渡る', () => {
  // 端末の時計で「朝6時」を作る。日本で動かすと、世界標準時では前の日になる
  const 朝 = new Date();
  朝.setHours(6, 0, 0, 0);
  const 期待 = `${朝.getFullYear()}-${String(朝.getMonth() + 1).padStart(2, '0')}-${String(
    朝.getDate()
  ).padStart(2, '0')}`;

  const 出 = 記録をさがす(
    [
      {
        id: 'r1',
        date: 朝.getTime(),
        title: '朝練',
        archers: [{ id: 'a', name: '山田', marks: ['○'] }],
      },
    ],
    { 語: '' }
  );

  assert.strictEqual(出.一覧.length, 1, '記録が見つからない');
  assert.strictEqual(出.一覧[0].日付, 期待, '朝の練習の日付が1日ずれている');
});

test('世界標準時で日付を切っている所は、もう無い', () => {
  // toISOString() をそのまま使うのは構わない（機械向けの時刻）。
  // 「年-月-日」だけを取り出す書き方だけを禁じる
  const 禁じ手 = [/toISOString\(\)\s*\.\s*split\(\s*['"]T['"]\s*\)/, /toISOString\(\)\s*\.\s*slice\(\s*0\s*,\s*10\s*\)/];
  const 根 = path.join(__dirname, '..', 'src');
  const 見つけた = [];
  for (const f of fs.readdirSync(根).filter((x) => x.endsWith('.js'))) {
    const 行たち = fs.readFileSync(path.join(根, f), 'utf8').split(/\r?\n/);
    行たち.forEach((行, i) => {
      if (行.trim().startsWith('*') ||行.trim().startsWith('//')) return;
      if (禁じ手.some((re) => re.test(行))) 見つけた.push(`${f}:${i + 1}`);
    });
  }
  assert.deepStrictEqual(
    見つけた,
    [],
    '世界標準時で日付を切っている（日本では朝9時より前が前の日になる）: ' + 見つけた.join(', ')
  );
});
