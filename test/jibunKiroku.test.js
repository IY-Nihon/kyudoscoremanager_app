/**
 * 3 段目（2026-11-19 本人）：役に「全員を見る」の無い個人ログイン（部員（自分））は、記録を中継（/jibun）から自分の行だけ
 * 受け取る（src/jibunKiroku.js・src/storeSync.js）。記録かゴミ箱を書いた端末は「記録が変わった印」を置く（src/storeShared.js）。
 *
 *   npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const Module = require('node:module');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');
const 自分の記録 = require('../src/jibunKiroku');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;
const ゴミ箱の道 = `groups/${団体}/trash`;
const 印の道 = `groups/${団体}/changes`;

/** 中継の口（src/geminiChukei.js）を偽物にする。戻す手を返す */
function 中継を差し替える(偽) {
  const 場所 = path.join(__dirname, '..', 'src', 'geminiChukei.js');
  const 前 = require.cache[場所];
  const m = new Module(場所, null);
  m.filename = 場所;
  m.loaded = true;
  m.exports = 偽;
  require.cache[場所] = m;
  return () => {
    if (前) require.cache[場所] = 前;
    else delete require.cache[場所];
  };
}

/** 偽の中継。答え(体) が返す中身を 200 で返す（null なら 404＝古い中継） */
function 偽の中継(答え) {
  const 呼んだ = [];
  return {
    呼んだ,
    中継がある: () => true,
    中継へfetch: async (道, 頼み) => {
      const 体 = JSON.parse(頼み.body);
      呼んだ.push({ 道, 体 });
      const 中身 = 答え(体);
      if (中身 === null) return new Response('{}', { status: 404 });
      if (中身 && 中身.__状態) return new Response(JSON.stringify(中身), { status: 中身.__状態 });
      return new Response(JSON.stringify(中身), { status: 200 });
    },
  };
}

const 時 = (分) => Date.parse('2026-11-19T00:00:00Z') + 分 * 60000;
const 自分の列 = (marks = ['○']) => ({ id: 'a1', name: '山田 太郎', memberId: 'm1', marks });

function 部員の店(足す = {}) {
  const { store, 雲 } = ストアを用意する();
  store.setState({
    activeGroupId: 団体,
    activeRole: 'member',
    myMemberId: 'm1',
    myMemberName: '山田 太郎',
    役の設定: null,
    isHydrated: true,
    isNetworkOnline: true,
    sessions: [],
    members: [],
    alumni: [],
    trash: [],
    permanentlyDeleted: {},
    deletedMembers: {},
    lastSyncTime: null,
    ...足す,
  });
  // 雲の記録とゴミ箱を直接読んだかを数える（部員（自分）は読まない）
  const 読んだ道 = [];
  const 元 = 雲.api.getDocs;
  雲.api.getDocs = async (集まり) => {
    読んだ道.push(集まり.道);
    return 元(集まり);
  };
  return { store, 雲, 読んだ道 };
}

test('中継から取る：続きを読み、id は 30 件ずつ。古い中継は知らせる。断られたら同期の誤りの形', async () => {
  let 番 = 0;
  const 中継 = 偽の中継((体) => {
    if (体.形 === 'id') return { 記録: 体.ids.map((id) => ({ id, archers: [] })), 外す: [] };
    番 += 1;
    return 番 === 1
      ? {
          記録: [{ id: 's1' }],
          外す: ['x'],
          消えた: [{ id: 't', 時: 5 }],
          続き: { 名: 'n' },
          境目: { 記録: 10, ごみ箱: 5 },
        }
      : { 記録: [{ id: 's2' }], 外す: [], 消えた: [], 続き: null, 境目: { 記録: 7, ごみ箱: 0 } };
  });
  const ids = Array.from({ length: 31 }, (_, i) => 'k' + i);
  const 出 = await 自分の記録.中継から取る({ 団体, 形: '差分', 境目: { 記録: 3 }, ids }, { 中継 });
  assert.deepStrictEqual(
    出.記録たち.map((r) => r.id).slice(0, 2),
    ['s1', 's2'],
    '続きのページを読んでいない'
  );
  assert.strictEqual(出.記録たち.length, 2 + 31);
  assert.deepStrictEqual(出.外す, ['x']);
  assert.deepStrictEqual(出.境目, { 記録: 10, ごみ箱: 5 }, 'ページをまたいで大きい方を取っていない');
  assert.strictEqual(出.idで取れた, true);
  const id頼み = 中継.呼んだ.filter((一つ) => 一つ.体.形 === 'id');
  assert.deepStrictEqual(
    id頼み.map((一つ) => 一つ.体.ids.length),
    [30, 1]
  );
  assert.deepStrictEqual(中継.呼んだ[1].体.続き, { 名: 'n' });
  assert.deepStrictEqual(中継.呼んだ[0].体.境目, { 記録: 3, ごみ箱: 0 });
  // 古い中継（404）
  assert.deepStrictEqual(
    await 自分の記録.中継から取る({ 団体, 形: '全部' }, { 中継: 偽の中継(() => null) }),
    {
      古い中継: true,
    }
  );
  // 所属の証が無い（403）は入り直しの案内につながる形
  await assert.rejects(
    () =>
      自分の記録.中継から取る(
        { 団体, 形: '全部' },
        { 中継: 偽の中継(() => ({ __状態: 403, error: '無い' })) }
      ),
    (誤り) => 誤り.code === 'permission-denied'
  );
});

