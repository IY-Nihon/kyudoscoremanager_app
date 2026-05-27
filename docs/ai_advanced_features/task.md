# AI拡張機能 実装タスク一覧

- [x] Google Search Grounding の実装
  - [x] `JP_AIChatBot_1034.js` の `tools` 配列に `{ googleSearch: {} }` を追加
- [x] アプリ自動操作（ナビゲーション）の実装
  - [x] `@react-navigation/native` から `useNavigation` をインポート
  - [x] Function Calling に `navigateToScreen` を定義
  - [x] コールバック処理で `navigation.navigate` を実行
- [x] データ連携（自動入力・編集）の実装
  - [x] Function Calling に `addMember` を定義
  - [x] 承認UI（アクションカード）のステートおよびレンダリングを追加
  - [x] 承認・キャンセル時のコールバック処理とストア反映
- [x] 総合テスト・検証
  - [x] 各機能が想定通り動作するか確認
  - [x] Walkthroughドキュメントの作成
