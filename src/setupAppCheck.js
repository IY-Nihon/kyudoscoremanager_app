/**
 * App Check の用意。いまは ReCAPTCHA の鍵が無いので、何もしない
 * （公開中の方針が謳っているぶんは、配信後に実装する約束になっている）。
 *
 * （ソースマップからの復元時は module_195.js という名前だった）
 */
'use strict';

const setupAppCheck = (firebaseApp) => {
  try {
    console.log('[AppCheck] Initialized for Web (Disabled due to missing ReCAPTCHA key)');
  } catch (誤り) {
    console.warn('[AppCheck] Web initialization failed:', 誤り);
  }
};

Object.defineProperty(exports, '__esModule', { value: true });
exports.setupAppCheck = setupAppCheck;
