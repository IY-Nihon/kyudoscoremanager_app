/**
 * Module ID: 223
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 223);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return f}});var e,u=require("./N_224"),t=(e=u)&&e.__esModule?e:{default:e},n=require("./module_37");function f(e,u){var f=(0,n.useRef)(null);null==f.current&&(f.current=new t.default(u));var l=f.current;return(0,n.useEffect)(()=>{l.configure(u)},[u,l]),(0,n.useEffect)(()=>()=>{l.reset()},[l]),(0,n.useDebugValue)(u),l.getEventHandlers()}