const fs = require('fs');
const c = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
// Xe, He の用途を確認
const r = /\[Xe,[^]]+\]|He=/g;
let m;
while ((m = r.exec(dec)) !== null) {
  console.log(m[0].slice(0, 80));
}
