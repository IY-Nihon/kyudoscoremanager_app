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
  const { store, 雲, 保存領域, 知らせ } = ストアを用意する();
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
  return { store, 雲, 保存領域, 知らせ };
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
// 保存
// ──────────────────────────────────────────────────────────────
/** 記録画面で射手を並べた状態にする */
function 射手を置く(store, 人数 = 2) {
  const 射手 = [];
  for (let i = 1; i <= 人数; i++)
    射手.push({ id: 'arc-' + i, name: '射手' + i, marks: ['○', '×', '○', '○'] });
  store.setState({ archers: 射手, activeSessionID: null, shotsPerRound: 4 });
  return 射手;
}
const 新しい記録 = (store, 既存) =>
  store.getState().sessions.find((s) => s && !既存.includes(s.id));

test('保存：手元に入り、届いたら「同期済み」になる', async () => {
  const { store, 雲 } = 用意();
  const 既存 = store.getState().sessions.map((s) => s.id);
  射手を置く(store);
  await store.getState().saveSession('新しい練習', 'メモ', true, ['#的前'], null);
  await 待つ(50);
  const s = 新しい記録(store, 既存);
  assert.ok(s, '履歴に入る');
  assert.equal(s.title, '新しい練習');
  assert.equal(s.archers.length, 2, '射手が入る');
  assert.equal(s.syncStatus, '同期済み');
  assert.ok(雲.値(記録の道, s.id), 'クラウドにも届く');
});

test('保存：射手と編集中の記録が片付く', async () => {
  const { store } = 用意();
  射手を置く(store);
  await store.getState().saveSession('練習', '', true, [], null);
  await 待つ(50);
  assert.deepEqual(store.getState().archers, [], '記録表が空になる');
  assert.equal(store.getState().activeSessionID, null);
});

test('保存：通信できないときは「未同期」で手元に残る', async () => {
  // 道場で起きたのと同じ場面。ここで記録が消えると取り返しがつかない。
  const { store, 雲 } = 用意();
  const 既存 = store.getState().sessions.map((s) => s.id);
  雲.状態.オフライン = true;
  射手を置く(store, 3);
  await store.getState().saveSession('道場の練習', '', true, [], null);
  await 待つ(50);
  const s = 新しい記録(store, 既存);
  assert.ok(s, '手元には残る');
  assert.equal(s.archers.length, 3, '射手が消えない');
  assert.equal(s.syncStatus, '未同期');
});

test('保存：送信が失われても、次の同期で送り直される', async () => {
  const { store, 雲 } = 用意();
  const 既存 = store.getState().sessions.map((s) => s.id);
  雲.状態.オフライン = true;
  射手を置く(store, 3);
  await store.getState().saveSession('道場の練習', '', true, [], null);
  await 待つ(50);
  const id = 新しい記録(store, 既存).id;
  // 送信待ちが失われた＝クラウドには届いていない
  雲.状態.オフライン = false;
  雲.消す(記録の道, id);

  await store.getState().syncSessions();
  await 待つ(50);
  assert.ok(雲.値(記録の道, id), 'クラウドへ届く');
  assert.equal(雲.値(記録の道, id).archers.length, 3, '射手も届く');
});

