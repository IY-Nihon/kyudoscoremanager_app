/**
 * 部員の表示名を作る。同じ姓の人が複数いるときだけ、名の頭文字を足す。
 *
 * （ソースマップからの復元時は module_687.js という名前だった）
 */
'use strict';

const g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const r = require;
const i = typeof metroImport !== 'undefined' ? metroImport : undefined;
const a = typeof id !== 'undefined' ? id : 687;
const _m = module;
const e = exports;
const d = typeof dependencyMap !== 'undefined' ? dependencyMap : [];

('use strict');
(Object.defineProperty(e, '__esModule', { value: !0 }),
  Object.defineProperty(e, 'formatMemberName', {
    enumerable: !0,
    get: function () {
      return t;
    },
  }));
const t = (t, n) => {
  if (!t) return '';
  const u = t.trim().split(/[\s\u3000]+/),
    s = u[0],
    c = u.length > 1 ? u.slice(1).join('') : '';
  if (
    !!(n && n.length > 0) &&
    n.filter((t) => {
      if (!t.name) return !1;
      return t.name.trim().split(/[\s\u3000]+/)[0] === s;
    }).length > 1 &&
    c
  ) {
    const t = c.trim().charAt(0);
    return t ? `${s}(${t})` : s;
  }
  return s;
};
