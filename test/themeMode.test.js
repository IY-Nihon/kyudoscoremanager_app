/**
 * 外観（src/theme.js）のモードの読み書きの検査。
 *
 *   npm test
 *
 * 起動すると端末の控えから前に選んだ外観を読む。読みは待たずに進むので、読み終わる前に使う人が
 * 外観を選ぶと、あとから届いた前の値で上書きされていた（他の AI の見直しで見つかった取り合い）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');

/** 端末の置き場を差し替えて theme.js を読み直す。読みはこちらが返すまで待たせる */
function 読み直す(控えの値) {
  const 道 = require.resolve('@react-native-async-storage/async-storage');
  const 元 = require.cache[道];
  let 返す;
  const 待ち = new Promise((解く) => (返す = () => 解く(控えの値)));
  const 書いた = [];
  require.cache[道] = /** @type {any} */ ({
    id: 道,
    filename: 道,
    loaded: true,
    exports: { default: { getItem: () => 待ち, setItem: async (鍵, 値) => void 書いた.push([鍵, 値]) } },
  });
  // 端末の明暗（Appearance）も差し替える。node では react-native そのものは読めない
  const 道RN = require.resolve('react-native');
  const 元RN = require.cache[道RN];
  require.cache[道RN] = /** @type {any} */ ({
    id: 道RN,
    filename: 道RN,
    loaded: true,
    exports: { Appearance: { getColorScheme: () => 'light', addChangeListener: () => ({ remove() {} }) } },
  });
  delete require.cache[require.resolve('../src/theme')];
  const 外観 = require('../src/theme');
  const 戻す = () => {
    if (元) require.cache[道] = 元;
    else delete require.cache[道];
    if (元RN) require.cache[道RN] = 元RN;
    else delete require.cache[道RN];
    delete require.cache[require.resolve('../src/theme')];
  };
  return { 外観, 返す, 待ち, 書いた, 戻す };
}

const 落ち着く = () => new Promise((解く) => setImmediate(解く));

test('控えの読みが遅れて届いても、その前に使う人が選んだ外観で上書きしない', async () => {
  const { 外観, 返す, 待ち, 戻す } = 読み直す('light');
  try {
    外観.initTheme();
    外観.setThemeMode('dark');
    返す();
    await 待ち;
    await 落ち着く();
    assert.strictEqual(外観.getThemeMode(), 'dark');
  } finally {
    戻す();
  }
});

test('選んでいなければ、控えの外観を使う。3 つの外観のどれでもない値は使わない', async () => {
  const 一 = 読み直す('dark');
  try {
    一.外観.initTheme();
    一.返す();
    await 一.待ち;
    await 落ち着く();
    assert.strictEqual(一.外観.getThemeMode(), 'dark');
  } finally {
    一.戻す();
  }
  const 二 = 読み直す('purple');
  try {
    二.外観.initTheme();
    二.返す();
    await 二.待ち;
    await 落ち着く();
    assert.strictEqual(二.外観.getThemeMode(), 'light', '壊れた控えの値を外観にしている');
  } finally {
    二.戻す();
  }
});
