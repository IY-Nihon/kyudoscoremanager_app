# アプリケーションの現在使用しているコードのみを新フォルダーへコピーする実装計画

本プロジェクトには、デバッグ用のスクリプトやログファイル、テスト用データなど、本番アプリケーションの動作には直接関係のないファイルが多数存在します。
現在使用している必要なコード（ソースコードおよび各種構成ファイル）のみを特定し、指定の新しいフォルダーを作成してコピーします。

## コピー先フォルダの候補
- **`c:\Users\yutoi\Documents\kyudoscoremanager_app_clean`**

## 1. コピー対象ファイル・フォルダ（現在使用しているコード）

### ソースコードとアセット
- [NEW] `src/` (アプリのメインソースコード)
- [NEW] `assets/` (アセット画像やアイコン等)
- [NEW] `public/` (Web用静的アセット - `kyudo_icon.png`等)
- [NEW] `patches/` (ライブラリのバグ修正用パッチファイル - 極めて重要)
- [NEW] `scripts/` (アプリのビルド/iOSビルド用スクリプト - **ビルドに必須**)
- [NEW] `App.js` (React Native/Expoのエントリーポイント)
- [NEW] `index.js` (Web/Native共通のエントリーポイント定義)

### アプリケーション設定・構成ファイル
- [NEW] `package.json`
- [NEW] `package-lock.json`
- [NEW] `app.json` (Expoの設定ファイル。`scripts/withSwift5.js` Config Plugin の参照を含む)
- [NEW] `tsconfig.json`
- [NEW] `babel.config.js`
- [NEW] `metro.config.js`
- [NEW] `tailwind.config.js`
- [NEW] `app.d.ts`
- [NEW] `global.css`
- [NEW] `nativewind-env.d.ts`
- [NEW] `.env`
- [NEW] `eas.json` (Expo Application Services のビルド設定ファイル)
- [NEW] `.gitignore` (Gitの除外設定ファイル)
- [NEW] `.github/` (CI/CD ワークフローおよび自動化スクリプト)
- [NEW] `docs/` (プロジェクトの設計書、仕様書、今回のタスクドキュメント等)

### Firebase 設定・構成ファイル
- [NEW] `firebase.json`
- [NEW] `firestore.rules`
- [NEW] `firestore.indexes.json`
- [NEW] `database.rules.json`
- [NEW] `.firebaserc`

---

## 2. コピー除外対象（不要なデバッグ用・ログファイルなど）

コピー時間を短縮し、新しいフォルダーをクリーンに保つため、以下のファイル群は除外します。

### 一時・デバッグ用スクリプト (ルート直下の.js/.mjs/.ps1)
- `add_close.js`, `analyze.js`, `balance_check.js`, `bracket_check*.js`, `check_*.js`, `crlf_check.js`, `detail_check.js`, `download_latest_log.js`, `extract_*.js`, `find_*.js`, `fix_*.js`, `get_bundle_context.mjs`, `isolate_check.js`, `map_*.js`, `parse_*.js`, `patch_*.js`, `return_check.js`, `run_patch*.js`, `screenshot.mjs`, `show_end.js`, `test_*.js`, `unclosed.js` など

### ログおよび一時ファイル
- `build_error.log`, `build_error_utf8.log`, `build_log.txt`, `build_log_test*.txt`, `latest_error.md`, `latest_run.json`
- `live.map`, `live_bundle*.js`, `live_index*.html`
- `diff.txt`
- `backup-output/`, `scratch/`, `dist/` などの自動生成・一時バックアップフォルダ
- `.expo/`, `.firebase/`, `.genkit/`
- 各種検証用スクリーンショット画像 (`*.png`)
- `users.csv`, `users.json` などのテストデータ

### 依存パッケージ
- `node_modules/` (サイズが非常に大きいためコピーから除外します。必要に応じてコピー先の新フォルダーにて `npm install` を実行します)
- `.git/` (新フォルダーを新規のきれいな状態にするため、Git履歴はコピーしません)

---

## 3. コピー手順

1. コピー先フォルダ（`c:\Users\yutoi\Documents\kyudoscoremanager_app_clean`）を新規作成します。
2. コピー対象のファイル・フォルダを PowerShell の `Copy-Item` またはファイル操作を通じてコピーします。
3. コピー先フォルダに移動し、`npm install` を実行して必要な依存関係をインストールします。
4. コピー先で `npx expo export --platform web` を実行し、正しくビルドできることを検証します。

---

## 4. ユーザー確認事項

* コピー先のフォルダ名は **`kyudoscoremanager_app_clean`** でよろしいでしょうか？別の名称や作成場所の希望があればお知らせください。
* `node_modules/` はコピーから除外し、コピー先で新たにインストールする計画ですが、よろしいでしょうか？
