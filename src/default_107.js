/**
 * Module ID: 107
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 107);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return u}});var e,t=require("./module_108"),n=(e=t)&&e.__esModule?e:{default:e};function o(e){const t=[];return e.replace(/[a-fA-F0-9]{2}/g,e=>(t.push(parseInt(e,16)),'')),t}function c(e){e=unescape(encodeURIComponent(e));const t=new Array(e.length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}function u(e,t,u){const f=function(e,f,s,i){const y=s&&i||0;if('string'==typeof e&&(e=c(e)),'string'==typeof f&&(f=o(f)),!Array.isArray(e))throw TypeError('value must be an array of bytes');if(!Array.isArray(f)||16!==f.length)throw TypeError('namespace must be uuid string or an Array of 16 byte values');const l=u(f.concat(e));if(l[6]=15&l[6]|t,l[8]=63&l[8]|128,s)for(let e=0;e<16;++e)s[y+e]=l[e];return(0,n.default)(l)};try{f.name=e}catch{}return f.DNS='6ba7b810-9dad-11d1-80b4-00c04fd430c8',f.URL='6ba7b811-9dad-11d1-80b4-00c04fd430c8',f}