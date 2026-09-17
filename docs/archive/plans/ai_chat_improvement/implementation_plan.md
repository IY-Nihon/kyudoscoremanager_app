# 実装計画 (Implementation Plan) - PWAアイコン品質改善

## 1. 概要
携帯電話のホーム画面にアプリを追加した際、アプリアイコンの画質が荒くサイズが小さくなる問題を解決します。

## 2. 原因
- Webアプリとして動作させるための `manifest.json` が配置されていない。
- iOS Safariでのブックマーク追加時に参照される `apple-touch-icon` が `index.html` に設定されていない。

## 3. 解決策
1. ユーザー様ご提供の高解像度画像（WebP）を元に、iOS/Androidそれぞれの推奨サイズ（180px, 192px, 512px）にPNGリサイズして出力する。
2. `manifest.json` を新規作成し、PWAアイコンとしてブラウザに認識させる。
3. `index.html` の `<head>` 内にマニフェストリンクと `apple-touch-icon` メタタグを設定する。

## 4. 変更履歴
- `dist/manifest.json` を新規作成
- `dist/index.html` にマニフェストおよび `apple-touch-icon` メタタグを追加
- `sharp` パッケージを利用して、高解像度の `IMG_20260509_085018_556.webp` から以下のアイコン画像を自動生成し `dist/` に配置：
  - `icon-180.png` (iOSホーム画面用)
  - `icon-192.png` (PWA標準サイズ)
  - `icon-512.png` (PWA高解像度・起動スプラッシュ用)

## 5. デプロイと検証方法
以下のコマンドで Firebase Hosting にデプロイし、携帯端末のブラウザキャッシュをクリアして「ホーム画面に追加」をお試しください。

```powershell
firebase deploy --only hosting
```
