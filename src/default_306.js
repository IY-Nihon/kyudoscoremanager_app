/**
 * Module ID: 306
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 306);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return u}});var t=e(require("./default_22")),s=e(require("./module_27"));var u=class{constructor(e){var t=e.onMoreTasks;this._onMoreTasks=t,this._queueStack=[{tasks:[],popable:!0}]}enqueue(e){this._getCurrentQueue().push(e)}enqueueTasks(e){e.forEach(e=>this.enqueue(e))}cancelTasks(e){this._queueStack=this._queueStack.map(s=>(0,t.default)((0,t.default)({},s),{},{tasks:s.tasks.filter(t=>-1===e.indexOf(t))})).filter((e,t)=>e.tasks.length>0||0===t)}hasTasksToProcess(){return this._getCurrentQueue().length>0}processNext(){var e=this._getCurrentQueue();if(e.length){var t=e.shift();try{'object'==typeof t&&t.gen?this._genPromise(t):'object'==typeof t&&t.run?t.run():((0,s.default)('function'==typeof t,'Expected Function, SimpleTask, or PromiseTask, but got:\n'+JSON.stringify(t,null,2)),t())}catch(e){throw e.message='TaskQueue: Error with task '+(t.name||'')+': '+e.message,e}}}_getCurrentQueue(){var e=this._queueStack.length-1,t=this._queueStack[e];return t.popable&&0===t.tasks.length&&e>0?(this._queueStack.pop(),this._getCurrentQueue()):t.tasks}_genPromise(e){var t=this._queueStack.push({tasks:[],popable:!1})-1,s=this._queueStack[t];e.gen().then(()=>{s.popable=!0,this.hasTasksToProcess()&&this._onMoreTasks()}).catch(t=>{setTimeout(()=>{throw t.message="TaskQueue: Error resolving Promise in task "+e.name+": "+t.message,t},0)})}}