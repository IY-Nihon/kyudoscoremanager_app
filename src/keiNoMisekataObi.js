/**
 * 計の列の見せ方が変わったとき、何に変わったかを帯で知らせる（記録画面・履歴の詳細の両方で使う）。
 * 開いたときの値では出さない。見た目は記録画面の知らせの帯（recordStyles の feedbackOverlay）と同じ。
 */
const React = require('react');
const { View, Text, StyleSheet } = require('./rn');
const { useScoreStore } = require('./useScoreStore');
const { 色 } = require('./iro.js');

const 見せ方の名 = ['的中数', '的中数/射数', '的中数/累計', '立ごとの的中率', '累計の的中率'];

const 計の見せ方の帯 = () => {
  const 見せ方 = useScoreStore((状態) => 状態.計の見せ方);
  const 前 = React.useRef(見せ方);
  const [文, 文を置く] = React.useState(null);
  React.useEffect(() => {
    if (前.current === 見せ方) return undefined;
    前.current = 見せ方;
    文を置く(`計を「${見せ方の名[Number(見せ方) || 0]}」で表示します`);
    const 消す = setTimeout(() => 文を置く(null), 1500);
    return () => clearTimeout(消す);
  }, [見せ方]);
  if (!文) return null;
  return (
    <View style={styles.帯} pointerEvents="none">
      <Text style={styles.字}>{文}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  帯: {
    position: 'absolute',
    bottom: 100,
    pointerEvents: 'none',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 50,
  },
  字: { color: 色.白, fontSize: 14, fontWeight: 'bold' },
});

module.exports = { 計の見せ方の帯, 見せ方の名 };
