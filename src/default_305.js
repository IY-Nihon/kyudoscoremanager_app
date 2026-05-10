/**
 * Module ID: 305
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 305);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return _}});var t=e(require("./module_27")),n=e(require("./default_306")),o=e(require("./module_139")),s=e(require("./default_307")),c=new o.default,u={Events:{interactionStart:'interactionStart',interactionComplete:'interactionComplete'},runAfterInteractions(e){var t=[],n=new Promise(n=>{S(),e&&t.push(e),t.push({run:n,name:'resolve '+(e&&e.name||'?')}),h.enqueueTasks(t)});return{then:n.then.bind(n),done:n.then.bind(n),cancel:()=>{h.cancelTasks(t)}}},createInteractionHandle(){S();var e=++w;return f.add(e),e},clearInteractionHandle(e){(0,t.default)(!!e,'Must provide a handle to clear.'),S(),f.delete(e),v.add(e)},addListener:c.addListener.bind(c),setDeadline(e){b=e}},l=new Set,f=new Set,v=new Set,h=new n.default({onMoreTasks:S}),p=0,w=0,b=-1;function S(){p||(p=b>0?setTimeout(T):(0,s.default)(T))}function T(){p=0;var e=l.size;f.forEach(e=>l.add(e)),v.forEach(e=>l.delete(e));var t=l.size;if(0!==e&&0===t?c.emit(u.Events.interactionComplete):0===e&&0!==t&&c.emit(u.Events.interactionStart),0===t)for(var n=Date.now();h.hasTasksToProcess();)if(h.processNext(),b>0&&Date.now()-n>=b){S();break}f.clear(),v.clear()}var _=u