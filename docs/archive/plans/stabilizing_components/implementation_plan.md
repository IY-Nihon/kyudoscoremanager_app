# コンポーネントの安定化と警告解消の実装計画

コンソールログで報告されたコンポーネント名の命名規則違反、非推奨スタイルの警告、およびAPIキーの制限問題を修正します。

## ユーザーによる確認が必要な事項
> [!IMPORTANT]
> **Gemini APIキーの制限解除**
> エラー `API_KEY_HTTP_REFERRER_BLOCKED` を解消するため、Google AI Studio側で以下の設定を行ってください。
> 1. [Google AI Studio](https://aistudio.google.com/app/apikey) にログイン。
> 2. 使用しているAPIキーの設定画面を開く。
> 3. 「API key restrictions」の「HTTP referrers」に以下のURLを追加して保存してください。
>    - `http://localhost:8081/*`
>    - `https://kyudoscoremanager.web.app/*`
>    - `https://archery-record-app.web.app/*`

## 提案される変更

### 1. 画面コンポーネント名の正規化
React Navigationの警告を解消するため、各画面の関数名と `displayName` を設定します。

- **[MODIFY] [JP_RecordScreen_593.js](file:///C:/Users/yutoi/Documents/復元アプリ/AppBase/src/JP_RecordScreen_593.js)**: `k` を `RecordScreen` に変更。
- **[MODIFY] [JP_HistoryScreen_692.js](file:///C:/Users/yutoi/Documents/復元アプリ/AppBase/src/JP_HistoryScreen_692.js)**: `w` を `HistoryScreen` に変更。
- **[MODIFY] [JP_AnalysisScreen_1000.js](file:///C:/Users/yutoi/Documents/復元アプリ/AppBase/src/JP_AnalysisScreen_1000.js)**: `j` を `AnalysisScreen` に変更。
- **[MODIFY] [JP_MemberScreen_1022.js](file:///C:/Users/yutoi/Documents/復元アプリ/AppBase/src/JP_MemberScreen_1022.js)**: `v` を `MemberScreen` に変更。
- **[MODIFY] [JP_SettingsScreen_1023.js](file:///C:/Users/yutoi/Documents/復元アプリ/AppBase/src/JP_SettingsScreen_1023.js)**: `w` を `SettingsScreen` に変更。

### 2. 非推奨のShadowプロパティの修正
React Native Webの警告 `"shadow*" style props are deprecated` を解消します。

- **[MODIFY] [App.js](file:///C:/Users/yutoi/Documents/復元アプリ/AppBase/App.js)**: `responsiveWrapper` のスタイルをWeb環境では `boxShadow` を使用するように修正。

## 検証計画

### 動作確認
1. ブラウザをリロードし、コンソールから `Got a component with the name...` および `shadow* style props are deprecated` の警告が消えていることを確認。
2. 画面遷移（記録 -> 分析など）が正常に動作し、各画面が正しく表示されることを確認。
3. APIキー制限解除後、AIチャットボットが正常に応答することを確認。
