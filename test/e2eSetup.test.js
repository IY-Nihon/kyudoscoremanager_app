/**
 * 控え（storageState）に、クラウドを読むのに要るものが入っているかの検査。
 *
 *   npm test
 *
 * Firebase の認証は IndexedDB に入る。Playwright の storageState は
 * 既定では localStorage と cookie しか写さないので、indexedDB: true を
 * 忘れると「アプリは入ったつもりなのに Firestore からは権限なしで弾かれる」
 * という、いちばん分かりにくい壊れ方をする。
 *
 * 実際に一度そうなり、名簿を要る検査だけが落ちて、取り合いだと誤って
 * 片付けかけた。ここで書き忘れを止める。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 下ごしらえ = fs.readFileSync(path.join('e2e', 'auth.setup.mjs'), 'utf8');

test('控えの書き出しには、必ず indexedDB: true を付ける', () => {
  const 書き出し = 下ごしらえ.match(/storageState\(\{[^}]*\}\)/g) || [];
  assert.ok(書き出し.length > 0, '控えの書き出しが見つからない');
  for (const x of 書き出し) {
    assert.ok(
      /indexedDB:\s*true/.test(x),
      'indexedDB: true が無い。Firebase の認証が控えに入らず、クラウドが読めなくなる: ' + x
    );
  }
});

test('控えを使う検査は、下ごしらえが用意した団体を指している', () => {
  const 用意した = new Set(
    [...下ごしらえ.matchAll(/'(\d{6})(?:-個人)?'/g)].map((m) => m[0].replace(/'/g, ''))
  );
  const 検査たち = fs.readdirSync('e2e').filter((f) => f.endsWith('.spec.mjs'));
  for (const f of 検査たち) {
    const t = fs.readFileSync(path.join('e2e', f), 'utf8');
    const m = t.match(/storageState:\s*'e2e\/\.auth\/([^']+)\.json'/);
    if (!m) continue;
    assert.ok(
      用意した.has(m[1]),
      f + ' が控え ' + m[1] + ' を使うのに、auth.setup.mjs が作っていない'
    );
  }
});

test('同じ団体を使う検査が重なっていない（並列で取り合わないため）', () => {
  const 束 = new Map();
  for (const f of fs.readdirSync('e2e').filter((x) => x.endsWith('.spec.mjs'))) {
    const t = fs.readFileSync(path.join('e2e', f), 'utf8');
    const m = t.match(/const 団体 = '(\d+)'/);
    if (!m) continue;
    // 記録を書き換えない検査は重なってよい。
    // 名前で覚えるのは増えるたびに漏れるので、検査の中に印を書いてもらう
    const 読むだけ = /dialog|login/.test(f) || t.includes('団体には書き込まない');
    if (読むだけ) continue;
    if (!束.has(m[1])) 束.set(m[1], []);
    束.get(m[1]).push(f);
  }
  for (const [団体, 検査たち] of 束) {
    assert.ok(
      検査たち.length === 1,
      '団体' + 団体 + ' を複数の検査が使っている: ' + 検査たち.join(', ') +
        '（並列に流すと取り合う。scripts/stg-fixtures.mjs に団体を足して分ける）'
    );
  }
});

test('決まりを配信する命令が、Firestore の決まりも出す', () => {
  // 2026-08-29 に踏んだ。deploy:rules は --only database だけで、
  // Realtime Database の決まりしか出していなかった。firestore.rules に
  // errorReports を足しても、この命令では本番に出ない。
  // 出ていないことは、便りが1通も届かないという形でしか現れないので、
  // 気づくのに時間がかかる。
  const 手 = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  ).scripts;
  for (const 名 of ['deploy:rules', 'deploy:rules:stg']) {
    assert.ok(手[名], 'package.json に ' + 名 + ' が無い');
    assert.ok(
      /firestore:rules/.test(手[名]),
      名 + ' が Firestore の決まりを出していない: ' + 手[名]
    );
  }
  // 本番向けと検証環境向けが取り違えられていないか
  assert.ok(/--project kyudoscoremanager\b/.test(手['deploy:rules']), 'deploy:rules の宛先が本番でない');
  assert.ok(/--project kyudoscoremanager-stg\b/.test(手['deploy:rules:stg']), 'deploy:rules:stg の宛先が検証環境でない');
});
