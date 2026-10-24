import iroの組 from './iro.js';
const { 色 } = iroの組;
/**
 * 矢所を的の上に点で見せる部品（見るだけ。置くのは ArrowLocationPopover）。
 * 矢所は的の中心を 0・半径を 1 とした座標。いまの的の種類のものだけを出す
 */

import { View, Text, StyleSheet } from './rn';

import { useストアの一部 } from './storeSlice';

// 射の番号の丸数字（1〜20 射。それより多いときは数字のまま）。矢所を置く窓でも使う
export const CIRCLED_NUMBERS = [...'①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'];

export const ArrowLocationView = ({ arrowLocations = [], size = 200, targetType, hideNumbers = false }) => {
  const { arrowTargetType: storeTargetType } = useストアの一部(['arrowTargetType']);
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
        <View
          style={[
            styles.targetBase,
            {
              width: targetVisualSize,
              height: targetVisualSize,
              borderRadius: targetVisualRadius,
              backgroundColor: 色.黒,
            },
          ]}
        >
          {/* 外の黒の内側に、白と黒を交互に重ねる（直径は 5/6・4/6…1/6） */}
          {[5, 4, 3, 2, 1].map((六分の) => (
            <View
              key={六分の}
              style={[
                styles.targetLayer,
                {
                  width: (targetVisualSize * 六分の) / 6,
                  height: (targetVisualSize * 六分の) / 6,
                  borderRadius: (targetVisualRadius * 六分の) / 6,
                  backgroundColor: 六分の % 2 === 1 ? 色.白 : 色.黒,
                },
              ]}
            />
          ))}
        </View>
      );
    } else {
      // 星的（尺二寸・八寸。大きさは上の targetVisualSize で変わる）。中の黒丸は的の 1/4
      const starSize = targetVisualSize * 0.25;
      return (
        <View
          style={[
            styles.targetBase,
            styles.hoshiBase,
            { width: targetVisualSize, height: targetVisualSize, borderRadius: targetVisualRadius },
          ]}
        >
          <View
            style={[
              styles.targetLayer,
              { width: starSize, height: starSize, borderRadius: starSize / 2, backgroundColor: 色.黒 },
            ]}
          />
        </View>
      );
    }
  };

  // 的の種類が一致する矢所のみをフィルタリング
  // loc.targetType がない古いデータはデフォルトの 'kasumi36' とみなす
  const filteredLocations = arrowLocations.map((loc) => {
    if (!loc) return null;
    const locTargetType = loc.targetType || 'kasumi36';
    if (locTargetType !== arrowTargetType) return null;
    return loc;
  });

  // 矢所があるか確認（フィルタリング後のデータで判定）
  const hasLocations = filteredLocations.some((loc) => loc !== null && loc !== undefined);
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

        const isHit = loc.mark === '○';
        const shotIndex = loc.shotIndex !== undefined ? loc.shotIndex : idx;

        if (useDot) {
          // 小さな点（12 本を超えるとき）。番号は出さない
          return (
            <View
              key={`view-marker-${idx}`}
              style={{
                position: 'absolute',
                left: posX - markerSize / 2,
                top: posY - markerSize / 2,
                width: markerSize,
                height: markerSize,
                borderRadius: markerSize / 2,
                backgroundColor: isHit ? 色.緑 : 色.赤,
                borderColor: 色.白,
                borderWidth: 0.8,
                zIndex: 10,
              }}
            />
          );
        } else {
          // 番号つきの丸（12 本まで）。的中は緑、外れは赤
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
                  backgroundColor: isHit ? 色.緑 : 色.赤,
                  borderColor: 色.白,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={styles.markerText}>{CIRCLED_NUMBERS[shotIndex] || shotIndex + 1}</Text>
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
    backgroundColor: 色.地_濃い, // 外れ(×)のグレー領域を視覚化
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 色.区切り,
    overflow: 'hidden',
  },
  targetBase: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 色.区切り,
    backgroundColor: 色.白,
  },
  targetLayer: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  hoshiBase: {
    backgroundColor: 色.白,
    borderWidth: 1,
    borderColor: 色.黒,
  },
  marker: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 色.黒,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    zIndex: 10,
  },
  markerText: {
    color: 色.白,
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
    color: 色.灰,
    fontWeight: 'bold',
  },
});
