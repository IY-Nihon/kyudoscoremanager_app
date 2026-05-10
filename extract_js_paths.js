const fs = require('fs');
const html = fs.readFileSync('live_index_fresh.html', 'utf8');
const regex = /<script[^>]+src="([^"]+)"/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[1]);
}
