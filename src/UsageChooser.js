/**
 * 設定の「使い方を見る」で開く窓。知りたいところだけ選んで案内を見られる（2026-10-19 本人の希望：
 * 毎回最初から全部見るのは面倒）。
 *   ・最初から全部見る（今までどおり）
 *   ・まとまり（メンバーの登録・記録表の便利な機能…）を押すと開き、「このまとまりを全部」か手順を 1 つ選ぶ
 * 選ぶと、まず短い動画と説明で見せる（2026-10-19 本人：いちいち画面を操作させられるのも面倒）。
 * 動画の下の「実際にやってみる」で、今までの画面の上の案内に移る。見終えたらそこで終わる（TutorialGuide の 選んだ題）。
 * 動画は public/usage/<名>.mp4（scripts/usage-videos.mjs）。指す先の無い説明だけの手順は動画が無く、文だけ出す。
 */
const React = require('react');
const { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert } = require('./rn');
const Icons = require('@expo/vector-icons');
const { useScoreStore } = require('./useScoreStore');
const { 手順を作る, まとまりの一覧, 動画の名 } = require('./tutorialSteps');
const { 見える記録数 } = require('./syncRules');
const 案内 = require('./TutorialGuide');
const { 色 } = require('./iro.js');

const 使い方の選び窓 = ({ 見える, 閉じる }) => {
  const 役割 = useScoreStore((状態) => 状態.activeRole);
  const 部員数 = useScoreStore((状態) => (Array.isArray(状態.members) ? 状態.members.length : 0));
  const 記録数 = useScoreStore((状態) => 見える記録数(状態));
  const { 一覧, 題で } = React.useMemo(() => {
    const { 基本, 続き } = 手順を作る(役割, { 部員数, 記録数 });
    return {
      一覧: まとまりの一覧(基本, 続き),
      題で: new Map([...基本, ...続き].map((一つ) => [一つ.題, 一つ])),
    };
  }, [役割, 部員数, 記録数]);
  const [開いた, 開くを置く] = React.useState(null);
  // 見ている動画：{ 題たち, 番 }。null なら選ぶ一覧
  const [見る, 見るを置く] = React.useState(null);
  const 閉じて戻す = () => {
    見るを置く(null);
    閉じる();
  };

  const 始める = (題たち) => {
    閉じて戻す();
    if ('ライブ中' === 案内.startTutorial(題たち)) {
      Alert.alert(
        '使い方を見る',
        'ライブ記録中は、使い方の案内を始められません。ライブを止めてからお試しください。'
      );
    }
  };

  return (
    <Modal
      visible={見える}
      transparent
      animationType="fade"
      onRequestClose={() => (見る ? 見るを置く(null) : 閉じる())}
    >
      <View style={styles.幕}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={閉じて戻す} />
        {見る ? (
          <動画の窓
            題たち={見る.題たち}
            番={見る.番}
            番を置く={(番) => 見るを置く({ ...見る, 番 })}
            題で={題で}
            やってみる={() => 始める(見る.題たち.slice(見る.番))}
            戻る={() => 見るを置く(null)}
          />
        ) : (
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
                      <Icons.Ionicons
                        name={開 ? 'chevron-down' : 'chevron-forward'}
                        size={18}
                        color={色.灰}
                      />
                      <Text style={styles.組の名}>{組.名}</Text>
                      <Text style={styles.数}>{`${組.題たち.length}`}</Text>
                    </TouchableOpacity>
                    {開 && (
                      <View style={styles.中}>
                        <TouchableOpacity
                          style={styles.手順の行}
                          onPress={() => 見るを置く({ 題たち: 組.題たち, 番: 0 })}
                        >
                          <Icons.Ionicons name="play" size={14} color={色.青} />
                          <Text style={[styles.手順の字, { color: 色.青, fontWeight: 'bold' }]}>
                            このまとまりを全部
                          </Text>
                        </TouchableOpacity>
                        {組.題たち.map((題) => (
                          <TouchableOpacity
                            key={題}
                            style={styles.手順の行}
                            onPress={() => 見るを置く({ 題たち: [題], 番: 0 })}
                          >
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
        )}
      </View>
    </Modal>
  );
};

/** 1 手順ぶんの動画と説明。まとまりを選んだときは ‹ › で次の手順へ */
const 動画の窓 = ({ 題たち, 番, 番を置く, 題で, やってみる, 戻る }) => {
  const 題 = 題たち[番];
  const 手順 = 題で.get(題) || {};
  const 名 = 動画の名(題);
  // 動画の無い手順（説明だけ・指す先が画面の外）は、取りに行くと index.html が返って読めない。そのときは隠す
  const [読めない, 読めないを置く] = React.useState({});
  const 動画あり = !!名 && !読めない[名];
  const 文 = (Array.isArray(手順.文) ? 手順.文 : []).filter((行) => !/押せないようにしてあります/.test(行));
  return (
    <View style={styles.窓} testID="使い方の動画窓">
      <Text style={styles.題}>{題}</Text>
      <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ paddingBottom: 4 }}>
        {動画あり && (
          <View style={styles.動画の枠}>
            {React.createElement('video', {
              key: 名,
              src: `/usage/${名}.mp4`,
              autoPlay: true,
              loop: true,
              muted: true,
              playsInline: true,
              preload: 'auto',
              onError: () => 読めないを置く((前) => ({ ...前, [名]: true })),
              'data-testid': '使い方の動画',
              style: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
            })}
          </View>
        )}
        {文.map((行, i) => (
          <Text key={i} style={styles.説明}>
            {行}
          </Text>
        ))}
      </ScrollView>
      {題たち.length > 1 && (
        <View style={styles.めくり}>
          <TouchableOpacity
            onPress={() => 番を置く(番 - 1)}
            disabled={番 === 0}
            style={[styles.めくりの手, 番 === 0 && { opacity: 0.3 }]}
            accessibilityLabel="前の手順"
          >
            <Icons.Ionicons name="chevron-back" size={22} color={色.青} />
          </TouchableOpacity>
          <Text style={styles.数}>{`${番 + 1} / ${題たち.length}`}</Text>
          <TouchableOpacity
            onPress={() => 番を置く(番 + 1)}
            disabled={番 === 題たち.length - 1}
            style={[styles.めくりの手, 番 === 題たち.length - 1 && { opacity: 0.3 }]}
            accessibilityLabel="次の手順"
          >
            <Icons.Ionicons name="chevron-forward" size={22} color={色.青} />
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity style={styles.全部} onPress={やってみる} testID="使い方-やってみる">
        <Icons.Ionicons name="hand-left" size={18} color={色.白} />
        <Text style={styles.全部の字}>実際にやってみる</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.閉じる} onPress={戻る}>
        <Text style={styles.閉じるの字}>一覧に戻る</Text>
      </TouchableOpacity>
    </View>
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
  動画の枠: {
    // 動画は縦長の画面まるごと（540×999）。小さい画面でもボタンまで収まる高さにする
    height: 340,
    aspectRatio: 540 / 999,
    alignSelf: 'center',
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  説明: { fontSize: 14, color: 色.黒, lineHeight: 21, marginBottom: 4 },
  めくり: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 8,
  },
  めくりの手: { padding: 10 },
  閉じる: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  閉じるの字: { fontSize: 15, color: 色.灰 },
});

module.exports = { 使い方の選び窓 };
