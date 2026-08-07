/**
 * Library Bridge: default_286.js (react-native / Animated)
 *
 * 元はソースマップから復元された react-native の Animated 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に Animated が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
'use strict';

const { Animated } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Animated;
module.exports.Animated = Animated;
