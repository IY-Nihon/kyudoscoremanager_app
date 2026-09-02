/**
 * テーマ変換を挟む JSX ランタイム
 *
 * babel.config.js の jsxImportSource でこのフォルダを指定しているため、
 * プロジェクト内の **すべての** JSX がここを通る。
 * これにより、手書きファイル（JP_OCRRecordModal / JP_WhatsNewModal /
 * ArrowLocationPopover など、復元コードの themedJsx を経由しないもの）の
 * インラインスタイルもダークモードの対象になる。
 *
 * ライトモード時 mapProps は引数をそのまま返すため、実質ノーコスト。
 */
"use strict";

const runtime = require('react/jsx-runtime');
const theme = require('../theme');

exports.Fragment = runtime.Fragment;
exports.jsx = function jsx(type, props, key) {
  return runtime.jsx(type, theme.mapProps(props), key);
};
exports.jsxs = function jsxs(type, props, key) {
  return runtime.jsxs(type, theme.mapProps(props), key);
};
