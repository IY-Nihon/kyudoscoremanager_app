import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, SafeAreaView
} from 'react-native';
import { useScoreStore } from '../stores/useScoreStore';
import { Member, Gender } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

interface MemberPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: Member | null) => void;
  onGuest: (name: string) => void;
}

export const MemberPicker: React.FC<MemberPickerProps> = ({
  visible, onClose, onSelect, onGuest
}) => {
  const { 
    members, alumni, archers, 
    showAlumniInPicker, setShowAlumniInPicker 
  } = useScoreStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<Gender | '全て'>('全て');

  const allVisibleMembers = [
    ...(members || []),
    ...(showAlumniInPicker ? (alumni || []).map(a => ({ ...a, grade: 0 } as Member)) : [])
  ];

  const filteredMembers = allVisibleMembers.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGender = filterGender === '全て' || m.gender === filterGender;
    return matchSearch && matchGender;
  }).sort((a, b) => {
    // 0. Selected status (Already selected to bottom)
    const isASelected = archers.some(arc => arc.memberId === a.id);
    const isBSelected = archers.some(arc => arc.memberId === b.id);
    if (isASelected !== isBSelected) return isASelected ? 1 : -1;

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

  const renderItem = ({ item }: { item: Member }) => {
    const isSelected = archers.some(arc => arc.memberId === item.id);
    return (
      <TouchableOpacity 
        style={[styles.memberItem, isSelected && { backgroundColor: '#F0F0F5', opacity: 0.8 }]}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
      >
        <View style={styles.nameRow}>
          <Text style={[styles.genderDot, { color: item.gender === '男子' ? '#007AFF' : item.gender === '女子' ? '#FF2D55' : '#8E8E93' }]}>●</Text>
          <Text style={[styles.memberName, isSelected && { color: '#8E8E93' }]}>{item.name}</Text>
          {isSelected && (
            <View style={{ backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 }}>
              <Text style={{ fontSize: 10, color: '#666', fontWeight: 'bold' }}>選択済</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberInfoText}>
          {item.termKi ? `${item.termKi}期 / ` : ''}{item.grade > 0 ? `${item.grade}年` : '卒業'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelLink}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={styles.title}>部員選択</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="部員を検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          
          <View style={styles.filterRow}>
            {(['全て', '男子', '女子'] as const).map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.filterBtn, filterGender === g && styles.filterBtnActive]}
                onPress={() => setFilterGender(g)}
              >
                <Text style={[styles.filterBtnText, filterGender === g && styles.filterBtnTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.alumniToggleRow}>
            <Text style={styles.alumniToggleLabel}>卒業生を表示</Text>
            <TouchableOpacity 
              style={[styles.miniBtn, showAlumniInPicker && styles.miniBtnActive]}
              onPress={() => setShowAlumniInPicker(!showAlumniInPicker)}
            >
              <Text style={[styles.miniBtnText, showAlumniInPicker && styles.miniBtnTextActive]}>
                {showAlumniInPicker ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filteredMembers}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            searchQuery.length > 0 ? (
              <TouchableOpacity 
                style={styles.guestItem}
                onPress={() => {
                  onGuest(searchQuery);
                  onClose();
                }}
              >
                <Ionicons name="person-add-outline" size={20} color="#007AFF" />
                <Text style={styles.guestText}>「{searchQuery}」をゲストとして登録</Text>
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>該当する部員がいません</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.noSelectBtn}
            onPress={() => {
              onSelect(null);
              onClose();
            }}
          >
            <Text style={styles.noSelectText}>選択を解除 (未設定に戻す)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    height: 50, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    backgroundColor: '#FFF', borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: { fontSize: 17, fontWeight: 'bold' },
  cancelLink: { color: '#007AFF', fontSize: 17, width: 80 },

  searchSection: { backgroundColor: '#FFF', padding: 12, gap: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7',
    paddingHorizontal: 10, height: 36, borderRadius: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },

  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    flex: 1, height: 30, borderRadius: 15,
    backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#007AFF' },
  filterBtnText: { fontSize: 13, color: '#3C3C43' },
  filterBtnTextActive: { color: '#FFF', fontWeight: 'bold' },

  listContent: { paddingVertical: 8 },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  genderDot: { fontSize: 12 },
  memberName: { fontSize: 18, fontWeight: '500' },
  selectedBadge: { backgroundColor: '#EFEFF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 4 },
  selectedBadgeText: { fontSize: 10, color: '#8E8E93', fontWeight: 'bold' },
  memberInfoText: { fontSize: 14, color: '#8E8E93' },

  alumniToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  alumniToggleLabel: {
    fontSize: 14,
    color: '#3C3C43',
    fontWeight: '500',
  },
  miniBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  miniBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  miniBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  miniBtnTextActive: {
    color: '#FFF',
  },

  guestItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', padding: 16, marginBottom: 8,
  },
  guestText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8E8E93' },

  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C6C6C8' },
  noSelectBtn: {
    height: 50, borderRadius: 12, backgroundColor: '#F2F2F7',
    justifyContent: 'center', alignItems: 'center',
  },
  noSelectText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
