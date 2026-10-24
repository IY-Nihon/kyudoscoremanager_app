/**
 * 動いている場（Web か iOS か）と、Web で上に空ける余白、配るリンクの元。
 */
'use strict';

const { Platform } = require('./rn');

const IS_WEB = Platform.OS === 'web';
const IS_IOS = Platform.OS === 'ios';
/** Web では上に余白を取る（ブラウザの帯と重ならないように） */
const WEB_TOP_PADDING = 60;
/** 端末では SafeArea が受け持つので 0 */
const SAFE_TOP_PADDING = IS_WEB ? WEB_TOP_PADDING : 0;
/** 配るリンク（招待・ライブ）の元。Web なら開いているサイト、それ以外（端末・file: など）は本番 */
const 配り元 = () =>
  typeof window !== 'undefined' && window.location && /^https?:/.test(window.location.origin || '')
    ? window.location.origin
    : 'https://kyudoscoremanager.web.app';

Object.defineProperty(exports, '__esModule', { value: true });
exports.IS_WEB = IS_WEB;
exports.IS_IOS = IS_IOS;
exports.WEB_TOP_PADDING = WEB_TOP_PADDING;
exports.SAFE_TOP_PADDING = SAFE_TOP_PADDING;
exports.配り元 = 配り元;
