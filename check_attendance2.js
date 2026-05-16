const fs = require('fs');
// AttendanceCheckModal を確認
const c = fs.readFileSync('src/AttendanceCheckModal.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const keywords = ['attendance', 'present', 'absent', 'isPresent', '出席', '欠席', 'archers'];
keywords.forEach(kw => {
  const idx = dec.indexOf(kw);
  if (idx !== -1) {
    console.log(`\n=== ${kw} ===`);
    console.log(dec.slice(Math.max(0, idx-80), idx+200));
  }
});
