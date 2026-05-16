const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// e.routes.map( を探す
const mapIdx = l.indexOf('e.routes.map(');
console.log('e.routes.map( at:', mapIdx);
const mapArgStart = mapIdx + 'e.routes.map('.length - 1; // ( の位置

// ( から対応する ) を探す (文字列リテラルを考慮しない簡易版)
let depth = 0;
let mapEnd = -1;
for (let i = mapArgStart; i < l.length; i++) {
  const ch = l[i];
  if (ch === '(') depth++;
  else if (ch === ')') {
    depth--;
    if (depth === 0) { mapEnd = i; break; }
  }
}
console.log('e.routes.map() ends at:', mapEnd);
console.log('After map:', JSON.stringify(l.slice(mapEnd, mapEnd+60)));

// mapの中身の最後200文字
const mapContent = l.slice(mapArgStart, mapEnd+1);
console.log('\nMap last 200:', mapContent.slice(-200));
