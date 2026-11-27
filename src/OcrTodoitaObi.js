/**
 * 画面の下に出す「読み取りが届きました［見る］×」の帯（どの画面にいても出す。置くのは src/MainNavigator.js。11/28）。
 *
 * 写真の読み取りの窓を、答えが届く前に閉じても読み続ける（2026-11-20 本人「閉じても読み続ける」）。
 * 閉じたあとに届いたら、この帯で知らせる。［見る］で窓を開くと、届いた結果（確かめの画面）が出る。
 * 読めなかったときも知らせる（［見る］で、同じ写真と訳の出た窓が開く。そのまま読み直せる）。
 * × で帯を消し、預けた結果も捨てる。帯は知らせの帯（1.5 秒で消える・指を通す）とは別で、押せる。
 * 帯（トースト）は Modal に入れない（RN-web の Modal が焦点を取り戻す。覚え書きのとおり）
 */
'use strict';

const { 色 } = require('./iro.js');
const { View, Text, Pressable } = require('./rn');
const Icons = require('@expo/vector-icons');
const { 届いた帯の文 } = require('./ocrMatsu');

/**
 * @param {{ 届いた: null | { 成功: boolean, モード: string }, 見る: () => void, 捨てる: () => void }} props
 */
function 読み取りの届いた帯({ 届いた, 見る, 捨てる }) {
  if (!届いた) return null;
  const 文 = 届いた帯の文(届いた);
  return (
    <View
      testID="読み取りの届いた帯"
      accessibilityRole="alert"
      aria-live="polite"
      style={{ position: 'absolute', left: 12, right: 12, bottom: 88, alignItems: 'center', zIndex: 20 }}
      pointerEvents="box-none"
    >
      <View
        style={{
          width: '100%',
          maxWidth: 480,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 色.白,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: 色.区切り,
          paddingVertical: 10,
          paddingLeft: 14,
          paddingRight: 10,
        }}
      >
        <Icons.Ionicons
          name={届いた.成功 ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color={届いた.成功 ? 色.青 : 色.赤}
        />
        <Text style={{ flex: 1, fontSize: 14, fontWeight: 'bold', color: 色.黒, lineHeight: 20 }}>{文}</Text>
        <Pressable
          testID="読み取りの届いた帯-見る"
          onPress={見る}
          accessibilityRole="button"
          accessibilityLabel={`${文}。見る`}
          hitSlop={8}
          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 色.青 }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: 色.白 }}>見る</Text>
        </Pressable>
        <Pressable
          testID="読み取りの届いた帯-閉じる"
          onPress={捨てる}
          accessibilityRole="button"
          accessibilityLabel="閉じる（読み取りの結果を捨てる）"
          aria-label="閉じる（読み取りの結果を捨てる）"
          hitSlop={10}
        >
          <Icons.Ionicons name="close" size={22} color={色.灰} />
        </Pressable>
      </View>
    </View>
  );
}

module.exports = { 読み取りの届いた帯 };
