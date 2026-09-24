/**
 * 起動のときの取り込み（差分で足りるか）と、差分の同期の境目の検査。
 *
 *   npm test
 *
 * ■ 確かめること
 *   ・差分の同期の境目は、サーバーの時刻（lastModified の最大）で決める。端末の時計や
 *     記録の見張り（直近 30 日）では決めない。前は lastSyncTime（見張りが届くたびに
 *     Date.now() で上書き）を境目にしていて、30 日より前の記録の直しを取りこぼした
 *   ・起動のとき、前に全件をそろえてから 7 日以内で控えがあれば、差分だけを取る
 *     （全件を取りにいかない）。閉じているあいだの直し・ゴミ箱への移動は届く
 *   ・初めての端末・7 日たった・別の団体の境目・控えが空のときは、全件を取り直す
 *
 * 偽の Firestore は本物に合わせ、serverTimestamp をその時刻の日時型にし、型の違う値を
 * 範囲に当てない（test/helpers/storeHarness.js）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ, 偽の日時 } = require('./helpers/storeHarness');
const { 起動のしかた, 境目を進める, 全部そろえ直す間隔 } = require('../src/syncRules');

const 団体 = '100001';
const 道 = {
  記録: `groups/${団体}/sessions`,
  部員: `groups/${団体}/members`,
  ごみ箱: `groups/${団体}/trash`,
  卒業生: `groups/${団体}/alumni`,
};
const 日 = 86400000;

/** 雲に置く記録。lastModified はサーバーの時刻（日時型） */
const 記録 = (id, 練習日, 更新, 足す = {}) =>
  Object.assign(
    {
      id,
      title: id,
      date: 練習日,
      lastModified: new 偽の日時(更新),
      tags: [],
      archers: [{ id: 'a-' + id, name: '射手', marks: ['○'] }],
    },
    足す
  );
const 部員 = (id, 更新) => ({
  id,
  name: id,
  personalId: '1' + id.slice(-3),
  grade: 1,
  lastModified: new 偽の日時(更新),
});

/** 読み取りを数える（どの問い合わせで読んだか） */
function 読み取りを数える(雲) {
  const 元 = 雲.api.getDocs;
  const 数え = { 全件: [], 差分: [] };
  雲.api.getDocs = (対象) => {
    const 絞りあり = (対象 && 対象.絞り && 対象.絞り.length) || (対象 && 対象.または && 対象.または.length);
    (絞りあり ? 数え.差分 : 数え.全件).push(対象.道);
    return 元(対象);
  };
  return 数え;
}

function 用意() {
  const { store, 雲 } = ストアを用意する();
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    sessions: [],
    members: [],
    trash: [],
    alumni: [],
    permanentlyDeleted: {},
    lastSyncTime: null,
    雲の境目: null,
    全部そろえた時刻: 0,
  });
  return { store, 雲 };
}

// ── 判断の決まり ──────────────────────────────────────

test('起動のしかた：全件をそろえてから 7 日以内で控えがあれば差分、それ以外は全件', () => {
  const 今 = Date.now();
  const 境目 = { 団体: 'g', 記録: 1 };
  const 基本 = { 団体: 'g', 境目, 全部そろえた時刻: 今 - 日, 記録の数: 3, 部員の数: 2, 今 };
  assert.strictEqual(起動のしかた(基本), '差分');
  assert.strictEqual(起動のしかた({ ...基本, 境目: null }), '全部', '境目が無い');
  assert.strictEqual(起動のしかた({ ...基本, 境目: { 団体: 'ほか' } }), '全部', '別の団体の境目');
  assert.strictEqual(起動のしかた({ ...基本, 全部そろえた時刻: 0 }), '全部', '全件をそろえたことが無い');
  assert.strictEqual(
    起動のしかた({ ...基本, 全部そろえた時刻: 今 - 全部そろえ直す間隔 - 1 }),
    '全部',
    '7 日たった'
  );
  assert.strictEqual(起動のしかた({ ...基本, 全部そろえた時刻: 今 + 日 }), '全部', '端末の時計が戻った');
  assert.strictEqual(起動のしかた({ ...基本, 記録の数: 0, 部員の数: 0 }), '全部', '控えが空');
  assert.strictEqual(起動のしかた({ ...基本, 記録を外した: true }), '全部', '控えから古い記録を外した');
});

