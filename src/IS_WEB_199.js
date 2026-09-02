/**
 * Module ID: 199
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 199;
const m = module;
const _e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
Object.defineProperty(_e, '__esModule', { value: !0 });
Object.defineProperty(_e, 'IS_WEB', {
  enumerable: !0,
  get: function () {
    return e;
  },
});
Object.defineProperty(_e, 'IS_IOS', {
  enumerable: !0,
  get: function () {
    return t;
  },
});
Object.defineProperty(_e, 'WEB_TOP_PADDING', {
  enumerable: !0,
  get: function () {
    return n;
  },
});
Object.defineProperty(_e, 'SAFE_TOP_PADDING', {
  enumerable: !0,
  get: function () {
    return u;
  },
});
Object.defineProperty(_e, 'GEMINI_API_KEY', {
  enumerable: !0,
  get: function () {
    return c;
  },
});
require('./platform');
const e = (() => {
  try {
    return !0;
  } catch (e) {
    return 'undefined' != typeof window;
  }
})();
const t = !e && !1;
const n = 60;
const u = e ? n : 0;
const c = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
