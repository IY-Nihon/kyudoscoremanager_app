# アプリアイコンおよび共有サムネイル（OGP）設定計画

提供された画像（`kyudo_icon_1771860384077.png`）をアプリ全体のアイコンとして設定し、さらにURL共有時のサムネイルとしても表示させるための実装計画です。

## 目的
1. **ホーム画面追加時のアイコン**: スマホなどで「ホーム画面に追加」した際のアプリアイコンを新しい画像にする。
2. **ブラウザのファビコン**: ブラウザのタブに表示される小さなアイコンを変更する。
3. **共有サムネイル (OGP)**: LINE, Twitter(X), SlackなどでURLを共有した際に表示される大きなサムネイル画像を設定する。

## 提案する変更手順（実行予定の内容）

### 1. 画像ファイルの配置
提供された画像をプロジェクト内の以下の3ヶ所にコピー・上書き配置します。

#### [MODIFY] `assets/icon.png`
- 用途: PWA（ホーム画面追加時）およびiOS/Androidネイティブアプリのメインアイコン。
- Expoの設定（`app.json`）が既にこのファイルを参照しているため、単純に上書きするだけで反映されます。

#### [MODIFY] `assets/favicon.png`
- 用途: ブラウザのタブ用アイコン（ファビコン）。
- これも既存ファイルを上書きすることで適用されます。

#### [NEW] `public/kyudo_icon.png`
- 用途: URL共有時のサムネイル（OGP）用の静的画像。
- Expoでは `public/` フォルダ内のファイルはビルド時にそのまま直下にコピーされるため、URL（`https://kyudoscoremanager.web.app/kyudo_icon.png`）で直接アクセス可能になります。

### 2. デプロイスクリプトの修正（OGPメタタグの挿入）

#### [MODIFY] `package.json`
現在、`npm run deploy:web` のコマンドでビルドされたHTMLを一部書き換える処理（PowerShell）が組まれています。この処理に、SNS共有用の `<meta>` タグを `<head>` 句に自動挿入する処理を追加します。

**変更内容のイメージ:**
```json
"deploy:web": "expo export --platform web && powershell -Command \"(gc dist/index.html) -replace '<script src=', '<script type=\\\"module\\\" src=' -replace '</head>', '<meta property=\\\"og:title\\\" content=\\\"弓道的中管理アプリ\\\"><meta property=\\\"og:image\\\" content=\\\"https://kyudoscoremanager.web.app/kyudo_icon.png\\\"><meta property=\\\"og:description\\\" content=\\\"弓道の的中記録と出欠を管理するアプリです。\\\"></head>' | Out-File -encoding utf8 dist/index.html\" && firebase deploy --only hosting"
```

## ユーザー確認事項
> [!IMPORTANT]
> - この計画で問題ないかご確認ください。
> - OGPタグの `og:title` (タイトル) や `og:description` (説明文) について、指定したいテキストがあれば教えてください。（上記は仮のテキストを入れています）
> - 「絶対に実行しないで」とのご指示でしたので、現状はここでストップしています。この計画通りに実行してよい場合は「実行して」とお知らせください。
