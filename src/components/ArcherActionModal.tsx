import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, TextInput, ScrollView, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScoreStore } from '../stores/useScoreStore';
import { Member, Gender, Archer } from '../models/types';

interface ArcherActionModalProps {
  visible: boolean;
  archerId: string;
  archerName: string;
  archerOrigIdx: number; // original index in archers array
  isSeparator: boolean;
  isTotalCalculator: boolean;
  onClose: () => void;
  onSubstitution: () => void;
  // Optional callbacks for historical editing
  onSetMember?: (member: Member) => void;
  onSetGuestName?: (name: string) => void;
  onClearName?: () => void;
  onDeleteArcher?: (id: string) => void;
  onAddArcher?: (index: number) => void;
  onAddSeparator?: (index: number) => void;
  onAddTotal?: (index: number) => void;
  existingArchers?: Archer[];
}

export const ArcherActionModal: React.FC<ArcherActionModalProps> = ({
  visible, archerId, archerName, archerOrigIdx,
  isSeparator, isTotalCalculator,
  onClose, onSubstitution,
  onSetMember, onSetGuestName, onClearName,
  onDeleteArcher, onAddArcher, onAddSeparator, onAddTotal,
  existingArchers
}) => {
  const { members, archers, setArcherMember, addArcher, addSeparator, addTotalCalculator, deleteArcher } = useScoreStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');

  const currentArchersInContext = existingArchers || archers;

  const sortedMembers = useMemo(() => {
    return members
      .filter(m => !m.isAlumni && m.grade > 0)
      .filter(m => searchQuery === '' || m.name.includes(searchQuery))
      .sort((a, b) => {
        // 0. Selected status (Already selected to bottom)
        const isASelected = currentArchersInContext.some(arc => arc.memberId === a.id);
        const isBSelected = currentArchersInContext.some(arc => arc.memberId === b.id);
        if (isASelected !== isBSelected) return isASelected ? 1 : -1;

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
  }, [members, archers, searchQuery]);

  const handleSelectMember = (member: Member) => {
    if (onSetMember) {
      onSetMember(member);
    } else {
      setArcherMember(archerId, member);
    }
    onClose();
  };

  const handleGuest = () => {
    setGuestMode(true);
  };

  const handleGuestConfirm = () => {
    const trimmed = guestName.trim();
    if (trimmed) {
      if (onSetGuestName) {
        onSetGuestName(trimmed);
      } else {
        // setArcherGuestName を使う: ライブ中はRTDBに同期される
        useScoreStore.getState().setArcherGuestName(archerId, trimmed);
      }
    }
    setGuestMode(false);
    setGuestName('');
    onClose();
  };

  const handleCancelGuest = () => {
    setGuestMode(false);
    setGuestName('');
  };

  const handleClearName = () => {
    if (onClearName) {
      onClearName();
    } else {
      // setArcherMember(undefined) を使う: ライブ中はRTDBに同期される
      useScoreStore.getState().setArcherMember(archerId, null as any);
    }
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteArcher) {
      onDeleteArcher(archerId);
    } else {
      deleteArcher(archerId);
    }
    onClose();
  };

  const handleAddArcherLeft = () => {
    if (onAddArcher) {
      onAddArcher(archerOrigIdx + 1);
    } else {
      addArcher(archerOrigIdx + 1, undefined);
    }
    onClose();
  };
  
  const handleAddSeparatorLeft = () => {
    if (onAddSeparator) {
      onAddSeparator(archerOrigIdx + 1);
    } else {
      addSeparator(archerOrigIdx + 1);
    }
    onClose();
  };
  
  const handleAddTotalLeft = () => {
    if (onAddTotal) {
      onAddTotal(archerOrigIdx + 1);
    } else {
      addTotalCalculator(archerOrigIdx + 1);
    }
    onClose();
  };

  const screenH = Dimensions.get('window').height;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fullScreen}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.menuContainer, { maxHeight: screenH * 0.7 }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Action Section */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.menuItem} onPress={handleAddArcherLeft}>
                <Text style={styles.menuText}>左に射手を追加</Text>
                <Ionicons name="person-add-outline" size={20} color="#8E8E93" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleAddSeparatorLeft}>
                <Text style={styles.menuText}>左に間隔を追加</Text>
                <Ionicons name="reorder-four-outline" size={20} color="#8E8E93" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleAddTotalLeft}>
                <Text style={styles.menuText}>左に計を追加</Text>
                <Ionicons name="calculator-outline" size={20} color="#8E8E93" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Text style={[styles.menuText, { color: '#FF3B30', fontWeight: 'bold' }]}>削除</Text>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            <View style={styles.dividerFull} />

            {/* Member selection section - only for normal archers */}
            {!isSeparator && !isTotalCalculator && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>部員を選択</Text>
                </View>
                <View style={styles.section}>
                  {sortedMembers.map((member, idx) => {
                    const isSelected = currentArchersInContext.some(arc => arc.memberId === member.id);
                    return (
                      <React.Fragment key={member.id}>
                        {idx > 0 && <View style={styles.divider} />}
                        <TouchableOpacity
                          style={[styles.menuItem, isSelected && { backgroundColor: '#F0F0F5', opacity: 0.8 }]}
                          onPress={() => handleSelectMember(member)}
                        >
                          <Text style={[styles.menuText, isSelected && { color: '#8E8E93' }]}>
                            {member.name} {member.termKi ? `(${member.termKi}期)` : ''}
                          </Text>
                          {isSelected && (
                            <View style={{ backgroundColor: '#E0E0E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 }}>
                              <Text style={{ fontSize: 10, color: '#666', fontWeight: 'bold' }}>選択済</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </React.Fragment>
                    );
                  })}
                </View>

                <View style={styles.dividerFull} />

                {/* Search */}
                <View style={styles.section}>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="検索"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor="#8E8E93"
                    />
                    <Ionicons name="search" size={20} color="#8E8E93" />
                  </View>
                  
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.menuItem} onPress={handleClearName}>
                    <Text style={styles.menuText}>名前をクリア</Text>
                    <Ionicons name="close-circle-outline" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                  
                  <View style={styles.divider} />
                  {guestMode ? (
                    <View style={[styles.searchRow, { backgroundColor: '#F2F2F7', margin: 8, borderRadius: 8, padding: 8 }]}>
                      <TextInput
                        style={[styles.searchInput, { flex: 1, backgroundColor: '#FFF' }]}
                        placeholder="ゲスト名を入力"
                        value={guestName}
                        onChangeText={setGuestName}
                        placeholderTextColor="#8E8E93"
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleGuestConfirm}
                      />
                      <TouchableOpacity onPress={handleGuestConfirm} style={{ marginLeft: 10, padding: 8 }}>
                        <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>決定</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelGuest} style={{ marginLeft: 10, padding: 8 }}>
                        <Text style={{ color: '#FF3B30' }}>取消</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.menuItem} onPress={handleGuest}>
                      <Text style={styles.menuText}>ゲスト</Text>
                      <Ionicons name="person-outline" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onSubstitution(); }}>
                    <Text style={styles.menuText}>途中交代</Text>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 260,
    backgroundColor: '#FFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  section: {
    backgroundColor: '#FFF',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
  },
  sectionHeaderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  menuText: {
    fontSize: 17,
    color: '#000',
    flex: 1,
  },
  dividerFull: {
    height: 1,
    backgroundColor: '#C6C6C8',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    marginRight: 8,
  },
});
