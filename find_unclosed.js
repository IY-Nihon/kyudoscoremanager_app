const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const l = src.split('\n')[17].replace(/\r/g,'');

// スタックで unclosed ( を全て追跡
let stack = [];
for (let i = 0; i < l.length; i++) {
  const ch = l[i];
  if (ch === '(') stack.push(i);
  else if (ch === ')') {
    if (stack.length > 0) stack.pop();
    else console.log('EXTRA ) at', i, ':', JSON.stringify(l.slice(Math.max(0,i-10),i+10)));
  }
}
console.log('Unclosed ( count:', stack.length);
stack.forEach(pos => {
  console.log('  Unclosed ( at pos', pos, ':', JSON.stringify(l.slice(pos, pos+50)));
});
