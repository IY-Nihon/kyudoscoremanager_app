import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Archer, Mark } from '../models/types';
import * as Haptics from 'expo-haptics';

interface Props {
  archer: Archer;
  archerIndex: number;
  shotCount: number;
  isLocked: (id: string, block: number) => boolean;
  onToggleLock: (id: string, block: number) => void;
  onMarkUpdate: (aIdx: number, markIdx: number, mark: Mark) => void;
}

export const ScoreRowView: React.FC<Props> = ({
  archer, archerIndex, shotCount, isLocked, onToggleLock, onMarkUpdate
}) => {
  const numBlocks = Math.ceil(shotCount / 4);

  const handleMarkTap = (markIdx: number) => {
    const blockIdx = Math.floor(markIdx / 4);
    if (isLocked(archer.id, blockIdx)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const marks = Array.isArray(archer.marks) ? archer.marks : [];
    const current = (markIdx >= 0 && markIdx < marks.length) ? (marks[markIdx] || '') : '';
    const nextMark: Mark = current === '' ? '○' : current === '○' ? '×' : '';
    onMarkUpdate(archerIndex, markIdx, nextMark);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {Array.from({ length: numBlocks }).map((_, blockIdx) => {
        const locked = isLocked(archer.id, blockIdx);
        return (
          <View key={blockIdx} style={[styles.block, locked && styles.blockLocked]}>
            <TouchableOpacity onPress={() => onToggleLock(archer.id, blockIdx)} style={styles.lockHeader}>
              <Text style={{ fontSize: 10, color: locked ? '#ff453a' : '#8e8e93' }}>
                {locked ? '🔒' : '🔓'} {blockIdx + 1}
              </Text>
            </TouchableOpacity>

            <View style={styles.shotsRow}>
              {[0, 1, 2, 3].map(shotOffset => {
                const markIdx = blockIdx * 4 + shotOffset;
                if (markIdx >= shotCount) return <View key={shotOffset} style={styles.shotEmpty} />;
                const marks = Array.isArray(archer.marks) ? archer.marks : [];
                const mark = (markIdx >= 0 && markIdx < marks.length) ? (marks[markIdx] || '') : '';
                return (
                  <TouchableOpacity 
                    key={markIdx}
                    onPress={() => handleMarkTap(markIdx)}
                    style={[styles.shotCircle, mark === '○' && styles.shotHit, mark === '×' && styles.shotMiss]}
                  >
                    <Text style={[styles.shotText, mark === '○' && styles.textRed, mark === '×' && styles.textBlack]}>
                      {mark}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  block: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  blockLocked: {
    opacity: 0.6,
    borderColor: '#ff453a'
  },
  lockHeader: {
    alignItems: 'center',
    marginBottom: 6,
  },
  shotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  shotEmpty: {
    width: 28, height: 28,
  },
  shotCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shotHit: {
    backgroundColor: '#ffe5e5', 
  },
  shotMiss: {
    backgroundColor: '#e5e5ea',
  },
  shotText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  textRed: { color: '#ff3b30' },
  textBlack: { color: '#000' }
});
