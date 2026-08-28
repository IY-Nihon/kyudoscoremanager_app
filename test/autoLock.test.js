/**
 * 誤タップ防止（自動ロック）のうち、ストアが受け持つ部分の検査。
 *
 *   npm test
 *
 * 画面側（薄い灰色にする・押しても変わらない・長押しで開く）は
 * e2e/lock.spec.mjs で実物を触って確かめている。
 * ここで見るのは「いつ数え直しになるか」だけ。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する } = require('./helpers/storeHarness');

const 団体 = '100001';

function 端末() {
  const { store } = ストアを用意する();
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
    archers: [{ id: 'a1', name: '山田', marks: ['', '', '', ''] }],
    shotsPerRound: 4,
    isLiveActive: false,
    isHost: false,
    liveSessionName: null,
    historyStack: [],
    redoStack: [],
    自動ロックする: true,
    自動ロックまでの秒: 3,
    入れた時刻: {},
  });
  return store;
}

test('○×を入れると、そのますの時刻が記録される', () => {
  const store = 端末();
  const 前 = Date.now();
  store.getState().toggleMark('a1', 2);
  const 時刻 = store.getState().入れた時刻['a1:2'];
  assert.ok(typeof 時刻 === 'number', '時刻が付いていない');
  assert.ok(時刻 >= 前, '時刻が過去になっている');
  assert.strictEqual(store.getState().archers[0].marks[2], '○');
});

test('入れ直すと時刻も更新され、数え直しになる', () => {
  const store = 端末();
  store.setState({ 入れた時刻: { 'a1:0': 1 } });
  store.getState().toggleMark('a1', 0);
  assert.ok(store.getState().入れた時刻['a1:0'] > 1, '古い時刻のままになっている');
});

test('触っていないますには時刻が付かない', () => {
  const store = 端末();
  store.getState().toggleMark('a1', 1);
  assert.strictEqual(store.getState().入れた時刻['a1:0'], undefined);
  assert.strictEqual(store.getState().入れた時刻['a1:3'], undefined);
});

test('長押しで開けると、時刻が今になる（開けたあと、また少し経てば閉じる）', () => {
  const store = 端末();
  store.setState({ 入れた時刻: { 'a1:0': Date.now() - 60000 } });
  const 前 = Date.now();
  store.getState().ますを開ける('a1', 0);
  assert.ok(store.getState().入れた時刻['a1:0'] >= 前, '時刻が入れ直されていない');
});

test('長押しで開けても、ほかのますは閉じたまま', () => {
  const store = 端末();
  const 古い = Date.now() - 60000;
  store.setState({ 入れた時刻: { 'a1:0': 古い, 'a1:1': 古い } });
  store.getState().ますを開ける('a1', 0);
  assert.strictEqual(store.getState().入れた時刻['a1:1'], 古い, '隣まで開いてしまった');
});

test('鍵の切り替えで、たまった時刻は捨てる', () => {
  const store = 端末();
  store.setState({ 入れた時刻: { 'a1:0': Date.now() } });
  store.getState().set自動ロックする(false);
  assert.strictEqual(store.getState().自動ロックする, false);
  assert.deepStrictEqual(store.getState().入れた時刻, {}, '古い時刻が残っている');
  store.getState().set自動ロックする(true);
  assert.deepStrictEqual(store.getState().入れた時刻, {});
});

test('時刻は保存の対象に入れない（端末をまたいで持ち回らない）', () => {
  const 中身 = require('fs').readFileSync(
    require('path').resolve(__dirname, '../src/JP_useScoreStore_174.js'),
    'utf8'
  );
  const 保存部 = 中身.slice(中身.indexOf('partialize:'), 中身.indexOf('onRehydrateStorage'));
  assert.ok(保存部.includes('自動ロックする'), '入り切りの設定は残したい');
  assert.ok(!保存部.includes('入れた時刻'), '時刻まで保存してしまっている');
});

test('画像から反映した○×は、初めから閉じていない', () => {
  // 画像読み取りは toggleMark を通らない。印が付かないと
  // 「読み込み直したもの」と見なされ、直すのが全部長押しになる
  const store = 端末();
  const 反映 = [
    { id: 'a1', name: '山田', marks: ['○', '', '×', ''] },
    { id: 'a2', name: '鈴木', marks: ['', '', '', ''] },
  ];
  const 前 = Date.now();
  store.setState({ archers: 反映 });
  store.getState().入れた印をまとめて付ける(反映);

  const 印 = store.getState().入れた時刻;
  assert.ok(印['a1:0'] >= 前, '○に印が付いていない');
  assert.ok(印['a1:2'] >= 前, '×に印が付いていない');
  assert.strictEqual(印['a1:1'], undefined, '空のますにまで印が付いている');
  assert.strictEqual(印['a2:0'], undefined, '空の射手にまで印が付いている');
});

// 保存時の出欠確認は、設定で切れる
test('設定：保存時の出欠確認は既定で出し、切ると保存される値も残る', () => {
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true });

  assert.equal(store.getState().保存時に出欠を確認する, true, '既定は「確認する」');

  store.getState().set保存時に出欠を確認する(false);
  assert.equal(store.getState().保存時に出欠を確認する, false, '切り替わらない');

  store.getState().set保存時に出欠を確認する(true);
  assert.equal(store.getState().保存時に出欠を確認する, true, '戻せない');
});

test('設定：出欠を空のまま保存しても、記録は残る', async () => {
  // 出欠確認を切ったときは attendance を渡さずに保存する。
  // 出欠画面は「記録に出ている人は出席」と数えるので、空でも困らない
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    isNetworkOnline: true,
    activeGroupId: '100001',
    activeRole: 'group',
    archers: [
      {
        id: 'a1',
        name: '山田',
        memberId: 'm1',
        marks: ['○', '×', '', ''],
        lockedBlocks: {},
        arrowLocations: [null, null, null, null],
        lastModified: 1,
      },
    ],
    sessions: [],
  });

  await store.getState().saveSession('朝練', '', true, [], null);
  const 記録 = store.getState().sessions[0];
  assert.ok(記録, '記録が保存されていない');
  assert.equal(記録.title, '朝練');
  assert.equal(記録.attendance, null, '出欠は空のまま');
  assert.equal(記録.archers.length, 1, '射手が残っていない');
});

test('長押しで開けると、知らせの合図が立つ', () => {
  // 灰色が戻るだけでは押さえが届いたか分かりにくいので、画面に短く知らせる。
  // 記録画面はこの時刻を見て出すので、押すたびに新しくなる必要がある
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true, 鍵を開けた時刻: 0 });

  store.getState().ますを開ける('a1', 0);
  const 一回目 = store.getState().鍵を開けた時刻;
  assert.ok(一回目 > 0, '合図が立たない');

  store.getState().ますを開ける('a1', 1);
  assert.ok(store.getState().鍵を開けた時刻 >= 一回目, '二度目の合図が立たない');
});

// お知らせの「ここから下は前回までのお知らせ」の線を引く位置
test('お知らせ：前回より後に足したぶんだけを新しいと数える', () => {
  const 本体 = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'src', 'JP_WhatsNewModal.js'),
    'utf8'
  );
  // 版を持つ項目が、上から新しい順に並んでいること（数え方の前提）
  const 版たち = [...本体.matchAll(/版: '([^']+)'/g)].map((m) => m[1]);
  assert.ok(版たち.length >= 2, '版を持つ項目が少なすぎる');
  for (let i = 1; i < 版たち.length; i++) {
    assert.ok(版たち[i - 1] >= 版たち[i], `並びが新しい順でない: ${版たち[i - 1]} → ${版たち[i]}`);
  }

  // 数え方そのもの（本体と同じ規則を、この検査の中で組み直して確かめる）
  const 項目 = 版たち.map((v) => ({ 版: v })).concat([{}, {}]); // 版を持たない古いぶん
  const 未読の数 = (最後に見た版) => {
    let n = 0;
    for (const x of 項目) {
      if (!x.版) break;
      if (最後に見た版 && !(x.版 > 最後に見た版)) break;
      n++;
    }
    return n;
  };

  assert.equal(未読の数(null), 版たち.length, '一度も見ていない人には、版を持つぶんが全部新しい');
  assert.equal(未読の数(版たち[0]), 0, '最新まで見た人には、新しいものが無い');
  assert.equal(未読の数('2000-01-01-01'), 版たち.length, '大昔に見た人には全部新しい');
  const 二番目 = 版たち.find((v) => v !== 版たち[0]);
  if (二番目) {
    assert.equal(
      未読の数(二番目),
      版たち.filter((v) => v > 二番目).length,
      '途中まで見た人の数え方が合わない'
    );
  }
});

test('お知らせ：「見たところ」の印がまだ無い人は、今後表示しないを押した版で代える', () => {
  // 印は今回から付け始めた。今動いているアプリの利用者は誰も持っていない。
  // 無いからと全部を新しい扱いにすると、切り替え直後の一回目
  // ――線がいちばん要るとき――に線が最上段へ行き、何も区切らない
  const 本体 = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'src', 'JP_WhatsNewModal.js'),
    'utf8'
  );
  const 始 = 本体.indexOf('const dismissedVersion');
  const 読む所 = 本体.slice(始, 本体.indexOf('shownThisSession = true', 始));
  assert.ok(
    /getItem\(LAST_SEEN_KEY\)\)? *\|\| *dismissedVersion/.test(読む所),
    '印が無い人への代えが無い'
  );

  // 前の版まで読んだ人には、そのあとに足したぶんだけが新しい
  const 版たち = [...本体.matchAll(/版: '([^']+)'/g)].map((m) => m[1]);
  const 今の版 = (本体.match(/NOTICE_VERSION = '([^']+)'/) || [])[1];
  const 前の版 = 版たち.find((v) => v !== 今の版);
  assert.ok(前の版, '版が1種類しかなく、切り替えの見え方を確かめられない');
  const 新しい数 = 版たち.filter((v) => v > 前の版).length;
  assert.ok(新しい数 > 0, '前の版まで読んだ人に、新しいものが1つも無い');
  assert.ok(新しい数 < 版たち.length, '前の版まで読んだ人に、全部が新しい扱いになっている');
});

test('「鍵を開けました」の帯は、指を下のますへ通す', () => {
  // 帯は記録表の上に浮く。長押しで開けた直後は、その下のますを
  // すぐ押したいので、帯が指を吸うと「開いたのに書けない」になる
  const 本体 = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'src', 'JP_RecordScreen_593.js'),
    'utf8'
  );
  const 始 = 本体.indexOf('feedbackOverlay: {');
  assert.ok(始 > 0, '知らせの帯の見た目が見つからない');
  const 帯 = 本体.slice(始, 本体.indexOf('},', 始));
  assert.ok(帯.includes("position: 'absolute'"), '浮いていないなら、この検査の前提が変わっている');
  assert.ok(帯.includes("pointerEvents: 'none'"), '帯が指を吸ってしまう');
});

// 記録表の並べ方（縦／横）は端末ごとの好みなので残す
test('設定：記録表の並べ方は既定で縦、切り替えると端末に残る', () => {
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true });

  assert.equal(store.getState().横に並べる, false, '既定は縦のはず');

  store.getState().set横に並べる(true);
  assert.equal(store.getState().横に並べる, true, '横へ切り替わらない');
  store.getState().set横に並べる(false);
  assert.equal(store.getState().横に並べる, false, '縦へ戻せない');

  const 中身 = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'src', 'JP_useScoreStore_174.js'),
    'utf8'
  );
  const 保存部 = 中身.slice(中身.indexOf('partialize:'), 中身.indexOf('onRehydrateStorage'));
  assert.ok(保存部.includes('横に並べる'), '並べ方が保存されていない（読み込み直すと縦に戻る）');
});

// ライブに「見るだけ」で入っているあいだは、盤面を書き換えない
test('ライブ：見るだけで入っていると、○×も鍵も交代も変わらない', () => {
  // 画面側の isReadOnly は鍵ボタンしか止めないので、ストアで止めている。
  // ここが抜けると、見るだけのつもりの人の操作が全員の画面に流れる
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    isLiveActive: true,
    ライブは見るだけ: true,
    archers: [{ id: 'a1', name: '山田', marks: ['', '', '', ''], lockedBlocks: {} }],
    shotsPerRound: 4,
  });

  store.getState().toggleMark('a1', 0);
  assert.strictEqual(store.getState().archers[0].marks[0], '', '見るだけなのに○が入った');

  store.getState().立を閉じる('a1', 0);
  assert.deepStrictEqual(store.getState().archers[0].lockedBlocks, {}, '見るだけなのに鍵がかかった');

  store.getState().setSubstitution('a1', 2, '交代太郎', null);
  assert.strictEqual(
    store.getState().archers[0].substitutions,
    undefined,
    '見るだけなのに交代が入った'
  );

  // 盤面を変える操作は、どれも通らないこと。
  // ○×だけ止めても、人を増やす・射数を変えるなどが素通りだと
  // 「見るだけのつもり」の操作が全員の画面に流れる
  const 前の数 = store.getState().archers.length;
  store.getState().addArcher('新しい人');
  store.getState().addSeparator();
  store.getState().addTotalCalculator();
  assert.strictEqual(store.getState().archers.length, 前の数, '見るだけなのに列が増えた');

  store.getState().setShotsPerRound(12);
  assert.strictEqual(store.getState().shotsPerRound, 4, '見るだけなのに射数が変わった');

  store.getState().deleteArcher('a1');
  assert.strictEqual(store.getState().archers.length, 前の数, '見るだけなのに射手が消えた');

  store.getState().setArcherGuestName('a1', 'だれか');
  assert.strictEqual(store.getState().archers[0].name, '山田', '見るだけなのに名前が変わった');

  store.getState().ますを開ける('a1', 0);
  assert.deepStrictEqual(store.getState().入れた時刻, {}, '見るだけなのに鍵が開いた');

  // 記録する側に切り替えれば、これまでどおり書ける
  store.getState().setライブは見るだけ(false);
  store.getState().toggleMark('a1', 0);
  assert.strictEqual(store.getState().archers[0].marks[0], '○', '記録する側にしても入らない');
});

// 見るだけの守りは、画面側だけに置くと道が増えるたびに漏れる。
// 矢所は画面側に守りが無く、しかもライブへ送っていた（監査で見つけた）。
// ここでは「ストアの操作そのものが止まる」ことを一つずつ見る。
test('ライブ：見るだけなら、矢所も直接の書き換えも消去も通らない', () => {
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    isLiveActive: true,
    ライブは見るだけ: true,
    archers: [{ id: 'a1', name: '山田', marks: ['○', '', '', ''], lockedBlocks: {} }],
    shotsPerRound: 4,
  });

  // 矢所。画面側に守りが無く、ここが素通りだと全員の画面に流れていた
  store.getState().updateArrowLocation('a1', 0, { x: 0.5, y: 0.5 });
  assert.strictEqual(
    store.getState().archers[0].arrowLocations,
    undefined,
    '見るだけなのに矢所が入った'
  );

  // ○×の直接の書き換え
  store.getState().updateMark('a1', 1, '×');
  assert.strictEqual(store.getState().archers[0].marks[1], '', '見るだけなのに○×が変わった');

  // その人の○×をまとめて消す
  store.getState().clearArcherMarks('a1');
  assert.strictEqual(store.getState().archers[0].marks[0], '○', '見るだけなのに○×が消えた');

  // 弓力・性別
  store.getState().setArcherBowWeight('a1', 16);
  store.getState().setArcherGender('a1', '女子');
  assert.strictEqual(store.getState().archers[0].bowWeight, undefined, '見るだけなのに弓力が入った');
  assert.strictEqual(store.getState().archers[0].gender, undefined, '見るだけなのに性別が入った');

  // 画像から読み取った結果の取り込み
  store.getState().applyOCRResult([{ id: 'a1', marks: ['×', '×', '×', '×'] }]);
  assert.strictEqual(store.getState().archers[0].marks[0], '○', '見るだけなのに読み取りが入った');
});

test('記録用なら、いまの操作はこれまでどおり通る', () => {
  // 守りを足したせいで、ふつうの記録まで止まっていないことを見る。
  // 止めるほうだけ検査すると、全部を無効にしても通ってしまう
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    isLiveActive: true,
    ライブは見るだけ: false,
    archers: [{ id: 'a1', name: '山田', marks: ['○', '', '', ''], lockedBlocks: {} }],
    shotsPerRound: 4,
  });

  store.getState().updateMark('a1', 1, '×');
  assert.strictEqual(store.getState().archers[0].marks[1], '×', '記録用なのに○×が入らない');

  store.getState().setArcherBowWeight('a1', 16);
  assert.strictEqual(store.getState().archers[0].bowWeight, 16, '記録用なのに弓力が入らない');

  store.getState().clearArcherMarks('a1');
  assert.strictEqual(store.getState().archers[0].marks[0], '', '記録用なのに消えない');
});

test('ライブでなければ、見るだけの覚えが残っていても止めない', () => {
  // ライブが終わったあとも止まったままだと、手元の記録が書けなくなる
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    isLiveActive: false,
    ライブは見るだけ: true,
    archers: [{ id: 'a1', name: '山田', marks: ['', '', '', ''], lockedBlocks: {} }],
    shotsPerRound: 4,
  });
  store.getState().updateMark('a1', 0, '○');
  assert.strictEqual(store.getState().archers[0].marks[0], '○', 'ライブが終わったのに書けない');
});

test('閲覧用：ますを押したら「閲覧用」の合図が立つ（盤面は変えない）', () => {
  // 黙って何も起きないと、届いていないのか壊れたのか分からない
  const { store } = ストアを用意する();
  store.setState({
    isHydrated: true,
    isLiveActive: true,
    ライブは見るだけ: true,
    archers: [{ id: 'a1', name: '山田', marks: ['', '', '', ''], lockedBlocks: {} }],
    shotsPerRound: 4,
  });

  store.getState().toggleMark('a1', 0);
  assert.strictEqual(store.getState().archers[0].marks[0], '', '閲覧用なのに○が入った');
  assert.ok(store.getState().閲覧でますを押した時刻 > 0, '閲覧用の合図が立っていない');
  assert.strictEqual(store.getState().閉じたますを押した時刻, 0, '鍵の案内の側が立ってはいけない');
});

test('閲覧用：閉じたますを押しても「長押しで開きます」とは言わない', () => {
  // 閲覧用では ますを開ける も止めてあるので、長押ししても開かない。
  // 開かないことをやらせる案内を出してはいけない
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true, isLiveActive: true, ライブは見るだけ: true });

  store.getState().閉じたますが押された();
  assert.strictEqual(store.getState().閉じたますを押した時刻, 0, '嘘の案内が出ようとしている');
  assert.ok(store.getState().閲覧でますを押した時刻 > 0, '閲覧用の合図が立っていない');
});

test('記録用：閉じたますを押したら「長押しで開きます」の合図が立つ', () => {
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true, isLiveActive: true, ライブは見るだけ: false });

  store.getState().閉じたますが押された();
  assert.ok(store.getState().閉じたますを押した時刻 > 0, '鍵の案内が出ない');
  assert.strictEqual(store.getState().閲覧でますを押した時刻, 0, '閲覧用の側が立ってはいけない');
});

test('ライブでなければ、閉じたますの案内はふつうに出る', () => {
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true, isLiveActive: false, ライブは見るだけ: true });
  store.getState().閉じたますが押された();
  assert.ok(store.getState().閉じたますを押した時刻 > 0, 'ライブ外なのに止まっている');
});

test('お知らせ：配信済みの版のまま項目を足していない', () => {
  // 2026-08-28 に踏んだ落とし穴。本番へ出したあと、同じ版のまま項目を4件
  // 足してしまった。「今後表示しない」を押した人は dismissedVersion が
  // NOTICE_VERSION と等しいままなので、足したお知らせが二度と出ない。
  // 出したつもりで誰にも届いていない、という気づきにくい壊れ方をする。
  const 本体 = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'src', 'JP_WhatsNewModal.js'),
    'utf8'
  );
  const 取る = (名) => {
    const m = 本体.match(new RegExp('const ' + 名 + " = '([^']+)'"));
    assert.ok(m, 'JP_WhatsNewModal.js に ' + 名 + ' が無い');
    return m[1];
  };
  const いまの版 = 取る('NOTICE_VERSION');
  const 配信済み = 取る('最後に配信した版');
  const 版たち = [...本体.matchAll(/版: '([^']+)'/g)].map((m) => m[1]);

  assert.ok(いまの版 >= 配信済み, `版が巻き戻っている: ${いまの版} < ${配信済み}`);
  assert.ok(版たち.includes(いまの版), 'NOTICE_VERSION と同じ版の項目が1つも無い');

  const 未配信 = 版たち.filter((v) => v > 配信済み);
  if (未配信.length > 0) {
    assert.ok(
      いまの版 > 配信済み,
      `配信済みの版(${配信済み})のまま項目を足している。NOTICE_VERSION を上げないと、` +
        '「今後表示しない」を押した人にこのお知らせは出ない'
    );
  }
});
