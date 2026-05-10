/**
 * Module ID: 169
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 169);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"BLUR",{enumerable:!0,get:function(){return t}}),Object.defineProperty(e,"CONTEXT_MENU",{enumerable:!0,get:function(){return n}}),Object.defineProperty(e,"FOCUS_OUT",{enumerable:!0,get:function(){return u}}),Object.defineProperty(e,"MOUSE_DOWN",{enumerable:!0,get:function(){return o}}),Object.defineProperty(e,"MOUSE_MOVE",{enumerable:!0,get:function(){return c}}),Object.defineProperty(e,"MOUSE_UP",{enumerable:!0,get:function(){return f}}),Object.defineProperty(e,"MOUSE_CANCEL",{enumerable:!0,get:function(){return O}}),Object.defineProperty(e,"TOUCH_START",{enumerable:!0,get:function(){return b}}),Object.defineProperty(e,"TOUCH_MOVE",{enumerable:!0,get:function(){return l}}),Object.defineProperty(e,"TOUCH_END",{enumerable:!0,get:function(){return s}}),Object.defineProperty(e,"TOUCH_CANCEL",{enumerable:!0,get:function(){return E}}),Object.defineProperty(e,"SCROLL",{enumerable:!0,get:function(){return p}}),Object.defineProperty(e,"SELECT",{enumerable:!0,get:function(){return C}}),Object.defineProperty(e,"SELECTION_CHANGE",{enumerable:!0,get:function(){return P}}),e.isStartish=function(t){return t===b||t===o},e.isMoveish=function(t){return t===l||t===c},e.isEndish=function(t){return t===s||t===f||j(t)},e.isCancelish=j,e.isScroll=function(t){return t===p},e.isSelectionChange=function(t){return t===C||t===P};var t='blur',n='contextmenu',u='focusout',o='mousedown',c='mousemove',f='mouseup',O='dragstart',b='touchstart',l='touchmove',s='touchend',E='touchcancel',p='scroll',C='select',P='selectionchange';function j(t){return t===E||t===O}