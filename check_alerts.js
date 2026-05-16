const fs = require('fs');
const code = fs.readFileSync('src/JP_LoginScreen_1036.js', 'utf8');

// alert呼び出しを全部抽出
const alerts = [];
const re = /alert\('([^']+)',\s*[`']([^`']+)[`']\)/g;
let m;
while ((m = re.exec(code)) !== null) {
  alerts.push({ title: m[1], message: m[2] });
}
// エラーメッセージ(e.message)パターン
const errRe = /alert\('([^']+)',\s*e\.message([^)]*)\)/g;
while ((m = errRe.exec(code)) !== null) {
  alerts.push({ title: m[1], message: '(Firebase error: e.message)' });
}

alerts.forEach((a, i) => console.log(`[${i+1}] タイトル: ${a.title}\n    内容: ${a.message}\n`));
