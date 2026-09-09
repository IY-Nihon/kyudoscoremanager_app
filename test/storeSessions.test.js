/**
 * 雲から取り込んだ記録の、射手の形を整えているかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 *
 * 本番で分析画面が落ちた。射手の入っていない記録（古い版の書き込み、
 * 書きかけ、手で作った下ごしらえ）が雲に在り、読む側は archers を
 * 配列と思って回していた。1件混ざっただけで画面ごと落ちる。
 *
 * 取り込み口は2つある。雲を見張る方と、まとめて取りにいく方。
 * 最初は見張りの方だけを直したので、取りにいった方から同じものが
 * そのまま入ってきていた。片方だけ直しても気づけないので、
 * 「記録を組み立てている所は、必ず形を整えてから渡す」を機械で押さえる。
 *
 * 見分け方：記録を組み立てる所だけが tags を掃除している
 *（cleanedTags）。名簿やひな型の取り込みには出てこない。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { 記録の射手を整える, cleanUpSessions } = require('../src/syncRules');

const 店の中身 = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'useScoreStore.js'),
  'utf8'
);

/**
 * 記録を組み立てている塊を切り出す。
 *
 * 記録は Object.assign({}, s, {…}) の形で作っている。tags を掃除して
 * 書き戻すだけの updateDoc と混ざらないよう、組み立ての塊だけを取り、
 * その中に掃除済みの tags が在るものを記録とみなす。
 */
function 記録を組み立てている所() {
  const 出 = [];
  const 印 = 'Object.assign({}, s, {';
  let 位置 = 0;
  for (;;) {
    const 始め = 店の中身.indexOf(印, 位置);
    if (始め < 0) break;
    位置 = 始め + 印.length;
    let 深さ = 0;
    let 終わり = 始め;
    for (let i = 始め; i < 店の中身.length; i++) {
      const c = 店の中身[i];
      if (c === '(') 深さ++;
      else if (c === ')') {
        深さ--;
        if (0 === 深さ) {
          終わり = i;
          break;
        }
      }
    }
    const 塊 = 店の中身.slice(始め, 終わり + 1);
    if (!塊.includes('tags: cleanedTags')) continue;
    // 行番号は、改行の数で数える（逃がし字を書かずに済ませる）
    const 改行 = String.fromCharCode(10);
    出.push({ 行: 店の中身.slice(0, 始め).split(改行).length, 中身: 塊 });
  }
  return 出;
}

test('雲から取り込んだ記録は、どの入り口でも射手の形を整えている', () => {
  const 所たち = 記録を組み立てている所();

  // 入り口は2つ（見張り／まとめて取得）。減っていたら、この検査が
  // 見ていない道が増えた合図なので、そのときは見分け方を見直すこと
  assert.strictEqual(
    所たち.length,
    2,
    '記録を組み立てている所が2か所ではない（' + 所たち.length + 'か所）'
  );

  for (const 所 of 所たち) {
    assert.ok(
      所.中身.includes('記録の射手を整える('),
      `${所.行}行目：記録を組み立てているのに、射手の形を整えていない`
    );
  }
});

test('形を整える助けは、配列でないときに空の並びを返す', () => {
  assert.deepStrictEqual(記録の射手を整える(undefined), [], '記録そのものが無いとき');
  assert.deepStrictEqual(記録の射手を整える({}), [], '射手の項目が無いとき');
  assert.deepStrictEqual(記録の射手を整える({ archers: null }), [], '射手が null のとき');
  assert.deepStrictEqual(記録の射手を整える({ archers: { 0: {} } }), [], '射手が並びでないとき');

  // 中身が揃っているものは、作り直さずそのまま返す
  const 射手 = { id: 'a', name: '山田', marks: ['○', '×'] };
  assert.strictEqual(
    記録の射手を整える({ archers: [射手] })[0],
    射手,
    '揃っている射手は、そのまま渡す'
  );

  // ○×の無い射手には、空の並びを持たせる（読む側が回せるように）
  const 欠け = 記録の射手を整える({ archers: [{ id: 'b' }] });
  assert.deepStrictEqual(欠け[0].marks, [], '○×が無い射手に、空の並びを持たせていない');
  assert.strictEqual(欠け[0].id, 'b', '他の項目を落としている');
});

test('端末の控えを読み直すときも、記録の射手を整えている', () => {
  // 雲の取り込み口だけを直しても、次の同期までは端末の控えが使われる
  const 出 = cleanUpSessions([{ id: 's1', archers: undefined, tags: ['#的中'] }]);
  assert.deepStrictEqual(出[0].archers, [], '控えの記録の射手が整っていない');

  // 触るところが無ければ、同じものを返す（むだな作り直しをしない）
  const そのまま = { id: 's2', archers: [{ id: 'a', marks: [] }] };
  assert.strictEqual(
    cleanUpSessions([そのまま])[0],
    そのまま,
    '直すところが無いのに作り直している'
  );
});
