const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17].replace(/\r/g,'');

// return文の開始位置を探す
const retIdx = l.indexOf('return(0,T.jsx)(x,');
console.log('return( at:', retIdx);

// return から末尾までを取り出す
const retPart = l.slice(retIdx);
console.log('Return part:', retPart);
console.log('Length:', retPart.length);

// 括弧バランス
let p=0,b=0,br=0;
for (const ch of retPart) {
  if(ch==='(')p++; else if(ch===')')p--;
  if(ch==='[')b++; else if(ch===']')b--;
  if(ch==='{')br++; else if(ch==='}')br--;
}
console.log('Return part - paren:', p, 'bracket:', b, 'brace:', br);
