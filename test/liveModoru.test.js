/**
 * ライブへ戻る（useScoreStore の ライブに戻る）。
 *
 * アプリを閉じて開き直すと、ライブの状態（isLiveActive など）は端末に残らないので
 * ライブから抜けた形になり、記録表にはライブを始めた時点の○×だけが残っていた。
 * 守りたいこと：
 *   ・始めた／入ったときに ライブの続き が控えられ、終えると消える
 *   ・続いているライブへは、同じ立場（主催／参加・見るだけ）で戻れる
 *   ・終わっていた（節点が無い・finished）なら、記録表を片付けて控えを捨てる
 *   ・確かめられない（つながらない）なら、記録表も控えもそのまま
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 検査の合言葉, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const ライブ名 = '朝練';
const 道 = `live_sessions/${検査の合言葉}/${ライブ名}/state`;

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

function 端末(既存のライブ, 射手たち, 続き) {
  const { store, ライブ } = ストアを用意する(undefined, 既存のライブ);
  store.setState({
    activeGroupId: 団体,
    ライブの合言葉: { 団体: 団体, 合言葉: 検査の合言葉 },
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    members: [],
    alumni: [],
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    archers: 射手たち || [],
    shotsPerRound: 4,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    lastPushedTimestamp: 0,
    lastResetHandled: 0,
    historyStack: [],
    redoStack: [],
    ライブの続き: 続き || null,
  });
  return { store, ライブ };
}

test('始めると控えが残り、終えると消える', async () => {
  const { store } = 端末(null, [射手()]);
  assert.equal(await store.getState().startLiveSync(ライブ名), '開始した');
  assert.deepEqual(store.getState().ライブの続き, {
    名前: ライブ名, 枝: null, 閲覧枝: null, 主催: true, 見るだけ: false, よそ: false, 団体: 団体,
  });
  store.getState().stopLiveSync(true);
  assert.equal(store.getState().ライブの続き, null);
});

test('入ると控えが残る（参加・見るだけ）', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名, true);
  await 待つ(10);
  const 続き = 参.store.getState().ライブの続き;
  assert.equal(続き.名前, ライブ名);
  assert.equal(続き.主催, false);
  assert.equal(続き.見るだけ, true);
});

test('戻る：続いているライブへ、参加者として戻ると盤面が届く', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().toggleMark('a1', 0);
  await 待つ(10);
  // 閉じて開き直した参加者の体：ライブの状態は無く、控えだけ在る。記録表は古い
  const 参 = 端末(主.ライブ, [射手({ marks: ['', '', '', ''] })], {
    名前: ライブ名, 枝: null, 閲覧枝: null, 主催: false, 見るだけ: false, よそ: false, 団体: 団体,
  });
  assert.equal(await 参.store.getState().ライブに戻る(), '戻った');
  await 待つ(10);
  assert.equal(参.store.getState().isLiveActive, true);
  assert.equal(参.store.getState().isHost, false);
  assert.equal(参.store.getState().liveSessionName, ライブ名);
  assert.equal(参.store.getState().archers[0].marks[0], '○', '主催者が付けた○が届いている');
});

test('戻る：主催者だったなら主催に戻る', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(10);
  const 開き直し = 端末(主.ライブ, [射手()], {
    名前: ライブ名, 枝: null, 閲覧枝: null, 主催: true, 見るだけ: false, よそ: false, 団体: 団体,
  });
  assert.equal(await 開き直し.store.getState().ライブに戻る(), '戻った');
  await 待つ(10);
  assert.equal(開き直し.store.getState().isLiveActive, true);
  assert.equal(開き直し.store.getState().isHost, true);
});

test('戻る：終わっていたら記録表を片付け、控えを捨てる', async () => {
  const { store } = 端末(null, [射手({ marks: ['○', '×', '', ''] })], {
    名前: ライブ名, 枝: null, 閲覧枝: null, 主催: false, 見るだけ: false, よそ: false, 団体: 団体,
  });
  // 節点が無い（主催者が終えて消した）
  assert.equal(await store.getState().ライブに戻る(), '終わっていた');
  assert.equal(store.getState().isLiveActive, false);
  assert.deepEqual(store.getState().archers, [], '記録表が片付いている');
  assert.equal(store.getState().ライブの続き, null);
});

test('戻る：finished の節点でも終わっていた扱い', async () => {
  const { store, ライブ } = 端末(null, [射手({ marks: ['○', '×', '', ''] })], {
    名前: ライブ名, 枝: null, 閲覧枝: null, 主催: false, 見るだけ: false, よそ: false, 団体: 団体,
  });
  ライブ.置く(道, { status: 'finished', timestamp: 1, archers: [] });
  assert.equal(await store.getState().ライブに戻る(), '終わっていた');
  assert.deepEqual(store.getState().archers, []);
  assert.equal(store.getState().ライブの続き, null);
});

test('戻る：確かめられなければ、記録表も控えもそのまま', async () => {
  const { store, ライブ } = 端末(null, [射手({ marks: ['○', '×', '', ''] })], {
    名前: ライブ名, 枝: null, 閲覧枝: null, 主催: false, 見るだけ: false, よそ: false, 団体: 団体,
  });
  const 元の = ライブ.api.get;
  ライブ.api.get = async () => {
    throw new Error('偽の通信失敗');
  };
  assert.equal(await store.getState().ライブに戻る(), '確認できない');
  ライブ.api.get = 元の;
  assert.equal(store.getState().archers[0].marks[0], '○');
  assert.ok(store.getState().ライブの続き);
});

test('戻る：控えの団体が違えば、控えを捨てるだけ', async () => {
  const { store } = 端末(null, [射手({ marks: ['○', '×', '', ''] })], {
    名前: ライブ名, 枝: null, 閲覧枝: null, 主催: false, 見るだけ: false, よそ: false, 団体: '999999',
  });
  await store.getState().ライブに戻る();
  assert.equal(store.getState().ライブの続き, null);
  assert.equal(store.getState().archers[0].marks[0], '○', '記録表は触らない');
});
