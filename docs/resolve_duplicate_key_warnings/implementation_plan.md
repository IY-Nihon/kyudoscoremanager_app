# 重複キー警告の解消に向けた実装計画

この計画では、React Native アプリケーション内の各画面で発生している、あるいは発生する可能性がある「duplicate key」警告を解消するために、リストレンダリング時の `key` 指定を修正します。

## ユーザーレビューが必要な事項

- 特になし。既存のロジックを変更せず、レンダリング時の `key` プロパティのみを修正します。

## 解決すべき課題

前回のセッションで `HistoryScreen` のタグレンダリングにおける重複キー警告を修正しましたが、静的解析の結果、他の画面でも同様の問題（オブジェクトをキーに渡している、または一意性が不十分なキーを使用している）があることが判明しました。これを系統的に修正します。

## 提案される変更

### 画面別修正内容

---

#### [MODIFY] [JP_AnalysisScreen_1000.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_AnalysisScreen_1000.js)
- メンバーランキングリスト (`Fe.map`, `pe.map`) の `key` を `e.id` 優先、フォールバックとしてインデックス付き名前に修正。
- タグチップ (`ge.map`) の `key` をタグ名そのもの（文字列）に。
- グラフ詳細の行 (`details.map`) の `key` をインデックスから一意な文字列に。
- 単位選択ボタン (`['day','month','year'].map`) の `key` を単位文字列に。

#### [MODIFY] [JP_RecordScreen_593.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_RecordScreen_593.js)
- フッターのアーチャー名表示 (`k.map`) の `key` を `footer-${e.id}` に修正。
- 射数設定の選択肢 (`[4,8,12,16,20].map`) の `key` を数値文字列に。

#### [MODIFY] [JP_SettingsScreen_1023.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SettingsScreen_1023.js)
- タグテンプレート (`q.map`) の `key` をテンプレート文字列に。
- CSVエクスポートのタグ選択 (`Oe.map`) の `key` をタグ名に。

#### [MODIFY] [JP_CustomCalendarModal_695.js](file:///C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_CustomCalendarModal_695.js)
- ホイールピッカーの項目 (`e.map`) の `key` を `item-${index}-${value}` に修正。

## 検証計画

### 自動テスト / 手動検証
- ブラウザのデベロッパーツール（コンソール）を開き、修正対象の各画面（分析、記録、設定、カレンダーモーダル）を操作した際に `Warning: Encountered two children with the same key` という警告が出ないことを確認します。
- 各リストの項目が正しく表示され、タップなどのインタラクションが期待通り動作することを確認します。
