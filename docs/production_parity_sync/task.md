# タスクリスト: 本番環境（RecordAppExpo）完全同期

## フェーズ 1: 構造と依存関係の同期
- [x] `package.json` のバージョン合わせと不要な依存の削除
- [x] `App.js` を `App.tsx` 形式に統合（src/default_143.js を App.tsx へ移動・リネーム）
- [x] ディレクトリ構造の作成 (`src/screens`, `src/components`, `src/stores`, etc.)

## フェーズ 2: コンポーネントの移行と正規化
- [x] 主要スクリーンの移行とリネーム
    - [x] `JP_SettingsScreen_1023.js` → `src/screens/SettingsScreen.tsx`
    - [x] `JP_AnalysisScreen_1000.js` → `src/screens/AnalysisScreen.tsx`
    - [x] `JP_HistoryScreen_692.js` → `src/screens/HistoryScreen.tsx`
    - [x] `JP_RecordScreen_593.js` → `src/screens/RecordScreen.tsx`
    - [x] `JP_LoginScreen_1036.js` → `src/screens/LoginScreen.tsx`
    - [x] `JP_MemberScreen_1022.js` → `src/screens/MemberScreen.tsx`
- [x] ストアとナビゲーターの移行
    - [x] `JP_useScoreStore_174.js` → `src/stores/useScoreStore.ts`
    - [x] `JP_MainNavigator_216.js` → `src/navigation/MainNavigator.tsx`
- [x] 共通コンポーネントの整理
    - [x] `JP_AIChatBot_1027.js` → `src/components/AIChatBot.tsx`
    - [x] その他コンポーネントの配置

## フェーズ 3: クリーンアップと最終検証
- [x] src 内のライブラリブリッジ（module_*.js）の削除
- [x] 復元用中間ファイル（test.js, check_*.js 等）の削除
- [x] `app_backup` ディレクトリの削除
- [x] ビルドテスト (`npx expo export`)
- [x] 本番サイトとの最終目視確認
