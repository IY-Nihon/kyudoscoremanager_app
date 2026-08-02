/**
 * Library Bridge: module_427.js (react/jsx-runtime) + ダークモード変換
 *
 * ■ 元の正体
 * react-native-css-interop（NativeWind のランタイム）の JSX ランタイムだった。
 * しかし NativeWind は依存から外れており（package.json に nativewind /
 * react-native-css-interop / tailwindcss いずれも無し、babel.config.js にも
 * プリセット無し）、自作コードでの className 使用も 0 件。
 * interop の実体も no-op（maybeHijackSafeAreaProvider は恒等関数、
 * interopComponents が空）だったため、react/jsx-runtime へ置き換えた。
 *
 * ■ ここでテーマ変換を行う理由
 * 自作コードのカラーリテラルは半分以上が JSX 内のインライン指定
 * （style={{ color: '#8E8E93' }} や <Ionicons color="#007AFF" /> など）で、
 * StyleSheet.create の差し替えだけでは色が半分しか変わらない。
 * jsx / jsxs は描画のたびに呼ばれるため、ここで props を変換すれば
 * テーマ切替がそのまま画面へ反映される。
 *
 * ライトモード時は theme.mapProps が引数をそのまま返すので実質ノーコスト。
 */
"use strict";

const jsxRuntime = require('react/jsx-runtime');
const { createElement } = require('react');
const theme = require('./theme');

const wrap = (fn) =>
  function themedJsx(type, props, key) {
    return fn(type, theme.mapProps(props), key);
  };

Object.defineProperty(exports, '__esModule', { value: true });
exports.jsx = wrap(jsxRuntime.jsx);
exports.jsxs = wrap(jsxRuntime.jsxs);
exports.jsxDEV = wrap(jsxRuntime.jsxDEV || jsxRuntime.jsx);
exports.Fragment = jsxRuntime.Fragment;
exports.createElement = createElement;
exports.createInteropElement = createElement;
