/**
 * Module ID: 75
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 75);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return b}});var e,t=require("./default_70"),o=(e=t)&&e.__esModule?e:{default:e},i={borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},n=['animationIterationCount','boxFlex','boxFlexGroup','boxOrdinalGroup','columnCount','flex','flexGrow','flexPositive','flexShrink','flexNegative','flexOrder','gridColumn','gridColumnEnd','gridColumnStart','gridRow','gridRowEnd','gridRowStart','lineClamp','order'],l=['Webkit','ms','Moz','O'];function u(e,t){return e+t.charAt(0).toUpperCase()+t.slice(1)}for(var f=0,s=n.length;f<s;++f){var c=n[f];i[c]=!0;for(var p=0,h=l.length;p<h;++p)i[u(l[p],c)]=!0}for(var x in i)i[(0,o.default)(x)]=!0;function b(e){return i.hasOwnProperty(e)}