/**
 * Library Bridge: default_380.js (react-native / ActivityIndicator)
 *
 * 元はソースマップから復元された react-native の ActivityIndicator 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に ActivityIndicator が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
"use strict";

const { ActivityIndicator } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = ActivityIndicator;
module.exports.ActivityIndicator = ActivityIndicator;
