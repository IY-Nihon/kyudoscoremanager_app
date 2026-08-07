/**
 * 矢所を的の上にプロットして表示する読み取り専用コンポーネント
 */
import React from 'react';
import { View, Text } from 'react-native';
import ThemedStyleSheet from './default_45'; // テーマ変換を通すためブリッジ経由
const StyleSheet = ThemedStyleSheet;
import { useScoreStore } from './JP_useScoreStore_174';

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

export const ArrowLocationView = ({ arrowLocations = [], size = 200, targetType, hideNumbers = false }) => {
  const { arrowTargetType: storeTargetType } = useScoreStore();
  const arrowTargetType = targetType || storeTargetType;

  const radius = size / 2;
  const isHoshi24 = arrowTargetType === 'hoshi24';
  const targetVisualSize = isHoshi24 ? size * 0.5 : size * 0.75;
  const targetVisualRadius = targetVisualSize / 2;
  
  // 保存された正規化座標（的の半径に対する比率）からピクセル座標を復元する基準半径
  const targetRadius = isHoshi24 ? radius * 0.5 : radius * 0.75;

  // 的のビジュアル描画
  const renderTarget = () => {
    if (arrowTargetType === 'kasumi36') {
      return (
        <View style={[styles.targetBase, { width: targetVisualSize, height: targetVisualSize, borderRadius: targetVisualRadius, backgroundColor: '#000' }]}>
          <View style={[styles.targetLayer, { width: targetVisualSize * (5/6), height: targetVisualSize * (5/6), borderRadius: targetVisualRadius * (5/6), backgroundColor: '#fff' }]} />
          <View style={[styles.targetLayer, { width: targetVisualSize * (4/6), height: targetVisualSize * (4/6), borderRadius: targetVisualRadius * (4/6), backgroundColor: '#000' }]} />
          <View style={[styles.targetLayer, { width: targetVisualSize * (3/6), height: targetVisualSize * (3/6), borderRadius: targetVisualRadius * (3/6), backgroundColor: '#fff' }]} />
          <View style={[styles.targetLayer, { width: targetVisualSize * (2/6), height: targetVisualSize * (2/6), borderRadius: targetVisualRadius * (2/6), backgroundColor: '#000' }]} />
          <View style={[styles.targetLayer, { width: targetVisualSize * (1/6), height: targetVisualSize * (1/6), borderRadius: targetVisualRadius * (1/6), backgroundColor: '#fff' }]} />
        </View>
      );
    } else if (arrowTargetType === 'hoshi36') {
      const starSize = targetVisualSize * 0.25;
      return (
        <View style={[styles.targetBase, styles.hoshiBase, { width: targetVisualSize, height: targetVisualSize, borderRadius: targetVisualRadius }]}>
          <View style={[styles.targetLayer, { width: starSize, height: starSize, borderRadius: starSize / 2, backgroundColor: '#000' }]} />
        </View>
      );
    } else {
      // 星的24cm
      const starSize = targetVisualSize * 0.25;
      return (
        <View style={[styles.targetBase, styles.hoshiBase, { width: targetVisualSize, height: targetVisualSize, borderRadius: targetVisualRadius }]}>
          <View style={[styles.targetLayer, { width: starSize, height: starSize, borderRadius: starSize / 2, backgroundColor: '#000' }]} />
        </View>
      );
    }
  };

  // 的の種類が一致する矢所のみをフィルタリング
  // loc.targetType がない古いデータはデフォルトの 'kasumi36' とみなす
  const filteredLocations = arrowLocations.map(loc => {
    if (!loc) return null;
    const locTargetType = loc.targetType || 'kasumi36';
    if (locTargetType !== arrowTargetType) return null;
    return loc;
  });

  // 矢所があるか確認（フィルタリング後のデータで判定）
  const hasLocations = filteredLocations.some(loc => loc !== null && loc !== undefined);
  if (!hasLocations) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {renderTarget()}
        <View style={styles.noDataOverlay}>
          <Text style={styles.noDataText}>矢所記録なし</Text>
        </View>
      </View>
    );
  }

  // 矢所マークのプロット
  const useDot = hideNumbers || filteredLocations.filter(Boolean).length > 12;
  const markerSize = useDot ? 8 : 18;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderTarget()}

      {/* 矢所マークのプロット */}
      {filteredLocations.map((loc, idx) => {
        if (!loc) return null;

        // 正規化座標からピクセル位置に変換 (的のスケールに正確に合わせる)
        const posX = radius + loc.x * targetRadius;
        const posY = radius + loc.y * targetRadius;

        const mark = loc.mark;
        const isHit = mark === '○' || mark === '○'; // 的中
        const shotIndex = loc.shotIndex !== undefined ? loc.shotIndex : idx;

        if (useDot) {
          // ドット表示（12本超）：的中は丸、外れも丸ドット
          return (
            <View
              key={`view-marker-${idx}`}
              style={{
                position: 'absolute',
                left: posX - 4,
                top: posY - 4,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isHit ? '#34C759' : '#FF3B30',
                borderColor: '#fff',
                borderWidth: 0.8,
                zIndex: 10,
              }}
            />
          );
        } else {
          // 通常表示（12本以下）：的中は丸、外れも丸
          return (
            <View
              key={`view-marker-${idx}`}
              style={[
                styles.marker,
                {
                  left: posX - markerSize / 2,
                  top: posY - markerSize / 2,
                  width: markerSize,
                  height: markerSize,
                  borderRadius: markerSize / 2,
                  backgroundColor: isHit ? '#34C759' : '#FF3B30',
                  borderColor: '#fff',
                  borderWidth: 1,
                }
              ]}
            >
              <Text style={styles.markerText}>
                {CIRCLED_NUMBERS[shotIndex] || shotIndex + 1}
              </Text>
            </View>
          );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#E5E5EA', // 外れ(×)のグレー領域を視覚化
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    overflow: 'hidden',
  },
  targetBase: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6C6C8',
    backgroundColor: '#fff',
  },
  targetLayer: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  hoshiBase: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  marker: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    zIndex: 10,
  },
  markerText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  noDataOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
});
