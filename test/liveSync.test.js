/**
 * ライブ記録（Realtime Database）の検査。
 *
 *   npm test
 *
 * 偽の RTDB を相手に、端末を2台まで作って動かす。これまでライブ同期は
 * 検査が1件も無く、偽物も空実装だったため一度も確かめられていなかった。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

const 団体 = '100001';
const ライブ名 = '朝練';
const 道 = `live_sessions/${団体}/${ライブ名}/state`;
const 本数 = 4;

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

function 端末(既存のライブ, 射手たち) {
  const { store, ライブ } = ストアを用意する(undefined, 既存のライブ);
  store.setState({
    activeGroupId: 団体,
    activeRole: 'group',
    isHydrated: true,
    isNetworkOnline: true,
    members: [],
    alumni: [],
    sessions: [],
    trash: [],
    permanentlyDeleted: {},
    archers: 射手たち || [],
    shotsPerRound: 本数,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    lastPushedTimestamp: 0,
    lastResetHandled: 0,
    historyStack: [],
    redoStack: [],
  });
  return { store, ライブ };
}

const 手元の射手 = (store, id = 'a1') => store.getState().archers.find((a) => a.id === id);

// ──────────────────────────────────────────────────────────────
test('開始：同名が無ければ開始できる', async () => {
  const { store, ライブ } = 端末(null, [射手()]);
  assert.equal(await store.getState().startLiveSync(ライブ名), '開始した');
  assert.equal(store.getState().isLiveActive, true);
  assert.ok(ライブ.値(道), 'RTDB に載っている');
});

test('開始：同名があれば開始しない', async () => {
  const { store, ライブ } = 端末(null, [射手()]);
  ライブ.置く(`live_sessions/${団体}/${ライブ名}/state`, { status: 'active', timestamp: 1 });
  assert.equal(await store.getState().startLiveSync(ライブ名), '同名あり');
  assert.equal(store.getState().isLiveActive, false);
});

test('開始：確かめられなければ開始しない（進行中のライブを潰さない）', async () => {
  // 元は確認が例外で失敗しても、そのまま作成へ進んで同名のライブを上書きしていた
  const { store, ライブ } = 端末(null, [射手()]);
  ライブ.置く(道, { status: 'active', timestamp: 1, archers: [射手({ marks: ['○', '', '', ''] })] });
  ライブ.状態.失敗させる = true;
  const 元の = ライブ.api.get;
  ライブ.api.get = async () => {
    throw new Error('偽の通信失敗');
  };
  assert.equal(await store.getState().startLiveSync(ライブ名), '確認できない');
  assert.equal(store.getState().isLiveActive, false, 'ライブを始めていない');
  assert.deepEqual(ライブ.値(道).archers[0].marks, ['○', '', '', ''], '進行中の内容が残っている');
  ライブ.api.get = 元の;
});

// ──────────────────────────────────────────────────────────────
test('矢所：主催者が置いた矢所が相手に届く', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().updateArrowLocation('a1', 1, { x: 12, y: 34 });
  await 待つ(10);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  assert.deepEqual(手元の射手(参.store).arrowLocations, [null, { x: 12, y: 34 }, null, null]);
});

test('矢所：相手が1本記録しても、手元の矢所が消えない', async () => {
  // 直す前は、送信の項目に矢所が無く受信側を土台にしていたため、
  // 誰かが1本入れるたびに参加者全員の矢所が消えていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  参.store.getState().updateArrowLocation('a1', 0, { x: 5, y: 5 });
  await 待つ(10);
  const 参の矢所 = 手元の射手(参.store).arrowLocations;
  assert.deepEqual(参の矢所, [{ x: 5, y: 5 }, null, null, null], '前提：矢所が入っている');

  主.store.getState().updateMark('a1', 3, '○');
  await 待つ(10);

  assert.deepEqual(手元の射手(参.store).arrowLocations, 参の矢所, '矢所が残っている');
  assert.equal(手元の射手(参.store).marks[3], '○', '○は届いている');
});

test('矢所：自分の送信の返りで、自分の矢所を消さない', async () => {
  // 主催者側にある「自分の送信の返りは見ない」判定が参加者側に無く、
  // 参加者は○を1つ入れるたびに自分の矢所を消していた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  参.store.getState().updateArrowLocation('a1', 2, { x: 7, y: 8 });
  await 待つ(10);
  参.store.getState().updateMark('a1', 0, '×');
  await 待つ(10);

  assert.deepEqual(手元の射手(参.store).arrowLocations, [null, null, { x: 7, y: 8 }, null]);
});

test('返り：自分の送信の返りで、まだ届いていない射手を消さない', async () => {
  // 統合後の一覧は受信側から作るので、自分の送信の返りを処理すると
  // 「送信が届いていない手元だけの射手」が落ちる。主催者側には元から
  // ある判定で、参加者側だけ抜けていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);
  assert.equal(参.store.getState().archers.length, 1);

  // 射手の追加が相手に届かなかった状態を作る
  主.ライブ.状態.失敗させる = true;
  参.store.getState().addArcher();
  await 待つ(10);
  主.ライブ.状態.失敗させる = false;
  assert.equal(参.store.getState().archers.length, 2, '手元には2人いる');

  // そのあと○を入れる。この送信は届き、返ってくる
  参.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);

  assert.equal(参.store.getState().archers.length, 2, '追加した射手が残っている');
});

test('矢所：受信に矢所が無い（古い版の相手）ときも手元を消さない', async () => {
  const { store, ライブ } = 端末(null, [射手({ arrowLocations: [{ x: 1, y: 1 }, null, null, null] })]);
  await store.getState().startLiveSync(ライブ名);
  await 待つ(10);

  // 古い版のアプリが送ってくる形（arrowLocations を持たない）を直に置く
  ライブ.置く(道, {
    status: 'active',
    timestamp: Date.now() + 1000,
    shotsPerRound: 本数,
    archers: [{ id: 'a1', name: '一人目', grade: 1, lastModified: Date.now() + 1000 }],
    marks_by_id: { a1: ['', '', '', '○'] },
    archer_timestamps: { a1: Date.now() + 1000 },
  });
  await 待つ(10);

  assert.deepEqual(手元の射手(store).arrowLocations, [{ x: 1, y: 1 }, null, null, null]);
  assert.equal(手元の射手(store).marks[3], '○', '相手の記録は受け取っている');
});

// ──────────────────────────────────────────────────────────────
test('○×：手元の入力が、次の更新で古い内容に戻らない', async () => {
  // 直す前は、手元が新しくても lastModified が受信側の古い値に巻き戻り、
  // 次の受信で「受信のほうが新しい」と誤判定されて消えていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  // 参加者が入力し、その直後に古い内容の更新が2回届く場面を作る
  参.store.getState().updateMark('a1', 0, '○');
  await 待つ(10);
  const 入れた日時 = 手元の射手(参.store).lastModified;

  for (let i = 0; i < 2; i++) {
    主.ライブ.置く(道, {
      status: 'active',
      timestamp: Date.now() + i,
      shotsPerRound: 本数,
      archers: [射手({ lastModified: 入れた日時 - 500 })],
      marks_by_id: { a1: ['', '', '', ''] },
      archer_timestamps: { a1: 入れた日時 - 500 },
    });
    await 待つ(5);
  }

  assert.equal(手元の射手(参.store).marks[0], '○', '入力が残っている');
  assert.equal(手元の射手(参.store).lastModified, 入れた日時, '日時が巻き戻っていない');
});

test('抜ける：主催者と参加者で分けず、どちらが抜けてもライブは残る', async () => {
  // 仕様。抜けるのは手元だけで、残った人はそのまま続けられる。
  // ライブを終わらせるのは「終了・保存」か、参加一覧から消したときだけ
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(参.store.getState().isLiveActive, true, '前提：参加できている');

  // 参加者が抜けても残る
  参.store.getState().stopLiveSync();
  await 待つ(20);
  assert.equal(主.store.getState().isLiveActive, true, '主催者は続いている');
  assert.notEqual(主.ライブ.値(道), null, '節点も残っている');

  // 主催者が抜けても残る
  主.store.getState().stopLiveSync();
  await 待つ(20);
  assert.equal(主.store.getState().isLiveActive, false, '抜けたのは手元だけ');
  assert.notEqual(主.ライブ.値(道), null, 'ライブは終わらせない');
  assert.notEqual(主.ライブ.値(道).status, 'finished', '終了扱いにもしない');
});

// ──────────────────────────────────────────────────────────────
const 日 = 24 * 60 * 60 * 1000;

test('共有履歴はライブの枝の外に置く（一覧の取得に付いてこない）', async () => {
  // 中に置くと、参加一覧が live_sessions/{団体} を丸ごと読むときに履歴まで
  // 降りてくる。実測で 47KB のうち 43KB が履歴だった
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);

  assert.equal(主.store.getState().historySharedLen, 1, '前提：1手ぶん積まれている');
  assert.notEqual(主.ライブ.値(`live_history/${団体}/${ライブ名}/0`), null, '外の枝に入っている');
  assert.equal(主.ライブ.値(`live_sessions/${団体}/${ライブ名}/history`), null, '中には入っていない');

  // 取り消しは外の枝から読めている
  主.store.getState().undo();
  await 待つ(20);
  assert.equal(主.store.getState().archers[0].marks[0], '', '取り消しは効く');
});

test('片付け：ライブを消すと、外に置いた共有履歴も消える', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  assert.notEqual(主.ライブ.値(`live_history/${団体}/${ライブ名}/0`), null, '前提：履歴がある');

  await 主.store.getState().deleteLiveSession(ライブ名);
  await 待つ(20);

  assert.equal(主.ライブ.値(`live_sessions/${団体}/${ライブ名}`), null, 'ライブが消える');
  assert.equal(主.ライブ.値(`live_history/${団体}/${ライブ名}`), null, '履歴も消える');
});

test('一覧：最終更新から14日を過ぎたライブは出さず、消す', async () => {
  // ライブはどちらが抜けても残る作りなので、放っておくと使われなくなった
  // ものが溜まり続ける
  const 端 = 端末();
  const いま = Date.now();
  端.ライブ.置く(`live_sessions/${団体}/先月の練習/state`, { status: 'active', timestamp: いま - 20 * 日 });
  端.ライブ.置く(`live_sessions/${団体}/今朝/state`, { status: 'active', timestamp: いま - 60000 });

  await 端.store.getState().fetchActiveLiveSessions();

  assert.deepEqual(端.store.getState().liveSessionsList, ['今朝'], '古いほうは出さない');
  assert.equal(端.ライブ.値(`live_sessions/${団体}/先月の練習`), null, '古いほうは消えている');
  assert.notEqual(端.ライブ.値(`live_sessions/${団体}/今朝`), null, '新しいほうは残す');
});

test('一覧：サーバーの時計に合わせられないときは、古くても消さない', async () => {
  // 時差が取れないと、判定は端末の時計に落ちる。時計が未来にずれた端末では
  // 全部が「14日超」に見える。消すと保存前の盤面ごと戻らないので、
  // 一覧から外すだけに留める（時計が合えば次の取得で戻ってくる）
  const 端 = 端末();
  端.ライブ.消す('.info/serverTimeOffset');
  const いま = Date.now();
  端.ライブ.置く(`live_sessions/${団体}/先月の練習/state`, {
    status: 'active',
    timestamp: いま - 20 * 日,
  });
  端.ライブ.置く(`live_history/${団体}/先月の練習/0`, { at: いま - 20 * 日 });

  await 端.store.getState().fetchActiveLiveSessions();

  assert.deepEqual(端.store.getState().liveSessionsList, [], '古いものは一覧に出さない');
  assert.notEqual(
    端.ライブ.値(`live_sessions/${団体}/先月の練習`),
    null,
    '時計が合っていないのに消してしまった'
  );
  assert.notEqual(
    端.ライブ.値(`live_history/${団体}/先月の練習`),
    null,
    '共有履歴まで消してしまった'
  );
});

test('一覧：最終更新が新しい順に並べる', async () => {
  const 端 = 端末();
  const いま = Date.now();
  端.ライブ.置く(`live_sessions/${団体}/おととい/state`, { status: 'active', timestamp: いま - 2 * 日 });
  端.ライブ.置く(`live_sessions/${団体}/さっき/state`, { status: 'active', timestamp: いま - 60000 });
  端.ライブ.置く(`live_sessions/${団体}/昨日/state`, { status: 'active', timestamp: いま - 1 * 日 });

  await 端.store.getState().fetchActiveLiveSessions();

  assert.deepEqual(端.store.getState().liveSessionsList, ['さっき', '昨日', 'おととい']);
});

test('一覧：判定にはサーバーが打った日時を使う（端末の時計に頼らない）', async () => {
  // 端末の時計が大きく狂っていると、使用中のライブを「古い」と見なして
  // 消しかねない。timestamp は書いた端末の時計、updated_at はサーバーの時計
  const 端 = 端末();
  const いま = Date.now();
  端.ライブ.置く(`live_sessions/${団体}/時計がずれた端末/state`, {
    status: 'active',
    timestamp: いま - 30 * 日, // 端末の時計が30日遅れている
    updated_at: いま - 60000, // サーバーから見れば1分前
  });
  端.ライブ.置く(`live_sessions/${団体}/本当に古い/state`, {
    status: 'active',
    timestamp: いま - 60000, // 端末の時計は進んでいる
    updated_at: いま - 30 * 日, // サーバーから見れば30日前
  });

  await 端.store.getState().fetchActiveLiveSessions();

  assert.ok(
    端.store.getState().liveSessionsList.includes('時計がずれた端末'),
    '端末の時計が遅れていても消さない'
  );
  assert.notEqual(端.ライブ.値(`live_sessions/${団体}/時計がずれた端末`), null, '節点も残す');
  assert.ok(!端.store.getState().liveSessionsList.includes('本当に古い'), 'サーバー基準で古いものは出さない');
  assert.equal(端.ライブ.値(`live_sessions/${団体}/本当に古い`), null, 'サーバー基準で古いものは消す');
});

test('一覧：最終更新が分からないライブは消さない', async () => {
  // 判断できないものを消すほうが危ない
  const 端 = 端末();
  端.ライブ.置く(`live_sessions/${団体}/日時なし/state`, { status: 'active' });

  await 端.store.getState().fetchActiveLiveSessions();

  assert.deepEqual(端.store.getState().liveSessionsList, ['日時なし'], '一覧には出す');
  assert.notEqual(端.ライブ.値(`live_sessions/${団体}/日時なし`), null, '消さない');
});

test('終了：参加者がライブ節点を作り直さない', async () => {
  // 直す前は finished を受けたあと reset を送り返しており、届くのが遅れると
  // 主催者が消した節点を作り直して、幽霊セッションが一覧に残っていた
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);

  // 参加者の書き込みが遅れて届く場面を作る。主催者は終了の2秒後に節点を消すので、
  // 遅れた書き込みは「消したあと」に届く
  主.ライブ.状態.遅延 = 40;
  主.ライブ.置く(道, { status: 'finished', timestamp: Date.now() + 5000 });
  await 待つ(10);

  assert.equal(参.store.getState().isLiveActive, false, '参加者のライブが終わっている');
  主.ライブ.消す(`live_sessions/${団体}/${ライブ名}`); // 主催者の後始末
  await 待つ(80); // 遅れていた書き込みが届くのを待つ
  主.ライブ.状態.遅延 = 0;

  assert.equal(主.ライブ.値(`live_sessions/${団体}/${ライブ名}`), null, '節点が作り直されていない');
});

test('リセット：受け取ったリセットを送り返さない', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  await 待つ(10);

  const 前の書き込み数 = 主.ライブ.記録.length;
  主.ライブ.置く(道, {
    status: 'active',
    timestamp: Date.now() + 1000,
    reset_at: Date.now() + 1000,
    shotsPerRound: 本数,
    archers: [],
  });
  await 待つ(20);

  assert.equal(主.store.getState().archers.length, 0, 'リセットは効いている');
  assert.equal(主.ライブ.記録.length, 前の書き込み数, '送り返していない');
});

test('入り直し：最後に書いたのが自分でも、参加した直後に盤面が出る', async () => {
  // 自分の送信の返りを無視する判定が、参加して最初の1通にも当たっていた。
  // 当たると、誰かが次に何かするまで盤面が空のままになる
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);

  const 参 = 端末(主.ライブ, []);
  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(参.store.getState().archers.length, 1, '前提：一度は届いている');

  // 参加者が最後の書き込み手になる
  参.store.getState().updateMark('a1', 0, '○');
  await 待つ(20);
  assert.equal(参.ライブ.値(道).timestamp, 参.store.getState().lastPushedTimestamp, '前提：最後に書いたのは参加者');

  // 退出して入り直す
  参.store.getState().stopLiveSync();
  await 待つ(10);
  assert.equal(参.store.getState().archers.length, 0, '前提：退出で盤面が消える');

  参.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  assert.equal(参.store.getState().archers.length, 1, '入り直してすぐ盤面が出る');
  assert.equal(参.store.getState().archers[0].marks[0], '○', '○× も揃っている');
});

// ──────────────────────────────────────────────────────────────
// 自分の送信の返りの扱い。
// 返りを「スナップショットごと」捨てると、同時に書いた相手の○×まで
// 道連れになる。かといって素通しにすると、返りには矢所が載っていないので
// 手元の矢所が消える。両方を同時に満たす必要がある。
// ──────────────────────────────────────────────────────────────

/** 主催者としてライブに入った端末を作る */
async function 主催の端末(射手たち) {
  const { store, ライブ } = 端末(null, 射手たち);
  assert.equal(await store.getState().startLiveSync(ライブ名), '開始した');
  return { store, ライブ };
}

