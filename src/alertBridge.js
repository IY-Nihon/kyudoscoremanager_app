/**
 * Alert を、ブラウザの窓ではなくアプリの中の窓（AppDialog）へ流す橋渡し。
 *
 * （ソースマップからの復元時は module_198.js という名前だった）
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 198;
const m = module;
const e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
(Object.defineProperty(e, '__esModule', { value: !0 }),
  Object.defineProperty(e, 'default', {
    enumerable: !0,
    get: function () {
      return t;
    },
  }));
var t = class {
  // ブラウザの窓ではなく、アプリの中の窓へ流す（src/AppDialog.js）。
  // 見た目が揃い、出る位置も機種に左右されない。
  // 呼び方はこれまでと同じなので、呼び出し側は書き換えなくてよい
  static alert(title, message, buttons) {
    require('./AppDialog').出す(title, message, buttons);
  }
};
