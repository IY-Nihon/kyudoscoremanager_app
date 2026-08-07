/**
 * Library Bridge: v_197.js (firebase/app-check)
 *
 * 元はソースマップから復元された Firebase App Check の実装で、
 * @firebase/util・@firebase/component 等の内部モジュールを引き連れていた。
 * package.json に firebase@9.23.0 があるため npm パッケージへ委譲する。
 *
 * 利用箇所: module_196 経由で setupAppCheck_195 が require（副作用のみ）。
 *           setupAppCheck 自体は ReCAPTCHA キー未設定のため無効化されている。
 */
'use strict';

module.exports = require('firebase/app-check');
