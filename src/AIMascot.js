/**
 * Module ID: AIMascot (hand-written)
 * AIアシスタントのキャラクター。ドット絵の小さな生き物で、弓道らしく鉢巻をしている。
 * 図形（View）を並べて描くので、画像ファイルもフォントも要らず、どの端末でも同じ形に出る。
 *
 *   W … 体（白）  R … 鉢巻（赤）  K … 目（濃い色）  B … 弓（木の色）  S … 弦  . … 何も無い
 *   右手で弓を握っている（弓は縦に持ち、弦は体の側）。
 */
'use strict';

const React = require('react');
const { View } = require('./rn');

/** 体（幅 11）と、弓（幅 4）を、行ごとに並べて 1 枚の絵にする。9 行 */
const 体の絵 = [
  '...WWWWW...',
  '..WWWWWWW..',
  '.RRRRRRRRR.',
  '.WWWWWWWWW.',
  '.WWKWWWKWW.',
  '.WWKWWWKWWW', // 右手（腕）を弓の握りまで伸ばす
  'WWWWWWWWWWW',
  '..WWWWWWW..',
  '..WW...WW..',
];
const 弓の絵 = ['.B..', '.SB.', '.SB.', '.S.B', '.S.B', 'WWWB', '.S.B', '.SB.', '.B..'];
const 絵 = 体の絵.map((行, i) => 行 + 弓の絵[i]);

const 色 = { W: '#FFFFFF', R: '#FF3B30', K: '#1C1C1E', B: '#C8874B', S: '#E5E5EA' };

/** 絵の大きさ（マスの数）。幅 15 × 高さ 9 */
const 幅のマス = 絵[0].length;
const 高さのマス = 絵.length;

/**
 * @param {{マス?: number, 体?: string, 目?: string}} props
 *   マス … 1 マスの画面上の大きさ（px）。既定 3（幅 45 × 高さ 27）
 *   体 … 体の色（既定は白。明るい地の上では '#007AFF' などにする）
 *   目 … 目の色
 *   弦 … 弦の色（明るい地の上では濃い灰色にする）
 */
function AIMascot({ マス = 3, 体 = 色.W, 目 = 色.K, 弦 = 色.S }) {
  const 塗る = { W: 体, R: 色.R, K: 目, B: 色.B, S: 弦 };
  return (
    <View
      accessible={false}
      pointerEvents="none"
      style={{ width: 幅のマス * マス, height: 高さのマス * マス }}
    >
      {絵.map((行, y) =>
        [...行].map((字, x) =>
          字 === '.' ? null : (
            <View
              key={x + '-' + y}
              style={{ position: 'absolute', left: x * マス, top: y * マス, width: マス, height: マス, backgroundColor: 塗る[字] }}
            />
          )
        )
      )}
    </View>
  );
}

module.exports = { AIMascot };
