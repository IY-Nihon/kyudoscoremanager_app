/**
 * AIアシスタントのキャラクターの絵（src/aiMascotArt.js）の検査。
 *
 *   npm test
 *
 * ドット絵は文字の並びなので、段の幅が 1 つずれても、弓を握る手が離れても、コンパイルも lint も通ってしまう。
 * 絵を直すたびに、崩れていないことをここで確かめる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  体の絵,
  弓の絵,
  目の段,
  開いた絵,
  閉じた絵,
  連なりにする,
  開いた連なり,
  閉じた連なり,
  色,
  幅のマス,
  高さのマス,
} = require('../src/aiMascotArt');

const 体の幅 = 体の絵[0].length;
const 弓の幅 = 弓の絵[0].length;

test('どの段も同じ幅で、使っている記号は色が決まっている', () => {
  for (const 絵 of [開いた絵, 閉じた絵]) {
    assert.strictEqual(絵.length, 高さのマス);
    for (const 行 of 絵) {
      assert.strictEqual(行.length, 幅のマス, `幅がずれた段: ${行}`);
      for (const 字 of 行) assert.ok(字 === '.' || 字 in 色, `色の無い記号「${字}」（${行}）`);
    }
  }
  assert.ok(
    体の絵.every((行) => 行.length === 体の幅),
    '体の段の幅がそろっていない'
  );
  assert.ok(
    弓の絵.every((行) => 行.length === 弓の幅),
    '弓の段の幅がそろっていない'
  );
  assert.strictEqual(幅のマス, 体の幅 + 弓の幅);
});

test('弓を握る手は、腕を伸ばした段にある（手が弓から離れない）', () => {
  const 握り = 弓の絵.findIndex((行) => 行.startsWith('WWW'));
  assert.ok(握り >= 0, '弓に握りの手が無い');
  // 体の右端（腕の先）が、同じ段で弓の手とつながる
  assert.strictEqual(体の絵[握り][体の幅 - 1], 'W', '腕が弓の握りまで届いていない');
  // 腕を伸ばしている段は、その 1 段だけ
  const 腕の段 = 体の絵.filter((行) => 行[体の幅 - 1] === 'W');
  assert.strictEqual(腕の段.length, 1, '腕の段が複数ある');
});

test('目を閉じた絵は、目の段の K が体の色になるだけで、ほかは開いた絵と同じ', () => {
  assert.ok(開いた絵[目の段].includes('K'), '開いた絵に目が無い');
  assert.ok(!閉じた絵[目の段].includes('K'), '閉じた絵に目が残っている');
  assert.ok(開いた絵[目の段 + 1].includes('K'), '目は 2 段ある（閉じても下の段が細い目として残る）');
  開いた絵.forEach((行, i) => {
    if (i === 目の段) assert.strictEqual(閉じた絵[i], 行.replace(/K/g, 'W'));
    else assert.strictEqual(閉じた絵[i], 行, `${i} 段目が変わっている`);
  });
});

test('袴：腰から裾へ向かって広がり、左右対称で、上の段（頭・胸）には出ない', () => {
  const 袴の段 = 体の絵.map((行, i) => ({ 行, i })).filter(({ 行 }) => /N/.test(行));
  assert.ok(袴の段.length >= 3, `袴が短い（${袴の段.length} 段）`);
  // 続いた段で、途中で切れない
  袴の段.forEach(({ i }, 番) => {
    if (番 > 0) assert.strictEqual(i, 袴の段[番 - 1].i + 1, '袴が途中で切れている');
  });
  // 袴の幅（N と n の数）は、下へ行くほど広がる（狭まらない）
  const 幅 = (行) => [...行].filter((字) => 字 === 'N' || 字 === 'n').length;
  袴の段.forEach(({ 行 }, 番) => {
    if (番 > 0) assert.ok(幅(行) >= 幅(袴の段[番 - 1].行), `袴が狭まっている: ${行}`);
  });
  assert.ok(幅(袴の段[袴の段.length - 1].行) > 幅(袴の段[0].行), '裾が腰より広がっていない');
  // 左右対称（腕を伸ばした段は袴ではない）
  for (const { 行 } of 袴の段) assert.strictEqual(行, [...行].reverse().join(''), `左右がずれている: ${行}`);
  // 頭と、腕を伸ばした段には出ない
  const 腕の段 = 体の絵.findIndex((行) => 行[体の幅 - 1] === 'W');
  assert.ok(袴の段[0].i > 腕の段, '袴が腕の段より上に出ている');
});

test('鉢巻は目より上、足は袴より下の一番下にある', () => {
  const 鉢巻 = 体の絵.findIndex((行) => /R/.test(行));
  assert.ok(鉢巻 >= 0 && 鉢巻 < 目の段, '鉢巻が目より上に無い');
  const 袴の最後 = 体の絵.map((行) => /N/.test(行)).lastIndexOf(true);
  assert.strictEqual(袴の最後 + 2, 体の絵.length, '袴の下に足の段が 1 段だけ続かない');
  const 足 = 体の絵[体の絵.length - 1];
  assert.ok(/^[.W]+$/.test(足) && 足.includes('W'), '足の段は体の色だけ');
  assert.strictEqual(足, [...足].reverse().join(''), '足が左右対称でない');
});

test('弓は体の上端にそろい、体より長くならない', () => {
  assert.ok(弓の絵.length <= 体の絵.length);
  assert.match(弓の絵[0], /B/, '弓の先が上端に無い');
});

test('連なりにする：同じ記号が横に続くところをまとめ、何も無いマスは含めない', () => {
  assert.deepStrictEqual(連なりにする('NNnNN'), [
    { 字: 'N', 始め: 0, 長さ: 2 },
    { 字: 'n', 始め: 2, 長さ: 1 },
    { 字: 'N', 始め: 3, 長さ: 2 },
  ]);
  assert.deepStrictEqual(連なりにする('.W.W'), [
    { 字: 'W', 始め: 1, 長さ: 1 },
    { 字: 'W', 始め: 3, 長さ: 1 },
  ]);
  assert.deepStrictEqual(連なりにする('...'), []);
  assert.deepStrictEqual(連なりにする(''), []);
});

test('横の連なりにまとめても、1 マスずつ描くのと同じ絵になる。まとめ残しも無い', () => {
  for (const [絵, 連なり] of [
    [開いた絵, 開いた連なり],
    [閉じた絵, 閉じた連なり],
  ]) {
    assert.strictEqual(連なり.length, 絵.length);
    絵.forEach((行, y) => {
      // 連なりから 1 マスずつに戻すと、元の段になる
      const 戻す = [...'.'.repeat(行.length)];
      for (const { 字, 始め, 長さ } of 連なり[y]) for (let i = 0; i < 長さ; i++) 戻す[始め + i] = 字;
      assert.strictEqual(戻す.join(''), 行, `${y} 段目が元の絵と違う`);
      連なり[y].forEach((c, i) => {
        assert.ok(c.字 !== '.' && c.長さ >= 1, '何も無いマスが含まれている');
        if (i === 0) return;
        const 前 = 連なり[y][i - 1];
        // 隣り合う連なりは、記号が違うか、間が空いている（同じ記号が続くなら 1 つにまとまっているはず）
        assert.ok(前.字 !== c.字 || 前.始め + 前.長さ < c.始め, `${y} 段目にまとめ残しがある`);
      });
    });
  }
});

test('描く図形の数は、1 マスずつより少なく、増やしすぎない（答えのたびに 1 体並ぶ）', () => {
  const セル = 開いた絵.join('').replace(/\./g, '').length;
  const 図形 = 開いた連なり.reduce((n, 行) => n + 行.length, 0);
  assert.ok(図形 < セル, `まとめても減っていない（${図形} / ${セル}）`);
  // 袴を足す前の 1 体は 89 マス。まとめた今は 50。絵を描き足して 60 を超えるなら、まとめ方か絵を見直す
  assert.ok(図形 <= 60, `図形が多すぎる（${図形}）`);
});
