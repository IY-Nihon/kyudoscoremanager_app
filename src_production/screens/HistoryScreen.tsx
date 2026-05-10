import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScoreStore } from '../stores/useScoreStore';
import { SessionRecord, Archer, Member, newArcher, newSeparator, newTotalCalculator } from '../models/types';
import { ArcherColumnView } from '../components/ArcherColumnView';
import { LabelColumn } from '../components/LabelColumn';
import { UIConfig } from '../constants/UIConfig';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { EditSessionModal } from '../components/EditSessionModal';
import { ArcherActionModal } from '../components/ArcherActionModal';
import { ManualSubstitutionModal } from '../components/ManualSubstitutionModal';

export const HistoryScreen: React.FC = () => {
  const { 
    sessions, 
    trash,
    isAdminMode, 
    setAdminMode,
    historyViewMode,
    setHistoryViewMode,
    selectedHistorySessionId,
    setSelectedHistorySessionId,
    viewScale,
    deleteArcher,
    deleteSession,
    deleteMultipleSessions,
    restoreSession,
    emptyTrash,
    updateSession,
    isHydrated
  } = useScoreStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTrash, setShowTrash] = useState(false);
  
  const [isTrashEditMode, setIsTrashEditMode] = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<Set<string>>(new Set());

  // Administrative Editing State
  const [isAdminMenuVisible, setAdminMenuVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  // Archer Editing in History Detail
  const [archerPickerVisible, setArcherPickerVisible] = useState(false);
  const [pickingArcherId, setPickingArcherId] = useState<string | null>(null);
  const [pickingArcherIdx, setPickingArcherIdx] = useState(0);
  const [subModalVisible, setSubModalVisible] = useState(false);

  // Detail View Scroll Sync
  const gridScrollRef = useRef<ScrollView>(null);
  const footerScrollRef = useRef<ScrollView>(null);
  
  const handleGridScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    footerScrollRef.current?.scrollTo({ x, animated: false });
  };
  const handleFooterScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    gridScrollRef.current?.scrollTo({ x, animated: false });
  };

  const currentSession = useMemo(() => {
    return sessions.find(s => s.id === selectedHistorySessionId) || null;
  }, [sessions, selectedHistorySessionId]);

  const toggleTrashSelection = (id: string) => {
    const newSet = new Set(selectedTrashIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTrashIds(newSet);
  };

  const handleOpenSession = (session: SessionRecord) => {
    if (isEditMode) {
      const newSet = new Set(selectedIds);
      if (newSet.has(session.id)) newSet.delete(session.id);
      else newSet.add(session.id);
      setSelectedIds(newSet);
      return;
    }
    setSelectedHistorySessionId(session.id);
    setHistoryViewMode('detail');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    sessions.forEach(s => yearsSet.add(new Date(s.date).getFullYear()));
    const sorted = Array.from(yearsSet).sort((a, b) => b - a);
    return sorted.length > 0 ? sorted : [new Date().getFullYear()];
  }, [sessions]);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<number>();
    sessions.forEach(s => {
      const d = new Date(s.date);
      if (d.getFullYear() === selectedYear) monthsSet.add(d.getMonth() + 1);
    });
    return Array.from(monthsSet).sort((a, b) => b - a).map(m => `${m}月`);
  }, [sessions, selectedYear]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) setSelectedYear(availableYears[0]);
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const filteredSessions = useMemo(() => {
    return (sessions || []).filter(s => {
      if (!s) return false;
      const dateObj = new Date(s.date);
      if (!searchQuery) {
        if (dateObj.getFullYear() !== selectedYear) return false;
        if (`${dateObj.getMonth() + 1}月` !== selectedMonth) return false;
      } else {
        const searchStr = searchQuery.toLowerCase();
        const titleMatch = (s.title || '').toLowerCase().includes(searchStr);
        const dateStrMatch = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`.includes(searchStr);
        if (!titleMatch && !dateStrMatch) return false;
      }
      return true;
    }).sort((a, b) => b.date - a.date);
  }, [sessions, searchQuery, selectedMonth, selectedYear]);

  const normalizeArchers = (archersRaw: any) => {
    if (!archersRaw) return [];
    if (Array.isArray(archersRaw)) return archersRaw.filter(Boolean);
    if (typeof archersRaw === 'object') return Object.values(archersRaw).filter(Boolean);
    return [];
  };

  if (!isHydrated) return null;

  const renderDetailView = () => {
    if (!currentSession) return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>記録が見つかりません</Text>
        <TouchableOpacity onPress={() => setHistoryViewMode('list')} style={{ marginTop: 20 }}>
          <Text style={{ color: '#007AFF' }}>一覧に戻る</Text>
        </TouchableOpacity>
      </View>
    );

    const dateObj = new Date(currentSession.date);
    const dateStr = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
    const shots = currentSession.shotCount || 8;
    const safeArchers = normalizeArchers(currentSession.archers);

    const validArchers = safeArchers.map((a: any) => ({
      ...a,
      marks: Array.isArray(a.marks) ? a.marks : (a.marks ? Object.values(a.marks) : Array(shots).fill('')),
      lockedBlocks: a.lockedBlocks || {},
      isSeparator: a.isSeparator || false,
      isTotalCalculator: a.isTotalCalculator || false,
      isGuest: a.isGuest || false,
    }));

    const formatName = (nameToFormat: string) => {
      if (!nameToFormat || typeof nameToFormat !== 'string') return '不明';
      const parts = nameToFormat.trim().split(/[\s　]+/);
      if (!parts || parts.length === 0) return '不明';
      
      const surname = parts[0] || '不明';
      const firstName = parts.length > 1 ? (parts[1] || '') : '';

      // Check if there are multiple members with the same surname in the members list
      const membersWithSameSurname = useScoreStore.getState().members.filter(m => {
        if (!m || !m.name) return false;
        const memberParts = m.name.trim().split(/[\s　]+/);
        return memberParts[0] === surname;
      });

      // If more than 1 distinct person (by full name) or if it's a guest and there's a member with same surname
      if (membersWithSameSurname.length > 1 && firstName) {
        return `${surname} (${firstName[0] || ''})`;
      }
      return surname;
    };

    const handlePageChange = (direction: 'next' | 'prev') => {
      const currentIndex = filteredSessions.findIndex(s => s.id === currentSession.id);
      if (currentIndex === -1) return;
      if (direction === 'prev' && currentIndex < filteredSessions.length - 1) {
        setSelectedHistorySessionId(filteredSessions[currentIndex + 1].id);
      } else if (direction === 'next' && currentIndex > 0) {
        setSelectedHistorySessionId(filteredSessions[currentIndex - 1].id);
      }
    };

    return (
      <View style={styles.detailContainer}>
        <View style={[styles.detailHeader, { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setHistoryViewMode('list')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={{ fontSize: 17, color: '#007AFF', marginLeft: -4 }}>過去の記録表</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <TouchableOpacity onPress={() => handlePageChange('prev')}>
                <Ionicons name="chevron-back" size={26} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handlePageChange('next')}>
                <Ionicons name="chevron-forward" size={26} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F9F9F9' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={styles.detailDate}>{dateStr}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => {
                setSingleDeleteId(currentSession.id);
                setDeleteConfirmVisible(true);
              }}>
                <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              </TouchableOpacity>
              {isAdminMode && (
                <TouchableOpacity onPress={() => setAdminMenuVisible(true)} style={{ marginLeft: 16 }}>
                  <Ionicons name="menu" size={26} color="#007AFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {!!currentSession.title && <Text style={styles.detailTitle}>{currentSession.title}</Text>}
          {!!currentSession.note && (
             <View style={{ marginTop: 8, padding: 8, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' }}>
               <Text style={{ fontSize: 13, color: '#3C3C43' }}>{currentSession.note}</Text>
             </View>
          )}
        </View>

        <View style={[styles.detailTableArea, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={{ flexDirection: 'column', maxWidth: '100%', maxHeight: '100%' }}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flexGrow: 0 }}>
              <View style={{ flexDirection: 'row-reverse', minWidth: '100%' }}>
                <View style={{ backgroundColor: '#F2F2F7', zIndex: 10 }}>
                  <LabelColumn shots={shots} showFooter={false} />
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true} 
                  style={{ flexGrow: 0, flexShrink: 1 }}
                  ref={gridScrollRef}
                  onScroll={handleGridScroll}
                  scrollEventThrottle={16}
                >
                  <View style={{ flexDirection: 'row-reverse' }}>
                    {validArchers.map((archer: any, idx: number) => (
                      <ArcherColumnView 
                        key={archer.id || `archer-${idx}`} 
                        archer={archer} 
                        shots={shots} 
                        allArchers={validArchers} 
                        indexInList={idx} 
                        showFooter={false}
                        isReadOnly={!isAdminMode}
                        isAdminMode={isAdminMode}
                        onPressName={() => openAdminArcherMenu(archer.id, idx)} 
                        onDelete={() => handleAdminDeleteArcher(archer.id)} 
                        onToggleMark={handleToggleMark}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>

            <View style={{ height: UIConfig.footerHeight * viewScale, flexDirection: 'row-reverse', borderTopWidth: 1.5, borderTopColor: '#000' }}>
              <View style={{ width: UIConfig.headerWidth * viewScale, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', borderLeftWidth: 1.5, borderLeftColor: '#000', borderRightWidth: 1.5, borderRightColor: '#000' }}>
                <Text style={{ fontSize: 10 * viewScale, fontWeight: 'bold', color: '#3C3C43' }}>名</Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ flexGrow: 0, flexShrink: 1 }}
                ref={footerScrollRef} 
                onScroll={handleFooterScroll} 
                scrollEventThrottle={16}
              >
                <View style={{ flexDirection: 'row-reverse' }}>
                  {validArchers.map((archer: any, idx: number) => (
                    <View key={`footer-${archer.id || idx}`} style={{ 
                      width: (archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * viewScale, 
                      height: UIConfig.footerHeight * viewScale,
                      backgroundColor: archer.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7', 
                      borderRightWidth: (archer.isSeparator || archer.isTotalCalculator) ? 1.5 : 1,
                      borderRightColor: '#000',
                      borderLeftWidth: (archer.isSeparator || archer.isTotalCalculator) ? 1.5 : 0,
                      borderLeftColor: '#000',
                      padding: 4,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                      {!archer.isSeparator && (
                        <TouchableOpacity 
                          style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
                          onPress={() => openAdminArcherMenu(archer.id, idx)}
                          disabled={!isAdminMode}
                        >
                          <Text style={{ fontSize: 14 * viewScale, fontWeight: '400', color: archer.name ? '#000' : '#8E8E93' }} numberOfLines={2}>
                            {archer.isTotalCalculator ? '合計' : (archer.name ? formatName(archer.name) : '選択')}
                          </Text>
                          {archer.isGuest && <Text style={{ fontSize: 9 * viewScale, color: '#3C3C43', marginTop: 2 }}>(ゲスト)</Text>}
                          {!archer.isTotalCalculator && archer.name !== '' && archer.gender !== '未設定' && archer.gender !== undefined && (
                            <View style={{ marginTop: 2, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 10, backgroundColor: archer.gender === '男子' ? '#007AFF' : '#FF2D55' }}>
                              <Ionicons name="person" size={10 * viewScale} color="#FFF" />
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: SessionRecord }) => {
    const dateObj = new Date(item.date);
    const dateStr = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
    const safeArchers = normalizeArchers(item.archers);
    const archerCount = safeArchers.filter((a: any) => !a.isSeparator && !a.isTotalCalculator).length;
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity style={[styles.recordItem, isEditMode && isSelected && { backgroundColor: 'rgba(0,122,255,0.1)' }]} onPress={() => handleOpenSession(item)}>
        {isEditMode && (
          <View style={{ marginRight: 12 }}>
            <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={24} color={isSelected ? "#007AFF" : "#C7C7CC"} />
          </View>
        )}
        <View style={styles.itemLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.itemDateText}>{dateStr}</Text>
            {!!item.title && <Text style={styles.itemTitleText}> [{item.title}]</Text>}
            <Ionicons name="cloud-done-outline" size={14} color="#007AFF" style={{ marginLeft: 6 }} />
            {!item.includeInStats && (
              <View style={{ backgroundColor: '#C7C7CC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>統計除外</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemSubText}>
            矢数: {item.shotCount}本 {!!item.note && <Text style={{ color: '#FF9500' }}> 🗓️ {item.note}</Text>}
          </Text>
        </View>
        <View style={styles.itemRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{archerCount}人</Text>
          </View>
          {!isEditMode && (
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const tapCountRef = useRef(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTitlePress = () => {
    tapCountRef.current += 1;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    if (tapCountRef.current >= 7) {
      useScoreStore.getState().setIsAdminModePending(true);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        useScoreStore.getState().setIsAdminModePending(false);
      }, 10000);
      
      tapCountRef.current = 0;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 500);
    }
  };

  const handleTrashPress = () => {
    if (useScoreStore.getState().isAdminModePending) {
      setAdminMode(true);
      Alert.alert('管理者モード', 'オンにしました。過去の記録を自由に編集・削除できます。');
      useScoreStore.getState().setIsAdminModePending(false);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    } else {
      setShowTrash(true);
    }
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      setSelectedIds(new Set());
    } else {
      setIsEditMode(true);
      setSelectedIds(new Set());
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmVisible(true);
  };

  const executeDelete = async () => {
    if (singleDeleteId) {
      deleteSession(singleDeleteId);
      setSingleDeleteId(null);
      setHistoryViewMode('list');
    } else {
      deleteMultipleSessions(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsEditMode(false);
    }
    setDeleteConfirmVisible(false);
  };

  const handleAdminAddArcher = () => {
    if (!currentSession) return;
    const archer = newArcher(currentSession.shotCount || 8);
    const newArchers = [...(currentSession.archers || []), archer];
    updateSession(currentSession.id, { archers: newArchers });
    setAdminMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAdminAddSeparator = () => {
    if (!currentSession) return;
    const sep = newSeparator();
    const newArchers = [...(currentSession.archers || []), sep];
    updateSession(currentSession.id, { archers: newArchers });
    setAdminMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAdminAddTotal = () => {
    if (!currentSession) return;
    const total = newTotalCalculator(currentSession.shotCount || 8);
    const newArchers = [...(currentSession.archers || []), total];
    updateSession(currentSession.id, { archers: newArchers });
    setAdminMenuVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleToggleMark = (archerId: string, index: number) => {
    if (!currentSession || !isAdminMode) return;
    const newArchers = currentSession.archers.map(a => {
      if (a.id === archerId) {
        const newMarks = [...a.marks];
        const current = newMarks[index];
        // Cycle: '' -> '○' -> '×' -> ''
        if (current === '') newMarks[index] = '○';
        else if (current === '○') newMarks[index] = '×';
        else newMarks[index] = '';
        return { ...a, marks: newMarks };
      }
      return a;
    });
    updateSession(currentSession.id, { archers: newArchers });
  };

  const handleAdminSetArcherMember = (archerId: string, member: Member) => {
    if (!currentSession) return;
    const newArchers = currentSession.archers.map(a =>
      a.id === archerId ? { ...a, name: member.name, memberId: member.id, gender: member.gender, grade: member.grade, isGuest: false } : a
    );
    updateSession(currentSession.id, { archers: newArchers });
  };

  const handleAdminSetArcherGuestName = (archerId: string, name: string) => {
    if (!currentSession) return;
    const newArchers = currentSession.archers.map(a =>
      a.id === archerId ? { ...a, name, isGuest: true, gender: '未設定' as const, grade: 0, memberId: undefined } : a
    );
    updateSession(currentSession.id, { archers: newArchers });
  };

  const handleAdminClearArcherName = (archerId: string) => {
    if (!currentSession) return;
    const newArchers = currentSession.archers.map(a =>
      a.id === archerId ? { ...a, name: '', memberId: undefined, isGuest: false, gender: '未設定' as const, grade: 0 } : a
    );
    updateSession(currentSession.id, { archers: newArchers });
  };

  const handleAdminDeleteArcher = (archerId: string) => {
    if (!currentSession) return;
    const newArchers = currentSession.archers.filter(a => a.id !== archerId);
    updateSession(currentSession.id, { archers: newArchers });
  };

  const openAdminArcherMenu = (archerId: string, idx: number) => {
    if (!isAdminMode) return;
    setPickingArcherId(archerId);
    setPickingArcherIdx(idx);
    setArcherPickerVisible(true);
  };

  const handleAdminEdit = () => {
    setAdminMenuVisible(false);
    setEditModalVisible(true);
  };

  const renderListView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.listHeaderArea}>
        {isAdminMode && (
          <TouchableOpacity onPress={() => setAdminMode(false)} style={styles.adminDeactivate}>
            <Text style={styles.adminDeactivateText}>(管理者モード解除)</Text>
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <TouchableOpacity activeOpacity={1} onPress={handleTitlePress} style={{ flex: 1 }}>
            <Text style={styles.listMainTitle}>過去の記録表</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={handleToggleEditMode} style={{ paddingVertical: 4 }}>
              <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
                {isEditMode ? '完了' : '編集'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTrashPress}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isEditMode && selectedIds.size > 0 && (
        <TouchableOpacity style={styles.batchDeleteBar} onPress={handleBatchDelete}>
          <Ionicons name="trash" size={18} color="#FFF" />
          <Text style={styles.batchDeleteText}>{selectedIds.size}件を削除</Text>
        </TouchableOpacity>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="日付 (yyyy/mm/dd) やメモで検索"
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.yearSelectorContainer}>
        <TouchableOpacity style={styles.yearButton} onPress={() => setYearModalVisible(true)}>
          <Text style={styles.yearButtonText}>{selectedYear}年度 </Text>
          <Ionicons name="chevron-expand" size={14} color="#5856D6" />
        </TouchableOpacity>
      </View>

      <View style={styles.monthTabsContainer}>
        {availableMonths.map(month => {
          const isActive = selectedMonth === month;
          return (
            <TouchableOpacity key={month} style={[styles.monthTab, isActive && styles.monthTabActive]} onPress={() => setSelectedMonth(month)}>
              <Text style={[styles.monthTabText, isActive && styles.monthTabTextActive]}>{month}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredSessions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.emptyText}>記録がありません</Text>}
      />
    </View>
  );

  const getMainView = () => {
    if (historyViewMode === 'detail') return renderDetailView();
    return renderListView();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      {getMainView()}

      <Modal visible={yearModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setYearModalVisible(false)}>
          <View style={styles.yearModal}>
            <Text style={styles.yearModalTitle}>年度を選択</Text>
            {availableYears.map(year => (
              <TouchableOpacity
                key={year}
                style={[styles.yearOption, selectedYear === year && styles.yearOptionSelected]}
                onPress={() => { setSelectedYear(year); setYearModalVisible(false); }}
              >
                <Text style={[styles.yearOptionText, selectedYear === year && styles.yearOptionTextSelected]}>{year}年度</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showTrash} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', height: '80%', backgroundColor: '#F2F2F7', borderRadius: 12, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
              <TouchableOpacity onPress={() => { setIsTrashEditMode(!isTrashEditMode); setSelectedTrashIds(new Set()); }}>
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: '500' }}>{isTrashEditMode ? '完了' : '編集'}</Text>
              </TouchableOpacity>

              {isTrashEditMode ? (
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity onPress={async () => {
                    if (selectedTrashIds.size === 0) return;
                    const idsToRestore = Array.from(selectedTrashIds);
                    for (const id of idsToRestore) {
                      await useScoreStore.getState().restoreSession(id);
                    }
                    setSelectedTrashIds(new Set());
                    setIsTrashEditMode(false);
                  }}>
                    <Text style={{ fontSize: 16, color: selectedTrashIds.size > 0 ? '#007AFF' : '#C6C6C8', fontWeight: '500' }}>復元</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    activeOpacity={0.6}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => {
                      if (selectedTrashIds.size === 0) return;
                      const executeAction = async () => {
                        const idsToDelete = Array.from(selectedTrashIds);
                        await useScoreStore.getState().deleteTrashItems(idsToDelete);
                        setSelectedTrashIds(new Set());
                        setIsTrashEditMode(false);
                        if (useScoreStore.getState().trash.length <= idsToDelete.length) {
                          setShowTrash(false);
                        }
                      };
                      if (Platform.OS === 'web') {
                        if (window.confirm('選択したゴミ箱の記録を完全に削除します。よろしいですか？')) {
                          executeAction();
                        }
                      } else {
                        Alert.alert('完全に削除', '選択したゴミ箱の記録を完全に削除します。よろしいですか？', [
                          { text: 'キャンセル', style: 'cancel' },
                          { text: '削除', style: 'destructive', onPress: executeAction }
                        ]);
                      }
                  }}>
                    <Text style={{ fontSize: 16, color: selectedTrashIds.size > 0 ? '#FF3B30' : '#C6C6C8', fontWeight: '500' }}>削除</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity onPress={() => {
                    if (trash.length === 0) return;
                    if (Platform.OS === 'web') {
                      if (window.confirm('ゴミ箱の記録をすべて完全に削除します。よろしいですか？')) {
                        emptyTrash();
                        setShowTrash(false);
                      }
                    } else {
                      Alert.alert('ゴミ箱を空にする', 'ゴミ箱内のすべての記録を完全に削除します。よろしいですか？', [
                        { text: 'キャンセル', style: 'cancel' },
                        { text: '空にする', style: 'destructive', onPress: () => { emptyTrash(); setShowTrash(false); } }
                      ]);
                    }
                  }}>
                    <Text style={{ fontSize: 16, color: trash.length > 0 ? '#FF3B30' : '#C6C6C8', fontWeight: '500' }}>すべて削除</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowTrash(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold' }}>ゴミ箱</Text>
            </View>

            <View style={{ paddingHorizontal: 16, flex: 1 }}>
              <View style={{ backgroundColor: '#FFF', borderRadius: 10, overflow: 'hidden', paddingHorizontal: 16 }}>
                <FlatList 
                  data={trash}
                  keyExtractor={item => item.id}
                  ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA' }} />}
                  ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#8E8E93', paddingVertical: 40, fontSize: 16 }}>ゴミ箱は空です</Text>}
                  renderItem={({item}) => {
                    const dateObj = new Date(item.date);
                    const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                    return (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                        {isTrashEditMode && (
                          <TouchableOpacity onPress={() => toggleTrashSelection(item.id)} style={{ marginRight: 12, paddingVertical: 4 }}>
                            <Ionicons name={selectedTrashIds.has(item.id) ? "checkmark-circle" : "ellipse-outline"} size={22} color={selectedTrashIds.has(item.id) ? "#007AFF" : "#C7C7CC"} />
                          </TouchableOpacity>
                        )}
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>{dateStr} {item.title ? `[${item.title}]` : ''}</Text>
                          {!!item.note && <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }} numberOfLines={1}>{item.note}</Text>}
                        </View>
                        {!isTrashEditMode && (
                          <TouchableOpacity onPress={() => restoreSession(item.id)}>
                            <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '500' }}>復元</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteConfirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>{singleDeleteId ? '記録を削除' : '選択した記録を削除'}</Text>
            <Text style={styles.confirmMessage}>選択した記録をゴミ箱に移動しますか？</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]} onPress={() => { setDeleteConfirmVisible(false); setSingleDeleteId(null); }}>
                <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]} onPress={executeDelete}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>移動する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isAdminMenuVisible} transparent animationType="fade" onRequestClose={() => setAdminMenuVisible(false)}>
        <TouchableOpacity style={styles.confirmOverlay} activeOpacity={1} onPress={() => setAdminMenuVisible(false)}>
          <View style={styles.adminMenuContent}>
            <TouchableOpacity style={styles.adminMenuItem} onPress={handleAdminAddArcher}>
              <Ionicons name="person-add" size={20} color="#007AFF" />
              <Text style={styles.adminMenuText}>人追加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminMenuItem} onPress={handleAdminAddSeparator}>
              <Ionicons name="pause" size={20} color="#FF9500" />
              <Text style={styles.adminMenuText}>間隔追加</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminMenuItem} onPress={handleAdminAddTotal}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#34C759', width: 20, textAlign: 'center' }}>Σ</Text>
              <Text style={styles.adminMenuText}>計追加</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#EEE', marginVertical: 8 }} />
            <TouchableOpacity style={styles.adminMenuItem} onPress={handleAdminEdit}>
              <Ionicons name="create-outline" size={20} color="#5856D6" />
              <Text style={styles.adminMenuText}>記録を編集</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <EditSessionModal 
        visible={isEditModalVisible} 
        session={currentSession} 
        onClose={() => setEditModalVisible(false)} 
        onSave={(updates) => updateSession(currentSession!.id, updates)} 
      />

      <ArcherActionModal 
        visible={archerPickerVisible} 
        archerId={pickingArcherId || ''} 
        archerName={currentSession?.archers?.find(a => a.id === pickingArcherId)?.name || ''} 
        archerOrigIdx={pickingArcherIdx} 
        isSeparator={currentSession?.archers?.find(a => a.id === pickingArcherId)?.isSeparator || false} 
        isTotalCalculator={currentSession?.archers?.find(a => a.id === pickingArcherId)?.isTotalCalculator || false} 
        onClose={() => setArcherPickerVisible(false)} 
        onSubstitution={() => setSubModalVisible(true)}
        onSetMember={(member) => handleAdminSetArcherMember(pickingArcherId!, member)}
        onSetGuestName={(name) => handleAdminSetArcherGuestName(pickingArcherId!, name)}
        onClearName={() => handleAdminClearArcherName(pickingArcherId!)}
        onDeleteArcher={handleAdminDeleteArcher}
        onAddArcher={(idx) => {
          if (!currentSession) return;
          const archer = newArcher(currentSession.shotCount || 8);
          const newArchers = [...normalizeArchers(currentSession.archers)];
          newArchers.splice(idx, 0, archer);
          updateSession(currentSession.id, { archers: newArchers });
        }}
        onAddSeparator={(idx) => {
          if (!currentSession) return;
          const sep = newSeparator();
          const newArchers = [...normalizeArchers(currentSession.archers)];
          newArchers.splice(idx, 0, sep);
          updateSession(currentSession.id, { archers: newArchers });
        }}
        onAddTotal={(idx) => {
          if (!currentSession) return;
          const total = newTotalCalculator(currentSession.shotCount || 8);
          const newArchers = [...normalizeArchers(currentSession.archers)];
          newArchers.splice(idx, 0, total);
          updateSession(currentSession.id, { archers: newArchers });
        }}
        existingArchers={normalizeArchers(currentSession?.archers)}
      />
      <ManualSubstitutionModal 
        visible={subModalVisible} 
        archerId={pickingArcherId} 
        onClose={() => setSubModalVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailContainer: { flex: 1 },
  detailHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6 },
  detailDate: { fontSize: 34, fontWeight: 'bold', color: '#000' },
  detailTitle: { fontSize: 20, color: '#000', marginTop: 4, fontWeight: '600' },
  detailTableArea: { flex: 1, padding: 0 },
  
  listHeaderArea: { paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
  adminDeactivate: { paddingBottom: 16 },
  adminDeactivateText: { color: '#FF3B30', fontSize: 13, fontWeight: '500' },
  listMainTitle: { fontSize: 36, fontWeight: 'bold', color: '#000', alignSelf: 'flex-start', marginBottom: 12 },
  
  searchContainer: { paddingHorizontal: 16, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(118,118,128,0.12)', borderRadius: 10, paddingHorizontal: 10, height: 38 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 17, color: '#000' },
  
  yearSelectorContainer: { alignItems: 'center', marginBottom: 16 },
  yearButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(88,86,214,0.12)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  yearButtonText: { color: '#5856D6', fontSize: 17, fontWeight: '500' },
  
  monthTabsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  monthTab: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(118,118,128,0.12)' },
  monthTabActive: { backgroundColor: '#007AFF' },
  monthTabText: { fontSize: 15, color: '#000', fontWeight: '500' },
  monthTabTextActive: { color: '#FFF' },
  
  listContent: { paddingHorizontal: 0 },
  recordItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  itemLeft: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  itemDateText: { fontSize: 18, fontWeight: '600', color: '#000' },
  itemTitleText: { fontSize: 16, color: '#007AFF' },
  itemSubText: { fontSize: 13, color: '#8E8E93' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  countBadge: { backgroundColor: 'rgba(52,199,89,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  countBadgeText: { color: '#34C759', fontSize: 14, fontWeight: 'bold' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#C6C6C8', marginLeft: 20 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 100, fontSize: 17 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  yearModal: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, width: 280 },
  yearModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  yearOption: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  yearOptionSelected: { backgroundColor: 'rgba(0,122,255,0.05)' },
  yearOptionText: { fontSize: 17, textAlign: 'center' },
  yearOptionTextSelected: { color: '#007AFF', fontWeight: 'bold' },

  batchDeleteBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FF3B30', paddingVertical: 10, marginHorizontal: 16, borderRadius: 10, marginBottom: 8 },
  batchDeleteText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  confirmModal: { backgroundColor: '#FFF', borderRadius: 14, padding: 20, width: '85%', maxWidth: 350, alignItems: 'center' },
  confirmTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
  modalButtonsRow: { flexDirection: 'row', width: '100%' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  adminMenuContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    width: 200,
    position: 'absolute',
    top: 100,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  adminMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  adminMenuText: {
    fontSize: 16,
    color: '#000',
  },
});
