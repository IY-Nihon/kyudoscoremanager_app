/**
 * Module ID: 787
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 787);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return P}}),Object.defineProperty(e,"formatters",{enumerable:!0,get:function(){return o.formatters}}),Object.defineProperty(e,"longFormatters",{enumerable:!0,get:function(){return s.longFormatters}}),Object.defineProperty(e,"formatDate",{enumerable:!0,get:function(){return v}}),e.format=v;var t=require("./module_788"),n=require("./module_713"),o=require("./module_799"),s=require("./module_807"),l=require("./module_808"),c=require("./module_737"),u=require("./module_701");const f=/[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,p=/P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,k=/^'([^]*?)'?$/,O=/''/g,w=/[a-zA-Z]/;function v(k,O,v){const P=(0,n.getDefaultOptions)(),b=v?.locale??P.locale??t.defaultLocale,h=v?.firstWeekContainsDate??v?.locale?.options?.firstWeekContainsDate??P.firstWeekContainsDate??P.locale?.options?.firstWeekContainsDate??1,T=v?.weekStartsOn??v?.locale?.options?.weekStartsOn??P.weekStartsOn??P.locale?.options?.weekStartsOn??0,y=(0,u.toDate)(k,v?.in);if(!(0,c.isValid)(y))throw new RangeError("Invalid time value");let j=O.match(p).map(t=>{const n=t[0];if("p"===n||"P"===n){return(0,s.longFormatters[n])(t,b.formatLong)}return t}).join("").match(f).map(t=>{if("''"===t)return{isToken:!1,value:"'"};const n=t[0];if("'"===n)return{isToken:!1,value:D(t)};if(o.formatters[n])return{isToken:!0,value:t};if(n.match(w))throw new RangeError("Format string contains an unescaped latin alphabet character `"+n+"`");return{isToken:!1,value:t}});b.localize.preprocessor&&(j=b.localize.preprocessor(y,j));const W={firstWeekContainsDate:h,weekStartsOn:T,locale:b};return j.map(t=>{if(!t.isToken)return t.value;const n=t.value;(!v?.useAdditionalWeekYearTokens&&(0,l.isProtectedWeekYearToken)(n)||!v?.useAdditionalDayOfYearTokens&&(0,l.isProtectedDayOfYearToken)(n))&&(0,l.warnOrThrowProtectedError)(n,O,String(k));return(0,o.formatters[n[0]])(y,n,b.localize,W)}).join("")}function D(t){const n=t.match(k);return n?n[1].replace(O,"'"):t}var P=v