test('送信：盤面を片付けたあと、同じ記録を読み込み直すと相手にも出る', async () => {
  // 「サーバーに載っていると分かっている○×」の控えは、片付けでも捨てないと
  // いけない。片付けはサーバーの marks_by_id を空にするのに、控えだけ前の
  // ままだと「前と同じだから送らなくてよい」と誤って判断する。
  //
  // 保存して片付けたあと、同じ記録を読み込み直す（loadSession は盤面を丸ごと
  // 入れ替える）と、○×が片付ける前と一字一句同じになる。ここで送信が飛ぶ
  const { store, ライブ } = await 主催の端末([射手({ marks: ['○', '×', '', ''] })]);
  await 待つ(10);
  assert.deepEqual(ライブ.値(道).marks_by_id.a1, ['○', '×', '', ''], '前提：載っている');

  store.getState().resetCurrentSession(!0);
  await 待つ(10);
  assert.ok(!(ライブ.値(道).marks_by_id || {}).a1, '前提：片付けで消えている');

  // 読み込み直しで、片付ける前とまったく同じ盤面が戻る
  store.setState({ archers: [射手({ marks: ['○', '×', '', ''] })] });
  // 何か1つ触れば盤面ごと送られる（性別の変更は○×に触らない）
  store.getState().setArcherGender('a1', '女性');
  await 待つ(10);

  assert.deepEqual(
    (ライブ.値(道).marks_by_id || {}).a1,
    ['○', '×', '', ''],
    '読み込み直した○×が相手に届いていない'
  );
});

