import iroの組 from './iro.js';
const { 色 } = iroの組;
/**
 * 矢所を置く窓。的の上で指（マウス）を動かすと点が付いてきて、離したところに置く。
 * ○ は的の内側、× は外側にだけ置ける。置いても閉じない（置いた場所を見て、ずれていれば置き直せるように）。
 * 閉じるのは「完了」か外を押したとき。矢所はその人の列の arrowLocations に、的の中心を 0・半径を 1 とした座標で入る
 */
import { useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, Alert, Dimensions, StyleSheet } from './rn';
import { Ionicons } from '@expo/vector-icons';

import { useストアの一部 } from './storeSlice';
import { CIRCLED_NUMBERS } from './ArrowLocationView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 的の種類と、選ぶボタンの名前
const 的の種類たち = [
  ['kasumi36', '霞的(尺二寸)'],
  ['hoshi36', '星的(尺二寸)'],
  ['hoshi24', '星的(八寸)'],
];
// 霞的の輪の直径（外の黒の内側に、白と黒を交互に重ねる）
const 霞的の輪 = [200, 160, 120, 80, 40];
/** いまの画面の巻いた量（ページの座標と、窓の中の座標を行き来するのに使う） */
const 巻いた量 = () => ({
  x: window.scrollX ?? window.pageXOffset ?? 0,
  y: window.scrollY ?? window.pageYOffset ?? 0,
});

