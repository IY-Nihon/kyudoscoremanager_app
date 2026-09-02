/**
 * Module ID: 195
 */
'use strict';

const _e = exports;

('use strict');
(Object.defineProperty(_e, '__esModule', { value: !0 }),
  Object.defineProperty(_e, 'setupAppCheck', {
    enumerable: !0,
    get: function () {
      return e;
    },
  }));
const e = (e) => {
  try {
    console.log('[AppCheck] Initialized for Web (Disabled due to missing ReCAPTCHA key)');
  } catch (e) {
    console.warn('[AppCheck] Web initialization failed:', e);
  }
};
