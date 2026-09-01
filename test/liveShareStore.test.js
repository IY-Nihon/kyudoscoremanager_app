/**
 * ライブのURL共有を、ストアごと動かして確かめる。
 *
 *   npm test
 *
 * 見たいのは3つ。
 *   ・共有すると盤面が専用の枝へ移り、団体の枝には道しるべだけが残ること
 *   ・編集リンクの人の○×が、主催者に届くこと
 *   ・**閲覧リンクの人が何をしても、本物の記録に届かないこと**
 * 3つ目が崩れると「閲覧用」が飾りになる。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する, 検査の合言葉, 待つ } = require('./helpers/storeHarness');
const 共 = require('../src/liveShare');

const 団体 = '100001';
const ライブ名 = '朝練';
const 本数 = 4;
const 合言葉 = 'ひみつ123';

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
    ライブの合言葉: { 団体: 団体, 合言葉: 検査の合言葉 },
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
  });
  return { store, ライブ };
}

/** 主催者がライブを始めて、共有まで済ませる */
async function 共有までやる(鍵, 持ち) {
  const 主 = 端末(null, [射手()]);
  assert.equal(await 主.store.getState().startLiveSync(ライブ名), '開始した');
  const 荷 = await 主.store.getState().ライブを共有する(鍵, 持ち);
  assert.ok(荷, '共有できていない');
  return { 主, 荷 };
}

// ──────────────────────────────────────────────────────────────
test('共有すると、盤面は専用の枝へ移り、団体の枝には道しるべだけが残る', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 編集の枝 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);

  const 道しるべ = 主.ライブ.値(`live_sessions/${検査の合言葉}/${ライブ名}/state`);
  assert.ok(道しるべ, '道しるべが無い');
  assert.equal(道しるべ.共有の枝, 編集の枝, '道しるべが共有の枝を指していない');
  assert.equal(道しるべ.archers, undefined, '団体の枝に盤面が残っている');

  const 本物 = 主.ライブ.値(`live_sessions/${編集の枝}/${ライブ名}/state`);
  assert.ok(本物 && Array.isArray(本物.archers), '専用の枝に盤面が無い');
});

test('共有リンクに団体の合言葉は載らない', async () => {
  // 載せると、その1本で団体の全部のライブに入られてしまう
  const { 荷 } = await 共有までやる(合言葉);
  for (const x of [荷.編集の荷, 荷.閲覧の荷]) {
    assert.ok(!x.includes(検査の合言葉), '荷に団体の合言葉が入っている');
    assert.ok(!x.includes(合言葉), '荷にパスワードが入っている');
  }
});

