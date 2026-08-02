/**
 * Library Bridge: default_371.js (react-native / Keyboard)
 *
 * 元はソースマップから復元された react-native の Keyboard 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に Keyboard が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
"use strict";

const { Keyboard } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Keyboard;
module.exports.Keyboard = Keyboard;
