/**
 * Module ID: 381
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 381);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return c}});var t=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(o){var n=Object.getOwnPropertyDescriptor(e,o);Object.defineProperty(t,o,n.get?n:{enumerable:!0,get:function(){return e[o]}})}),t.default=e,t})(require("./module_37")),o=e(require("./default_45")),n=e(require("./default_382")),l=e(require("./default_217")),u=t.forwardRef((e,o)=>{var u=e.accessibilityLabel,c=e.color,s=e.disabled,f=e.onPress,b=e.testID,y=e.title;return t.createElement(n.default,{accessibilityLabel:u,accessibilityRole:"button",disabled:s,focusable:!s,onPress:f,ref:o,style:[d.button,c&&{backgroundColor:c},s&&d.buttonDisabled],testID:b},t.createElement(l.default,{style:[d.text,s&&d.textDisabled]},y))});u.displayName='Button';var d=o.default.create({button:{backgroundColor:'#2196F3',borderRadius:2},text:{color:'#fff',fontWeight:'500',padding:8,textAlign:'center',textTransform:'uppercase'},buttonDisabled:{backgroundColor:'#dfdfdf'},textDisabled:{color:'#a1a1a1'}}),c=u