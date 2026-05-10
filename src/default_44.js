/**
 * Module ID: 44
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const _a = (typeof id !== 'undefined' ? id : 44);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return e}});var t=Array.prototype.slice;function e(e){var u,a={},c={};null!=e&&t.call(e.cssRules).forEach((t,e)=>{var n=t.cssText;if(n.indexOf('stylesheet-group')>-1)u=l(t),a[u]={start:e,rules:[n]};else{var s=i(n);null!=s&&(c[s]=!0,a[u].rules.push(n))}});function f(t,e,n){var u=s(a),l=u.indexOf(e)+1,i=u[l],c=null!=i&&null!=a[i].start?a[i].start:t.cssRules.length,f=o(t,n,c);if(f){null==a[e].start&&(a[e].start=c);for(var v=l;v<u.length;v+=1){var p=u[v],h=a[p].start||0;a[p].start=h+1}}return f}var v={getTextContent:()=>s(a).map(t=>{var e=a[t].rules,n=e.shift();return e.sort(),e.unshift(n),e.join('\n')}).join('\n'),insert(t,u){var l=Number(u);if(null==a[l]){var s=n(l);a[l]={start:null,rules:[s]},null!=e&&f(e,l,s)}var o=i(t);null!=o&&null==c[o]&&(c[o]=!0,a[l].rules.push(t),null!=e&&(f(e,l,t)||a[l].rules.pop()))}};return v}function n(t){return"[stylesheet-group=\""+t+"\"]{}"}var u=/["']/g;function l(t){return Number(t.selectorText.split(u)[1])}function s(t){return Object.keys(t).map(Number).sort((t,e)=>t>e?1:-1)}var a=/\s*([,])\s*/g;function i(t){var e=t.split('{')[0].trim();return''!==e?e.replace(a,'$1'):null}function o(t,e,n){try{return t.insertRule(e,n),!0}catch(t){return!1}}