const fs = require('fs');
const code = fs.readFileSync('live_bundle_correct.js', 'utf8');
const unescaped = code.replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
const keyword = 'メールアドレスを忘れた';
const idx = unescaped.indexOf(keyword);
if(idx !== -1) {
  console.log(unescaped.substring(Math.max(0, idx - 3000), Math.min(unescaped.length, idx + 1000)));
}
