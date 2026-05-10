/**
 * Module ID: 300
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 300);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}});var e,u=require("./default_157"),t=(e=u)&&e.__esModule?e:{default:e},l={_currentlyFocusedNode:null,currentlyFocusedField(){return document.activeElement!==this._currentlyFocusedNode&&(this._currentlyFocusedNode=null),this._currentlyFocusedNode},focusTextInput(e){null!==e&&(this._currentlyFocusedNode=e,document.activeElement!==e&&t.default.focus(e))},blurTextInput(e){null!==e&&(this._currentlyFocusedNode=null,document.activeElement===e&&t.default.blur(e))}}