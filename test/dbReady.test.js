/**
 * 同期の待ち合わせ（dbReady）が、決して止まらない形になっているかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 *
 * 2026-09-09、控えを持てるかを確かめるために IndexedDB を開き、その結果を
 * 待ってから dbReady を返す作りにした。ところが indexedDB.open は端末に
 * よって成功も失敗も返さないことがある（WebKit で窓を多く開けているときなど）。
 * 返らないと dbReady が解けず、waitForDb を待っている syncSessions も
 * 見張りも await のまま止まる。つまり**同期がまるごと動かなくなる**。
 *
 * 画面には何も出ないまま、ただ同期されない。いちばん気づきにくい壊れ方なので、
 * 「待ち合わせの中で何かを待たない」ことを機械で押さえる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 中身 = fs.readFileSync(path.join(__dirname, '..', 'src', 'db.js'), 'utf8');

test('dbReady は、何も待たずにすぐ解ける', () => {
  const 行 = 中身.split(/\r?\n/).find((x) => x.includes('_e.dbReady ='));
  assert.ok(行, '_e.dbReady が見つからない');
  assert.match(
    行,
    /_e\.dbReady\s*=\s*Promise\.resolve\(/,
    'dbReady が「すぐ解ける約束」になっていない。中で何かを待つと、返らない端末で同期が止まる'
  );
});

test('控えを持てるかの見分けは、時間で見切る', () => {
  const 始め = 中身.indexOf('控えを持てるか見る');
  assert.ok(始め >= 0, '控えの見分けが見つからない');
  const 塊 = 中身.slice(始め, 始め + 2000);
  assert.match(塊, /setTimeout\(/, '答えが返らないときの見切りが無い');
  assert.match(塊, /indexedDB\.open/, 'IndexedDB を開けるかを見ていない');
});
