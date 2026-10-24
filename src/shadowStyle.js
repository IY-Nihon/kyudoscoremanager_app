'use strict';

const { 色: 基本色 } = require('./iro.js');
/**
 * 影の見た目を組み立てる。色の16進表記を rgba へ直す。
 */

/**
 * @param {number|object} config 数なら elevation。object なら shadowColor などをそのまま受ける
 * @returns {object} Web では boxShadow、端末では shadow* と elevation
 */
const getShadowStyle = (config) => {
  const 指定 = typeof config === 'number' ? { elevation: config } : config;
  const {
    shadowColor: 色 = 基本色.黒,
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
  if (color === 'black') return `rgba(0,0,0,${opacity})`;
  if (color === 'white') return `rgba(255,255,255,${opacity})`;
  const 十六進 = color.replace('#', '');
  let 赤;
  let 緑;
  let 青;
  if (十六進.length === 3) {
    赤 = parseInt(十六進[0] + 十六進[0], 16);
    緑 = parseInt(十六進[1] + 十六進[1], 16);
    青 = parseInt(十六進[2] + 十六進[2], 16);
  } else {
    if (十六進.length !== 6) return color;
    赤 = parseInt(十六進.substring(0, 2), 16);
    緑 = parseInt(十六進.substring(2, 4), 16);
    青 = parseInt(十六進.substring(4, 6), 16);
  }
  return `rgba(${赤}, ${緑}, ${青}, ${opacity})`;
};

Object.defineProperty(exports, '__esModule', { value: true });
exports.getShadowStyle = getShadowStyle;
