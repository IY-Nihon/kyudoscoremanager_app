/**
 * Library Bridge: default_45.js (react-native / StyleSheet)
 *
 * 素通しではなく、ダークモード対応のため create() の結果をテーマ変換する。
 *
 * ■ create() の戻り値をゲッターにしている理由
 * react-native-web の StyleSheet.create はこの時点でスタイルを
 * アトミックCSSクラスへコンパイルしてしまい、後から色を差し替えられない。
 * また create() はモジュール読み込み時に一度だけ走るため、値を確定させると
 * テーマ切替に追従できない。そこでキーごとにゲッターを張り、
 * 「描画時に style prop が読まれたタイミング」で変換するようにしている。
 *
 * RN 0.76 以降 create() は実質恒等関数であり、素のスタイルオブジェクトを
 * style prop へ渡すのは web / native どちらでも正当な使い方。
 * ライトモード時は theme.mapStyle が即座に原オブジェクトを返すため
 * 追加コストはほぼ無い。
 */
"use strict";

const { StyleSheet } = require('react-native');
const theme = require('./theme');

const themedStyleSheet = Object.create(StyleSheet);

themedStyleSheet.create = function create(styles) {
  const out = {};
  for (const key of Object.keys(styles)) {
    const value = styles[key];
    Object.defineProperty(out, key, {
      enumerable: true,
      configurable: true,
      get() {
        return theme.mapStyle(value);
      },
    });
  }
  return out;
};

Object.defineProperty(exports, '__esModule', { value: true });
exports.default = themedStyleSheet;
module.exports.StyleSheet = themedStyleSheet;
