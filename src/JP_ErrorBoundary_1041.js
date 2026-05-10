/**
 * Module ID: 1041
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 1041);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";function e(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"ErrorBoundary",{enumerable:!0,get:function(){return f}});var t=require("./module_37"),o=e(require("./default_144")),n=e(require("./default_217")),l=e(require("./default_382")),s=e(require("./default_45")),c=require("./JP_useScoreStore_174"),u=require("./module_427");class f extends t.Component{state={hasError:!1,error:null};static getDerivedStateFromError(e){return{hasError:!0,error:e}}componentDidCatch(e,t){console.error('Uncaught error:',e,t)}handleReset=()=>{c.useScoreStore.getState().clearAllData(),this.setState({hasError:!1,error:null})};render(){return this.state.hasError?(0,u.jsxs)(o.default,{style:h.container,children:[(0,u.jsx)(n.default,{style:h.title,children:"\u7533\u3057\u8a33\u3042\u308a\u307e\u305b\u3093"}),(0,u.jsx)(n.default,{style:h.message,children:"\u4e88\u671f\u305b\u306c\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f\u3002"}),(0,u.jsx)(n.default,{style:h.errorText,children:this.state.error?.toString()}),(0,u.jsx)(l.default,{style:h.button,onPress:this.handleReset,children:(0,u.jsx)(n.default,{style:h.buttonText,children:"\u30c7\u30fc\u30bf\u3092\u30ea\u30bb\u30c3\u30c8\u3057\u3066\u5fa9\u65e7"})})]}):this.props.children}}const h=s.default.create({container:{flex:1,backgroundColor:'#F2F2F7',justifyContent:'center',alignItems:'center',padding:24},title:{fontSize:24,fontWeight:'bold',marginBottom:16,color:'#000'},message:{fontSize:16,textAlign:'center',marginBottom:8,color:'#3C3C43'},errorText:{fontSize:12,color:'#FF3B30',backgroundColor:'#FFF',padding:8,borderRadius:8,marginBottom:24,fontFamily:'Courier'},button:{backgroundColor:'#007AFF',paddingHorizontal:24,paddingVertical:12,borderRadius:8},buttonText:{color:'#FFF',fontSize:16,fontWeight:'bold'}})