test('境目を進める：日時型（サーバーの時刻）だけで最大を取り、下げない。数は数えない', () => {
  assert.strictEqual(
    境目を進める(500, [
      { lastModified: new 偽の日時(900) },
      { lastModified: 700 },
      { lastModified: null },
      null,
    ]),
    900
  );
  // 時計の進んだ端末が数で書いたもの・日時型を JSON に通した入れ物は、差分の問い合わせに
  // 当たらない。拾うと境目がサーバーの時刻より先へ飛ぶ
  assert.strictEqual(
    境目を進める(500, [{ lastModified: new 偽の日時(900) }, { lastModified: 99999 }]),
    900,
    '端末の時計の数で境目が進んだ'
  );
  assert.strictEqual(境目を進める(500, [{ lastModified: { seconds: 99, nanoseconds: 0 } }]), 500);
  assert.strictEqual(境目を進める(1000, [{ lastModified: new 偽の日時(900) }]), 1000);
  assert.strictEqual(境目を進める(undefined, []), 0);
});

// ── 全件取得が境目を決める ────────────────────────────────

test('全件取得は、サーバーの時刻で境目を決め、全件をそろえた時刻を置く', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 2 * 日, 今 - 5000));
  雲.置く(道.記録, 's2', 記録('s2', 今 - 90 * 日, 今 - 9000));
  雲.置く(道.部員, 'm1', 部員('m1', 今 - 7000));
  await store.getState().fetchAndOverwriteFromCloud();
  const { 雲の境目, 全部そろえた時刻 } = store.getState();
  assert.deepStrictEqual(雲の境目, { 団体, 記録: 今 - 5000, 部員: 今 - 7000, ごみ箱: 0, 卒業生: 0 });
  assert.ok(全部そろえた時刻 >= 今);
});

// ── 取りこぼし（2026-09-24 に見つけたもの）──────────────────

test('見張りが lastSyncTime を進めても、30 日より前の記録の直しを差分の同期で取りこぼさない', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, '古い', 記録('古い', 今 - 60 * 日, 今 - 60 * 日));
  雲.置く(道.記録, '新しい', 記録('新しい', 今 - 1 * 日, 今 - 1 * 日));
  await store.getState().fetchAndOverwriteFromCloud();

  // 別の端末が、30 日より前の記録を直した（記録の見張りの窓の外なので、見張りには届かない）
  雲.置く(道.記録, '古い', 記録('古い', 今 - 60 * 日, 今 - 1000, { title: 'ほかの端末で直した' }));
  // そのあと見張りが何かを受け取り、lastSyncTime を端末の時刻へ進めた（端末の時計が進んでいる形も同じ）
  store.setState({ lastSyncTime: 今 + 10 * 60000 });

  await store.getState().syncSessions();
  await 待つ(20);
  const 古い = store.getState().sessions.find((s) => s.id === '古い');
  assert.strictEqual(古い.title, 'ほかの端末で直した');
});

test('全件の道（境目が無い）で記録を 100 件しか取らないときは、記録の境目を決めない', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 日, 今 - 3000));
  雲.置く(道.部員, 'm1', 部員('m1', 今 - 2000));
  store.setState({ sessions: [], 雲の境目: null, 全部そろえた時刻: 0 });
  await store.getState().syncSessions();
  const 境目 = store.getState().雲の境目;
  assert.ok(!境目 || !境目.記録, '記録の境目を置いていない');
  assert.strictEqual(store.getState().全部そろえた時刻, 0, '全件をそろえたことにはしない');
});

// ── 起動 ───────────────────────────────────────────────

