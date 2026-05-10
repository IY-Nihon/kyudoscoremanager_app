/**
 * Module ID: 630
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 630);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

m.exports={pick:(t,...c)=>c.flat().filter(c=>Object.prototype.hasOwnProperty.call(t,c)).reduce((c,o)=>(c[o]=t[o],c),{}),omit:(t,...c)=>{const o=new Set(c.flat());return Object.getOwnPropertyNames(t).filter(t=>!o.has(t)).reduce((c,o)=>(c[o]=t[o],c),{})}}