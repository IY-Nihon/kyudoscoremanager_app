/**
 * Module ID: 650
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 650);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return c}});var t,e=(function(t){if(t&&t.__esModule)return t;var e={};return t&&Object.keys(t).forEach(function(n){var u=Object.getOwnPropertyDescriptor(t,n);Object.defineProperty(e,n,u.get?u:{enumerable:!0,get:function(){return t[n]}})}),e.default=t,e})(require("./module_272")),n=require("./module_37"),u=require("./DEFAULT_ICON_COLOR_602"),o=(t=u)&&t.__esModule?t:{default:t};function c(t,u={}){const c=Object.keys(t);if(0===c.length)throw new Error('You need to add at least one style');const l=Object.assign({defaultStyle:c[0],fallbackFamily:t=>c[0],glyphValidator:(t,e)=>!0},u),f=c.reduce((e,n)=>{const u=t[n];return e[n]=(0,o.default)(u.glyphMap||{},u.fontFamily||'',u.fontFile||'',u.fontStyle||{}),e},{});function s(t){return Object.keys(t).reduce((e,n)=>-1!==c.indexOf(n)&&!0===t[n]?n:e,l.defaultStyle)}function d(t){const{name:e}=t,n=s(t);if(l.glyphValidator(e,n))return f[n];const u=l.fallbackFamily(e);return-1===c.indexOf(u)?f[l.defaultStyle]:f[u]}function y(t){return Object.keys(t).reduce((e,n)=>(-1===c.indexOf(n)&&(e[n]=t[n]),e),{})}function p(t,e=""){return-1===c.indexOf(t)?f[l.defaultStyle]:e?d({name:e,[t]:!0}):f[s({[t]:!0})]}function b(t=l.defaultStyle){return p(t).getFontFamily()}function O(t=l.defaultStyle){return p(t).getRawGlyphMap()}function h(t,e=l.defaultStyle){return l.glyphValidator(t,e)}async function S(t,e,n){const u=l.fallbackFamily(t);return f[u].getImageSource(t,e,n)}function F(u=""){class o extends n.PureComponent{static defaultProps=c.reduce((t,e)=>(t[e]=!1,t),{});static font=Object.values(t).reduce((t,e)=>(t[e.fontFamily]=e.fontFile,t),{});static StyledIconSet=p;static getFontFamily=b;static getRawGlyphMap=O;static getImageSource=S;static hasIcon=h;render(){const t=d(this.props),n=(o=t,(c=u).length>0?o[c]:o);var o,c;const l=y(this.props);return e.createInteropElement(n,l)}}return o}const j=F();return j.Button=F('Button'),j}