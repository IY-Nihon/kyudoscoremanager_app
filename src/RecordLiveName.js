'use strict';

const React = require('react');
const { View, ScrollView, Text, Modal, TextInput, Alert, TouchableOpacity } = require('./rn');
const { useScoreStore, ライブ名に使えない字 } = require('./useScoreStore');
const ExpoHaptics = require('expo-haptics');
const Icons = require('@expo/vector-icons');

/**
 * 記録画面の「ライブの名前」の窓（2026-10-05 に RecordScreen.js から切り出した。動きは変えていない）。
 * ライブを始めるときは名前を決め、入るときは開いているライブの一覧から選ぶ（または名前を打つ）。
 * 開いているライブの一覧（liveSessionsList）はこの窓の中だけで読む。記録画面ぜんぶが一覧の変化で描き直さないように
 */
const ライブ名を決める窓 = ({
  archers,
  ライブの種類,
  ライブ名の下書き,
  ライブ名の下書きを置く,
  ライブ名の窓,
  ライブ名の窓を出す,
  参加のしかたを聞くを置く,
  確認を置く,
  知らせる,
}) => {
  const ライブの一覧 = useScoreStore((状態) => 状態.liveSessionsList);
  const [ライブ名の注意, ライブ名の注意を置く] = React.useState(null);
  return (
    <>
      <Modal
        visible={ライブ名の窓}
        transparent
        animationType="fade"
        onRequestClose={() => ライブ名の窓を出す(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 300,
              backgroundColor: '#FFF',
              borderRadius: 12,
              padding: 20,
              alignItems: 'center',
              maxHeight: '80%',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              {'host' === ライブの種類 ? 'ライブを開始' : 'ライブに参加'}
            </Text>
            {'host' === ライブの種類 ? (
              <>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                  セッション名を入力してください
                </Text>
                <TextInput
                  aria-label="セッション名"
                  style={{
                    width: '100%',
                    borderWidth: 1,
                    borderColor: '#CCC',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    marginBottom: 20,
                  }}
                  value={ライブ名の下書き} // 名前を直したら注意書きも消す。残すと、直したのに
                  // 「使えません」が出たままで、何が悪いのか分からない
                  onChangeText={(文) => {
                    ライブ名の下書きを置く(文);
                    ライブ名の注意を置く(null);
                  }}
                  placeholder="session_name_123"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {ライブ名の注意 && (
                  <Text
                    style={{
                      color: '#FF3B30',
                      fontSize: 13,
                      textAlign: 'center',
                      marginBottom: 12,
                      fontWeight: 'bold',
                    }}
                  >
                    {ライブ名の注意}
                  </Text>
                )}
              </>
            ) : (
              <View style={{ width: '100%' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#666' }}>アクティブなセッション一覧</Text>
                  <TouchableOpacity
                    onPress={() => {
                      useScoreStore.getState().fetchActiveLiveSessions();
                      知らせる('更新しました');
                    }}
                  >
                    <Icons.Ionicons name="refresh" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ width: '100%', maxHeight: 300, marginBottom: 20 }}>
                  {Array.isArray(ライブの一覧) && 0 !== ライブの一覧.length ? (
                    ライブの一覧.map((名前) => (
                      <View
                        key={`live-session-${名前}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderBottomWidth: 1,
                          borderBottomColor: '#EEE',
                          backgroundColor: ライブ名の下書き === 名前 ? '#E5F1FF' : '#FFF',
                        }}
                      >
                        <TouchableOpacity
                          style={{ flex: 1, padding: 16 }} // 選び直したら注意書きも消す（入力欄と揃える）
                          onPress={() => {
                            ライブ名の下書きを置く(名前);
                            ライブ名の注意を置く(null);
                          }}
                        >
                          <Text style={{ fontSize: 16, color: '#333' }}>{名前}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ padding: 16 }}
                          onPress={() => {
                            Alert.alert('セッション削除', `セッション「${名前}」を完全に削除しますか？`, [
                              { text: 'キャンセル', style: 'cancel' },
                              {
                                text: '削除',
                                style: 'destructive',
                                onPress: () => useScoreStore.getState().deleteLiveSession(名前),
                              },
                            ]);
                          }} // 絵だけのボタン。読み上げにはアイコンの字しか渡らないので名前を付ける
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel="このライブを消す"
                          aria-label="このライブを消す"
                        >
                          <Icons.Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                      現在アクティブな記録はありません
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: '#F2F2F7',
                  alignItems: 'center',
                }}
                onPress={() => ライブ名の窓を出す(false)}
              >
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: ライブ名の下書き.trim() ? '#007AFF' : '#CCC',
                  alignItems: 'center',
                }}
                onPress={async () => {
                  if (!ライブ名の下書き.trim()) return;
                  const 名前 = ライブ名の下書き.trim();
                  // Realtime Database の枝の名前に使えない字を弾く。
                  // とくに「/」は例外にならず階層の区切りとして通ってしまい、
                  // 「5/8」のような日付を入れると 5 の下に 8 が作られる。
                  // そうなると参加一覧にも出ず、参加も削除もできないライブが残る
                  const 使えない字 = ライブ名に使えない字(名前);
                  if (使えない字)
                    return void (ライブ名の注意を置く(
                      `ライブ名に ${使えない字} は使えません。別の名前を入力してください。`
                    ),
                    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
                  if ((ライブ名の注意を置く(null), 'host' === ライブの種類)) {
                    知らせる('ライブを開始しています...');
                    const 結果 = await useScoreStore.getState().startLiveSync(名前);
                    if ('開始した' === 結果)
                      return void (ライブ名の窓を出す(false),
                      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));
                    // 「同名あり」と「確かめられなかった」を区別する。
                    // 元はどちらも「既に使用されています」と出していて、
                    // 通信が乱れただけのときに誤った案内になっていた
                    return void (ライブ名の注意を置く(
                      '同名あり' === 結果
                        ? `'${名前}' は既に使用されています。別の名前を入力してください。`
                        : '通信が不安定なため開始できませんでした。電波の良い場所でもう一度お試しください。'
                    ),
                    ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy));
                  }
                  if ('join' === ライブの種類) {
                    if (!useScoreStore.getState().liveSessionsList.includes(名前))
                      return void ライブ名の注意を置く(`'${名前}' というセッションは見つかりませんでした。`);
                    // 参加のしかたを選ぶ。見るだけなら盤面を書き換えない
                    // 参加のしかたは画面の中のポップアップで選ぶ
                    const 聞く = () => 参加のしかたを聞くを置く(名前);
                    if (archers.length > 0) {
                      確認を置く({
                        文: '手元の記録が消去され、ライブ参加データで上書きされます。よろしいですか？',
                        実行: 聞く,
                      });
                    } else 聞く();
                  }
                }}
                disabled={!ライブ名の下書き.trim()}
              >
                <Text style={{ fontSize: 16, color: '#FFF', fontWeight: 'bold' }}>決定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

module.exports = { ライブ名を決める窓 };
