const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// 問題の箇所の詳細コンテキスト
console.log('=== Around pos 1774 ===');
console.log(l.slice(1720, 1831));
console.log('');
console.log('=== style prop area ===');
// styleプロップを探す
let idx = 0;
while ((idx = l.indexOf('style:', idx)) !== -1) {
  console.log('style: at pos', idx, ':', JSON.stringify(l.slice(idx, idx+60)));
  idx += 6;
}
