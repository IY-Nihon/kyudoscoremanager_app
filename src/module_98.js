/**
 * Library Bridge: module_98.js (react-native / Platform)
 *
 * 元はソースマップから復元された react-native の Platform 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に Platform が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
'use strict';

const { Platform } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Platform;
module.exports.Platform = Platform;