export const ArrowLocationPopover = ({
  visible,
  onClose,
  archerId,
  shotIndex,
  currentMark, // '○' または '×'
  // 開いたときの矢所の写し。帳簿にその人が見つからないときだけ使う
  arrowLocations = [],
}) => {
  const {
    arrowTargetType,
    setArrowTargetType,
    updateArrowLocation,
    archers: storeArchers,
  } = useストアの一部(['arrowTargetType', 'setArrowTargetType', 'updateArrowLocation', 'archers']);
  const touchAreaRef = useRef(null);
  // 閉じるとき、窓が消えていくあいだに射番が空になって題が「NaN射目」になる。出していた射番を覚えておく
  const 出した射番 = useRef(shotIndex);
  if (Number.isInteger(shotIndex)) 出した射番.current = shotIndex;
  const 題の射番 = 出した射番.current;

  // 該当する射手のマーク情報を取得して、○/×判定に用いる
  const archer = storeArchers.find((a) => a.id === archerId);
  const archerMarks = archer ? archer.marks || [] : [];

  // 矢所は帳簿から直に読む。prop の arrowLocations は窓を開いた時の写しなので、
  // 置いた直後の点が出ない。指を離すと下絵（previewPos）も消えるので、
  // 「押したのに何も残らない」ように見えていた（2026-09-08）
  const 表示する矢所 =
    archer && Array.isArray(archer.arrowLocations) ? archer.arrowLocations : arrowLocations;

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
        const 巻き = 巻いた量();
        pageX = clientX + 巻き.x;
        pageY = clientY + 巻き.y;
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
    const 巻き = 巻いた量();
    const elemAbsoluteX = rect.left + 巻き.x;
    const elemAbsoluteY = rect.top + 巻き.y;

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

    // 的の種類も一緒に残す（あとで的ごとに分けて見られるように）
    updateArrowLocation(archerId, shotIndex, { x: normalizedX, y: normalizedY, targetType: arrowTargetType });
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
        <View
          style={[
            styles.targetBase,
            { width: 240, height: 240, borderRadius: 120, backgroundColor: 色.黒, pointerEvents: 'none' },
          ]}
        >
          {霞的の輪.map((直径, 番) => (
            <View
              key={直径}
              style={[
                styles.targetLayer,
                {
                  width: 直径,
                  height: 直径,
                  borderRadius: 直径 / 2,
                  backgroundColor: 番 % 2 === 0 ? 色.白 : 色.黒,
                  pointerEvents: 'none',
                },
              ]}
            />
          ))}
        </View>
      );
    } else if (arrowTargetType === 'hoshi36') {
      // 星的36cm (白い円に中心の黒丸)
      return (
        <View
          style={[
            styles.targetBase,
            styles.hoshiBase,
            { width: 240, height: 240, borderRadius: 120, pointerEvents: 'none' },
          ]}
        >
          <View
            style={[
              styles.targetLayer,
              { width: 60, height: 60, borderRadius: 30, backgroundColor: 色.黒, pointerEvents: 'none' },
            ]}
          />
        </View>
      );
    } else {
      // 星的24cm
      return (
        <View
          style={[
            styles.targetBase,
            styles.hoshiBase,
            { width: 160, height: 160, borderRadius: 80, pointerEvents: 'none' },
          ]}
        >
          <View
            style={[
              styles.targetLayer,
              { width: 40, height: 40, borderRadius: 20, backgroundColor: 色.黒, pointerEvents: 'none' },
            ]}
          />
        </View>
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View style={styles.popoverContainer}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              矢所の記録 ({CIRCLED_NUMBERS[題の射番] || `${題の射番 + 1}射目`})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={色.灰} />
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
            {的の種類たち.map(([種類, 名]) => (
              <TouchableOpacity
                key={種類}
                onPress={() => setArrowTargetType(種類)}
                style={[styles.typeBtn, arrowTargetType === 種類 && styles.typeBtnActive]}
              >
                <Text style={[styles.typeBtnText, arrowTargetType === 種類 && styles.typeBtnTextActive]}>
                  {名}
                </Text>
              </TouchableOpacity>
            ))}
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
              {表示する矢所.map((loc, idx) => {
                if (!loc) return null;

                // 的の種類が異なる矢所は表示しない
                // loc.targetType がない古いデータはデフォルトの 'kasumi36' とみなす
                const locTargetType = loc.targetType || 'kasumi36';
                if (locTargetType !== arrowTargetType) return null;

                const isHit = archerMarks[idx] === '○';
                const isCurrent = idx === shotIndex;

                // 正規化座標からピクセル座標へ逆変換
                const posX = touchAreaRadius + loc.x * targetRadius;
                const posY = touchAreaRadius + loc.y * targetRadius;

                // 的中は緑系、外れは赤・オレンジ系にする
                const markerBgColor = isHit
                  ? isCurrent
                    ? 色.緑
                    : 'rgba(52, 199, 89, 0.75)'
                  : isCurrent
                    ? 色.赤
                    : 'rgba(255, 149, 0, 0.75)';

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
                        borderColor: 色.白,
                        borderWidth: 1.5,
                        zIndex: isCurrent ? 10 : 5,
                        transform: [{ scale: isCurrent ? 1.2 : 1.0 }],
                      },
                    ]}
                  >
                    <Text style={styles.markerText}>{CIRCLED_NUMBERS[idx] || idx + 1}</Text>
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
                      backgroundColor: previewPos.isInside
                        ? 'rgba(52, 199, 89, 0.55)'
                        : 'rgba(255, 59, 48, 0.55)',
                      borderColor: previewPos.isInside ? 色.緑 : 色.赤,
                    },
                  ]}
                />
              )}
            </View>
          </View>

          {/* フッター操作ボタン */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => {
                updateArrowLocation(archerId, shotIndex, null);
                onClose();
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
    backgroundColor: 色.白,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: 色.黒,
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
    borderBottomColor: 色.地_濃い,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 色.黒,
  },
  closeBtn: {
    padding: 4,
  },
  guideContainer: {
    width: '100%',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 色.地,
    alignItems: 'center',
    marginBottom: 16,
  },
  guideText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  guideHit: {
    color: 色.緑,
  },
  guideMiss: {
    color: 色.赤,
  },
  targetWrapper: {
    width: 320,
    height: 320,
    backgroundColor: 色.地_濃い, // 的外タップ領域を視覚化するための背景
    borderRadius: 16, // 角丸の四角形にしてタップ面積を広げる
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 色.区切り,
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
    backgroundColor: 色.白,
    borderWidth: 1,
    borderColor: 色.黒,
  },
  arrowMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 色.黒,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
    elevation: 4,
  },
  markerText: {
    color: 色.白,
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
    shadowColor: 色.黒,
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
    backgroundColor: 色.地,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    color: 色.赤,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 色.青,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    color: 色.白,
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
    backgroundColor: 色.地,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 色.地_濃い,
  },
  typeBtnActive: {
    backgroundColor: 色.青,
    borderColor: 色.青,
  },
  typeBtnText: {
    fontSize: 11,
    color: 色.灰,
    fontWeight: 'bold',
  },
  typeBtnTextActive: {
    color: 色.白,
  },
});
