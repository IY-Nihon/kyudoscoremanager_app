/**
 * Module ID: AIMascot (hand-written)
 * AIアシスタントのキャラクター。ドット絵の小さな生き物で、弓道らしく鉢巻をして袴をはいている。
 * 図形（View）を並べて描くので、画像ファイルもフォントも要らず、どの端末でも同じ形に出る。
 * 絵そのもの（と、色の記号）は aiMascotArt.js。ここは描くことと、動かすことだけ。
 */
'use strict';

const React = require('react');
const { useEffect, useRef, useState } = React;
const { View, Animated } = require('./rn');

const { 開いた連なり, 閉じた連なり, 色, 幅のマス, 高さのマス } = require('./aiMascotArt');

/** まばたきの間（ms）。決まった間隔だと機械的なので、ばらつかせる */
const まばたきの間 = () => 2600 + Math.random() * 2600;
/** 目を閉じている長さ（ms） */
const 閉じている間 = 140;

/**
 * @param {{マス?: number, 体?: string, 目?: string, 弦?: string, 襟?: string, 動く?: boolean, 考え中?: boolean}} props
 *   マス … 1 マスの画面上の大きさ（px）。既定 3（幅 48 × 高さ 42）
 *   体 … 体の色（既定は白。明るい地の上では '#007AFF' などにする）
 *   目 … 目の色
 *   弦 … 弦の色（明るい地の上では濃い灰色にする）
 *   襟 … 道着の襟の色（既定は、白い体の上で読める紺。青い体の上では白にする）
 *   道着 … 上衣の布の色（既定は、白い体の上で読める薄い青灰。青い体の上では '#7DBBFF' にする）
 *   動く … まばたきをする（既定 false。並べて出す小さな絵は止めておく）
 *   考え中 … 上下に弾んで、少し傾く（答えを待っている間）。あわせてまばたきもする
 */
function AIMascot({
  マス = 3,
  体 = 色.W,
  目 = 色.K,
  弦 = 色.S,
  襟 = 色.C,
  道着 = 色.D,
  動く = false,
  考え中 = false,
}) {
  // 袴（N・n）は濃い紺のまま。白い体の上でも青い体の上でも読める
  const 塗る = { W: 体, R: 色.R, K: 目, B: 色.B, S: 弦, C: 襟, D: 道着, N: 色.N, n: 色.n };
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

  const 絵 = 閉じた ? 閉じた連なり : 開いた連なり;
  const 画 = (
    <View
      accessible={false}
      pointerEvents="none"
      style={{ width: 幅のマス * マス, height: 高さのマス * マス }}
    >
      {/* 同じ色が横に続くところは 1 つの図形にまとめる（図形の数を減らす） */}
      {絵.map((連なり, y) =>
        連なり.map(({ 字, 始め, 長さ }) => (
          <View
            key={始め + '-' + y}
            style={{
              position: 'absolute',
              left: 始め * マス,
              top: y * マス,
              width: 長さ * マス,
              height: マス,
              backgroundColor: 塗る[字],
            }}
          />
        ))
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

// 並べて出す絵は引数が変わらない（数・色・真偽だけ）。チャットが流れて描き直されるたびに
// 全部の絵を作り直さないよう、引数が同じなら描き直さない
module.exports = { AIMascot: React.memo(AIMascot) };
