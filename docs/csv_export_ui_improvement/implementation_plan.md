# CSV書き出しモーダルのUI/UX改善計画

CSV書き出しモーダルにおける「タグ絞り込み」の表示崩れを修正し、AND/ORフィルターをわかりやすい日本語に変更するとともに、キーワードやメンバー名の入力時に候補チップを表示してタップ入力できるようにします。

## ユーザーレビュー要求事項
* 「タグ絞り込み」のAND/ORトグルを、それぞれ「すべて含む」「いずれか含む」に変更します。
* スタイルシート `D` に定義されていなかった `tagChip`, `tagChipActive`, `tagChipText` などのスタイルを追加し、タグチップの表示崩れを修正します。
* 「キーワード (タイトル・メモ)」および「メンバー名」の入力エリアにフォーカスした際、過去のセッションタイトルや登録メンバーから候補リストを作成し、スクロール可能なチップとして表示してタップで入力可能にします。

## オープンクエスチョン
特にありません。

## 提案する変更内容

### CSV書き出しモーダルのUI改善

#### [MODIFY] [JP_SettingsScreen_1023.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SettingsScreen_1023.js)
* **トグルのテキスト変更:**
  - `AND` → `すべて含む`
  - `OR` → `いずれか含む`
* **候補チップ機能の実装:**
  - 状態変数 `showTitleSuggestions`, `showMemberSuggestions` を追加し、それぞれの入力欄フォーカス時に候補を表示。
  - セッションデータ `sessions` のタイトルから一意な候補（最大10件程度）を抽出する `titleSuggestions` を `useMemo` で定義。
  - `members` と `alumni` から一意な名前候補を抽出する `memberSuggestions` を `useMemo` で定義。
  - `TextInput` の `onFocus` や `onBlur` （またはモーダルを閉じた時のクリア処理）と連携して候補チップを表示する UI コンポーネントを追加。
* **スタイルシート `D` への追加:**
  - `tagChip`, `tagChipActive`, `tagChipText`
  - `suggestionsContainer`, `suggestionChip`, `suggestionText`

### 他のタグフィルターへの適用

#### [MODIFY] [JP_HistoryScreen_692.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_HistoryScreen_692.js)
* **トグルのテキスト変更:**
  - タグフィルター内の `AND` / `OR` トグルを、それぞれ `すべて含む` / `いずれか含む` に変更します。

#### [MODIFY] [JP_AnalysisScreen_1000.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_AnalysisScreen_1000.js)
* **トグルのテキスト変更:**
  - 分析画面のタグフィルター内の `AND` / `OR` トグルを、それぞれ `すべて含む` / `いずれか含む` に変更します。

### 複数選択・PCスクロールの対応

#### [MODIFY] [JP_SettingsScreen_1023.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SettingsScreen_1023.js)
* **複数選択ステートの追加:**
  - `selectedKeywords` (配列) と `selectedMembers` (配列) の状態管理を追加します。
  - 候補チップをタップした際、配列に追加・削除（トグル）されるように変更します。
  - 選択されたチップにはアクティブスタイルを適用し、青色背景にします。
* **絞り込みロジックの修正:**
  - 複数選択されたキーワードやメンバー名を考慮して、CSV書き出し用のデータ抽出条件を修正します。
  - 直接入力されたテキスト検索と複数選択チップの双方で絞り込めるようにします。
* **PC用スクロール対応:**
  - 候補表示用の `ScrollView` スタイルに、Web環境でマウススクロールが有効になるよう `{ overflowX: 'auto' }` を適用します。

## 検証計画
* `npx expo export --platform web` コマンドでビルドが正常に通ることを確認します。
* 複数のキーワードチップ・メンバーチップをタップし、複数選択ができること、および選択された状態でCSV出力したデータが正しくフィルタリングされていることを確認します。
* パソコン環境のブラウザで候補チップ欄にカーソルを合わせ、マウスホイールで横スクロールできることを確認します。
