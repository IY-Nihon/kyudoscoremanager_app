/**
 * 設定の「使い方を見る」で開く窓。知りたいところだけ見られる（2026-10-19 本人の希望：
 * 毎回最初から全部見るのは面倒・いちいち画面を操作させられるのも面倒）。
 *   ・最初から順に案内を見る（今までどおり、画面の上で押しながら進む）
 *   ・まとまり（メンバーの登録・記録表の便利な機能…）を押すと開き、項目を押すとその場で開いて
 *     小見出しごとに短い動画と説明が出る。一覧ごとスクロールできる（別の窓には移らない）
 *   ・「画面でやってみる」で、その項目の手順だけ画面の上の案内を始める。見終えたらそこで終わる（TutorialGuide の 選んだ題）
 * 一覧の中身は usageList.js。動画は public/usage/<名>.mp4（scripts/usage-videos.mjs）。読めなければ隠して文だけ出す。
 */
const React = require('react');
const { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert } = require('./rn');
const Icons = require('@expo/vector-icons');
const { useScoreStore } = require('./useScoreStore');
const { 手順を作る } = require('./tutorialSteps');
const { 見える記録数 } = require('./syncRules');
const { 使い方の一覧 } = require('./usageList');
const 案内 = require('./TutorialGuide');
const { 色 } = require('./iro.js');

