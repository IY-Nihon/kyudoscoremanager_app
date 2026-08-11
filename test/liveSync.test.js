/**
 * ライブ記録（Realtime Database）の検査。
 *
 *   npm test
 *
 * 偽の RTDB を相手に、端末を2台まで作って動かす。これまでライブ同期は
 * 検査が1件も無く、偽物も空実装だったため一度も確かめられていなかった。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const ライブ名 = '朝練';
const 道 = `live_sessions/${団体}/${ライブ名}/state`;
const 本数 = 4;

const 射手 = (o) =>
  Object.assign(
    {
      id: 'a1',
      name: '一人目',
      gender: '男性',
      grade: 1,
      marks: ['', '', '', ''],
      lockedBlocks: {},
      substitutions: {},
      substitutionIds: {},
      arrowLocations: [null, null, null, null],
      lastModified: 1000,
    },
    o
  );

function 端末(既存のライブ, 射手たち) {
  const { store, ライブ } = ストアを用意する(undefined, 既存のライブ);
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    members: [],
    alumni: [],
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    archers: 射手たち || [],
    shotsPerRound: 本数,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    lastPushedTimestamp: 0,
    lastResetHandled: 0,
    historyStack: [],
    redoStack: [],
  });
  return { store, ライブ };
}

const 手元の射手 = (store, id = 'a1') => store.getState().archers.find((a) => a.id === id);

// ──────────────────────────────────────────────────────────────
test('開始：同名が無ければ開始できる', async () => {
  const { store, ライブ } = 端末(null, [射手()]);
  assert.equal(await store.getState().startLiveSync(ライブ名), '開始した');
  assert.equal(store.getState().isLiveActive, true);
  assert.ok(ライブ.値(道), 'RTDB に載っている');
});

test('開始：同名があれば開始しない', async () => {
  const { store, ライブ } = 端末(null, [射手()]);
  ライブ.置く(`live_sessions/${団体}/${ライブ名}/state`, { status: 'active', timestamp: 1 });
  assert.equal(await store.getState().startLiveSync(ライブ名), '同名あり');
  assert.equal(store.getState().isLiveActive, false);
});

test('開始：確かめられなければ開始しない（進行中のライブを潰さない）', async () => {
  // 元は確認が例外で失敗しても、そのまま作成へ進んで同名のライブを上書きしていた
  const { store, ライブ } = 端末(null, [射手()]);
  ライブ.置く(道, { status: 'active', timestamp: 1, archers: [射手({ marks: ['○', '', '', ''] })] });
  ライブ.状態.失敗させる = true;
  const 元の = ライブ.api.get;
  ライブ.api.get = async () => {
    throw new Error('偽の通信失敗');
  };
  assert.equal(await store.getState().startLiveSync(ライブ名), '確認できない');
  assert.equal(store.getState().isLiveActive, false, 'ライブを始めていない');
  assert.deepEqual(ライブ.値(道).archers[0].marks, ['○', '', '', ''], '進行中の内容が残っている');
  ライブ.api.get = 元の;
});

// ──────────────────────────────────────────────────────────────
test('矢所：主催者が置いた矢所が相手に届く', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().updateArrowLocation('a1', 1, { x: 12, y: 34 });
  await 待つ(10);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  assert.deepEqual(手元の射手(参.store).arrowLocations, [null, { x: 12, y: 34 }, null, null]);
});

test('矢所：相手が1本記録しても、手元の矢所が消えない', async () => {
  // 直す前は、送信の項目に矢所が無く受信側を土台にしていたため、
  // 誰かが1本入れるたびに参加者全員の矢所が消えていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  参.store.getState().updateArrowLocation('a1', 0, { x: 5, y: 5 });
  await 待つ(10);
  const 参の矢所 = 手元の射手(参.store).arrowLocations;
  assert.deepEqual(参の矢所, [{ x: 5, y: 5 }, null, null, null], '前提：矢所が入っている');

  主.store.getState().updateMark('a1', 3, '○');
  await 待つ(10);

  assert.deepEqual(手元の射手(参.store).arrowLocations, 参の矢所, '矢所が残っている');
  assert.equal(手元の射手(参.store).marks[3], '○', '○は届いている');
});

test('矢所：自分の送信の返りで、自分の矢所を消さない', async () => {
  // 主催者側にある「自分の送信の返りは見ない」判定が参加者側に無く、
  // 参加者は○を1つ入れるたびに自分の矢所を消していた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  参.store.getState().updateArrowLocation('a1', 2, { x: 7, y: 8 });
  await 待つ(10);
  参.store.getState().updateMark('a1', 0, '×');
  await 待つ(10);

  assert.deepEqual(手元の射手(参.store).arrowLocations, [null, null, { x: 7, y: 8 }, null]);
});

test('返り：自分の送信の返りで、まだ届いていない射手を消さない', async () => {
  // 統合後の一覧は受信側から作るので、自分の送信の返りを処理すると
  // 「送信が届いていない手元だけの射手」が落ちる。主催者側には元から
  // ある判定で、参加者側だけ抜けていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);
  assert.equal(参.store.getState().archers.length, 1);

  // 射手の追加が相手に届かなかった状態を作る
  主.ライブ.状態.失敗させる = true;
  参.store.getState().addArcher();
  await 待つ(10);
  主.ライブ.状態.失敗させる = false;
  assert.equal(参.store.getState().archers.length, 2, '手元には2人いる');

  // そのあと○を入れる。この送信は届き、返ってくる
  参.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);

  assert.equal(参.store.getState().archers.length, 2, '追加した射手が残っている');
});

test('矢所：受信に矢所が無い（古い版の相手）ときも手元を消さない', async () => {
  const { store, ライブ } = 端末(null, [射手({ arrowLocations: [{ x: 1, y: 1 }, null, null, null] })]);
  await store.getState().startLiveSync(ライブ名);
  await 待つ(10);

  // 古い版のアプリが送ってくる形（arrowLocations を持たない）を直に置く
  ライブ.置く(道, {
    status: 'active',
    timestamp: Date.now() + 1000,
    shotsPerRound: 本数,
    archers: [{ id: 'a1', name: '一人目', grade: 1, lastModified: Date.now() + 1000 }],
    marks_by_id: { a1: ['', '', '', '○'] },
    archer_timestamps: { a1: Date.now() + 1000 },
  });
  await 待つ(10);

  assert.deepEqual(手元の射手(store).arrowLocations, [{ x: 1, y: 1 }, null, null, null]);
  assert.equal(手元の射手(store).marks[3], '○', '相手の記録は受け取っている');
});

// ──────────────────────────────────────────────────────────────
test('○×：手元の入力が、次の更新で古い内容に戻らない', async () => {
  // 直す前は、手元が新しくても lastModified が受信側の古い値に巻き戻り、
  // 次の受信で「受信のほうが新しい」と誤判定されて消えていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  // 参加者が入力し、その直後に古い内容の更新が2回届く場面を作る
  参.store.getState().updateMark('a1', 0, '○');
  await 待つ(10);
  const 入れた日時 = 手元の射手(参.store).lastModified;

  for (let i = 0; i < 2; i++) {
    主.ライブ.置く(道, {
      status: 'active',
      timestamp: Date.now() + i,
      shotsPerRound: 本数,
      archers: [射手({ lastModified: 入れた日時 - 500 })],
      marks_by_id: { a1: ['', '', '', ''] },
      archer_timestamps: { a1: 入れた日時 - 500 },
    });
    await 待つ(5);
  }

  assert.equal(手元の射手(参.store).marks[0], '○', '入力が残っている');
  assert.equal(手元の射手(参.store).lastModified, 入れた日時, '日時が巻き戻っていない');
});

// ──────────────────────────────────────────────────────────────
test('終了：参加者がライブ節点を作り直さない', async () => {
  // 直す前は finished を受けたあと reset を送り返しており、届くのが遅れると
  // 主催者が消した節点を作り直して、幽霊セッションが一覧に残っていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  // 参加者の書き込みが遅れて届く場面を作る。主催者は終了の2秒後に節点を消すので、
  // 遅れた書き込みは「消したあと」に届く
  主.ライブ.状態.遅延 = 40;
  主.ライブ.置く(道, { status: 'finished', timestamp: Date.now() + 5000 });
  await 待つ(10);

  assert.equal(参.store.getState().isLiveActive, false, '参加者のライブが終わっている');
  主.ライブ.消す(`live_sessions/${団体}/${ライブ名}`); // 主催者の後始末
  await 待つ(80); // 遅れていた書き込みが届くのを待つ
  主.ライブ.状態.遅延 = 0;

  assert.equal(主.ライブ.値(`live_sessions/${団体}/${ライブ名}`), null, '節点が作り直されていない');
});

test('リセット：受け取ったリセットを送り返さない', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(10);

  const 前の書き込み数 = 主.ライブ.記録.length;
  主.ライブ.置く(道, {
    status: 'active',
    timestamp: Date.now() + 1000,
    reset_at: Date.now() + 1000,
    shotsPerRound: 本数,
    archers: [],
  });
  await 待つ(20);

  assert.equal(主.store.getState().archers.length, 0, 'リセットは効いている');
  assert.equal(主.ライブ.記録.length, 前の書き込み数, '送り返していない');
});
