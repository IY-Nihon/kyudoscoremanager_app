/**
 * Module ID: 610
 */
"use strict";

const g = (typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);
const r = require;
const i = (typeof metroImport !== 'undefined' ? metroImport : undefined);
const a = (typeof id !== 'undefined' ? id : 610);
const m = module;
const _e = exports;
const d = (typeof dependencyMap !== 'undefined' ? dependencyMap : []);

"use strict";var e,t=require("./ANDROID_EMBEDDED_URL_BASE_RESOURCE_611"),s=require("./module_614"),u=require("./default_619"),o=(e=u)&&e.__esModule?e:{default:e};if(s.IS_ENV_WITH_LOCAL_ASSETS){(o.default.setCustomSourceTransformer||u.setCustomSourceTransformer)(function(e){try{if('fileHashes'in e.asset&&e.asset.fileHashes){const s=t.Asset.fromMetadata(e.asset);return s.uri.startsWith(t.ANDROID_EMBEDDED_URL_BASE_RESOURCE)?e.resourceIdentifierWithoutScale():e.fromSource(s.downloaded?s.localUri:s.uri)}return e.defaultAsset()}catch{return e.defaultAsset()}})}