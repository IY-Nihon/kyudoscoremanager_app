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
const { useEffect, useRef, useState } = React;
const { View, Animated } = require('./rn');

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
const 絵を作る = (目を閉じる) =>
  体の絵.map((行, i) => (目を閉じる && i === 4 ? 行.replace(/K/g, 'W') : 行) + 弓の絵[i]);
/** 開いた目の絵 と 閉じた目（1 段だけ残る細い目）の絵 */
const 開いた絵 = 絵を作る(false);
const 閉じた絵 = 絵を作る(true);

const 色 = { W: '#FFFFFF', R: '#FF3B30', K: '#1C1C1E', B: '#C8874B', S: '#E5E5EA' };

/** 絵の大きさ（マスの数）。幅 15 × 高さ 9 */
const 幅のマス = 開いた絵[0].length;
const 高さのマス = 開いた絵.length;

/** まばたきの間（ms）。決まった間隔だと機械的なので、ばらつかせる */
const まばたきの間 = () => 2600 + Math.random() * 2600;
/** 目を閉じている長さ（ms） */
const 閉じている間 = 140;

/**
 * @param {{マス?: number, 体?: string, 目?: string, 弦?: string, 動く?: boolean, 考え中?: boolean}} props
 *   マス … 1 マスの画面上の大きさ（px）。既定 3（幅 45 × 高さ 27）
 *   体 … 体の色（既定は白。明るい地の上では '#007AFF' などにする）
 *   目 … 目の色
 *   弦 … 弦の色（明るい地の上では濃い灰色にする）
 *   動く … まばたきをする（既定 false。並べて出す小さな絵は止めておく）
 *   考え中 … 上下に弾んで、少し傾く（答えを待っている間）。あわせてまばたきもする
 */
function AIMascot({ マス = 3, 体 = 色.W, 目 = 色.K, 弦 = 色.S, 動く = false, 考え中 = false }) {
  const 塗る = { W: 体, R: 色.R, K: 目, B: 色.B, S: 弦 };
  const [閉じた, set閉じた] = useState(false);
  const 揺れ = useRef(new Animated.Value(0)).current;

  // まばたき
  useEffect(() => {
    if (!動く && !考え中) return undefined;
    let 待ち = null;
    let 開く = null;
    const 次 = () => {
      待ち = setTimeout(() => {
        set閉じた(true);
        開く = setTimeout(() => {
          set閉じた(false);
          次();
        }, 閉じている間);
      }, まばたきの間());
    };
    次();
    return () => {
      clearTimeout(待ち);
      clearTimeout(開く);
      set閉じた(false);
    };
  }, [動く, 考え中]);

  // 考え中の揺れ（0 → 1 → 0 を繰り返す）
  useEffect(() => {
    if (!考え中) {
      揺れ.setValue(0);
      return undefined;
    }
    const 動き = Animated.loop(
      Animated.sequence([
        Animated.timing(揺れ, { toValue: 1, duration: 420, useNativeDriver: false }),
        Animated.timing(揺れ, { toValue: 0, duration: 420, useNativeDriver: false }),
      ])
    );
    動き.start();
    return () => 動き.stop();
  }, [考え中, 揺れ]);

  const 絵 = 閉じた ? 閉じた絵 : 開いた絵;
  const 画 = (
    <View accessible={false} pointerEvents="none" style={{ width: 幅のマス * マス, height: 高さのマス * マス }}>
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
  if (!考え中) return 画;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        transform: [
          { translateY: 揺れ.interpolate({ inputRange: [0, 1], outputRange: [0, -マス * 1.5] }) },
          { rotate: 揺れ.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }) },
        ],
      }}
    >
      {画}
    </Animated.View>
  );
}

module.exports = { AIMascot };
