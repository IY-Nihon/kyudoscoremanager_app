/**
 * ストアの同期まわりの振る舞いの検査。
 *
 *   npm test
 *
 * これまで検証環境のブラウザで手作業に近い形で確かめていたことを、
 * 通信なしで回せるようにしたもの。偽の Firestore を相手にする
 * （test/helpers/storeHarness.js）。
 *
 * 守りたいのは次の一点に尽きる。
 *   「送信が済むまで手元では『未同期』のままにし、その間はクラウドの
 *    古い写しで上書きしない。送信が失われたら送り直す」
 * これが崩れると、電波の無い場所で取った記録や編集が黙って消える。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const 記録の道 = `groups/${団体}/sessions`;
const ゴミ箱の道 = `groups/${団体}/trash`;

/** 団体としてログインし、記録を n 件置いた状態から始める */
function 用意(件数 = 3) {
  const { store, 雲, 保存領域 } = ストアを用意する();
  const 今 = Date.now();
  const 記録 = [];
  for (let i = 1; i <= 件数; i++) {
    const s = {
      id: 'ses-' + i,
      title: '練習' + i,
      date: 今 - i * 86400000,
      lastModified: 今 - i * 86400000,
      syncStatus: '同期済み',
      archers: [{ id: 'a' + i, name: '射手' + i, marks: ['○', '×'] }],
    };
    記録.push(s);
    雲.置く(記録の道, s.id, Object.assign({}, s));
  }
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    sessions: 記録.map((s) => Object.assign({}, s)),
    trash: [],
    permanentlyDeleted: {},
    lastSyncTime: null,
  });
  return { store, 雲, 保存領域 };
}

const 記録を見る = (store, id) => store.getState().sessions.find((s) => s && s.id === id);
const ゴミ箱を見る = (store, id) => store.getState().trash.find((s) => s && s.id === id);

// ──────────────────────────────────────────────────────────────
// 編集
// ──────────────────────────────────────────────────────────────
test('編集：送信が済むまでは「未同期」、届いたら「同期済み」', async () => {
  const { store, 雲 } = 用意();
  await store.getState().updateSession('ses-1', { title: '編集後' });
  assert.equal(記録を見る(store, 'ses-1').syncStatus, '未同期', '編集した直後は未同期');
  await 待つ(900); // 送信は 800ms 待ってから
  assert.equal(記録を見る(store, 'ses-1').syncStatus, '同期済み');
  assert.equal(雲.値(記録の道, 'ses-1').title, '編集後', 'クラウドにも届く');
});

test('編集：通信できないときは「未同期」のまま残る', async () => {
  const { store, 雲 } = 用意();
  雲.状態.オフライン = true;
  await store.getState().updateSession('ses-1', { title: 'オフ編集' });
  await 待つ(900);
  assert.equal(記録を見る(store, 'ses-1').syncStatus, '未同期');
  assert.equal(記録を見る(store, 'ses-1').title, 'オフ編集', '手元には残る');
});

test('編集：送信中にもう一度編集したら、新しい内容に印を付けない', async () => {
  // ここが崩れると、まだ届いていない内容が同期済みに見え、
  // 次の突き合わせでクラウドの古い写しに負けて編集が消える。
  // 送信に時間がかかる状態にしないと、この場面は作れない。
  const { store, 雲 } = 用意();
  雲.状態.遅延 = 400;
  await store.getState().updateSession('ses-1', { title: 'A版' });
  await 待つ(850); // 1回目の送信が飛んだ直後（まだ決着していない）
  await store.getState().updateSession('ses-1', { title: 'B版' });
  // A版の送信は 800+400=1200ms で決着する。B版の送信は 1650ms。
  // その間（決着したが、まだB版を送っていない時点）で確かめる。
  await 待つ(500);
  assert.equal(雲.値(記録の道, 'ses-1').title, 'A版', 'クラウドにはA版だけ届いている');
  assert.equal(記録を見る(store, 'ses-1').title, 'B版');
  assert.equal(
    記録を見る(store, 'ses-1').syncStatus,
    '未同期',
    'A版の送信が戻っても、B版に印を付けてはいけない'
  );
  await 待つ(1200); // B版の送信も決着する
  assert.equal(記録を見る(store, 'ses-1').syncStatus, '同期済み', 'B版が届いたら付く');
  assert.equal(雲.値(記録の道, 'ses-1').title, 'B版');
});

