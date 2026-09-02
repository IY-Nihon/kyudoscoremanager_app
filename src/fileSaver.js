/**
 * ブラウザでファイルを保存する外部の部品（FileSaver.js）。
 *
 * （ソースマップからの復元時は module_1033.js という名前だった）
 */
'use strict';

const _g = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
const _m = module;
const _e = exports;

var e, t;
((e = this),
  (t = function () {
    'use strict';
    function e(e, t) {
      return (
        void 0 === t
          ? (t = { autoBom: !1 })
          : 'object' != typeof t &&
            (console.warn('Deprecated: Expected third argument to be a object'), (t = { autoBom: !t })),
        t.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)
          ? new Blob(['\ufeff', e], { type: e.type })
          : e
      );
    }
    function t(e, t, n) {
      var o = new XMLHttpRequest();
      (o.open('GET', e),
        (o.responseType = 'blob'),
        (o.onload = function () {
          c(o.response, t, n);
        }),
        (o.onerror = function () {
          console.error('could not download file');
        }),
        o.send());
    }
    function n(e) {
      var t = new XMLHttpRequest();
      t.open('HEAD', e, !1);
      try {
        t.send();
      } catch (e) {}
      return 200 <= t.status && 299 >= t.status;
    }
    function o(e) {
      try {
        e.dispatchEvent(new MouseEvent('click'));
      } catch (n) {
        var t = document.createEvent('MouseEvents');
        (t.initMouseEvent('click', !0, !0, window, 0, 0, 0, 80, 20, !1, !1, !1, !1, 0, null),
          e.dispatchEvent(t));
      }
    }
    var a =
        'object' == typeof window && window.window === window
          ? window
          : 'object' == typeof self && self.self === self
            ? self
            : 'object' == typeof _g && _g.global === _g
              ? _g
              : void 0,
      i =
        a.navigator &&
        /Macintosh/.test(navigator.userAgent) &&
        /AppleWebKit/.test(navigator.userAgent) &&
        !/Safari/.test(navigator.userAgent),
      c =
        a.saveAs ||
        ('object' != typeof window || window !== a
          ? function () {}
          : 'download' in HTMLAnchorElement.prototype && !i
            ? function (e, i, c) {
                var s = a.URL || a.webkitURL,
                  l = document.createElement('a');
                ((i = i || e.name || 'download'),
                  (l.download = i),
                  (l.rel = 'noopener'),
                  'string' == typeof e
                    ? ((l.href = e),
                      l.origin === location.origin
                        ? o(l)
                        : n(l.href)
                          ? t(e, i, c)
                          : o(l, (l.target = '_blank')))
                    : ((l.href = s.createObjectURL(e)),
                      setTimeout(function () {
                        s.revokeObjectURL(l.href);
                      }, 4e4),
                      setTimeout(function () {
                        o(l);
                      }, 0)));
              }
            : 'msSaveOrOpenBlob' in navigator
              ? function (a, i, c) {
                  if (((i = i || a.name || 'download'), 'string' != typeof a))
                    navigator.msSaveOrOpenBlob(e(a, c), i);
                  else if (n(a)) t(a, i, c);
                  else {
                    var s = document.createElement('a');
                    ((s.href = a),
                      (s.target = '_blank'),
                      setTimeout(function () {
                        o(s);
                      }));
                  }
                }
              : function (e, n, o, c) {
                  if (
                    ((c = c || open('', '_blank')) &&
                      (c.document.title = c.document.body.innerText = 'downloading...'),
                    'string' == typeof e)
                  )
                    return t(e, n, o);
                  var s = 'application/octet-stream' === e.type,
                    l = /constructor/i.test(a.HTMLElement) || a.safari,
                    f = /CriOS\/[\d]+/.test(navigator.userAgent);
                  if ((f || (s && l) || i) && 'undefined' != typeof FileReader) {
                    var u = new FileReader();
                    ((u.onloadend = function () {
                      var e = u.result;
                      ((e = f ? e : e.replace(/^data:[^;]*;/, 'data:attachment/file;')),
                        c ? (c.location.href = e) : (location = e),
                        (c = null));
                    }),
                      u.readAsDataURL(e));
                  } else {
                    var d = a.URL || a.webkitURL,
                      p = d.createObjectURL(e);
                    (c ? (c.location = p) : (location.href = p),
                      (c = null),
                      setTimeout(function () {
                        d.revokeObjectURL(p);
                      }, 4e4));
                  }
                });
    ((a.saveAs = c.saveAs = c), void 0 !== _m && (_m.exports = c));
  }),
  'function' == typeof define && define.amd
    ? define([], t)
    : void 0 !== _e
      ? t()
      : (t(), (e.FileSaver = {})));
