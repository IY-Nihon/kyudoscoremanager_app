/**
 * Library Bridge: default_398.js (react-native / TextInput) + ダークモードの既定文字色
 *
 * 元はソースマップから復元された react-native の TextInput 実装。
 * Web ビルドでは Metro が react-native-web へ解決する。
 *
 * ■ ラップしている理由（default_217.js の Text と同じ事情）
 * 色を明示していない <TextInput> は react-native-web が既定色（黒）を当てるため、
 * ダークモードでは暗い入力欄に黒文字となって入力内容が見えなくなる。
 * CSS の継承ではなく TextInput 自身のスタイルで黒が入るので親側では救えない。
 * そこで既定色をスタイル配列の先頭に差し込む。
 * 呼び出し側の style は後ろに置くため、明示指定は従来どおり優先される。
 *
 * placeholderTextColor も未指定だとブラウザ既定の濃いグレーになり
 * 暗い背景で沈むため、既定値を与えている。
 */
"use strict";

const React = require('react');
const { TextInput } = require('react-native');
const theme = require('./theme');

const DARK_INPUT = { color: '#FFFFFF' };
const DARK_PLACEHOLDER = '#8E8E93';

const ThemedTextInput = React.forwardRef(function ThemedTextInput(props, ref) {
  if (!theme.isDark()) return React.createElement(TextInput, Object.assign({ ref }, props));
  const style = props.style == null ? DARK_INPUT : [DARK_INPUT, props.style];
  const extra = { style };
  if (props.placeholderTextColor == null) extra.placeholderTextColor = DARK_PLACEHOLDER;
  return React.createElement(TextInput, Object.assign({ ref }, props, extra));
});
ThemedTextInput.displayName = 'TextInput';

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = ThemedTextInput;
module.exports.TextInput = ThemedTextInput;