test('リスナー：送信前の編集をクラウドの写しで上書きしない', async () => {
  // 実際に起きた筋書き。オフラインで編集したあと、他の人が別の記録を
  // 保存するとリスナーが動き、そのはずみで編集が消えていた。
  const { store, 雲 } = 用意();
  await store.getState().listenToSessions();
  await 待つ(50);
  雲.状態.オフライン = true;
  await store.getState().updateSession('ses-1', { title: '道場で直した' });
  await 待つ(900);
  雲.状態.オフライン = false;
  // 他の人が別の記録を保存した＝リスナーが動く
  雲.置く(記録の道, 'ses-3', { id: 'ses-3', title: '誰かの保存', lastModified: Date.now() });
  雲.通知();
  await 待つ(100);
  assert.equal(記録を見る(store, 'ses-1').title, '道場で直した', '編集が消えない');
  assert.equal(記録を見る(store, 'ses-1').syncStatus, '未同期');
});

test('リスナー：送信が済んだ記録はクラウドの写しで更新される', async () => {
  // 上の守りが効きすぎて、他の端末の編集が届かなくなっていないか
  const { store, 雲 } = 用意();
  await store.getState().listenToSessions();
  await 待つ(50);
  雲.置く(記録の道, 'ses-1', { id: 'ses-1', title: '他の端末が直した', lastModified: Date.now() });
  雲.通知();
  await 待つ(100);
  assert.equal(記録を見る(store, 'ses-1').title, '他の端末が直した');
});

// ──────────────────────────────────────────────────────────────
// 削除と復元
// ──────────────────────────────────────────────────────────────
test('削除：ゴミ箱へ移り、クラウドにも反映される', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  assert.equal(記録を見る(store, 'ses-2'), undefined, '履歴から消える');
  assert.ok(ゴミ箱を見る(store, 'ses-2'), 'ゴミ箱に入る');
  assert.deepEqual(雲.中身(記録の道), ['ses-1', 'ses-3']);
  assert.deepEqual(雲.中身(ゴミ箱の道), ['ses-2']);
});

test('削除：通信できないときは「未同期」と「手元で捨てた印」が残る', async () => {
  const { store, 雲 } = 用意();
  雲.状態.オフライン = true;
  store.getState().deleteSession('ses-2');
  await 待つ(50);
  const t = ゴミ箱を見る(store, 'ses-2');
  assert.equal(t.syncStatus, '未同期');
  assert.equal(t.pendingDelete, true, '送り直しの目印が要る');
});

test('削除：送信が失われても、次の同期で送り直される', async () => {
  // 道場で実際に起きたのと同じ筋書き。
  // 通信できないあいだに削除し、送信待ちごと失われた状態を作る。
  const { store, 雲 } = 用意();
  雲.状態.オフライン = true;
  store.getState().deleteSession('ses-2');
  await 待つ(50);
  // 送信待ちが失われた＝クラウドには何も届いていない
  雲.状態.オフライン = false;
  雲.置く(記録の道, 'ses-2', { id: 'ses-2', title: '練習2', lastModified: 1 });
  雲.消す(ゴミ箱の道, 'ses-2');

  await store.getState().syncSessions();
  await 待つ(50);
  assert.deepEqual(雲.中身(記録の道), ['ses-1', 'ses-3'], '記録から消し直される');
  assert.deepEqual(雲.中身(ゴミ箱の道), ['ses-2'], 'ゴミ箱へ入れ直される');
});

test('復元：ゴミ箱から戻り、クラウドにも反映される', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  await store.getState().restoreSession('ses-2');
  await 待つ(50);
  assert.ok(記録を見る(store, 'ses-2'), '履歴へ戻る');
  assert.equal(ゴミ箱を見る(store, 'ses-2'), undefined);
  assert.deepEqual(雲.中身(記録の道), ['ses-1', 'ses-2', 'ses-3']);
  assert.deepEqual(雲.中身(ゴミ箱の道), []);
});

test('復元：戻した記録は送信が済むまで「未同期」', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  雲.状態.オフライン = true;
  store.getState().restoreSession('ses-2');
  await 待つ(50);
  assert.equal(記録を見る(store, 'ses-2').syncStatus, '未同期');
});

