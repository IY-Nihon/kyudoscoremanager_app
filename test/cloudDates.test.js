/**
 * 雲の日時が日時型（Timestamp）でも、手元では数（ミリ秒）で持てるかの検査。
 *
 *   npm test
 *
 * ■ なぜこれを入れたか
 * 管理画面（Firebase コンソール）で日時を読めるよう、雲の日時を数から日時型へ移している
 * （2026-09-24〜。scripts/convert-dates-to-timestamp.mjs）。記録の date は最後に移す。
 * そのとき手元のアプリが困らないことを、ここで押さえる。
 *
 *   ・雲から受け取る口（見張り・まとめて取る・差分の同期）はすべて数に直す
 *   ・記録の見張りは、数の date と日時型の date の両方に当たる（範囲の問い合わせは
 *     同じ型にしか当たらない。数だけで絞ると日時型の記録が届かず、画面から消える）
 *   ・端末の控え（JSON）に通って入れ物（{seconds, nanoseconds}）になったものも数に戻す
 *   ・ゴミ箱の捨てた日時は日時型で送る（数や入れ物で送り返さない）
 *
 * 偽の Firestore は本物に合わせ、日時を日時型で返し、型の違う値を範囲に当てない
 * （test/helpers/storeHarness.js）。本物の SDK の or() は、2026-09-24 に検証環境で
 * 日時型の記録を 1 件置いて確かめた（履歴に正しい日付で出た）。常設の e2e にはしていない。
 * 同じ団体の記録を 1 件増やすと、履歴で開いている月が変わり、ほかの検査の記録が
 * 折りたたまれるため（取り合い）。記録の date を日時型へ移したあとは、履歴を開く
 * e2e がすべてこの道を通る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ, 偽の日時 } = require('./helpers/storeHarness');
const { 記録の日時を数に, cleanUpSessions } = require('../src/syncRules');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;
const ゴミ箱の道 = `groups/${団体}/trash`;
const 日 = 86400000;

function 用意() {
  const { store, 雲 } = ストアを用意する();
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    lastSyncTime: null,
  });
  return { store, 雲 };
}
const 記録 = (id, date, 足す = {}) =>
  Object.assign(
    {
      id,
      title: id,
      date,
      lastModified: date,
      tags: [],
      archers: [{ id: 'a-' + id, name: '射手', marks: ['○', '×'], lastModified: date }],
    },
    足す
  );

// ── 形を直す助け ──────────────────────────────────────────

test('記録の日時を数に：日時型・入れ物を数にする。射手ごとの lastModified も', () => {
  const 出 = 記録の日時を数に({
    id: 'x',
    date: new 偽の日時(1790000000000),
    lastModified: { seconds: 1790000001, nanoseconds: 0 },
    deletedAt: new 偽の日時(1790000002000),
    archers: [{ id: 'a', lastModified: new 偽の日時(1790000003000) }, { id: 'b', lastModified: 5 }, null],
  });
  assert.strictEqual(出.date, 1790000000000);
  assert.strictEqual(出.lastModified, 1790000001000);
  assert.strictEqual(出.deletedAt, 1790000002000);
  assert.strictEqual(出.archers[0].lastModified, 1790000003000);
  assert.strictEqual(出.archers[1].lastModified, 5);
  assert.strictEqual(出.archers[2], null);
});

test('記録の日時を数に：数ばかりなら作り直さない（同じものを返す）', () => {
  const 元 = 記録('s', 1790000000000);
  assert.strictEqual(記録の日時を数に(元), 元);
  assert.strictEqual(記録の日時を数に(null), null);
});

test('端末の控えで入れ物になった日時も、読み直すときに数へ戻す', () => {
  const [出] = cleanUpSessions([記録('s', { seconds: 1790000000, nanoseconds: 0 })]);
  assert.strictEqual(出.date, 1790000000000);
});

// ── 雲から受け取る口 ──────────────────────────────────────

test('記録の見張り：数の date と日時型の date の両方が届き、手元では数で持つ', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(記録の道, '数の記録', 記録('数の記録', 今 - 2 * 日));
  雲.置く(
    記録の道,
    '日時型の記録',
    記録('日時型の記録', new 偽の日時(今 - 1 * 日), {
      lastModified: new 偽の日時(今 - 1 * 日),
      archers: [{ id: 'a', name: '射手', marks: ['○'], lastModified: new 偽の日時(今 - 1 * 日) }],
    })
  );
  // 30 日より前のものは、どちらの型でも届かない（見張りの窓の外）
  雲.置く(記録の道, '古い日時型', 記録('古い日時型', new 偽の日時(今 - 40 * 日)));

  await store.getState().listenToSessions();
  await 待つ(30);
  const 一覧 = store.getState().sessions;
  assert.deepStrictEqual(
    一覧.map((s) => s.id),
    ['日時型の記録', '数の記録'],
    '両方の型が新しい順に並ぶ'
  );
  for (const s of 一覧) {
    assert.strictEqual(typeof s.date, 'number', `${s.id} の date が数でない`);
    assert.strictEqual(typeof s.lastModified, 'number', `${s.id} の lastModified が数でない`);
    assert.strictEqual(
      typeof s.archers[0].lastModified,
      'number',
      `${s.id} の射手の lastModified が数でない`
    );
  }
  store.getState().stopListeningToSessions();
});

test('まとめて取る（fetchAndOverwriteFromCloud）：日時型の記録とゴミ箱を数にして持つ', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  雲.置く(記録の道, 's1', 記録('s1', new 偽の日時(今 - 日), { lastModified: new 偽の日時(今) }));
  雲.置く(
    ゴミ箱の道,
    't1',
    記録('t1', new 偽の日時(今 - 3 * 日), { lastModified: new 偽の日時(今), deletedAt: new 偽の日時(今) })
  );
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(30);
  const s1 = store.getState().sessions.find((s) => s.id === 's1');
  const t1 = store.getState().trash.find((s) => s.id === 't1');
  assert.ok(s1 && t1, '取り込めている');
  assert.strictEqual(s1.date, 今 - 日);
  assert.strictEqual(t1.date, 今 - 3 * 日);
  assert.strictEqual(t1.deletedAt, 今);
});

test('差分の同期：日時型の記録を数にして持つ', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  store.setState({
    sessions: [Object.assign(記録('s1', 今 - 日), { syncStatus: '同期済み' })],
    lastSyncTime: 今 - 60000,
  });
  雲.置く(
    記録の道,
    's1',
    記録('s1', new 偽の日時(今 - 日), { title: '直した', lastModified: new 偽の日時(今) })
  );
  await store.getState().syncSessions();
  await 待つ(30);
  const s1 = store.getState().sessions.find((s) => s.id === 's1');
  assert.strictEqual(s1.title, '直した');
  assert.strictEqual(s1.date, 今 - 日);
});

test('ゴミ箱の送り直し：捨てた日時は日時型で送る（数や入れ物で送り返さない）', async () => {
  const { store, 雲 } = 用意();
  const 今 = Date.now();
  store.setState({
    trash: [
      Object.assign(記録('t1', 今 - 日), {
        deletedAt: 今 - 1000,
        pendingDelete: true,
        syncStatus: '未同期',
      }),
    ],
    lastSyncTime: 今 - 60000,
  });
  await store.getState().syncSessions();
  await 待つ(30);
  const 雲のt1 = 雲.値(ゴミ箱の道, 't1');
  assert.ok(雲のt1, 'ゴミ箱へ届く');
  assert.ok(雲のt1.deletedAt instanceof 偽の日時, '日時型で入る');
  assert.strictEqual(雲のt1.deletedAt.toMillis(), 今 - 1000, '捨てた日時は変えない');
});
