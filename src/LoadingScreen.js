'use strict';

const { 色 } = require('./iro.js');
const { View, Text, ActivityIndicator, StyleSheet, Image } = require('./rn');
const { getShadowStyle } = require('./shadowStyle');
const LoadingScreen = () => (
  <View style={styles.container}>
    <View style={styles.logoWrapper}>
      <Image source={require('../assets/kyudo_icon.png')} style={styles.logoImage} />
    </View>
    <Text style={styles.title}>弓道部的中ノート</Text>
    <View style={styles.loaderWrapper}>
      <ActivityIndicator size="small" color={色.青} />
    </View>
    <Text style={styles.subtitle}>データを準備しています...</Text>
  </View>
);
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
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.LoadingScreen = LoadingScreen;
