import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useScoreStore } from './src/JP_useScoreStore_174';
import { MainNavigator } from './src/JP_MainNavigator_216';
import { LoginScreen } from './src/JP_LoginScreen_1036';
import { LoadingScreen } from './src/JP_LoadingScreen_1037';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './src/JP_ErrorBoundary_1041';
import { OfflineIndicator } from './src/JP_OfflineIndicator_1042';
import { getShadowStyle } from './src/module_592';

const IS_WEB = Platform.OS === 'web';

export default function App() {
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
      try {
        fetchAndOverwriteFromCloud();
        startPeriodicSync();
      } catch (e) {
        console.error('[App] Initial data fetch error:', e);
      }
    } else {
      console.log('[App] Waiting for:', { isHydrated, activeGroupId });
    }
  }, [isHydrated, activeGroupId]);

  console.log(`[App] Rendering. hasMounted: ${hasMounted}, isHydrated: ${isHydrated}, activeGroupId: ${activeGroupId}`);

  if (!hasMounted || !isHydrated) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.appContainer}>
      {IS_WEB && (
        <style dangerouslySetInnerHTML={{ __html: `
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #F2F2F7; }
          ::-webkit-scrollbar-thumb { background: #C7C7CC; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #8E8E93; }
          * { scrollbar-width: thin; scrollbar-color: #C7C7CC #F2F2F7; }
        `}} />
      )}
      <View style={styles.responsiveWrapper}>
        <SafeAreaProvider style={{ flex: 1, width: '100%', height: '100%' }}>
          <ErrorBoundary>
            <StatusBar style="dark" />
            {activeGroupId ? (
              <>
                <MainNavigator />
                <OfflineIndicator />
              </>
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
