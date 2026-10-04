'use strict';

const { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, Pressable } = require('./rn');
const { IS_WEB } = require('./IS_WEB');
const { useScoreStore } = require('./useScoreStore');
const Icons = require('@expo/vector-icons');
const ExpoHaptics = require('expo-haptics');

/**
 * 履歴画面の「ゴミ箱」の窓（2026-10-05 に HistoryScreen.js から切り出した。動きは変えていない）。
 * 消した記録の一覧。中身を見る・戻す・選んでまとめて消す。状態と処理は履歴画面が持ち、ここは描くだけ
 */
const ゴミ箱の中身の窓 = ({
  trash,
  setHistoryViewMode,
  setSelectedHistorySessionId,
  restoreSession,
  emptyTrash,
  ゴミ箱の窓,
  ゴミ箱の窓を出す,
  ゴミ箱を編集中,
  ゴミ箱を編集中を置く,
  ゴミ箱で選んだ,
  ゴミ箱で選んだを置く,
  setゴミ箱の記録,
  ゴミ箱の選択を切り替える,
}) => {
  return (
    <>
      <Modal
        visible={ゴミ箱の窓}
        transparent
        animationType="slide"
        onRequestClose={() => ゴミ箱の窓を出す(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '90%',
              height: '80%',
              backgroundColor: '#F2F2F7',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  ゴミ箱を編集中を置く(!ゴミ箱を編集中);
                  ゴミ箱で選んだを置く(new Set());
                }}
              >
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '500' }}>
                  {ゴミ箱を編集中 ? '完了' : '編集'}
                </Text>
              </TouchableOpacity>
              {ゴミ箱を編集中 ? (
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (0 === ゴミ箱で選んだ.size) return;
                      // まとめて戻す。1件ずつ待つと、通信できないときに
                      // 1件目の送信が終わらず、残りが戻らないまま画面も
                      // 反応しなくなる。
                      useScoreStore.getState().restoreTrashItems(Array.from(ゴミ箱で選んだ));
                      ゴミ箱で選んだを置く(new Set());
                      ゴミ箱を編集中を置く(false);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: ゴミ箱で選んだ.size > 0 ? '#007AFF' : '#C6C6C8',
                        fontWeight: '500',
                      }}
                    >
                      復元
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => {
                      if (0 === ゴミ箱で選んだ.size) return;
                      const 消す = () => {
                        const 消すID = Array.from(ゴミ箱で選んだ);
                        useScoreStore.getState().deleteTrashItems(消すID);
                        ゴミ箱で選んだを置く(new Set());
                        ゴミ箱を編集中を置く(false);
                        if (trash.length - 消すID.length <= 0) ゴミ箱の窓を出す(false);
                      };
                      Alert.alert('完全に削除', '選択したゴミ箱の記録を完全に削除します。よろしいですか？', [
                        { text: 'キャンセル', style: 'cancel' },
                        { text: '削除', style: 'destructive', onPress: 消す },
                      ]);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: ゴミ箱で選んだ.size > 0 ? '#FF3B30' : '#C6C6C8',
                        fontWeight: '500',
                      }}
                    >
                      削除
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (0 !== trash.length)
                        Alert.alert(
                          'ゴミ箱を空にする',
                          'ゴミ箱内のすべての記録を完全に削除します。よろしいですか？',
                          [
                            { text: 'キャンセル', style: 'cancel' },
                            {
                              text: '空にする',
                              style: 'destructive',
                              onPress: () => {
                                emptyTrash();
                                ゴミ箱の窓を出す(false);
                              },
                            },
                          ]
                        );
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: trash.length > 0 ? '#FF3B30' : '#C6C6C8',
                        fontWeight: '500',
                      }}
                    >
                      すべて削除
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => ゴミ箱の窓を出す(false)}>
                    <Icons.Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold' }}>ゴミ箱</Text>
            </View>
            <View style={{ paddingHorizontal: 16, flex: 1 }}>
              <View
                style={{
                  backgroundColor: '#FFF',
                  borderRadius: 10,
                  overflow: 'hidden',
                  paddingHorizontal: 16,
                  flex: 1,
                }}
              >
                <FlatList
                  data={trash}
                  keyExtractor={(記録) => 記録.id}
                  ItemSeparatorComponent={() => (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA' }} />
                  )}
                  ListEmptyComponent={
                    <Text
                      style={{ textAlign: 'center', color: '#8E8E93', paddingVertical: 40, fontSize: 16 }}
                    >
                      ゴミ箱は空です
                    </Text>
                  }
                  renderItem={({ item: 記録 }) => {
                    const 日付 = new Date(記録.date);
                    const 日付の文 = `${日付.getFullYear()}年${日付.getMonth() + 1}月${日付.getDate()}日`;
                    // 押すと中身を見られる（見るだけ）。選んでいる最中は選ぶ・外すに使う
                    return (
                      <Pressable
                        testID={`ゴミ箱の記録-${記録.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={
                          ゴミ箱を編集中 ? `${日付の文} を選ぶ` : `${日付の文} の記録を見る`
                        }
                        aria-label={ゴミ箱を編集中 ? `${日付の文} を選ぶ` : `${日付の文} の記録を見る`}
                        onPress={() => {
                          if (ゴミ箱を編集中) return void ゴミ箱の選択を切り替える(記録.id);
                          setゴミ箱の記録(記録.id);
                          setSelectedHistorySessionId(記録.id);
                          setHistoryViewMode('detail');
                          ゴミ箱の窓を出す(false);
                          ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
                        }}
                        style={({ hovered }) => [
                          {
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 14,
                          },
                          hovered && { backgroundColor: 'rgba(0,122,255,0.05)' },
                          IS_WEB && { cursor: 'pointer' },
                        ]}
                      >
                        {ゴミ箱を編集中 && (
                          <TouchableOpacity
                            onPress={() => ゴミ箱の選択を切り替える(記録.id)}
                            style={{ marginRight: 12, paddingVertical: 4 }}
                          >
                            <Icons.Ionicons
                              name={ゴミ箱で選んだ.has(記録.id) ? 'checkmark-circle' : 'ellipse-outline'}
                              size={22}
                              color={ゴミ箱で選んだ.has(記録.id) ? '#007AFF' : '#C7C7CC'}
                            />
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                            {日付の文} {記録.title ? `[${記録.title}]` : ''}
                          </Text>
                          {!!記録.note && (
                            <Text style={{ fontSize: 12, color: '#000', marginTop: 4 }} numberOfLines={1}>
                              {記録.note}
                            </Text>
                          )}
                        </View>
                        {!ゴミ箱を編集中 && (
                          <TouchableOpacity onPress={() => restoreSession(記録.id)}>
                            <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '500' }}>復元</Text>
                          </TouchableOpacity>
                        )}
                        {!ゴミ箱を編集中 && (
                          <Icons.Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#C7C7CC"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

module.exports = { ゴミ箱の中身の窓 };
