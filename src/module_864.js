/**
 * Module ID: 864
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 864);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.mapValue=function(n,t){if(!n)return n;return{value:t(n.value),rest:n.rest}},e.parseNumericPattern=s,e.parseTimezonePattern=function(t,s){const u=s.match(t);if(!u)return null;if("Z"===u[0])return{value:0,rest:s.slice(1)};const c="+"===u[1]?1:-1,o=u[2]?parseInt(u[2],10):0,l=u[3]?parseInt(u[3],10):0,f=u[5]?parseInt(u[5],10):0;return{value:c*(o*n.millisecondsInHour+l*n.millisecondsInMinute+f*n.millisecondsInSecond),rest:s.slice(u[0].length)}},e.parseAnyDigitsSigned=function(n){return s(t.numericPatterns.anyDigitsSigned,n)},e.parseNDigits=function(n,u){switch(n){case 1:return s(t.numericPatterns.singleDigit,u);case 2:return s(t.numericPatterns.twoDigits,u);case 3:return s(t.numericPatterns.threeDigits,u);case 4:return s(t.numericPatterns.fourDigits,u);default:return s(new RegExp("^\\d{1,"+n+"}"),u)}},e.parseNDigitsSigned=function(n,u){switch(n){case 1:return s(t.numericPatterns.singleDigitSigned,u);case 2:return s(t.numericPatterns.twoDigitsSigned,u);case 3:return s(t.numericPatterns.threeDigitsSigned,u);case 4:return s(t.numericPatterns.fourDigitsSigned,u);default:return s(new RegExp("^-?\\d{1,"+n+"}"),u)}},e.dayPeriodEnumToHours=function(n){switch(n){case"morning":return 4;case"evening":return 17;case"pm":case"noon":case"afternoon":return 12;default:return 0}},e.normalizeTwoDigitYear=function(n,t){const s=t>0,u=s?t:1-t;let c;if(u<=50)c=n||100;else{const t=u+50;c=n+100*Math.trunc(t/100)-(n>=t%100?100:0)}return s?c:1-c},e.isLeapYearIndex=function(n){return n%400==0||n%4==0&&n%100!=0};var n=require("./module_700"),t=require("./module_865");function s(n,t){const s=t.match(n);return s?{value:parseInt(s[0],10),rest:t.slice(s[0].length)}:null}