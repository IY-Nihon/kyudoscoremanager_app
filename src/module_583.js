/**
 * Module ID: 583
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 583);
const m = module;
const e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";Object.defineProperty(e,'__esModule',{value:!0}),Object.defineProperty(e,"default",{enumerable:!0,get:function(){return H}}),Object.defineProperty(e,"compatibilityFlags",{enumerable:!0,get:function(){return u}}),Object.defineProperty(e,"featureFlags",{enumerable:!0,get:function(){return U}});const t=!1,n=!1,s=!1,o=!1,c=!0,l=!1,u={isNewBackTitleImplementation:!0,usesHeaderFlexboxImplementation:!0,usesNewAndroidHeaderHeightImplementation:!0},b={experiment:{controlledBottomTabs:t,synchronousScreenUpdatesEnabled:n,synchronousHeaderConfigUpdatesEnabled:s,synchronousHeaderSubviewUpdatesEnabled:o,androidResetScreenShadowStateOnOrientationChangeEnabled:c,iosPreventReattachmentOfDismissedScreens:l},stable:{}},h=(t,n)=>({get:()=>b.experiment[t],set(s){s!==b.experiment[t]&&b.experiment[t]!==n&&console.error(`[RNScreens] ${t} feature flag modified for a second time; this might lead to unexpected effects`),b.experiment[t]=s}}),p=h('controlledBottomTabs',t),S=h('synchronousScreenUpdatesEnabled',n),f=h('synchronousHeaderConfigUpdatesEnabled',s),y=h('synchronousHeaderSubviewUpdatesEnabled',o),E=h('androidResetScreenShadowStateOnOrientationChangeEnabled',c),O=h('iosPreventReattachmentOfDismissedScreens',l),U={experiment:{get controlledBottomTabs(){return p.get()},set controlledBottomTabs(t){p.set(t)},get synchronousScreenUpdatesEnabled(){return S.get()},set synchronousScreenUpdatesEnabled(t){S.set(t)},get synchronousHeaderConfigUpdatesEnabled(){return f.get()},set synchronousHeaderConfigUpdatesEnabled(t){f.set(t)},get synchronousHeaderSubviewUpdatesEnabled(){return y.get()},set synchronousHeaderSubviewUpdatesEnabled(t){y.set(t)},get androidResetScreenShadowStateOnOrientationChangeEnabled(){return E.get()},set androidResetScreenShadowStateOnOrientationChangeEnabled(t){E.set(t)},get iosPreventReattachmentOfDismissedScreens(){return O.get()},set iosPreventReattachmentOfDismissedScreens(t){O.set(t)}},stable:{}};var H=U