/**
 * Library Bridge: AntDesign_600.js (@expo/vector-icons)
 *
 * 元はソースマップから復元された @expo/vector-icons のバレルファイルで、
 * 全アイコンセットとグリフマップ（module_671 の 182KB 等）を抱えていた。
 * package.json に @expo/vector-icons があるため npm パッケージへ委譲する。
 *
 * 利用箇所: 14ファイル
 * 使用API : Ionicons, MaterialCommunityIcons のみ
 *           （src/ArrowLocationPopover.js は既に直接 import しており動作実績あり）
 */
'use strict';

module.exports = require('@expo/vector-icons');
