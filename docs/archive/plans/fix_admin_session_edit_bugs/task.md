# 管理者モード時の記録編集における射数変更および同期巻き戻り、最多射数カスタム絞り込み - タスクリスト

- [x] `docs/fix_admin_session_edit_bugs/task.md` の作成
- [x] `src/JP_EditSessionModal_694.js` にて、総射数変更確認ダイアログ (Modal) のレンダリング抜けを修正
- [x] `src/JP_EditSessionModal_694.js` にて、総射数変更時の合計計算行 (`isTotalCalculator`) 除外処理を追加
- [x] `src/JP_useScoreStore_174.js` の `listenToSessions` にて、デバウンス同期中（保存待ち）セッションが Firestore 受信データで巻き戻る競合を修正
- [x] `src/JP_AnalysisScreen_1000.js` のランキング基準集計部でカスタム射数指定 (`count`) に対応
- [x] `src/JP_AnalysisScreen_1000.js` にカスタム射数入力欄と「絞り込む」ボタンのUIを追加
- [x] `npx expo export --platform web` によるプロダクションビルド検証
- [x] `docs/fix_admin_session_edit_bugs/walkthrough.md` の更新