test('部員は道しるべを辿って、共有のライブに入れる', async () => {
  const { 主 } = await 共有までやる(合言葉);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(10);

  const 部 = 端末(主.ライブ, []);
  await 部.store.getState().fetchActiveLiveSessions();
  await 待つ(10);
  assert.ok(部.store.getState().liveSessionsList.includes(ライブ名), '一覧に出ていない');

  部.store.getState().joinLiveSync(ライブ名);
  await 待つ(10);
  const 相手 = (部.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.ok(相手, '盤面が届いていない');
  assert.equal(相手.marks[0], '○', '○が届いていない');
});

test('編集リンクで入った人の○×は、主催者に届く', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 外 = 端末(主.ライブ, []);
  // 団体には入っていない人という形にする
  外.store.setState({ activeGroupId: null, ライブの合言葉: null });

  assert.equal(await 外.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  await 待つ(10);
  assert.ok((外.store.getState().archers || []).length > 0, '盤面が届いていない');

  外.store.getState().updateMark('a1', 1, '○');
  await 待つ(10);
  const 主の射手 = (主.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.equal(主の射手.marks[1], '○', '主催者に届いていない');
});

test('閲覧リンクでは、写しが読める', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(10);

  const 見 = 端末(主.ライブ, []);
  見.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 見.store.getState().共有リンクで入る(荷.閲覧の荷, 合言葉), '入った');
  await 待つ(10);

  assert.equal(見.store.getState().写しを見ているか, true);
  assert.equal(見.store.getState().ライブは見るだけ, true);
  const 相手 = (見.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.ok(相手, '写しが届いていない');
  assert.equal(相手.marks[0], '○', '○が写しに来ていない');
});

test('閲覧リンクの人が何をしても、本物の記録には届かない', async () => {
  // ここが「閲覧用」の中身。崩れると飾りになる
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 編集の枝 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);

  const 見 = 端末(主.ライブ, []);
  見.store.setState({ activeGroupId: null, ライブの合言葉: null });
  await 見.store.getState().共有リンクで入る(荷.閲覧の荷, 合言葉);
  await 待つ(10);

  const 前 = JSON.stringify(主.ライブ.値(`live_sessions/${編集の枝}/${ライブ名}/state`));
  見.store.getState().updateMark('a1', 3, '☓');
  await 待つ(20);
  const 後 = JSON.stringify(主.ライブ.値(`live_sessions/${編集の枝}/${ライブ名}/state`));
  assert.equal(後, 前, '閲覧の人の書き込みが本物の記録に届いている');

  const 主の射手 = (主.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.notEqual(主の射手.marks[3], '☓', '主催者の盤面が書き換わっている');
});

test('閲覧リンクからは、編集用の枝を知りようがない', async () => {
  // 荷にも、写しの中身にも、編集の枝は入っていないこと
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 編集の枝 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  const 閲覧の枝 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);

  assert.ok(!荷.閲覧の荷.includes(編集の枝.slice(0, 16)), '荷に編集の枝が入っている');
  const 写し = JSON.stringify(主.ライブ.値(`live_view/${閲覧の枝}/${ライブ名}/state`) || {});
  assert.ok(!写し.includes(編集の枝), '写しの中に編集の枝が入っている');
});

test('合言葉が違えば入れない', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 外 = 端末(主.ライブ, []);
  外.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 外.store.getState().共有リンクで入る(荷.編集の荷, 'ちがう123'), '見つからない');
  assert.equal(外.store.getState().isLiveActive, false, '入れてしまっている');
});

test('合言葉が要るリンクを、合言葉なしで開いても入れない', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 外 = 端末(主.ライブ, []);
  外.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 外.store.getState().共有リンクで入る(荷.編集の荷, ''), '見つからない');
});

test('合言葉なしでも共有できる（URLを知る人が入れる）', async () => {
  const { 主, 荷 } = await 共有までやる('');
  assert.equal(荷.合言葉が要るか, false);
  const 外 = 端末(主.ライブ, []);
  外.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 外.store.getState().共有リンクで入る(荷.編集の荷, ''), '入った');
});

test('参加している人も配れる（すでに配られていれば同じリンクが出る）', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 部 = 端末(主.ライブ, []);
  await 部.store.getState().fetchActiveLiveSessions();
  await 待つ(10);
  部.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);
  assert.equal(部.store.getState().isHost, false, '前提：参加している側');

  const 部の荷 = await 部.store.getState().ライブを共有する('');
  assert.ok(部の荷, '参加者が配れない');
  assert.equal(部の荷.すでに配られていた, true, '配り直してしまっている');
  // 合言葉を知らなくても、同じリンクが出ること
  assert.equal(部の荷.編集の荷, 荷.編集の荷, '別のリンクが出ている');
  assert.equal(部の荷.閲覧の荷, 荷.閲覧の荷, '別のリンクが出ている');
  assert.equal(部の荷.合言葉が要るか, true);
});

