import { Slot } from 'expo-router';
import '../global.css';
// Slotを使用することで、Expo Routerがデフォルトで提供するNavigationContainerを回避し、
// アプリ内のMainNavigatorと競合しないようにします。
export default function RootLayout() {
  return <Slot />;
}
