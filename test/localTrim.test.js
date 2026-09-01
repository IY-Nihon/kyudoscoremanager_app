/**
 * 端末に残す記録の選び方（src/localTrim.js）。
 *
 *   npm test
 *
 * 唯一の禁じ手は「まだ雲へ送れていない記録を落とすこと」。
 * 落とすとその練習ぶんがどこにも無くなるので、そこを重点的に見る。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { 端末に残す記録, 送れていないか, 新しさ, 外した数, 記録の予算 } = require('../src/localTrim');

/** だいたい 1KB の記録を作る */
const 記録 = (o) =>
  Object.assign(
    {
      id: 'x',
      lastModified: 1000,
      詰め物: 'あ'.repeat(300),
    },
    o
  );

test('送れていない記録は、予算を超えても落とさない', () => {
  // ここが崩れると、その練習ぶんがどこにも無くなる
  const 一覧 = [];
  for (let i = 0; i < 50; i++) 一覧.push(記録({ id: 'ふるい' + i, lastModified: 1000 + i }));
  一覧.push(記録({ id: 'まだ送っていない', lastModified: 1, syncStatus: '未同期' }));

  const 残り = 端末に残す記録(一覧, { 最後に送った時刻: 99999, 予算: 100 });
  assert.ok(
    残り.some((x) => x.id === 'まだ送っていない'),
    '送れていない記録が落ちている'
  );
});

test('送った時刻より後に触った記録も落とさない', () => {
  // syncStatus が付かない道（一括の同期）でも拾えること
  const 一覧 = [
    記録({ id: '送り済み', lastModified: 100 }),
    記録({ id: 'あとで触った', lastModified: 900 }),
  ];
  const 残り = 端末に残す記録(一覧, { 最後に送った時刻: 500, 予算: 0 });
  assert.deepStrictEqual(
    残り.map((x) => x.id),
    ['あとで触った'],
    '送った時刻より後の記録が落ちている'
  );
});

test('予算に収まるぶんは、新しい順に残す', () => {
  // 件数を決め打ちしない。1件の目方は中身で少し変わるので、
  // 「予算に収まっている」「残ったのは新しい側」の2つで見る
  const 一覧 = [];
  for (let i = 0; i < 20; i++)
    一覧.push(記録({ id: 'k' + String(i).padStart(2, '0'), lastModified: 1000 + i }));
  const 一件 = JSON.stringify(一覧[0]).length;
  const 予算 = 一件 * 5;

  const 残り = 端末に残す記録(一覧, { 最後に送った時刻: 99999, 予算 });
  const 目方の合計 = 残り.reduce((n, x) => n + JSON.stringify(x).length, 0);
  assert.ok(目方の合計 <= 予算, '予算を超えている: ' + 目方の合計 + ' > ' + 予算);
  assert.ok(残り.length >= 4 && 残り.length <= 5, '残った数がおかしい: ' + 残り.length);

  // 残ったのは新しい側だけ。古いものが混じっていないこと
  const いちばん古い残り = Math.min(...残り.map((x) => x.lastModified));
  const 落ちたなかで新しいの = Math.max(
    ...一覧.filter((x) => !残り.includes(x)).map((x) => x.lastModified)
  );
  assert.ok(
    いちばん古い残り > 落ちたなかで新しいの,
    '古い記録を残して新しい記録を落としている'
  );
});

test('並び順は元のまま返す', () => {
  // 画面が並べ直す前提なので、ここで順を変えない
  const 一覧 = [
    記録({ id: 'a', lastModified: 3 }),
    記録({ id: 'b', lastModified: 1 }),
    記録({ id: 'c', lastModified: 2 }),
  ];
  const 残り = 端末に残す記録(一覧, { 最後に送った時刻: 99999, 予算: 記録の予算 });
  assert.deepStrictEqual(残り.map((x) => x.id), ['a', 'b', 'c']);
});

test('予算に収まるなら、何も落とさない', () => {
  const 一覧 = [記録({ id: 'a' }), 記録({ id: 'b' })];
  const 残り = 端末に残す記録(一覧, { 最後に送った時刻: 99999 });
  assert.strictEqual(残り.length, 2);
  assert.strictEqual(外した数(一覧, 残り), 0);
});

test('中身が欠けていても落ちない', () => {
  assert.deepStrictEqual(端末に残す記録(null), []);
  assert.deepStrictEqual(端末に残す記録(undefined), []);
  assert.deepStrictEqual(端末に残す記録([]), []);
  assert.doesNotThrow(() => 端末に残す記録([null, undefined, {}], { 予算: 10 }));
});

test('送れていないかの見分け', () => {
  assert.strictEqual(送れていないか({ syncStatus: '未同期' }, 999), true);
  assert.strictEqual(送れていないか({ lastModified: 100 }, 50), true);
  assert.strictEqual(送れていないか({ lastModified: 100 }, 200), false);
  assert.strictEqual(送れていないか(null, 0), false);
});

test('新しさは日付の文字列からも読む', () => {
  assert.strictEqual(新しさ({ lastModified: 500 }), 500);
  assert.strictEqual(新しさ({ date: '2026-08-30' }), Date.parse('2026-08-30'));
  assert.strictEqual(新しさ({}), 0);
  assert.strictEqual(新しさ({ date: 'でたらめ' }), 0);
});

