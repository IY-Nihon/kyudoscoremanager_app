/**
 * 矢所記録入力用ポップアップモーダルコンポーネント
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Alert,
  Dimensions
} from 'react-native';
// テーマ変換（ダークモード）を通すため StyleSheet はブリッジ経由で取得する
import StyleSheet from './StyleSheet';
import { Ionicons } from '@expo/vector-icons';
import { useScoreStore } from './JP_useScoreStore_174';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 漢数字・丸数字の変換テーブル（1〜8射用）
const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];

export const ArrowLocationPopover = ({
  visible,
  onClose,
  archerId,
  shotIndex,
  currentMark, // '○' または '×'
  arrowLocations = [],
  onSave
}) => {
  const { arrowTargetType, setArrowTargetType, updateArrowLocation, archers: storeArchers } = useScoreStore();
  const touchAreaRef = useRef(null);
  
  // 該当する射手のマーク情報を取得して、○/×判定に用いる
  const archer = storeArchers.find(a => a.id === archerId);
  const archerMarks = archer ? (archer.marks || []) : [];

  // タップを検知するタッチエリア（親View）のサイズは常に 320x320 とします
  const touchAreaSize = 320;
  const touchAreaRadius = touchAreaSize / 2;

  // 的のサイズ設定
  // 霞的36cm/星的36cmは基準サイズ (240px)、星的24cmは縮小サイズ (160px)
  const isHoshi24 = arrowTargetType === 'hoshi24';
  const targetSize = isHoshi24 ? 160 : 240;
  const targetRadius = targetSize / 2;

  // プレビュー中（マウスホバー／指のドラッグ中）の未確定位置
  const [previewPos, setPreviewPos] = useState(null);
  // タッチ操作中はマウスの合成イベント（ゴーストクリック等）を無視するためのフラグ
  const isTouchDraggingRef = useRef(false);

  // イベントから pageX / pageY を取り出す（マウス・タッチ・touchend共通）
  const extractPageCoords = (event) => {
    const ne = event.nativeEvent || event;
    const touch = (ne.touches && ne.touches[0]) || (ne.changedTouches && ne.changedTouches[0]);
    let pageX = ne.pageX ?? (touch ? touch.pageX : undefined);
    let pageY = ne.pageY ?? (touch ? touch.pageY : undefined);
    if (pageX === undefined || pageY === undefined) {
      const clientX = ne.clientX ?? (touch ? touch.clientX : undefined);
      const clientY = ne.clientY ?? (touch ? touch.clientY : undefined);
      if (clientX !== undefined && clientY !== undefined) {
        const scrollX = window.scrollX ?? window.pageXOffset ?? 0;
        const scrollY = window.scrollY ?? window.pageYOffset ?? 0;
        pageX = clientX + scrollX;
        pageY = clientY + scrollY;
      }
    }
    return { pageX, pageY };
  };

  // pageX/pageY を「的の中心を(0,0)、半径を1.0」とした正規化座標に変換する
  const getNormalizedPosition = (pageX, pageY) => {
    const touchAreaNode = touchAreaRef.current;
    if (!touchAreaNode || typeof touchAreaNode.getBoundingClientRect !== 'function') return null;
    if (pageX === undefined || pageY === undefined || isNaN(pageX) || isNaN(pageY)) return null;

    const rect = touchAreaNode.getBoundingClientRect();
    const scrollX = window.scrollX ?? window.pageXOffset ?? document.documentElement.scrollLeft ?? document.body.scrollLeft ?? 0;
    const scrollY = window.scrollY ?? window.pageYOffset ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;

    const elemAbsoluteX = rect.left + scrollX;
    const elemAbsoluteY = rect.top + scrollY;

    const posX = pageX - elemAbsoluteX;
    const posY = pageY - elemAbsoluteY;

    const relativeX = posX - touchAreaRadius;
    const relativeY = posY - touchAreaRadius;

    const normalizedX = relativeX / targetRadius;
    const normalizedY = relativeY / targetRadius;

    const distance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2);
    const isInside = distance <= 1.0;

    return { normalizedX, normalizedY, isInside };
  };

  // 実際にその位置で矢所を確定・保存する（バリデーション込み）
  const commitPosition = (normalizedX, normalizedY, isInside) => {
    // バリデーション制限
    if (currentMark === '○' && !isInside) {
      Alert.alert('入力エラー', '的中(○)の場合は、的の内側で離してください。');
      return;
    }
    if (currentMark === '×' && isInside) {
      Alert.alert('入力エラー', '外れ(×)の場合は、的の外側で離してください。');
      return;
    }

    // 保存 (的の種類も一緒に記録することで、後から的ごとにフィルタリング可能にする)
    const locationData = { x: normalizedX, y: normalizedY, targetType: arrowTargetType };
    updateArrowLocation(archerId, shotIndex, locationData);
    if (onSave) {
      onSave(locationData);
    }
  };

  // --- マウス操作: 動かすたびに追従プレビュー、マウスを離した位置で確定 ---
  const handleMouseMove = (event) => {
    if (isTouchDraggingRef.current) return; // タッチ操作中はマウスの合成イベントを無視
    const { pageX, pageY } = extractPageCoords(event);
    const result = getNormalizedPosition(pageX, pageY);
    if (result) setPreviewPos(result);
  };

  const handleMouseLeave = () => {
    if (isTouchDraggingRef.current) return;
    setPreviewPos(null);
  };

  const handleMouseUp = (event) => {
    if (isTouchDraggingRef.current) return;
    const { pageX, pageY } = extractPageCoords(event);
    const result = getNormalizedPosition(pageX, pageY);
    if (!result) return;
    commitPosition(result.normalizedX, result.normalizedY, result.isInside);
  };

  // --- タッチ操作: ドラッグ中は追従プレビュー（色も一致）、指を離した位置で確定 ---
  const handleTouchStart = (event) => {
    isTouchDraggingRef.current = true;
    const { pageX, pageY } = extractPageCoords(event);
    const result = getNormalizedPosition(pageX, pageY);
    if (result) setPreviewPos(result);
  };

  const handleTouchMove = (event) => {
    const { pageX, pageY } = extractPageCoords(event);
    const result = getNormalizedPosition(pageX, pageY);
    if (result) setPreviewPos(result);
  };

  const handleTouchEnd = (event) => {
    const { pageX, pageY } = extractPageCoords(event);
    const result = getNormalizedPosition(pageX, pageY);
    if (result) {
      commitPosition(result.normalizedX, result.normalizedY, result.isInside);
    }
    setPreviewPos(null);
    isTouchDraggingRef.current = false;
  };

  // 的のレンダリング
  const renderTargetVisual = () => {
    if (arrowTargetType === 'kasumi36') {
      // 霞的の描画 (中心から白・黒交互に重ねる)
      return (
        <View style={[styles.targetBase, { width: 240, height: 240, borderRadius: 120, backgroundColor: '#000', pointerEvents: 'none' }]}>
          <View style={[styles.targetLayer, { width: 200, height: 200, borderRadius: 100, backgroundColor: '#fff', pointerEvents: 'none' }]} />
          <View style={[styles.targetLayer, { width: 160, height: 160, borderRadius: 80, backgroundColor: '#000', pointerEvents: 'none' }]} />
          <View style={[styles.targetLayer, { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', pointerEvents: 'none' }]} />
          <View style={[styles.targetLayer, { width: 80, height: 80, borderRadius: 40, backgroundColor: '#000', pointerEvents: 'none' }]} />
          <View style={[styles.targetLayer, { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', pointerEvents: 'none' }]} />
        </View>
      );
    } else if (arrowTargetType === 'hoshi36') {
      // 星的36cm (白い円に中心の黒丸)
      return (
        <View style={[styles.targetBase, styles.hoshiBase, { width: 240, height: 240, borderRadius: 120, pointerEvents: 'none' }]}>
          <View style={[styles.targetLayer, { width: 60, height: 60, borderRadius: 30, backgroundColor: '#000', pointerEvents: 'none' }]} />
        </View>
      );
    } else {
      // 星的24cm
      return (
        <View style={[styles.targetBase, styles.hoshiBase, { width: 160, height: 160, borderRadius: 80, pointerEvents: 'none' }]}>
          <View style={[styles.targetLayer, { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', pointerEvents: 'none' }]} />
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View style={styles.popoverContainer}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              矢所の記録 ({CIRCLED_NUMBERS[shotIndex] || `${shotIndex + 1}射目`})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* ガイドメッセージ */}
          <View style={styles.guideContainer}>
            <Text style={[styles.guideText, currentMark === '○' ? styles.guideHit : styles.guideMiss]}>
              {currentMark === '○'
                ? '【的中 ○】的の内側を押してください'
                : '【外れ ×】的の外側（グレーの領域）を押してください'}
            </Text>
          </View>

          {/* 的種類のクイック切り替え */}
          <View style={styles.targetTypeSelector}>
            <TouchableOpacity
              onPress={() => setArrowTargetType('kasumi36')}
              style={[styles.typeBtn, arrowTargetType === 'kasumi36' && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, arrowTargetType === 'kasumi36' && styles.typeBtnTextActive]}>霞的(尺二寸)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setArrowTargetType('hoshi36')}
              style={[styles.typeBtn, arrowTargetType === 'hoshi36' && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, arrowTargetType === 'hoshi36' && styles.typeBtnTextActive]}>星的(尺二寸)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setArrowTargetType('hoshi24')}
              style={[styles.typeBtn, arrowTargetType === 'hoshi24' && styles.typeBtnActive]}
            >
              <Text style={[styles.typeBtnText, arrowTargetType === 'hoshi24' && styles.typeBtnTextActive]}>星的(八寸)</Text>
            </TouchableOpacity>
          </View>

          {/* 的と入力エリア */}
          <View style={styles.targetWrapper}>
            {/* タッチ可能な入力コンテナ (的より広い領域をタップ可能にする) */}
            <View
              ref={touchAreaRef}
              style={styles.touchArea}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* 的グラフィック */}
              {renderTargetVisual()}

              {/* 登録済みの矢所をプレビュー（現在の的種類と一致するものだけ表示） */}
              {arrowLocations.map((loc, idx) => {
                if (!loc) return null;
                
                // 的の種類が異なる矢所は表示しない
                // loc.targetType がない古いデータはデフォルトの 'kasumi36' とみなす
                const locTargetType = loc.targetType || 'kasumi36';
                if (locTargetType !== arrowTargetType) return null;

                const mark = archerMarks[idx];
                const isHit = mark === '○' || mark === '○'; // 的中
                const isCurrent = idx === shotIndex;
                
                // 正規化座標からピクセル座標へ逆変換
                const posX = touchAreaRadius + loc.x * targetRadius;
                const posY = touchAreaRadius + loc.y * targetRadius;
                
                // 的中は緑系、外れは赤・オレンジ系にする
                let markerBgColor = 'rgba(0, 122, 255, 0.7)';
                if (isHit) {
                  markerBgColor = isCurrent ? '#34C759' : 'rgba(52, 199, 89, 0.75)';
                } else {
                  markerBgColor = isCurrent ? '#FF3B30' : 'rgba(255, 149, 0, 0.75)';
                }

                return (
                  <View
                    key={`marker-${idx}`}
                    pointerEvents="none"
                    style={[
                      styles.arrowMarker,
                      {
                        left: posX - 12,
                        top: posY - 12,
                        backgroundColor: markerBgColor,
                        borderColor: '#fff',
                        borderWidth: 1.5,
                        zIndex: isCurrent ? 10 : 5,
                        transform: [{ scale: isCurrent ? 1.2 : 1.0 }]
                      }
                    ]}
                  >
                    <Text style={styles.markerText}>
                      {CIRCLED_NUMBERS[idx] || idx + 1}
                    </Text>
                  </View>
                );
              })}

              {/* ドラッグ／ホバー中のプレビュー矢所（未確定・色で的中/外れ判定が分かる） */}
              {previewPos && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.previewMarker,
                    {
                      left: touchAreaRadius + previewPos.normalizedX * targetRadius - 14,
                      top: touchAreaRadius + previewPos.normalizedY * targetRadius - 14,
                      backgroundColor: previewPos.isInside ? 'rgba(52, 199, 89, 0.55)' : 'rgba(255, 59, 48, 0.55)',
                      borderColor: previewPos.isInside ? '#34C759' : '#FF3B30'
                    }
                  ]}
                />
              )}
            </View>
          </View>

          {/* フッター操作ボタン */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                // 削除
                updateArrowLocation(archerId, shotIndex, null);
                if (onClose) onClose();
              }}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteBtnText}>記録を削除</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>完了</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  popoverContainer: {
    width: SCREEN_WIDTH * 0.88,
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeBtn: {
    padding: 4,
  },
  guideContainer: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    marginBottom: 16,
  },
  guideText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  guideHit: {
    color: '#34C759',
  },
  guideMiss: {
    color: '#FF3B30',
  },
  targetWrapper: {
    width: 320,
    height: 320,
    backgroundColor: '#E5E5EA', // 的外タップ領域を視覚化するための背景
    borderRadius: 16, // 角丸の四角形にしてタップ面積を広げる
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C6C6C8',
    marginTop: 8,
  },
  touchArea: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  targetBase: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetLayer: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  hoshiBase: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
  },
  arrowMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 4,
  },
  markerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  previewMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 6,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: 'bold',
  },
  targetTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  typeBtnActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeBtnText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: 'bold',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
});