test('参加している人が配っても、ライブが分裂しない', async () => {
  // 配ると、そのライブは専用の枝へ移る。移した人だけが移ると、
  // 主催者は元の枝に取り残されて○×が行き来しなくなる
  const 主 = 端末(null, [射手()]);
  assert.equal(await 主.store.getState().startLiveSync(ライブ名), '開始した');
  const 部 = 端末(主.ライブ, []);
  await 部.store.getState().fetchActiveLiveSessions();
  await 待つ(10);
  部.store.getState().joinLiveSync(ライブ名);
  await 待つ(20);

  // 主催者ではない側が配る
  const 荷 = await 部.store.getState().ライブを共有する(合言葉);
  assert.ok(荷, '参加者が配れない');
  await 待つ(40);

  const 編集の枝 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  assert.equal(主.store.getState().isHost, true, '主催者でなくなっている');

  // 主催者が入れた○×が、配った人にも届くこと（同じ枝にいる）
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(30);
  const 届いた = (部.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.equal(届いた.marks[0], '○', '配ったあと○×が行き来していない（分裂している）');
  const 本物 = 主.ライブ.値(`live_sessions/${編集の枝}/${ライブ名}/state`);
  assert.ok(本物, '主催者が新しい枝へ付いていっていない');
});

test('見るだけの人は配れない', async () => {
  // 写しの枝しか知らないので、配っても記録できるリンクにはならない
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 見 = 端末(主.ライブ, []);
  見.store.setState({ activeGroupId: null, ライブの合言葉: null });
  await 見.store.getState().共有リンクで入る(荷.閲覧の荷, 合言葉);
  await 待つ(10);
  assert.equal(await 見.store.getState().ライブを共有する(''), null, '見るだけの人が配れてしまう');
});

test('壊れたリンクを渡しても落ちない', async () => {
  const 主 = 端末(null, [射手()]);
  for (const x of [null, undefined, '', '!!!!', 'YWJj'])
    assert.equal(await 主.store.getState().共有リンクで入る(x, ''), '確認できない', String(x));
});

test('閲覧から抜けたら、写しが届かなくなる', async () => {
  // 写しは live_view にあり、stopLiveSync の off は live_sessions しか外さない。
  // 別に外していないと、抜けたあとも盤面が勝手に書き換わる
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 見 = 端末(主.ライブ, []);
  見.store.setState({ activeGroupId: null, ライブの合言葉: null });
  await 見.store.getState().共有リンクで入る(荷.閲覧の荷, 合言葉);
  await 待つ(10);
  assert.ok((見.store.getState().archers || []).length > 0, '前提：写しが届いている');

  見.store.getState().stopLiveSync(!0);
  await 待つ(10);
  const 抜けたあと = JSON.stringify(見.store.getState().archers);

  主.store.getState().updateMark('a1', 2, '○');
  await 待つ(20);
  assert.equal(
    JSON.stringify(見.store.getState().archers),
    抜けたあと,
    '抜けたのに写しが届いて盤面が書き換わっている'
  );
});

test('終了・保存すると、道しるべも写しも残らない', async () => {
  // 残すと、参加一覧に入れないライブが並び、写しも読めたままになる
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 編集の枝 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  const 閲覧の枝 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(10);
  assert.ok(主.ライブ.値(`live_view/${閲覧の枝}/${ライブ名}/state`), '前提：写しがある');

  await 主.store.getState().saveSession('記録会');
  // 後始末は2秒後に走る
  await 待つ(2200);

  assert.equal(主.ライブ.値(`live_sessions/${編集の枝}/${ライブ名}`), null, '本物が残っている');
  assert.equal(主.ライブ.値(`live_sessions/${検査の合言葉}/${ライブ名}`), null, '道しるべが残っている');
  assert.equal(主.ライブ.値(`live_view/${閲覧の枝}/${ライブ名}`), null, '写しが残っている');
});

test('閲覧中は書く先を持たない（表の止めを抜けても団体の枝を壊さない）', async () => {
  // ふだんは「ライブは見るだけ」で updateMark ごと止まる（書き換えを止めるか）。
  // ここで見たいのは、その止めを抜けたときの2枚目の守り。
  // 抜けたときに団体の枝へ落ちると、部員が閲覧リンクを開いただけで
  // 参加一覧の道しるべが壊れる
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 部 = 端末(主.ライブ, []); // 団体には入ったまま
  assert.equal(await 部.store.getState().共有リンクで入る(荷.閲覧の荷, 合言葉), '入った');
  await 待つ(10);

  // 表の止めだけを外して、下の守りが効いているかを見る
  部.store.setState({ ライブは見るだけ: !1 });
  assert.equal(部.store.getState().書き換えを止めるか(), false, '前提：表の止めは外れている');

  const 前 = JSON.stringify(主.ライブ.値(`live_sessions/${検査の合言葉}/${ライブ名}/state`));
  部.store.getState().updateMark('a1', 3, '☓');
  await 待つ(20);
  const 後 = JSON.stringify(主.ライブ.値(`live_sessions/${検査の合言葉}/${ライブ名}/state`));
  assert.equal(後, 前, '閲覧の人の操作が団体の枝（道しるべ）を書き換えている');
});

test('編集リンクの人が入れた○×も、見ている人に届く', async () => {
  // 写しへ流すのは主催者だけ、にすると、リンクで入った記録係の○×が
  // 見ている人に出ない。入った人にも写しの流し先を渡してある
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 閲覧の枝 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);

  const 記 = 端末(主.ライブ, []);
  記.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 記.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  await 待つ(10);
  assert.ok(
    記.store.getState().いまのライブの閲覧枝,
    '記録係が写しの流し先を受け取っていない'
  );

  記.store.getState().updateMark('a1', 1, '○');
  await 待つ(20);

  const 写し = 主.ライブ.値(`live_view/${閲覧の枝}/${ライブ名}/state`) || {};
  assert.ok(
    JSON.stringify(写し.marks_by_id || {}).includes('○'),
    '編集リンクの人の○×が写しに来ていない'
  );
});

