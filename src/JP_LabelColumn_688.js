/**
 * Module ID: 688
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 688);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"LabelColumn",{enumerable:!0,get:function(){return f}}),require("./module_37");var t=e(require("./default_144")),o=e(require("./default_217")),i=e(require("./default_45")),n=require("./module_595"),l=require("./JP_useScoreStore_174"),h=require("./module_427");const f=({shots:e,showFooter:i=!0})=>{const f=(0,l.useScoreStore)(e=>e.viewScale),s='number'==typeof f&&!isNaN(f)&&f>0?f:1,u=[];for(let t=e;t>=1;t--)u.push(t);return(0,h.jsxs)(t.default,{style:[c.column,{width:n.UIConfig.headerWidth*s}],children:[(0,h.jsxs)(t.default,{style:{flexDirection:'column'},children:[(0,h.jsx)(t.default,{style:[c.header,{height:n.UIConfig.headerHeight*s}],children:(0,h.jsx)(o.default,{style:[c.headerText,{fontSize:10*s}],children:"計"})}),u.map(e=>{const i=(e-1)%4==0&&1!==e;return(0,h.jsx)(t.default,{style:[c.cell,{height:n.UIConfig.cellHeight*s,borderBottomWidth:i?2:1,borderBottomColor:'#000'}],children:(0,h.jsx)(o.default,{style:[c.numText,{fontSize:10*s}],children:e})},e)})]}),i&&(0,h.jsx)(t.default,{style:[c.footer,{height:n.UIConfig.footerHeight*s}],children:(0,h.jsx)(o.default,{style:[c.footerText,{fontSize:10*s}],children:"名"})})]})},c=i.default.create({column:{width:n.UIConfig.headerWidth,backgroundColor:'#F2F2F7',borderLeftWidth:1.5,borderLeftColor:'#000'},header:{height:n.UIConfig.headerHeight,justifyContent:'center',alignItems:'center',borderBottomWidth:1.5,borderBottomColor:'#000',borderRightWidth:1.5,borderRightColor:'#000'},headerText:{color:'#3C3C43',fontSize:10,fontWeight:'bold'},cell:{height:n.UIConfig.cellHeight,justifyContent:'center',alignItems:'center',backgroundColor:'#F2F2F7',borderRightWidth:1.5,borderRightColor:'#000'},numText:{color:'#3C3C43',fontSize:10},footer:{height:n.UIConfig.footerHeight,justifyContent:'center',alignItems:'center',borderTopWidth:1,borderTopColor:'#000',borderRightWidth:1.5,borderRightColor:'#000',backgroundColor:'#F2F2F7'},footerText:{color:'#3C3C43',fontSize:10,fontWeight:'bold'}})