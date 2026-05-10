/**
 * Module ID: 106
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 106);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e,t,n,o){switch(e){case 0:return t&n^~t&o;case 1:case 3:return t^n^o;case 2:return t&n^t&o^n&o;default:return 0}}function t(e,t){return e<<t|e>>>32-t}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return n}});var n=function(n){const o=[1518500249,1859775393,2400959708,3395469782],c=[1732584193,4023233417,2562383102,271733878,3285377520];if('string'==typeof n){const e=unescape(encodeURIComponent(n));n=new Array(e.length);for(let t=0;t<e.length;t++)n[t]=e.charCodeAt(t)}n.push(128);const l=n.length/4+2,f=Math.ceil(l/16),u=new Array(f);for(let e=0;e<f;e++){u[e]=new Array(16);for(let t=0;t<16;t++)u[e][t]=n[64*e+4*t]<<24|n[64*e+4*t+1]<<16|n[64*e+4*t+2]<<8|n[64*e+4*t+3]}u[f-1][14]=8*(n.length-1)/Math.pow(2,32),u[f-1][14]=Math.floor(u[f-1][14]),u[f-1][15]=8*(n.length-1)&4294967295;for(let n=0;n<f;n++){const l=new Array(80);for(let e=0;e<16;e++)l[e]=u[n][e];for(let e=16;e<80;e++)l[e]=t(l[e-3]^l[e-8]^l[e-14]^l[e-16],1);let f=c[0],a=c[1],s=c[2],h=c[3],i=c[4];for(let n=0;n<80;n++){const c=Math.floor(n/20),u=t(f,5)+e(c,a,s,h)+i+o[c]+l[n]>>>0;i=h,h=s,s=t(a,30)>>>0,a=f,f=u}c[0]=c[0]+f>>>0,c[1]=c[1]+a>>>0,c[2]=c[2]+s>>>0,c[3]=c[3]+h>>>0,c[4]=c[4]+i>>>0}return[c[0]>>24&255,c[0]>>16&255,c[0]>>8&255,255&c[0],c[1]>>24&255,c[1]>>16&255,c[1]>>8&255,255&c[1],c[2]>>24&255,c[2]>>16&255,c[2]>>8&255,255&c[2],c[3]>>24&255,c[3]>>16&255,c[3]>>8&255,255&c[3],c[4]>>24&255,c[4]>>16&255,c[4]>>8&255,255&c[4]]}