test('編集リンクの人の○×が、次の受信で消えない', async () => {
  // 受け取りの取り込みを別に書いていたときは、届いた盤面で丸ごと上書きして
  // いたため、入れた○×が次の通知で消えていた。部員と同じ道を通している
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 記 = 端末(主.ライブ, []);
  記.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 記.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  await 待つ(10);

  記.store.getState().updateMark('a1', 0, '○');
  await 待つ(10);
  const 入れた = (記.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.equal(入れた.marks[0], '○', '前提：手元に入っている');

  // 主催者が別のますを触る。その通知が来ても、こちらの○は残ること
  主.store.getState().updateMark('a1', 2, '☓');
  await 待つ(30);
  const あと = (記.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.equal(あと.marks[0], '○', '次の受信で自分の○×が消えている');
  assert.equal(あと.marks[2], '☓', '相手の○×が届いていない');
});

test('古くなった共有ライブは、専用の枝も写しも片付ける', async () => {
  // 団体の枝にあるのは道しるべだけ。それだけ消しても、そのライブ専用の枝と
  // 閲覧用の写しは残り、誰も辿り着けないまま的中・氏名・立ち順が残り続ける
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 編集の枝 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  const 閲覧の枝 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);
  主.store.getState().updateMark('a1', 0, '○');
  await 待つ(10);
  assert.ok(主.ライブ.値(`live_sessions/${編集の枝}/${ライブ名}/state`), '前提：専用の枝がある');
  assert.ok(主.ライブ.値(`live_view/${閲覧の枝}/${ライブ名}/state`), '前提：写しがある');

  // 道しるべを14日より古くして、片付けを走らせる
  const 日 = 86400000;
  主.ライブ.置く(`live_sessions/${検査の合言葉}/${ライブ名}/state/updated_at`, Date.now() - 20 * 日);
  主.ライブ.置く(`live_sessions/${検査の合言葉}/${ライブ名}/state/timestamp`, Date.now() - 20 * 日);
  await 主.store.getState().fetchActiveLiveSessions();
  await 待つ(30);

  assert.equal(主.ライブ.値(`live_sessions/${検査の合言葉}/${ライブ名}`), null, '道しるべが残っている');
  assert.equal(主.ライブ.値(`live_sessions/${編集の枝}/${ライブ名}`), null, '専用の枝が残っている');
  assert.equal(主.ライブ.値(`live_view/${閲覧の枝}/${ライブ名}`), null, '写しが残っている');
});

// ── すでに入っている○×が、あとから来た人に見えること ──────────
// 元は「入ってから入れた○×」しか見ていなかった。ライブの archers に○×は
// 入っていない（marks_by_id で別に送る）ので、突き合わせを通さないと
// 先に入っていたぶんが永久に出ない

test('先に入っていた○×が、編集リンクの人に見える', async () => {
  const 主 = 端末(null, [射手()]);
  assert.equal(await 主.store.getState().startLiveSync(ライブ名), '開始した');
  // 共有する前に○×を入れておく
  主.store.getState().updateMark('a1', 0, '○');
  主.store.getState().updateMark('a1', 1, '☓');
  await 待つ(10);
  const 荷 = await 主.store.getState().ライブを共有する(合言葉);
  assert.ok(荷, '共有できていない');

  const 記 = 端末(主.ライブ, []);
  記.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 記.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  await 待つ(20);

  const 見えた = (記.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.ok(見えた, '射手が届いていない');
  assert.equal(見えた.marks[0], '○', '先に入っていた○が見えない');
  assert.equal(見えた.marks[1], '☓', '先に入っていた☓が見えない');
});

test('先に入っていた○×が、閲覧リンクの人にも見える', async () => {
  const 主 = 端末(null, [射手()]);
  assert.equal(await 主.store.getState().startLiveSync(ライブ名), '開始した');
  const 荷 = await 主.store.getState().ライブを共有する(合言葉);
  assert.ok(荷, '共有できていない');
  主.store.getState().updateMark('a1', 0, '○');
  主.store.getState().updateMark('a1', 2, '☓');
  await 待つ(20);

  const 見 = 端末(主.ライブ, []);
  見.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 見.store.getState().共有リンクで入る(荷.閲覧の荷, 合言葉), '入った');
  await 待つ(20);

  const 見えた = (見.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.ok(見えた, '射手が写しに届いていない');
  assert.equal(見えた.marks[0], '○', '写しに○が出ていない');
  assert.equal(見えた.marks[2], '☓', '写しに☓が出ていない');
});

test('入ったあとに入った○×も、閲覧リンクの人に届く', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 見 = 端末(主.ライブ, []);
  見.store.setState({ activeGroupId: null, ライブの合言葉: null });
  await 見.store.getState().共有リンクで入る(荷.閲覧の荷, 合言葉);
  await 待つ(10);

  主.store.getState().updateMark('a1', 3, '○');
  await 待つ(20);
  const 見えた = (見.store.getState().archers || []).find((x) => x && x.id === 'a1');
  assert.equal(見えた.marks[3], '○', 'あとから入れた○が写しに出ていない');
});

// ── よその団体のライブは、自分の記録に残さない ──────────────
// 保存すると他校の練習が自分の団体の記録になり、分析にも混ざる。
// 記録そのものは主催者の側で保存されるので、失われはしない

test('よその団体のライブは保存できない', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉);
  // 別の団体にログインしている人という形にする
  const 他 = 端末(主.ライブ, []);
  他.store.setState({ activeGroupId: '999999', ライブの合言葉: null });
  assert.equal(await 他.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  await 待つ(20);

  assert.equal(他.store.getState().よその団体のライブ, true, 'よその団体と見分けていない');
  assert.equal(他.store.getState().保存を止めるか(), true, '保存が止まっていない');

  const 前の数 = (他.store.getState().sessions || []).length;
  await 他.store.getState().saveSession('よその記録');
  await 待つ(20);
  assert.equal((他.store.getState().sessions || []).length, 前の数, '自分の団体に保存されている');
});