/** いったん全件で起動したあと、閉じているあいだに雲が変わった端末を作る */
async function 閉じて開き直す端末(閉じている間に) {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 2 * 日, 今 - 50000));
  雲.置く(道.記録, 's2', 記録('s2', 今 - 90 * 日, 今 - 60000));
  雲.置く(道.記録, 's3', 記録('s3', 今 - 3 * 日, 今 - 55000));
  雲.置く(道.部員, 'm1', 部員('m1', 今 - 40000));
  雲.置く(道.部員, 'm2', 部員('m2', 今 - 40000));
  await store.getState().起動時に取り込む(); // 初めては全件
  assert.strictEqual(store.getState().sessions.length, 3);
  await 閉じている間に(雲, 今);
  const 数え = 読み取りを数える(雲);
  await store.getState().起動時に取り込む();
  await 待つ(20);
  return { store, 雲, 数え };
}

test('起動：7 日以内なら差分だけ取る（全件を取りにいかない）。閉じている間の直しは届く', async () => {
  const { store, 数え } = await 閉じて開き直す端末(async (雲, 今) => {
    雲.置く(道.記録, 's2', 記録('s2', 今 - 90 * 日, 今 - 1000, { title: '90日前の記録を直した' }));
    雲.置く(道.記録, 's4', 記録('s4', 今 - 1 * 日, 今 - 900));
  });
  assert.deepStrictEqual(数え.全件, [], '全件を読んでいない');
  assert.strictEqual(数え.差分.length, 4, '記録・部員・ゴミ箱・卒業生の差分だけ');
  const 一覧 = store.getState().sessions;
  assert.strictEqual(一覧.find((s) => s.id === 's2').title, '90日前の記録を直した');
  assert.ok(
    一覧.find((s) => s.id === 's4'),
    '新しい記録も届く'
  );
  // 境目は届いた直しのサーバーの時刻（s4 の 今-900）まで進む
  const 記録の境目 = store.getState().雲の境目.記録;
  assert.ok(
    記録の境目 > Date.now() - 5000 && 記録の境目 <= Date.now(),
    `記録の境目が進んでいない: ${記録の境目}`
  );
});

test('起動：閉じている間にゴミ箱へ移された記録は、差分で履歴から外れ、ゴミ箱に入る', async () => {
  const { store } = await 閉じて開き直す端末(async (雲, 今) => {
    const 元 = 雲.値(道.記録, 's3');
    雲.消す(道.記録, 's3');
    雲.置く(
      道.ごみ箱,
      's3',
      Object.assign({}, 元, { lastModified: new 偽の日時(今 - 500), deletedAt: new 偽の日時(今 - 500) })
    );
  });
  assert.ok(!store.getState().sessions.find((s) => s.id === 's3'), '履歴から外れる');
  assert.ok(
    store.getState().trash.find((s) => s.id === 's3'),
    'ゴミ箱に入る'
  );
});

test('起動：7 日たっていれば全件を取り直す', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 日, 今 - 5000));
  await store.getState().fetchAndOverwriteFromCloud();
  store.setState({ 全部そろえた時刻: 今 - 全部そろえ直す間隔 - 日 });
  const 数え = 読み取りを数える(雲);
  await store.getState().起動時に取り込む();
  assert.ok(数え.全件.includes(道.記録), '記録を全件読む');
  assert.ok(store.getState().全部そろえた時刻 >= 今, 'そろえ直した時刻を置き直す');
});

test('別の団体へ入ると、前の団体の控えと境目を捨てる（次の起動は全件）', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 日, 今 - 5000));
  await store.getState().fetchAndOverwriteFromCloud();
  assert.ok(store.getState().雲の境目);
  store.getState().setAuth('100002', 'group', null, 'b@example.com', '100002');
  const 様子 = store.getState();
  assert.strictEqual(様子.雲の境目, null);
  assert.strictEqual(様子.全部そろえた時刻, 0);
  assert.strictEqual(様子.sessions.length, 0, '前の団体の記録を持ち越さない');
  store.getState().setAuth(null, null, null, null);
});

