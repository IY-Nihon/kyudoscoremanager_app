const fs = require('fs');
const acorn = require('acorn');

let src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');

// 修正1: navigation:n → navigation:nav（memo()の引数内のみ）
src = src.replace(
  /const I=n\.default\.memo\(\(\{state:e,descriptors:t,navigation:n\}\)/,
  'const I=n.default.memo(({state:e,descriptors:t,navigation:nav})'
);

// 修正2: n.emit → nav.emit, n.navigate → nav.navigate
src = src.replace(/n\.emit\(\{type:'tabPress'/g, "nav.emit({type:'tabPress'");
src = src.replace(/n\.navigate\(h\.name\)/g, 'nav.navigate(h.name)');

// 修正3: return console.log(...),(0,T.jsx) → console.log(...);return(0,T.jsx)
src = src.replace(
  /return console\.log\('\[CustomTabBar\] Active Route:',f,'Tags:',\{current:b\.length,history:c\.length,analysis:u\.length\}\),\(0,T\.jsx\)/,
  "console.log('[CustomTabBar] Active Route:',f,'Tags:',{current:b.length,history:c.length,analysis:u.length});return(0,T.jsx)"
);

// 修正4: style:({pressed:e,hovered:t})=>[...] → style:({pressed:e,hovered:t})=>([...])
src = src.replace(
  /style:\(\{pressed:e,hovered:t\}\)=>\[D\.tabButton,x&&D\.tabButtonActive,!x&&t&&D\.tabButtonHover,e&&\{opacity:\.7\}\]/,
  'style:({pressed:e,hovered:t})=>([D.tabButton,x&&D.tabButtonActive,!x&&t&&D.tabButtonHover,e&&{opacity:.7}])'
);

// 検証
try {
  acorn.parse(src.replace(/\r/g,''), { ecmaVersion: 2020, sourceType: 'module' });
  console.log('✅ Parse OK! 修正成功');
  fs.writeFileSync('./src/JP_MainNavigator_216.js', src, 'utf8');
  console.log('ファイルを保存しました。');
} catch(e) {
  console.log('❌ まだエラーあり:', e.message, 'col:', e.loc ? e.loc.column : e.pos);
  const line = src.replace(/\r/g,'').split('\n')[17];
  const col = e.loc ? e.loc.column : e.pos;
  console.log('Context:', JSON.stringify(line.slice(Math.max(0,col-30), col+30)));
}
