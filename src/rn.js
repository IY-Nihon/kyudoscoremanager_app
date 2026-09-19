/**
 * react-native の部品を、ここ 1 か所から取る。
 *
 *   const { View, Text, StyleSheet } = require('./rn');
 *
 * ■ なぜ直接 require('react-native') しないか
 * ダークモードのため、素のままでは困る部品が 3 つある：
 *   Text / TextInput … 色を書いていない字は react-native-web が黒を当てるので、暗い
 *                      背景で読めなくなる。CSS の継承ではなく Text 自身のスタイルで黒が
 *                      入るので親では救えない。既定の文字色をスタイルの先頭に差し込む
 *                      （呼び出し側の style は後ろなので、明示した色は従来どおり勝つ）
 *   StyleSheet       … create() の結果をゲッターにして、描く時点の配色で変換する。
 *                      react-native-web の create は呼んだ時点で色を確定させてしまい、
 *                      あとから切り替えに追従できない。RN 0.76 以降 create() は実質
 *                      恒等関数なので、素のオブジェクトを style に渡すのは正当
 * Alert も素のものは使わない。ブラウザでは何も出ないので、アプリの中の窓（AppDialog）へ流す。
 *
 * それ以外は react-native のものをそのまま通す。遅延の getter なので、使わない部品は
 * 読み込まれない。以前は部品ごとに View.js Text.js … と 18 個の橋渡しファイルがあった
 * （ソースマップから復元したときの名残）。2026-09-19 にここ 1 つにまとめた。
 *
 * 色の変換そのものは src/theme.js。JSX のインライン指定（style={{ color }} など）は
 * babel の jsxImportSource（src/theme-runtime）が変換する。ライトモードでは
 * どちらも引数をそのまま返すので、費用はほぼ無い。
 *
 * theme.js はここを使わない（こちらが theme.js を使うので、逆向きにすると輪になる）。
 * useScoreStore.js も画面に触れないので、AppState だけ素の react-native から取る。
 */
'use strict';

const RN = require('react-native');
const React = require('react');
const theme = require('./theme');

const 暗い字 = { color: '#FFFFFF' };
const 暗い書き入れの薄字 = '#8E8E93';

const Text = React.forwardRef(function Text(props, ref) {
  if (!theme.isDark()) return React.createElement(RN.Text, Object.assign({ ref }, props));
  const style = props.style == null ? 暗い字 : [暗い字, props.style];
  return React.createElement(RN.Text, Object.assign({ ref }, props, { style }));
});
Text.displayName = 'Text';

const TextInput = React.forwardRef(function TextInput(props, ref) {
  if (!theme.isDark()) return React.createElement(RN.TextInput, Object.assign({ ref }, props));
  const style = props.style == null ? 暗い字 : [暗い字, props.style];
  const 足す = { style };
  // placeholder も未指定だとブラウザ既定の濃い灰色になり、暗い背景で沈む
  if (props.placeholderTextColor == null) 足す.placeholderTextColor = 暗い書き入れの薄字;
  return React.createElement(RN.TextInput, Object.assign({ ref }, props, 足す));
});
TextInput.displayName = 'TextInput';

const StyleSheet = Object.create(RN.StyleSheet);
StyleSheet.create = function create(styles) {
  const 出 = {};
  for (const 鍵 of Object.keys(styles)) {
    const 値 = styles[鍵];
    Object.defineProperty(出, 鍵, {
      enumerable: true,
      configurable: true,
      get() {
        return theme.mapStyle(値);
      },
    });
  }
  return 出;
};

const 差し替え = { Text, TextInput, StyleSheet, Alert: require('./alertBridge').default };

for (const 名 of Object.keys(RN)) {
  if (名 in 差し替え) continue;
  Object.defineProperty(exports, 名, { enumerable: true, get: () => RN[名] });
}
Object.assign(exports, 差し替え);
