/**
 * Library Bridge: default_217.js (react-native / Text) + ダークモードの既定文字色
 *
 * 元はソースマップから復元された react-native の Text 実装。
 * Web ビルドでは Metro が react-native-web へ解決する。
 *
 * ■ ラップしている理由
 * 色を明示していない <Text> は react-native-web が既定色（黒）を当てるため、
 * ダークモードでは暗い背景に黒文字となって読めなくなる。
 * CSS の継承ではなく Text 自身のスタイルで黒が入るので、親側では救えない。
 * そこで既定色をスタイル配列の先頭に差し込む。
 * 呼び出し側の style は後ろに置くため、明示指定は従来どおり優先される。
 */
"use strict";

const React = require('react');
const { Text } = require('react-native');
const theme = require('./theme');

const DARK_LABEL = { color: '#FFFFFF' };

const ThemedText = React.forwardRef(function ThemedText(props, ref) {
  if (!theme.isDark()) return React.createElement(Text, Object.assign({ ref }, props));
  const style = props.style == null ? DARK_LABEL : [DARK_LABEL, props.style];
  return React.createElement(Text, Object.assign({ ref }, props, { style }));
});
ThemedText.displayName = 'Text';

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = ThemedText;
module.exports.Text = ThemedText;
