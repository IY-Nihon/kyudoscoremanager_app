/**
 * Module ID: 848
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 848);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return b}}),e.intlFormatDistance=M;var n=require("./module_717"),s=require("./module_700"),t=require("./module_715"),f=require("./module_741"),c=require("./module_742"),o=require("./module_744"),u=require("./module_745"),I=require("./module_747"),l=require("./module_752"),h=require("./module_758");function M(M,b,C){let y,D=0;const[k,v]=(0,n.normalizeDates)(C?.in,M,b);if(C?.unit)y=C?.unit,"second"===y?D=(0,h.differenceInSeconds)(k,v):"minute"===y?D=(0,l.differenceInMinutes)(k,v):"hour"===y?D=(0,I.differenceInHours)(k,v):"day"===y?D=(0,t.differenceInCalendarDays)(k,v):"week"===y?D=(0,o.differenceInCalendarWeeks)(k,v):"month"===y?D=(0,f.differenceInCalendarMonths)(k,v):"quarter"===y?D=(0,c.differenceInCalendarQuarters)(k,v):"year"===y&&(D=(0,u.differenceInCalendarYears)(k,v));else{const n=(0,h.differenceInSeconds)(k,v);Math.abs(n)<s.secondsInMinute?(D=(0,h.differenceInSeconds)(k,v),y="second"):Math.abs(n)<s.secondsInHour?(D=(0,l.differenceInMinutes)(k,v),y="minute"):Math.abs(n)<s.secondsInDay&&Math.abs((0,t.differenceInCalendarDays)(k,v))<1?(D=(0,I.differenceInHours)(k,v),y="hour"):Math.abs(n)<s.secondsInWeek&&(D=(0,t.differenceInCalendarDays)(k,v))&&Math.abs(D)<7?y="day":Math.abs(n)<s.secondsInMonth?(D=(0,o.differenceInCalendarWeeks)(k,v),y="week"):Math.abs(n)<s.secondsInQuarter?(D=(0,f.differenceInCalendarMonths)(k,v),y="month"):Math.abs(n)<s.secondsInYear&&(0,c.differenceInCalendarQuarters)(k,v)<4?(D=(0,c.differenceInCalendarQuarters)(k,v),y="quarter"):(D=(0,u.differenceInCalendarYears)(k,v),y="year")}return new Intl.RelativeTimeFormat(C?.locale,Object.assign({numeric:"auto"},C)).format(D,y)}var b=M