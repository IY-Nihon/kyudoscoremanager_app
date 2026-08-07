/**
 * Module ID: 693
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 693;
const m = module;
const e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
(Object.defineProperty(e, '__esModule', { value: !0 }),
  Object.defineProperty(e, 'newArcher', {
    enumerable: !0,
    get: function () {
      return n;
    },
  }),
  Object.defineProperty(e, 'newSeparator', {
    enumerable: !0,
    get: function () {
      return o;
    },
  }),
  Object.defineProperty(e, 'newTotalCalculator', {
    enumerable: !0,
    get: function () {
      return l;
    },
  }));
var t = require('./module_200');
const n = (n) => ({
    id: (0, t.generateUUID)(),
    name: '',
    gender: '未設定',
    grade: 1,
    marks: Array(n).fill(''),
    isSeparator: !1,
    isTotalCalculator: !1,
    isGuest: !1,
    lockedBlocks: {},
    lastModified: 0,
  }),
  o = () => ({
    id: (0, t.generateUUID)(),
    name: '',
    gender: '未設定',
    grade: 0,
    marks: [],
    isSeparator: !0,
    isTotalCalculator: !1,
    isGuest: !1,
    lockedBlocks: {},
    lastModified: 0,
  }),
  l = (n) => ({
    id: (0, t.generateUUID)(),
    name: '計',
    gender: '未設定',
    grade: 0,
    marks: Array(n).fill(''),
    isSeparator: !1,
    isTotalCalculator: !0,
    isGuest: !1,
    lockedBlocks: {},
    lastModified: 0,
  });
