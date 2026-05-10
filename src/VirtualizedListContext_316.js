/**
 * Module ID: 316
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 316);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"VirtualizedListContext",{enumerable:!0,get:function(){return o}}),_e.VirtualizedListContextResetter=function(e){var t=e.children;return u.createElement(o.Provider,{value:null},t)},_e.VirtualizedListContextProvider=function(e){var t=e.children,l=e.value,s=(0,n.useMemo)(()=>({cellKey:null,getScrollMetrics:l.getScrollMetrics,horizontal:l.horizontal,getOutermostParentListRef:l.getOutermostParentListRef,registerAsNestedChild:l.registerAsNestedChild,unregisterAsNestedChild:l.unregisterAsNestedChild}),[l.getScrollMetrics,l.horizontal,l.getOutermostParentListRef,l.registerAsNestedChild,l.unregisterAsNestedChild]);return u.createElement(o.Provider,{value:s},t)},_e.VirtualizedListCellContextProvider=function(e){var t=e.cellKey,s=e.children,d=(0,n.useContext)(o),c=(0,n.useMemo)(()=>null==d?null:(0,l.default)((0,l.default)({},d),{},{cellKey:t}),[d,t]);return u.createElement(o.Provider,{value:c},s)};var e,t=require("./default_22"),l=(e=t)&&e.__esModule?e:{default:e},n=require("./module_37"),u=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(l){var n=Object.getOwnPropertyDescriptor(e,l);Object.defineProperty(t,l,n.get?n:{enumerable:!0,get:function(){return e[l]}})}),t.default=e,t})(n),o=u.createContext(null)