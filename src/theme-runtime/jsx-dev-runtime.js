/**
 * 開発ビルド用の JSX ランタイム（jsx-runtime.js と対になる）
 * 詳細は同フォルダの jsx-runtime.js を参照。
 */
"use strict";

const devRuntime = require('react/jsx-dev-runtime');
const theme = require('../theme');

exports.Fragment = devRuntime.Fragment;
exports.jsxDEV = function jsxDEV(type, props, key, isStaticChildren, source, self) {
  return devRuntime.jsxDEV(type, theme.mapProps(props), key, isStaticChildren, source, self);
};
