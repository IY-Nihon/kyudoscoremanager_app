/**
 * Module ID: 341
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 341);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}}),Object.defineProperty(_e,"ImageUriCache",{enumerable:!0,get:function(){return t}});var e=/^data:/;class t{static has(n){var o=t._entries;return e.test(n)||Boolean(o[n])}static add(e){var n=t._entries,o=Date.now();n[e]?(n[e].lastUsedTimestamp=o,n[e].refCount+=1):n[e]={lastUsedTimestamp:o,refCount:1}}static remove(e){var n=t._entries;n[e]&&(n[e].refCount-=1),t._cleanUpIfNeeded()}static _cleanUpIfNeeded(){var e,n,o=t._entries,s=Object.keys(o);s.length+1>t._maximumEntries&&(s.forEach(t=>{var s=o[t];(!n||s.lastUsedTimestamp<n.lastUsedTimestamp)&&0===s.refCount&&(e=t,n=s)}),e&&delete o[e])}}t._maximumEntries=256,t._entries={};var n=0,o={},s={abort(e){var t=o[""+e];t&&(t.onerror=null,t.onload=null,t=null,delete o[""+e])},getSize(e,t,n){var l=!1,u=setInterval(f,16),c=s.load(e,f,function(){'function'==typeof n&&n();s.abort(c),clearInterval(u)});function f(){var e=o[""+c];if(e){var n=e.naturalHeight,f=e.naturalWidth;n&&f&&(t(f,n),l=!0)}l&&(s.abort(c),clearInterval(u))}},has:e=>t.has(e),load(e,t,s){n+=1;var l=new window.Image;return l.onerror=s,l.onload=e=>{var n=()=>t({nativeEvent:e});'function'==typeof l.decode?l.decode().then(n,n):setTimeout(n,0)},l.src=e,o[""+n]=l,n},prefetch:e=>new Promise((n,o)=>{s.load(e,()=>{t.add(e),t.remove(e),n()},o)}),queryCache(e){var n={};return e.forEach(e=>{t.has(e)&&(n[e]='disk/memory')}),Promise.resolve(n)}},l=s