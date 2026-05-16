const fs = require('fs');
const src = fs.readFileSync('./src/JP_MainNavigator_216.js', 'utf8');
const l = src.split('\n')[17].replace(/\r/g,'');

// children:[ の対応する ] を全て確認
let idx = 0;
while ((idx = l.indexOf('children:[', idx)) !== -1) {
  const arrStart = idx + 'children:'.length; // [ の位置
  let depth = 0, arrEnd = -1;
  for (let i = arrStart; i < l.length; i++) {
    if (l[i] === '[') depth++;
    else if (l[i] === ']') { depth--; if(depth===0){arrEnd=i;break;} }
  }
  console.log(`children:[ at ${arrStart}, ] at ${arrEnd}`);
  if (arrEnd > 1700) {
    console.log('  Content after ]:', JSON.stringify(l.slice(arrEnd, arrEnd+30)));
  }
  idx += 10;
}
