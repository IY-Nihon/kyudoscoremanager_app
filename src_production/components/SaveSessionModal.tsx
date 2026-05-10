import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert as RNAlert } from 'react-native';
import { useScoreStore } from '../stores/useScoreStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, note: string, includeInStats: boolean) => void;
}

export const SaveSessionModal: React.FC<Props> = ({ visible, onClose, onSave }) => {
  const { includeInStats, setIncludeInStats } = useScoreStore();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = (include: boolean) => {
    if (!include) {
      setShowConfirm(true);
      return;
    }
    setIncludeInStats(true);
    onSave(title.trim(), note.trim(), true);
    setTitle('');
    setNote('');
  };

  const confirmExclude = () => {
    setIncludeInStats(false);
    onSave(title.trim(), note.trim(), false);
    setTitle(''); 
    setNote('');
    setShowConfirm(false);
  };

  const handleClose = () => {
    setTitle('');
    setNote('');
    setShowConfirm(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={Keyboard.dismiss} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.container}
        >
          {showConfirm ? (
            <View>
              <Text style={styles.headerTitle}>統計の除外確認</Text>
              <Text style={styles.subTitle}>
                この記録を統計（分析画面）に含めずに保存しますか？{'\n'}
                （試合や特定の練習などを除外したい場合に利用します）
              </Text>

              <View style={styles.separator} />

              <TouchableOpacity style={[styles.mainSaveBtn, { backgroundColor: '#FF3B30' }]} onPress={confirmExclude}>
                <Text style={styles.mainSaveTxt}>統計に含めず保存</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirm(false)}>
                <Text style={styles.cancelTxt}>戻る</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.headerTitle}>練習記録の保存</Text>
              <Text style={styles.subTitle}>保存内容を入力してください。</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="大会名・練習名（例: ○○大会）"
                  placeholderTextColor="#C7C7CC"
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="練習メモ（例: 合宿1日目）"
                  placeholderTextColor="#C7C7CC"
                  value={note}
                  onChangeText={setNote}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.separator} />

              <TouchableOpacity style={styles.mainSaveBtn} onPress={() => handleSave(true)}>
                <Text style={styles.mainSaveTxt}>保存</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleSave(false)}>
                <Text style={styles.secondaryTxt}>統計に含めないで保存</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelTxt}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginVertical: 10,
  },
  mainSaveBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#007AFF',
    marginBottom: 8,
  },
  mainSaveTxt: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    marginBottom: 8,
  },
  secondaryTxt: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 15,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  cancelTxt: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
