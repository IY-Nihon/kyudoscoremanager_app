import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, FlatList } from 'react-native';
import { useScoreStore } from '../stores/useScoreStore';
import { Ionicons } from '@expo/vector-icons';
import { Member } from '../models/types';

interface Props {
  visible: boolean;
  archerId: string | null;
  onClose: () => void;
}

export const ManualSubstitutionModal: React.FC<Props> = ({ visible, archerId, onClose }) => {
  const { members, shotsPerRound, setArcherMember, setArcherGuestName, setSubstitution } = useScoreStore();
  const [shotInput, setShotInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestName, setGuestName] = useState('');

  const filteredMembers = (searchQuery.trim() === '' 
    ? [...members] 
    : members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    // 1. Grade (1 to 4)
    const gradeA = (a.grade === undefined || a.grade === null) ? 99 : Number(a.grade);
    const gradeB = (b.grade === undefined || b.grade === null) ? 99 : Number(b.grade);
    const gA = gradeA === 0 ? 99 : gradeA;
    const gB = gradeB === 0 ? 99 : gradeB;
    if (gA !== gB) return gA - gB;
    
    // 2. Gender (Male -> Female -> Unknown)
    const genderOrder = (g: string | undefined) => {
      const s = (g || '').trim();
      if (s === '男子') return 0;
      if (s === '女子') return 1;
      return 2;
    };
    const genderDiff = genderOrder(a.gender) - genderOrder(b.gender);
    if (genderDiff !== 0) return genderDiff;
    
    // 3. Name (AIUEO)
    return (a.name || '').localeCompare(b.name || '', 'ja');
  });

  const formatNameExtended = (nameToFormat: string) => {
    if (!nameToFormat || typeof nameToFormat !== 'string') return '';
    const parts = nameToFormat.trim().split(/[\s　]+/);
    if (!parts || parts.length === 0) return '';
    
    const surname = parts[0] || '';
    const firstName = parts.length > 1 ? (parts[1] || '') : '';

    const sameSurnameCount = members.filter(m => {
      if (!m || !m.name || typeof m.name !== 'string') return false;
      const mParts = m.name.trim().split(/[\s　]+/);
      return mParts && mParts[0] === surname;
    }).length;

    if (sameSurnameCount > 1 && firstName) {
      return `${surname} (${firstName[0] || ''})`;
    }
    return surname || '不明';
  };

  const handleSelectMember = (name: string, memberId?: string) => {
    const num = parseInt(shotInput, 10);
    if (!isNaN(num) && num > 0 && num <= shotsPerRound && archerId) {
      setSubstitution(archerId, num - 1, name, memberId);
      handleClose();
    }
  };

  const handleSelectGuest = () => {
    if (guestName.trim() === '') return;
    handleSelectMember(guestName.trim());
  };

  const handleClose = () => {
    setShotInput('');
    setSearchQuery('');
    setGuestName('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
              <Text style={styles.headerBtnTxt}>閉じる</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>途中交代の設定</Text>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>交代するタイミング</Text>
            <View style={styles.inputRow}>
              <Text style={styles.label}>射目番号</Text>
              <TextInput
                style={styles.inputShot}
                placeholder="番号 (1〜)"
                keyboardType="number-pad"
                value={shotInput}
                onChangeText={setShotInput}
                textAlign="right"
              />
            </View>

            <Text style={styles.sectionTitle}>交代相手（部員またはゲスト）</Text>
            <TextInput
              style={styles.searchBar}
              placeholder="名前で検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.guestRow}>
              <Ionicons name="person-add" size={20} color="#007AFF" />
              <TextInput
                style={styles.guestInput}
                placeholder="ゲスト名を入力"
                value={guestName}
                onChangeText={setGuestName}
              />
              <TouchableOpacity 
                style={[styles.confirmBtn, (!guestName || !shotInput) && styles.confirmBtnDisabled]}
                onPress={handleSelectGuest}
                disabled={!guestName || !shotInput}
              >
                <Text style={styles.confirmTxt}>確定</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredMembers}
              keyExtractor={item => item.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                if (!item || !item.name || typeof item.name !== 'string') return null;
                const parts = item.name.trim().split(/[\s　]+/);
                const surname = parts && parts.length > 0 ? (parts[0] || '') : '不明';
                const firstName = parts && parts.length > 1 ? (parts[1] || '') : '';
                
                return (
                  <TouchableOpacity 
                    style={styles.memberItem}
                    onPress={() => {
                        handleSelectMember(item.name, item.id);
                    }}

                  >
                    <Text style={styles.memberName}>{surname} {firstName}</Text>
                    <Text style={styles.memberSub}>{item.gender}・{item.grade > 0 ? `${item.grade}年` : 'その他'}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerBtn: {
    width: 60,
  },
  headerBtnTxt: {
    fontSize: 17,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: '#000',
  },
  inputShot: {
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    width: 100,
    textAlign: 'right',
  },
  searchBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  guestInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  confirmBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: '#A2C8F2',
  },
  confirmTxt: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  list: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    flex: 1,
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  memberName: {
    fontSize: 16,
    color: '#000',
  },
  memberSub: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
