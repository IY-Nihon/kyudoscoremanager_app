const fs = require('fs');
const c = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
// Xe, He の存在確認
console.log('Xe exists:', dec.includes('Xe'));
console.log('He exists:', dec.includes('He'));
// useState の宣言部分を確認
const idx = dec.indexOf('setAutoPromotionEnabled:X}');
const start = Math.max(0, idx + 25);
const end = Math.min(dec.length, start + 400);
console.log(dec.slice(start, end));
