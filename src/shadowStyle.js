/**
 * 影の見た目を組み立てる。色の16進表記を rgba へ直す。
 *
 * （ソースマップからの復元時は module_592.js という名前だった）
 */
'use strict';

/**
 * @param {number|object} config 数なら elevation。object なら shadowColor などをそのまま受ける
 * @returns {object} Web では boxShadow、端末では shadow* と elevation
 */
const getShadowStyle = (config) => {
  const 指定 = 'number' == typeof config ? { elevation: config } : config;
  const {
    shadowColor: 色 = '#000000',
    shadowOffset: ずれ = { width: 0, height: Math.floor((指定.elevation || 4) / 2) },
    shadowOpacity: 濃さ = 0.2,
    shadowRadius: ぼかし = 指定.elevation || 4,
    elevation: 高さ = 指定.elevation || 4,
  } = 指定;

  if (typeof window !== 'undefined') {
    const 影の色 = 色.startsWith('#') ? hexToRgba(色, 濃さ) : 色;
    return { boxShadow: `${ずれ.width}px ${ずれ.height}px ${ぼかし}px ${影の色}` };
  }
  return { shadowColor: 色, shadowOffset: ずれ, shadowOpacity: 濃さ, shadowRadius: ぼかし, elevation: 高さ };
};

const hexToRgba = (color, opacity) => {
  if (!color) return `rgba(0,0,0,${opacity})`;
  if (color.startsWith('rgba')) return color;
  if ('black' === color) return `rgba(0,0,0,${opacity})`;
  if ('white' === color) return `rgba(255,255,255,${opacity})`;
  const 十六進 = color.replace('#', '');
  let 赤 = 0;
  let 緑 = 0;
  let 青 = 0;
  if (3 === 十六進.length) {
    赤 = parseInt(十六進[0] + 十六進[0], 16);
    緑 = parseInt(十六進[1] + 十六進[1], 16);
    青 = parseInt(十六進[2] + 十六進[2], 16);
  } else {
    if (6 !== 十六進.length) return color;
    赤 = parseInt(十六進.substring(0, 2), 16);
    緑 = parseInt(十六進.substring(2, 4), 16);
    青 = parseInt(十六進.substring(4, 6), 16);
  }
  return `rgba(${赤}, ${緑}, ${青}, ${opacity})`;
};

Object.defineProperty(exports, '__esModule', { value: true });
exports.getShadowStyle = getShadowStyle;
