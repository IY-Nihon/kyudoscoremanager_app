/**
 * Library Bridge: module_175.js (zustand)
 *
 * 元はソースマップから復元された zustand 本体（createStore / create / useStore）。
 * package.json に zustand@^5.0.12 があるため npm パッケージへ委譲する。
 *
 * 利用箇所: JP_useScoreStore_174（create でストアを生成）
 * ミドルウェア側は src/combine_201.js が zustand/middleware へ委譲済み。
 */
'use strict';

module.exports = require('zustand');
