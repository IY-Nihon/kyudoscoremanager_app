# スコアセルの長押し（矢所編集）機能のWeb対応 - タスクリスト

- [x] `JP_ScoreCell_596.js` に `Pressable`（`default_218`）をインポート
- [x] セルのコンポーネントを `TouchableOpacity` から `Pressable` に変更
- [x] `handlePressIn`, `handlePressOut`, `handleContextMenu` の接続と調整 (Web向けネイティブDOMイベントに修正)
- [x] `npx expo export --platform web` によるビルド検証
- [x] `walkthrough.md` の作成

