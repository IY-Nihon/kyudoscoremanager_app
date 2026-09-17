/**
 * 履歴の記録を記録画面に載せて直す（useScoreStore の 履歴の記録を記録画面で開く／履歴の編集を終える）。
 *
 * 管理者モードの履歴の詳細で直せるのは ○×・名前・鍵・削除だけで、人や間隔や計を足す・
 * 並べ替える・矢所・射数を変える、はできなかった（使う人：「普通の記録表でできることを
 * すべて」2026-09-17）。記録画面そのものに載せ替えれば道具は全部そのまま使える。
 *
 * 見たいのは 4 つ。
 *   ・載せ替えると、いま記録中の盤面が控えに残り、記録の射手が盤面に乗る
 *   ・保存して終えると、記録に書き戻り（題・メモ・タグ・日付はそのまま）、盤面は控えに戻る
 *   ・やめて終えると、記録は変わらず、盤面は控えに戻る
 *   ・ライブ中と、別の記録を直している途中は載せ替えない
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する } = require('./helpers/storeHarness');

const 射手 = (id, name, marks) => ({
  id,
  name,
  gender: '男性',
  grade: 1,
  marks: marks || ['', '', '', ''],
  lockedBlocks: {},
  substitutions: {},
  substitutionIds: {},
  arrowLocations: [null, null, null, null],
  lastModified: 1000,
});

const 記録 = () => ({
  id: 'kiroku-1',
  date: 1700000000000,
  title: '春の大会',
  note: 'メモ',
  tags: ['#大会'],
  archers: [射手('k1', '甲', ['○', '×', '○', '○']), 射手('k2', '乙', ['×', '×', '○', '○'])],
  archerNames: ['甲', '乙'],
  shotCount: 4,
  includeInStats: true,
  syncStatus: '同期済み',
  lastModified: 1700000000000,
});

function 端末() {
  const { store } = ストアを用意する();
  store.setState({
    activeGroupId: null, // 雲へは送らない（updateSession は手元だけ直す）
    activeRole: 'group',
    isHydrated: true,
    members: [],
    sessions: [記録()],
    trash: [],
    archers: [射手('now-1', '記録中の人')],
    shotsPerRound: 8,
    activeSessionID: 'ima',
    historyStack: [{ 何か: 1 }],
    redoStack: [],
    isLiveActive: false,
    履歴の編集: null,
  });
  return store;
}

test('載せ替えると、記録中の盤面が控えに残り、記録の射手が盤面に乗る', () => {
  const store = 端末();
  assert.equal(store.getState().履歴の記録を記録画面で開く('kiroku-1'), true);
  const s = store.getState();
  assert.equal(s.履歴の編集.id, 'kiroku-1');
  assert.deepEqual(s.履歴の編集.控え.archers.map((a) => a.name), ['記録中の人']);
  assert.equal(s.履歴の編集.控え.shotsPerRound, 8);
  assert.equal(s.履歴の編集.控え.activeSessionID, 'ima');
  assert.deepEqual(s.archers.map((a) => a.name), ['甲', '乙']);
  assert.equal(s.shotsPerRound, 4);
  // 記録中の id は外す。付いたままだと「終了・保存」やライブがその記録に結びつく
  assert.equal(s.activeSessionID, null);
  assert.deepEqual(s.historyStack, []);
  // 盤面は写し。盤面をいじっても記録そのものは変わらない
  s.archers[0].marks[0] = '×';
  assert.equal(store.getState().sessions[0].archers[0].marks[0], '○');
});

test('保存して終えると、記録に書き戻り、題やメモは残り、盤面は控えに戻る', () => {
  const store = 端末();
  store.getState().履歴の記録を記録画面で開く('kiroku-1');
  // 記録画面での直し：人を足し、射数を変える
  store.setState({
    archers: [...store.getState().archers, 射手('k3', '丙', ['○', '○', '○', '○', '○', '○', '○', '○'])],
    shotsPerRound: 8,
  });
  store.getState().履歴の編集を終える(true);
  const s = store.getState();
  assert.equal(s.履歴の編集, null);
  const 直した = s.sessions.find((x) => x.id === 'kiroku-1');
  assert.deepEqual(直した.archers.map((a) => a.name), ['甲', '乙', '丙']);
  assert.deepEqual(直した.archerNames, ['甲', '乙', '丙']);
  assert.equal(直した.shotCount, 8);
  assert.equal(直した.title, '春の大会');
  assert.equal(直した.note, 'メモ');
  assert.deepEqual(直した.tags, ['#大会']);
  assert.equal(直した.date, 1700000000000);
  assert.equal(直した.syncStatus, '未同期', '雲へ送り直す印が付く');
  // 盤面は直す前のものに戻る
  assert.deepEqual(s.archers.map((a) => a.name), ['記録中の人']);
  assert.equal(s.shotsPerRound, 8);
  assert.equal(s.activeSessionID, 'ima');
  assert.deepEqual(s.historyStack, [{ 何か: 1 }]);
});

test('やめて終えると、記録は変わらず、盤面は控えに戻る', () => {
  const store = 端末();
  store.getState().履歴の記録を記録画面で開く('kiroku-1');
  store.setState({ archers: [] });
  store.getState().履歴の編集を終える(false);
  const s = store.getState();
  assert.equal(s.履歴の編集, null);
  assert.deepEqual(s.sessions[0].archers.map((a) => a.name), ['甲', '乙']);
  assert.equal(s.sessions[0].syncStatus, '同期済み');
  assert.deepEqual(s.archers.map((a) => a.name), ['記録中の人']);
});

test('ライブ中と、別の記録を直している途中は載せ替えない', () => {
  const store = 端末();
  store.setState({ isLiveActive: true });
  assert.equal(store.getState().履歴の記録を記録画面で開く('kiroku-1'), false);
  assert.equal(store.getState().履歴の編集, null);
  store.setState({ isLiveActive: false });
  assert.equal(store.getState().履歴の記録を記録画面で開く('kiroku-1'), true);
  assert.equal(store.getState().履歴の記録を記録画面で開く('kiroku-1'), false, '二重に開かない');
  assert.equal(store.getState().履歴の記録を記録画面で開く('nai'), false, '無い記録は開かない');
  // 何も無いときに終えても落ちない
  store.getState().履歴の編集を終える(false);
  store.getState().履歴の編集を終える(false);
  assert.equal(store.getState().履歴の編集, null);
});
