/**
 * 使い方の案内（チュートリアル）の検査。
 *
 *   npm test
 *
 * 案内どおりに押していくと、記録表がどういう形になるかを見る。
 * 「間隔」と「計」が隣り合うと外側の鍵は自分の列しか掴まない（仕様）ため、
 * 案内では隣り合わせにしない。順序を入れ替えたときにここで気づけるようにする。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { ストアを用意する } = require('./helpers/storeHarness');
const { 手順を作る, 手が出せない } = require('../src/tutorialSteps');

// 案内の「操作」を、実際のストアの動きに置き換える
// 「部員を増やす」は別画面での登録で、盤面には効かないのでここには要らない
const 押した時の動き = {
  射手を増やす: (s) => s.addArcher(),
  間隔を足す: (s) => s.addSeparator(),
  計を足す: (s) => s.addTotalCalculator(),
  射数を変える: (s) => s.setShotsPerRound(8),
  表示を変える: (s) => s.setViewScale(1.2),
};

// 案内の順に、盤面を変える操作だけを流す
function 案内どおりに押す(役割) {
  const { store } = ストアを用意する();
  store.setState({ isHydrated: true, archers: [], shotsPerRound: 4, members: [] });
  const { 基本, 続き } = 手順を作る(役割);
  for (const 手順 of [...基本, ...続き]) {
    const 動き = 手順.操作 && 押した時の動き[手順.操作.種類];
    if (動き) 動き(store.getState());
  }
  return store.getState().archers;
}

for (const 役割 of ['group', 'member']) {
  test(`案内(${役割})：間隔と計が隣り合わない`, () => {
    const 列 = 案内どおりに押す(役割);
    const 印 = (c) => (c.isSeparator ? '間隔' : c.isTotalCalculator ? '計' : '射手');
    const 並び = 列.map(印);
    for (let i = 1; i < 列.length; i++) {
      const 効く = !列[i - 1].isSeparator && !列[i - 1].isTotalCalculator;
      if (列[i].isSeparator || 列[i].isTotalCalculator) {
        assert.ok(効く, `隣り合っていて鍵が効かない列がある: ${並び.join(' ')}`);
      }
    }
  });

  test(`案内(${役割})：出した鍵はすべて射手を掴む`, () => {
    const 列 = 案内どおりに押す(役割);
    const { store } = ストアを用意する();
    store.setState({
      isHydrated: true,
      shotsPerRound: 4,
      archers: 列.map((c) => Object.assign({}, c, { marks: ['', '', '', ''], lockedBlocks: {} })),
    });
    // 画面が鍵の印を出す条件（JP_ArcherColumnView_594.js の 鍵が効く）と同じ判定
    const 鍵を出す列 = 列.filter((c, i) => {
      if (!c.isSeparator && !c.isTotalCalculator) return false;
      const 右どなり = 列[i - 1];
      return !!(i > 0 && 右どなり && !右どなり.isSeparator && !右どなり.isTotalCalculator);
    });
    assert.ok(鍵を出す列.length > 0, '案内のあいだに鍵の出る列が1つも作られていない');
    for (const c of 鍵を出す列) {
      store.getState().toggleLock(c.id, 0);
      const 掴んだ = store.getState().archers.filter((a) => a.lockedBlocks && a.lockedBlocks[0]);
      assert.ok(
        掴んだ.some((a) => !a.isSeparator && !a.isTotalCalculator),
        `${c.name} の鍵が射手を1人も掴んでいない`
      );
      store.getState().toggleLock(c.id, 0);
    }
  });
}

test('案内：基本の手順だけで、保存まで辿り着ける', () => {
  const { 基本 } = 手順を作る('group');
  const 種類 = 基本.map((h) => h.操作 && h.操作.種類).filter(Boolean);
  assert.ok(種類.includes('射手を増やす'), '射手を足す手順がない');
  assert.ok(種類.includes('○×を入れる'), '○×を入れる手順がない');
});

// 「とばす」があるので、前の手順を踏んでいる保証はない。どこを飛ばしても、
// 次の手順に押すものが在ることを確かめる（在らないと先へ進めなくなる）
const 下ごしらえする = (store, 種類) => {
  if (!種類) return;
  const s = store.getState();
  const 一覧 = s.archers || [];
  const 射手か = (a) => !!a && !a.isSeparator && !a.isTotalCalculator;
  if (種類 === '射手が1人') {
    if (!一覧.some(射手か)) s.addArcher();
    return;
  }
  if (種類 === '鍵が出る形') {
    const 出ている = 一覧.some((a, i) => (a.isSeparator || a.isTotalCalculator) && 射手か(一覧[i - 1]));
    if (出ている) return;
    if (!射手か(一覧[一覧.length - 1])) s.addArcher();
    s.addSeparator();
  }
};

// その手順で「押すもの」が在るか
const 押せるものがある = (store, 手順) => {
  const s = store.getState();
  const 一覧 = s.archers || [];
  const 射手か = (a) => !!a && !a.isSeparator && !a.isTotalCalculator;
  const 種類 = 手順.操作 && 手順.操作.種類;
  if (種類 === '名前を決める' || 種類 === '○×を入れる') return 一覧.some(射手か);
  if (種類 === '鍵をかける')
    return 一覧.some((a, i) => (a.isSeparator || a.isTotalCalculator) && 射手か(一覧[i - 1]));
  return true;
};

for (const 役割 of ['group', 'member']) {
  test(`案内(${役割})：どこを飛ばしても、次の手順に押すものが在る`, () => {
    const { 基本, 続き } = 手順を作る(役割, { 部員数: 3, 記録数: 0 });
    const 全手順 = [...基本, ...続き];

    // 「飛ばし始める場所」を1つずつ変えて、そこから先を全部飛ばす
    for (let 飛ばし始め = 0; 飛ばし始め <= 全手順.length; 飛ばし始め++) {
      const { store } = ストアを用意する();
      store.setState({ isHydrated: true, archers: [], shotsPerRound: 4, members: [] });
      for (let i = 0; i < 全手順.length; i++) {
        const 手順 = 全手順[i];
        下ごしらえする(store, 手順.下ごしらえ);
        assert.ok(
          押せるものがある(store, 手順),
          `${飛ばし始め}番目から飛ばすと、「${手順.題}」で押すものが無い`
        );
        // 飛ばし始め以降は操作しない（＝「とばす」を押した扱い）
        if (i >= 飛ばし始め) continue;
        const 動き = 手順.操作 && 押した時の動き[手順.操作.種類];
        if (動き) 動き(store.getState());
      }
    }
  });
}

// このチュートリアルが本当に要るのは、部員0人の作りたての団体。
// そこで「選択」に誰も出てこないまま止まると、案内の意味がなくなる
test('案内：部員0人の団体は、案内の中で実際に部員を登録できる', () => {
  const { 基本 } = 手順を作る('group', { 部員数: 0, 記録数: 0 });
  const 種類 = 基本.map((h) => h.操作 && h.操作.種類).filter(Boolean);

  const 登録の場所 = 種類.indexOf('部員を増やす');
  const 選択の場所 = 種類.indexOf('名前を決める');
  assert.ok(登録の場所 >= 0, '部員を実際に登録する手順がない（説明だけでは「選択」に誰も出ない）');
  assert.ok(登録の場所 < 選択の場所, '部員の登録は「選択」より前でなければならない');

  // 登録を飛ばした人のために、その場で使える逃げ道を書いておく
  const 選択の文 = 基本.find((h) => h.操作 && h.操作.種類 === '名前を決める').文.join('\n');
  assert.ok(選択の文.includes('ゲスト登録'), '部員がいないときの逃げ道が案内されていない');
});

test('案内：すでに部員がいる団体には、部員の登録を強いない', () => {
  const { 基本 } = 手順を作る('group', { 部員数: 6, 記録数: 0 });
  const 種類 = 基本.map((h) => h.操作 && h.操作.種類).filter(Boolean);
  assert.ok(!種類.includes('部員を増やす'), '部員がいるのに登録させようとしている');
  const 選択の文 = 基本.find((h) => h.操作 && h.操作.種類 === '名前を決める').文.join('\n');
  assert.ok(!選択の文.includes('ゲスト登録'), '部員がいるのにゲスト登録を勧めている');
});

// 「選択」は、部員が全員すでに並んでいると誰も選べない（一覧では灰色の
// 「選択済」になる）。指示どおりに操作できないまま止まらないようにする
test('選択：選べる人がいないときは、操作を求めない', () => {
  const { 基本 } = 手順を作る('group', { 部員数: 1, 記録数: 0 });
  const 選択の手順 = 基本.find((h) => h.操作 && h.操作.種類 === '名前を決める');

  const 部員 = [{ id: 'm1', name: '山田 太郎' }];
  assert.equal(
    手が出せない(選択の手順, { members: 部員, archers: [{ id: 'a1', memberId: 'm1' }, { id: 'a2' }] }),
    true,
    '1人しかいない部員がもう並んでいるのに、選べと言っている'
  );
  assert.equal(
    手が出せない(選択の手順, { members: 部員, archers: [{ id: 'a1' }] }),
    false,
    'まだ割り当てていないのに、操作を取り上げている'
  );
  // 卒業生も選べる相手に数える
  assert.equal(
    手が出せない(選択の手順, {
      members: 部員,
      alumni: [{ id: 'x1', name: '卒業生1' }],
      archers: [{ id: 'a1', memberId: 'm1' }],
    }),
    false,
    '卒業生が選べるのに、操作を取り上げている'
  );
  // 部員が1人もいない団体は、ゲスト登録という手が残るので取り上げない…
  // わけではなく、選べる相手がいないので説明だけにする
  assert.equal(手が出せない(選択の手順, { members: [], archers: [{ id: 'a1' }] }), true);

  // 関係のない手順には効かない
  const 人の手順 = 基本.find((h) => h.操作 && h.操作.種類 === '射手を増やす');
  assert.equal(手が出せない(人の手順, { members: [], archers: [] }), false);
});

// 設定の「使い方を見る」からは、すでに使い込んだ人も開く。
// 「まだ1人もいません」「いまは空です」が事実と違って出ないようにする
test('案内：すでに部員や記録があるときは「まだ無い」と言わない', () => {
  const 全文 = (役割, 手持ち) => {
    const { 基本, 続き } = 手順を作る(役割, 手持ち);
    return [...基本, ...続き].flatMap((h) => [h.題, ...(h.文 || [])]).join('\n');
  };

  const 空 = 全文('group', { 部員数: 0, 記録数: 0 });
  assert.ok(空.includes('まだ部員が1人も登録されていません。'), '空のときは今までどおり案内する');
  assert.ok(空.includes('まだ保存していないので、いまは空です。'));

  const 使用中 = 全文('group', { 部員数: 6, 記録数: 12 });
  assert.ok(!使用中.includes('まだ部員が1人も登録されていません。'), '部員がいるのに「1人もいない」と出た');
  assert.ok(!使用中.includes('まだ保存していないので、いまは空です。'), '記録があるのに「空」と出た');
  assert.ok(使用中.includes('いま6人が登録されています。'));
  assert.ok(使用中.includes('いま12件たまっています。'));

  // 省略しても落ちない（空とみなす）
  assert.ok(全文('member').length > 0);
});
