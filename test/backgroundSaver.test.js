/**
 * 裏に回っているあいだの接続の休ませ方（src/backgroundSaver.js）。
 *
 *   npm test
 *
 * 見たいのは2つ。
 *   ・少し他のアプリを見て戻っただけでは切らないこと
 *   ・鞄の中の端末は、ちゃんと切れること
 * 前者が崩れると、記録係が在席から消えて相手に「落ちた」と見える。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 見張りを作る, 休むまでの間 } = require('../src/backgroundSaver');

/** 時計を手で進められる作り物 */
function 作り物() {
  const 予約たち = new Map();
  let 番号 = 0;
  const 記録 = [];
  const 見張り = 見張りを作る({
    切る: () => 記録.push('切った'),
    つなぐ: () => 記録.push('つないだ'),
    待つ: (f, ms) => {
      const id = ++番号;
      予約たち.set(id, { f, 時: ms });
      return id;
    },
    やめる: (id) => 予約たち.delete(id),
    休むまでの間: 1000,
  });
  return {
    見張り,
    記録,
    進める(ms) {
      for (const [id, x] of [...予約たち])
        if (x.時 <= ms) ((予約たち.delete(id), x.f()));
    },
    予約の数: () => 予約たち.size,
  };
}

test('裏に回っても、すぐには切らない', () => {
  // 数秒だけ他のアプリを見て戻る使い方で切ると、在席から消えて
  // 相手に「落ちた」と見える
  const { 見張り, 記録 } = 作り物();
  見張り.裏に回った();
  assert.deepStrictEqual(記録, [], 'すぐ切ってしまっている');
  assert.strictEqual(見張り.休んでいるか(), false);
});

test('すぐ戻れば、切らずに済む', () => {
  const { 見張り, 記録, 予約の数 } = 作り物();
  見張り.裏に回った();
  見張り.表に戻った();
  assert.deepStrictEqual(記録, [], '戻ったのに切っている');
  assert.strictEqual(予約の数(), 0, '予約が残っている');
});

test('しばらく裏のままなら切る', () => {
  const { 見張り, 記録, 進める } = 作り物();
  見張り.裏に回った();
  進める(1000);
  assert.deepStrictEqual(記録, ['切った']);
  assert.strictEqual(見張り.休んでいるか(), true);
});

test('切ったあとに戻れば、つなぎ直す', () => {
  const { 見張り, 記録, 進める } = 作り物();
  (見張り.裏に回った(), 進める(1000), 見張り.表に戻った());
  assert.deepStrictEqual(記録, ['切った', 'つないだ']);
  assert.strictEqual(見張り.休んでいるか(), false);
});

test('切っていないのに、つなぎ直さない', () => {
  // 余計な goOnline を呼ぶと、つなぎ直しが二重に走る
  const { 見張り, 記録 } = 作り物();
  (見張り.表に戻った(), 見張り.表に戻った());
  assert.deepStrictEqual(記録, []);
});

test('裏に回ったのを何度呼ばれても、予約は1つ', () => {
  const { 見張り, 予約の数, 記録, 進める } = 作り物();
  (見張り.裏に回った(), 見張り.裏に回った(), 見張り.裏に回った());
  assert.strictEqual(予約の数(), 1, '予約が増えている');
  進める(1000);
  assert.deepStrictEqual(記録, ['切った'], '何度も切っている');
});

test('片付けると、切っていてもつなぎ直して終わる', () => {
  const { 見張り, 記録, 進める, 予約の数 } = 作り物();
  (見張り.裏に回った(), 進める(1000), 見張り.片付ける());
  assert.deepStrictEqual(記録, ['切った', 'つないだ']);
  assert.strictEqual(予約の数(), 0);
});

test('切るのが失敗しても、休んだことにしない', () => {
  // 休んだことにすると、戻ったときに要らない goOnline を呼ぶ
  const 見張り = 見張りを作る({
    切る: () => {
      throw new Error('切れなかった');
    },
    つなぐ: () => {},
    待つ: (f) => (f(), 1),
    やめる: () => {},
    休むまでの間: 1,
  });
  assert.doesNotThrow(() => 見張り.裏に回った());
  assert.strictEqual(見張り.休んでいるか(), false);
});

test('既定の待ち時間は、少しの離席では切れない長さ', () => {
  // 短すぎると、他のアプリを一瞬見ただけで在席から消える
  assert.ok(休むまでの間 >= 30000, '短すぎる: ' + 休むまでの間);
});
