# 管理者モード時の記録編集における射数変更および同期巻き戻り、最多射数カスタム絞り込み - 実装計画

管理者モード時の「記録の編集」におけるバグ修正、および的中分析における「最多射数カスタム指定での絞り込み機能」を追加します。

## ユーザー確認事項
- **最多射数カスタム絞り込み**: 的中分析画面の「ランキング対象の基準」において、従来の最多比（1/2, 1/3, 1/4）に加え、「カスタム: [数字] 射以上で絞り込む」ボタンを追加し、任意の射数でランキングをフィルタリングできるようにします。ボタン文言は「絞り込む」とします。
- **管理者モード時の記録編集バグ**:
  1. 総射数の変更時に、確認を求めるモーダルダイアログの表示コードが抜け落ちているため、保存処理が走らない問題を修正。合計計算行 (`isTotalCalculator`) を変更除外処理に含める。
  2. ストアでの編集時、Firestoreへの送信待ち（800msデバウンス中）に別の `onSnapshot` で古いデータに上書きされて巻き戻る競合を修正。

---

## 提案される変更

### [MODIFY] [JP_EditSessionModal_694.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_EditSessionModal_694.js)
- 射数を減らす際の確認ダイアログModalをJSXに追加。
- 合計計算行 (`isTotalCalculator: true`) を射数伸縮の対象外とする。

### [MODIFY] [JP_useScoreStore_174.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_useScoreStore_174.js)
- `listenToSessions` の `onSnapshot` にて、`_pendingUpdateTimers` に存在するセッションはローカルデータを最優先するマージ処理を記述。

### [MODIFY] [JP_AnalysisScreen_1000.js](file:///c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_AnalysisScreen_1000.js)
- 「ランキング対象の基準 (最多比)」の計算部で、`C[R]?.type === 'count'` に対応する。
- 描画部分にTextInput（射数入力）と「絞り込む」ボタンを配置し、入力された数値で `C[R]` を `{ type: 'count', value: 数値 }` としてストア保存・クラウド同期する。

---

## 検証計画
- `npx expo export --platform web` を実行し、ビルドエラーが発生しないことを確認。
- 各手動テストの実行。