test('復元：まとめて戻しても、通信できないときに途中で止まらない', async () => {
  // 以前は画面が1件ずつ待っていたため、オフラインだと1件目で止まっていた
  const { store, 雲 } = 用意();
  await store.getState().deleteMultipleSessions(['ses-1', 'ses-2', 'ses-3']);
  await 待つ(50);
  雲.状態.オフライン = true;
  const 開始 = Date.now();
  await store.getState().restoreTrashItems(['ses-1', 'ses-2', 'ses-3']);
  assert.ok(Date.now() - 開始 < 500, 'すぐ戻る');
  assert.equal(store.getState().sessions.length, 3, '3件とも戻る');
  assert.equal(store.getState().trash.length, 0);
});

// ──────────────────────────────────────────────────────────────
// 完全削除
// ──────────────────────────────────────────────────────────────
test('完全削除：控えに積まれ、クラウドからも消える', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  await store.getState().emptyTrash();
  await 待つ(50);
  assert.equal(store.getState().trash.length, 0);
  assert.deepEqual(雲.中身(ゴミ箱の道), []);
  assert.ok(store.getState().permanentlyDeleted['ses-2'], '控えに残る');
});

test('完全削除：送信が失われても、消したものが戻ってこない', async () => {
  // 「オフラインで削除 → ゴミ箱を空にする」で送信待ちが失われた筋書き。
  // 控えが無いと、次の全件取得で記録が復活していた。
  const { store, 雲 } = 用意();
  雲.状態.オフライン = true;
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  await store.getState().emptyTrash();
  await 待つ(50);
  // 送信待ちが失われた＝クラウドには記録が残ったまま
  雲.状態.オフライン = false;
  雲.置く(記録の道, 'ses-2', { id: 'ses-2', title: '練習2', lastModified: 1 });
  雲.消す(ゴミ箱の道, 'ses-2');

  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);
  assert.equal(記録を見る(store, 'ses-2'), undefined, '画面に戻ってこない');
  assert.deepEqual(雲.中身(記録の道), ['ses-1', 'ses-3'], 'クラウドからも消し直される');
});

test('完全削除：消し終われば控えは片付く（増え続けない）', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  await store.getState().emptyTrash();
  await 待つ(50);
  assert.equal(Object.keys(store.getState().permanentlyDeleted).length, 1);
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);
  assert.equal(Object.keys(store.getState().permanentlyDeleted).length, 0, 'クラウドに無ければ手放す');
});

test('完全削除：ゴミ箱から戻したら控えから外れる', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  await store.getState().deleteTrashItems(['ses-2']);
  await 待つ(50);
  assert.ok(store.getState().permanentlyDeleted['ses-2']);
  // 別の端末が戻した想定でゴミ箱へ戻し、こちらで復元する
  store.setState({ trash: [{ id: 'ses-2', title: '練習2', date: 1, archers: [] }] });
  await store.getState().restoreSession('ses-2');
  await 待つ(50);
  assert.equal(store.getState().permanentlyDeleted['ses-2'], undefined, '控えから外れる');
  assert.ok(記録を見る(store, 'ses-2'), '戻した記録が消えない');
});

// ──────────────────────────────────────────────────────────────
// メンバー
// ──────────────────────────────────────────────────────────────
const メンバーの道 = `groups/${団体}/members`;

/** 名簿を1件持った状態を足す */
function メンバーを置く(store, 雲) {
  const m = {
    id: 'mem-1',
    name: '部員1',
    gender: '男子',
    grade: 2,
    personalId: '1234',
    lastModified: Date.now() - 86400000,
    syncStatus: '同期済み',
  };
  雲.置く(メンバーの道, m.id, Object.assign({}, m));
  store.setState({ members: [Object.assign({}, m)] });
  return m;
}
const メンバーを見る = (store, id) => store.getState().members.find((m) => m && m.id === id);

test('メンバー：変更が届いたら「同期済み」に戻る', async () => {
  const { store, 雲 } = 用意();
  メンバーを置く(store, 雲);
  store.getState().updateMember('mem-1', { name: '改名' });
  await 待つ(400); // 送信は 300ms 待ってから
  assert.equal(メンバーを見る(store, 'mem-1').syncStatus, '同期済み');
  assert.equal(雲.値(メンバーの道, 'mem-1').name, '改名');
});

