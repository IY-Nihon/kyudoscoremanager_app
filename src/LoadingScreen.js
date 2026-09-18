'use strict';

const View = require('./View').default;
const Text = require('./Text').default;
const ActivityIndicator = require('./ActivityIndicator').default;
const StyleSheet = require('./StyleSheet').default;
const { useScoreStore } = require('./useScoreStore');
const { getShadowStyle } = require('./shadowStyle');
const { Image } = require('react-native');
const LoadingScreen = () => {
  const e = useScoreStore((e) => e.initializationLogs);
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image source={require('../assets/kyudo_icon.png')} style={styles.logoImage} />
      </View>
      <Text style={styles.title}>弓道部的中ノート</Text>
      <View style={styles.loaderWrapper}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
      <Text style={styles.subtitle}>データを準備しています...</Text>
      {e && e.length > 0 && (
        <View style={styles.logContainer}>
          <View style={styles.logHeader}>
            <View style={styles.logDot} />
            <Text style={styles.logHeaderText}>INITIALIZATION LOG</Text>
          </View>
          <View style={styles.logList}>
            {e.map((t, l) => (
              <Text
                key={l}
                style={[styles.logText, l === e.length - 1 ? styles.logTextActive : styles.logTextInactive]}
              >
                {t}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  logoWrapper: Object.assign(
    {
      width: 80,
      height: 80,
      backgroundColor: '#FFF',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    })
  ),
  logoImage: { width: 80, height: 80, borderRadius: 20 },
  loaderWrapper: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#8E8E93', marginBottom: 48, fontWeight: '500' },
  logContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.1)',
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#007AFF', marginRight: 8 },
  logHeaderText: { fontSize: 13, color: '#1C1C1E', fontWeight: '700', letterSpacing: 0.5 },
  logList: { gap: 4 },
  logText: { fontSize: 11 },
  logTextActive: { color: '#007AFF', opacity: 1 },
  logTextInactive: { color: '#636366', opacity: 0.7 },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.LoadingScreen = LoadingScreen;
