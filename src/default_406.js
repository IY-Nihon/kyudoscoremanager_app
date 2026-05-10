/**
 * Module ID: 406
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 406);
const m = module;
const _e = exports;
const _d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return y}});var s=require("./module_37"),t=(function(e){if(e&&e.__esModule)return e;var s={};return e&&Object.keys(e).forEach(function(t){var n=Object.getOwnPropertyDescriptor(e,t);Object.defineProperty(s,t,n.get?n:{enumerable:!0,get:function(){return e[t]}})}),s.default=e,s})(s),n=e(require("./module_154")),l=e(require("./default_162")),o=e(require("./default_223")),c=require("./module_90"),u={accessibilityDisabled:!0,accessibilityLabel:!0,accessibilityLiveRegion:!0,accessibilityRole:!0,accessibilityState:!0,accessibilityValue:!0,children:!0,disabled:!0,focusable:!0,nativeID:!0,onBlur:!0,onFocus:!0,onLayout:!0,testID:!0},d=e=>(0,n.default)(e,u);function b(e,n){(0,c.warnOnce)('TouchableWithoutFeedback','TouchableWithoutFeedback is deprecated. Please use Pressable.');var u=e.delayPressIn,b=e.delayPressOut,f=e.delayLongPress,y=e.disabled,P=e.focusable,h=e.onLongPress,p=e.onPress,v=e.onPressIn,O=e.onPressOut,_=e.rejectResponderTermination,j=(0,s.useRef)(null),L=(0,s.useMemo)(()=>({cancelable:!_,disabled:y,delayLongPress:f,delayPressStart:u,delayPressEnd:b,onLongPress:h,onPress:p,onPressStart:v,onPressEnd:O}),[y,u,b,f,h,p,v,O,_]),D=(0,o.default)(j,L),R=t.Children.only(e.children),k=[R.props.children],E=d(e);E.accessibilityDisabled=y,E.focusable=!y&&!1!==P,E.ref=(0,l.default)(n,j,R.ref);var F=Object.assign(E,D);return t.cloneElement(R,F,...k)}var f=t.memo(t.forwardRef(b));f.displayName='TouchableWithoutFeedback';var y=f