test('自分の団体のライブなら、共有リンクで入っても保存できる', async () => {
  // 部員が共有リンクを開いただけ、という筋。自分たちの練習なので残せる
  const { 主, 荷 } = await 共有までやる(合言葉);
  const 部 = 端末(主.ライブ, []); // 同じ団体に入ったまま
  assert.equal(await 部.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  await 待つ(20);

  assert.equal(部.store.getState().よその団体のライブ, false, '自分の団体なのによそ扱いになっている');
  assert.equal(部.store.getState().保存を止めるか(), false, '自分の団体なのに保存が止まっている');
});

test('ふつうに始めたライブは、よそ扱いにならない', async () => {
  const 主 = 端末(null, [射手()]);
  await 主.store.getState().startLiveSync(ライブ名);
  assert.equal(主.store.getState().よその団体のライブ, false);
  assert.equal(主.store.getState().保存を止めるか(), false);
});

// ── 期限 ──────────────────────────────────────────────────────
//
// 本当に止めているのは決まり（database.rules.json）で、ここの偽RTDBは
// 決まりを持たない。だからここで見るのは「アプリの側が期限を正しく置き、
// 正しく閉じるか」まで。決まりそのものは検証環境で確かめること。

const 一時間 = 3600000;

test('期限：配ると、編集と閲覧の両方の枝に期限が置かれる', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  const 閲 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);
  // 片方だけだと、そちらは閉じても、もう片方から読み続けられる
  for (const [枝, 名] of [[編, '編集'], [閲, '閲覧']]) {
    const v = 主.ライブ.値(`live_limits/${枝}`);
    assert.equal(typeof v, 'number', `${名}の枝に期限が無い`);
    assert.ok(v > Date.now(), `${名}の期限が過去`);
  }
});

