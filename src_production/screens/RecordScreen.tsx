import React, { useState } from 'react';
import {
  View, ScrollView, StyleSheet, Text, TouchableOpacity, Platform, Modal, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScoreStore } from '../stores/useScoreStore';
import { ArcherColumnView } from '../components/ArcherColumnView';
import { LabelColumn } from '../components/LabelColumn';
import { UIConfig } from '../constants/UIConfig';
import * as Haptics from 'expo-haptics';
import { ArcherActionModal } from '../components/ArcherActionModal';
import { Member } from '../models/types';
import { Ionicons } from '@expo/vector-icons';
import { SaveSessionModal } from '../components/SaveSessionModal';
import { ManualSubstitutionModal } from '../components/ManualSubstitutionModal';

export const RecordScreen: React.FC = () => {
  const {
    activeSessionID,
    isAdminMode,
    archers,
    shotsPerRound,
    syncStatus,
    lastSyncTime,
    isFirebaseConnected,
    addArcher,
    addSeparator,
    addTotalCalculator,
    undo,
    redo,
    historyStack,
    redoStack,
    deleteArcher,
    clearArcherMarks,
    setArcherMember,
    saveSession,
    setShotsPerRound,
    showSyncErrorPopups,
    viewScale,
    setViewScale,
    isLiveActive,
    setIsLiveActive,
    isHost,
    liveSessionName,
    includeInStats,
    setIncludeInStats,
    resetCurrentSession,
    isHydrated,
    lastResetHandled,
  } = useScoreStore();

  if (!isHydrated) return null;

  const liveSessionsList = useScoreStore(state => state.liveSessionsList);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [pickingOrigIdx, setPickingOrigIdx] = useState(0);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const lastNotifiedResetRef = React.useRef<number>(0);

  // Custom Modals State
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [shotReduceModalVisible, setShotReduceModalVisible] = useState(false);
  const [shotReduceTarget, setShotReduceTarget] = useState(8);
  const [customShotInputVisible, setCustomShotInputVisible] = useState(false);
  const [customShotText, setCustomShotText] = useState('');

  const [isLiveMenuVisible, setLiveMenuVisible] = useState(false);
  const [liveModeType, setLiveModeType] = useState<'host'|'join' | null>(null);
  const [liveSessionInput, setLiveSessionInput] = useState('');
  const [isLiveInputVisible, setLiveInputVisible] = useState(false);
  const [liveModeError, setLiveModeError] = useState<string | null>(null);

  // Scoll Synchronisation Refs
  const gridScrollRef = React.useRef<ScrollView>(null);
  const footerScrollRef = React.useRef<ScrollView>(null);
  
  const handleGridScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    footerScrollRef.current?.scrollTo({ x, animated: false });
  };
  const handleFooterScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    gridScrollRef.current?.scrollTo({ x, animated: false });
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 1500);
  };

  React.useEffect(() => {
    if (syncStatus === '同期エラー' && showSyncErrorPopups) {
      setFeedbackMsg('同期エラー: クラウドとの同期に失敗しました');
    }
  }, [syncStatus, showSyncErrorPopups]);
  
  // 外部デバイスによってリセットされた時の通知
  React.useEffect(() => {
    if (lastResetHandled > 0 && lastNotifiedResetRef.current < lastResetHandled) {
      // 自分が直近でプッシュしたリセットなら、既にUIで「リセットしました」と出ているのでSKIP
      const isMyOwnReset = (lastResetHandled === useScoreStore.getState().lastPushedTimestamp);
      
      lastNotifiedResetRef.current = lastResetHandled;
      
      if (!isMyOwnReset) {
        showFeedback('リセットしました。');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  }, [lastResetHandled]);

  // Initial load
  React.useEffect(() => {
    useScoreStore.getState().loadData();
  }, []);

  // Listen to live sessions when joining
  React.useEffect(() => {
    let unsub: (() => void) | undefined;
    if (isLiveInputVisible && liveModeType === 'join') {
      useScoreStore.getState().fetchActiveLiveSessions();
      unsub = useScoreStore.getState().listenToLiveSessions();
    }
    return () => {
      if (unsub) unsub();
    };
  }, [isLiveInputVisible, liveModeType]);

  const dateStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  const isReadOnly = false; // Record screen is always active/editable

  const handleSaveSession = () => {
    if (archers.length === 0) return;
    setSaveModalVisible(true);
  };

  const executeSave = (title: string, note: string, includeInStats: boolean) => {
    setSaveModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // saveSession()内部でライブ終了処理（status:'finished')を行うので、ここでは呼び出さない
    saveSession(title, note, includeInStats);
    showFeedback('保存しました');
  };

  const handleUndo = () => {
    if (historyStack.length > 0) {
      undo();
      showFeedback('元に戻しました');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      redo();
      showFeedback('やり直しました');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddArcher = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addArcher();
  };
  const handleAddSeparator = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSeparator();
  };
  const handleAddTotal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addTotalCalculator();
  };

  const formatName = (name: string) => {
    if (!name || typeof name !== 'string') return '';
    const parts = name.trim().split(/[\s　]+/);
    if (!parts || parts.length === 0) return '';
    
    const surname = parts[0] || '';
    const firstName = (parts.length > 1) ? (parts[1] || '') : '';

    const allMembers = useScoreStore.getState().members || [];
    const sameSurnameCount = allMembers.filter(m => {
      if (!m || !m.name || typeof m.name !== 'string') return false;
      const mParts = m.name.trim().split(/[\s　]+/);
      return mParts.length > 0 && mParts[0] === surname;
    }).length;

    if (sameSurnameCount > 1 && firstName) {
      return `${surname} (${firstName[0] || ''})`;
    }
    return surname || '不明';
  };

  const openArcherMenu = (archerId: string, _name: string, origIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const archer = archers.find(a => a.id === archerId);
    if (!archer) return;
    setPickingId(archerId);
    setPickingOrigIdx(origIdx);
    setPickerVisible(true);
  };

  const isTall = shotsPerRound >= 16;
  const [isShotMenuVisible, setShotMenuVisible] = useState(false);
  const openShotMenu = () => setShotMenuVisible(true);
  const closeShotMenu = () => setShotMenuVisible(false);

  const shotOptions = [8, 12, 16, 20];

  const handleSetShotsWithConfirm = (num: number) => {
    if (num < shotsPerRound && archers.some(a => a && Array.isArray(a.marks) && a.marks.slice(num).some(m => m !== ''))) {
      setShotReduceTarget(num);
      setShotReduceModalVisible(true);
    } else {
      setShotsPerRound(num);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const executeShotReduce = () => {
    setShotReduceModalVisible(false);
    setShotsPerRound(shotReduceTarget);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const submitCustomShot = () => {
    const n = parseInt(customShotText, 10);
    if (!isNaN(n) && n >= 1 && n <= 500) {
      setCustomShotInputVisible(false);
      handleSetShotsWithConfirm(n);
    } else {
      setFeedbackMsg('1〜500までの数字を入力してください');
      setTimeout(() => setFeedbackMsg(null), 1500);
    }
  };

  const handleReset = () => {
    setResetModalVisible(true);
  };

  const executeReset = () => {
    setResetModalVisible(false);
    // resetCurrentSession()を呼び出す：ライブ中は自動的にRTDBに空状態を送信する
    resetCurrentSession();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showFeedback('リセットしました。');
  };

  const handleZoomIn = () => {
    setViewScale(viewScale + 0.1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const handleZoomOut = () => {
    setViewScale(viewScale - 0.1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLiveToggle = () => {
    if (isLiveActive) {
      useScoreStore.getState().stopLiveSync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      setLiveMenuVisible(true);
    }
  };

  const handleLiveMenuSelect = (type: 'host' | 'join') => {
    setLiveMenuVisible(false);
    setLiveModeType(type);
    setLiveSessionInput('');
    setTimeout(() => {
      setLiveInputVisible(true);
    }, 100);
  };

  const confirmLiveInput = async () => {
    if (!liveSessionInput.trim()) return;
    const sessionName = liveSessionInput.trim();
    setLiveModeError(null);

    if (liveModeType === 'host') {
      // ホストは記録の有無に関わらず即座に開始（現在のデータがそのまま初期セッションデータになる）
      showFeedback('ライブを開始しています...');
      const success = await useScoreStore.getState().startLiveSync(sessionName);
      if (success) {
        setLiveInputVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setLiveModeError(`'${sessionName}' は既に使用されています。別の名前を入力してください。`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      return;
    }

    // 参加の場合
    if (liveModeType === 'join') {
      const liveSessions = useScoreStore.getState().liveSessionsList;
      if (!liveSessions.includes(sessionName)) {
        setLiveModeError(`'${sessionName}' というセッションは見つかりませんでした。`);
        return;
      }

      const doJoin = () => {
        showFeedback('ライブに参加しています...');
        setLiveInputVisible(false);
        // joinLiveSync内部で初期化されるためresetCurrentSessionは不要
        useScoreStore.getState().joinLiveSync(sessionName);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      };

      if (archers.length > 0) {
        const msg = '手元の記録が消去され、ライブ参加データで上書きされます。よろしいですか？';
        if (Platform.OS === 'web') {
          if (window.confirm(msg)) doJoin();
        } else {
          Alert.alert('確認', msg, [
            { text: 'キャンセル', style: 'cancel' },
            { text: 'OK', onPress: doJoin }
          ]);
        }
      } else {
        doJoin();
      }
    }
  };


  const renderShotsMenu = () => (

    <Modal visible={isShotMenuVisible} transparent animationType="fade" onRequestClose={closeShotMenu}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 }} activeOpacity={1} onPress={closeShotMenu}>
        <View style={{ width: '90%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' }}>
          <View style={{ padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C6C6C8', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: '#8E8E93', fontWeight: '600' }}>射数の設定</Text>
          </View>
          {shotOptions.map((n) => (
            <TouchableOpacity key={n} style={{ padding: 18, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C6C6C8' }} onPress={() => { handleSetShotsWithConfirm(n); closeShotMenu(); }}>
              <Text style={{ fontSize: 20, color: '#007AFF' }}>{n}射</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{ padding: 18, alignItems: 'center' }} onPress={() => {
              closeShotMenu();
              setTimeout(() => {
                setCustomShotText(String(shotsPerRound));
                setCustomShotInputVisible(true);
              }, 100);
          }}>
            <Text style={{ fontSize: 20, color: '#007AFF' }}>任意...</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={{ width: '90%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 14, marginTop: 8, padding: 18, alignItems: 'center' }} onPress={closeShotMenu}>
          <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderLiveStatus = () => {
    // Check both broad isLiveActive and specific liveSessionName
    if (!isLiveActive || !liveSessionName) return null;
    return (
      <View style={[styles.liveStatusHeader, styles.liveActiveHeader, { marginHorizontal: 8, borderRadius: 8 }]}>
        <Ionicons name="radio-outline" size={12} color="#FFF" />
        <Text style={styles.liveStatusText} numberOfLines={1}>
          ライブ中: {liveSessionName}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {renderLiveStatus()}
      <View style={[styles.navBar, { zIndex: 10000 }]}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={handleReset} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>{isReadOnly ? 'クリア' : 'リセット'}</Text>
          </TouchableOpacity>
          <View style={styles.syncContainer}>
            {!isFirebaseConnected || syncStatus === '同期エラー' ? (
              <Ionicons name="cloud-offline-outline" size={14} color="#FF3B30" />
            ) : syncStatus === '同期中' ? (
              <Ionicons name="cloud-upload-outline" size={14} color="#007AFF" />
            ) : syncStatus === '同期済み' ? (
              <Ionicons name="cloud-done-outline" size={14} color="#34C759" />
            ) : (
              <Ionicons name="cloud-outline" size={14} color="#8E8E93" />
            )}
            <Text style={styles.syncTimeText}>{lastSyncTime ? ` ${new Date(lastSyncTime).toLocaleTimeString('ja-JP')}` : ' --:--:--'}</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity 
            onPress={handleLiveToggle} 
            style={[styles.liveBtn, isLiveActive && styles.liveBtnActive]}
          >
            <Ionicons name="radio-outline" size={16} color={isLiveActive ? "#FFF" : "#007AFF"} />
            <Text style={[styles.liveBtnText, isLiveActive && styles.liveBtnTextActive]}>
              {isLiveActive ? (isHost ? '停止' : '退出') : 'ライブ'}
            </Text>
          </TouchableOpacity>

          <View style={styles.zoomContainer}>
            <TouchableOpacity onPress={handleZoomOut} style={styles.zoomBtn}>
              <Ionicons name="remove-circle-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleZoomIn} style={styles.zoomBtn}>
              <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={openShotMenu} style={styles.shotsToggle}><Text style={styles.shotsText}>{shotsPerRound}射</Text></TouchableOpacity>
        </View>
      </View>


      {renderShotsMenu()}

      <Modal visible={isLiveMenuVisible} transparent animationType="fade" onRequestClose={() => setLiveMenuVisible(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 40 }} activeOpacity={1} onPress={() => setLiveMenuVisible(false)}>
          <View style={{ width: '90%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden' }}>
            <TouchableOpacity style={{ padding: 18, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C6C6C8' }} onPress={() => handleLiveMenuSelect('host')}>
              <Text style={{ fontSize: 20, color: '#007AFF' }}>ライブ記録を開始</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 18, alignItems: 'center' }} onPress={() => handleLiveMenuSelect('join')}>
              <Text style={{ fontSize: 20, color: '#007AFF' }}>ライブ記録に参加</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={{ width: '90%', maxWidth: 400, backgroundColor: '#FFF', borderRadius: 14, marginTop: 8, padding: 18, alignItems: 'center' }} onPress={() => setLiveMenuVisible(false)}>
            <Text style={{ fontSize: 20, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isLiveInputVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 300, backgroundColor: '#FFF', borderRadius: 12, padding: 20, alignItems: 'center', maxHeight: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              {liveModeType === 'host' ? 'ライブを開始' : 'ライブに参加'}
            </Text>
            
            {liveModeType === 'host' ? (
              <>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>セッション名を入力してください</Text>
                <TextInput
                  style={{ width: '100%', borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 }}
                  value={liveSessionInput}
                  onChangeText={setLiveSessionInput}
                  placeholder="session_name_123"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {liveModeError && (
                  <Text style={{ color: '#FF3B30', fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: 'bold' }}>
                    {liveModeError}
                  </Text>
                )}
              </>
            ) : (
              <View style={{ width: '100%' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>アクティブなセッション一覧</Text>
                  <TouchableOpacity onPress={() => {
                    useScoreStore.getState().fetchActiveLiveSessions();
                    showFeedback('更新しました');
                  }}>
                    <Ionicons name="refresh" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ width: '100%', maxHeight: 300, marginBottom: 20 }}>
                  {!Array.isArray(liveSessionsList) || liveSessionsList.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>現在アクティブな記録はありません</Text>
                  ) : (
                    liveSessionsList.map((sessionName: string) => (
                      <View key={sessionName} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEE', backgroundColor: liveSessionInput === sessionName ? '#E5F1FF' : '#FFF' }}>
                        <TouchableOpacity 
                          style={{ flex: 1, padding: 16 }}
                          onPress={() => setLiveSessionInput(sessionName)}
                        >
                          <Text style={{ fontSize: 16, color: '#333' }}>{sessionName}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ padding: 16 }}
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              if (window.confirm(`セッション「${sessionName}」を完全に削除しますか？`)) {
                                useScoreStore.getState().deleteLiveSession(sessionName);
                              }
                            } else {
                              Alert.alert('セッション削除', `セッション「${sessionName}」を完全に削除しますか？`, [
                                { text: 'キャンセル', style: 'cancel' },
                                { text: '削除', style: 'destructive', onPress: () => useScoreStore.getState().deleteLiveSession(sessionName) }
                              ]);
                            }
                          }}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F2F2F7', alignItems: 'center' }} onPress={() => setLiveInputVisible(false)}>
                <Text style={{ fontSize: 16, color: '#007AFF', fontWeight: 'bold' }}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: liveSessionInput.trim() ? '#007AFF' : '#CCC', alignItems: 'center' }} onPress={confirmLiveInput} disabled={!liveSessionInput.trim()}>
                <Text style={{ fontSize: 16, color: '#FFF', fontWeight: 'bold' }}>決定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={[styles.gridArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={{ maxHeight: '100%', flexDirection: 'column', maxWidth: '100%' }}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flexGrow: 0 }}>
            <View style={{ flexDirection: 'row-reverse', minWidth: '100%' }}>
              <View style={{ backgroundColor: '#F2F2F7', zIndex: 10 }}>
                <LabelColumn shots={shotsPerRound} showFooter={false} />
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true} 
                style={{ flexGrow: 0, flexShrink: 1 }}
                ref={gridScrollRef}
                onScroll={handleGridScroll}
                scrollEventThrottle={16}
              >
                <View style={[styles.gridRow, { flexDirection: 'row-reverse' }]}>
                  {(Array.isArray(archers) ? archers : []).map((archer, idx) => (
                    <ArcherColumnView 
                      key={archer.id} 
                      archer={archer} 
                      shots={shotsPerRound} 
                      allArchers={Array.isArray(archers) ? archers : []} 
                      indexInList={idx} 
                      showFooter={false} 
                      isReadOnly={isReadOnly} 
                      onPressName={() => openArcherMenu(archer.id, archer.name, idx)} 
                      onDelete={() => deleteArcher(archer.id)} 
                    />
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
          <View style={{ height: UIConfig.footerHeight * viewScale, flexDirection: 'row-reverse', borderTopWidth: 1.5, borderTopColor: '#000' }}>
            <View style={{ width: UIConfig.headerWidth * viewScale, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', borderLeftWidth: 1.5, borderLeftColor: '#000', borderRightWidth: 1.5, borderRightColor: '#000' }}>
              <Text style={{ fontSize: 10 * viewScale, fontWeight: 'bold', color: '#3C3C43' }}>名</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, flexShrink: 1 }}
              ref={footerScrollRef}
              onScroll={handleFooterScroll}
              scrollEventThrottle={16}
            >
              <View style={[styles.gridRow, { flexDirection: 'row-reverse' }]}>
                {(archers || []).map((archer, idx) => (
                  <View key={`footer-${archer.id}`} style={{ 
                    width: (archer.isSeparator ? UIConfig.separatorWidth : UIConfig.cellWidth) * viewScale, 
                    height: UIConfig.footerHeight * viewScale,
                    backgroundColor: archer.isTotalCalculator ? 'rgba(0,122,255,0.05)' : '#F2F2F7', 
                    borderRightWidth: (archer.isSeparator || archer.isTotalCalculator) ? 1.5 : 1,
                    borderRightColor: '#000',
                    borderLeftWidth: (archer.isSeparator || archer.isTotalCalculator) ? 1.5 : 0,
                    borderLeftColor: '#000',
                    padding: 4,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {!archer.isSeparator ? (
                      <TouchableOpacity 
                        style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
                        onPress={() => openArcherMenu(archer.id, archer.name, idx)}
                      >
                        <Text style={[styles.footerName, { color: archer.name ? '#000' : '#8E8E93', fontSize: 14 * viewScale }]} numberOfLines={2}>
                          {archer.isTotalCalculator ? '合計' : (archer.name ? formatName(archer.name) : '選択')}
                        </Text>
                        {!!archer.isGuest && (
                          <Text style={[styles.guestLabel, { fontSize: 9 * viewScale }]}>(ゲスト)</Text>
                        )}
                        {!archer.isTotalCalculator && archer.name !== '' && archer.gender !== '未設定' ? (
                          <View style={{ marginTop: 2, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 10, backgroundColor: archer.gender === '男子' ? '#007AFF' : '#FF2D55' }}>
                            <Ionicons name="person" size={10 * viewScale} color="#FFF" />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={{ alignItems: 'center', width: '100%', height: '100%', justifyContent: 'center' }}
                        onPress={() => deleteArcher(archer.id)}
                        disabled={isReadOnly}
                      >
                        <Ionicons name="close-circle" size={24 * viewScale} color="#8E8E93" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
        {archers.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Text style={styles.emptyTitle}>記録を始めましょう</Text>
            <Text style={styles.emptyHint}>下の「人」ボタンで射手を追加</Text>
          </View>
        )}
      </View>
      <View style={styles.toolbar}>
        {isReadOnly ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
             <Text style={{ color: '#8E8E93', fontSize: 16, fontWeight: 'bold' }}>履歴閲覧モード</Text>
             <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#8E8E93' }]} onPress={() => useScoreStore.setState({ archers: [], historyStack: [], redoStack: [], activeSessionID: null })}><Text style={styles.saveBtnText}>閉じる</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.historyBtns}>
              <TouchableOpacity style={[styles.historyBtn, { opacity: historyStack.length > 0 ? 1 : 0.3 }]} onPress={handleUndo} disabled={historyStack.length === 0}><Ionicons name="arrow-undo" size={24} color="#8E8E93" /></TouchableOpacity>
              <TouchableOpacity style={[styles.historyBtn, { opacity: redoStack.length > 0 ? 1 : 0.3 }]} onPress={handleRedo} disabled={redoStack.length === 0}><Ionicons name="arrow-redo" size={24} color="#8E8E93" /></TouchableOpacity>
            </View>
            <View style={styles.addBtns}>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: 'rgba(0,122,255,0.1)' }]} onPress={handleAddArcher}><Ionicons name="person-add" size={24} color="#007AFF" /><Text style={[styles.addLabel, { color: '#007AFF' }]}>人</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: 'rgba(255,149,0,0.1)' }]} onPress={handleAddSeparator}><Ionicons name="pause" size={24} color="#FF9500" /><Text style={[styles.addLabel, { color: '#FF9500' }]}>間隔</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: 'rgba(52,199,89,0.1)' }]} onPress={handleAddTotal}><Text style={{ fontSize: 22, fontWeight: 'bold', color: '#34C759' }}>Σ</Text><Text style={[styles.addLabel, { color: '#34C759' }]}>計</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSession}><Text style={styles.saveBtnText}>終了・保存</Text></TouchableOpacity>
          </>
        )}
      </View>
      <ArcherActionModal 
        visible={pickerVisible} 
        archerId={pickingId || ''} 
        archerName={(Array.isArray(archers) ? archers : []).find(a => a && a.id === pickingId)?.name || ''} 
        archerOrigIdx={pickingOrigIdx} 
        isSeparator={(Array.isArray(archers) ? archers : []).find(a => a && a.id === pickingId)?.isSeparator || false} 
        isTotalCalculator={(Array.isArray(archers) ? archers : []).find(a => a && a.id === pickingId)?.isTotalCalculator || false} 
        onClose={() => setPickerVisible(false)} 
        onSubstitution={() => setSubModalVisible(true)} 
      />
      <SaveSessionModal visible={saveModalVisible} onClose={() => setSaveModalVisible(false)} onSave={executeSave} />
      <ManualSubstitutionModal visible={subModalVisible} archerId={pickingId} onClose={() => setSubModalVisible(false)} />

      {/* WEB COMPATIBLE CUSTOM MODALS */}
      <Modal visible={resetModalVisible} transparent animationType="fade" onRequestClose={() => setResetModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setResetModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>すべての記録をリセット</Text>
            <Text style={styles.modalMessage}>現在入力されている全ての的中記録と交代設定、および全てのデータが削除されます。リセットしてよろしいですか？</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]} onPress={() => setResetModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]} onPress={executeReset}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>リセット</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={shotReduceModalVisible} transparent animationType="fade" onRequestClose={() => setShotReduceModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShotReduceModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>射数を減らしますか？</Text>
            <Text style={styles.modalMessage}>射数を{shotReduceTarget}射に減らすと、後ろの入力済みデータが全て削除されます。よろしいですか？</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]} onPress={() => setShotReduceModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]} onPress={executeShotReduce}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>削除して変更</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={customShotInputVisible} transparent animationType="fade" onRequestClose={() => setCustomShotInputVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCustomShotInputVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>射数の詳細設定</Text>
            <Text style={styles.modalMessage}>1〜500本の間で入力してください</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={customShotText}
              onChangeText={setCustomShotText}
              onSubmitEditing={submitCustomShot}
              autoFocus
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]} onPress={() => setCustomShotInputVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 }]} onPress={submitCustomShot}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>決定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {feedbackMsg ? <View style={styles.feedbackOverlay}><Text style={styles.feedbackText}>{feedbackMsg}</Text></View> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  navBar: { minHeight: 40, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 2 },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncContainer: { flexDirection: 'row', alignItems: 'center' },
  syncTimeText: { fontSize: 9, color: '#8E8E93' },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resetBtn: { zIndex: 10001, backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 4 },
  resetBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  liveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,122,255,0.1)', 
    paddingHorizontal: 6, 
    paddingVertical: 4, 
    borderRadius: 6,
    gap: 3
  },
  liveBtnActive: { backgroundColor: '#FF3B30' },
  liveBtnText: { fontSize: 12, color: '#007AFF', fontWeight: 'bold' },
  liveBtnTextActive: { color: '#FFF' },
  zoomContainer: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  zoomBtn: { padding: 2 },
  shotsToggle: { padding: 4, zIndex: 10001 },
  shotsText: { fontSize: 13, color: '#5856D6', fontWeight: 'bold' },
  
  liveStatusHeader: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8E8E93',
    gap: 6
  },
  liveHostHeader: {
    backgroundColor: '#007AFF',
  },
  liveJoinHeader: {
    backgroundColor: '#007AFF',
  },
  liveActiveHeader: {
    backgroundColor: '#007AFF',
  },
  liveStatusText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  gridArea: { flex: 1, backgroundColor: '#FFF' },
  tallWrapper: { flex: 1, flexDirection: 'column' },
  gridRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', minWidth: '100%' },
  fixedFooter: { flexDirection: 'row', height: UIConfig.footerHeight, backgroundColor: '#F2F2F7', borderTopWidth: 1, borderTopColor: '#C6C6C8' },
  footerLabelCell: { width: UIConfig.headerWidth, height: UIConfig.footerHeight, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', borderRightWidth: 1, borderRightColor: '#000' },
  footerLabelText: { fontSize: 10, fontWeight: 'bold', color: '#3C3C43' },
  footerNameCell: { height: UIConfig.footerHeight, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', borderBottomWidth: 1, borderBottomColor: '#000', padding: 4 },
  footerName: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  guestLabel: { fontSize: 9, color: '#8E8E93' },
  emptyOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#8E8E93' },
  toolbar: { height: 80, backgroundColor: '#FFF', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#C6C6C8', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8 },
  addBtns: { flexDirection: 'row', gap: 6 },
  addBtn: { width: 62, height: 60, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addLabel: { fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  historyBtns: { flexDirection: 'row', gap: 4 },
  historyBtn: { padding: 6 },
  saveBtn: { backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, minWidth: 90, justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  feedbackOverlay: { position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  feedbackText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxWidth: 350, backgroundColor: '#FFF', borderRadius: 14, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
  modalInput: { width: '100%', height: 44, borderWidth: 1, borderColor: '#C6C6C8', borderRadius: 8, paddingHorizontal: 12, fontSize: 18, marginBottom: 20, textAlign: 'center' },
  modalButtonsRow: { flexDirection: 'row', width: '100%' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: 'bold' },
});
