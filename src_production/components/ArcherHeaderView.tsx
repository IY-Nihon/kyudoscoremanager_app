import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Archer } from '../models/types';
import { LucideIcon } from 'lucide-react-native';

interface Props {
  archer: Archer;
  blockTotalFunction?: (archers: Archer[], startIndex: number) => number; // pass logic from store or main screen
}

export const ArcherHeaderView: React.FC<Props> = ({ archer }) => {
  const marks = archer.marks;
  const hits = marks.filter(m => m === '○').length;
  const total = marks.filter(m => m !== '').length;
  const rate = total > 0 ? ((hits / total) * 100).toFixed(1) : '0.0';

  const getRankColor = (grade: number) => {
    switch (grade) {
      case 1: return '#cc0000'; // 1年:赤
      case 2: return '#0000cc'; // 2年:青
      case 3: return '#cccc00'; // 3年:黄
      case 4: return '#000000'; // 4年:黒
      default: return '#808080';
    }
  };

  return (
    <View style={styles.container}>
      {/* Rank Indicator */}
      <View style={[styles.rankIndicator, { backgroundColor: getRankColor(archer.grade) }]} />
      
      <View style={styles.nameHeader}>
        <Text style={styles.nameText} numberOfLines={1}>
          {archer.name || '未設定'}
        </Text>
        {archer.isGuest && (
          <View style={styles.guestBadge}>
            <Text style={styles.guestText}>ゲスト</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {hits}/{total} 中 ({rate}%)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  rankIndicator: {
    width: 6,
    height: 30,
    borderRadius: 3,
    marginRight: 8,
  },
  nameHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  guestBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guestText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    marginLeft: 10,
  },
  statsText: {
    color: '#E5E5EA',
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums']
  }
});
