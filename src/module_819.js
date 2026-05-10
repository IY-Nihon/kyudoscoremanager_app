/**
 * Module ID: 819
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 819);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return f}}),e.formatRelative=c;var t=require("./module_788"),o=require("./module_713"),n=require("./module_717"),l=require("./module_715"),s=require("./module_787");function c(c,f,u){const[w,O]=(0,n.normalizeDates)(u?.in,c,f),k=(0,o.getDefaultOptions)(),v=u?.locale??k.locale??t.defaultLocale,y=u?.weekStartsOn??u?.locale?.options?.weekStartsOn??k.weekStartsOn??k.locale?.options?.weekStartsOn??0,S=(0,l.differenceInCalendarDays)(w,O);if(isNaN(S))throw new RangeError("Invalid time value");let p;p=S<-6?"other":S<-1?"lastWeek":S<0?"yesterday":S<1?"today":S<2?"tomorrow":S<7?"nextWeek":"other";const _=v.formatRelative(p,w,O,{locale:v,weekStartsOn:y});return(0,s.format)(w,_,{locale:v,weekStartsOn:y})}var f=c