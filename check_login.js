const fs = require('fs');
const code = fs.readFileSync('src/JP_LoginScreen_1036.js', 'utf8');

const checks = [
  ['showPassword state [H,X]',          '[H,X]=(0,t.useState)(!1)'],
  ['secureTextEntry uses !H (×3)',       null],
  ['eye icon button present',            'name:H?"eye-off":"eye"'],
  ['email recovery uses jsxs + array',   'jsxs)(u.default,{style:S.inputWrapper,children:[(0,E.jsx)(f.default'],
  ['login_group uses jsxs + array',      null],
  ['register uses jsxs + array',         null],
];

// Count occurrences
const countOf = (str) => (code.split(str).length - 1);

console.log('--- ログイン画面チェック ---');
console.log((code.includes('[H,X]=(0,t.useState)(!1)') ? 'OK' : 'NG') + ' showPassword state [H,X]');
console.log((countOf('secureTextEntry:!H') === 3 ? 'OK' : 'NG') + ' secureTextEntry:!H が3箇所 (実際: ' + countOf('secureTextEntry:!H') + ')');
console.log((countOf('name:H?"eye-off":"eye"') === 3 ? 'OK' : 'NG') + ' eyeアイコンボタンが3箇所 (実際: ' + countOf('name:H?"eye-off":"eye"') + ')');
console.log((code.includes('secureTextEntry:!0') ? 'NG 旧コードが残存' : 'OK') + ' secureTextEntry:!0 の残存なし');

// Check each password wrapper uses jsxs with array
const jsxsWrappers = countOf('jsxs)(u.default,{style:S.inputWrapper');
console.log((jsxsWrappers === 3 ? 'OK' : 'NG') + ' パスワードwrapperがjsxs形式 (実際: ' + jsxsWrappers + ')');
