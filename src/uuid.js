/**
 * 一意の番号を作る。crypto.randomUUID があればそれを使う。
 *
 * （ソースマップからの復元時は module_200.js という名前だった）
 */
'use strict';

const e = exports;

('use strict');
(Object.defineProperty(e, '__esModule', { value: !0 }),
  Object.defineProperty(e, 'generateUUID', {
    enumerable: !0,
    get: function () {
      return x;
    },
  }));
const x = () =>
  'undefined' != typeof crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (x) => {
        const t = (16 * Math.random()) | 0;
        return ('x' === x ? t : (3 & t) | 8).toString(16);
      });
