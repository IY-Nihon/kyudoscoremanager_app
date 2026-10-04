'use strict';

const { View, StyleSheet, Text, Modal, Pressable, TouchableOpacity } = require('./rn');
const { IS_WEB } = require('./IS_WEB');

/**
 * 記録画面のライブの入り口の窓（2026-10-05 に RecordScreen.js から切り出した。動きは変えていない）。
 * ・ライブを始めるか、入るかを選ぶ　・入るときに、記録する側か見るだけかを選ぶ
 * 状態と処理は記録画面が持ち、ここは描くだけ
 */
/** ライブを始めるか、入るかを選ぶ */
const ライブを始めるか入るかの窓 = ({
  ライブの選び窓,
  ライブの選び窓を出す,
  参加のしかたを聞く,
  参加のしかたを聞くを置く,
  ライブに入る,
  ライブを始める窓へ,
}) => (
  <Modal
    visible={ライブの選び窓}
    transparent
    animationType="fade"
    onRequestClose={() => ライブの選び窓を出す(false)}
  >
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
      }}
      activeOpacity={1}
      onPress={() => ライブの選び窓を出す(false)}
    >
      <View
        style={{
          width: '90%',
          maxWidth: 400,
          backgroundColor: '#FFF',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          style={{
            padding: 18,
            alignItems: 'center',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: '#C6C6C8',
          }}
          onPress={() => ライブを始める窓へ('host')}
        >
          <Text style={{ fontSize: 20, color: '#007AFF' }}>ライブ記録を開始</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 18, alignItems: 'center' }}
          onPress={() => ライブを始める窓へ('join')}
        >
          <Text style={{ fontSize: 20, color: '#007AFF' }}>ライブ記録に参加</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={{
          width: '90%',
          maxWidth: 400,
          backgroundColor: '#FFF',
          borderRadius: 14,
          marginTop: 8,
          padding: 18,
          alignItems: 'center',
        }}
        onPress={() => ライブの選び窓を出す(false)}
      >
        <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

/** 入るときに、記録する側か見るだけかを選ぶ */
const 参加のしかたの窓 = ({
  ライブの選び窓,
  ライブの選び窓を出す,
  参加のしかたを聞く,
  参加のしかたを聞くを置く,
  ライブに入る,
  ライブを始める窓へ,
}) => (
  <Modal
    visible={null !== 参加のしかたを聞く}
    transparent
    animationType="fade"
    onRequestClose={() => 参加のしかたを聞くを置く(null)}
  >
    <Pressable
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
      }}
      onPress={() => 参加のしかたを聞くを置く(null)}
    >
      <View
        style={{
          width: '90%',
          maxWidth: 400,
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
          <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '600' }}>参加のしかた</Text>
          <Text style={{ fontSize: 15, color: '#3C3C43', marginTop: 4 }}>{参加のしかたを聞く || ''}</Text>
        </View>
        <Pressable
          style={({ hovered }) => [
            {
              padding: 16,
              alignItems: 'center',
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: '#C6C6C8',
            },
            hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
          ]}
          onPress={() => {
            const 名 = 参加のしかたを聞く;
            参加のしかたを聞くを置く(null);
            if (名) ライブに入る(名, false);
          }}
        >
          <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>記録用</Text>
          <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>○×を入れられます</Text>
        </Pressable>
        <Pressable
          style={({ hovered }) => [
            { padding: 16, alignItems: 'center' },
            hovered && IS_WEB && { backgroundColor: '#F2F2F7' },
          ]}
          onPress={() => {
            const 名 = 参加のしかたを聞く;
            参加のしかたを聞くを置く(null);
            if (名) ライブに入る(名, true);
          }}
        >
          <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>閲覧用</Text>
          <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 2 }}>画面を見るだけ。○×は入れません</Text>
        </Pressable>
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
        onPress={() => 参加のしかたを聞くを置く(null)}
      >
        <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
      </Pressable>
    </Pressable>
  </Modal>
);

module.exports = { ライブを始めるか入るかの窓, 参加のしかたの窓 };
