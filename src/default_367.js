/**
 * Module ID: 367
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 367);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return h}});var t=e(require("./module_27")),n=e(require("./module_139")),u=e(require("./module_42")),c=u.default&&!document.hasOwnProperty('hidden')&&document.hasOwnProperty('webkitHidden'),s=['change','memoryWarning'],l=c?'webkitvisibilitychange':'visibilitychange',o=c?'webkitVisibilityState':'visibilityState',b='background',f='active',v=null;class h{static get currentState(){if(!h.isAvailable)return f;switch(document[o]){case'hidden':case'prerender':case'unloaded':return b;default:return f}}static addEventListener(e,u){if(h.isAvailable&&((0,t.default)(-1!==s.indexOf(e),'Trying to subscribe to unknown event: "%s"',e),'change'===e))return v||(v=new n.default,document.addEventListener(l,()=>{v&&v.emit('change',h.currentState)},!1)),v.addListener(e,u)}}h.isAvailable=u.default&&!!document[o]