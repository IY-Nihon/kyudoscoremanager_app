/**
 * Library Bridge: SafeAreaView.js (react-native / SafeAreaView)
 *
 * 元はソースマップから復元された react-native の SafeAreaView 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に SafeAreaView が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
'use strict';

const { SafeAreaView } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = SafeAreaView;
module.exports.SafeAreaView = SafeAreaView;
