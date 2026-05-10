/**
 * Module ID: 363
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 363);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

'use strict';function n(n){return 3.62*(n-30)+194}function t(n){return 3*(n-8)+25}Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return u}});var u={fromOrigamiTensionAndFriction:function(u,o){return{stiffness:n(u),damping:t(o)}},fromBouncinessAndSpeed:function(u,o){function f(n,t,u){return(n-t)/(u-t)}function c(n,t,u){return t+n*(u-t)}function s(n,t,u){return n*u+(1-n)*t}function p(n){return 44e-6*Math.pow(n,3)-.006*Math.pow(n,2)+.36*n+2}function M(n){return 45e-8*Math.pow(n,3)-332e-6*Math.pow(n,2)+.1078*n+5.84}var h=f(u/1.7,0,20);h=c(h,0,.8);var w,l,v,_,b=c(f(o/1.7,0,20),.5,200),O=(w=h,l=(v=b)<=18?(_=v,7e-4*Math.pow(_,3)-.031*Math.pow(_,2)+.64*_+1.28):v>18&&v<=44?p(v):M(v),s(2*w-w*w,l,.01));return{stiffness:n(b),damping:t(O)}}}