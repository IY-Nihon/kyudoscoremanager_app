/**
 * Module ID: 810
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 810);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return D}}),e.formatDistanceStrict=l;var n=require("./module_788"),t=require("./module_713"),o=require("./module_748"),s=require("./module_716"),u=require("./module_717"),c=require("./module_731"),f=require("./module_700");function l(l,D,h){const I=(0,t.getDefaultOptions)(),M=h?.locale??I.locale??n.defaultLocale,x=(0,c.compareAsc)(l,D);if(isNaN(x))throw new RangeError("Invalid time value");const y=Object.assign({},h,{addSuffix:h?.addSuffix,comparison:x}),[O,p]=(0,u.normalizeDates)(h?.in,...x>0?[D,l]:[l,D]),v=(0,o.getRoundingMethod)(h?.roundingMethod??"round"),b=p.getTime()-O.getTime(),S=b/f.millisecondsInMinute,T=(b-((0,s.getTimezoneOffsetInMilliseconds)(p)-(0,s.getTimezoneOffsetInMilliseconds)(O)))/f.millisecondsInMinute,Y=h?.unit;let _;if(_=Y||(S<1?"second":S<60?"minute":S<f.minutesInDay?"hour":T<f.minutesInMonth?"day":T<f.minutesInYear?"month":"year"),"second"===_){const n=v(b/1e3);return M.formatDistance("xSeconds",n,y)}if("minute"===_){const n=v(S);return M.formatDistance("xMinutes",n,y)}if("hour"===_){const n=v(S/60);return M.formatDistance("xHours",n,y)}if("day"===_){const n=v(T/f.minutesInDay);return M.formatDistance("xDays",n,y)}if("month"===_){const n=v(T/f.minutesInMonth);return 12===n&&"month"!==Y?M.formatDistance("xYears",1,y):M.formatDistance("xMonths",n,y)}{const n=v(T/f.minutesInYear);return M.formatDistance("xYears",n,y)}}var D=l