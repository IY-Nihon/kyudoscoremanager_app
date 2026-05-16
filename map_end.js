const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const lines = src.split('\n');
const l = lines[17];

// .map( の後から対応する ) を探す
const mapIdx = l.indexOf('.map((h,p)=>{');
console.log('.map( at:', mapIdx);
const mapArgStart = mapIdx + 5; // .map( の後

// ( から対応する ) を探す
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
console.log('.map() ends at:', mapEnd);
console.log('After map:', JSON.stringify(l.slice(mapEnd, mapEnd+50)));

// .map内部の最後100文字
const mapContent = l.slice(mapArgStart, mapEnd+1);
console.log('Map content last 100:', mapContent.slice(-100));
