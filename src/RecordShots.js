'use strict';

const { View, ScrollView, StyleSheet, Text, Modal, TextInput, Pressable, TouchableOpacity } = require('./rn');
const { IS_WEB } = require('./IS_WEB');
// 見た目の決まりは、切り出した窓と分け合うので別のファイル（2026-10-05）
const { styles } = require('./recordStyles');
const ExpoHaptics = require('expo-haptics');

/**
 * 記録画面の射数の窓たち（2026-10-05 に RecordScreen.js から切り出した。動きは変えていない）。
 * ・射数の一覧（4 本きざみ）　・自由入力（1〜500）　・入っている○×が消えるときの確認
 * 状態と処理は記録画面が持ち、ここは描くだけ
 */
/** 射数の一覧（4 本きざみと「任意...」） */
const 射数の一覧の窓 = ({
  setShotsPerRound,
  shotsPerRound,
  射数を減らす確認,
  射数を減らす確認を出す,
  減らす先の射数,
  射数の入力窓,
  射数の入力窓を出す,
  射数の下書き,
  射数の下書きを置く,
  射数の窓,
  射数の窓を閉じる,
  射数を変える,
  入力した射数で決める,
}) => (
  <Modal visible={射数の窓} transparent animationType="fade" onRequestClose={射数の窓を閉じる}>
    <Pressable
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
        paddingTop: 16,
      }}
      onPress={射数の窓を閉じる}
    >
      {/* 横向きのスマホでは画面に収まらず、4射・8射に届かなかった（2026-09-26）。 */
      /* 窓は画面の高さまでに縮め、射数の並びだけを流す（見出しとキャンセルは残す） */}
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
          <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '600' }}>射数の設定</Text>
        </View>
        <ScrollView style={{ flexGrow: 0, flexShrink: 1 }}>
          {[4, 8, 12, 16, 20].map((本数) => (
            <Pressable
              key={`shot-option-${本数}`}
              style={({ hovered }) => [
                {
                  padding: 18,
                  alignItems: 'center',
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: '#C6C6C8',
                },
                hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
              ]}
              onPress={() => {
                射数を変える(本数);
                射数の窓を閉じる();
              }}
            >
              <Text style={{ fontSize: 20, color: '#007AFF' }}>{本数}射</Text>
            </Pressable>
          ))}
          <Pressable
            style={({ hovered }) => [
              { padding: 18, alignItems: 'center' },
              hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
            ]}
            onPress={() => {
              射数の窓を閉じる();
              setTimeout(() => {
                射数の下書きを置く(String(shotsPerRound));
                射数の入力窓を出す(true);
              }, 100);
            }}
          >
            <Text style={{ fontSize: 20, color: '#007AFF' }}>任意...</Text>
          </Pressable>
        </ScrollView>
      </View>
      <Pressable
        style={({ hovered }) => [
          {
            width: '90%',
            maxWidth: 400,
            backgroundColor: '#FFF',
            borderRadius: 14,
            marginTop: 8,
            padding: 18,
            alignItems: 'center',
          },
          hovered && IS_WEB && { opacity: 0.8 },
        ]}
        onPress={射数の窓を閉じる}
      >
        <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
      </Pressable>
    </Pressable>
  </Modal>
);

/** 射数を減らすと、入っている○×が消えるときの確認 */
const 射数を減らす確認の窓 = ({
  setShotsPerRound,
  shotsPerRound,
  射数を減らす確認,
  射数を減らす確認を出す,
  減らす先の射数,
  射数の入力窓,
  射数の入力窓を出す,
  射数の下書き,
  射数の下書きを置く,
  射数の窓,
  射数の窓を閉じる,
  射数を変える,
  入力した射数で決める,
}) => (
  <Modal
    visible={射数を減らす確認}
    transparent
    animationType="fade"
    onRequestClose={() => 射数を減らす確認を出す(false)}
  >
    <View style={styles.modalBackdrop}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => 射数を減らす確認を出す(false)}
      />
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>射数を減らしますか？</Text>
        <Text style={styles.modalMessage}>
          射数を{減らす先の射数}射に減らすと、後ろの入力済みデータがすべて削除されます。よろしいですか？
        </Text>
        <View style={styles.modalButtonsRow}>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]}
            onPress={() => 射数を減らす確認を出す(false)}
          >
            <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]}
            onPress={() => {
              射数を減らす確認を出す(false);
              setShotsPerRound(減らす先の射数);
              ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Text style={[styles.modalBtnText, { color: '#FFF' }]}>削除して変更</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

/** 射数の自由入力（1〜500） */
const 射数の自由入力の窓 = ({
  setShotsPerRound,
  shotsPerRound,
  射数を減らす確認,
  射数を減らす確認を出す,
  減らす先の射数,
  射数の入力窓,
  射数の入力窓を出す,
  射数の下書き,
  射数の下書きを置く,
  射数の窓,
  射数の窓を閉じる,
  射数を変える,
  入力した射数で決める,
}) => (
  <Modal
    visible={射数の入力窓}
    transparent
    animationType="fade"
    onRequestClose={() => 射数の入力窓を出す(false)}
  >
    <View style={styles.modalBackdrop}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => 射数の入力窓を出す(false)}
      />
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>射数の詳細設定</Text>
        <Text style={styles.modalMessage}>1〜500本の間で入力してください</Text>
        <TextInput
          aria-label="射数"
          style={styles.modalInput}
          keyboardType="number-pad"
          value={射数の下書き}
          onChangeText={射数の下書きを置く}
          onSubmitEditing={入力した射数で決める}
          autoFocus
        />
        <View style={styles.modalButtonsRow}>
          <Pressable
            style={({ hovered }) => [
              styles.modalBtn,
              { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 },
              hovered && IS_WEB && { backgroundColor: '#E5E5EA' },
            ]}
            onPress={() => 射数の入力窓を出す(false)}
          >
            <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
          </Pressable>
          <Pressable
            style={({ hovered }) => [
              styles.modalBtn,
              { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 },
              hovered && IS_WEB && { opacity: 0.8 },
            ]}
            onPress={入力した射数で決める}
          >
            <Text style={[styles.modalBtnText, { color: '#FFF' }]}>決定</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

module.exports = { 射数の一覧の窓, 射数を減らす確認の窓, 射数の自由入力の窓 };
