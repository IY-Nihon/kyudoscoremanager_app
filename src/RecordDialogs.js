'use strict';

const { View, StyleSheet, Text, Modal, TextInput, Pressable, TouchableOpacity } = require('./rn');
const { IS_WEB } = require('./IS_WEB');
// 見た目の決まりは、切り出した窓と分け合うので別のファイル（2026-10-05）
const { styles } = require('./recordStyles');
const ExpoHaptics = require('expo-haptics');

/**
 * 記録画面の確認の窓たち（2026-10-05 に RecordScreen.js から切り出した。動きは変えていない）。
 * ・記録表のリセット　・アプリ内の確認（{ 文, 実行 }。ブラウザの確認窓は使わない）　・区切りのチーム名
 * 状態と処理は記録画面が持ち、ここは描くだけ
 */
const 記録画面の確認の窓たち = ({
  区切りにチーム名を付ける,
  resetCurrentSession,
  リセットの窓,
  リセットの窓を出す,
  チーム名を付ける区切り,
  setチーム名を付ける区切り,
  チーム名の下書き,
  setチーム名の下書き,
  確認,
  確認を置く,
  知らせる,
}) => {
  return (
    <>
      <Modal
        visible={リセットの窓}
        transparent
        animationType="fade"
        onRequestClose={() => リセットの窓を出す(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => リセットの窓を出す(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>すべての記録をリセット</Text>
            <Text style={styles.modalMessage}>
              現在入力されているすべての的中記録と交代設定、およびすべてのデータが削除されます。リセットしてよろしいですか？
            </Text>
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && IS_WEB && { backgroundColor: '#E5E5EA' },
                ]}
                onPress={() => リセットの窓を出す(false)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 },
                  hovered && IS_WEB && { opacity: 0.8 },
                ]}
                onPress={() => {
                  リセットの窓を出す(false);
                  resetCurrentSession();
                  ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning);
                  知らせる('リセットしました。');
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>リセット</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={null !== 確認} transparent animationType="fade" onRequestClose={() => 確認を置く(null)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
          onPress={() => 確認を置く(null)}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: '#FFF',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 15, color: '#1C1C1E', lineHeight: 22 }}>
                {(確認 && 確認.文) || ''}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: '#C6C6C8',
              }}
            >
              <Pressable
                style={({ hovered }) => [
                  { flex: 1, padding: 16, alignItems: 'center' },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => 確認を置く(null)}
              >
                <Text style={{ fontSize: 17, color: '#007AFF' }}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  {
                    flex: 1,
                    padding: 16,
                    alignItems: 'center',
                    borderLeftWidth: StyleSheet.hairlineWidth,
                    borderLeftColor: '#C6C6C8',
                  },
                  hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
                ]}
                onPress={() => {
                  const 手 = 確認 && 確認.実行;
                  確認を置く(null);
                  if (手) 手();
                }}
              >
                <Text style={{ fontSize: 17, color: '#007AFF', fontWeight: 'bold' }}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
      <Modal
        visible={!!チーム名を付ける区切り}
        transparent
        animationType="fade"
        onRequestClose={() => setチーム名を付ける区切り(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setチーム名を付ける区切り(null)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>チーム名</Text>
            <Text style={styles.modalMessage}>
              {/* 記録表は右から左へ並ぶ（row-reverse）。並びで「後ろ」の */
              /* 射手は、画面では区切りの左に出る。「右」と書いていたころは */
              /* 案内と逆の側に色が付いて見えた */}
              この区切りより左の射手が、そのチームになります。大学名などを入れてください。空にすると、ただの間隔に戻ります。
            </Text>
            <TextInput
              aria-label="チーム名"
              style={styles.チーム名の入力}
              value={チーム名の下書き}
              onChangeText={setチーム名の下書き}
              placeholder="例: ◯◯大学"
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                区切りにチーム名を付ける(チーム名を付ける区切り, チーム名の下書き);
                setチーム名を付ける区切り(null);
              }}
            />
            <View style={styles.modalButtonsRow}>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
                  hovered && IS_WEB && { backgroundColor: '#E5E5EA' },
                ]}
                onPress={() => setチーム名を付ける区切り(null)}
              >
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={({ hovered }) => [
                  styles.modalBtn,
                  { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
                  hovered && IS_WEB && { opacity: 0.9 },
                ]}
                onPress={() => {
                  区切りにチーム名を付ける(チーム名を付ける区切り, チーム名の下書き);
                  setチーム名を付ける区切り(null);
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>決定</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

module.exports = { 記録画面の確認の窓たち };
