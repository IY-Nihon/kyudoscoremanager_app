const fs = require('fs');
const c = fs.readFileSync('C:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_LoginScreen_1036.js', 'utf8');
const decoded = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const target = '\u56e3\u4f53ID\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093';
let idx = 0;
let count = 0;
while ((idx = decoded.indexOf(target, idx)) !== -1) {
  count++;
  const start = Math.max(0, idx - 300);
  const end = Math.min(decoded.length, idx + 50);
  console.log('\n=== \u51fa\u73fe ' + count + ' ===');
  console.log(decoded.slice(start, end));
  idx += target.length;
}
