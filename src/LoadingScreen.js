'use strict';

const { 色 } = require('./iro.js');
const { View, Text, ActivityIndicator, StyleSheet, Image } = require('./rn');
const { useScoreStore } = require('./useScoreStore');
const { getShadowStyle } = require('./shadowStyle');
const LoadingScreen = () => {
  const 読み込みの記録 = useScoreStore((状態) => 状態.initializationLogs);
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image source={require('../assets/kyudo_icon.png')} style={styles.logoImage} />
      </View>
      <Text style={styles.title}>弓道部的中ノート</Text>
      <View style={styles.loaderWrapper}>
        <ActivityIndicator size="small" color={色.青} />
      </View>
      <Text style={styles.subtitle}>データを準備しています...</Text>
      {読み込みの記録 && 読み込みの記録.length > 0 && (
        <View style={styles.logContainer}>
          <View style={styles.logHeader}>
            <View style={styles.logDot} />
            <Text style={styles.logHeaderText}>INITIALIZATION LOG</Text>
          </View>
          <View style={styles.logList}>
            {読み込みの記録.map((行, 番) => (
              <Text
                key={番}
                style={[
                  styles.logText,
                  番 === 読み込みの記録.length - 1 ? styles.logTextActive : styles.logTextInactive,
                ]}
              >
                {行}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 色.地 },
  logoWrapper: Object.assign(
    {
      width: 80,
      height: 80,
      backgroundColor: 色.白,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    getShadowStyle({
      shadowColor: 色.黒,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    })
  ),
  logoImage: { width: 80, height: 80, borderRadius: 20 },
  loaderWrapper: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: 色.文字, marginBottom: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: 色.灰, marginBottom: 48, fontWeight: '500' },
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
  logDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 色.青, marginRight: 8 },
  logHeaderText: { fontSize: 13, color: 色.文字, fontWeight: '700', letterSpacing: 0.5 },
  logList: { gap: 4 },
  logText: { fontSize: 11 },
  logTextActive: { color: 色.青, opacity: 1 },
  logTextInactive: { color: 色.灰_濃い, opacity: 0.7 },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.LoadingScreen = LoadingScreen;
