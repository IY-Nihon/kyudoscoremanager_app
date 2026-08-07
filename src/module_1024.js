/**
 * Library Bridge: module_1024.js (expo-file-system/legacy)
 *
 * 元はソースマップから復元された expo-file-system の index で、
 * documentDirectory_1025（本体）と module_1028（型定義：FileSystemSessionType /
 * FileSystemUploadType / EncodingType 等）をまとめて再エクスポートしていた。
 *
 * Expo SDK 55 では旧APIが expo-file-system/legacy へ移動しており、
 * legacy/index.ts が FileSystem と FileSystem.types の両方を re-export するため、
 * この1ファイルで元の合成と同じ内容になる。
 *
 * 利用箇所: JP_SettingsScreen_1023（CSVエクスポート）
 * 使用API : cacheDirectory, writeAsStringAsync, EncodingType.UTF8
 */
'use strict';

module.exports = require('expo-file-system/legacy');