test('外すものを外す：写っていない記録とゴミ箱へ移った記録を外す。送れていない記録と、移したあとに戻した記録は残す', () => {
  const 記録たち = [
    { id: 'a', lastModified: 1 },
    { id: 'b', lastModified: 1 },
    { id: 'c', lastModified: 100 },
    { id: 'd', syncStatus: '未同期', lastModified: 1 },
    { id: 'e', lastModified: 1 },
  ];
  const 残り = 自分の記録.外すものを外す(記録たち, {
    外す: ['a', 'd'],
    消えた: [
      { id: 'b', 時: 50 },
      { id: 'c', 時: 50 },
    ],
  });
  assert.deepStrictEqual(
    残り.map((r) => r.id),
    ['c', 'd', 'e']
  );
});

test('部員（自分）の差分の同期：記録は中継から自分の行だけ。雲の記録とゴミ箱は読まない。外す・ゴミ箱へ移った記録を外す', async () => {
  const 中継 = 偽の中継((体) => ({
    記録: [
      {
        id: 's1',
        date: 時(0),
        lastModified: 時(30),
        archers: [自分の列(['○', '×'])],
        archerNames: ['山田 太郎'],
      },
    ],
    外す: ['s2'],
    消えた: [{ id: 's3', 時: 時(20) }],
    続き: null,
    境目: { 記録: 時(30), ごみ箱: 時(20) },
    __体: 体,
  }));
  const 戻す = 中継を差し替える(中継);
  try {
    const { store, 雲, 読んだ道 } = 部員の店({
      雲の境目: { 団体, 記録: 時(10), 部員: 0, ごみ箱: 時(5), 卒業生: 0 },
      全部そろえた時刻: Date.now(),
      sessions: [
        { id: 's1', date: 時(0), lastModified: 時(10), archers: [自分の列(['○'])], syncStatus: '同期済み' },
        // 前の版で届いていた、ほかの人だけの記録（ほかの人の行が手元に残っている）
        {
          id: 's2',
          date: 時(0),
          lastModified: 時(10),
          archers: [{ name: '佐藤 花子', memberId: 'm2' }],
          syncStatus: '同期済み',
        },
        { id: 's3', date: 時(0), lastModified: 時(10), archers: [自分の列()], syncStatus: '同期済み' },
        // 送れていない記録は残して送る
        { id: 's4', date: 時(0), lastModified: Date.now(), archers: [自分の列()], syncStatus: '未同期' },
      ],
      trash: [{ id: 'old', archers: [{ name: '佐藤 花子' }], syncStatus: '同期済み' }],
    });
    await store.getState().syncSessions();
    await 待つ(50);
    const 状 = store.getState();
    assert.deepStrictEqual(中継.呼んだ[0].体, {
      団体,
      形: '差分',
      境目: { 記録: 時(10), ごみ箱: 時(5) },
    });
    assert.ok(
      !読んだ道.includes(記録の道) && !読んだ道.includes(ゴミ箱の道),
      '部員（自分）が雲の記録かゴミ箱を直接読んだ'
    );
    assert.deepStrictEqual(状.sessions.map((r) => r.id).sort(), ['s1', 's4']);
    assert.deepStrictEqual(
      状.sessions.find((r) => r.id === 's1').archers[0].marks,
      ['○', '×'],
      '中継の版にしていない'
    );
    assert.deepStrictEqual(状.trash, [], 'ゴミ箱（ほかの人の記録）を手元に残した');
    assert.strictEqual(状.雲の境目.記録, 時(30));
    assert.strictEqual(状.雲の境目.ごみ箱, 時(20));
    assert.ok(雲.値(記録の道, 's4'), '送れていない記録を送っていない');
    // 書けたあと、記録が変わった印を置く
    assert.ok(雲.値(印の道, 'sessions'), '記録を送ったのに印を置いていない');
    // 5 分ごとの同期（記録は取らない）では中継を呼ばない
    const 呼んだ数 = 中継.呼んだ.length;
    await store.getState().syncSessions({ 記録は取らない: true });
    await 待つ(20);
    assert.strictEqual(中継.呼んだ.length, 呼んだ数, '5 分ごとの同期で中継を呼んだ');
    assert.strictEqual(store.getState().雲の境目.記録, 時(30), '記録を取らない同期で境目が動いた');
  } finally {
    戻す();
  }
});

