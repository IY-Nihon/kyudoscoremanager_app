/**
 * Module ID: 373
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 373);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return c}});var t=e(require("./module_98")),n=e(require("./default_157"));function s(e,s){t.default.isTesting||n.default.configureNextLayoutAnimation(e,null!=s?s:function(){},function(){})}function u(e,t,n){return{duration:e,create:{type:t,property:n},update:{type:t},delete:{type:t,property:n}}}var o={easeInEaseOut:u(300,'easeInEaseOut','opacity'),linear:u(500,'linear','opacity'),spring:{duration:700,create:{type:'linear',property:'opacity'},update:{type:'spring',springDamping:.4},delete:{type:'linear',property:'opacity'}}},c={configureNext:s,create:u,Types:Object.freeze({spring:'spring',linear:'linear',easeInEaseOut:'easeInEaseOut',easeIn:'easeIn',easeOut:'easeOut',keyboard:'keyboard'}),Properties:Object.freeze({opacity:'opacity',scaleX:'scaleX',scaleY:'scaleY',scaleXY:'scaleXY'}),checkConfig(){console.error('LayoutAnimation.checkConfig(...) has been disabled.')},Presets:o,easeInEaseOut:s.bind(null,o.easeInEaseOut),linear:s.bind(null,o.linear),spring:s.bind(null,o.spring)}