import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, Modal } from 'react-native';
import { useScoreStore } from '../stores/useScoreStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { saveAs } from 'file-saver';

export const SettingsScreen: React.FC = () => {
  const {
    currentFreshmanTerm,
    alumni,
    trash,
    shotsPerRound,
    updateCurrentFreshmanTerm,
    showSyncErrorPopups,
    setShowSyncErrorPopups,
    syncStatus,
    lastSyncTime,
    isFirebaseConnected,
    fetchAndOverwriteFromCloud,
    syncAllToCloud,
    clearAllData,
    importData,
  } = useScoreStore();


  const [csvModalVisible, setCsvModalVisible] = React.useState(false);
  const [clearAllModalVisible, setClearAllModalVisible] = React.useState(false);
  const [cloudRestoreModalVisible, setCloudRestoreModalVisible] = React.useState(false);
  const [jsonRestoreModalVisible, setJsonRestoreModalVisible] = React.useState(false);
  const [pendingJsonData, setPendingJsonData] = React.useState<any>(null);

  const handleClearAll = () => {
    setClearAllModalVisible(true);
  };

  const handleBackup = async () => {
    try {
      const state = useScoreStore.getState();
      const backupData = {
        sessions: state.sessions,
        history: state.history,
        archers: state.archers,
        members: state.members,
        alumni: state.alumni,
        trash: state.trash,
        shotsPerRound: state.shotsPerRound,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      if (Platform.OS === 'web') {
        // file-saverを使って確実にダウンロード（ファイル名付き）
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        saveAs(blob, 'recordapp_backup.json');
      } else {
        const fileUri = FileSystem.documentDirectory + "recordapp_backup.json";
        await FileSystem.writeAsStringAsync(fileUri, jsonStr, { encoding: FileSystem.EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('エラー', 'この環境では共有機能を利用できません');
        }
      }
    } catch (e: any) {
      console.error('Backup error:', e);
      if (Platform.OS === 'web') {
        window.alert('エラー: バックアップの作成に失敗しました\n' + String(e));
      } else {
        Alert.alert('エラー', 'バックアップの作成に失敗しました\n' + String(e));
      }
    }
  };

  const handleCSVExport = async () => {
    setCsvModalVisible(true);
  };

  const exportFilteredCSV = async (type: 'all' | 'fiscal') => {
    try {
      const { sessions } = useScoreStore.getState();
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const fiscalYear = currentMonth >= 4 ? currentYear : currentYear - 1;

      const filteredSessions = sessions.filter(s => {
        if (type === 'all') return true;
        const d = new Date(s.date);
        const sYear = d.getFullYear();
        const sMonth = d.getMonth() + 1;
        const sFiscalYear = sMonth >= 4 ? sYear : sYear - 1;
        return sFiscalYear === fiscalYear;
      });

      if (filteredSessions.length === 0) {
        const msg = '対象期間のデータがありません';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('通知', msg);
        }
        return;
      }

      let csv = "\uFEFF日付,タイトル,射手名,的中率,的中数,総矢数,メモ\n";
      filteredSessions.forEach(s => {
        const dateObj = new Date(s.date);
        const dateStr = `${dateObj.getFullYear()}/${dateObj.getMonth()+1}/${dateObj.getDate()}`;
        
        if (!s || !s.archers || !Array.isArray(s.archers)) return;
        s.archers.forEach(a => {
          if (!a || a.isSeparator || a.isTotalCalculator) return;
          const marks = Array.isArray(a.marks) ? a.marks : [];
          const hits = marks.filter(m => m === '○').length;
          const total = s.shotCount;
          const rate = total > 0 ? (hits / total * 100).toFixed(1) : '0.0';
          const title = `"${s.title || ''}"`;
          const note = `"${(s.note || '').replace(/\n/g, ' ')}"`;
          csv += `${dateStr},${title},${a.name || '不明'},${rate}%,${hits},${total},${note}\n`;
        });
      });
      
      const fileUri = FileSystem.cacheDirectory + `recordapp_export_${type}.csv`;
      
      if (Platform.OS === 'web') {
        const fileName = `recordapp_export_${type}.csv`;
        // BOM付きCSVでExcelの文字化けを防ぐ
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const fileObj = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(fileObj, fileName);
      } else {
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'CSVファイルを書き出し・共有',
            UTI: 'public.comma-separated-values'
          });
        } else {
          Alert.alert('エラー', 'この環境では共有機能を利用できません');
        }
      }
    } catch (e: any) {
      console.error('CSV Export Error:', e);
      const msg = 'CSVの生成または共有に失敗しました。';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('エラー', msg);
      }
    }
  };



  const handleImportJSONFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
      });
      if (result.canceled) return;
      
      const asset = result.assets[0];
      let jsonContent = '';
      if (Platform.OS === 'web' && asset.file) {
        jsonContent = await (asset.file as any).text();
      } else {
        jsonContent = await FileSystem.readAsStringAsync(asset.uri);
      }
      
      const data = JSON.parse(jsonContent);
      if (data.sessions || data.members || data.archers) {
        setPendingJsonData(data);
        setJsonRestoreModalVisible(true);
      } else {
        const msg = '有効なバックアップが見つかりません';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('エラー', msg);
      }
    } catch (e: any) {
      console.error('JSON Import Error:', e);
      if (Platform.OS === 'web') window.alert('エラー: ファイルの読み込みに失敗しました\n' + String(e));
      else Alert.alert('エラー', 'ファイルの読み込みに失敗しました');
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContainer}>
        {children}
      </View>
    </View>
  );

  const renderItem = (icon: keyof typeof Ionicons.glyphMap, title: string, onPress?: () => void, color = '#007AFF', rightElement?: React.ReactNode, isDestructive = false) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemLeft}>
        <Ionicons name={icon} size={22} color={color} style={styles.itemIcon} />
        <Text style={[styles.itemText, isDestructive && { color: '#FF3B30' }]}>{title}</Text>
      </View>
      <View style={styles.itemRight}>
        {rightElement || <Ionicons name="chevron-forward" size={18} color="#C6C6C8" />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>設定</Text>
        
        {renderSection('基本設定', (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Ionicons name="school-outline" size={22} color="#007AFF" style={styles.itemIcon} />
              <Text style={styles.itemText}>今年度の1年生の期</Text>
            </View>
            <View style={styles.stepperContainer}>
              <Text style={styles.stepperValue}>{useScoreStore(state => state.currentFreshmanTerm)}期</Text>
              <View style={styles.stepperControls}>
                <TouchableOpacity 
                   style={styles.stepperBtn} 
                   onPress={() => {
                     const current = useScoreStore.getState().currentFreshmanTerm;
                     updateCurrentFreshmanTerm(current - 1);
                   }}
                >
                  <Ionicons name="remove" size={20} color="#007AFF" />
                </TouchableOpacity>
                <View style={styles.stepperDivider} />
                <TouchableOpacity 
                   style={styles.stepperBtn} 
                   onPress={() => {
                     const current = useScoreStore.getState().currentFreshmanTerm;
                     updateCurrentFreshmanTerm(current + 1);
                   }}
                >
                  <Ionicons name="add" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {renderSection('データ管理', (
          <>
            {renderItem('cloud-upload-outline', 'バックアップを作成 (JSONファイル)', handleBackup)}
            {renderItem('document-text-outline', 'JSONファイルから復元', handleImportJSONFile, '#5856D6')}
            {renderItem('share-outline', 'データをCSV形式で書き出し', handleCSVExport, '#34C759')}
            
            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Ionicons name="notifications-outline" size={22} color="#FF9500" style={styles.itemIcon} />
                <Text style={styles.itemText}>同期エラーを通知</Text>
              </View>
              <Switch
                value={showSyncErrorPopups}
                onValueChange={setShowSyncErrorPopups}
                trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              />
            </View>
            
            <TouchableOpacity style={styles.item} onPress={fetchAndOverwriteFromCloud}>
              <View style={styles.itemLeft}>
                <Ionicons name="cloud-download-outline" size={22} color="#007AFF" style={styles.itemIcon} />
                <Text style={styles.itemText}>クラウドデータを受信</Text>
              </View>
              <Text style={styles.timestamp}>{lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('ja-JP') : (syncStatus === '同期済み' ? '' : syncStatus)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} onPress={syncAllToCloud}>
              <View style={styles.itemLeft}>
                <Ionicons name="cloud-upload-outline" size={22} color="#5856D6" style={styles.itemIcon} />
                <Text style={styles.itemText}>クラウドへデータを送信</Text>
              </View>
              <Text style={styles.timestamp}>{lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString('ja-JP') : (syncStatus === '同期済み' ? '' : syncStatus)}</Text>
            </TouchableOpacity>

            {renderItem('refresh-outline', 'クラウドから強制的に復元', () => {
              setCloudRestoreModalVisible(true);
            }, '#FF3B30', null, true)}
            {renderItem('trash-outline', '全データを消去', handleClearAll, '#FF3B30', null, true)}
          </>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 2.0.0 (Expo SQLite/Firebase)</Text>
          <Text style={styles.statusText}>
            ● {isFirebaseConnected ? 'Firebase 接続済み' : '未接続'} | {lastSyncTime ? `最終同期: ${new Date(lastSyncTime).toLocaleString('ja-JP')}` : syncStatus}
          </Text>
        </View>
      </ScrollView>

      {/* Custom CSV Modal */}
      <Modal visible={csvModalVisible} transparent animationType="fade" onRequestClose={() => setCsvModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCsvModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CSV形式で書き出し</Text>
            <Text style={styles.modalMessage}>書き出すデータの範囲を選択してください。</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7' }]} onPress={() => setCsvModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#007AFF' }]} onPress={() => { setCsvModalVisible(false); exportFilteredCSV('fiscal'); }}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>今学期のデータ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#34C759' }]} onPress={() => { setCsvModalVisible(false); exportFilteredCSV('all'); }}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>すべてのデータ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CLEAR ALL MODAL */}
      <Modal visible={clearAllModalVisible} transparent animationType="fade" onRequestClose={() => setClearAllModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setClearAllModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>データの消去</Text>
            <Text style={styles.modalMessage}>すべてのデータを消去しますか？この操作は取り消せません。</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]} onPress={() => setClearAllModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]} onPress={() => {
                setClearAllModalVisible(false);
                clearAllData();
              }}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>全データ消去</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CLOUD RESTORE MODAL */}
      <Modal visible={cloudRestoreModalVisible} transparent animationType="fade" onRequestClose={() => setCloudRestoreModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCloudRestoreModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>強制復元</Text>
            <Text style={styles.modalMessage}>クラウドのデータでローカルを上書きしますか？現在のローカルデータは失われます。</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]} onPress={() => setCloudRestoreModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 5 }]} onPress={() => {
                setCloudRestoreModalVisible(false);
                fetchAndOverwriteFromCloud();
              }}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>強制復元</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* JSON RESTORE MODAL */}
      <Modal visible={jsonRestoreModalVisible} transparent animationType="fade" onRequestClose={() => setJsonRestoreModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setJsonRestoreModalVisible(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>復元の確認</Text>
            <Text style={styles.modalMessage}>ファイルからデータを読み込みます。既存のデータは上書き・追加されますか？</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#F2F2F7', flex: 1, marginRight: 5 }]} onPress={() => setJsonRestoreModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#007AFF' }]}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#007AFF', flex: 1, marginLeft: 5 }]} onPress={async () => {
                setJsonRestoreModalVisible(false);
                if (pendingJsonData) {
                  await importData(pendingJsonData);
                  setPendingJsonData(null);
                }
              }}>
                <Text style={[styles.modalBtnText, { color: '#FFF' }]}>復元する</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1 },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#000',
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginLeft: 32,
    marginBottom: 6,
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
    backgroundColor: '#FFF',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 24,
    marginRight: 12,
  },
  itemText: {
    fontSize: 17,
    color: '#000',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  footer: {
    marginTop: 30,
    marginBottom: 50,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#34C759',
  },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: '85%', maxWidth: 350, backgroundColor: '#FFF', borderRadius: 14, padding: 20, alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#3C3C43', textAlign: 'center', marginBottom: 20 },
  modalButtons: { width: '100%', gap: 10 },
  modalButtonsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: 'bold' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    height: 36,
    paddingLeft: 12,
  },
  stepperValue: {
    fontSize: 16,
    color: '#000',
    marginRight: 8,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    height: 32,
    marginRight: 2,
  },
  stepperBtn: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#C6C6C8',
  },
});
