const fs = require('fs');

const path = 'c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_useScoreStore_174.js';
let code = fs.readFileSync(path, 'utf8');

const target1 = "const normalizeTag=e=>{if('string'!=typeof e)return'';let t=e.trim().replace(/^[#＃\\s]+/,'');return t=t.replace(/＃/g,'#'),t?`#${t}`:''},cleanUpSessions=e=>Array.isArray(e)?e.map(e=>e&&e.tags&&Array.isArray(e.tags)?Object.assign({},e,{tags:Array.from(new Set(e.tags.map(normalizeTag).filter(Boolean)))}):e):e;";
const replace1 = "const normalizeTag=e=>{if('string'!=typeof e)return'';let t=e.trim().replace(/^[#＃\\s]+/,'');return t=t.replace(/＃/g,'#'),t?`#${t}`:''},cleanUpTagsArray=e=>Array.isArray(e)?Array.from(new Set(e.map(normalizeTag).filter(Boolean))):e,cleanUpSessions=e=>Array.isArray(e)?e.map(e=>e&&e.tags&&Array.isArray(e.tags)?Object.assign({},e,{tags:cleanUpTagsArray(e.tags)}):e):e;";

if (!code.includes(target1)) {
    console.error("target1 not found");
    process.exit(1);
}
code = code.replace(target1, replace1);

const target2 = "onRehydrateStorage:()=>{console.log('[Store] Hydration starting...');const e=Date.now();return(s,t)=>{const o=Date.now()-e;if(t)console.error(`[Store] Hydration error (after ${o}ms):`,t);else if(s)console.log(`[Store] Hydration finished successfully (Duration: ${o}ms)`),'function'==typeof s.updateState&&s.updateState({isHydrated:!0}),'function'==typeof s.ensurePersonalIds&&s.ensurePersonalIds(),Array.isArray(s.archers)||(console.warn('[Store] archers was not an array, recovering...'),'function'==typeof s.updateState&&s.updateState({archers:[]})),('number'!=typeof s.viewScale||isNaN(s.viewScale)||s.viewScale<=0)&&(console.warn('[Store] Invalid viewScale detected during hydration, resetting to 1.0'),'function'==typeof s.updateState&&s.updateState({viewScale:1}));else{console.warn(`[Store] Hydration yielded empty state (after ${o}ms)`);const e=M.getState();e&&!1===e.isHydrated&&'function'==typeof e.updateState&&(console.log('[Store] Forcing isHydrated: true even for empty state'),e.updateState({isHydrated:!0}))}}}}))";
const replace2 = "onRehydrateStorage:()=>{console.log('[Store] Hydration starting...');const e=Date.now();return(s,t)=>{const o=Date.now()-e;if(t)console.error(`[Store] Hydration error (after ${o}ms):`,t);else if(s){console.log(`[Store] Hydration finished successfully (Duration: ${o}ms)`);const updates={isHydrated:!0};if(s.sessions){updates.sessions=cleanUpSessions(s.sessions);}if(s.trash){updates.trash=cleanUpSessions(s.trash);}if(s.historySelectedTags){updates.historySelectedTags=cleanUpTagsArray(s.historySelectedTags);}if(s.analysisSelectedTags){updates.analysisSelectedTags=cleanUpTagsArray(s.analysisSelectedTags);}if(s.currentSessionTags){updates.currentSessionTags=cleanUpTagsArray(s.currentSessionTags);}if(s.tagTemplates){updates.tagTemplates=cleanUpTagsArray(s.tagTemplates);}if(!Array.isArray(s.archers)){console.warn('[Store] archers was not an array, recovering...');updates.archers=[];}if('number'!=typeof s.viewScale||isNaN(s.viewScale)||s.viewScale<=0){console.warn('[Store] Invalid viewScale detected during hydration, resetting to 1.0');updates.viewScale=1;}if('function'==typeof s.updateState){s.updateState(updates);}if('function'==typeof s.ensurePersonalIds){s.ensurePersonalIds();}}else{console.warn(`[Store] Hydration yielded empty state (after ${o}ms)`);const e=M.getState();if(e&&!1===e.isHydrated&&'function'==typeof e.updateState){console.log('[Store] Forcing isHydrated: true even for empty state');e.updateState({isHydrated:!0});}}}}}}))";

if (!code.includes(target2)) {
    console.error("target2 not found");
    process.exit(1);
}
code = code.replace(target2, replace2);

fs.writeFileSync(path, code);
console.log("Success");