test('返り：自分の送信が返ってきても、手元の矢所は消えない', async () => {
  // 1射ごとの送信は marks_by_id だけを書き、archers は前のまま。
  // その返りをそのまま当てると、矢所を持たない archers で上書きしてしまう
  const 矢所 = [{ x: 0.1, y: 0.2 }];
  const { store, ライブ } = await 主催の端末([射手({ marks: ['○', '', '', ''], arrowLocations: 矢所 })]);

  const 送った時刻 = store.getState().lastPushedTimestamp;
  ライブ.置く(道, {
    status: 'active',
    timestamp: 送った時刻, // 自分の返り
    archers: [射手({ marks: ['', '', '', ''] })], // 矢所を持たない
    marks_by_id: { a1: ['○', '', '', ''] },
    archer_timestamps: { a1: 2000 },
    shotsPerRound: 本数,
  });

  assert.deepEqual(手元の射手(store).arrowLocations, 矢所, '手元の矢所が消えた');
});

test('返り：自分の返りでも、同じ通知に載った相手の○×は取り込む', async () => {
  // 2台がほぼ同時に書くと、state.timestamp は後に書いたほうの時刻になる。
  // その通知には先に書いたほうの marks_by_id も入っている。
  // 丸ごと捨てると、相手の○×が永久に届かない
  const { store, ライブ } = await 主催の端末([
    射手({ id: 'a1', marks: ['', '', '', ''] }),
    射手({ id: 'a2', name: '二人目', marks: ['', '', '', ''] }),
  ]);

  const 送った時刻 = store.getState().lastPushedTimestamp;
  ライブ.置く(道, {
    status: 'active',
    timestamp: 送った時刻, // 自分の返り
    archers: [射手({ id: 'a1', marks: ['', '', '', ''] }), 射手({ id: 'a2', name: '二人目', marks: ['', '', '', ''] })],
    // 相手（a2 を持つ端末）の手が同じ通知に載っている
    marks_by_id: { a2: ['○', '', '', ''] },
    archer_timestamps: { a2: Date.now() + 5000 },
    shotsPerRound: 本数,
  });

  const a2 = store.getState().archers.find((a) => a.id === 'a2');
  assert.equal(a2.marks[0], '○', '相手の○×が届いていない');
});

