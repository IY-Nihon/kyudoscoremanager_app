import React, { useState } from 'react';
import { Member } from '../models/types';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScoreStore } from '../stores/useScoreStore';
import { Ionicons } from '@expo/vector-icons';
import { CustomCalendarModal } from '../components/CustomCalendarModal';

export const AnalysisScreen: React.FC = () => {
  const { 
    members, alumni, sessions, isHydrated, 
    showAlumniInAnalysis, setShowAlumniInAnalysis,
    currentFreshmanTerm
  } = useScoreStore();
  
  if (!isHydrated) return null;
  
  const [period, setPeriod] = useState('すべて');
  const [genderFilter, setGenderFilter] = useState('全員');
  const [gradeFilter, setGradeFilter] = useState('全学年');
  // 月ごと用: 表示中の年月
  const now = new Date();
  const [analysisYear, setAnalysisYear] = useState(now.getFullYear());
  const [analysisMonth, setAnalysisMonth] = useState(now.getMonth() + 1);
  
  // Custom range
  const [customStart, setCustomStart] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [datePromptType, setDatePromptType] = useState<'start'|'end'>('start');

  const openCalendar = (type: 'start'|'end') => {
    setDatePromptType(type);
    setCalendarVisible(true);
  };

  const handleDateSelect = (date: Date) => {
    if (datePromptType === 'start') setCustomStart(date);
    else setCustomEnd(date);
    setCalendarVisible(false);
  };

  const changeMonth = (delta: number) => {
    let m = analysisMonth + delta;
    let y = analysisYear;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setAnalysisMonth(m);
    setAnalysisYear(y);
  };

  // セッションの期間フィルタリング
  const filteredSessions = sessions.filter(s => {
    if (!s) return false;
    if (!s.includeInStats) return false;
    const now = Date.now();
    const sDate = s.date;
    
    if (period === '直近30日') {
      return now - sDate <= 30 * 24 * 60 * 60 * 1000;
    } else if (period === '期間指定') {
      const d = new Date(sDate);
      d.setHours(0,0,0,0);
      const start = new Date(customStart);
      start.setHours(0,0,0,0);
      const end = new Date(customEnd);
      end.setHours(23,59,59,999);
      return d >= start && d <= end;
    } else if (period === '今年度') {
      const d = new Date(sDate);
      const currY = new Date().getFullYear();
      const currM = new Date().getMonth() + 1;
      const fiscalY = currM >= 4 ? currY : currY - 1;
      const sYear = d.getFullYear();
      const sMonth = d.getMonth() + 1;
      const sFiscalYear = sMonth >= 4 ? sYear : sYear - 1;
      return sFiscalYear === fiscalY;
    } else if (period === '月ごと') {
      const d = new Date(sDate);
      return d.getFullYear() === analysisYear && d.getMonth() + 1 === analysisMonth;
    }
    return true; // すべて
  });

  // Calculate member stats including alumni and using memberId
  const memberStatsRaw = [...(members || []), ...(showAlumniInAnalysis ? (alumni || []) : [])]
    .filter((m): m is any => !!m)
    .map(m => {
      let shots = 0;
      let hits = 0;
      filteredSessions.forEach(s => {
        if (!s || !s.archers) return;
        s.archers.forEach(a => {
          if (!a || !a.marks) return;
          
          const subs = a.substitutions || {};
          const subIdxs = Object.keys(subs).map(Number).sort((x, y) => x - y);

          a.marks.forEach((mk, shotIdx) => {
            if (mk !== '○' && mk !== '×') return;
            
            // 誰の射か判定
            let currentMemberId = a.memberId;
            let currentName = a.name || '';
            const subIds = a.substitutionIds || {};
            for (const sIdx of subIdxs) {
              if (sIdx <= shotIdx) {
                currentMemberId = subIds[sIdx] || undefined;
                currentName = subs[sIdx];
              } else {
                break;
              }
            }

            // メンバーと一致するか確認 (メンバーIDによる比較を優先)
            const isMatch = currentMemberId ? (currentMemberId === m.id) : (currentName === m.name);
            
            if (isMatch) {
              shots++;
              if (mk === '○') hits++;
            }
          });

        });
      });
      const rate = shots > 0 ? (hits / shots * 100) : 0;
      return { ...m, rate, shots, hits };
    })
    .filter(m => {
      if (m.shots === 0) return false;
      if (genderFilter !== '全員' && m.gender !== genderFilter) return false;
      if (gradeFilter !== '全学年' && `${m.grade}年` !== gradeFilter) return false;
      return true;
    })
    .sort((a, b) => b.rate - a.rate);

  // Split ranking: only those with shots >= maxShots / 2
  const maxShots = Math.max(...memberStatsRaw.map(m => m.shots), 0);
  const memberStats = memberStatsRaw.filter(m => m.shots >= maxShots / 2);
  const outOfRankingMembers = memberStatsRaw.filter(m => m.shots < maxShots / 2);

  // Segmented Control Component
  const SegmentedControl = ({ options, selected, onSelect, label = '', isWrap = false }: any) => (
    <View style={[styles.segmentWrapper, isWrap && { flexDirection: 'column', alignItems: 'stretch', width: '100%' }]}>
      {label ? <Text style={styles.segmentLabel}>{label}</Text> : null}
      <View style={[styles.segmentContainer, isWrap && { height: 'auto', paddingBottom: 0, width: '100%', flexDirection: 'row', justifyContent: 'space-between' }]}>
        {options.map((opt: any) => {
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const isActive = selected === optValue;
          return (
            <TouchableOpacity 
              key={optValue}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive, isWrap && { flex: 1, marginHorizontal: 1 }]}
              onPress={() => onSelect(optValue)}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive, isWrap && { fontSize: 11, textAlign: 'center' }]} numberOfLines={1}>{optLabel}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>的中分析</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Filters Card */}
        <View style={styles.filtersCard}>
          <View style={{ marginBottom: 12 }}>
            <SegmentedControl 
              options={['月ごと', '期間指定', '直近30日', '今年度', 'すべて']} 
              selected={period} 
              onSelect={setPeriod} 
              isWrap={true}
            />
          </View>

          {period === '期間指定' && (
            <View style={styles.customRangeContainer}>
              <TouchableOpacity style={styles.dateBtn} onPress={() => openCalendar('start')}>
                <Text style={styles.dateLabel}>開始: {customStart.toLocaleDateString('ja-JP')}</Text>
              </TouchableOpacity>
              <Ionicons name="arrow-forward" size={16} color="#8E8E93" />
              <TouchableOpacity style={styles.dateBtn} onPress={() => openCalendar('end')}>
                <Text style={styles.dateLabel}>終了: {customEnd.toLocaleDateString('ja-JP')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {period === '月ごと' && (
            <View style={styles.monthNav}>
              <TouchableOpacity style={styles.monthNavBtn} onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text style={styles.monthNavText}>{analysisYear}年 {analysisMonth}月</Text>
              <TouchableOpacity style={styles.monthNavBtn} onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.filterDivider} />
          
          <SegmentedControl 
            label="性別:" 
            options={['全員', '男子', '女子']} 
            selected={genderFilter} 
            onSelect={setGenderFilter} 
          />
          <View style={styles.filterDivider} />

          <SegmentedControl 
            label="学年:" 
            options={[
              '全学年',
              '1年',
              '2年',
              '3年',
              '4年',
            ]} 
            selected={gradeFilter} 
            onSelect={setGradeFilter} 
          />

          <View style={styles.filterDivider} />
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>卒業生を表示</Text>
            <TouchableOpacity 
              style={[styles.miniBtn, showAlumniInAnalysis && styles.miniBtnActive]}
              onPress={() => setShowAlumniInAnalysis(!showAlumniInAnalysis)}
            >
              <Text style={[styles.miniBtnText, showAlumniInAnalysis && styles.miniBtnTextActive]}>
                {showAlumniInAnalysis ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Member List */}
        <View style={styles.listContainer}>
          {memberStats.map((m, index) => {
            const isHighlight = m.rate >= 50.0;
            return (
              <View key={m.id} style={styles.rowCard}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                  <View style={styles.nameContainer}>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={styles.memberSub}>
                      {m.graduationYear ? '卒業' : `${m.grade}年`} • {m.gender}
                    </Text>
                  </View>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rateText, { color: isHighlight ? '#D32F2F' : '#000' }]}>
                    {m.rate.toFixed(1)}%
                  </Text>
                  <Text style={styles.shotScoreText}>{m.hits}/{m.shots}</Text>
                </View>
              </View>
            );
          })}

          {outOfRankingMembers.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <View style={{ padding: 12, backgroundColor: '#F2F2F7', borderRadius: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: 'bold' }}>順位外 (射数が最多の人の半分未満)</Text>
              </View>
              {outOfRankingMembers.map((m) => (
                <View key={m.id} style={[styles.rowCard, { opacity: 0.6 }]}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rankText}>-</Text>
                    <View style={styles.nameContainer}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberSub}>
                        {m.graduationYear ? '卒業' : `${m.grade}年`} • {m.gender}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rateText}>{m.rate.toFixed(1)}%</Text>
                    <Text style={styles.shotScoreText}>{m.hits}/{m.shots}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {memberStats.length === 0 && (
             <Text style={styles.noDataText}>データがありません</Text>
          )}
        </View>

      </ScrollView>

      <CustomCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        selectedDate={datePromptType === 'start' ? customStart : customEnd}
        onSelectDate={handleDateSelect}
        title={datePromptType === 'start' ? '開始日を選択' : '終了日を選択'}
      />

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#F2F2F7',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  miniBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
  },
  miniBtnActive: {
    backgroundColor: '#007AFF',
  },
  miniBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  miniBtnTextActive: {
    color: '#FFF',
  },

  // Filters Card
  filtersCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 4,
  },
  monthNavBtn: {
    padding: 8,
  },
  monthNavText: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  filterDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 8,
  },
  segmentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
    width: 70,
    marginRight: 10,
  },
  segmentContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 2,
    minHeight: 38,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2.5,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  segmentTextActive: {
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // List Container
  listContainer: {
    gap: 8,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    color: '#8E8E93',
    width: 32,
  },
  nameContainer: {
    marginLeft: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  memberSub: {
    fontSize: 11,
    color: '#8E8E93',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  shotScoreText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  noDataText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 40,
  },
  customRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  dateBtn: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  }
});
