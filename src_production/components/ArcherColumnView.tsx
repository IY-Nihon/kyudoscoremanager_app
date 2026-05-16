import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UIConfig } from '../constants/UIConfig';
import { ScoreCell } from './ScoreCell';
import { useScoreStore } from '../stores/useScoreStore';
import { Archer, Mark } from '../models/types';
import { Ionicons } from '@expo/vector-icons';

interface ArcherColumnViewProps {
  archer: Archer;
  shots: number;
  allArchers: Archer[];
  indexInList: number;
  showFooter?: boolean;
  isReadOnly?: boolean;
  isAdminMode?: boolean;
  onPressName?: () => void;
  onLongPressName?: () => void;
  onDelete?: () => void;
  onToggleMark?: (archerId: string, index: number) => void;
}

export const ArcherColumnView: React.FC<ArcherColumnViewProps> = React.memo(({
  archer, shots, allArchers, indexInList, showFooter = true,
  isReadOnly = false, isAdminMode = false,
  onPressName, onLongPressName, onDelete, onToggleMark
}) => {
  const toggleLock = useScoreStore(s => s.toggleLock);
  const viewScale = useScoreStore(s => s.viewScale);


  const getHitCount = () => {
    if (archer.isTotalCalculator) {
      let total = 0;
      const safeArchers = Array.isArray(allArchers) ? allArchers : [];
      for (let i = indexInList - 1; i >= 0; i--) {
        const prev = safeArchers[i];
        if (!prev || prev.isSeparator || prev.isTotalCalculator) break;
        total += (prev.marks || []).filter(m => m === '○').length;
      }
      return total;
    }
    return (archer.marks || []).filter(m => m === '○').length;
  };

  const hitCount = getHitCount();

  const indices: number[] = [];
  if (!archer.isSeparator) {
    for (let i = shots - 1; i >= 0; i--) indices.push(i);
  }

  const columnWidth = (archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * viewScale;

  const headerBg = archer.isSeparator ? 'rgba(142,142,147,0.15)' : archer.isTotalCalculator ? 'rgba(0,122,255,0.1)' : '#F2F2F7';
  const borderW = (archer.isSeparator || archer.isTotalCalculator) ? 1.5 : 1;

  // Helper: get group of archers to the left of this total/separator column
  const getGroupArchers = (): Archer[] => {
    const group: Archer[] = [];
    const safeArchers = Array.isArray(allArchers) ? allArchers : [];
    for (let i = indexInList - 1; i >= 0; i--) {
      const a = safeArchers[i];
      if (!a || a.isSeparator || a.isTotalCalculator) break;
      group.push(a);
    }
    return group;
  };

  // Calculate block total for a specific 4-shot block index
  const getBlockTotal = (blockIdx: number): number => {
    const group = getGroupArchers();
    if (group.length === 0) return 0;
    const startShot = blockIdx * 4;
    const endShot = Math.min(startShot + 4, shots);
    return group.reduce((sum, a) => {
      let count = 0;
      const marks = a.marks || [];
      for (let s = startShot; s < endShot; s++) {
        if (marks[s] === '○') count++;
      }
      return sum + count;
    }, 0);
  };
  
    const formatNameExtended = (nameToFormat: string) => {
      if (!nameToFormat || typeof nameToFormat !== 'string') return '';
      const parts = nameToFormat.trim().split(/[\s　]+/);
      if (!parts || parts.length === 0) return '';
      
      const surname = parts[0] || '';
      const firstName = parts.length > 1 ? (parts[1] || '') : '';

      const allMembers = useScoreStore.getState().members || [];
      const sameSurnameCount = allMembers.filter(m => {
        if (!m || !m.name || typeof m.name !== 'string') return false;
        const mParts = m.name.trim().split(/[\s　]+/);
        return mParts && mParts[0] === surname;
      }).length;

      if (sameSurnameCount > 1 && firstName) {
        return `${surname} (${firstName[0] || ''})`;
      }
      return surname || '不明';
    };

    const getFormattedName = () => {
      if (!archer.name) return archer.isTotalCalculator ? '合計' : '選択';
      return formatNameExtended(archer.name);
    };

    const getFormattedSubName = (rawName: string) => {
      return formatNameExtended(rawName);
    };

    // Thick border (1.5px) for Separator or Total columns.
    const isSpecial = archer.isSeparator || archer.isTotalCalculator;
    const borderRightW = isSpecial ? 1.5 : 1;
    const borderLeftW = isSpecial ? 1.5 : 0;

    return (
      <View style={{ 
        width: columnWidth, 
        backgroundColor: 'transparent'
      }}>
      <View style={{ flexDirection: 'column' }}>
        {/* Header - Total hits display */}
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.header, { 
            width: columnWidth, 
            height: UIConfig.headerHeight * viewScale,
            backgroundColor: headerBg, 
            marginBottom: 0,
            borderRightWidth: borderRightW,
            borderRightColor: '#000',
            borderLeftWidth: borderLeftW,
            borderLeftColor: '#000'
          }]}

          disabled={true}
        >
          {!archer.isSeparator && !archer.isTotalCalculator && (
            (() => {
              const subs = archer.substitutions || {};
              const marks = Array.isArray(archer.marks) ? archer.marks : [];
              const subKeys = Object.keys(subs).map(Number).sort((a, b) => a - b)
                .filter(k => k < marks.length);

              if (subKeys.length > 0) {
                const segments: { name: string; hits: number }[] = [];
                const firstEnd = subKeys[0];
                const firstHits = marks.slice(0, firstEnd).filter(m => m === '○').length;
                segments.push({ name: getFormattedName(), hits: firstHits });
                for (let i = 0; i < subKeys.length; i++) {
                  const start = subKeys[i];
                  const end = i + 1 < subKeys.length ? subKeys[i + 1] : marks.length;
                  const rawName = subs[start] || '?';
                  segments.push({ name: getFormattedSubName(rawName), hits: marks.slice(start, end).filter(m => m === '○').length });
                }
                return (
                  <Text style={[styles.hitCountSub, { fontSize: 8 * viewScale }]}>
                    {segments.map((s, i) => (
                      <React.Fragment key={`seg-${i}-${s.name}`}>
                        <Text>{s.name} {s.hits}</Text>
                        {i < segments.length - 1 ? <Text>{', '}</Text> : null}
                      </React.Fragment>
                    ))}
                  </Text>
                );
              }
              return (
                <Text style={[styles.hitCount, { fontSize: 22 * viewScale }]}>
                  {hitCount}
                </Text>
              );
            })()
          )}
          {archer.isTotalCalculator ? (
            <Text style={[styles.hitCount, { color: '#007AFF', fontSize: 22 * viewScale }]}>
              {hitCount}
            </Text>
          ) : null}

          {/* Top border line - requested thick fixed line */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: '#000' }} />
        </TouchableOpacity>

        {/* Content Rows */}
        {archer.isSeparator ? (
          <View style={{ marginTop: 0 }}>
            {Array.from({ length: shots }, (_, i) => shots - 1 - i).map(index => {
              const blockIdx = Math.floor(index / 4);
              const isBlockSep = index % 4 === 0 && index !== 0;
              const isBlockTop = index === Math.min(shots - 1, blockIdx * 4 + 3);
              const isLocked = (isReadOnly && !isAdminMode) ? false : (archer.lockedBlocks?.[blockIdx] || false);
              
              return (
                <View key={index} style={{ width: columnWidth, height: UIConfig.cellHeight * viewScale }}>

                  <ScoreCell
                    archerId={archer.id}
                    index={index}
                    isLocked={isLocked}
                    isBlockBottom={isBlockSep}
                    isBlockTop={isBlockTop}
                    isFirst={index === 0}
                    hideMark={true}
                    isNormalArcher={false}
                    columnType="separator"
                    mark={archer.marks?.[index]}
                    onToggle={onToggleMark}
                  />
                  {isBlockTop && (
                    <TouchableOpacity
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                      disabled={(isReadOnly && !isAdminMode)}
                      onPress={() => toggleLock(archer.id, blockIdx)}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : archer.isTotalCalculator ? (
          <View style={{ marginTop: 0 }}>
            {indices.map(index => {
                const blockIdx = Math.floor(index / 4);
                // Real-time block total calculation
                const blockTotal = getBlockTotal(blockIdx);
                const isBlockBottom = (index % 4 === 0);
                const isBlockTop = index === Math.min(shots - 1, blockIdx * 4 + 3);
                const isLocked = (isReadOnly && !isAdminMode) ? false : (archer.lockedBlocks?.[blockIdx] || false);

                return (
                  <View key={`total-wrap-${index}`} style={{ width: columnWidth, height: UIConfig.cellHeight * viewScale }}>

                    <ScoreCell
                      archerId={archer.id}
                      index={index}
                      mark={archer.marks?.[index]}
                      isLocked={isLocked}
                      isBlockBottom={index % 4 === 0 && (index !== 0 || shots > 4)}
                      isBlockTop={isBlockTop}
                      isFirst={index === 0}
                      hideMark={true}
                      isNormalArcher={false}
                      columnType="total"
                      onToggle={onToggleMark}
                    />
                  {isBlockBottom && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
                      <Text style={[styles.blockTotalText, { fontSize: 24 * viewScale }]}>{blockTotal}</Text>
                    </View>

                  )}
                  {isBlockTop && (
                    <TouchableOpacity
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                      disabled={(isReadOnly && !isAdminMode)}
                      onPress={() => toggleLock(archer.id, blockIdx)}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={{ marginTop: 0 }}>
            {indices.map(index => {
              const rawSubName = archer.substitutions?.[index];
              let formattedSubName = '';
              if (rawSubName) {
                formattedSubName = formatNameExtended(rawSubName);
              }

              const blockIdx = Math.floor(index / 4);
              const isBlockTop = index === Math.min(shots - 1, blockIdx * 4 + 3);
              const isLocked = (isReadOnly && !isAdminMode) ? false : (archer.lockedBlocks?.[blockIdx] || false);
              
              return (
                <ScoreCell
                  key={index}
                  archerId={archer.id}
                  index={index}
                  mark={(archer.marks?.[index] || '') as Mark}
                  subName={formattedSubName}
                  isLocked={isLocked}
                  isBlockBottom={index % 4 === 0 && index !== 0}
                  isBlockTop={isBlockTop}
                  isFirst={index === 0}
                  isNormalArcher={true}
                  columnType="normal"
                  onToggle={onToggleMark}
                />
              );
            })}
          </View>
        )}
      </View>

      {showFooter && (
        <View style={[styles.footer, { 
          width: columnWidth, 
          height: UIConfig.footerHeight * viewScale,
          backgroundColor: archer.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7', 
          padding: 0,
          borderRightWidth: borderRightW,
          borderRightColor: '#000',
          borderLeftWidth: borderLeftW,
          borderLeftColor: '#000',
        }]}>

          {!archer.isSeparator ? (
            <TouchableOpacity 
              style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center', padding: 4 }}
              onPress={onPressName}
              onLongPress={onLongPressName}
              delayLongPress={500}
            >
              <Text style={[styles.footerName, { color: archer.name ? '#000' : '#8E8E93', fontSize: 14 * viewScale }]} numberOfLines={2}>
                {getFormattedName()}
              </Text>
              {archer.isGuest ? <Text style={[styles.guestLabel, { fontSize: 9 * viewScale }]}>(ゲスト)</Text> : null}
              {!archer.isTotalCalculator && archer.name !== '' && archer.gender !== '未設定' && archer.gender !== undefined ? (
                <View style={{ marginTop: 2, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 10, backgroundColor: archer.gender === '男子' ? '#007AFF' : '#FF2D55' }}>
                  <Ionicons name="person" size={10 * viewScale} color="#FFF" />
                </View>
              ) : null}

            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
              onPress={onDelete}
              disabled={isReadOnly && !isAdminMode}
            >
              <Ionicons name="close-circle" size={24 * viewScale} color="#8E8E93" />

            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    height: UIConfig.headerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
  },
  hitCount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  hitCountSub: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  sepCell: {
    width: UIConfig.separatorWidth,
    height: UIConfig.cellHeight,
    backgroundColor: 'rgba(142,142,147,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCell: {
    width: UIConfig.cellWidth,
    height: UIConfig.cellHeight,
    backgroundColor: 'rgba(0,122,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockTotalText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#007AFF',
  },
  footer: {
    height: UIConfig.footerHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#000',
    padding: 4,
  },
  footerName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  guestLabel: { fontSize: 9, color: '#8E8E93' },
});
