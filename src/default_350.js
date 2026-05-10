/**
 * Module ID: 350
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 350);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return h}});var e=t(require("./default_22")),n=require("./AnimatedEvent_323"),u=t(require("./default_351")),l=t(require("./default_325")),f=t(require("./default_327")),o=t(require("./default_324")),c=t(require("./default_359")),s=t(require("./default_320")),v=t(require("./default_364")),p=!1;function E(t){return e=>{var n=null==e?e:function(){if(p)console.warn('Ignoring recursive animation callback when running mock animations');else{p=!0;try{e(...arguments)}finally{p=!1}}};t(n)}}var y={start:()=>{},stop:()=>{},reset:()=>{},_startNativeLoop:()=>{},_isUsingNativeDriver:()=>!1},_=t=>(0,e.default)((0,e.default)({},y),{},{start:E(e=>{t.forEach(t=>t.start()),null==e||e({finished:!0})})}),h={Value:o.default,ValueXY:c.default,Color:v.default,Interpolation:l.default,Node:f.default,decay:function(t,e){return y},timing:function(t,n){var u=t;return(0,e.default)((0,e.default)({},y),{},{start:E(t=>{u.setValue(n.toValue),null==t||t({finished:!0})})})},spring:function(t,n){var u=t;return(0,e.default)((0,e.default)({},y),{},{start:E(t=>{u.setValue(n.toValue),null==t||t({finished:!0})})})},add:u.default.add,subtract:u.default.subtract,divide:u.default.divide,multiply:u.default.multiply,modulo:u.default.modulo,diffClamp:u.default.diffClamp,delay:function(t){return y},sequence:function(t){return _(t)},parallel:function(t,e){return _(t)},stagger:function(t,e){return _(e)},loop:function(t,e){(void 0===e?{}:e).iterations;return y},event:u.default.event,createAnimatedComponent:s.default,attachNativeEvent:n.attachNativeEvent,forkEvent:u.default.forkEvent,unforkEvent:u.default.unforkEvent,Event:n.AnimatedEvent}