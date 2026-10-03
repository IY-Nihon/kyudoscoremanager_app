/**
 * メンバーの名前・性別・学年を直したとき、過去の記録表にも写ること（useScoreStore.updateMember）。
 *
 *   npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 名簿の道 = `groups/${団体}/members`;
const 記録の道 = `groups/${団体}/sessions`;
const ごみ箱の道 = `groups/${団体}/trash`;

const 部員 = (o) =>
  Object.assign(
    { id: 'mem-1', name: '旧姓 太郎', gender: '男性', grade: 2, personalId: '1011', equipments: [], lastModified: 1000, syncStatus: '同期済み' },
    o
  );
const 射手 = (o) => Object.assign({ id: 'a1', name: '旧姓 太郎', gender: '男性', grade: 2, memberId: 'mem-1', marks: ['○', '×'] }, o);
const 記録 = (id, 射手たち, o) =>
  Object.assign({ id, date: 1700000000000, title: '練習', archers: 射手たち, archerNames: 射手たち.map((x) => x.name), lastModified: 1000 }, o);

async function 用意(記録たち, ごみ箱 = []) {
  const { store, 雲 } = ストアを用意する();
  await 待つ(30);
  雲.置く(名簿の道, 'mem-1', 部員());
  for (const r of 記録たち) 雲.置く(記録の道, r.id, r);
  for (const r of ごみ箱) 雲.置く(ごみ箱の道, r.id, r);
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    members: [部員()],
    alumni: [],
    sessions: 記録たち.map((r) => Object.assign({}, r)),
    trash: ごみ箱.map((r) => Object.assign({}, r)),
    permanentlyDeleted: {},
    lastSyncTime: null,
  });
  return { store, 雲 };
}

test('名前と性別を変えると、過去の記録の射手にも写る（手元とクラウドの両方）', async () => {
  const { store, 雲 } = await 用意([記録('s1', [射手()]), 記録('s2', [射手({ id: 'a2' }), 射手({ id: 'a3', name: '他人', memberId: 'mem-2' })])]);
  store.getState().updateMember('mem-1', { name: '新姓 太郎', gender: '女性' });
  await 待つ(500);
  for (const id of ['s1', 's2']) {
    const 手元 = store.getState().sessions.find((s) => s.id === id);
    const 太郎 = 手元.archers.find((a) => a.memberId === 'mem-1');
    assert.equal(太郎.name, '新姓 太郎', `${id} の手元の名前`);
    assert.equal(太郎.gender, '女性', `${id} の手元の性別`);
    assert.ok(手元.archerNames.includes('新姓 太郎') && !手元.archerNames.includes('旧姓 太郎'), `${id} の archerNames`);
    assert.equal(雲.値(記録の道, id).archers.find((a) => a.memberId === 'mem-1').name, '新姓 太郎', `${id} のクラウドの名前`);
  }
  const 他人 = store.getState().sessions.find((s) => s.id === 's2').archers.find((a) => a.memberId === 'mem-2');
  assert.equal(他人.name, '他人', '別の人は変わらない');
});

test('ゴミ箱の記録にも写る', async () => {
  const { store, 雲 } = await 用意([], [記録('t1', [射手()])]);
  store.getState().updateMember('mem-1', { name: '新姓 太郎' });
  await 待つ(500);
  assert.equal(store.getState().trash[0].archers[0].name, '新姓 太郎');
  assert.equal(雲.値(ごみ箱の道, 't1').archers[0].name, '新姓 太郎');
});

test('途中交代で入った記録の名前も写る', async () => {
  const 交代あり = 射手({ memberId: 'mem-9', name: '元の人', substitutionIds: { 1: 'mem-1' }, substitutions: { 1: '旧姓 太郎' } });
  const { store, 雲 } = await 用意([記録('s1', [交代あり])]);
  store.getState().updateMember('mem-1', { name: '新姓 太郎' });
  await 待つ(500);
  const 手元 = store.getState().sessions[0].archers[0];
  assert.equal(手元.substitutions[1], '新姓 太郎', '交代の名前');
  assert.equal(手元.name, '元の人', '本来の射手は変わらない');
  assert.equal(雲.値(記録の道, 's1').archers[0].substitutions[1], '新姓 太郎');
});

test('学年を変えたときも、過去の記録の学年が写る（今の作りの確認）', async () => {
  const { store } = await 用意([記録('s1', [射手()])]);
  store.getState().updateMember('mem-1', { grade: 3 });
  await 待つ(500);
  assert.equal(store.getState().sessions[0].archers[0].grade, 3);
});

test('記録が多いメンバー（600 件）でも、クラウドへは少しずつ（1 回 500 件を超えず、画面を止めない大きさ）全部届く', async () => {
  const 多い = Array.from({ length: 600 }, (_, i) => 記録(`s${i}`, [射手({ id: `a${i}` })]));
  const { store, 雲 } = await 用意(多い);
  store.getState().updateMember('mem-1', { name: '新姓 太郎' });
  assert.equal(store.getState().sessions.filter((s) => s.archers[0].name === '新姓 太郎').length, 600, '手元はすぐ全部');
  const 届いた = () => 多い.filter((r) => 雲.値(記録の道, r.id).archers[0].name === '新姓 太郎').length;
  // 5 件ずつ 30ms あけて送る：600 件で 120 回、4〜5 秒かかる
  for (let i = 0; i < 100 && 届いた() < 600; i++) await 待つ(100);
  assert.equal(届いた(), 600, 'クラウドにも全部届く');
  const 一括 = 雲.記録.filter((x) => x.種別 === 'batch');
  assert.ok(一括.length >= 100, '小さく分けて送る');
  for (const 回 of 一括) assert.ok(回.操作.length <= 5, `1 回に ${回.操作.length} 件（画面を止めない大きさにする）`);
});

test('メンバーを直した直後に、別の団体へ入り直したら、続きは送らない', async () => {
  const 多い = Array.from({ length: 40 }, (_, i) => 記録(`s${i}`, [射手({ id: `a${i}` })]));
  const { store, 雲 } = await 用意(多い);
  store.getState().updateMember('mem-1', { name: '新姓 太郎' });
  await 待つ(40);
  store.setState({ activeGroupId: '999999' });
  await 待つ(600);
  const 届いた = 多い.filter((r) => 雲.値(記録の道, r.id).archers[0].name === '新姓 太郎').length;
  assert.ok(届いた < 40, `別の団体に入ったあとも送り続けた（${届いた} 件）`);
});

test('いま記録している盤面と、取り消しの控えにも写る（保存前の記録の画面が古い名前のまま残らない）', async () => {
  const { store } = await 用意([]);
  const 盤 = [射手(), 射手({ id: 'a2', name: '他人', memberId: 'mem-2' })];
  store.setState({ archers: 盤, historyStack: [[射手({ marks: [] })]], redoStack: [[射手({ marks: ['○'] })]] });
  store.getState().updateMember('mem-1', { name: '新姓 太郎', gender: '女性' });
  await 待つ(100);
  const 今 = store.getState();
  assert.equal(今.archers[0].name, '新姓 太郎', '盤面の名前');
  assert.equal(今.archers[0].gender, '女性', '盤面の性別');
  assert.equal(今.archers[1].name, '他人', '別の人は変わらない');
  assert.equal(今.historyStack[0][0].name, '新姓 太郎', '取り消しの控え');
  assert.equal(今.redoStack[0][0].name, '新姓 太郎', 'やり直しの控え');
});

test('盤面に出ていない人を直しても、盤面は触らない（無駄に書き換えない）', async () => {
  const { store } = await 用意([]);
  const 盤 = [射手({ id: 'a2', name: '他人', memberId: 'mem-2' })];
  store.setState({ archers: 盤 });
  store.getState().updateMember('mem-1', { name: '新姓 太郎' });
  await 待つ(100);
  assert.strictEqual(store.getState().archers, 盤, '同じ配列のまま');
});

// ───── 取りこぼしの自動修正（名前のずれを直す） ─────
const 林 = () => 部員({ id: 'mem-1', name: '林 飛雄' });
const 古い名前の記録 = (id, o) =>
  記録(id, [射手({ id: id + 'a', name: '叡智な林 飛雄', marks: ['○', '×', '○'] }), 射手({ id: id + 'b', name: '山田 花子', memberId: 'mem-2', marks: ['×'] })], o);

async function ずれた団体(記録たち, ごみ箱 = [], 手元だけの設定) {
  const { store, 雲 } = ストアを用意する();
  await 待つ(30);
  雲.置く(名簿の道, 'mem-1', 林());
  雲.置く(名簿の道, 'mem-2', 部員({ id: 'mem-2', name: '山田 花子' }));
  for (const r of 記録たち) 雲.置く(記録の道, r.id, r);
  for (const r of ごみ箱) 雲.置く(ごみ箱の道, r.id, r);
  store.setState(
    Object.assign(
      {
        activeGroupId: 団体,
        activeRole: 'group',
        isHydrated: true,
        isNetworkOnline: true,
        isLiveActive: false,
        members: [林(), 部員({ id: 'mem-2', name: '山田 花子' })],
        alumni: [],
        sessions: 記録たち.map((r) => Object.assign({}, r)),
        trash: ごみ箱.map((r) => Object.assign({}, r)),
        permanentlyDeleted: {},
        lastSyncTime: null,
      },
      手元だけの設定 || {}
    )
  );
  return { store, 雲 };
}

test('取りこぼし：前の名前が残った記録を、雲の最新を読んで名前だけ直す（○× は残る）', async () => {
  const { store, 雲 } = await ずれた団体([古い名前の記録('s1'), 古い名前の記録('s2')], [古い名前の記録('t1')]);
  // 雲の ○× は手元より新しい（ほかの端末が足した）。手元の古い写しで上書きしてはいけない
  雲.置く(記録の道, 's1', Object.assign({}, 古い名前の記録('s1'), { archers: [射手({ id: 's1a', name: '叡智な林 飛雄', marks: ['○', '×', '○', '○'] }), 射手({ id: 's1b', name: '山田 花子', memberId: 'mem-2', marks: ['×'] })] }));
  await store.getState().名前のずれを直す();
  await 待つ(50);
  const s1 = 雲.値(記録の道, 's1');
  assert.equal(s1.archers[0].name, '林 飛雄', '雲の名前');
  assert.deepEqual(s1.archers[0].marks, ['○', '×', '○', '○'], '雲の最新の ○× が残る（手元の古い写しで上書きしない）');
  assert.deepEqual(s1.archerNames, ['林 飛雄', '山田 花子']);
  assert.equal(雲.値(記録の道, 's2').archers[0].name, '林 飛雄');
  assert.equal(雲.値(ごみ箱の道, 't1').archers[0].name, '林 飛雄', 'ゴミ箱の記録も');
  assert.equal(store.getState().sessions[0].archers[0].name, '林 飛雄', '手元にも写る');
  assert.deepEqual(store.getState().sessions[0].archers[0].marks, ['○', '×', '○'], '手元の ○× は触らない');
});

test('取りこぼし：ゲスト（結び付き無し）と、名簿に居ない人は触らない', async () => {
  const ゲスト入り = 記録('g1', [射手({ id: 'g1a', name: '叡智な林 飛雄', memberId: undefined, isGuest: true }), 射手({ id: 'g1b', name: '消えた人', memberId: 'mem-9' })]);
  const { store, 雲 } = await ずれた団体([ゲスト入り]);
  await store.getState().名前のずれを直す();
  await 待つ(50);
  assert.equal(雲.値(記録の道, 'g1').archers[0].name, '叡智な林 飛雄');
  assert.equal(雲.値(記録の道, 'g1').archers[1].name, '消えた人');
  assert.equal(雲.記録.filter((x) => x.種別 === 'transaction').length, 0, '書いていない');
});

test('取りこぼし：手元に送信待ちの編集がある記録は触らない（こちらの書き込みで古い扱いにしない）', async () => {
  const { store, 雲 } = await ずれた団体([古い名前の記録('s1', { syncStatus: '未同期' }), 古い名前の記録('s2')]);
  await store.getState().名前のずれを直す();
  await 待つ(50);
  assert.equal(雲.値(記録の道, 's1').archers[0].name, '叡智な林 飛雄', '送信待ちの記録は、そのまま');
  assert.equal(雲.値(記録の道, 's2').archers[0].name, '林 飛雄');
});

test('取りこぼし：団体ログインの端末だけ・通信できるときだけ・ライブ中は動かない', async () => {
  for (const [名, 設定] of [['個人ログイン', { activeRole: 'member' }], ['通信できない', { isNetworkOnline: false }], ['ライブ中', { isLiveActive: true }]]) {
    const { store, 雲 } = await ずれた団体([古い名前の記録('s1')], [], 設定);
    await store.getState().名前のずれを直す();
    await 待つ(30);
    assert.equal(雲.値(記録の道, 's1').archers[0].name, '叡智な林 飛雄', `${名}では書かない`);
  }
});

test('取りこぼし：ずれが無ければ何も書かない。直したあとの 2 度目も書かない', async () => {
  const { store, 雲 } = await ずれた団体([古い名前の記録('s1')]);
  await store.getState().名前のずれを直す();
  await 待つ(30);
  const 回数 = () => 雲.記録.filter((x) => x.種別 === 'transaction').length;
  assert.equal(回数(), 1);
  await store.getState().名前のずれを直す(); // 60 秒の間隔と、ずれが無いことで書かない
  await 待つ(30);
  assert.equal(回数(), 1, '2 度目は書かない');
});

test('取りこぼし：同期で雲から読んだあと、自動で直る（団体の管理者が開くだけで直る）', async () => {
  const { store, 雲 } = ストアを用意する();
  await 待つ(30);
  雲.置く(名簿の道, 'mem-1', 林());
  雲.置く(名簿の道, 'mem-2', 部員({ id: 'mem-2', name: '山田 花子' }));
  雲.置く(記録の道, 's1', 古い名前の記録('s1'));
  store.setState({ activeGroupId: 団体, activeRole: 'group', isHydrated: true, isNetworkOnline: true, isLiveActive: false, members: [], alumni: [], sessions: [], trash: [], permanentlyDeleted: {}, lastSyncTime: null });
  await store.getState().syncSessions();
  assert.equal(store.getState().sessions.find((s) => s.id === 's1').archers[0].name, '叡智な林 飛雄', '同期の直後は、雲のまま（前の名前）');
  await 待つ(2600); // 同期のあとの 2 秒の待ちを通す
  assert.equal(雲.値(記録の道, 's1').archers[0].name, '林 飛雄', '雲が直る');
  assert.equal(store.getState().sessions.find((s) => s.id === 's1').archers[0].name, '林 飛雄', '手元も直る');
});
