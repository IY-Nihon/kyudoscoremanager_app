const fs = require('fs');
const c = fs.readFileSync('src/JP_useScoreStore_174.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
// attendance, present, absent, attendanceMap の保存構造確認
['attendanceMap', 'attendance', 'present', 'absent', 'onConfirm', '出席'].forEach(kw => {
  const idx = dec.indexOf(kw);
  if (idx !== -1) {
    console.log(`\n=== ${kw} (pos:${idx}) ===`);
    console.log(dec.slice(Math.max(0, idx-150), idx+300));
  }
});
