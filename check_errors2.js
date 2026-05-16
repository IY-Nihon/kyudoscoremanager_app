const fs = require('fs');
const c = fs.readFileSync('C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_LoginScreen_1036.js', 'utf8');

// throw new Error のメッセージを抽出
const throwRe = /throw new Error\('([^']+)'\)/g;
let m;
console.log('=== throw new Error ===');
while ((m = throwRe.exec(c)) !== null) {
  // Unicode エスケープをデコード
  const decoded = m[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  console.log(decoded);
}

// alert の第一引数（タイトル）と第二引数（メッセージ）を抽出
const alertRe = /alert\('([^']+)',\s*'([^']+)'\)/g;
console.log('\n=== alert messages ===');
while ((m = alertRe.exec(c)) !== null) {
  const t = m[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const msg = m[2].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  console.log(`[${t}] ${msg}`);
}
