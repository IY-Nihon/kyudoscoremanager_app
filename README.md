# 弓道的中管理アプリ (RecordAppExpo)

団体弓道の的中記録・出欠管理アプリ。Web (Firebase Hosting) と iOS (EAS Build) で配信。

- 本番Web: https://kyudoscoremanager.web.app
- Firebase プロジェクト: `kyudoscoremanager`
- ランディングページ: 別リポジトリ `IY-Nihon/kyudo-landing`

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| フレームワーク | Expo SDK 55 / React Native 0.83.6 / React 19.2 |
| Web対応 | react-native-web 0.21 (Metro bundler, `output: single`) |
| 状態管理 | zustand 5 (`src/JP_useScoreStore_174.js`) |
| ナビゲーション | React Navigation 7 (bottom-tabs) |
| バックエンド | Firebase 9.23 — Auth / Firestore / Realtime Database / Storage |
| AI | Google Gemini API (AIチャットボット・OCR立ち順読み取り) |

## 画面構成

`src/JP_MainNavigator_216.js` が定義する6タブ + オーバーレイのAIチャットボット。
「メンバー」「出欠」タブは `activeRole === 'group'`（団体ログイン）のときのみ表示されます。

| タブ | 実装ファイル |
|---|---|
| 記録 | `src/JP_RecordScreen_593.js` |
| 履歴 | `src/JP_HistoryScreen_692.js` |
| 分析 | `src/JP_AnalysisScreen_1000.js` |
| メンバー | `src/JP_MemberScreen_1022.js` |
| 出欠 | `src/AttendanceScreen.js` |
| 設定 | `src/JP_SettingsScreen_1023.js` |
| （常駐） | `src/JP_AIChatBot_1034.js` |

## ⚠️ src/ の構造について（重要）

**`src/` はソースマップから復元されたコードです。** 元の TypeScript ソースは失われており、
現在のファイルは Metro バンドルを展開して復元したものです。そのため:

- ファイル名が `JP_RecordScreen_593.js` のように **モジュールID付き** になっています
- 中身の多くは **minify されたまま**（変数名が `e`, `t`, `n` 等）です
- `module_*.js` / `default_*.js` の大半は **npm ライブラリをバンドルから展開したもの**で、
  自作コードではありません（例: `module_671.js` 186KB はアイコン定義データ）
- `*_225.js` など一部は `module.exports = require('npm-package')` のブリッジになっています

エントリポイント `App.js` から到達可能なのは **772ファイル**、そのうち**自作コードは約30ファイル**です。

### 自作コード（編集対象になるファイル）

```
src/JP_useScoreStore_174.js     状態管理の中核。Firebase同期・履歴・分析ロジック
src/JP_MainNavigator_216.js     タブ定義・ディープリンク設定
src/JP_LoginScreen_1036.js      団体/メンバーログイン・メールアドレス復旧
src/JP_RecordScreen_593.js      記録画面
src/JP_HistoryScreen_692.js     履歴画面
src/JP_AnalysisScreen_1000.js   分析画面
src/JP_MemberScreen_1022.js     メンバー管理
src/JP_SettingsScreen_1023.js   設定・お問い合わせ
src/JP_AIChatBot_1034.js        AIチャットボット
src/JP_OCRRecordModal.js        写真から立ち順を読み取るOCRモーダル
src/AttendanceScreen.js         出欠管理
src/AttendanceCheckModal.js     出欠入力モーダル
src/ArrowLocationView.js        矢所記録ビュー
src/ArrowLocationPopover.js     矢所入力ポップオーバー
src/KyudoBackgroundAnimation.js ログイン画面の背景アニメーション
src/db_178.js                   Firebase 初期化
```

その他のモーダル・コンポーネントも `JP_` 接頭辞付きで `src/` 直下にあります。

## セットアップ

```bash
npm install
cp .env.example .env   # 各値を実際のFirebase設定に置き換える
npm start
```

## デプロイ

```bash
npm run deploy:web
```

これは3段階を順に実行します:

1. `expo export --platform web` → `dist/` を生成
2. `scripts/deploy-web.ps1` → `dist/index.html` に OGP/PWA タグを注入し、`pwa/` 配下の
   manifest・Service Worker・アイコンを `dist/` へコピー
   （`dist/` は毎回再生成されるため、このコピーは毎回必要）
3. `firebase deploy --only hosting`

iOS は `.github/workflows/` の EAS Build ワークフローで生成します。
ビルド前に `patch_node_modules.mjs` が CI から実行されます（`patches/` と併用）。

## ディレクトリ

```
App.js, index.js       エントリポイント
src/                   アプリ本体（上記の通りソースマップ復元コード）
assets/                アプリ内で使うアイコン・画像
pwa/                   PWA用の静的ファイル（デプロイ時にdist/へコピー）
scripts/               デプロイ・iOSビルドパッチ用スクリプト
patches/               patch-package 用の node_modules パッチ
docs/                  機能ごとの要件定義・実装計画（40件弱）
.github/workflows/     EAS Build (iOS) の CI
*.rules, firebase.json Firebase の設定・セキュリティルール
_archive/              過去のデバッグ資材（Git管理外・削除して問題なし）
```

## 既知の課題

- **Firestore ルールが緩い**: `firestore.rules` の `match /groups/{groupId}` が
  `request.auth != null` のみのため、認証済みユーザーは他団体のデータも読み書きできます。
  RTDB の `live_sessions` は認証不要 (`.read`/`.write`: true) です。
- **`src/db_178.js` に未使用の管理者定数**: `ADMIN_EMAIL` / `ADMIN_PASSWORD` は
  どこからも参照されていないデッドコードですが、平文のフォールバック値が
  本番バンドルに含まれています。
- **`src/` が読みにくい**: 復元コードのため minify されたまま。
  可読なソースへ戻す場合は段階的なリファクタが必要です。
