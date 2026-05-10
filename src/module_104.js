/**
 * Module ID: 104
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 104);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"EventEmitter",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"NativeModule",{enumerable:!0,get:function(){return s}}),Object.defineProperty(e,"SharedObject",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"SharedRef",{enumerable:!0,get:function(){return o}});class t{addListener(t,s){this.listeners||(this.listeners=new Map),this.listeners?.has(t)||this.listeners?.set(t,new Set);const n=this.listenerCount(t);return this.listeners?.get(t)?.add(s),0===n&&1===this.listenerCount(t)&&this.startObserving(t),{remove:()=>{this.removeListener(t,s)}}}removeListener(t,s){const n=this.listeners?.get(t)?.delete(s);0===this.listenerCount(t)&&n&&this.stopObserving(t)}removeAllListeners(t){const s=this.listenerCount(t);this.listeners?.get(t)?.clear(),s>0&&this.stopObserving(t)}emit(t,...s){new Set(this.listeners?.get(t)).forEach(t=>{try{t(...s)}catch(t){console.error(t)}})}listenerCount(t){return this.listeners?.get(t)?.size??0}startObserving(t){}stopObserving(t){}}class s extends t{}class n extends t{release(){}}class o extends n{nativeRefType='unknown'}