/**
 * Module ID: 532
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 532);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["disabled","onPress","onPressIn","onPressOut","android_ripple","pressColor","pressOpacity","hoverEffect","style","children"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"PlatformPressable",{enumerable:!0,get:function(){return y}});var n=t(require("./module_130")),o=require("./module_233"),s=(function(e){if(e&&e.__esModule)return e;var t={};return e&&Object.keys(e).forEach(function(n){var o=Object.getOwnPropertyDescriptor(e,n);Object.defineProperty(t,n,o.get?o:{enumerable:!0,get:function(){return e[n]}})}),t.default=e,t})(require("./module_37")),l=t(require("./default_286")),c=t(require("./default_229"));require("./module_98");var u=t(require("./default_218")),d=require("./module_254");const f=l.default.createAnimatedComponent(u.default);function v(t,u){let{disabled:v,onPress:y,onPressIn:p,onPressOut:b,android_ripple:h,pressColor:O,pressOpacity:_=.3,hoverEffect:j,style:K,children:x}=t,$=(0,n.default)(t,e);const{dark:k}=(0,o.useTheme)(),[w]=s.useState(()=>new l.default.Value(1)),T=(e,t)=>{l.default.timing(w,{toValue:e,duration:t,easing:c.default.inOut(c.default.quad),useNativeDriver:false}).start()};return(0,d.jsxs)(f,Object.assign({ref:u,accessible:!0,role:null!=$.href?'link':'button',onPress:v?void 0:e=>{if(null!==$.href){const t='metaKey'in e&&e.metaKey||'altKey'in e&&e.altKey||'ctrlKey'in e&&e.ctrlKey||'shiftKey'in e&&e.shiftKey,n=!('button'in e)||(null==e.button||0===e.button),o=!e.currentTarget||!('target'in e.currentTarget)||[void 0,null,'','self'].includes(e.currentTarget.target);!t&&n&&o&&(e.preventDefault(),y?.(e))}else y?.(e)},onPressIn:v?void 0:e=>{T(_,0),p?.(e)},onPressOut:v?void 0:e=>{T(1,200),b?.(e)},android_ripple:void 0,style:[{cursor:v?'auto':'pointer',opacity:v?1:w},K]},$,{children:[v?null:(0,d.jsx)(P,Object.assign({},j)),x]}))}const y=s.forwardRef(v);y.displayName='PlatformPressable';const p=String.raw,b="__react-navigation_elements_Pressable_hover",h=p`
  .${b} {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    background-color: var(--overlay-color);
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  a:hover > .${b}, button:hover > .${b} {
    opacity: var(--overlay-hover-opacity);
  }

  a:active > .${b}, button:active > .${b} {
    opacity: var(--overlay-active-opacity);
  }
`,P=({color:e,hoverOpacity:t=.08,activeOpacity:n=.16})=>null==e?null:(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("style",{href:b,precedence:"elements",children:h}),(0,d.jsx)("div",{className:b,style:{'--overlay-color':e,'--overlay-hover-opacity':t,'--overlay-active-opacity':n}})]})