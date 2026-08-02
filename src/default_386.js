/**
 * Library Bridge: default_386.js (react-native / Modal)
 *
 * 元はソースマップから復元された react-native の Modal 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に Modal が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
"use strict";

const { Modal } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = Modal;
module.exports.Modal = Modal;
