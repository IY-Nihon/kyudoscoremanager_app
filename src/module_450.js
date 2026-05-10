/**
 * Module ID: 450
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const _i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 450);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.getPatternParts=function(n){const t=[];let i={segment:''},o=!1,l=!1,p=0;for(let f=0;f<=n.length;f++){const s=n[f];if(null!=s&&(i.segment+=s),':'===s){if(':'===i.segment)l=!0;else if(!o)throw new Error(`Encountered ':' in the middle of a segment in path: ${n}`)}else if('('===s){if(!l)throw new Error(`Encountered '(' without preceding ':' in path: ${n}`);o?p++:o=!0}else if(')'===s){if(!l||!o)throw new Error(`Encountered ')' without preceding '(' in path: ${n}`);p?(p--,i.regex+=s):(o=!1,l=!1)}else if('?'===s){if(!i.param)throw new Error(`Encountered '?' without preceding ':' in path: ${n}`);l=!1,i.optional=!0}else if(null==s||'/'===s&&!o){if(l=!1,i.segment=i.segment.replace(/\/$/,''),''===i.segment)continue;if(i.param&&(i.param=i.param.replace(/^:/,'')),i.regex&&(i.regex=i.regex.replace(/^\(/,'').replace(/\)$/,'')),t.push(i),null==s)break;i={segment:''}}o&&(i.regex=i.regex||'',i.regex+=s),l&&!o&&(i.param=i.param||'',i.param+=s)}if(o)throw new Error(`Could not find closing ')' in path: ${n}`);const f=t.map(n=>n.param).filter(Boolean);for(const[t,i]of f.entries())if(f.indexOf(i)!==t)throw new Error(`Duplicate param name '${i}' found in path: ${n}`);return t}