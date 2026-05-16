const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// 行全体の括弧をトレース
let depth = 0;
let maxDepth = 0;
for (let i = 0; i < l.length; i++) {
  const ch = l[i];
  if ('([{'.includes(ch)) { depth++; if(depth>maxDepth) maxDepth=depth; }
  else if (')]}'.includes(ch)) {
    depth--;
    if (depth < 0) {
      console.log('UNDERFLOW at pos', i, ':', JSON.stringify(l.slice(Math.max(0,i-20), i+10)));
      depth = 0; // reset to continue
    }
  }
}
console.log('Final depth:', depth, '(should be 0)');
console.log('Max depth:', maxDepth);
