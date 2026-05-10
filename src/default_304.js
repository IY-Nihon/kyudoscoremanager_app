/**
 * Module ID: 304
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 304);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return s}});var e,t=require("./default_305"),l=(e=t)&&e.__esModule?e:{default:e};var s=class{constructor(e,t){this._delay=t,this._callback=e}dispose(e){void 0===e&&(e={abort:!1}),this._taskHandle&&(this._taskHandle.cancel(),e.abort||this._callback(),this._taskHandle=null)}schedule(){if(!this._taskHandle){var e=setTimeout(()=>{this._taskHandle=l.default.runAfterInteractions(()=>{this._taskHandle=null,this._callback()})},this._delay);this._taskHandle={cancel:()=>clearTimeout(e)}}}}