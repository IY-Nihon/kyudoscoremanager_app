/**
 * Module ID: 199
 */
'use strict';

const _e = exports;

('use strict');
Object.defineProperty(_e, '__esModule', { value: !0 });
Object.defineProperty(_e, 'IS_WEB', {
  enumerable: !0,
  get: function () {
    return e;
  },
});
Object.defineProperty(_e, 'IS_IOS', {
  enumerable: !0,
  get: function () {
    return t;
  },
});
Object.defineProperty(_e, 'WEB_TOP_PADDING', {
  enumerable: !0,
  get: function () {
    return n;
  },
});
Object.defineProperty(_e, 'SAFE_TOP_PADDING', {
  enumerable: !0,
  get: function () {
    return u;
  },
});
Object.defineProperty(_e, 'GEMINI_API_KEY', {
  enumerable: !0,
  get: function () {
    return c;
  },
});
// 復元の際、ここは「常に true を返す try」と「常に false になる式」に
// 潰れていた。Web だけに配っているので結果は合っていたが、何を見て
// いるのか読めないため、本来の判定に戻す。
// Web では Metro が react-native を react-native-web へ向けるので、
// Platform.OS は 'web' になる（値は今までと同じ）
const Platform = require('./platform').default;
const e = Platform.OS === 'web';
const t = Platform.OS === 'ios';
const n = 60;
const u = e ? n : 0;
const c = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
