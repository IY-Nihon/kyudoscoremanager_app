/**
 * 画面がストアから取り出している名前が、ストアに実在するかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 *
 * 本番で「ee is not a function」が出た。メンバー画面が addEquipment を
 * 取り出して呼んでいたのに、ストアには消すほう（deleteEquipment）しか
 * 無く、押しても何も起きないどころか落ちていた。
 *
 * この型の抜けは、取り出すところと実装するところが離れているせいで
 * 目では見つけにくい。名前が食い違っていても、undefined が入るだけで
 * 静かに通り、押したときに初めて落ちる。ここで機械的に照らし合わせる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const 根 = path.join(__dirname, '..');
const 店の中身 = fs.readFileSync(path.join(根, 'src', 'useScoreStore.js'), 'utf8');

/** ストアに在る名前（関数も、状態の項目も） */
function ストアに在る名前() {
  const 出 = new Set();
  for (const m of 店の中身.matchAll(/^\s{6,10}([A-Za-z_$\u3040-\u30ff\u4e00-\u9fff][\w$\u3040-\u30ff\u4e00-\u9fff]*)\s*:/gm)) {
    出.add(m[1]);
  }
  for (const m of 店の中身.matchAll(/\b(set[A-Za-z0-9_$]+)\s*:/g)) 出.add(m[1]);
  return 出;
}

test('画面が取り出しているストアの名前は、すべて実在する', () => {
  const 在る = ストアに在る名前();
  assert.ok(在る.size > 100, 'ストアの名前が読み取れていない（' + 在る.size + '件）');

  const 画面たち = fs
    .readdirSync(path.join(根, 'src'))
    .filter((f) => f.endsWith('.js') && f !== 'useScoreStore.js');

  const 抜け = [];
  for (const f of 画面たち) {
    const s = fs.readFileSync(path.join(根, 'src', f), 'utf8');
    const re =
      /const\s*\{([^}]*)\}\s*=\s*(?:\(0,\s*[\w$]+\.useScoreStore\)|[\w$]+\.useScoreStore)\s*\(\s*\)/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      for (const 片 of m[1].split(',')) {
        const 名 = 片.split(':')[0].trim().replace(/^\.\.\./, '');
        if (!名 || 名.startsWith('//')) continue;
        if (!在る.has(名)) 抜け.push(f + ' → ' + 名);
      }
    }
  }

  assert.deepEqual(
    抜け,
    [],
    'ストアに無い名前を取り出しています（押したときに「is not a function」で落ちます）:\n  ' +
      抜け.join('\n  ')
  );
});
