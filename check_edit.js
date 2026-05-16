const fs = require('fs');
const c = fs.readFileSync('src/JP_EditSessionModal_694.js', 'utf8');
const dec = c.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
// archers, attendance, present, absent の構造確認
['archers', 'attendance', 'present', 'absent', 'memberId', 'isSeparator'].forEach(kw => {
  const idx = dec.indexOf(kw);
  if (idx !== -1) {
    console.log(`\n=== ${kw} ===`);
    console.log(dec.slice(Math.max(0, idx-80), idx+200));
  }
});
