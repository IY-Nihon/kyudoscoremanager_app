/**
 * Module ID: 21
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 21);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return f}}),require("./default_22");var e,n=t(require("./module_27")),o=t(require("./module_28")),p=require("./default_29"),s=t(p),u={},l={},c=t=>t();class f{static getAppKeys(){return Object.keys(l)}static getApplication(t,e){return(0,n.default)(l[t]&&l[t].getApplication,"Application "+t+" has not been registered. This is either due to an import error during initialization or failure to call AppRegistry.registerComponent."),l[t].getApplication(e)}static registerComponent(t,n){return l[t]={getApplication:t=>(0,p.getApplication)(c(n),t?t.initialProps:u,e&&e(t)),run:t=>(0,s.default)(c(n),e&&e(t),t.callback,{hydrate:t.hydrate||!1,initialProps:t.initialProps||u,mode:t.mode||'concurrent',rootTag:t.rootTag})},t}static registerConfig(t){t.forEach(t=>{var e=t.appKey,o=t.component,p=t.run;p?f.registerRunnable(e,p):((0,n.default)(o,'No component provider passed in'),f.registerComponent(e,o))})}static registerRunnable(t,e){return l[t]={run:e},t}static runApplication(t,e){return(0,n.default)(l[t]&&l[t].run,"Application \""+t+"\" has not been registered. This is either due to an import error during initialization or failure to call AppRegistry.registerComponent."),l[t].run(e)}static setComponentProviderInstrumentationHook(t){c=t}static setWrapperComponentProvider(t){e=t}static unmountApplicationComponentAtRootTag(t){(0,o.default)(t)}}