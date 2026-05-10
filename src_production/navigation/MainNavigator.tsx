import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScoreStore } from '../stores/useScoreStore';

import { RecordScreen } from '../screens/RecordScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AnalysisScreen } from '../screens/AnalysisScreen';
import { MemberScreen } from '../screens/MemberScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBarWrapper, { top: Math.max(insets.top, 20) }]}>
      <View style={styles.tabBarContainer}>
        {/* Left Side (Empty) */}
        <View style={styles.leftActions} />

        <View style={styles.tabItems}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={index}
                onPress={onPress}
                style={[styles.tabButton, isFocused && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Side (Empty) */}
        <View style={styles.rightActions} />
      </View>
    </View>
  );
};

export const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  
  // Expo Router Web環境では既に親にNavigationContainerが存在するため、二重定義を避ける
  const isNested = Platform.OS === 'web';

  const navigatorContent = (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { paddingTop: Math.max(insets.top, 20) + 54 }
        }}
      >
        <Tab.Screen name="記録" component={RecordScreen} />
        <Tab.Screen name="履歴" component={HistoryScreen} />
        <Tab.Screen name="分析" component={AnalysisScreen} />
        <Tab.Screen name="部員" component={MemberScreen} />
        <Tab.Screen name="設定" component={SettingsScreen} />
      </Tab.Navigator>
  );

  if (isNested) {
    return navigatorContent;
  }

  return (
    <NavigationContainer theme={MyTheme}>
      {navigatorContent}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 54,
  },
  leftActions: {
    width: 60, // Adjust to leave room but keep centered
    justifyContent: 'center',
  },
  tabItems: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 24,
    padding: 3,
    alignSelf: 'center',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
  rightActions: {
    width: 150,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pagination: {
    flexDirection: 'row',
    gap: 20,
    marginRight: 4,
  },
  pageBtn: {
    padding: 4,
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  editBtn: {
    paddingVertical: 4,
  },
  editText: {
    color: '#5856D6',
    fontSize: 17,
    fontWeight: '400',
  },
  trashBtn: {
    padding: 4,
  },
});
