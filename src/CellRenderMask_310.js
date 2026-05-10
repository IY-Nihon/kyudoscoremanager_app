/**
 * Module ID: 310
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 310);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function s(s){return s&&s.__esModule?s:{default:s}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"CellRenderMask",{enumerable:!0,get:function(){return i}});var e=s(require("./default_22")),t=s(require("./module_27"));class i{constructor(s){(0,t.default)(s>=0,'CellRenderMask must contain a non-negative number os cells'),this._numCells=s,this._regions=0===s?[]:[{first:0,last:s-1,isSpacer:!0}]}enumerateRegions(){return this._regions}addCells(s){if((0,t.default)(s.first>=0&&s.first<this._numCells&&s.last>=-1&&s.last<this._numCells&&s.last>=s.first-1,'CellRenderMask.addCells called with invalid cell range'),!(s.last<s.first)){var i=this._findRegion(s.first),l=i[0],n=i[1],f=this._findRegion(s.last),u=f[0],o=f[1];if(n!==o||l.isSpacer){var _=[],c=[],h=(0,e.default)((0,e.default)({},s),{},{isSpacer:!1});l.first<h.first&&(l.isSpacer?_.push({first:l.first,last:h.first-1,isSpacer:!0}):h.first=l.first),u.last>h.last&&(u.isSpacer?c.push({first:h.last+1,last:u.last,isSpacer:!0}):h.last=u.last);var p=[..._,h,...c],C=o-n+1;this._regions.splice(n,C,...p)}}}numCells(){return this._numCells}equals(s){return this._numCells===s._numCells&&this._regions.length===s._regions.length&&this._regions.every((e,t)=>e.first===s._regions[t].first&&e.last===s._regions[t].last&&e.isSpacer===s._regions[t].isSpacer)}_findRegion(s){for(var e=0,i=this._regions.length-1;e<=i;){var l=Math.floor((e+i)/2),n=this._regions[l];if(s>=n.first&&s<=n.last)return[n,l];s<n.first?i=l-1:s>n.last&&(e=l+1)}(0,t.default)(!1,"A region was not found containing cellIdx "+s)}}