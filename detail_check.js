const fs = require('fs');
const acorn = require('acorn');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const clean = src.replace(/\r/g, '');
const lines = clean.split('\n');
const l = lines[17];

// 列1821の前後100文字を詳しく表示
console.log('=== Around col 1821 ===');
console.log(l.slice(1720, 1835));

// 構造分析：(0,T.jsx)の呼び出しを列挙
let idx = 0;
let calls = [];
while ((idx = l.indexOf('(0,T.jsx)', idx)) !== -1) {
  calls.push(idx);
  idx += 9;
}
while ((idx = l.indexOf('(0,T.jsxs)', 0)) !== -1) {
  calls.push(idx);
  idx += 10;
  if (idx > l.length) break;
}
console.log('\nAll JSX calls at:', calls.sort((a,b)=>a-b).filter(p=>p>1700));
