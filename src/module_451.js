/**
 * Module ID: 451
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 451);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),e.validatePathConfig=function n(o,s=!0){const c=Object.assign({path:'string',initialRouteName:'string',screens:'object'},s?null:{alias:'array',exact:'boolean',stringify:'object',parse:'object'});if('object'!=typeof o||null===o)throw new Error(`Expected the configuration to be an object, but got ${JSON.stringify(o)}.`);const f=Object.fromEntries(Object.keys(o).map(t=>{if(!(t in c))return[t,'extraneous'];{const n=c[t],s=o[t];if(void 0!==s)if('array'===n){if(!Array.isArray(s))return[t,`expected 'Array', got '${typeof s}'`]}else if(typeof s!==n)return[t,`expected '${n}', got '${typeof s}'`]}return null}).filter(Boolean));if(Object.keys(f).length)throw new Error(`Found invalid properties in the configuration:\n${t(f)}\n\nYou can only specify the following properties:\n${t(c)}\n\nIf you want to specify configuration for screens, you need to specify them under a 'screens' property.\n\nSee https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration.`);if(s&&'path'in o&&'string'==typeof o.path&&o.path.includes(':'))throw new Error(`Found invalid path '${o.path}'. The 'path' in the top-level configuration cannot contain patterns for params.`);'screens'in o&&o.screens&&Object.entries(o.screens).forEach(([t,o])=>{'string'!=typeof o&&n(o,!1)})};const t=t=>Object.entries(t).map(([t,n])=>`- ${t} (${n})`).join('\n')