test('部員（自分）の全件の取り込み：中継の全部で置き換え、ほかの人の記録とゴミ箱を手元に残さない', async () => {
  const 中継 = 偽の中継(() => ({
    記録: [{ id: 's1', date: 時(0), lastModified: 時(30), archers: [自分の列()] }],
    外す: [],
    続き: null,
    境目: { 記録: 時(30), ごみ箱: 時(7) },
  }));
  const 戻す = 中継を差し替える(中継);
  try {
    const { store, 読んだ道 } = 部員の店({
      sessions: [
        {
          id: 's2',
          date: 時(0),
          lastModified: 時(10),
          archers: [{ name: '佐藤 花子', memberId: 'm2' }],
          syncStatus: '同期済み',
        },
      ],
      trash: [{ id: 'old', archers: [], syncStatus: '同期済み' }],
    });
    await store.getState().fetchAndOverwriteFromCloud();
    const 状 = store.getState();
    assert.strictEqual(中継.呼んだ[0].体.形, '全部');
    assert.ok(!読んだ道.includes(記録の道) && !読んだ道.includes(ゴミ箱の道), '雲の記録かゴミ箱を直接読んだ');
    assert.deepStrictEqual(
      状.sessions.map((r) => r.id),
      ['s1']
    );
    assert.deepStrictEqual(状.trash, []);
    assert.strictEqual(状.雲の境目.記録, 時(30));
    assert.strictEqual(状.雲の境目.ごみ箱, 時(7));
    assert.ok(状.全部そろえた時刻 > 0);
  } finally {
    戻す();
  }
});

test('中継が古い（/jibun が無い）ときは前の道（雲から直接読む）。全員を見る役は中継を呼ばない', async () => {
  const 古い = 偽の中継(() => null);
  const 戻す = 中継を差し替える(古い);
  try {
    const { store, 読んだ道 } = 部員の店();
    await store.getState().fetchAndOverwriteFromCloud();
    assert.ok(読んだ道.includes(記録の道), '古い中継なのに雲から読まない');
    const 全員 = 部員の店({ 役の設定: { 割り当て: { m1: 'zenin' } } });
    const 呼んだ数 = 古い.呼んだ.length;
    await 全員.store.getState().fetchAndOverwriteFromCloud();
    assert.strictEqual(古い.呼んだ.length, 呼んだ数, '全員を見る役が中継を呼んだ');
    assert.ok(全員.読んだ道.includes(記録の道));
  } finally {
    戻す();
  }
});

test('部員（自分）の見張り：記録ではなく「記録が変わった印」を見張り、印が進んだら中継から取り直す', async () => {
  const 中継 = 偽の中継(() => ({ 記録: [], 外す: [], 続き: null, 境目: { 記録: 0, ごみ箱: 0 } }));
  const 戻す = 中継を差し替える(中継);
  try {
    const { store, 雲 } = 部員の店({
      雲の境目: { 団体, 記録: 時(10), 部員: 0, ごみ箱: 0, 卒業生: 0 },
      全部そろえた時刻: Date.now(),
    });
    await 雲.api.setDoc(雲.api.doc(null, 印の道, 'sessions'), { at: 雲.api.serverTimestamp() });
    await store.getState().listenToSessions();
    await store.getState().listenToTrash();
    assert.strictEqual(中継.呼んだ.length, 0, '見張りを付けただけで取りに行った');
    // ほかの端末が記録を書いた（印が進む）
    await 待つ(5);
    await 雲.api.setDoc(雲.api.doc(null, 印の道, 'sessions'), { at: 雲.api.serverTimestamp() });
    await 待つ(1700);
    assert.strictEqual(中継.呼んだ.length, 1, '印が進んだのに中継から取り直さない');
    store.getState().stopListeningToSessions();
  } finally {
    戻す();
  }
});

test('団体の端末が記録かゴミ箱を書いたら、書けたあとに記録が変わった印を置く（ほかの置き場では置かない）', async () => {
  const { store, 雲 } = ストアを用意する();
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    sessions: [{ id: 's1', date: 時(0), lastModified: Date.now(), archers: [], syncStatus: '未同期' }],
    members: [],
    alumni: [],
    trash: [],
  });
  await store.getState().syncSessions();
  await 待つ(50);
  assert.ok(雲.値(記録の道, 's1'));
  const 印 = 雲.値(印の道, 'sessions');
  assert.ok(印 && 印.at, '記録を送ったのに印を置いていない');
  assert.deepStrictEqual(Object.keys(印), ['at'], '印に時刻のほかの欄を書いた');
});
