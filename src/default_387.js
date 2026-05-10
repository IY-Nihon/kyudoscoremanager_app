/**
 * Module ID: 387
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 387);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return d}});var e,t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var u=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,u.get?u:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),n=require("./module_39"),u=require("./module_42"),c=(e=u)&&e.__esModule?e:{default:e};var d=function(e){var u=e.children,d=t.useRef(null);if(c.default&&!d.current){var o=document.createElement('div');o&&document.body&&(document.body.appendChild(o),d.current=o)}return t.useEffect(()=>{if(c.default)return()=>{document.body&&d.current&&(document.body.removeChild(d.current),d.current=null)}},[]),d.current&&c.default?(0,n.createPortal)(u,d.current):null}