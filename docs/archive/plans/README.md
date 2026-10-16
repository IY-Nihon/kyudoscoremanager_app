# 古い計画書（2026 年 4〜7 月）

このアプリを AI のコーディング支援と一緒に作り始めた頃の、作業ごとの記録です。AI が書いた
`implementation_plan.md`（何をするか）・`task.md`（やることの一覧）・`walkthrough.md`（やった結果）を、
当時のまま置いてあります。**経緯を調べるとき以外は読まなくて構いません。いまの作りは本体の
[README](../../../README.md) の「設計の考え方」と、各ファイルの説明が正です。**

## 読むときの注意

- **ファイル名と道が当時のもの**：`src/JP_SettingsScreen_1023.js`・`src/module_592.js` のような名前は、元のソースを失って
  自分の配信物から取り戻した直後の名前です（本体の README「src/ の成り立ち」）。いまは `src/SettingsScreen.js` のように
  中身に合わせた名前へ直してあります。手元の道（`C:\Users\…\Documents\kyudoscoremanager_app\…`）も当時のものです
- **当時の環境の名前**：`AppBase`（当時の作業用の手元のフォルダー）、`RecordAppExpo`（当時あった別の作業用の倉庫）など。
  いまの倉庫とは別物です
- **版やライブラリが当時のもの**：Firebase 9・NativeWind・`module_*` の転送ファイルなどは、いまは使っていません
- **うまくいかなかった作業も残してある**：たとえば `production_parity_sync`（別の倉庫と同じ形にそろえる）は環境を壊し、
  `restore_app_environment` で元へ戻しました。計画に書いてあっても、そのとおりになっていないことがあります
- 実名・団体の ID・手元のユーザー名は、2026-10-16 に伏せました（部員A・部員B、`…`）

## 目次（主題ごと）

| 主題 | 置き場 |
|---|---|
| 記録の画面・入力 | `fix_score_cell_long_press`（ますの長押しで矢所）、`edit_modal_scroll`、`fix_edit_modal_key_error`、`fix_admin_session_edit_bugs`（管理者モードの射数の変更） |
| 矢所 | `arrow_location_recording`（要件と実装）、`arrow_location_personal_mode`、`restore_arrow_location_settings` |
| 途中交代の集計 | `fix_ai_chatbot_stats_substitution`、`fix_analysis_graph_substitution` |
| メンバー・卒業生 | `member_management_ui_refactoring`、`graduate_integration`（学年 5＝卒業生）、`add_alumni_dropdown` |
| 個人ログイン | `personal_history_filtering`、`csv_export_member_mode_bugfix` |
| 分析・AI の相談役 | `ai_advanced_features`（要件・調べ・実装）、`ai_chat_improvement`（答えの正確さの調べ）、`improve_chatbot_and_personal_analysis` |
| 出欠 | `attendance_management`（予定表の日付の読み取りとカレンダー） |
| 写真の読み取り（最初の形） | `ocr_record_creation`（立ち順の読み取りの要件。いまの○×の読み取りは本体の README を参照） |
| タグ | `tag_filter_bug`、`tag_normalization_fix`（`#` の付け方のそろえ方） |
| CSV の書き出し | `csv_export_ui_improvement`、`csv_export_member_mode_bugfix` |
| 見た目・アイコン・起動画面 | `app_icon_setup`、`loading_screen_improvement`、`login_screen_dark_theme_animation`、`styling_and_security_refactor`（影の書き方の移し替え） |
| 問い合わせ | `add_inquiry_form` |
| 通信量・オフライン | `offline_cache_optimization` |
| 警告の解消 | `react_key_fix`、`resolve_duplicate_key_warnings`、`fix_navigation_warnings`、`stabilizing_components` |
| 環境をそろえる・戻す | `parity_sync`、`parity_restoration_final`、`production_parity_sync`（失敗）、`restore_app_environment`、`restore_commit` |

置き場の中に別の作業が混ざっているものがあります（`ai_chat_improvement` の `implementation_plan.md` だけは PWA のアイコンの品質の改善）。
