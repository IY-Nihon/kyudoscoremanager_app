/**
 * Module ID: 809
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 809);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return M}}),e.formatDistance=D;var t=require("./module_788"),n=require("./module_713"),s=require("./module_716"),o=require("./module_717"),c=require("./module_731"),f=require("./module_700"),u=require("./module_753"),l=require("./module_758");function D(D,M,h){const I=(0,n.getDefaultOptions)(),X=h?.locale??I.locale??t.defaultLocale,b=(0,c.compareAsc)(D,M);if(isNaN(b))throw new RangeError("Invalid time value");const x=Object.assign({},h,{addSuffix:h?.addSuffix,comparison:b}),[S,T]=(0,o.normalizeDates)(h?.in,...b>0?[M,D]:[D,M]),v=(0,l.differenceInSeconds)(T,S),y=((0,s.getTimezoneOffsetInMilliseconds)(T)-(0,s.getTimezoneOffsetInMilliseconds)(S))/1e3,O=Math.round((v-y)/60);let p;if(O<2)return h?.includeSeconds?v<5?X.formatDistance("lessThanXSeconds",5,x):v<10?X.formatDistance("lessThanXSeconds",10,x):v<20?X.formatDistance("lessThanXSeconds",20,x):v<40?X.formatDistance("halfAMinute",0,x):v<60?X.formatDistance("lessThanXMinutes",1,x):X.formatDistance("xMinutes",1,x):0===O?X.formatDistance("lessThanXMinutes",1,x):X.formatDistance("xMinutes",O,x);if(O<45)return X.formatDistance("xMinutes",O,x);if(O<90)return X.formatDistance("aboutXHours",1,x);if(O<f.minutesInDay){const t=Math.round(O/60);return X.formatDistance("aboutXHours",t,x)}if(O<2520)return X.formatDistance("xDays",1,x);if(O<f.minutesInMonth){const t=Math.round(O/f.minutesInDay);return X.formatDistance("xDays",t,x)}if(O<2*f.minutesInMonth)return p=Math.round(O/f.minutesInMonth),X.formatDistance("aboutXMonths",p,x);if(p=(0,u.differenceInMonths)(T,S),p<12){const t=Math.round(O/f.minutesInMonth);return X.formatDistance("xMonths",t,x)}{const t=p%12,n=Math.trunc(p/12);return t<3?X.formatDistance("aboutXYears",n,x):t<9?X.formatDistance("overXYears",n,x):X.formatDistance("almostXYears",n+1,x)}}var M=D