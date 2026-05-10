/**
 * Module ID: 389
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 389);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return p}});var t=e(require("./default_30")),n=e(require("./default_46")),o=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),u=e(require("./default_144")),l=e(require("./default_45")),d=e(require("./module_42")),c=["active","children","onRequestClose","transparent"],f=o.forwardRef((e,l)=>{var f=e.active,p=e.children,v=e.onRequestClose,b=e.transparent,y=(0,n.default)(e,c);o.useEffect(()=>{if(d.default){var e=e=>{f&&'Escape'===e.key&&(e.stopPropagation(),v&&v())};return document.addEventListener('keyup',e,!1),()=>document.removeEventListener('keyup',e,!1)}},[f,v]);var O=o.useMemo(()=>[s.modal,b?s.modalTransparent:s.modalOpaque],[b]);return o.createElement(u.default,(0,t.default)({},y,{"aria-modal":!0,ref:l,role:f?'dialog':null,style:O}),o.createElement(u.default,{style:s.container},p))}),s=l.default.create({modal:{position:'fixed',top:0,right:0,bottom:0,left:0},modalTransparent:{backgroundColor:'transparent'},modalOpaque:{backgroundColor:'white'},container:{top:0,flex:1}}),p=f