test('ログアウトで境目を捨てる', async () => {
  const { store, 雲 } = 用意();
  雲.置く(道.記録, 's1', 記録('s1', Date.now() - 日, Date.now() - 5000));
  await store.getState().fetchAndOverwriteFromCloud();
  store.getState().setAuth(null, null, null, null);
  assert.strictEqual(store.getState().雲の境目, null);
  assert.strictEqual(store.getState().全部そろえた時刻, 0);
});

// ── 差分に出てこない変化（消えた文書）──────────────────────────

test('起動：閉じている間にゴミ箱から戻された古い記録は、差分で履歴に戻る（手元のゴミ箱の写しに負けない）', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 2 * 日, 今 - 50000));
  雲.置く(道.部員, 'm1', 部員('m1', 今 - 40000));
  // 90 日前の記録がゴミ箱にある（記録の見張りの窓の外）
  雲.置く(道.ごみ箱, '古い', 記録('古い', 今 - 90 * 日, 今 - 30000, { deletedAt: new 偽の日時(今 - 30000) }));
  await store.getState().起動時に取り込む();
  assert.ok(store.getState().trash.find((s) => s.id === '古い'));
  // 閉じている間に、ほかの端末が戻した（記録を書き直し、ゴミ箱の文書を消す）
  雲.消す(道.ごみ箱, '古い');
  雲.置く(道.記録, '古い', 記録('古い', 今 - 90 * 日, 今 - 1000, { title: '戻した' }));
  await store.getState().起動時に取り込む();
  await 待つ(20);
  assert.ok(
    store.getState().sessions.find((s) => s.id === '古い'),
    '履歴に戻る'
  );
  assert.ok(!store.getState().trash.find((s) => s.id === '古い'), 'ゴミ箱の古い写しは外れる');
});

test('起動：閉じている間に消されたメンバーと、空にされたゴミ箱は、そのあと付く見張りで消える', async () => {
  const { store } = await 閉じて開き直す端末(async (雲, 今) => {
    雲.消す(道.部員, 'm2');
  });
  // 差分には消えた文書が出てこないので、この時点ではまだ残る
  assert.ok(store.getState().members.find((m) => m.id === 'm2'));
  // 起動の続き（App.js は 起動時に取り込む のあとに startPeriodicSync を呼ぶ）
  store.getState().startPeriodicSync();
  await 待つ(30);
  assert.ok(!store.getState().members.find((m) => m.id === 'm2'), 'メンバーの見張りで消える');
  store.getState().stopPeriodicSync();
});

test('起動：閉じている間に空にされたゴミ箱は、ゴミ箱の見張りで消える', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.部員, 'm1', 部員('m1', 今 - 40000));
  雲.置く(道.ごみ箱, 't1', 記録('t1', 今 - 5 * 日, 今 - 30000, { deletedAt: new 偽の日時(今 - 30000) }));
  await store.getState().起動時に取り込む();
  assert.ok(store.getState().trash.find((s) => s.id === 't1'));
  雲.消す(道.ごみ箱, 't1');
  await store.getState().起動時に取り込む();
  store.getState().startPeriodicSync();
  await 待つ(30);
  assert.ok(!store.getState().trash.find((s) => s.id === 't1'));
  store.getState().stopPeriodicSync();
});

// ── 端末の時計の数（2026-09-24 の見直しで見つけたもの）────────────────

