/**
 * Library Bridge: default_208.js (@react-native-community/netinfo)
 *
 * 元はソースマップから復元された NetInfo の実装。
 * 長らく package.json に無い「隠れ依存」だったが、
 * npx expo install で SDK55 互換の 11.5.2 を正式な依存として追加したため委譲する。
 *
 * 利用箇所: JP_useScoreStore_174（setupNetworkListener）
 * 使用API : default.addEventListener
 */
'use strict';

module.exports = require('@react-native-community/netinfo');
