/**
 * 一意の番号を作る。crypto.randomUUID があればそれを使う。
 *
 * （ソースマップからの復元時は module_200.js という名前だった）
 */
'use strict';

const generateUUID = () =>
  'undefined' != typeof crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (字) => {
        const 乱数 = (16 * Math.random()) | 0;
        return ('x' === 字 ? 乱数 : (3 & 乱数) | 8).toString(16);
      });

Object.defineProperty(exports, '__esModule', { value: true });
exports.generateUUID = generateUUID;
