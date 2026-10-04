'use strict';

const React = require('react');
const { View, ScrollView, StyleSheet, Text, Modal, Pressable, TouchableOpacity } = require('./rn');
const { IS_WEB } = require('./IS_WEB');
// 見た目の決まりは、切り出した窓と分け合うので別のファイル（2026-10-05）
const { styles } = require('./recordStyles');
const ExpoHaptics = require('expo-haptics');
const Icons = require('@expo/vector-icons');

/**
 * 記録画面の「表示の拡大率」の窓（2026-10-05 に RecordScreen.js から切り出した。動きは変えていない）。
 * バーを触った位置を倍率に直す（1% きざみ）か、一覧から選ぶ。幅は 拡大の下〜拡大の上（記録画面が決める）
 */
const 拡大率の窓 = ({ setViewScale, 倍率, 拡大選択中, 拡大を選ぶ, 拡大の下, 拡大の上 }) => {
  const // 拡大率のバーの幅。指の位置を倍率に直すのに使う
    [溝の幅, 溝の幅を置く] = React.useState(0);
  const // バーのどこを触ったかを倍率に直す。1%きざみで止める
    触った所を倍率に = (横の位置) => {
      if (!溝の幅) return 倍率;
      const 割合 = Math.min(1, Math.max(0, 横の位置 / 溝の幅));
      const 生 = 拡大の下 + 割合 * (拡大の上 - 拡大の下);
      return Math.round(生 * 100) / 100;
    };
  const 倍率を割合に = (倍) => Math.min(1, Math.max(0, (倍 - 拡大の下) / (拡大の上 - 拡大の下)));
  const バーを動かす = (出来事) => {
    const 倍 = 触った所を倍率に(出来事.nativeEvent.locationX);
    if (Math.abs(倍 - 倍率) > 0.001) setViewScale(倍);
  };
  return (
    <>
      <Modal visible={拡大選択中} transparent animationType="fade" onRequestClose={() => 拡大を選ぶ(false)}>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 40,
            paddingTop: 16,
          }}
        >
          {/* 背景は「中身の親」ではなく「兄弟」にしてある。 */
          /* 親にすると、バーを掴んで離したときの click が背景まで伝わり、 */
          /* 倍率を合わせるたびに閉じてしまう */}
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
            onPress={() => 拡大を選ぶ(false)}
          />
          {/* 横向きのスマホでは画面に収まらず、下の倍率とキャンセルに届かなかった（2026-09-26）。 */
          /* 窓は画面の高さまでに縮め、倍率の並びだけを流す（見出しとバーは上に残す） */}
          <View
            style={{
              width: '90%',
              maxWidth: 400,
              flexShrink: 1,
              backgroundColor: '#FFF',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                padding: 16,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: '#C6C6C8',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '600' }}>表示の大きさ</Text>
            </View>
            {/* バーでも動かせるようにする。⊖ ⊕ は 5% ずつ */}
            <View style={styles.バーの行}>
              <TouchableOpacity
                onPress={() => setViewScale(Math.max(拡大の下, Math.round((倍率 - 0.05) * 20) / 20))}
                disabled={倍率 <= 拡大の下 + 0.001}
                accessible
                accessibilityRole="button"
                accessibilityLabel="表示を小さくする"
                aria-label="表示を小さくする"
                style={styles.zoomBtn}
              >
                <Icons.Ionicons
                  name="remove-circle-outline"
                  size={24}
                  color={倍率 <= 拡大の下 + 0.001 ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>
              <View
                style={styles.溝の当たり}
                onLayout={(出来事) => 溝の幅を置く(出来事.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={バーを動かす}
                onResponderMove={バーを動かす}
              >
                <View style={styles.溝} />
                <View style={[styles.溝の済み, { width: `${倍率を割合に(倍率) * 100}%` }]} />
                <View style={[styles.つまみ, { left: `${倍率を割合に(倍率) * 100}%` }]} />
              </View>
              <TouchableOpacity
                onPress={() => setViewScale(Math.min(拡大の上, Math.round((倍率 + 0.05) * 20) / 20))}
                disabled={倍率 >= 拡大の上 - 0.001}
                accessible
                accessibilityRole="button"
                accessibilityLabel="表示を大きくする"
                aria-label="表示を大きくする"
                style={styles.zoomBtn}
              >
                <Icons.Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={倍率 >= 拡大の上 - 0.001 ? '#C7C7CC' : '#007AFF'}
                />
              </TouchableOpacity>
              <Text style={styles.バーの数字}>{Math.round(倍率 * 100)}%</Text>
            </View>
            <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((倍) => (
                <Pressable
                  key={`zoom-option-${倍}`}
                  style={({ hovered }) => [
                    {
                      padding: 16,
                      alignItems: 'center',
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: '#C6C6C8',
                    },
                    hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                    Math.abs(倍率 - 倍) < 0.01 && { backgroundColor: '#EAF3FF' },
                  ]}
                  onPress={() => {
                    setViewScale(倍);
                    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                    拡大を選ぶ(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color: '#007AFF',
                      fontWeight: Math.abs(倍率 - 倍) < 0.01 ? 'bold' : 'normal',
                    }}
                  >
                    {Math.round(倍 * 100)}%{1 === 倍 ? '（標準）' : ''}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={({ hovered }) => [
                  { padding: 16, alignItems: 'center' },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => 拡大を選ぶ(false)}
              >
                <Text style={{ fontSize: 17, color: '#8E8E93' }}>キャンセル</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

module.exports = { 拡大率の窓 };
