/**
 * Module ID: 629
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 629);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";const e=["style","iconStyle","children"];function t(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return j}});var s=t(require("./module_130")),n=require("./module_37"),o=t(require("./default_45")),l=t(require("./default_217")),c=t(require("./default_403")),u=t(require("./default_144")),y=require("./module_630"),b=require("./module_427");const p=o.default.create({container:{flexDirection:'row',justifyContent:'flex-start',alignItems:'center',padding:8},touchable:{overflow:'hidden'},icon:{marginRight:10},text:{fontWeight:'600',backgroundColor:'transparent'}}),f='#007AFF',h=['ellipsizeMode','numberOfLines','textBreakStrategy','selectable','suppressHighlighting','allowFontScaling','adjustsFontSizeToFit','minimumFontScale'],P=['accessible','accessibilityLabel','accessibilityHint','accessibilityComponentType','accessibilityRole','accessibilityStates','accessibilityTraits','onFocus','onBlur','disabled','onPress','onPressIn','onPressOut','onLayout','onLongPress','nativeID','testID','delayPressIn','delayPressOut','delayLongPress','activeOpacity','underlayColor','selectionColor','onShowUnderlay','onHideUnderlay','hasTVPreferredFocus','tvParallaxProperties'];function j(t){return class extends n.PureComponent{static defaultProps={backgroundColor:f,borderRadius:5,color:'white',size:20};render(){const n=this.props,{style:o,iconStyle:f,children:j}=n,k=(0,s.default)(n,e),x=(0,y.pick)(k,h,'style','name','size','color'),O=(0,y.pick)(k,P),C=(0,y.omit)(k,Object.keys(x),Object.keys(O),'iconStyle','borderRadius','backgroundColor');x.style=f?[p.icon,f]:p.icon;const S=(0,y.pick)(this.props,'color'),F=(0,y.pick)(this.props,'backgroundColor','borderRadius');return(0,b.jsx)(c.default,Object.assign({style:[p.touchable,F]},O,{children:(0,b.jsxs)(u.default,Object.assign({style:[p.container,F,o]},C,{children:[(0,b.jsx)(t,Object.assign({},x)),'string'==typeof j?(0,b.jsx)(l.default,{style:[p.text,S],selectable:!1,children:j}):j]}))}))}}}