test('保存：部員は既にある記録を上書きできない', async () => {
  // 部員の端末が、団体の保存した記録を丸ごと差し替えてしまわないための守り
  const { store, 雲, 知らせ } = 用意();
  射手を置く(store, 1); // 先に射手を置く（この中で編集中の記録が外れる）
  store.setState({ activeRole: 'member', activeSessionID: 'ses-1' });
  const 元 = 雲.値(記録の道, 'ses-1').title;
  const 記録数 = store.getState().sessions.length;
  await store.getState().saveSession('部員が上書き', '', true, [], null);
  await 待つ(50);
  assert.equal(雲.値(記録の道, 'ses-1').title, 元, 'クラウドが変わらない');
  assert.equal(store.getState().sessions.length, 記録数, '手元にも増えない');
  assert.ok(
    知らせ.some((m) => m.includes('個人モードからは更新できません')),
    '理由が画面に出る'
  );
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
// ゴミ箱のリスナー
// ──────────────────────────────────────────────────────────────
test('ゴミ箱のリスナー：まだ送れていない削除を消さない', async () => {
  // 消してしまうと送り直しの対象から外れ、次の取得で記録が復活する
  const { store, 雲 } = 用意();
  await store.getState().listenToTrash();
  await 待つ(50);
  雲.状態.オフライン = true;
  store.getState().deleteSession('ses-2');
  await 待つ(100);
  // クラウド側には届いていない状態でリスナーが動く
  雲.消す(ゴミ箱の道, 'ses-2');
  雲.通知();
  await 待つ(50);
  const t = ゴミ箱を見る(store, 'ses-2');
  assert.ok(t, 'ゴミ箱に残る');
  assert.equal(t.pendingDelete, true, '手元で捨てた印も保たれる');
});

test('ゴミ箱のリスナー：戻したばかりの記録を履歴から外さない', async () => {
  // クラウドのゴミ箱に写しが残っていても、戻した操作を打ち消してはいけない
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  await store.getState().listenToTrash();
  await 待つ(50);
  雲.状態.オフライン = true;
  store.getState().restoreSession('ses-2');
  await 待つ(100);
  雲.置く(ゴミ箱の道, 'ses-2', { id: 'ses-2', title: '練習2', lastModified: 1 });
  雲.通知();
  await 待つ(50);
  assert.ok(記録を見る(store, 'ses-2'), '履歴に残る');
});

test('ゴミ箱のリスナー：完全に消したものは出さない', async () => {
  const { store, 雲 } = 用意();
  await store.getState().deleteSession('ses-2');
  await 待つ(50);
  await store.getState().emptyTrash();
  await 待つ(50);
  await store.getState().listenToTrash();
  await 待つ(50);
  // 他の端末の都合でクラウドのゴミ箱に写しが現れても出さない
  雲.置く(ゴミ箱の道, 'ses-2', { id: 'ses-2', title: '練習2', lastModified: Date.now() });
  雲.通知();
  await 待つ(50);
  assert.equal(ゴミ箱を見る(store, 'ses-2'), undefined, 'ゴミ箱に出さない');
  assert.equal(記録を見る(store, 'ses-2'), undefined, '履歴にも出さない');
});

test('ゴミ箱のリスナー：クラウドで捨てられた記録は履歴から外す', async () => {
  // 上の守りが効きすぎて、他の端末の削除が届かなくなっていないか
  const { store, 雲 } = 用意();
  await store.getState().listenToTrash();
  await 待つ(50);
  雲.置く(ゴミ箱の道, 'ses-3', { id: 'ses-3', title: '練習3', lastModified: Date.now() });
  雲.通知();
  await 待つ(50);
  assert.ok(ゴミ箱を見る(store, 'ses-3'), 'ゴミ箱に入る');
  assert.equal(記録を見る(store, 'ses-3'), undefined, '履歴から外れる');
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
// 逆引き表（個人ID → 部員）
//
// セキュリティルールがこの表を直接引いて所属を確かめる。名簿と食い違うと
// 部員がログインできなくなるので、ここは崩せない。
// ──────────────────────────────────────────────────────────────
const 逆引きの道 = `groups/${団体}/member_lookup`;

test('逆引き表：名簿に足した人が載る', async () => {
  const { store, 雲 } = 用意();
  store.setState({
    members: [{ id: 'mem-1', name: '部員1', personalId: '1234', lastModified: 1 }],
  });
  await store.getState().syncMemberLookup();
  await 待つ(50);
  assert.deepEqual(雲.中身(逆引きの道), ['1234']);
  assert.equal(雲.値(逆引きの道, '1234').memberId, 'mem-1');
});

test('逆引き表：名簿から消えた人は表からも消える', async () => {
  const { store, 雲 } = 用意();
  雲.置く(逆引きの道, '9999', { memberId: 'mem-退部', updatedAt: 1 });
  store.setState({
    members: [{ id: 'mem-1', name: '部員1', personalId: '1234', lastModified: 1 }],
  });
  await store.getState().syncMemberLookup();
  await 待つ(50);
  assert.deepEqual(雲.中身(逆引きの道), ['1234'], '退部した人の分は残さない');
});

test('逆引き表：4桁でない個人IDは載せない', async () => {
  const { store, 雲 } = 用意();
  // 起動時に走る個人IDの自動採番を先に済ませてから確かめる
  // （そうしないと、4桁でない人にIDが振られてしまい、この検査の対象が消える）
  await 待つ(50);
  store.setState({
    members: [
      { id: 'mem-1', name: '部員1', personalId: '12', lastModified: 1 },
      { id: 'mem-2', name: '部員2', personalId: '', lastModified: 1 },
      { id: 'mem-3', name: '部員3', personalId: '5678', lastModified: 1 },
    ],
  });
  await store.getState().syncMemberLookup();
  await 待つ(50);
  assert.deepEqual(雲.中身(逆引きの道), ['5678']);
});

test('逆引き表：部員ロールでは書き込まない', async () => {
  // 部員の端末は名簿を書けない。試みるとルールに拒否される
  const { store, 雲 } = 用意();
  store.setState({
    activeRole: 'member',
    members: [{ id: 'mem-1', name: '部員1', personalId: '1234', lastModified: 1 }],
  });
  await store.getState().syncMemberLookup();
  await 待つ(50);
  assert.deepEqual(雲.中身(逆引きの道), []);
});

test('個人ID：持っていない人に4桁で重複しないIDを振る', async () => {
  const { store, 雲 } = 用意();
  const 名簿 = [
    { id: 'mem-1', name: '部員1', personalId: '1234', lastModified: 1 },
    { id: 'mem-2', name: '部員2', personalId: '', lastModified: 1 },
    { id: 'mem-3', name: '部員3', personalId: 'あ', lastModified: 1 },
  ];
  名簿.forEach((m) => 雲.置く(メンバーの道, m.id, Object.assign({}, m)));
  store.setState({ members: 名簿.map((m) => Object.assign({}, m)), alumni: [] });
  await store.getState().ensurePersonalIds();
  await 待つ(50);
  const 一覧 = store.getState().members.map((m) => m.personalId);
  assert.equal(一覧[0], '1234', '持っている人は変えない');
  一覧.forEach((id) => assert.match(id, /^\d{4}$/, '全員4桁になる'));
  assert.equal(new Set(一覧).size, 3, '重複しない');
});

// ──────────────────────────────────────────────────────────────
// 進級・卒業
//
// 4月1日に一度だけ動く処理。手で確かめるには時計を巻き戻すしかなく、
// 間違えると名簿全員に影響する。分岐も多いので、ここは厚めに見る。
// ──────────────────────────────────────────────────────────────
const 設定の道 = `groups/${団体}/config`;

/** 学年つきの名簿をクラウドと手元に置く */
function 名簿を置く(store, 雲, 学年一覧) {
  const 名簿 = 学年一覧.map((g, i) => ({
    id: 'mem-' + (i + 1),
    name: '部員' + (i + 1),
    grade: g,
    personalId: String(1000 + i),
    lastModified: 1,
    syncStatus: '同期済み',
  }));
  名簿.forEach((m) => 雲.置く(メンバーの道, m.id, Object.assign({}, m)));
  store.setState({ members: 名簿.map((m) => Object.assign({}, m)), currentFreshmanTerm: 50 });
  return 名簿;
}
const 学年 = (雲, id) => 雲.値(メンバーの道, id).grade;

test('進級：1〜3年は1つ上がる', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [1, 2, 3]);
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 2);
  assert.equal(学年(雲, 'mem-2'), 3);
  assert.equal(学年(雲, 'mem-3'), 4);
});

test('進級：4年は卒業生（5）になる', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [4]);
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 5);
});

