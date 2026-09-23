# dist/index.html にOGP・PWA関連のタグを注入し、PWA用の静的ファイルをコピーする
# expo export --platform web の直後、firebase deploy の直前に実行する想定
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$indexPath = 'dist/index.html'
# -Encoding UTF8 が要る。Windows PowerShell 5.1 の Get-Content は既定で
# システムのANSI（日本語環境なら Shift_JIS）として読むため、index.html に
# 入っている日本語が化ける。書き戻しは UTF-8 なので、化けたまま保存される。
$html = Get-Content $indexPath -Raw -Encoding UTF8

$headInjection = @'
<meta property="og:title" content="弓道部的中ノート"><meta property="og:image" content="https://kyudoscoremanager.web.app/kyudo_icon.png"><meta property="og:description" content="団体弓道の的中記録と出欠を管理するアプリです。">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#1A3550">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="的中ノート">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167.png">
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152.png">
<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('[sw] 登録できませんでした（起動が速くならないだけです）:',e)})})}</script>
</head>
'@

$html = $html -replace '<script src=', '<script type="module" src='
# viewport-fit=cover を追加（iOSのホームバー・ノッチ・Dynamic Island対応）
if ($html -notmatch 'viewport-fit=cover') {
    $html = $html -replace 'content="width=device-width, initial-scale=1, shrink-to-fit=no"', 'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"'
}
$html = $html -replace '</head>', $headInjection
Set-Content -Path $indexPath -Value $html -Encoding utf8

# PWA用の静的ファイルをdistへ一括コピー（マスカブルアイコンやiPad用アイコンも含めすべてコピー）
# 配布対象: pwa/apple-touch-icon.png, pwa/icon-192.png, pwa/icon-512.png, pwa/icon-maskable-192.png, pwa/icon-maskable-512.png, pwa/manifest.json, pwa/sw.js
Copy-Item 'pwa/*' 'dist/' -Recurse -Force

Write-Output 'index.html へのタグ注入、PWAファイルのコピーが完了しました。'
