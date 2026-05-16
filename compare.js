const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const bak = fs.readFileSync('./src/JP_MainNavigator_216.js.bak', 'utf8');

const origLine = bak.split('\n')[17].replace(/\r/g,'');
const curLine  = src.split('\n')[17].replace(/\r/g,'');

console.log('Original last 50:', JSON.stringify(origLine.slice(-50)));
console.log('Current  last 50:', JSON.stringify(curLine.slice(-50)));

// 元の行の括弧バランス
let p=0,b=0,br=0;
for (const ch of origLine) {
  if(ch==='(')p++; else if(ch===')')p--;
  if(ch==='[')b++; else if(ch===']')b--;
  if(ch==='{')br++; else if(ch==='}')br--;
}
console.log('Original paren balance:', p, 'bracket:', b, 'brace:', br);