test('進級：卒業済み（5）は据え置き', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [5]);
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 5, '6年生を作らない');
});

test('進級：学年0（その他）は据え置き', async () => {
  // 「その他」は現役扱いだが進級も卒業もしない、という仕様
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [0]);
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 0);
});

test('進級：学年が空や数値でないものは据え置き', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [null, '', 'ふりがな']);
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), null);
  assert.equal(学年(雲, 'mem-2'), '');
  assert.equal(学年(雲, 'mem-3'), 'ふりがな', '勝手に1年にしない');
});

test('進級：現在の期が1つ進む', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [1]);
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(雲.値(設定の道, 'app_settings').currentFreshmanTerm, 51);
});

test('進級：通信できないときは何もしない', async () => {
  // 途中まで進んで名簿が壊れるより、次につながったときにやり直すほうがよい。
  // 手元だけ進級してクラウドが元のままだと、端末ごとに学年が食い違う。
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [1, 2]);
  const 期 = store.getState().currentFreshmanTerm;
  store.setState({ isNetworkOnline: false });
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 1, 'クラウドの学年が動かない');
  assert.equal(学年(雲, 'mem-2'), 2);
  const 手元 = store.getState().members;
  assert.equal(手元.find((m) => m.id === 'mem-1').grade, 1, '手元の学年も動かない');
  assert.equal(手元.find((m) => m.id === 'mem-2').grade, 2);
  assert.equal(store.getState().currentFreshmanTerm, 期, '現在の期も動かない');
});

test('進級：同じ年に二度は動かない', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [1]);
  雲.置く(設定の道, 'app_settings', { lastPromotionYear: new Date().getFullYear() });
  await store.getState().incrementAllGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 1, '二重に上がらない');
});

test('自動進級：記録が無いときは基準年を控えるだけで進級しない', async () => {
  // これが無いと、初めて使う団体がいきなり全員進級してしまう
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [1, 2]);
  await store.getState().checkAndAutoIncrementGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 1, '進級しない');
  assert.ok(
    雲.値(設定の道, 'app_settings') && 雲.値(設定の道, 'app_settings').lastPromotionYear,
    '基準年だけ控える'
  );
});

test('自動進級：4月より前は動かない', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [1]);
  const 今年 = new Date().getFullYear();
  // 去年の記録があり、まだ4月を迎えていない状態にする
  雲.置く(設定の道, 'app_settings', { lastPromotionYear: 今年 - 1, autoPromotionEnabled: true });
  store.setState({ lastPromotionYear: 今年 - 1, autoPromotionEnabled: true });
  const 四月以降 = new Date().getMonth() + 1 >= 4;
  await store.getState().checkAndAutoIncrementGrades();
  await 待つ(50);
  if (四月以降) assert.equal(学年(雲, 'mem-1'), 2, '4月以降なら進級する');
  else assert.equal(学年(雲, 'mem-1'), 1, '4月より前なら進級しない');
});

test('自動進級：切っていれば動かない', async () => {
  const { store, 雲 } = 用意();
  名簿を置く(store, 雲, [1]);
  const 今年 = new Date().getFullYear();
  雲.置く(設定の道, 'app_settings', { lastPromotionYear: 今年 - 1, autoPromotionEnabled: false });
  store.setState({ lastPromotionYear: 今年 - 1, autoPromotionEnabled: false });
  await store.getState().checkAndAutoIncrementGrades();
  await 待つ(50);
  assert.equal(学年(雲, 'mem-1'), 1);
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
