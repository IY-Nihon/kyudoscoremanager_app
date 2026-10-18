/**
 * 設定の「使い方を見る」で開く窓。知りたいところだけ選んで案内を見られる（2026-10-19 本人の希望：
 * 毎回最初から全部見るのは面倒）。
 *   ・最初から全部見る（今までどおり）
 *   ・まとまり（メンバーの登録・記録表の便利な機能…）を押すと開き、「このまとまりを全部」か手順を 1 つ選ぶ
 * 選んだところを見終えたら、そこで終わる（TutorialGuide の 選んだ題）。
 */
const React = require('react');
const { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert } = require('./rn');
const Icons = require('@expo/vector-icons');
const { useScoreStore } = require('./useScoreStore');
const { 手順を作る, まとまりの一覧 } = require('./tutorialSteps');
const { 見える記録数 } = require('./syncRules');
const 案内 = require('./TutorialGuide');
const { 色 } = require('./iro.js');

const 使い方の選び窓 = ({ 見える, 閉じる }) => {
  const 役割 = useScoreStore((状態) => 状態.activeRole);
  const 部員数 = useScoreStore((状態) => (Array.isArray(状態.members) ? 状態.members.length : 0));
  const 記録数 = useScoreStore((状態) => 見える記録数(状態));
  const 一覧 = React.useMemo(() => {
    const { 基本, 続き } = 手順を作る(役割, { 部員数, 記録数 });
    return まとまりの一覧(基本, 続き);
  }, [役割, 部員数, 記録数]);
  const [開いた, 開くを置く] = React.useState(null);

  const 始める = (題たち) => {
    閉じる();
    if ('ライブ中' === 案内.startTutorial(題たち)) {
      Alert.alert(
        '使い方を見る',
        'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。'
      );
    }
  };

  return (
    <Modal visible={見える} transparent animationType="fade" onRequestClose={閉じる}>
      <View style={styles.幕}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={閉じる} />
        <View style={styles.窓} testID="使い方の選び窓">
          <Text style={styles.題}>使い方を見る</Text>
          <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ paddingBottom: 8 }}>
            <TouchableOpacity style={styles.全部} onPress={() => 始める(null)} testID="使い方-全部">
              <Icons.Ionicons name="play-circle" size={22} color={色.白} />
              <Text style={styles.全部の字}>最初から全部見る</Text>
            </TouchableOpacity>
            <Text style={styles.小見出し}>知りたいところだけ見る</Text>
            {一覧.map((組) => {
              const 開 = 開いた === 組.名;
              return (
                <View key={組.名} style={styles.組}>
                  <TouchableOpacity
                    style={styles.組の行}
                    onPress={() => 開くを置く(開 ? null : 組.名)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: 開 }}
                    testID={'使い方の組-' + 組.名}
                  >
                    <Icons.Ionicons name={開 ? 'chevron-down' : 'chevron-forward'} size={18} color={色.灰} />
                    <Text style={styles.組の名}>{組.名}</Text>
                    <Text style={styles.数}>{`${組.題たち.length}`}</Text>
                  </TouchableOpacity>
                  {開 && (
                    <View style={styles.中}>
                      <TouchableOpacity style={styles.手順の行} onPress={() => 始める(組.題たち)}>
                        <Icons.Ionicons name="play" size={14} color={色.青} />
                        <Text style={[styles.手順の字, { color: 色.青, fontWeight: 'bold' }]}>
                          このまとまりを全部
                        </Text>
                      </TouchableOpacity>
                      {組.題たち.map((題) => (
                        <TouchableOpacity key={題} style={styles.手順の行} onPress={() => 始める([題])}>
                          <Text style={styles.点}>・</Text>
                          <Text style={styles.手順の字}>{題}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.閉じる} onPress={閉じる}>
            <Text style={styles.閉じるの字}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  幕: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  窓: { width: '100%', maxWidth: 420, backgroundColor: 色.地, borderRadius: 16, padding: 18 },
  題: { fontSize: 18, fontWeight: 'bold', color: 色.黒, marginBottom: 12, textAlign: 'center' },
  全部: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 色.青,
    borderRadius: 12,
    paddingVertical: 12,
  },
  全部の字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  小見出し: { fontSize: 12, color: 色.灰, marginTop: 16, marginBottom: 6 },
  組: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 色.灰 },
  組の行: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  組の名: { flex: 1, fontSize: 15, color: 色.黒 },
  数: { fontSize: 12, color: 色.灰 },
  中: { paddingLeft: 26, paddingBottom: 8 },
  手順の行: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 6 },
  点: { color: 色.灰, fontSize: 14 },
  手順の字: { flex: 1, fontSize: 14, color: 色.黒 },
  閉じる: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  閉じるの字: { fontSize: 15, color: 色.灰 },
});

module.exports = { 使い方の選び窓 };
