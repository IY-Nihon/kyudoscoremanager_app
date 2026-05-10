/**
 * Module ID: 88
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 88);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(e,"__esModule",{value:!0}),e.localizeStyle=function(l,s){if(null!=l[t]){var c=s?1:0;if(n.has(l)){var f=n.get(l),o=f[c];return null==o&&(o=u(l,s),f[c]=o,n.set(l,f)),o}var v=u(l,s),y=new Array(2);return y[c]=v,n.set(l,y),v}return l};var n=new WeakMap,t='$$css$localize';function u(n,u){var l={};for(var s in n)if(s!==t){var c=n[s];Array.isArray(c)?l[s]=u?c[1]:c[0]:l[s]=c}return l}