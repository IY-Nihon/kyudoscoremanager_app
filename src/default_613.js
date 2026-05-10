/**
 * Module ID: 613
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 613);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(_e,'__esModule',{value:!0}),Object.defineProperty(_e,"default",{enumerable:!0,get:function(){return n}}),require("./EventEmitter_100");var e,t=require("./default_342"),s=(e=t)&&e.__esModule?e:{default:e};function i(e){const t=n.pickScale(e.scales,s.default.get()),i=1===t?'':'@'+t+'x',c=e.type?`.${e.type}`:'';return e.httpServerLocation.replace(/\.\.\//g,'_')+'/'+e.name+i+c}class n{constructor(e,t,s){this.serverUrl=e||'https://expo.dev',this.jsbundleUrl=null,this.asset=s}isLoadedFromServer(){return!0}isLoadedFromFileSystem(){return!1}defaultAsset(){return this.assetServerURL()}assetServerURL(){const e=new URL(i(this.asset),this.serverUrl);return e.searchParams.set('platform',"web"),e.searchParams.set('hash',this.asset.hash),this.fromSource(e.toString().replace(e.origin,''))}fromSource(e){return{__packager_asset:!0,width:this.asset.width??void 0,height:this.asset.height??void 0,uri:e,scale:n.pickScale(this.asset.scales,s.default.get())}}static pickScale(e,t){for(let s=0;s<e.length;s++)if(e[s]>=t)return e[s];return e[e.length-1]||1}}