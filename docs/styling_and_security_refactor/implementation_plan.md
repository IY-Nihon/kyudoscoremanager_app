# スタイリングの近代化とセキュリティ強化の計画

## 概要
本プロジェクトにおいて、React Native の `shadow*` プロパティが Web 環境で非推奨となっている警告を解消するため、全てのシャドウ定義を `boxShadow` 形式（`getShadowStyle` ユーティリティ経由）に移行します。また、ハードコードされた機密情報の抽出についても並行して検討します。

## ユーザー確認事項
- [ ] シャドウの移行により、Web 版とアプリ版で見た目が微調整される可能性があります。
- [ ] 機密情報（Firebase API キー等）を `.env` に移行する場合、ビルドプロセスの変更が必要になる可能性があります。

## 実施内容

### 1. シャドウユーティリティの改善
- `src/module_592.js` の `getShadowStyle` を確認し、Web 環境下で `shadow*` プロパティを一切返さないことを確実にします。

### 2. マニュアル定義のシャドウをユーティリティへ移行
以下のファイルに含まれる `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` の直接定義を `getShadowStyle` の呼び出しに置き換えます。

- [MODIFY] [AttendanceScreen.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/AttendanceScreen.js)
- [MODIFY] [JP_LoadingScreen_1037.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_LoadingScreen_1037.js)
- [MODIFY] [JP_SettingsScreen_1023.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SettingsScreen_1023.js) (一部残存している可能性の確認)
- [MODIFY] [JP_RecordScreen_593.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_RecordScreen_593.js)
- その他、`grep` で特定された箇所の修正

### 3. セキュリティ強化 (オプション/要確認)
- `db_178.js` 等に含まれる Firebase 設定の外部化。

## 検証計画
### 自動テスト
- なし（UI 変更のため）

### 手動検証
- Web ブラウザで実行し、コンソールの「shadow* style properties are deprecated」警告が消えていることを確認。
- アプリ版（iOS/Android）でシャドウの表示が崩れていないことを確認。
