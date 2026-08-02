/**
 * Library Bridge: documentDirectory_1025.js (expo-file-system/legacy)
 *
 * 元はソースマップから復元された expo-file-system の旧API実装。
 * Expo SDK 55 では新APIが `expo-file-system` の既定エントリになり、
 * 旧API（documentDirectory / writeAsStringAsync / EncodingType 等）は
 * `expo-file-system/legacy` に移動しているため、そちらへ委譲する。
 *
 * 利用箇所: module_1024 経由で JP_SettingsScreen_1023（CSVエクスポート）
 * 使用API : cacheDirectory, writeAsStringAsync, EncodingType.UTF8
 */
"use strict";

module.exports = require('expo-file-system/legacy');
