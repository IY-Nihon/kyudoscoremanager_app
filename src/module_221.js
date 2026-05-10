/**
 * Module ID: 221
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 221);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';Object.defineProperty(_e,'__esModule',{value:!0}),_e.addEventListener=function(e,t,n,u){var o=s(u),l=e=>n(c(e));return e.addEventListener(t,l,o),function(){null!=e&&e.removeEventListener(t,l,o)}};var e,t=require("./module_42"),n=(e=t)&&e.__esModule?e:{default:e},u=()=>{};var o=(function(){var e=!1;if(n.default)try{var t={};Object.defineProperty(t,'passive',{get:()=>(e=!0,!1)}),window.addEventListener('test',null,t),window.removeEventListener('test',null,t)}catch(e){}return e})();function s(e){return null!=e&&(o?e:Boolean(e.capture))}function l(){return this.cancelBubble}function v(){return this.defaultPrevented}function c(e){return e.nativeEvent=e,e.persist=u,e.isDefaultPrevented=v,e.isPropagationStopped=l,e}