test('送信：ライブを移ったら、○×は最初から載せ直す', async () => {
  // 「サーバーに載っていると分かっている○×」の控えをライブ間で持ち越すと、
  // 次のライブで「前と同じ」と見なして送らず、参加者の画面に○×が出ない
  const { store, ライブ } = 端末(null, [射手({ marks: ['○', '×', '', ''] })]);

  assert.equal(await store.getState().startLiveSync('一つ目'), '開始した');
  await 待つ(10);
  assert.deepEqual(
    ライブ.値(`live_sessions/${団体}/一つ目/state`).marks_by_id.a1,
    ['○', '×', '', ''],
    '前提：一つ目には載っている'
  );

  store.getState().stopLiveSync();
  await 待つ(10);

  // 同じ盤面で別のライブを始める（stopLiveSync は盤面も片付けるので置き直す）
  store.setState({ archers: [射手({ marks: ['○', '×', '', ''] })] });
  assert.equal(await store.getState().startLiveSync('二つ目'), '開始した');
  await 待つ(10);

  const 二つ目 = ライブ.値(`live_sessions/${団体}/二つ目/state`);
  assert.ok(二つ目 && 二つ目.marks_by_id, '二つ目に marks_by_id が無い');
  assert.deepEqual(二つ目.marks_by_id.a1, ['○', '×', '', ''], '二つ目に○×が載っていない');
});
