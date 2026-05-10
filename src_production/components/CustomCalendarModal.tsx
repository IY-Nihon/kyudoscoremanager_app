import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays,
  setMonth,
  setYear,
  getYear,
  getMonth
} from 'date-fns';
import { ja } from 'date-fns/locale';

interface CustomCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  title?: string;
}

export const CustomCalendarModal: React.FC<CustomCalendarModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  title = '日付を選択'
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [showPicker, setShowPicker] = useState(false);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50) {
        // Swipe Right -> Previous Month
        setCurrentMonth(subMonths(currentMonth, 1));
      } else if (gestureState.dx < -50) {
        // Swipe Left -> Next Month
        setCurrentMonth(addMonths(currentMonth, 1));
      }
    },
  });

  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];

  const years = useMemo(() => {
    const list = [];
    for (let i = 1500; i <= 2500; i++) {
      list.push(i);
    }
    return list;
  }, []);

  const yearScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (showPicker) {
      const currentYear = getYear(currentMonth);
      const index = years.indexOf(currentYear);
      if (index !== -1 && yearScrollRef.current) {
        // Approximate height per item is 50
        setTimeout(() => {
          yearScrollRef.current?.scrollTo({ y: index * 50 - 100, animated: false });
        }, 50);
      }
    }
  }, [showPicker, currentMonth]);

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowPicker(!showPicker)} style={styles.headerTitleBtn}>
          <Text style={styles.headerText}>
            {format(currentMonth, 'yyyy年 M月', { locale: ja })}
          </Text>
          <Ionicons name={showPicker ? "chevron-up" : "chevron-down"} size={16} color="#007AFF" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPicker = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>年を選択</Text>
        <ScrollView 
          ref={yearScrollRef}
          showsVerticalScrollIndicator={true} 
          style={styles.yearScrollVertical}
          contentContainerStyle={styles.yearScrollContent}
        >
          {years.map((year: number) => (
            <TouchableOpacity 
              key={year} 
              style={[styles.yearItemVertical, getYear(currentMonth) === year && styles.selectedYearItem]}
              onPress={() => setCurrentMonth(setYear(currentMonth, year))}
            >
              <Text style={[styles.yearItemText, getYear(currentMonth) === year && styles.selectedYearItemText]}>{year}年</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.pickerLabel}>月を選択</Text>
        <View style={styles.monthGrid}>
          {months.map((month, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.monthItem, getMonth(currentMonth) === idx && styles.selectedMonthItem]}
              onPress={() => {
                setCurrentMonth(setMonth(currentMonth, idx));
                setShowPicker(false);
              }}
            >
              <Text style={[styles.monthItemText, getMonth(currentMonth) === idx && styles.selectedMonthItemText]}>{month}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDaysOfWeek = () => {
    return (
      <View style={styles.daysOfWeekContainer}>
        {daysOfWeek.map((day, index) => (
          <Text key={index} style={[styles.dayOfWeekText, index === 0 && { color: '#FF3B30' }, index === 6 && { color: '#007AFF' }]}>
            {day}
          </Text>
        ))}
      </View>
    );
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const rows: any[] = [];
    let dayRow: any[] = [];

    days.forEach((day, i) => {
      const isSelected = isSameDay(day, selectedDate);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isToday = isSameDay(day, new Date());

      dayRow.push(
        <TouchableOpacity
          key={day.toString()}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDayCell,
          ]}
          onPress={() => {
            onSelectDate(day);
            onClose();
          }}
        >
          <Text
            style={[
              styles.dayText,
              !isCurrentMonth && styles.notCurrentMonthText,
              isSelected && styles.selectedDayText,
              isToday && !isSelected && styles.todayText,
            ]}
          >
            {format(day, 'd')}
          </Text>
        </TouchableOpacity>
      );

      if ((i + 1) % 7 === 0) {
        rows.push(
          <View key={i} style={styles.row}>
            {dayRow}
          </View>
        );
        dayRow = [];
      }
    });

    return <View style={styles.calendarGrid}>{rows}</View>;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.modalTitleArea}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="#C7C7CC" />
            </TouchableOpacity>
          </View>

          {renderHeader()}
          
          {showPicker ? (
            renderPicker()
          ) : (
            <View {...panResponder.panHandlers}>
              {renderDaysOfWeek()}
              {renderCalendar()}
            </View>
          )}

          <TouchableOpacity 
            style={styles.todayBtn} 
            onPress={() => {
              const today = new Date();
              setCurrentMonth(today);
              onSelectDate(today);
              onClose();
            }}
          >
            <Text style={styles.todayBtnText}>今日にする</Text>
          </TouchableOpacity>
        </View>
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
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: 320,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitleArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navBtn: {
    padding: 4,
  },
  headerText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerTitleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  pickerContainer: {
    paddingBottom: 8,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '600',
  },
  yearScrollVertical: {
    height: 180,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  yearScrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  yearItemVertical: {
    width: '30%',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#FFF',
  },
  selectedYearItem: {
    backgroundColor: '#007AFF',
  },
  yearItemText: {
    fontSize: 14,
    color: '#000',
  },
  selectedYearItemText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '23%',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedMonthItem: {
    backgroundColor: '#007AFF',
  },
  monthItemText: {
    fontSize: 14,
    color: '#000',
  },
  selectedMonthItemText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  daysOfWeekContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  calendarGrid: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 1,
  },
  selectedDayCell: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  notCurrentMonthText: {
    color: '#D1D1D6',
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  todayBtn: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    alignItems: 'center',
  },
  todayBtnText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
