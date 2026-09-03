/**
 * 書き出した dist/index.html の、expo export が作る既定値を直す。
 * build-stg.mjs と build-prod.mjs の両方から呼ぶ。
 *
 * 1. lang="en" → "ja"
 *    中身は全部日本語なのに英語と宣言していた。Chrome はこれを見て翻訳を
 *    掛ける。翻訳は本文の文字を差し替えるので、React が描き直しても古い
 *    文字が残る（実際、ログイン画面で「個人」を選んでも見出しが「団体
 *    ログイン」のままになった）。差し替えられた節点を React が触ると
 *    落ちることもある。
 *
 * 2. <title> の RecordAppExpo → 画面に出しているアプリ名
 *    内部の名前がブラウザのタブとブックマークに出ていた。
 *
 * 3. ホーム画面に追加したときのアイコンと、入れ物の決まり（manifest）
 *    expo は favicon.ico しか置かない。iOS は apple-touch-icon が無いと、
 *    ホーム画面に追加したときアイコンの代わりに**画面の写し**を使う。
 *    これが「アイコンが出ない・白紙になる」の正体だった。
 *    manifest も無いので、Android でもアプリとして入らなかった。
 *    アイコン自体は scripts/make-icons.mjs が public/ に作る。
 */
import fs from 'node:fs';
import path from 'node:path';

const 道 = (process.env.BUILD_OUT || 'dist') + '/index.html';
const アプリ名 = '弓道部的中ノート';
// ホーム画面の名前は横に広がらない。長いと真ん中で省かれるので短くする
const ホーム画面での名前 = '的中ノート';

if (!fs.existsSync(道)) {
  console.error(`停止：${道} がありません`);
  process.exit(1);
}

let html = fs.readFileSync(道, 'utf8');
const 直した = [];

if (/<html lang="en">/.test(html)) {
  html = html.replace('<html lang="en">', '<html lang="ja">');
  直した.push('lang="en" → "ja"');
} else if (!/<html lang="ja">/.test(html)) {
  console.error('停止：<html lang=...> が見つかりません。expo の書き出しが変わった可能性があります');
  process.exit(1);
}

if (/<title>RecordAppExpo<\/title>/.test(html)) {
  html = html.replace('<title>RecordAppExpo</title>', `<title>${アプリ名}</title>`);
  直した.push(`<title> → ${アプリ名}`);
}

// ホーム画面に追加したときのアイコンと、入れ物の決まり。
// expo が置く <link rel="icon" href="/favicon.ico" /> の後ろに足す
if (!/apple-touch-icon/.test(html)) {
  const 目印 = '<link rel="icon" href="/favicon.ico" />';
  if (!html.includes(目印)) {
    console.error(`停止：${目印} が見つかりません。expo の書き出しが変わった可能性があります`);
    process.exit(1);
  }
  // 中身は public/ に置いてあり、expo export が dist の直下へ配る
  for (const 絵 of ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'site.webmanifest']) {
    if (!fs.existsSync(path.join('public', 絵))) {
      console.error(`停止：public/${絵} がありません。先に node scripts/make-icons.mjs を実行してください`);
      process.exit(1);
    }
  }
  const 足す = [
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
    '<link rel="manifest" href="/site.webmanifest" />',
    '<meta name="theme-color" content="#1A3550" />',
    // iOS 16.3 までは manifest の display を見ない。こちらで枠を外す
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
    `<meta name="apple-mobile-web-app-title" content="${ホーム画面での名前}" />`,
  ].join('\n    ');
  html = html.replace(目印, `${目印}\n    ${足す}`);
  直した.push('ホーム画面のアイコンと manifest を足した');
}

if (直した.length) {
  fs.writeFileSync(道, html);
  直した.forEach((x) => console.log(`  index.html を直しました: ${x}`));
} else {
  console.log('  index.html は直す必要がありませんでした');
}