const 使い方の選び窓 = ({ 見える, 閉じる }) => {
  const 役割 = useScoreStore((状態) => 状態.activeRole);
  const 部員数 = useScoreStore((状態) => (Array.isArray(状態.members) ? 状態.members.length : 0));
  const 記録数 = useScoreStore((状態) => 見える記録数(状態));
  const 一覧 = React.useMemo(() => 使い方の一覧(役割), [役割]);
  // 「画面でやってみる」で始められる案内の題。指す先（目印）のある手順だけ（説明だけの手順で始めても、
  // 一覧と同じ文が吹き出しに出るだけ。2026-10-19 本人）。役割や中身で出ない手順もここで外れる
  const 案内できる題 = React.useMemo(() => {
    const { 基本, 続き } = 手順を作る(役割, { 部員数, 記録数 });
    return new Set([...基本, ...続き].filter((一つ) => 一つ.目印).map((一つ) => 一つ.題));
  }, [役割, 部員数, 記録数]);
  const [開いた組, 組を置く] = React.useState(null);
  const [開いた項目, 項目を置く] = React.useState(null);
  // 動画が無い（取りに行くと index.html が返る）ものは覚えて隠す
  const [読めない, 読めないを置く] = React.useState({});
  const [縦横, 縦横を置く] = React.useState({});

  const 始める = (題たち) => {
    閉じる();
    if (案内.startTutorial(題たち) === 'ライブ中') {
      Alert.alert(
        '使い方を見る',
        'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。'
      );
    }
  };

  const 動画 = (名) =>
    名 && !読めない[名] ? (
      <View style={[styles.動画の枠, { aspectRatio: 縦横[名] || 720 / 1332 }]}>
        {React.createElement('video', {
          key: 名,
          src: `/usage/${名}.mp4`,
          autoPlay: true,
          loop: true,
          muted: true,
          playsInline: true,
          preload: 'auto',
          onError: () => 読めないを置く((前) => ({ ...前, [名]: true })),
          onLoadedMetadata: (e) => {
            const { videoWidth: 幅, videoHeight: 高さ } = e.currentTarget;
            if (幅 && 高さ) 縦横を置く((前) => ({ ...前, [名]: 幅 / 高さ }));
          },
          'data-testid': '使い方の動画',
          style: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
        })}
      </View>
    ) : null;

  return (
    <Modal visible={見える} transparent animationType="fade" onRequestClose={閉じる}>
      <View style={styles.幕}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={閉じる} />
        <View style={styles.窓} testID="使い方の選び窓">
          <View style={styles.頭}>
            <Text style={styles.題}>使い方</Text>
            <TouchableOpacity onPress={閉じる} style={styles.閉じる} accessibilityLabel="閉じる">
              <Icons.Ionicons name="close" size={24} color={色.灰} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.巻物} contentContainerStyle={{ paddingBottom: 16 }}>
            <TouchableOpacity style={styles.全部} onPress={() => 始める(null)} testID="使い方-全部">
              <Icons.Ionicons name="play-circle" size={28} color={色.白} />
              <View style={{ flex: 1 }}>
                <Text style={styles.全部の字}>最初から順に案内を見る</Text>
                <Text style={styles.全部の添え}>画面の上で、実際に押しながら進みます</Text>
              </View>
            </TouchableOpacity>

            {一覧.map((組) => {
              const 開 = 開いた組 === 組.名;
              return (
                <View key={組.名} style={styles.組}>
                  <TouchableOpacity
                    style={styles.組の行}
                    onPress={() => {
                      組を置く(開 ? null : 組.名);
                      項目を置く(null);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: 開 }}
                    testID={'使い方の組-' + 組.名}
                  >
                    <View style={styles.組の絵}>
                      <Icons.Ionicons name={組.絵 || 'help'} size={18} color={色.青} />
                    </View>
                    <Text style={styles.組の名}>{組.名}</Text>
                    <Icons.Ionicons name={開 ? 'chevron-up' : 'chevron-down'} size={18} color={色.灰} />
                  </TouchableOpacity>
                  {開 &&
                    組.項目.map((項) => {
                      const 項目が開 = 開いた項目 === 項.名;
                      const 案内の題たち = (項.案内 || []).filter((題) => 案内できる題.has(題));
                      return (
                        <View key={項.名} style={styles.項目}>
                          <TouchableOpacity
                            style={styles.項目の行}
                            onPress={() => 項目を置く(項目が開 ? null : 項.名)}
                            accessibilityRole="button"
                            accessibilityState={{ expanded: 項目が開 }}
                            testID={'使い方の項目-' + 項.名}
                          >
                            <Text style={[styles.項目の名, 項目が開 && { color: 色.青, fontWeight: 'bold' }]}>
                              {項.名}
                            </Text>
                            <Icons.Ionicons
                              name={項目が開 ? 'remove' : 'add'}
                              size={18}
                              color={項目が開 ? 色.青 : 色.灰}
                            />
                          </TouchableOpacity>
                          {項目が開 && (
                            <View style={styles.中身} testID="使い方の中身">
                              {項.部分.map((部, 番) => (
                                <View key={番} style={番 > 0 ? styles.部分の間 : null}>
                                  {!!部.見出し && <Text style={styles.小見出し}>{部.見出し}</Text>}
                                  {動画(部.動画)}
                                  {部.文.map((行, i) => (
                                    <Text key={i} style={styles.説明}>
                                      {行}
                                    </Text>
                                  ))}
                                </View>
                              ))}
                              {案内の題たち.length > 0 && (
                                <TouchableOpacity
                                  style={styles.やってみる}
                                  onPress={() => 始める(案内の題たち)}
                                  testID="使い方-やってみる"
                                >
                                  <Icons.Ionicons name="hand-left-outline" size={16} color={色.青} />
                                  <Text style={styles.やってみるの字}>画面でやってみる</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              );
            })}
          </ScrollView>
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
    padding: 12,
  },
  窓: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: 色.地,
    borderRadius: 16,
    overflow: 'hidden',
  },
  頭: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  題: { flex: 1, fontSize: 20, fontWeight: 'bold', color: 色.黒 },
  閉じる: { padding: 8 },
  巻物: { flexShrink: 1, paddingHorizontal: 12 },
  全部: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 色.青,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  全部の字: { color: 色.白, fontSize: 16, fontWeight: 'bold' },
  全部の添え: { color: 色.白, fontSize: 12, opacity: 0.85, marginTop: 2 },
  組: { backgroundColor: 色.白, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  組の行: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 10 },
  組の絵: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 色.青の地,
    alignItems: 'center',
    justifyContent: 'center',
  },
  組の名: { flex: 1, fontSize: 16, fontWeight: 'bold', color: 色.黒 },
  項目: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 色.灰_薄い, marginLeft: 52 },
  項目の行: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 14,
    minHeight: 44,
  },
  項目の名: { flex: 1, fontSize: 15, color: 色.黒 },
  // 項目の名は左に字下げしているが、中身は箱の幅いっぱいに使う（動画の字を大きく見せる）
  中身: { marginLeft: -40, paddingRight: 12, paddingBottom: 14 },
  小見出し: { fontSize: 14, fontWeight: 'bold', color: 色.黒, marginBottom: 6 },
  部分の間: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 色.灰_薄い,
  },
  動画の枠: {
    // 小さく縮めると字が掠れて読めない（2026-10-19 本人）ので幅いっぱいに出す
    width: '100%',
    backgroundColor: 色.地,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 色.灰_薄い,
    overflow: 'hidden',
    marginBottom: 10,
  },
  説明: { fontSize: 14, color: 色.黒, lineHeight: 21, marginBottom: 4 },
  やってみる: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 色.青,
  },
  やってみるの字: { color: 色.青, fontSize: 14, fontWeight: 'bold' },
});

module.exports = { 使い方の選び窓 };
