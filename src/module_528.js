/**
 * Module ID: 528
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 528);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

const n=require("./module_529"),o=require("./module_530"),t={};function c(n){const o=function(...o){const t=o[0];return null==t?t:(t.length>1&&(o=t),n(o))};return'conversion'in n&&(o.conversion=n.conversion),o}function s(n){const o=function(...o){const t=o[0];if(null==t)return t;t.length>1&&(o=t);const c=n(o);if('object'==typeof c)for(let n=c.length,o=0;o<n;o++)c[o]=Math.round(c[o]);return c};return'conversion'in n&&(o.conversion=n.conversion),o}Object.keys(n).forEach(i=>{t[i]={},Object.defineProperty(t[i],'channels',{value:n[i].channels}),Object.defineProperty(t[i],'labels',{value:n[i].labels});const l=o(i);Object.keys(l).forEach(n=>{const o=l[n];t[i][n]=s(o),t[i][n].raw=c(o)})}),m.exports=t