/**
 * ライブを置く枝の名前（src/liveSecret.js）。
 *
 *   npm test
 *
 * 推測できないことが唯一の守りなので、
 *   ・合言葉が短くならないこと
 *   ・無いときに団体IDへ落ちないこと
 * の2つを重点的に見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { 合言葉を作る, 枝として使えるか, ライブの枝, 枝の最短 } = require('../src/liveSecret');

test('合言葉：決まりが通す長さになる', () => {
  for (let i = 0; i < 20; i++) {
    const s = 合言葉を作る();
    assert.ok(s.length >= 枝の最短, '短すぎる: ' + s);
    assert.ok(枝として使えるか(s), '枝として使えない: ' + s);
  }
});

test('合言葉：毎回ちがう', () => {
  const 集 = new Set();
  for (let i = 0; i < 200; i++) 集.add(合言葉を作る());
  assert.strictEqual(集.size, 200, '同じ合言葉が出ている');
});

test('合言葉：crypto が無い環境でも作れる', () => {
  const s = 合言葉を作る({});
  assert.ok(s.length >= 枝の最短);
  assert.ok(枝として使えるか(s));
});

test('合言葉：getRandomValues しか無い環境でも作れる', () => {
  const s = 合言葉を作る({
    getRandomValues: (桶) => {
      for (let i = 0; i < 桶.length; i++) 桶[i] = i;
      return 桶;
    },
  });
  assert.strictEqual(s, '000102030405060708090a0b0c0d0e0f');
  assert.ok(枝として使えるか(s));
});

test('枝として使えるか：短いものは通さない', () => {
  assert.strictEqual(枝として使えるか('100001'), false, '団体IDがそのまま通っている');
  assert.strictEqual(枝として使えるか('a'.repeat(枝の最短 - 1)), false);
  assert.strictEqual(枝として使えるか('a'.repeat(枝の最短)), true);
});

test('枝として使えるか：道に使えない字は通さない', () => {
  // RTDB の道に . # $ / [ ] は置けない。混じると道そのものが壊れる
  for (const 字 of ['.', '#', '$', '/', '[', ']'])
    assert.strictEqual(枝として使えるか('a'.repeat(30) + 字), false, 字 + ' が通っている');
});

test('枝として使えるか：中身が欠けていても落ちない', () => {
  assert.strictEqual(枝として使えるか(null), false);
  assert.strictEqual(枝として使えるか(undefined), false);
  assert.strictEqual(枝として使えるか(''), false);
});

test('ライブの枝：合言葉が無いときは null。団体IDへ落とさない', () => {
  // 落とすと、合言葉を持つ端末と持たない端末で枝が分かれ、
  // 同じ練習に入っているつもりで相手の○×が見えなくなる
  assert.strictEqual(ライブの枝(null), null);
  assert.strictEqual(ライブの枝('100001'), null, '団体IDが枝として通っている');
  const s = 合言葉を作る();
  assert.strictEqual(ライブの枝(s), s);
});

test('決まり（database.rules.json）が、短い枝を拒んでいる', () => {
  // ここが緩むと、古い形の live_sessions/{6桁} がまた通ってしまう
  const 決まり = fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8');
  const j = JSON.parse(決まり);
  for (const 枝 of ['live_sessions', 'live_history', 'live_presence', 'live_view']) {
    const 節 = j.rules[枝];
    assert.ok(節, 'database.rules.json に ' + 枝 + ' が無い');
    const 子 = Object.keys(節).find((k) => k.startsWith('$'));
    assert.ok(子, 枝 + ' に $ の子が無い');
    for (const 役 of ['.read', '.write']) {
      const 式 = 節[子][役] || '';
      assert.ok(
        式.includes('.length >='),
        枝 + ' の ' + 役 + ' が枝の長さを見ていない: ' + 式
      );
      assert.ok(
        式.includes(String(枝の最短)),
        枝 + ' の ' + 役 + ' の長さが ' + 枝の最短 + ' と揃っていない: ' + 式
      );
    }
  }
});

test('本体：ライブの道に団体IDが残っていない', () => {
  // ここが1つでも残ると、その操作だけ古い枝へ書き、決まりに弾かれて
  // 「自分の画面には出るが相手に届かない」という見つけにくい形になる
  const 本体 = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'useScoreStore.js'),
    'utf8'
  );
  const 道 = 本体.match(/`live_(?:sessions|history)\/\$\{[^`]*`/g) || [];
  assert.ok(道.length > 0, 'ライブの道が1つも見つからない（探し方が古い）');
  for (const x of 道)
    assert.ok(
      !/activeGroupId|団体/.test(x),
      '団体IDのまま組み立てている道がある: ' + x
    );
});

test('本体：合言葉はどの団体のものかと一緒に持っている', () => {
  // 団体を移っても端末には前の合言葉が残る。照合を外すと、移った先の練習を
  // 前の団体の枝へ書き込み、向こうの部員に見えてしまう
  const 本体 = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'useScoreStore.js'),
    'utf8'
  );
  const 場所 = 本体.indexOf('function ライブの枝()');
  assert.ok(場所 > 0, 'ライブの枝() が無い');
  const 中身 = 本体.slice(場所, 場所 + 500);
  assert.ok(
    中身.includes('控え.団体 !== 団体'),
    'ライブの枝() が、合言葉の団体と今の団体を照らし合わせていない'
  );
});
