/**
 * Module ID: 530
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 530);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

const n=require("./module_529");function t(){const t={},c=Object.keys(n);for(let n=c.length,o=0;o<n;o++)t[c[o]]={distance:-1,parent:null};return t}function c(c){const o=t(),s=[c];for(o[c].distance=0;s.length;){const t=s.pop(),c=Object.keys(n[t]);for(let n=c.length,u=0;u<n;u++){const n=c[u],i=o[n];-1===i.distance&&(i.distance=o[t].distance+1,i.parent=t,s.unshift(n))}}return o}function o(n,t){return function(c){return t(n(c))}}function s(t,c){const s=[c[t].parent,t];let u=n[c[t].parent][t],i=c[t].parent;for(;c[i].parent;)s.unshift(c[i].parent),u=o(n[c[i].parent][i],u),i=c[i].parent;return u.conversion=s,u}m.exports=function(n){const t=c(n),o={},u=Object.keys(t);for(let n=u.length,c=0;c<n;c++){const n=u[c];null!==t[n].parent&&(o[n]=s(n,t))}return o}