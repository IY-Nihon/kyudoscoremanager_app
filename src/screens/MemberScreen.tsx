import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  SafeAreaView, Modal, Alert, Platform
} from 'react-native';
import { useScoreStore } from '../stores/useScoreStore';
import { Member, Gender } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

export const MemberScreen: React.FC = () => {
  const { members, addMember, updateMember, deleteMember, incrementAllGrades } = useScoreStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('未設定');
  const [grade, setGrade] = useState('1');
  const [termKi, setTermKi] = useState('');
  const currentFreshmanTerm = useScoreStore(state => state.currentFreshmanTerm);

  // Auto-calculate termKi when grade changes
  useEffect(() => {
    if (grade && currentFreshmanTerm) {
      const g = parseInt(grade) || 0;
      if (g >= 1 && g <= 4) {
        const calculatedTerm = currentFreshmanTerm - (g - 1);
        setTermKi(String(calculatedTerm));
      } else if (g === 0) {
        // For alumni/others, don't clear it automatically if it's already there, 
        // but default to an older term if needed.
      }
    }
  }, [grade, currentFreshmanTerm]);

  const filteredMembers = (members || []).filter(m =>
    m && m.name && m.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // 1. Grade (1 to 4, then Graduated/0 at bottom)
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

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setGender('未設定');
    setGrade('1');
    // Ensure termKi is set based on currentFreshmanTerm immediately
    if (currentFreshmanTerm) {
      setTermKi(String(currentFreshmanTerm));
    } else {
      setTermKi('');
    }
    setModalVisible(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setGender(member.gender);
    setGrade(member.grade.toString());
    setTermKi(member.termKi?.toString() || '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('名前を入力してください');
      } else {
        Alert.alert('エラー', '名前を入力してください');
      }
      return;
    }
    const gradeNum = parseInt(grade) || 0;
    const termKiNum = termKi === '' ? undefined : (parseInt(termKi) || undefined);
    if (editingMember) {
      updateMember(editingMember.id, { name, gender, grade: gradeNum, termKi: termKiNum });
    } else {
      addMember(name, gender, gradeNum, termKiNum);
    }
    setModalVisible(false);
  };

  const handleDelete = (id: string, name: string) => {
    const message = `${name} さんを削除しますか？`;
    
    const executeDelete = () => {
      deleteMember(id);
      setModalVisible(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        '確認',
        message,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '削除', style: 'destructive', onPress: executeDelete }
        ]
      );
    }
  };

  const handleBulkPromotion = () => {
    const message = '全員の学年を1つ上げます。4年生は卒業生リストへ移動します。また今年度の1年生の期も1つ繰り上がります。この操作は取り消せません。続行しますか？';
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        incrementAllGrades();
      }
    } else {
      Alert.alert(
        '新年度処理',
        message,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '実行', style: 'destructive', onPress: () => incrementAllGrades() }
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: Member }) => (
    <TouchableOpacity 
      style={styles.memberCard}
      onPress={() => handleOpenEdit(item)}
    >
      <View style={styles.nameRow}>
        <Text style={[styles.genderDot, { color: item.gender === '男子' ? '#007AFF' : item.gender === '女子' ? '#FF2D55' : '#8E8E93' }]}>●</Text>
        <Text style={styles.memberName}>{item.name}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={styles.memberSub}>
          {item.termKi ? `${item.termKi}期 / ` : ''}{item.gender} / {item.grade > 0 ? `${item.grade}年` : '卒業生/その他'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>部員管理</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity style={styles.addBtn} onPress={handleBulkPromotion}>
            <Ionicons name="trending-up" size={24} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
            <Ionicons name="person-add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="部員を検索..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredMembers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>部員がいません</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingMember ? '部員編集' : '新規登録'}</Text>
            
            <Text style={styles.label}>名前</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="例: 山田 太郎"
            />

            <Text style={styles.label}>性別</Text>
            <View style={styles.genderRow}>
              {(['男子', '女子', '未設定'] as Gender[]).map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.genderBtnText, gender === g && styles.genderBtnTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>学年</Text>
            <View style={styles.stepperContainer}>
              <Text style={styles.stepperValue}>
                {grade === '0' ? 'その他' : `${grade}年生`}
              </Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity 
                   style={styles.stepperBtn} 
                   onPress={() => {
                     const num = parseInt(grade) || 0;
                     if (num > 0) setGrade(String(num - 1));
                   }}
                >
                  <Ionicons name="remove" size={24} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.stepperDivider} />
                <TouchableOpacity 
                   style={styles.stepperBtn} 
                   onPress={() => {
                     const num = parseInt(grade) || 0;
                     if (num < 4) setGrade(String(num + 1));
                   }}
                >
                  <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>期</Text>
            <TextInput
              style={styles.input}
              value={termKi}
              onChangeText={setTermKi}
              placeholder="例: 70"
              keyboardType="number-pad"
            />

            <View style={[styles.modalFooter, { justifyContent: editingMember ? 'space-between' : 'flex-end' }]}>
              {editingMember && (
                <TouchableOpacity 
                  style={{ paddingVertical: 10, paddingHorizontal: 10, alignSelf: 'center' }} 
                  onPress={() => handleDelete(editingMember.id, editingMember.name)}
                >
                  <Text style={{ fontSize: 16, color: '#FF3B30', fontWeight: '500' }}>削除</Text>
                </TouchableOpacity>
              )}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 12,
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },

  listContent: { padding: 12 },
  memberCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  genderDot: { fontSize: 14 },
  memberName: { fontSize: 18, fontWeight: '600', color: '#000' },
  memberSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF', width: '90%', maxWidth: 400,
    borderRadius: 20, padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 14, color: '#8E8E93', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#F2F2F7', height: 44, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 16,
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1, height: 40, backgroundColor: '#F2F2F7',
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: '#007AFF' },
  genderBtnText: { color: '#000', fontWeight: '500' },
  genderBtnTextActive: { color: '#FFF' },
  
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 30 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelBtnText: { color: '#8E8E93', fontSize: 16 },
  saveBtn: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 10 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    height: 44,
    paddingLeft: 16,
  },
  stepperValue: {
    fontSize: 16,
    color: '#000',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    marginRight: 2,
    height: 40,
  },
  stepperBtn: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#C6C6C8',
  },
});
