import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UIConfig } from '../constants/UIConfig';
import { Mark } from '../models/types';
import { useScoreStore } from '../stores/useScoreStore';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface ScoreCellProps {
  archerId: string;
  index: number;
  mark?: Mark;
  subName?: string;
  isLocked: boolean;
  isBlockBottom: boolean;
  isBlockTop: boolean;
  isFirst: boolean;
  hideMark?: boolean;
  isNormalArcher?: boolean;
  columnType?: 'normal' | 'total' | 'separator';
  onToggle?: (archerId: string, index: number) => void;
}

export const ScoreCell: React.FC<ScoreCellProps> = React.memo(({
  archerId,
  index,
  mark: propMark,
  subName,
  isLocked,
  isBlockBottom,
  isBlockTop,
  isFirst,
  hideMark = false,
  isNormalArcher = false,
  columnType = 'normal',
  onToggle,
}) => {
  const toggleMark = useScoreStore(s => s.toggleMark);
  const viewScale = useScoreStore(s => s.viewScale);
  const mark = propMark ?? '';

  const handlePress = () => {
    if (isLocked) return;
    if (onToggle) {
      onToggle(archerId, index);
    } else {
      toggleMark(archerId, index);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getColumnBg = () => {
    if (columnType === 'total') return 'rgba(0,122,255,0.08)';
    if (columnType === 'separator') return 'rgba(142,142,147,0.1)';
    return isLocked ? '#F2F2F7' : '#FFFFFF';
  };
  const bgColor = getColumnBg();

  const getMarkColor = (m: Mark): string => {
    if (m === '○') return '#FF3B30'; // iOS Red
    if (m === '×') return '#000000'; // Black
    return 'transparent';
  };

  const borderBottomWidth = isFirst ? 1 : (isBlockBottom ? 1.5 : 1);
  const isSpecial = columnType === 'separator' || columnType === 'total';
  const borderRightWidth = isSpecial ? 1.5 : 1;
  const borderLeftWidth = isSpecial ? 1.5 : 0;

  const cellW = (columnType === 'separator' ? UIConfig.separatorWidth : UIConfig.cellWidth) * viewScale;
  const cellH = UIConfig.cellHeight * viewScale;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={isLocked}
      style={[
        styles.cell,
        {
          width: cellW,
          height: cellH,
          backgroundColor: bgColor,
          borderBottomWidth,
          borderBottomColor: '#000',
          borderRightWidth,
          borderRightColor: '#000',
          borderLeftWidth,
          borderLeftColor: '#000',
        },
      ]}
    >
      {isBlockTop && !isNormalArcher && (
        <View style={[styles.lockIconOverlay, { top: 2 * viewScale }]}>
          <Ionicons 
            name={isLocked ? "lock-closed" : "lock-open"} 
            size={16 * viewScale} 
            color={isLocked ? '#FF3B30' : '#8E8E93'} 
          />
        </View>
      )}
      {!hideMark && (
        <Text style={[styles.markText, { 
          color: getMarkColor(mark), 
          fontSize: 34 * viewScale,
          lineHeight: cellH,
        }]}>
          {mark}
        </Text>
      )}
      {subName && (
        <View style={[styles.subContainer, { bottom: 2 * viewScale }]}>
          <Text style={[styles.subText, { fontSize: 9 * viewScale }]} numberOfLines={1}>{subName}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cell: {
    width: '100%',
    height: UIConfig.cellHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightColor: '#000',
  },
  markText: {
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1.5,
  },

  lockIconOverlay: {
    position: 'absolute',
    top: 2,
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  subContainer: {
    position: 'absolute',
    bottom: 2,
    width: '100%',
    alignItems: 'center',
  },
  subText: {
    fontSize: 9,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
