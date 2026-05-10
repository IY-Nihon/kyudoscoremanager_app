const fs = require('fs');
let c = fs.readFileSync('dist/index.html', 'utf8');
c = c.replace(/ defer><\/script>/g, ' defer type="module"></script>');
fs.writeFileSync('dist/index.html', c, 'utf8');

// Verify
const verify = fs.readFileSync('dist/index.html', 'utf8');
const idx = verify.indexOf('entry-');
if (idx >= 0) {
  console.log('Script tag:', verify.substring(idx - 20, idx + 100));
} else {
  console.log('entry not found in file');
}
console.log('File length:', verify.length);
