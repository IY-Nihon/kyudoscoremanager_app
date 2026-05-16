const fs = require('fs');
const code = fs.readFileSync('src/JP_LoginScreen_1036.js', 'utf8');

// Fragment や jsxs の children 配列で、同じコンポーネント型が並んでいる箇所を探す
// 特に E.Fragment, helpLinks, tabContainer あたり

// helpLinksの中身を抽出
const idx = code.indexOf('helpLinks');
if (idx !== -1) {
  console.log('=== helpLinks 周辺 ===');
  console.log(code.substring(idx, idx + 800));
}

// tabContainerの中身
const idx2 = code.indexOf('tabContainer');
if (idx2 !== -1) {
  console.log('\n=== tabContainer 周辺 ===');
  console.log(code.substring(idx2, idx2 + 600));
}
