/**
 * Library Bridge: module_1029.js (expo-sharing)
 *
 * 元はソースマップから復元された expo-sharing の index。
 * package.json に expo-sharing@~55.0.18 があるため npm パッケージへ委譲する。
 *
 * 復元コードのエクスポート（isAvailableAsync / shareAsync / getSharedPayloads /
 * getResolvedSharedPayloadsAsync / clearSharedPayloads / useIncomingShare）が
 * npm 版に全て存在することを確認済み。
 *
 * 利用箇所: JP_SettingsScreen_1023（CSVエクスポートの共有）
 */
"use strict";

module.exports = require('expo-sharing');