test('本番並みの量でも、予算のうちに収まる', () => {
  // 本番の最大の団体は 110件で 2.2MB。予算に収めたあとの大きさを見る
  const 一覧 = [];
  for (let i = 0; i < 110; i++)
    一覧.push({ id: 'r' + i, lastModified: i, archers: 詰めた射手(32) });
  const 元の大きさ = JSON.stringify(一覧).length;
  assert.ok(元の大きさ > 1800000, '前提：2MB近くある（' + 元の大きさ + '）');

  const 残り = 端末に残す記録(一覧, { 最後に送った時刻: 99999 });
  const 後の大きさ = JSON.stringify(残り).length;
  assert.ok(後の大きさ <= 記録の予算, '予算を超えている: ' + 後の大きさ);
  assert.ok(残り.length > 0, '全部落ちている');
});

function 詰めた射手(人数) {
  const 出 = [];
  for (let i = 0; i < 人数; i++)
    出.push({
      id: '00000000-0000-4000-8000-00000000000' + (i % 10),
      memberId: '11111111-1111-4111-8111-11111111111' + (i % 10),
      name: '射手',
      marks: ['○', '☓', '○', '', '○', '☓', '', '○'],
      arrowLocations: [null, null, null, null, null, null, null, null],
      lockedBlocks: { 0: true, 1: false },
      substitutions: {},
      substitutionIds: {},
      lastModified: 1000,
      // 実測では射手1人あたり495バイト。そこへ寄せる
      詰め物: 'x'.repeat(200),
    });
  return 出;
}

// ── ストアに組み込んだあとの振る舞い ──────────────────────
// 端末に残すのを絞っても、画面が持っている記録（記憶の中）は減らないこと。
// 減らすと、いま見ている一覧から古い記録が消える

const { ストアを用意する, 待つ } = require('./helpers/storeHarness');

test('端末を絞っても、画面の記録は減らない', async () => {
  const { store, 保存領域 } = ストアを用意する();
  const 記録たち = [];
  for (let i = 0; i < 200; i++)
    記録たち.push({
      id: 'r' + i,
      title: '練習' + i,
      lastModified: 1000 + i,
      archers: [{ id: 'a', marks: ['○'], 詰め物: 'x'.repeat(9000) }],
    });
  store.setState({ isHydrated: true, activeGroupId: '100001', lastSyncTime: 99999999, sessions: 記録たち });
  await 待つ(30);

  assert.strictEqual(store.getState().sessions.length, 200, '画面の記録が減っている');

  const 控え = 保存領域.get('archery-score-storage');
  assert.ok(控え, '端末に控えが書かれていない');
  const 残った = JSON.parse(控え).state.sessions;
  assert.ok(残った.length < 200, '端末の控えが絞られていない');
  assert.ok(控え.length < 3000000, '端末の控えが大きすぎる: ' + 控え.length);
});

test('送れていない記録は、端末の控えにも必ず残る', async () => {
  const { store, 保存領域 } = ストアを用意する();
  const 記録たち = [];
  for (let i = 0; i < 200; i++)
    記録たち.push({
      id: 'r' + i,
      lastModified: 1000 + i,
      archers: [{ id: 'a', 詰め物: 'x'.repeat(9000) }],
    });
  // いちばん古いものを「まだ送れていない」にする
  記録たち[0] = Object.assign({}, 記録たち[0], { syncStatus: '未同期' });
  store.setState({ isHydrated: true, activeGroupId: '100001', lastSyncTime: 99999999, sessions: 記録たち });
  await 待つ(30);

  const 残った = JSON.parse(保存領域.get('archery-score-storage')).state.sessions;
  assert.ok(
    残った.some((x) => x.id === 'r0'),
    '送れていない記録が端末の控えから落ちている'
  );
});

// ── 目方を覚えておくこと ────────────────────────────────
// 保存のたびに全部を JSON にすると、110件で1回8.6ミリ秒かかっていた。
// ライブ中は○×のたびに保存が走るので、遅い端末では反応が鈍る

test('覚えていても、答えは変わらない', () => {
  const 一覧 = [];
  for (let i = 0; i < 40; i++) 一覧.push(記録({ id: 'k' + i, lastModified: 1000 + i }));
  const 予算 = JSON.stringify(一覧[0]).length * 5;
  const 一回目 = 端末に残す記録(一覧, { 最後に送った時刻: 99999, 予算 });
  const 二回目 = 端末に残す記録(一覧, { 最後に送った時刻: 99999, 予算 });
  assert.deepStrictEqual(二回目.map((x) => x.id), 一回目.map((x) => x.id));
});

test('書き換えた記録は、測り直す', () => {
  // 入れ物ごと覚えているので、中身が変わったら別の入れ物になり測り直される。
  // 測り直さないと、大きくなった記録を小さいと思い込んで予算を超える
  const 小さい = 記録({ id: 'a', lastModified: 2000 });
  const 一覧 = [小さい, 記録({ id: 'b', lastModified: 1000 })];
  const 予算 = JSON.stringify(小さい).length * 2 + 50;
  assert.strictEqual(端末に残す記録(一覧, { 最後に送った時刻: 99999, 予算 }).length, 2, '前提：2件とも入る');

  // a を大きく書き換える（別の入れ物になる）
  const 大きい = Object.assign({}, 小さい, { 詰め物: 'あ'.repeat(5000) });
  const 新しい一覧 = [大きい, 一覧[1]];
  const 残り = 端末に残す記録(新しい一覧, { 最後に送った時刻: 99999, 予算 });
  assert.ok(残り.length < 2, '大きくなった記録を測り直していない');
});

test('件数が少ないうちは、そのまま返す', () => {
  // 測るまでもなく予算に収まる。ここで測ると、ほとんどの利用者に無駄が乗る
  const 一覧 = [記録({ id: 'a' }), 記録({ id: 'b' })];
  const 出 = 端末に残す記録(一覧, { 最後に送った時刻: 99999 });
  assert.strictEqual(出, 一覧, '同じ入れ物をそのまま返していない（作り直している）');
});