test('期限：期限なしを選ぶと、どこにも期限を置かない', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 0);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  assert.equal(主.ライブ.値(`live_limits/${編}`), undefined, '期限なしなのに置かれている');
  assert.equal(荷.期限, null);
  assert.equal(共.共有の荷を解く(荷.編集の荷).期限, null, '荷にも載せないこと');
});

test('期限：盤面にも写しにも載る（見ている人が閉じられるように）', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  const 閲 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);
  assert.equal(主.ライブ.値(`live_sessions/${編}/${ライブ名}/state`).期限, 荷.期限);
  // 写しに載せないと、閲覧の人だけがいつまでも見続ける
  assert.equal(主.ライブ.値(`live_view/${閲}/${ライブ名}/state`).期限, 荷.期限);
});

test('期限：写しに種と閲覧の枝は載せない（期限を足しても漏らさない）', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 閲 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);
  const 写し = 主.ライブ.値(`live_view/${閲}/${ライブ名}/state`);
  assert.equal(写し.種, undefined, '写しに種が漏れている');
  assert.equal(写し.閲覧の枝, undefined, '写しに閲覧の枝が漏れている');
});

test('期限：切れたリンクは「期限切れ」と分かる', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  // 決まりの側の置き場所を過去にする
  主.ライブ.置く(`live_limits/${編}`, Date.now() - 1000);

  const 客 = 端末(主.ライブ, []);
  客.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 客.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '期限切れ');
});

test('期限：切れていなければ、これまでどおり入れる', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 客 = 端末(主.ライブ, []);
  客.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 客.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
});

test('期限：期限なしのリンクは切れない', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 0);
  const 客 = 端末(主.ライブ, []);
  客.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 客.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
});

test('期限：入っている最中に切れたら、ライブから離れる', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);

  const 客 = 端末(主.ライブ, []);
  客.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 客.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  assert.equal(客.store.getState().isLiveActive, true);

  // 盤面の期限を過去にして、次の知らせを起こす
  const 道 = `live_sessions/${編}/${ライブ名}/state`;
  主.ライブ.置く(道, Object.assign({}, 主.ライブ.値(道), { 期限: Date.now() - 1, timestamp: Date.now() }));
  await 待つ(20);
  assert.equal(客.store.getState().isLiveActive, false, '切れても離れていない');
});

test('期限：切れて離れても、手元の記録は消えない', async () => {
  // 消すと、その練習ぶんがどこにも無くなる。期限が切れたのはリンクであって記録ではない
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  const 客 = 端末(主.ライブ, []);
  客.store.setState({ activeGroupId: null, ライブの合言葉: null });
  await 客.store.getState().共有リンクで入る(荷.編集の荷, 合言葉);
  await 待つ(10);
  assert.ok((客.store.getState().archers || []).length > 0, '盤面が届いていない');

  const 道 = `live_sessions/${編}/${ライブ名}/state`;
  主.ライブ.置く(道, Object.assign({}, 主.ライブ.値(道), { 期限: Date.now() - 1, timestamp: Date.now() }));
  await 待つ(20);
  assert.ok((客.store.getState().archers || []).length > 0, '手元の盤面まで消えている');
});

