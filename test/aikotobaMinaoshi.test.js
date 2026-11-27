'use strict';
// ライブの合言葉を作り直すかの見直し（src/aikotobaMinaoshi.js。2026-11-28）
const test = require('node:test');
const assert = require('node:assert/strict');
const 見 = require('../src/aikotobaMinaoshi');

const 在籍 = { id: 'a', name: '在籍', enrollment: '在籍', syncStatus: '同期済み' };
const 退部 = { id: 'b', name: '退部', enrollment: '退部', syncStatus: '同期済み' };
const 卒業 = { id: 'c', name: '卒業', enrollment: '卒業' };
const 前の形の卒業 = { id: 'd', name: '前の形', isAlumni: true };

test('抜けた人：雲に届いている卒業・退部と前の形の卒業生。手元だけ（未同期）は数えない', () => {
  assert.deepEqual(見.抜けた人たち([在籍, 退部, 卒業, 前の形の卒業], [{ id: 'z' }]), ['b', 'c', 'd', 'z']);
  assert.deepEqual(
    見.抜けた人たち([{ ...退部, syncStatus: '未同期' }], [{ id: 'z', syncStatus: '未同期' }]),
    [],
    '雲に届く前に作り直すと、その人がまだ新しい合言葉を受け取れる'
  );
  assert.deepEqual(見.抜けた人たち(null, undefined), []);
});

test('作り直しが要るか：一覧に無い卒業・退部の人がいれば要る。合言葉が無ければ要らない', () => {
  // 配る前の団体（一覧が無い）に退部の人がいる → 一度作り直す
  assert.equal(見.作り直しが要るか({ liveSecret: 'x'.repeat(32) }, ['b']), true);
  // 作り直したときの一覧に入っている → 要らない（開き直すたびには作り直さない）
  assert.equal(見.作り直しが要るか({ liveSecret: 'x'.repeat(32), liveSecretOut: ['b', 'c'] }, ['b']), false);
  // あとで退部にした人が届いた → 要る
  assert.equal(見.作り直しが要るか({ liveSecret: 'x'.repeat(32), liveSecretOut: ['b'] }, ['b', 'e']), true);
  // 在籍に戻した人が一覧に残っていても要らない
  assert.equal(見.作り直しが要るか({ liveSecret: 'x'.repeat(32), liveSecretOut: ['b', 'q'] }, ['b']), false);
  assert.equal(見.作り直しが要るか({}, ['b']), false, '合言葉が無い団体');
  assert.equal(見.作り直しが要るか({ liveSecret: 'x'.repeat(32) }, []), false, '抜けた人がいない');
});

test('一覧は上限まで。上限を超えた分は見ない（作り直すたびにまた要ると出て止まらないように）', () => {
  const 多い = Array.from({ length: 見.一覧の上限 + 5 }, (_, i) => `m${String(i).padStart(5, '0')}`);
  const 書いた = 見.書く一覧(多い);
  assert.equal(書いた.length, 見.一覧の上限);
  assert.equal(見.作り直しが要るか({ liveSecret: 'x'.repeat(32), liveSecretOut: 書いた }, 多い), false);
});
