/**
 * 立の行（射手・区切り・合計）の雛形を作る。
 *
 * （ソースマップからの復元時は module_693.js という名前だった）
 */
'use strict';

const { generateUUID } = require('./uuid');
const newArcher = (n) => ({
  id: generateUUID(),
  name: '',
  gender: '未設定',
  grade: 1,
  marks: Array(n).fill(''),
  isSeparator: false,
  isTotalCalculator: false,
  isGuest: false,
  lockedBlocks: {},
  lastModified: 0,
});
const newSeparator = () => ({
  id: generateUUID(),
  name: '',
  gender: '未設定',
  grade: 0,
  marks: [],
  isSeparator: true,
  isTotalCalculator: false,
  isGuest: false,
  lockedBlocks: {},
  lastModified: 0,
});
const newTotalCalculator = (n) => ({
  id: generateUUID(),
  name: '計',
  gender: '未設定',
  grade: 0,
  marks: Array(n).fill(''),
  isSeparator: false,
  isTotalCalculator: true,
  isGuest: false,
  lockedBlocks: {},
  lastModified: 0,
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.newArcher = newArcher;
exports.newSeparator = newSeparator;
exports.newTotalCalculator = newTotalCalculator;
