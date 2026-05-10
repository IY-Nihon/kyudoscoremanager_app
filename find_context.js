const fs = require('fs');
const code = fs.readFileSync('live_bundle_correct.js', 'utf8');
const keywords = ['日本大学', 'パスワードを忘れた', 'メールアドレスを忘れた', '団体IDを忘れた'];
keywords.forEach(kw => {
  const idx = code.indexOf(kw);
  if(idx !== -1) {
    console.log(`\n--- Found: ${kw} ---`);
    console.log(code.substring(Math.max(0, idx - 800), Math.min(code.length, idx + 800)));
  }
});
