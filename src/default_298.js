/**
 * Library Bridge: default_298.js (react-native / Dimensions)
 *
 * 元はソースマップから復元された react-native の Dimensions 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に Dimensions が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
"use strict";

const { Dimensions } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Dimensions;
module.exports.Dimensions = Dimensions;
