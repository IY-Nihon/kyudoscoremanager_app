import './global.css';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useScoreStore } from './src/stores/useScoreStore';
import { MainNavigator } from './src/navigation/MainNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { auth, ADMIN_EMAIL, ADMIN_PASSWORD } from './src/services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function App() {
  const { startPeriodicSync, fetchAndOverwriteFromCloud, isHydrated } = useScoreStore();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    console.log('[App] Starting initialization...');
    
    // Authenticate with Firebase
    signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
      .then(() => {
        console.log('[App] Firebase Authenticated successfully');
        setIsAuthReady(true);
        fetchAndOverwriteFromCloud();
        startPeriodicSync();
      })
      .catch((error) => {
        console.error('[App] Firebase Auth Error:', error);
        setIsAuthReady(true); // Proceed anyway to avoid total block
      });
  }, [fetchAndOverwriteFromCloud, startPeriodicSync]);

  useEffect(() => {
    if (isHydrated) {
      console.log('[App] Store Hydrated');
    }
  }, [isHydrated]);

  // Prevent Hydration Mismatch: Always render same content on first client pass (Loading)
  // then switch to real content once mounted and ready.
  if (!hasMounted || !isHydrated || (Platform.OS === 'web' && !isAuthReady)) {
    if (hasMounted) {
      console.log('[App] Loading state:', { isHydrated, isAuthReady, OS: Platform.OS });
    }
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#8E8E93' }}>データを読み込み中...</Text>
      </View>
    );
  }

  console.log('[App] Rendering Main Navigator');

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar style="dark" />
        <MainNavigator />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
