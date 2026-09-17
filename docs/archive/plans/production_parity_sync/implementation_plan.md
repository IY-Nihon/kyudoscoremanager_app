# 本番環境（RecordAppExpo）との完全同期計画

本計画は、ローカル開発環境（`AppBase`）を本番リポジトリ（`RecordAppExpo`）と 100% 同一の状態にすることを目的とします。

## ユーザー確認事項

> [!IMPORTANT]
> 現在の `AppBase` はデコンパイル・復元されたプロジェクトであるため、ファイル構造や名称が本番（`RecordAppExpo`）と大きく異なります（例: `JP_SettingsScreen_1023.js` vs `src/screens/SettingsScreen.tsx`）。
> 「完全一致」を達成するためには、ファイル名の変更やディレクトリ構造の再配置が必要になりますが、よろしいでしょうか？

## 調査および提案内容

### 1. 依存関係の同期 (`package.json`)
本番環境とローカル環境でライブラリのバージョンが乖離しています。
- **Firebase**: 本番は `v10.14.0`、ローカルは `v9.23.0`。
- **不要な依存の削除**: ローカルにある `@react-native-firebase/*` や復元用スクリプトの依存関係を排除し、本番と同じクリーンな `package.json` に修正します。

### 2. ディレクトリ構造の再配置
本番の `src/` 配下の構成に合わせて、ローカルのフラットな `src/` ディレクトリを整理します。
- `src/screens/`
- `src/components/`
- `src/stores/`
- `src/navigation/`
- `src/utils/`
- `src/services/`

### 3. ファイル名の正規化
復元時に付与された ID（`_1023` 等）を削除し、本番と同一の名称に変更します。
- `JP_SettingsScreen_1023.js` → `src/screens/SettingsScreen.tsx` (必要に応じて拡張子も調整)
- `JP_useScoreStore_174.js` → `src/stores/useScoreStore.ts`
- 等

### 4. ロジックの最終監査
以下の主要コンポーネントについて、一字一句違わないか内容を突合します。
- **Store**: 分析ランキングのキー名、同期ロジック。
- **Settings**: 文言、ボタン配置、管理者認証フロー。
- **Analysis**: 統計計算ロジック、タブ構成。
- **App Root**: レスポンシブコンテナのスタイル、プロバイダーのネスト順。

### 5. 不要ファイルの削除
復元過程で生成された中間ファイルやバックアップをすべて削除し、プロジェクトをクリーンにします。
- `check_all.js`, `test.js`, `error.log` 等
- `app_backup/` ディレクトリ
- `src/` 内のライブラリブリッジ・モジュール（`module_37.js` 等）

## 検証プラン

### 自動テスト
- `npx expo export` が正常に完了し、デプロイ可能な `dist` が生成されることを確認。

### 目視確認
- ローカルの Web プレビューと本番サイト (`https://kyudoscoremanager.web.app/`) を横に並べ、UI/UX の完全な一致を確認。
