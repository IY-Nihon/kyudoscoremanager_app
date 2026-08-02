/**
 * Library Bridge: module_427.js (react/jsx-runtime)
 *
 * 元は react-native-css-interop（NativeWind のランタイム）の JSX ランタイムだった。
 * しかし NativeWind は依存から外れており（package.json に nativewind /
 * react-native-css-interop / tailwindcss いずれも無し、babel.config.js にも
 * プリセット無し）、自作コードでの className 使用も 0 件だったため、
 * この層は全 JSX 呼び出しに挟まるだけの死荷重になっていた。
 *
 * interop の実体も no-op であることを確認済み:
 *   - maybeHijackSafeAreaProvider は `function (t) { return t }`（恒等関数）
 *   - interopComponents は空のため `get(o) ?? o` も恒等
 *
 * 自作コードが使うのは jsx / jsxs / Fragment のみで、react/jsx-runtime と一致する。
 * createElement / createInteropElement は現状どこからも使われていないが、
 * 元モジュールが公開していたため保険として react から補っておく。
 */
"use strict";

const jsxRuntime = require('react/jsx-runtime');
const { createElement } = require('react');

Object.defineProperty(exports, '__esModule', { value: true });
exports.jsx = jsxRuntime.jsx;
exports.jsxs = jsxRuntime.jsxs;
exports.jsxDEV = jsxRuntime.jsxDEV || jsxRuntime.jsx;
exports.Fragment = jsxRuntime.Fragment;
exports.createElement = createElement;
exports.createInteropElement = createElement;
