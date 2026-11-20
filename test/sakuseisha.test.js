/**
 * 4 段目（2026-11-20 本人）：記録に作った人（createdBy）を残す。「直す」の無い部員は、自分が作った記録の送り直しだけ
 * 決まりを通る（firestore.rules）。断られた記録は 1 件ずつに分けて送り、それでも断られたら「送れない」の印を付けて
 * 設定の役の下で知らせる（src/storeSync.js・src/storeSessions.js）。
 *
 *   npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;

function 店(役 = 'member', 足す = {}) {
  const { store, 雲 } = ストアを用意する();
  store.setState({
    activeGroupId: 団体,
    activeRole: 役,
    myMemberId: 役 === 'member' ? 'm1' : null,
    myMemberName: 役 === 'member' ? '山田 太郎' : null,
    役の設定: null,
    isHydrated: true,
    isNetworkOnline: true,
    sessions: [],
    members: [],
    alumni: [],
    trash: [],
    permanentlyDeleted: {},
    deletedMembers: {},
    archers: [{ id: 'a1', name: '山田 太郎', memberId: 'm1', marks: ['○', '×', '', ''] }],
    保存時に出欠を確認する: false,
    ...足す,
  });
  return { store, 雲 };
}
const 記録 = (id, o = {}) =>
  Object.assign({ id, title: '練習', date: Date.now() - 1000, lastModified: Date.now(), archers: [] }, o);

test('保存：部員の端末はメンバーの id、団体の端末は group を作った人として残す', async () => {
  for (const [役, 作った人] of [
    ['member', 'm1'],
    ['group', 'group'],
  ]) {
    const { store, 雲 } = 店(役);
    await store.getState().saveSession('練習', '', true, '');
    await 待つ(30);
    const 送った = store.getState().sessions[0];
    assert.strictEqual(送った.createdBy, 作った人, `${役}の端末`);
    assert.strictEqual(雲.値(記録の道, 送った.id).createdBy, 作った人);
  }
});

test('保存：直して保存し直すときは元の作った人のまま（前の版の記録には付けない）', async () => {
  const { store, 雲 } = 店('group', {
    sessions: [
      記録('s1', { createdBy: 'm2', syncStatus: '同期済み' }),
      記録('s2', { syncStatus: '同期済み' }),
    ],
  });
  for (const id of ['s1', 's2']) {
    store.setState({ activeSessionID: id, archers: [{ id: 'a1', name: 'x', marks: ['○'] }] });
    await store.getState().saveSession('直した', '', true, '');
    await 待つ(30);
  }
  assert.strictEqual(雲.値(記録の道, 's1').createdBy, 'm2', '直した人が作った人になった');
  assert.strictEqual(雲.値(記録の道, 's2').createdBy, undefined, '前の版の記録に作った人を付けた');
});

test('送り直し：「直す」の無い部員の端末は、作った人の印が無ければ自分を付けて送る', async () => {
  const { store, 雲 } = 店('member', { sessions: [記録('s1', { syncStatus: '未同期' })] });
  await store.getState().syncSessions();
  await 待つ(50);
  assert.strictEqual(雲.値(記録の道, 's1').createdBy, 'm1');
  assert.strictEqual(雲.値(記録の道, 's1').送れない, undefined, '端末の中だけの印を雲へ送った');
});

test('送り直しが決まりに断られたら、1 件ずつに分けて送り、断られた記録だけ「送れない」の印。起動で外して送り直す', async () => {
  const { store, 雲 } = 店('member', {
    sessions: [記録('old', { syncStatus: '未同期' }), 記録('new', { syncStatus: '未同期' })],
  });
  // 前の版で作って雲に届いていた記録（作った人の印が無い）への送り直しは断られる
  雲.状態.断る = (やること) =>
    (やること.操作 || []).some((一つ) => 一つ.道 === 記録の道 && 一つ.id === 'old');
  await store.getState().syncSessions();
  await 待つ(80);
  const 手元 = (id) => store.getState().sessions.find((一つ) => 一つ.id === id);
  assert.strictEqual(手元('new').syncStatus, '同期済み', '断られた記録の巻き添えで、ほかの記録が送れない');
  assert.ok(雲.値(記録の道, 'new'));
  assert.strictEqual(手元('old').syncStatus, '未同期');
  assert.strictEqual(手元('old').送れない, true);
  // 印の付いた記録は一括に入れない（ほかの記録を止めない）
  const 一括の数 = 雲.記録.filter((x) => x.種別 === 'batch').length;
  store.setState({ sessions: [...store.getState().sessions, 記録('more', { syncStatus: '未同期' })] });
  await store.getState().syncSessions();
  await 待つ(80);
  const 最後の一括 = 雲.記録.filter((x) => x.種別 === 'batch').slice(一括の数);
  assert.ok(最後の一括.length >= 1);
  assert.ok(
    最後の一括.every((x) => !x.操作.some((一つ) => 一つ.id === 'old')),
    '送れない印の記録を一括に入れた'
  );
  assert.strictEqual(手元('more').syncStatus, '同期済み');
  // 起動のたびに印を外して 1 回だけ送り直す（断られなくなっていれば送れる）
  雲.状態.断る = null;
  // アプリの起動と同じ順：取り込み → 送り直しだけの同期（startPeriodicSync の中）
  await store.getState().起動時に取り込む();
  await store.getState().syncSessions({ 取りに行かない: true });
  await 待つ(80);
  assert.strictEqual(手元('old').送れない, false);
  assert.strictEqual(手元('old').syncStatus, '同期済み');
});

test('送り直しが断られても、雲にもう同じ記録（前の版の送り待ちが先に届いた）があれば同期済み。題か日付が違う・「直す」のある役は送れない（11/20 の更新の検査）', async () => {
  const 断る = (やること) =>
    (やること.操作 || []).some((一つ) => 一つ.道 === 記録の道 && ['old', 'diff', 'again'].includes(一つ.id));
  const 手元 = (store, id) => store.getState().sessions.find((一つ) => 一つ.id === id);
  // 全員を見る役（直接読める）：雲の写しを読んで確かめる
  {
    const 保存 = Date.now() - 5000;
    const 日 = Date.now() - 1000;
    const { store, 雲 } = 店('member', {
      役の設定: { 割り当て: { m1: 'zenin' } },
      sessions: [
        記録('old', { syncStatus: '未同期', lastModified: 保存, date: 日 }),
        記録('diff', { syncStatus: '未同期', date: 日 }),
        // 雲の版のあとで直して保存し直した版（保存のたびに日付を付け直す。題は同じ）
        記録('again', { syncStatus: '未同期', date: 日 + 60 * 1000 }),
      ],
    });
    // 前の版の送り待ち（作った人の印が無い）が先に届いていた形
    雲.置く(記録の道, 'old', 記録('old', { syncStatus: '同期済み', date: 日 }));
    雲.置く(記録の道, 'diff', 記録('diff', { title: '別の練習', syncStatus: '同期済み', date: 日 }));
    雲.置く(記録の道, 'again', 記録('again', { syncStatus: '同期済み', date: 日 }));
    雲.状態.断る = 断る;
    await store.getState().syncSessions({ 取りに行かない: true });
    await 待つ(80);
    assert.strictEqual(手元(store, 'old').syncStatus, '同期済み', '雲にもう届いていたのに送れない');
    assert.ok(!手元(store, 'old').送れない);
    assert.strictEqual(
      手元(store, 'old').lastModified,
      保存,
      '更新日時を進めた（次の取り直しで雲の形にならない）'
    );
    assert.strictEqual(手元(store, 'diff').送れない, true, '雲の写しの題が違うのに届いた扱い');
    assert.strictEqual(
      手元(store, 'again').送れない,
      true,
      '雲の写しより後に保存し直した版（日付が違う）を届いた扱いにした（直しが黙って消える）'
    );
  }
  // 「直す」のある役（運営）は確かめない（合言葉の切れた直しなど。届いた扱いにすると直しが消える）
  {
    const { store, 雲 } = 店('member', {
      役の設定: { 割り当て: { m1: 'unei' } },
      sessions: [記録('old', { syncStatus: '未同期' })],
    });
    雲.置く(記録の道, 'old', 記録('old', { syncStatus: '同期済み' }));
    雲.状態.断る = 断る;
    await store.getState().syncSessions({ 取りに行かない: true });
    await 待つ(80);
    assert.strictEqual(手元(store, 'old').送れない, true, '運営の直しを届いた扱いにした');
  }
});

test('タグの直し（雲へ書く）は、記録を直せる端末だけ（「直す」の無い部員はほかの人の記録を書き換えられない）', async () => {
  for (const [役, 書くか] of [
    ['member', false],
    ['group', true],
  ]) {
    const { store, 雲 } = 店(役, { 役の設定: { 割り当て: { m1: 'zenin' } } });
    雲.置く(記録の道, 's1', 記録('s1', { tags: ['練習', '練習'] }));
    // 境目の無い同期（直近の記録を読む道）で、雲の記録が届く形にする
    await store.getState().syncSessions();
    await 待つ(50);
    assert.ok(
      store.getState().sessions.some((一つ) => 一つ.id === 's1'),
      `${役}：前提が崩れた（雲の記録が届かない）`
    );
    const 直した = 雲.記録.some((x) => x.種別 === 'updateDoc' && x.操作.some((一つ) => 一つ.道 === 記録の道));
    assert.strictEqual(直した, 書くか, `${役}の端末`);
  }
});
