const fs = require('fs');
const vm = require('vm');

try {
  const code = fs.readFileSync('c:/Users/yutoi/Documents/kyudoscoremanager_app/src/JP_SaveSessionModal_690.js', 'utf8');
  new vm.Script(code);
  console.log('Syntax OK! JP_SaveSessionModal_690.js is perfectly syntactically valid!');
} catch (e) {
  console.error('Syntax Error found:');
  console.error(e.message);
}
