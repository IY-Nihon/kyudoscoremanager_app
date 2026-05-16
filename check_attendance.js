const fs = require('fs');
const c = fs.readFileSync('src/JP_AttendanceScreen.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
// attendance, present, absent などのキーワード周辺を確認
const keywords = ['attendance', 'present', 'absent', 'isPresent', '出席', '欠席'];
keywords.forEach(kw => {
  const idx = dec.indexOf(kw);
  if (idx !== -1) {
    console.log(`\n=== ${kw} (位置${idx}) ===`);
    console.log(dec.slice(Math.max(0, idx-100), idx+200));
  }
});
