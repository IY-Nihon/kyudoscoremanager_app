import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
// StyleSheet はテーマ変換を通すためブリッジ経由で取得する
import StyleSheet from './src/default_45';
import { useScoreStore } from './src/JP_useScoreStore_174';
import { MainNavigator } from './src/JP_MainNavigator_216';
import { LoginScreen } from './src/JP_LoginScreen_1036';
import { LoadingScreen } from './src/JP_LoadingScreen_1037';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './src/JP_ErrorBoundary_1041';
import { OfflineIndicator } from './src/JP_OfflineIndicator_1042';
import { WhatsNewModal } from './src/JP_WhatsNewModal';
import { getShadowStyle } from './src/module_592';
import { initTheme, useThemeMode } from './src/theme';

const IS_WEB = Platform.OS === 'web';

// 保存済みのテーマと OS 配色の追従を、最初の描画前に開始しておく
initTheme();

export default function App() {
  // テーマが変わったらアプリ全体を再描画させる（色の変換は描画時に走る）
  const { theme } = useThemeMode();
  const isHydrated = useScoreStore(e => e.isHydrated);
  const activeGroupId = useScoreStore(e => e.activeGroupId);
  const startPeriodicSync = useScoreStore(e => e.startPeriodicSync);
  const fetchAndOverwriteFromCloud = useScoreStore(e => e.fetchAndOverwriteFromCloud);
  const setupNetworkListener = useScoreStore(e => e.setupNetworkListener);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const cleanup = setupNetworkListener();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (isHydrated && activeGroupId) {
      console.log('[App] Initializing data for group:', activeGroupId);
      (async () => {
        try {
          await fetchAndOverwriteFromCloud();
          startPeriodicSync();
        } catch (e) {
          console.error('[App] Initial data fetch error:', e);
        }
      })();
    } else {
      console.log('[App] Waiting for:', { isHydrated, activeGroupId });
    }
  }, [isHydrated, activeGroupId]);

  console.log(`[App] Rendering. hasMounted: ${hasMounted}, isHydrated: ${isHydrated}, activeGroupId: ${activeGroupId}`);

  if (!hasMounted || !isHydrated) {
    return <LoadingScreen />;
  }

  const isDarkTheme = theme === 'dark';
  // styles 側の色は default_45 のブリッジが変換するため、ここでは上書きしない
  // （上書きするとダーク色がもう一度変換されて元に戻ってしまう）。
  // 下の <style> は生のCSSで props を通らないため、変換対象外＝直接指定でよい。
  const rootBg = isDarkTheme ? '#000000' : '#F2F2F7';
  const scrollTrack = isDarkTheme ? '#1C1C1E' : '#F2F2F7';
  const scrollThumb = isDarkTheme ? '#48484A' : '#C7C7CC';

  return (
    <View style={styles.appContainer}>
      {IS_WEB && (
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { background: ${rootBg}; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: ${scrollTrack}; }
          ::-webkit-scrollbar-thumb { background: ${scrollThumb}; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #8E8E93; }
          * { scrollbar-width: thin; scrollbar-color: ${scrollThumb} ${scrollTrack}; }
        `}} />
      )}
      <View style={styles.responsiveWrapper}>
        <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%' }}>
          <ErrorBoundary>
            <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
            {activeGroupId ? (
              // 色の変換は「描画時」に行うため、テーマを変えたら配下を再マウントして
              // 全画面を描画し直す。React Navigation の画面はメモ化されており、
              // key を変えないと再描画されず配色が古いままになる。
              // 記録データは zustand ストア側にあるため再マウントしても失われない。
              <React.Fragment key={theme}>
                <MainNavigator />
                <OfflineIndicator />
                <WhatsNewModal />
              </React.Fragment>
            ) : (
              <LoginScreen />
            )}
          </ErrorBoundary>
        </SafeAreaProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  responsiveWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: IS_WEB ? 1000 : undefined,
    backgroundColor: '#FFFFFF',
    ...getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: IS_WEB ? 0.1 : 0,
      shadowRadius: 12,
      elevation: 5
    })
  }
});
