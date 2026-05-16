const fs = require('fs');
const c = fs.readFileSync('src/JP_useScoreStore_174.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const idx = dec.indexOf('updateSession');
console.log(dec.slice(idx, idx + 800));