test('メンバー：送信中にもう一度変えたら、新しい内容に印を付けない', async () => {
  // 記録側と同じ守り。ここが崩れると、まだ届いていない氏名が同期済みに見え、
  // 次の突き合わせでクラウドの古い写しに負けて変更が消える。
  const { store, 雲 } = 用意();
  メンバーを置く(store, 雲);
  雲.状態.遅延 = 400;
  store.getState().updateMember('mem-1', { name: 'K版' });
  await 待つ(350); // 1回目の送信が飛んだ直後
  store.getState().updateMember('mem-1', { name: 'L版' });
  // K版の送信は 300+400=700ms で決着。L版の送信は 350+300=650ms に出て
  // 1050ms で決着する。その間で確かめる。
  await 待つ(420);
  assert.equal(雲.値(メンバーの道, 'mem-1').name, 'K版', 'クラウドにはK版だけ届いている');
  assert.equal(メンバーを見る(store, 'mem-1').name, 'L版');
  assert.equal(メンバーを見る(store, 'mem-1').syncStatus, '未同期', 'L版に印を付けてはいけない');
  await 待つ(800);
  assert.equal(メンバーを見る(store, 'mem-1').syncStatus, '同期済み');
  assert.equal(雲.値(メンバーの道, 'mem-1').name, 'L版');
});

test('メンバー：送信が失われても、次の同期で送り直される', async () => {
  const { store, 雲 } = 用意();
  const m = メンバーを置く(store, 雲);
  雲.状態.オフライン = true;
  store.getState().updateMember('mem-1', { name: 'オフ改名' });
  await 待つ(400);
  assert.equal(メンバーを見る(store, 'mem-1').syncStatus, '未同期');
  // 送信待ちが失われた＝クラウドには届いていない
  雲.状態.オフライン = false;
  雲.置く(メンバーの道, 'mem-1', Object.assign({}, m));
  await store.getState().syncSessions();
  await 待つ(50);
  assert.equal(雲.値(メンバーの道, 'mem-1').name, 'オフ改名', 'クラウドへ届く');
  assert.equal(メンバーを見る(store, 'mem-1').syncStatus, '同期済み');
});

// ──────────────────────────────────────────────────────────────
// 突き合わせ
// ──────────────────────────────────────────────────────────────
test('全件取得：ゴミ箱にあるものを履歴に出さない', async () => {
  // 削除の送信が途中で終わると、クラウドの記録とゴミ箱の両方に同じものが
  // 残る。このとき履歴に出してしまうと、消したはずの記録が復活して見える。
  const { store, 雲 } = 用意();
  雲.置く(ゴミ箱の道, 'ses-2', { id: 'ses-2', title: '練習2', lastModified: Date.now() });
  assert.ok(雲.中身(記録の道).includes('ses-2'), '記録側にも残っている状態を作る');
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);
  assert.equal(記録を見る(store, 'ses-2'), undefined, '履歴に出さない');
  assert.ok(ゴミ箱を見る(store, 'ses-2'), 'ゴミ箱には出す');
});

test('全件取得：送信前の編集をクラウドの古い写しで上書きしない', async () => {
  const { store, 雲 } = 用意();
  雲.状態.オフライン = true;
  await store.getState().updateSession('ses-1', { title: '手元の編集' });
  await 待つ(900);
  雲.状態.オフライン = false; // 送信は失われたまま
  await store.getState().fetchAndOverwriteFromCloud();
  await 待つ(50);
  assert.equal(記録を見る(store, 'ses-1').title, '手元の編集', '編集が消えない');
});

test('同期：送信できていない記録を送り直す', async () => {
  const { store, 雲 } = 用意();
  雲.状態.オフライン = true;
  await store.getState().updateSession('ses-1', { title: '未送信' });
  await 待つ(900);
  雲.状態.オフライン = false;
  await store.getState().syncSessions();
  await 待つ(50);
  assert.equal(雲.値(記録の道, 'ses-1').title, '未送信', 'クラウドへ届く');
  assert.equal(記録を見る(store, 'ses-1').syncStatus, '同期済み');
});
