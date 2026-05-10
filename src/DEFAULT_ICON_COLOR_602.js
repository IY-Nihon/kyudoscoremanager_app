/**
 * Module ID: 602
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 602);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function t(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"DEFAULT_ICON_COLOR",{enumerable:!0,get:function(){return u.DEFAULT_ICON_COLOR}}),Object.defineProperty(_e,"DEFAULT_ICON_SIZE",{enumerable:!0,get:function(){return u.DEFAULT_ICON_SIZE}}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return l}});var e=(function(t){if(t&&t.__esModule)return t;var e={};return t&&Object.keys(t).forEach(function(n){var o=Object.getOwnPropertyDescriptor(t,n);Object.defineProperty(e,n,o.get?o:{enumerable:!0,get:function(){return t[n]}})}),e.default=t,e})(require("./module_603")),n=t(require("./module_37")),o=t(require("./default_217")),s=t(require("./default_342")),u=require("./default_626"),c=t(u),d=t(require("./default_629")),f=require("./module_427");function l(t,u,l,p){const _={[u]:l},y=(0,c.default)(t,u,null,p);return class c extends n.default.Component{static defaultProps=y.defaultProps;static Button=(0,d.default)(c);static glyphMap=t;static getRawGlyphMap=()=>t;static getFontFamily=()=>u;static loadFont=()=>e.loadAsync(_);static font=_;static getImageSource=async(n,o,c)=>{if('function'!=typeof e.renderToImageAsync)return console.warn("Font.renderToImageAsync is not available. Please update expo-font."),null;await e.loadAsync(_);const d=await e.renderToImageAsync(String.fromCodePoint(t[n]),{fontFamily:u,color:c,size:o});if('string'==typeof d){return{uri:d,width:o,height:o,scale:s.default.get()}}{const t=d;return Object.assign({scale:s.default.get()},t)}};_mounted=!1;state={fontIsLoaded:e.isLoaded(u)};async componentDidMount(){this._mounted=!0,this.state.fontIsLoaded||(await e.loadAsync(_),this._mounted&&this.setState({fontIsLoaded:!0}))}componentWillUnmount(){this._mounted=!1}setNativeProps(t){this._icon&&this._icon.setNativeProps(t)}render(){return this.state.fontIsLoaded?(0,f.jsx)(y,Object.assign({ref:t=>{this._icon=t}},this.props)):(0,f.jsx)(o.default,{})}}}