test('期限：二度目に配っても、期限は延びない', async () => {
  // 延ばせると、いちど配ったリンクが後からよみがえる。決まりの側も延ばさせない
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 二度目 = await 主.store.getState().ライブを共有する(合言葉, 7 * 24 * 一時間);
  assert.equal(二度目.すでに配られていた, true);
  assert.equal(二度目.期限, 荷.期限, '二度目に配ったら期限が変わった');
  assert.equal(共.共有の荷を解く(二度目.編集の荷).期限, 荷.期限);
});

test('期限：片付けると、期限の跡も残らない', async () => {
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  const 閲 = 共.枝を導く(共.共有の荷を解く(荷.閲覧の荷).種, 合言葉);
  await 主.store.getState().saveSession('朝練の記録', '', true, []);
  await 待つ(2200);
  for (const [枝, 名] of [[編, '編集'], [閲, '閲覧']])
    assert.equal(主.ライブ.値(`live_limits/${枝}`), undefined, `${名}の期限が残っている`);
});

test('期限：切れたライブは、参加一覧から消える', async () => {
  // 残っていると、部員が押しても何も出ない「空のライブ」に入る
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 部 = 端末(主.ライブ, []);
  await 部.store.getState().fetchActiveLiveSessions();
  await 待つ(10);
  assert.ok(部.store.getState().liveSessionsList.includes(ライブ名), '出ていない');

  // 道しるべの期限を過去にする
  const 道 = `live_sessions/${検査の合言葉}/${ライブ名}/state`;
  主.ライブ.置く(道, Object.assign({}, 主.ライブ.値(道), { 期限: Date.now() - 1 }));
  await 部.store.getState().fetchActiveLiveSessions();
  await 待つ(10);
  assert.ok(!部.store.getState().liveSessionsList.includes(ライブ名), '切れたのに一覧に残っている');
  // 荷は使っていないが、共有できていることを確かめておく
  assert.ok(荷.編集の荷);
});

test('期限：切れた枝に入ろうとしても、空のライブにならない', async () => {
  // 一覧を取り直す前に押した人はここへ来る。見張りが決まりに弾かれても
  // 知らせが無いと、盤面が空のまま「ライブ中」の表示だけが残る
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);
  主.ライブ.置く(`live_limits/${編}`, Date.now() - 1000);

  const 部 = 端末(主.ライブ, []);
  部.store.getState().joinLiveSync(ライブ名, !1, { 枝: 編, 閲覧枝: null });
  await 待つ(20);
  assert.equal(部.store.getState().isLiveActive, false, '入れないのに「ライブ中」のまま');
});

test('期限：盤面の受け渡しに混ざらない', async () => {
  // 期限は盤面（state）に載せているが、射手の一覧へ入ってはいけない。
  // 入ると、相手の端末で「知らない項目のある射手」として扱われる
  const { 主, 荷 } = await 共有までやる(合言葉, 一時間);
  const 編 = 共.枝を導く(共.共有の荷を解く(荷.編集の荷).種, 合言葉);

  const 客 = 端末(主.ライブ, []);
  客.store.setState({ activeGroupId: null, ライブの合言葉: null });
  assert.equal(await 客.store.getState().共有リンクで入る(荷.編集の荷, 合言葉), '入った');
  await 待つ(20);

  const 射手たち = 客.store.getState().archers || [];
  assert.ok(射手たち.length > 0, '盤面が届いていない');
  for (const x of 射手たち) {
    assert.equal(x.期限, undefined, '射手に期限が混ざっている: ' + JSON.stringify(x).slice(0, 80));
    assert.equal(x.鍵が要るか, undefined, '射手に共有の情報が混ざっている');
    assert.equal(x.種, undefined, '射手に種が混ざっている');
  }
  // 盤面そのものにも入っていないこと
  assert.equal(客.store.getState().期限, undefined, '店の根に期限が置かれている');
  assert.ok(編);
});
