/**
 * Module ID: 1008
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1008);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"WebShape",{enumerable:!0,get:function(){return u}});var t=e(require("./module_37")),s=e(require("./default_145")),o=require("./prepare_1009"),n=require("./module_1018"),c=require("./module_1007"),p=require("./module_1010"),l=e(require("./default_1019"));class u extends t.default.Component{prepareProps(e){return e}elementRef=t.default.createRef();lastMergedProps={};setNativeProps(e){const t=Object.assign({},this.props,this.lastMergedProps,e.style);this.lastMergedProps=t;const s=(0,o.prepare)(this,this.prepareProps(t)),p=this.elementRef.current;if(p)for(const e of Object.keys(s)){const t=s[e];switch(e){case'ref':case'children':break;case'style':for(const e of[].concat(s.style??[]))Object.assign(p.style,e);break;case'fill':if(t&&'object'==typeof t){const e=t;p.setAttribute('fill',(0,n.convertInt32ColorToRGBA)(e.payload))}break;case'stroke':if(t&&'object'==typeof t){const e=t;p.setAttribute('stroke',(0,n.convertInt32ColorToRGBA)(e.payload))}break;default:p.setAttribute((0,c.getAttributeName)(e),t)}}}constructor(e){super(e),(0,p.hasTouchableProperty)(e)&&(0,l.default)(this),this._remeasureMetricsOnActivation=c.remeasure.bind(this)}render(){if(!this.tag)throw new Error('When extending `WebShape` you need to overwrite either `tag` or `render`!');return this.lastMergedProps={},(0,s.default)(this.tag,(0,o.prepare)(this,this.prepareProps(this.props)))}}