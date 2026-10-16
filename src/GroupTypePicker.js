'use strict';

/**
 * 団体の種類を選ぶ一覧（中学・高校／高専／短大・専門学校／大学／6年制の大学／社会人の会・道場）。
 * 団体を作る画面（暗い地）と設定の窓（明るい地）の両方で使う。種類は src/gakunen.js の 種類たち。
 * 丸の印は図形で描く（アイコンの字体が届かない端末でも出るように）。
 */
const React = require('react');
const { Text, View, Pressable, StyleSheet } = require('./rn');
const { 色 } = require('./iro.js');
const 学 = require('./gakunen');
const { IS_WEB } = require('./IS_WEB');

/**
 * @param {{ 選んだ: string|null, 選ぶ: (種類: string) => void, 暗い?: boolean }} props
 *   選んだ … 種類の id（null は大学）。暗い … 団体を作る画面（金の色で示す）
 */
function 団体の種類を選ぶ({ 選んだ, 選ぶ, 暗い }) {
  const 今の = 選んだ || 学.既定の種類;
  const 印の色 = 暗い ? 色.金 : 色.青;
  return (
    <View accessibilityRole="radiogroup" aria-label="団体の種類" style={[styles.枠, 暗い && styles.枠_暗い]}>
      {学.種類たち.map((種類, 番) => {
        const 選ばれた = 種類.id === 今の;
        return (
          <Pressable
            key={種類.id}
            accessibilityRole="radio"
            aria-checked={選ばれた}
            accessibilityState={{ checked: 選ばれた }}
            onPress={() => 選ぶ(種類.id)}
            style={({ hovered }) => [
              styles.行,
              0 < 番 && (暗い ? styles.区切り_暗い : styles.区切り),
              選ばれた && (暗い ? styles.選んだ行_暗い : styles.選んだ行),
              hovered && !選ばれた && (暗い ? styles.触れた行_暗い : styles.触れた行),
              IS_WEB && { cursor: 'pointer' },
            ]}
          >
            <View style={[styles.丸, { borderColor: 選ばれた ? 印の色 : 暗い ? 色.灰 : 色.灰_薄い }]}>
              {選ばれた ? <View style={[styles.点, { backgroundColor: 印の色 }]} /> : null}
            </View>
            <Text
              style={[
                styles.名前,
                暗い && styles.名前_暗い,
                選ばれた && { color: 暗い ? 色.金_明るい : 色.青 },
              ]}
            >
              {種類.名前}
            </Text>
            <Text style={[styles.幅, 暗い && styles.幅_暗い]}>{学.学年の幅の名前(種類.id)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  枠: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 色.地_濃い,
    backgroundColor: 色.白,
    overflow: 'hidden',
  },
  枠_暗い: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  行: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  区切り: { borderTopWidth: 1, borderTopColor: 色.地_濃い },
  区切り_暗い: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  選んだ行: { backgroundColor: 色.青の地 },
  選んだ行_暗い: { backgroundColor: 'rgba(184,150,90,0.14)' },
  触れた行: { backgroundColor: 色.地_F7F7FA },
  触れた行_暗い: { backgroundColor: 'rgba(255,255,255,0.05)' },
  丸: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  点: { width: 10, height: 10, borderRadius: 5 },
  名前: { flex: 1, fontSize: 16, color: 色.文字 },
  名前_暗い: { color: 色.白 },
  幅: { fontSize: 13, color: 色.灰 },
  幅_暗い: { color: 'rgba(255,255,255,0.5)' },
});

module.exports = { 団体の種類を選ぶ };
