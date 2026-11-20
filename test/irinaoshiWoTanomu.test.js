/**
 * 断られたときに入り直しの窓を出すか（src/storeShared.js の 入り直しを頼む。11/20 本人「黙って取り直す」）。
 * App Check の印が一時的に取れないと、強制している Firestore は permission-denied で断る。そのときはすぐ窓を出さず、
 * 印が戻ったら見張りを付け直して同期する。戻らない・取り直してもまた断られるときだけ、前のとおり窓を出す。
 *
 *   npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

/** 偽の店（書く・状態）。見張りと同期を呼んだ回数を数える */
function 偽の店(足す = {}) {
  const 呼んだ = [];
  const 中身 = {
    activeGroupId: '100001',
    出ている途中: false,
    入り直しをあとに: false,
    入り直しが要る: false,
    再ログインの案内: null,
    ...足す,
  };
  for (const 名 of [
    'listenToConfig',
    'listenToSessions',
    'listenToTrash',
    'listenToMembers',
    'listenToAlumni',
    'syncSessions',
  ])
    中身[名] = async () => {
      呼んだ.push(名);
    };
  const 書く = (変更) => Object.assign(中身, typeof 変更 === 'function' ? 変更(中身) : 変更);
  return { 書く, 状態: () => 中身, 中身, 呼んだ };
}

/** 偽の App Check（src/setupAppCheck.js の口と同じ形） */
function 偽の印({ 取れていない = false, 最後 = 0 } = {}) {
  const 待つ手 = [];
  return {
    様子: { 取れていない, 最後 },
    印が取れていないか() {
      return this.様子.取れていない;
    },
    最後に印が取れなかった時刻() {
      return this.様子.最後;
    },
    印が戻ったら(手) {
      待つ手.push(手);
      return () => {
        const 位置 = 待つ手.indexOf(手);
        if (位置 >= 0) 待つ手.splice(位置, 1);
      };
    },
    戻る() {
      this.様子.取れていない = false;
      for (const 手 of 待つ手.splice(0)) 手();
    },
    待っている数: () => 待つ手.length,
  };
}

function 道具を読む() {
  ストアを用意する();
  const 共 = require('../src/storeShared');
  共.入り直しの待ちを忘れる();
  return 共;
}

test('印が取れているときの断りは、前のとおりすぐ窓を出す（あとにしていたら帯だけ）', () => {
  const 共 = 道具を読む();
  const 店 = 偽の店();
  共.入り直しを頼む(店.書く, 店.状態, { 印: 偽の印() });
  assert.strictEqual(店.中身.入り直しが要る, true);
  assert.strictEqual(店.中身.再ログインの案内, 共.入り直しの案内);
  assert.deepStrictEqual(店.呼んだ, []);
  const あと = 偽の店({ 入り直しをあとに: true });
  共.入り直しを頼む(あと.書く, あと.状態, { 印: 偽の印() });
  assert.strictEqual(あと.中身.入り直しが要る, false);
  assert.strictEqual(あと.中身.再ログインの案内, 共.入り直しの案内);
  // ログアウトの途中は何もしない
  const 出る = 偽の店({ 出ている途中: true });
  共.入り直しを頼む(出る.書く, 出る.状態, { 印: 偽の印() });
  assert.strictEqual(出る.中身.入り直しが要る, false);
});

test('印が取れていない間の断りは窓を出さず、印が戻ったら見張りを付け直して同期する（続けて断られても待つのは 1 つ）', async () => {
  const 共 = 道具を読む();
  const 店 = 偽の店();
  const 印 = 偽の印({ 取れていない: true, 最後: Date.now() });
  共.入り直しを頼む(店.書く, 店.状態, { 印, 待つ長さ: 1000, 同期を待つ長さ: 0 });
  共.入り直しを頼む(店.書く, 店.状態, { 印, 待つ長さ: 1000, 同期を待つ長さ: 0 });
  assert.strictEqual(店.中身.入り直しが要る, false, '印が取れていないのに窓を出した');
  assert.strictEqual(印.待っている数(), 1, '同じ断りで何度も待った');
  印.戻る();
  await 待つ(10);
  assert.deepStrictEqual(店.呼んだ.sort(), [
    'listenToAlumni',
    'listenToConfig',
    'listenToMembers',
    'listenToSessions',
    'listenToTrash',
    'syncSessions',
  ]);
  assert.strictEqual(店.中身.入り直しが要る, false);
  // 取り直したあと 1 分以内にまた断られた：印のせいではないので窓
  共.入り直しを頼む(店.書く, 店.状態, { 印 });
  assert.strictEqual(店.中身.入り直しが要る, true, '取り直してもまた断られたのに窓を出さない');
});

