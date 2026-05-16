const fs = require('fs');
let src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
let l = lines[17].replace(/\r/g, '');

// 末尾の ; の前に ) を追加
l = l.replace(/;$/, ');');
lines[17] = l;
fs.writeFileSync('./src/JP_MainNavigator_216.js', lines.join('\n'), 'utf8');

// バランス確認
let p=0;
for(const ch of l){ if(ch==='(')p++; else if(ch===')')p--; }
console.log('New paren balance:', p, '(should be 0)');
console.log('New last 60:', JSON.stringify(l.slice(-60)));
