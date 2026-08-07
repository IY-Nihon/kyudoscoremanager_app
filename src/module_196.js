/**
 * Module ID: 196
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 196;
const m = module;
const e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
Object.defineProperty(e, '__esModule', { value: !0 });
var t = require('./v_197');
Object.keys(t).forEach(function (n) {
  'default' === n ||
    Object.prototype.hasOwnProperty.call(e, n) ||
    Object.defineProperty(e, n, {
      enumerable: !0,
      get: function () {
        return t[n];
      },
    });
});
