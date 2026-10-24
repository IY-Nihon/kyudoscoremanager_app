/**
 * 一意の番号を作る。crypto.randomUUID があればそれを使う。
 */
'use strict';

const generateUUID = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (字) => {
        const 乱数 = (16 * Math.random()) | 0;
        return (字 === 'x' ? 乱数 : (3 & 乱数) | 8).toString(16);
      });

Object.defineProperty(exports, '__esModule', { value: true });
exports.generateUUID = generateUUID;
