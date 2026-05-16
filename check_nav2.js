const fs = require('fs');
const code = fs.readFileSync('src/JP_MainNavigator_216.js', 'utf8');
const lines = code.split('\n');
const line18 = lines[17];
// 1771文字目の前後100文字を確認
const pos = 1771;
console.log('=== pos 1671-1825 ===');
console.log(JSON.stringify(line18.substring(1671, 1825)));
