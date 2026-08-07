/**
 * Library Bridge: default_406.js (react-native / TouchableWithoutFeedback)
 *
 * 元はソースマップから復元された react-native の TouchableWithoutFeedback 実装。
 * Web ビルドでは Metro が react-native-web へ解決する（両方に TouchableWithoutFeedback が存在することを確認済み）。
 *
 * 利用側は default import（`X.default`）で参照するため、__esModule + default を明示する。
 */
'use strict';

const { TouchableWithoutFeedback } = require('react-native');

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = TouchableWithoutFeedback;
module.exports.TouchableWithoutFeedback = TouchableWithoutFeedback;
