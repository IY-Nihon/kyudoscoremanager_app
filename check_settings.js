const fs = require('fs');
const c = fs.readFileSync('src/JP_SettingsScreen_1023.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const target = '\u56e3\u4f53\u30d1\u30b9\u30ef\u30fc\u30c9';
const idx = dec.indexOf(target);
if (idx === -1) { console.log('NOT FOUND'); process.exit(); }
const start = Math.max(0, idx - 200);
const end = Math.min(dec.length, idx + 800);
console.log(dec.slice(start, end));
