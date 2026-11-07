'use strict';
/**
 * ライブ記録の直し（2026-11-04。A33・A34・A39・A41）。
 *   ・保存されて終わったら、団体の枝に「終わった」印だけ残す（盤面は消す）。開き直した端末はそれを見て片付ける
 *   ・ほかの端末で保存されたら、主催の端末も記録表を片付けて知らせる
 *   ・見るだけで入った部員が配っても、見るだけのまま
 *   ・終わった印は参加一覧に出さず、同じ名前でまた始められる
 */
const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 検査の合言葉, 待つ } = require('./helpers/storeHarness');
const 同期規則 = require('../src/syncRules');

const 団体 = '100001';
const ライブ名 = '朝練';
const 道 = `live_sessions/${検査の合言葉}/${ライブ名}/state`;

const 射手 = (o) =>
  Object.assign(
    {
      id: 'a1',
      name: '一人目',
      marks: ['○', '', '', ''],
      lockedBlocks: {},
      substitutions: {},
      substitutionIds: {},
      arrowLocations: [null, null, null, null],
      lastModified: 1000,
    },
    o
  );

function 端末(既存のライブ, 足す = {}) {
  const 用意 = ストアを用意する(undefined, 既存のライブ);
  用意.store.setState(
    Object.assign(
      {
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
        archers: [射手()],
        shotsPerRound: 4,
        isLiveActive: false,
        isHost: false,
        liveSessionName: null,
        lastPushedTimestamp: 0,
        lastResetHandled: 0,
        historyStack: [],
        redoStack: [],
        ライブの続き: null,
      },
      足す
    )
  );
  return 用意;
}

test('A41 ほかの端末で保存されたら、主催の端末も記録表を片付けて短く知らせる', async () => {
  const 主 = 端末(null);
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(主.store.getState().isHost, true);
  // 参加者の端末が保存した（終わった印が届く）
  const 今の = 主.ライブ.値(道) || {};
  主.ライブ.置く(道, Object.assign({}, 今の, { status: 'finished', timestamp: Date.now() }));
  await 待つ(20);
  assert.equal(主.store.getState().isLiveActive, false);
  assert.deepEqual(主.store.getState().archers, [], '主催の端末に記録表が残った（もう一度保存すると二重になる）');
  assert.ok(主.知らせ.some((文) => 文.includes('ほかの端末で保存されました')), '知らせていない');
});

test('保存すると、団体の枝には「終わった」印だけ残る（名前・○× は残さない）。開き直した端末は片付ける', async () => {
  const 主 = 端末(null);
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(20);
  await 主.store.getState().saveSession('練習', '', true, [], null);
  await 待つ(2300);
  const 残り = 主.ライブ.値(`live_sessions/${検査の合言葉}/${ライブ名}`);
  assert.ok(残り && 残り.state, '終わった印が残っていない');
  assert.equal(残り.state.status, 'finished');
  assert.ok(!残り.state.archers && !残り.state.marks_by_id, '盤面が残っている');
  // 閉じていた端末が開き直す
  const 開き直し = 端末(主.ライブ, {
    ライブの続き: { 名前: ライブ名, 枝: null, 閲覧枝: null, 主催: false, 見るだけ: false, よそ: false, 団体 },
  });
  assert.equal(await 開き直し.store.getState().ライブに戻る(), '終わっていた');
  assert.deepEqual(開き直し.store.getState().archers, [], '保存された記録表が残った');
});

test('終わった印は参加一覧に出さず、古くなったら片付ける。同じ名前でまた始められる', async () => {
  const いま = Date.now();
  const 節点 = {
    続いている: { state: { status: 'active', timestamp: いま } },
    終えた: { state: { status: 'finished', timestamp: いま } },
    昔に終えた: { state: { status: 'finished', timestamp: いま - 30 * 86400000 } },
  };
  const { 出す, 古い } = 同期規則.参加できるライブ(節点, いま);
  assert.deepEqual(出す, ['続いている']);
  assert.deepEqual(古い, ['昔に終えた']);
  const 主 = 端末(null);
  主.ライブ.置く(`live_sessions/${検査の合言葉}/${ライブ名}`, { state: { status: 'finished', timestamp: いま } });
  assert.equal(await 主.store.getState().startLiveSync(ライブ名), '開始した', '終わった印の名前で始められない');
  const 別 = 端末(null);
  別.ライブ.置く(`live_sessions/${検査の合言葉}/${ライブ名}`, { state: { status: 'active', timestamp: いま } });
  assert.equal(await 別.store.getState().startLiveSync(ライブ名), '同名あり', '続いているライブを上書きできた');
});

test('A39 見るだけで入った部員が配っても、見るだけのまま（○× を押せるようにならない）', async () => {
  const 主 = 端末(null);
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(20);
  const 部員 = 端末(主.ライブ, { activeRole: 'member', archers: [] });
  部員.store.getState().joinLiveSync(ライブ名, true);
  await 待つ(20);
  assert.equal(部員.store.getState().ライブは見るだけ, true);
  const 配った = await 部員.store.getState().ライブを共有する('', 3600000);
  await 待つ(20);
  assert.ok(配った, '配れなかった');
  assert.equal(部員.store.getState().ライブは見るだけ, true, '配ったら記録する側に変わった');
  assert.equal((部員.store.getState().ライブの続き || {}).見るだけ, true, '開き直すと記録する側になる');
});

test('A34 主催が配ったら、開き直したときの控えにも主催が残る', async () => {
  const 主 = 端末(null);
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(20);
  await 主.store.getState().ライブを共有する('', 3600000);
  await 待つ(20);
  assert.equal(主.store.getState().isHost, true);
  assert.equal((主.store.getState().ライブの続き || {}).主催, true, '控えに主催が残っていない（開き直すと参加者になる）');
});
