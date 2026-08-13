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
const { 手順を作る } = require('../src/tutorialSteps');

// 案内の「操作」を、実際のストアの動きに置き換える
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

for (const 役割 of ['group', 'personal']) {
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
  assert.ok(全文('personal').length > 0);
});
