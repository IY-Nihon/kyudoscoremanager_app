// 管理者の合言葉の中継とのやり取り（src/kanriAikotoba.js・2026-11-14）。中継の返りを画面の言葉に直すところを確かめる。
// 中継の中身（照合・回数・印）は chukei の test/kanri.test.mjs
const test = require('node:test');
const assert = require('node:assert');
const 合 = require('../src/kanriAikotoba');

/** 偽の中継。返り（status と体）を決め、送った体と 証を取り直したか を控える */
function 偽の中継(status, 体 = {}, { ある = true } = {}) {
  const 控え = { 送った: [], 取り直した: 0 };
  return {
    控え,
    中継: {
      中継がある: () => ある,
      ログインの証: async (取り直す) => {
        if (取り直す) 控え.取り直した++;
        return 'tok';
      },
      中継へfetch: async (道, init) => {
        控え.送った.push({ 道, 体: JSON.parse(init.body) });
        return { status, ok: status >= 200 && status < 300, json: async () => 体 };
      },
    },
  };
}

test('合言葉の形：空・6 字未満・64 字超えを断る', () => {
  assert.equal(合.合言葉の形の文(''), '合言葉を入れてください');
  assert.equal(合.合言葉の形の文('   '), '合言葉を入れてください');
  assert.equal(合.合言葉の形の文('12345'), '合言葉は 6 字以上にしてください');
  assert.equal(合.合言葉の形の文('あ'.repeat(65)), '合言葉は 64 字までにしてください');
  assert.equal(合.合言葉の形の文('ゆみや2026'), '');
});

test('中継の返りを画面の結果に直す：無い・古い（404）・持ち主でない・待つ・App Check・形・届かない', async () => {
  const 結果 = async (status, 体) => (await 合.様子を聞く('G1', { 中継: 偽の中継(status, 体).中継 })).結果;
  assert.equal(
    (await 合.様子を聞く('G1', { 中継: 偽の中継(200, {}, { ある: false }).中継 })).結果,
    '古い中継'
  );
  assert.equal(await 結果(404), '古い中継');
  assert.equal(await 結果(403), '持ち主でない');
  assert.equal(await 結果(429, { error: '待って' }), '待つ');
  assert.equal(await 結果(401, { 印: 'appcheck' }), '届かない');
  assert.equal(await 結果(400, { error: '形' }), '形が違う');
  assert.equal(await 結果(503), '届かない');
  assert.deepStrictEqual(
    await 合.様子を聞く('G1', { 中継: 偽の中継(200, { 結果: '様子', 合言葉あり: true }).中継 }),
    {
      結果: '様子',
      合言葉あり: true,
    }
  );
});

test('作る・忘れたときの変えるは、入り直した直後の証を取り直してから送る。今の合言葉で変えるときは取り直さない', async () => {
  const 作る = 偽の中継(200, { 結果: '作った', 期限: 1 });
  await 合.合言葉を作る('G1', 'abcdef', { 中継: 作る.中継 });
  assert.equal(作る.控え.取り直した, 1);
  assert.deepStrictEqual(作る.控え.送った[0], {
    道: '/kanri',
    体: { 団体: 'G1', 操作: '作る', 新しい: 'abcdef' },
  });
  const 忘れた = 偽の中継(200, { 結果: '変えた' });
  await 合.合言葉を変える('G1', 'newpass', '', { 中継: 忘れた.中継 });
  assert.equal(忘れた.控え.取り直した, 1);
  assert.deepStrictEqual(忘れた.控え.送った[0].体, { 団体: 'G1', 操作: '変える', 新しい: 'newpass' });
  const 今ので = 偽の中継(200, { 結果: '変えた' });
  await 合.合言葉を変える('G1', 'newpass', 'oldpass', { 中継: 今ので.中継 });
  assert.equal(今ので.控え.取り直した, 0);
  assert.equal(今ので.控え.送った[0].体.今の, 'oldpass');
  const 入る = 偽の中継(200, { 結果: '入れた', 期限: 2 });
  assert.deepStrictEqual(await 合.合言葉で入る('G1', 'abcdef', { 中継: 入る.中継 }), {
    結果: '入れた',
    期限: 2,
  });
  assert.equal(入る.控え.取り直した, 0);
});

test('開き直したときの管理者モード：期限がまだなら戻す・過ぎた／期限の無い（前の版の控え）は切る（11/20 の更新の検査）', () => {
  const 今 = 1_000_000;
  assert.strictEqual(合.控えの管理者モード(true, 今 + 60_000, 今), '戻す');
  assert.strictEqual(合.控えの管理者モード(true, 今 - 1, 今), '切る');
  assert.strictEqual(合.控えの管理者モード(true, 今, 今), '切る');
  // 前の版は管理者モードを期限なしで控えに残していた（新しい決まりは中継の印を求めるので、残すと断られる）
  assert.strictEqual(合.控えの管理者モード(true, null, 今), '切る');
  assert.strictEqual(合.控えの管理者モード(true, undefined, 今), '切る');
  assert.strictEqual(合.控えの管理者モード(false, 今 + 60_000, 今), 'そのまま');
  assert.strictEqual(合.控えの管理者モード(undefined, null, 今), 'そのまま');
});