test('印が戻らないまま待つ長さを過ぎたら、前のとおり窓を出す（待つのはやめる）', async () => {
  const 共 = 道具を読む();
  const 店 = 偽の店();
  const 印 = 偽の印({ 取れていない: true, 最後: Date.now() });
  共.入り直しを頼む(店.書く, 店.状態, { 印, 待つ長さ: 20 });
  assert.strictEqual(店.中身.入り直しが要る, false);
  await 待つ(60);
  assert.strictEqual(店.中身.入り直しが要る, true, '印が戻らないのに窓を出さない');
  assert.strictEqual(印.待っている数(), 0, '窓を出したあとも印を待っている');
  印.戻る();
  await 待つ(10);
  assert.deepStrictEqual(店.呼んだ, [], '窓を出したあとに黙って取り直した');
});

test('断りと印の戻りが入れ違った（少し前まで取れていなかった）なら、一度だけ黙って取り直す。古い失敗なら窓', async () => {
  const 共 = 道具を読む();
  const 店 = 偽の店();
  共.入り直しを頼む(店.書く, 店.状態, { 印: 偽の印({ 最後: Date.now() - 5000 }), 同期を待つ長さ: 0 });
  await 待つ(10);
  assert.strictEqual(店.中身.入り直しが要る, false);
  assert.ok(店.呼んだ.includes('syncSessions'), '入れ違いなのに取り直さない');
  共.入り直しの待ちを忘れる();
  const 古い = 偽の店();
  共.入り直しを頼む(古い.書く, 古い.状態, { 印: 偽の印({ 最後: Date.now() - 5 * 60 * 1000 }) });
  assert.strictEqual(古い.中身.入り直しが要る, true, '5 分前の印の失敗で窓を出さない');
});

test('待っている間に別の団体へ入り直したら、印が戻っても前の団体の見張りを付けない・待ちが過ぎても窓を出さない', async () => {
  const 共 = 道具を読む();
  const 店 = 偽の店();
  const 印 = 偽の印({ 取れていない: true, 最後: Date.now() });
  共.入り直しを頼む(店.書く, 店.状態, { 印, 待つ長さ: 1000, 同期を待つ長さ: 0 });
  店.中身.activeGroupId = '100002';
  印.戻る();
  await 待つ(10);
  assert.deepStrictEqual(店.呼んだ, []);
  共.入り直しの待ちを忘れる();
  const 次 = 偽の店();
  共.入り直しを頼む(次.書く, 次.状態, { 印: 偽の印({ 取れていない: true, 最後: Date.now() }), 待つ長さ: 20 });
  次.中身.activeGroupId = '100002';
  await 待つ(60);
  assert.strictEqual(次.中身.入り直しが要る, false, '別の団体に入り直したのに、前の団体の断りで窓を出した');
});

test('App Check の口：印が取れたら待っていた手を一度ずつ呼ぶ。最後に取れなかった時刻は取れても残る', () => {
  const 印 = require('../src/setupAppCheck');
  const 呼んだ = [];
  印.印が取れなかった();
  assert.strictEqual(印.印が取れていないか(), true);
  const 最後 = 印.最後に印が取れなかった時刻();
  assert.ok(最後 > 0);
  印.印が戻ったら(() => 呼んだ.push('一'));
  const やめる = 印.印が戻ったら(() => 呼んだ.push('二'));
  やめる();
  印.印が取れた();
  印.印が取れた();
  assert.deepStrictEqual(呼んだ, ['一'], '待つのをやめた手を呼んだ・2 回呼んだ');
  assert.strictEqual(印.印が取れていないか(), false);
  assert.strictEqual(印.最後に印が取れなかった時刻(), 最後);
});
