/**
 * Library Bridge: FlatList.js (react-native / FlatList)
 *
 * 元はソースマップから復元された react-native の FlatList 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に FlatList が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
'use strict';

const { FlatList } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = FlatList;
module.exports.FlatList = FlatList;
