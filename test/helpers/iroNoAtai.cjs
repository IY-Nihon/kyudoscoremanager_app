'use strict';
/**
 * ソースの文字にある 色.名前（src/iro.js）を、もとの色の値 '#…' に戻す。
 * 画面のコードの色を名前で書くようにしたので（2026-10-16）、ソースの文字から色の値を拾って
 * 確かめる検査は、これを通してから拾う。基本色.名前（マスコットの絵のファイル）も同じ
 */
const { 色 } = require('../../src/iro.js');

const 名たち = Object.keys(色).sort((a, b) => b.length - a.length);

function 色の名を値に(本体) {
  let s = String(本体);
  for (const 名 of 名たち) {
    const 印 = new RegExp('(?<![\\p{L}\\p{N}_$])(?:基本色|色)\\.' + 名.replace(/\$/g, '\\$') + '(?![\\p{L}\\p{N}_$])', 'gu');
    s = s.replace(印, "'" + 色[名] + "'");
  }
  return s;
}

module.exports = { 色の名を値に };
