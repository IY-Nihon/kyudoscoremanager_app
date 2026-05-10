const fs = require('fs');
const code = fs.readFileSync('live_bundle_correct.js', 'utf8');
const unescaped = code.replace(/\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
const keywords = ['日本大学', 'パスワードを忘れた', 'メールアドレスを忘れた', '団体IDを忘れた', 'LoginScreen'];
keywords.forEach(kw => {
  const idx = unescaped.indexOf(kw);
  if(idx !== -1) {
    console.log(`\n--- Found: ${kw} ---`);
    console.log(unescaped.substring(Math.max(0, idx - 800), Math.min(unescaped.length, idx + 800)));
  }
});
