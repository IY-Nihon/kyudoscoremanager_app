const fs = require('fs');
const c = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = c.split('\n');
const l = lines[17];
console.log('len:', l.length);
console.log('1770-1785:', JSON.stringify(l.slice(1770, 1785)));
console.log('1774 char:', JSON.stringify(l[1774]));

// すべての return ... を検索
let idx = 0;
while ((idx = l.indexOf('return', idx)) !== -1) {
  console.log('return at:', idx, '| next10:', JSON.stringify(l.slice(idx, idx+20)));
  idx += 6;
}
