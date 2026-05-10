/**
 * Module ID: 541
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 541);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"HeaderButton",{enumerable:!0,get:function(){return c}});var e=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(o){var n=Object.getOwnPropertyDescriptor(e,o);Object.defineProperty(t,o,n.get?n:{enumerable:!0,get:function(){return e[o]}})}),t.default=e,t})(require("./module_37"));require("./module_98");var t,o=require("./default_45"),n=(t=o)&&t.__esModule?t:{default:t},s=require("./PlatformPressable_532"),d=require("./module_254");function l({disabled:e,onPress:t,pressColor:o,pressOpacity:n,accessibilityLabel:l,testID:c,style:b,href:p,children:y},_){return(0,d.jsx)(s.PlatformPressable,{ref:_,disabled:e,href:p,"aria-label":l,testID:c,onPress:t,pressColor:o,pressOpacity:n,android_ripple:u,style:[f.container,e&&f.disabled,b],hitSlop:{top:16,right:16,bottom:16,left:16},children:y})}const c=e.forwardRef(l);c.displayName='HeaderButton';const u={borderless:!0,foreground:!1,radius:20},f=n.default.create({container:{flexDirection:'row',alignItems:'center',paddingHorizontal:8,borderRadius:10,borderCurve:'continuous'},disabled:{opacity:.5}})