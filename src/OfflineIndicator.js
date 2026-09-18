'use strict';

const React = require('react');
const View = require('./View').default;
const Text = require('./Text').default;
const StyleSheet = require('./StyleSheet').default;
const Animated = require('./Animated').default;
const { useScoreStore } = require('./useScoreStore');
const Icons = require('@expo/vector-icons');
const { getShadowStyle } = require('./shadowStyle');
const OfflineIndicator = () => {
  const e = useScoreStore((e) => e.isNetworkOnline);
  const [l] = React.useState(new Animated.Value(0));
  return (
    React.useEffect(() => {
      Animated.timing(l, {
        toValue: e ? 0 : 1,
        duration: 300,
        useNativeDriver: typeof window === 'undefined',
      }).start();
    }, [e]),
    e ? null : (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          {
            opacity: l,
            transform: [{ translateY: l.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}
      >
        <View style={styles.badge}>
          <Icons.MaterialCommunityIcons name="cloud-off-outline" size={16} color="#FFFFFF" />
          <Text style={styles.text}>オフラインモード</Text>
        </View>
      </Animated.View>
    )
  );
};
const styles = StyleSheet.create({
  container: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', zIndex: 9999 },
  badge: Object.assign(
    {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF3B30',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    getShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    })
  ),
  text: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
Object.defineProperty(exports, '__esModule', { value: true });
exports.OfflineIndicator = OfflineIndicator;
