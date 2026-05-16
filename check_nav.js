const fs = require('fs');
const code = fs.readFileSync('src/JP_MainNavigator_216.js', 'utf8');
// 行18の1771文字目付近を表示
const lines = code.split('\n');
const line18 = lines[17] || '';
console.log('Line18 length:', line18.length);
console.log('Around pos 1771:', line18.substring(1720, 1820));
