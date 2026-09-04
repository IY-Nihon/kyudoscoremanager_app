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
 * ■ ホーム画面のアイコン・manifest・Service Worker はここでは足さない
 *   それらは scripts/deploy-web.ps1 が注入し、pwa/ の中身を dist へ配る。
 *   ここで二重に足すと、manifest や theme-color のタグが重複する。
 *   web の PWA まわりは deploy-web.ps1 に一本化してある。
 */
import fs from 'node:fs';

const 道 = (process.env.BUILD_OUT || 'dist') + '/index.html';
const アプリ名 = '弓道部的中ノート';

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

if (直した.length) {
  fs.writeFileSync(道, html);
  直した.forEach((x) => console.log(`  index.html を直しました: ${x}`));
} else {
  console.log('  index.html は直す必要がありませんでした');
}
