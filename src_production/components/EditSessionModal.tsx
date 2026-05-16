import React, { useState, useEffect } from 'react';
import {
  View, Modal, StyleSheet, Text, TouchableOpacity, TextInput, Switch, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SessionRecord, Mark } from '../models/types';
import * as Haptics from 'expo-haptics';
import { CustomCalendarModal } from './CustomCalendarModal';
import { useScoreStore } from '../stores/useScoreStore';

interface EditSessionModalProps {
  visible: boolean;
  session: SessionRecord | null;
  onClose: () => void;
  onSave: (updates: Partial<SessionRecord>) => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  visible,
  session,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [shotCount, setShotCount] = useState(8);
  const [includeInStats, setIncludeInStats] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [attendanceEdit, setAttendanceEdit] = useState<Record<string, 'present' | 'absent'>>({});

  const { isAdminMode, members: allMembers } = useScoreStore();

  useEffect(() => {
    if (session) {
      setTitle(session.title || '');
      setNote(session.note || '');
      setShotCount(session.shotCount || 8);
      setIncludeInStats(session.includeInStats);
      setSelectedDate(new Date(session.date));
      setAttendanceEdit(session.attendance ? { ...session.attendance } : {});
    }
  }, [session, visible]);

  const handleSaveAttempt = () => {
    // Shot count check
    if (session && shotCount < session.shotCount) {
      setConfirmVisible(true);
    } else {
      executeSave(selectedDate.getTime());
    }
  };

  const executeSave = (timestamp: number) => {
    const updates: Partial<SessionRecord> = {
      title,
      note,
      date: timestamp,
      includeInStats,
      shotCount
    };

    if (isAdminMode) {
      updates.attendance = attendanceEdit;
    }

    // If shotCount changed, we might need to truncate marks for each archer
    if (session && shotCount !== session.shotCount) {
      updates.archers = session.archers.map(archer => {
        if (archer.isSeparator) return archer;
        const newMarks = [...archer.marks];
        if (shotCount > archer.marks.length) {
          newMarks.push(...Array(shotCount - archer.marks.length).fill(''));
        } else {
          newMarks.splice(shotCount);
        }
        return { ...archer, marks: newMarks as Mark[] };
      });
    }

    onSave(updates);
    onClose();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>記録の編集</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>日付</Text>
            <TouchableOpacity 
              style={styles.dateSelector} 
              onPress={() => setCalendarVisible(true)}
            >
              <Text style={styles.dateSelectorText}>
                {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月 {selectedDate.getDate()}日
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            </TouchableOpacity>

            <Text style={styles.label}>タイトル</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="例: 午前練習"
            />

            <Text style={styles.label}>メモ</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={note}
              onChangeText={setNote}
              placeholder="練習のメモなど"
              multiline
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>総矢数 (現在: {session?.shotCount || 8}射)</Text>
                <TextInput
                  style={styles.input}
                  value={String(shotCount)}
                  onChangeText={(val) => setShotCount(parseInt(val) || 0)}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ width: 20 }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.label}>統計に含める</Text>
                <Switch 
                  value={includeInStats} 
                  onValueChange={setIncludeInStats}
                  trackColor={{ false: "#767577", true: "#34C759" }}
                />
              </View>
            </View>
          </View>

          {/* 出席管理セクション（管理者モード時のみ） */}
          {isAdminMode && allMembers.length > 0 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.label}>出席管理</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#E8F5E9', borderRadius: 8 }}
                    onPress={() => setAttendanceEdit(prev => {
                      const next = { ...prev };
                      allMembers.forEach(m => { next[m.id] = 'present'; });
                      return next;
                    })}
                  >
                    <Text style={{ color: '#34C759', fontSize: 12, fontWeight: 'bold' }}>全員出席</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#F2F2F7', borderRadius: 8 }}
                    onPress={() => setAttendanceEdit(prev => {
                      const next = { ...prev };
                      allMembers.forEach(m => { next[m.id] = 'absent'; });
                      return next;
                    })}
                  >
                    <Text style={{ color: '#8E8E93', fontSize: 12, fontWeight: 'bold' }}>全員欠席</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
                {allMembers.map((member, idx) => (
                  <TouchableOpacity
                    key={member.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      backgroundColor: idx % 2 === 0 ? '#FAFAFA' : '#FFF',
                      borderBottomWidth: idx < allMembers.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: '#E5E5EA',
                    }}
                    onPress={() => setAttendanceEdit(prev => {
                      const cur = prev[member.id] || 'absent';
                      return { ...prev, [member.id]: cur === 'present' ? 'absent' : 'present' };
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons
                        name={attendanceEdit[member.id] === 'present' ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={attendanceEdit[member.id] === 'present' ? '#34C759' : '#C7C7CC'}
                      />
                      <Text style={{ fontSize: 15, color: '#1C1C1E' }}>{member.name || member.id}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: attendanceEdit[member.id] === 'present' ? '#34C759' : '#8E8E93' }}>
                      {attendanceEdit[member.id] === 'present' ? '出席' : '欠席'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAttempt}>
            <Text style={styles.saveButtonText}>変更を保存</Text>
          </TouchableOpacity>
        </View>

        {/* Shot Reduction Confirmation Modal */}
        <Modal visible={confirmVisible} transparent animationType="fade">
          <View style={styles.confirmBackdrop}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>射数を減らしますか？</Text>
              <Text style={styles.confirmMessage}>射数を {shotCount} 射に減らすと、後ろの入力済みデータが全て削除されます。よろしいですか？</Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#F2F2F7' }]} onPress={() => setConfirmVisible(false)}>
                  <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: '#FF3B30' }]} onPress={() => {
                   setConfirmVisible(false);
                   executeSave(selectedDate.getTime());
                }}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>削除して変更</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <CustomCalendarModal
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#CCC',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  dateSelectorText: {
    fontSize: 16,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBox: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#3C3C43',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  }
});
