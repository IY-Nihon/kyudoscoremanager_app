# コンポーネント名およびキー警告の修正計画

コンソールに表示されている React Navigation のコンポーネント命名に関する警告と、重複するキーに関する警告を修正します。

## ユーザーの確認事項

- コンポーネント名を大文字で始まる名称（例: `RecordScreen`）に統一します。
- リストレンダリング時のキー設定を修正し、`[object Object]` がキーにならないようにします。

## 修正内容

### 1. ナビゲーションコンポーネントの修正

#### [MODIFY] [src/JP_MainNavigator_216.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_MainNavigator_216.js)

- インポートしたスクリーンコンポーネントを、大文字で始まるラッパーコンポーネントとして定義し直します。これにより、React Navigation がコンポーネント名として小文字（`k`, `j` など）を認識して警告を出すのを防ぎます。

### 2. 重複キー警告の修正

#### [MODIFY] [src/JP_HistoryScreen_692.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_HistoryScreen_692.js)
#### [MODIFY] [src/AttendanceScreen.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/AttendanceScreen.js)

- `keyExtractor` や `map` 内の `key` 指定において、ID がオブジェクトとして評価される可能性がある箇所を特定し、文字列への変換やユニークな値の生成を確実に行うように修正します。

## 検証計画

### 自動テスト
- なし（UI の警告修正のため）

### 手動確認
- ブラウザのコンソールを開き、以下の警告が解消されていることを確認します。
  - `Got a component with the name 'k' for the screen '記録'`
  - `Encountered two children with the same key, [object Object].`
