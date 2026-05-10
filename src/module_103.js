/**
 * Module ID: 103
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 103);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),_e.installExpoGlobalPolyfill=function(){if(globalThis.expo)return;globalThis.expo={EventEmitter:o.EventEmitter,NativeModule:o.NativeModule,SharedObject:o.SharedObject,SharedRef:o.SharedRef,modules:globalThis.ExpoDomWebView?.expoModulesProxy??{},uuidv4:l.default.v4,uuidv5:l.default.v5,getViewConfig:()=>{throw new Error('Method not implemented.')},reloadAppAsync:async()=>{window.location.reload()},expoModulesCoreVersion:void 0,cacheDir:void 0,documentsDir:void 0,installOnUIRuntime:()=>{throw new Error('Method not implemented.')}}};var e,o=require("./module_104"),t=require("./default_105"),l=(e=t)&&e.__esModule?e:{default:e},n=require("./module_110");Object.keys(n).forEach(function(e){'default'===e||Object.prototype.hasOwnProperty.call(_e,e)||Object.defineProperty(_e,e,{enumerable:!0,get:function(){return n[e]}})})