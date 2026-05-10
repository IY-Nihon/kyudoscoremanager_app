/**
 * Module ID: 846
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 846);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return l}}),e.intervalToDuration=h;var n=require("./module_762"),s=require("./module_697"),t=require("./module_746"),o=require("./module_747"),c=require("./module_752"),u=require("./module_753"),f=require("./module_758"),y=require("./module_760");function h(h,l){const{start:I,end:v}=(0,n.normalizeInterval)(l?.in,h),_={},b=(0,y.differenceInYears)(v,I);b&&(_.years=b);const M=(0,s.add)(I,{years:_.years}),j=(0,u.differenceInMonths)(v,M);j&&(_.months=j);const p=(0,s.add)(M,{months:_.months}),D=(0,t.differenceInDays)(v,p);D&&(_.days=D);const O=(0,s.add)(p,{days:_.days}),P=(0,o.differenceInHours)(v,O);P&&(_.hours=P);const z=(0,s.add)(O,{hours:_.hours}),H=(0,c.differenceInMinutes)(v,z);H&&(_.minutes=H);const S=(0,s.add)(z,{minutes:_.minutes}),T=(0,f.differenceInSeconds)(v,S);return T&&(_.seconds=T),_}var l=h