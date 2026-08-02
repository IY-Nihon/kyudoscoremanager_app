/**
 * Library Bridge: default_45.js (react-native / StyleSheet)
 *
 * 元はソースマップから復元された react-native の StyleSheet 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に StyleSheet が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
"use strict";

const { StyleSheet } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = StyleSheet;
module.exports.StyleSheet = StyleSheet;
