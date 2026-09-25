/**
 * アプリの改善のための保存（src/improvementLog.js）の検査。
 *
 *   npm test
 *
 * 中継（src/geminiChukei.js）とストアは偽物に差し替える。中継の側の受け方は
 * kyudo-chukei の test/hozon.test.mjs が見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const 送った = [];
let 失敗させる = null; // 'POST' | '投げる'
function 差し替える() {
  const 中継の道 = path.resolve(__dirname, '../src/geminiChukei.js');
  const 店の道 = path.resolve(__dirname, '../src/useScoreStore.js');
  require.cache[中継の道] = {
    id: 中継の道,
    filename: 中継の道,
    loaded: true,
    exports: {
      中継がある: () => true,
      中継へfetch: async (道, init) => {
        if (失敗させる === '投げる') throw new Error('つながらない');
        送った.push({ 道, init });
        if (失敗させる === 'POST' && init.method === 'POST') return { ok: false, status: 503 };
        return { ok: true, status: 200 };
      },
    },
  };
  require.cache[店の道] = {
    id: 店の道,
    filename: 店の道,
    loaded: true,
    exports: { useScoreStore: { getState: () => ({ activeGroupId: '100001', activeRole: 'group' }) } },
  };
  delete require.cache[path.resolve(__dirname, '../src/improvementLog.js')];
  return require('../src/improvementLog');
}
const 記録 = 差し替える();
const 体 = (大きさ, 型 = 'image/jpeg') => new Blob([new Uint8Array(大きさ)], { type: 型 });

test('文字の記録を送り、写真を同じ id に付ける。団体と役割を添える', async () => {
  送った.length = 0;
  失敗させる = null;
  const 置けた = await 記録.改善のために取っておく('写真読み取り', { 最初: [1], 直したあと: [2] }, [
    体(10),
    体(20, 'application/pdf'),
  ]);
  assert.strictEqual(置けた, JSON.parse(送った[0].init.body).id, '置けたら id を返す');
  assert.strictEqual(送った[0].道, '/hozon');
  const 依頼 = JSON.parse(送った[0].init.body);
  assert.match(依頼.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.strictEqual(依頼.種類, '写真読み取り');
  assert.deepStrictEqual(依頼.中身, { 団体: '100001', 役割: 'group', 最初: [1], 直したあと: [2] });
  assert.deepStrictEqual(
    送った.slice(1).map((x) => [x.道, x.init.method, x.init.headers['Content-Type']]),
    [
      [`/hozon/photo/${依頼.id}/0`, 'PUT', 'image/jpeg'],
      [`/hozon/photo/${依頼.id}/1`, 'PUT', 'application/pdf'],
    ]
  );
});

test('写真は 5 つまで・1 つ 5MB まで。空や無いものは送らない', async () => {
  送った.length = 0;
  失敗させる = null;
  const 大きい = 体(記録.添付の上限 + 1);
  await 記録.改善のために取っておく('予定表', {}, [null, 体(0), 大きい, 体(1), 体(1), 体(1), 体(1), 体(1), 体(1)]);
  assert.strictEqual(送った.filter((x) => x.init.method === 'PUT').length, 5);
});

test('置けなかった・つながらないときは写真を送らず、投げもしない（使う人の操作を止めない）', async () => {
  送った.length = 0;
  失敗させる = 'POST';
  assert.strictEqual(await 記録.改善のために取っておく('チャット', { 質問: 'x' }, [体(10)]), null);
  assert.strictEqual(送った.filter((x) => x.init.method === 'PUT').length, 0);
  失敗させる = '投げる';
  assert.strictEqual(await 記録.改善のために取っておく('チャット', { 質問: 'x' }), null);
  失敗させる = null;
});

test('id を先に決めて渡せる（反映したときの記録から、読み取りの記録を指すため）', async () => {
  送った.length = 0;
  失敗させる = null;
  const 決めた = 記録.新しいid();
  assert.strictEqual(await 記録.改善のために取っておく('写真読み取り', {}, [体(3)], 決めた), 決めた);
  assert.strictEqual(JSON.parse(送った[0].init.body).id, 決めた);
  assert.strictEqual(送った[1].道, `/hozon/photo/${決めた}/0`);
});

test('id は毎回ちがう UUID', () => {
  const 一つ = 記録.新しいid();
  assert.notStrictEqual(一つ, 記録.新しいid());
  assert.match(一つ, /^[0-9a-f-]{36}$/);
});
