/**
 * 動いている場（Web か iOS か）と、Web で上に空ける余白。
 *
 * （ソースマップからの復元時は module_199.js という名前だった）
 */
'use strict';

const Platform = require('./platform').default;

const IS_WEB = Platform.OS === 'web';
const IS_IOS = Platform.OS === 'ios';
/** Web では上に余白を取る（ブラウザの帯と重ならないように） */
const WEB_TOP_PADDING = 60;
/** 端末では SafeArea が受け持つので 0 */
const SAFE_TOP_PADDING = IS_WEB ? WEB_TOP_PADDING : 0;

Object.defineProperty(exports, '__esModule', { value: true });
exports.IS_WEB = IS_WEB;
exports.IS_IOS = IS_IOS;
exports.WEB_TOP_PADDING = WEB_TOP_PADDING;
exports.SAFE_TOP_PADDING = SAFE_TOP_PADDING;