test('時計の進んだ端末が数で書いた文書があっても、境目は先へ飛ばず、そのあとの直しを取りこぼさない', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 2 * 日, 今 - 5000));
  // 1 時間進んだ時計の端末が、前の「クラウドへ同期」で数のまま書いた記録
  雲.置く(道.記録, 's2', Object.assign(記録('s2', 今 - 3 * 日, 0), { lastModified: 今 + 3600000 }));
  await store.getState().fetchAndOverwriteFromCloud();
  assert.strictEqual(store.getState().雲の境目.記録, 今 - 5000, '数で境目が進んだ');
  // ほかの端末が s1 を直した（サーバーの時刻は、進んだ時計の数より前）
  雲.置く(道.記録, 's1', 記録('s1', 今 - 2 * 日, 今 - 1000, { title: 'ほかの端末で直した' }));
  await store.getState().syncSessions();
  await 待つ(20);
  assert.strictEqual(store.getState().sessions.find((s) => s.id === 's1').title, 'ほかの端末で直した');
});

test('クラウドへ同期は、更新日時をサーバーの時刻（日時型）で書く。捨てた日時も日時型', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  store.setState({
    sessions: [{ id: 's1', title: 's1', date: 今 - 日, lastModified: 今 + 3600000, tags: [], archers: [] }],
    members: [{ id: 'm1', name: 'm1', personalId: '1001', lastModified: 今 }],
    alumni: [{ id: 'g1', name: 'g1', lastModified: 今 }],
    trash: [{ id: 't1', title: 't1', date: 今 - 2 * 日, deletedAt: 今 - 日, lastModified: 今, pendingDelete: true }],
  });
  await store.getState().syncAllToCloud();
  await 待つ(20);
  for (const [場所, id] of [
    [道.記録, 's1'],
    [道.部員, 'm1'],
    [道.卒業生, 'g1'],
    [道.ごみ箱, 't1'],
  ]) {
    const 中身 = 雲.値(場所, id);
    assert.ok(中身, `${場所}/${id} が書かれていない`);
    assert.ok(中身.lastModified instanceof 偽の日時, `${場所}/${id} の lastModified が日時型でない`);
  }
  assert.ok(雲.値(道.ごみ箱, 't1').deletedAt instanceof 偽の日時, '捨てた日時が日時型でない');
  assert.strictEqual(雲.値(道.ごみ箱, 't1').deletedAt.toMillis(), 今 - 日);
  assert.strictEqual(雲.値(道.ごみ箱, 't1').pendingDelete, undefined);
});

// ── 端末の控えから外した記録（2026-09-24 の見直しで見つけたもの）──────────

test('控えに入りきらず古い記録を外したら印を残し、次の起動は全件で取り直す（外した記録が履歴に戻る）', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  // 1 件 60KB ほどの記録を 40 件（予算 1.5MB を超える）
  const 重い = 'x'.repeat(60000);
  for (let 番 = 0; 番 < 40; 番++) {
    const id = 's' + String(番).padStart(2, '0');
    雲.置く(道.記録, id, 記録(id, 今 - (番 + 1) * 日, 今 - 100000 + 番, { memo: 重い }));
  }
  await store.getState().fetchAndOverwriteFromCloud();
  assert.strictEqual(store.getState().sessions.length, 40);
  // 控えに書く形（partialize）。古いものが外れ、印が立つ
  const 控え = store.persist.getOptions().partialize(store.getState());
  assert.ok(控え.sessions.length < 40, '予算を超えても外していない（検査の前提が崩れた）');
  assert.strictEqual(控え.端末で記録を外した, true);
  // 閉じて開き直した端末（控えから戻したもの）
  store.setState({ sessions: 控え.sessions, 端末で記録を外した: 控え.端末で記録を外した });
  const 数え = 読み取りを数える(雲);
  await store.getState().起動時に取り込む();
  await 待つ(20);
  assert.ok(数え.全件.includes(道.記録), '全件で取り直していない');
  assert.strictEqual(store.getState().sessions.length, 40, '外した記録が履歴に戻っていない');
});

test('控えに収まっていれば印は立たない（差分で起動できる）', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(道.記録, 's1', 記録('s1', 今 - 日, 今 - 5000));
  await store.getState().fetchAndOverwriteFromCloud();
  const 控え = store.persist.getOptions().partialize(store.getState());
  assert.strictEqual(控え.sessions.length, 1);
  assert.strictEqual(控え.端末で記録を外した, false);
});
