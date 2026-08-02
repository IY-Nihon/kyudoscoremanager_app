# dist/index.html にOGP・PWA関連のタグを注入し、PWA用の静的ファイルをコピーする
# expo export --platform web の直後、firebase deploy の直前に実行する想定
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$indexPath = 'dist/index.html'
$html = Get-Content $indexPath -Raw

$headInjection = @'
<meta property="og:title" content="弓道的中管理アプリ"><meta property="og:image" content="https://kyudoscoremanager.web.app/kyudo_icon.png"><meta property="og:description" content="団体弓道の的中記録と出欠を管理するアプリです。">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#007AFF">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="弓道記録">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}</script>
</head>
'@

$html = $html -replace '<script src=', '<script type="module" src='
$html = $html -replace '</head>', $headInjection
Set-Content -Path $indexPath -Value $html -Encoding utf8

# PWA用の静的ファイルをdistへコピー（distはexpo exportのたびに再生成されるため毎回コピーが必要）
Copy-Item 'pwa/manifest.json' 'dist/manifest.json' -Force
Copy-Item 'pwa/sw.js' 'dist/sw.js' -Force
Copy-Item 'pwa/icon-192.png' 'dist/icon-192.png' -Force
Copy-Item 'pwa/icon-512.png' 'dist/icon-512.png' -Force
Copy-Item 'pwa/apple-touch-icon.png' 'dist/apple-touch-icon.png' -Force

Write-Output 'index.html へのタグ注入、PWAファイルのコピーが完了しました。'
